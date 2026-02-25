#!/usr/bin/env python3
"""
WordPress XML → Sanity migration script
Imports: pages, news posts, tribe_events, committee/elected member profiles.

Usage:
    python3 scripts/wp-import.py /path/to/wordpress-export.xml
"""

import sys
import xml.etree.ElementTree as ET
import json
import html as html_lib
import re
import time
import uuid
import hashlib
import urllib.request
import urllib.error
import urllib.parse
from urllib.parse import urlparse
from html.parser import HTMLParser
from datetime import datetime

# ── Config ────────────────────────────────────────────────────────────────────

WXR_FILE = sys.argv[1] if len(sys.argv) > 1 else (
    '/Users/alanolifson/programming/acdc/'
    'alleghenycountydemocraticcommittee.WordPress.2026-02-24.xml'
)

PROJECT_ID = 'mfzgc4rr'
DATASET    = 'production'

# Read token from .env.local rather than hardcoding
import os, pathlib

def load_env(path):
    env = {}
    try:
        for line in pathlib.Path(path).read_text().splitlines():
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                k, _, v = line.partition('=')
                env[k.strip()] = v.strip()
    except FileNotFoundError:
        pass
    return env

_env = load_env(pathlib.Path(__file__).parent.parent / '.env.local')
TOKEN = _env.get('SANITY_API_TOKEN') or os.environ.get('SANITY_API_TOKEN', '')
if not TOKEN:
    sys.exit('ERROR: SANITY_API_TOKEN not found in .env.local or environment')

SANITY_API = f'https://{PROJECT_ID}.api.sanity.io/v2021-10-21'

NS = {
    'wp':      'http://wordpress.org/export/1.2/',
    'content': 'http://purl.org/rss/1.0/modules/content/',
    'excerpt': 'http://wordpress.org/export/1.2/excerpt/',
    'dc':      'http://purl.org/dc/elements/1.1/',
}

PAGE_SLUG_MAP = {
    'about': 'about',
    'who-we-are': 'who-we-are',
    'ydac': 'ydac',
    'committee-members': 'committee-members',
    'become-a-committee-member': 'become-a-committee-member',
    'find-committee-members-and-positions': 'find-committee-members-and-positions',
    'run-for-office': 'run-for-office',
    # WP uses this slug; app route expects "get-involved"
    'get-involved-in-acdc': 'get-involved',
    'vote': 'vote',
    'contact': 'contact',
}

LINK_LABELS = {
    'http://www.democrats.org/': 'Democratic National Committee',
    'http://dccc.org/': 'Democratic Congressional Campaign Committee',
    'http://www.dscc.org/': 'Democratic Senatorial Campaign Committee',
    'http://www.padems.com/': 'Pennsylvania Democratic Party',
    'http://www.pahdcc.com/': 'PA House Democratic Campaign Committee',
    'http://www.pahouse.com/': 'Pennsylvania House Democrats',
    'http://pasenatedems.com/': 'Pennsylvania Senate Democrats',
    'http://www.pasenate.com/': 'PA Senate Democratic Campaign Committee',
    'https://payd.squarespace.com/': 'Pennsylvania Young Democrats',
    'http://www.yda.org/': 'Young Democrats of America',
    'https://pacollegedems.org/': 'Pennsylvania College Democrats',
    'https://www.collegedemocratsofamerica.com/': 'College Democrats of America',
    'https://linktr.ee/youngdems_agh': 'Young Democrats of Allegheny County',
    'http://www.facebook.com/pages/Pitt-College-Democrats/333099070056650': 'Pitt College Democrats',
    'https://www.facebook.com/pointparkdems': 'Point Park Democrats',
    'https://www.instagram.com/chathamdems?igshid=YmMyMTA2M2Y%3D': 'Chatham Democrats',
    'https://www.instagram.com/cmudems/?hl=en': 'CMU Democrats',
    'https://www.instagram.com/duquesnedems/': 'Duquesne Democrats',
    'https://www.instagram.com/rmu_collegedems/': 'RMU College Democrats',
}

# ── Helpers ───────────────────────────────────────────────────────────────────

def make_key():
    return str(uuid.uuid4()).replace('-', '')[:8]

def slugify(text):
    text = (text or '').lower()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_]+', '-', text)
    text = text.strip('-')
    return text[:96] or 'untitled'

def parse_wp_date(s):
    if not s:
        return None
    try:
        dt = datetime.strptime(s, '%Y-%m-%d %H:%M:%S')
        return dt.strftime('%Y-%m-%dT%H:%M:%SZ')
    except ValueError:
        return None

def strip_html(html):
    """Extract plain text from HTML."""
    if not html:
        return ''
    text = re.sub(r'<!--.*?-->', '', html, flags=re.DOTALL)
    text = re.sub(r'<[^>]+>', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def first_meta(metas, keys):
    """Return first non-empty meta value from a list of possible keys."""
    for key in keys:
        value = (metas.get(key) or '').strip()
        if value:
            return value
    return ''

def to_social_url(value, platform):
    """Normalize social handles/URLs into full URLs."""
    if not value:
        return ''
    value = value.strip()
    if value.startswith('http://') or value.startswith('https://'):
        return value
    handle = value.lstrip('@')
    if platform == 'facebook':
        return f'https://facebook.com/{handle}'
    if platform == 'instagram':
        return f'https://instagram.com/{handle}'
    if platform == 'x':
        return f'https://x.com/{handle}'
    return value

def normalize_url(url):
    url = (url or '').strip()
    if not url:
        return ''
    url = url.replace('&amp;', '&')
    # Normalize to https where possible for cleaner links.
    if url.startswith('http://'):
        url = 'https://' + url[7:]
    return url.rstrip(').,;')

def is_external_resource_url(url):
    if not url:
        return False
    parsed = urlparse(url)
    host = (parsed.netloc or '').lower()
    if not host:
        return False
    if 'alleghenydems.com' in host:
        return False
    if 'wp-content/uploads' in parsed.path:
        return False
    return True

def label_from_url(url):
    if url in LINK_LABELS:
        return LINK_LABELS[url]
    parsed = urlparse(url)
    host = (parsed.netloc or '').lower().replace('www.', '')
    return host or url

def clean_text_fragment(fragment):
    """Normalize inline HTML text to plain text."""
    if not fragment:
        return ''
    fragment = re.sub(r'<br\s*/?>', ' ', fragment, flags=re.I)
    fragment = re.sub(r'<[^>]+>', ' ', fragment)
    fragment = html_lib.unescape(fragment).replace('\xa0', ' ')
    return re.sub(r'\s+', ' ', fragment).strip()

def extract_page_hero(raw_html, fallback_title=''):
    """Extract hero fields from Divi-like page markup."""
    if not raw_html:
        return {}

    hero = {}
    bg = re.search(r'background_image="([^"]+)"', raw_html, flags=re.I)
    if bg:
        hero['image_url'] = normalize_url(bg.group(1))

    h1_match = re.search(r'<h1[^>]*>(.*?)</h1>', raw_html, flags=re.I | re.S)
    headline = clean_text_fragment(h1_match.group(1)) if h1_match else ''
    if not headline:
        headline = fallback_title
    if headline:
        hero['headline'] = headline

    subhead = ''
    if h1_match:
        after_h1 = raw_html[h1_match.end():]
        p_after_h1 = re.search(r'<p[^>]*>(.*?)</p>', after_h1, flags=re.I | re.S)
        if p_after_h1:
            subhead = clean_text_fragment(p_after_h1.group(1))
    if not subhead and (h1_match or bg):
        first_p = re.search(r'<p[^>]*>(.*?)</p>', raw_html, flags=re.I | re.S)
        if first_p:
            subhead = clean_text_fragment(first_p.group(1))

    if subhead and subhead.lower() != headline.lower():
        hero['subhead'] = subhead
    return hero


class PhpSerializedParser:
    """Small parser for PHP serialized data used by Ninja Tables exports."""

    def __init__(self, payload):
        self.payload = payload or ''
        self.index = 0

    def _read(self, size):
        chunk = self.payload[self.index:self.index + size]
        self.index += size
        return chunk

    def _expect(self, expected):
        actual = self._read(len(expected))
        if actual != expected:
            raise ValueError(f'Expected {expected!r}, got {actual!r} at {self.index}')

    def _read_until(self, token):
        pos = self.payload.find(token, self.index)
        if pos == -1:
            raise ValueError(f'Could not find token {token!r} in serialized payload')
        chunk = self.payload[self.index:pos]
        self.index = pos + len(token)
        return chunk

    def parse(self):
        token = self._read(1)
        if token == 'N':
            self._expect(';')
            return None
        if token == 'b':
            self._expect(':')
            return self._read_until(';') == '1'
        if token == 'i':
            self._expect(':')
            return int(self._read_until(';'))
        if token == 'd':
            self._expect(':')
            return float(self._read_until(';'))
        if token == 's':
            self._expect(':')
            length = int(self._read_until(':'))
            self._expect('"')
            value = self._read(length)
            self._expect('";')
            return value
        if token == 'a':
            self._expect(':')
            length = int(self._read_until(':'))
            self._expect('{')
            items = []
            for _ in range(length):
                key = self.parse()
                value = self.parse()
                items.append((key, value))
            self._expect('}')

            int_keys = [key for key, _ in items if isinstance(key, int)]
            if len(int_keys) == len(items) and int_keys == list(range(len(items))):
                return [value for _, value in items]
            return {key: value for key, value in items}

        raise ValueError(f'Unsupported serialized token {token!r} at {self.index}')


def parse_php_serialized(payload):
    parser = PhpSerializedParser(payload)
    return parser.parse()

# ── HTML → Portable Text ──────────────────────────────────────────────────────

class _PTParser(HTMLParser):
    BLOCK_TAGS = {'p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li',
                  'blockquote', 'pre', 'address'}
    HEADING_MAP = {'h1': 'h1', 'h2': 'h2', 'h3': 'h3',
                   'h4': 'h4', 'h5': 'h5', 'h6': 'h6'}

    def __init__(self):
        super().__init__()
        self.blocks       = []
        self._spans       = []
        self._marks       = []
        self._mark_defs   = []
        self._style       = 'normal'
        self._list_item   = None
        self._list_stack  = []   # stack of ('bullet'|'number')
        self._link_key    = None

    # ── internal flush ──
    def _flush(self):
        spans = [s for s in self._spans if s.get('text', '').strip()]
        if spans:
            block = {
                '_type': 'block',
                '_key': make_key(),
                'style': self._style,
                'children': self._spans,
                'markDefs': list(self._mark_defs),
            }
            if self._list_item:
                block['listItem'] = self._list_item
                block['level'] = len(self._list_stack)
            self.blocks.append(block)
        self._spans     = []
        self._mark_defs = []

    def _span(self, text):
        if text:
            self._spans.append({
                '_type': 'span',
                '_key':  make_key(),
                'text':  text,
                'marks': list(self._marks),
            })

    # ── tag handlers ──
    def handle_starttag(self, tag, attrs):
        tag   = tag.lower()
        attrs = dict(attrs)
        if tag in ('p', 'div', 'address', 'blockquote', 'pre'):
            self._flush(); self._style = 'blockquote' if tag == 'blockquote' else 'normal'
        elif tag in self.HEADING_MAP:
            self._flush(); self._style = self.HEADING_MAP[tag]
        elif tag == 'ul':
            self._list_stack.append('bullet')
        elif tag == 'ol':
            self._list_stack.append('number')
        elif tag == 'li':
            self._flush()
            self._list_item = self._list_stack[-1] if self._list_stack else 'bullet'
        elif tag in ('strong', 'b'):
            if 'strong' not in self._marks:
                self._marks.append('strong')
        elif tag in ('em', 'i'):
            if 'em' not in self._marks:
                self._marks.append('em')
        elif tag == 'u':
            if 'underline' not in self._marks:
                self._marks.append('underline')
        elif tag == 'a':
            href = attrs.get('href', '')
            if href and not href.startswith('javascript'):
                key = make_key()
                self._link_key = key
                self._marks.append(key)
                self._mark_defs.append({'_type': 'link', '_key': key, 'href': href})
        elif tag == 'br':
            self._span('\n')

    def handle_endtag(self, tag):
        tag = tag.lower()
        if tag in ('p', 'div', 'address', 'blockquote', 'pre'):
            self._flush(); self._style = 'normal'; self._list_item = None
        elif tag in self.HEADING_MAP:
            self._flush(); self._style = 'normal'
        elif tag in ('ul', 'ol'):
            if self._list_stack:
                self._list_stack.pop()
            if not self._list_stack:
                self._list_item = None
        elif tag == 'li':
            self._flush()
            self._list_item = self._list_stack[-1] if self._list_stack else None
        elif tag in ('strong', 'b'):
            self._marks = [m for m in self._marks if m != 'strong']
        elif tag in ('em', 'i'):
            self._marks = [m for m in self._marks if m != 'em']
        elif tag == 'u':
            self._marks = [m for m in self._marks if m != 'underline']
        elif tag == 'a':
            if self._link_key:
                self._marks = [m for m in self._marks if m != self._link_key]
            self._link_key = None

    def handle_data(self, data):
        self._span(data)

    def result(self):
        self._flush()
        return self.blocks


def html_to_pt(html):
    """Convert HTML string to Sanity Portable Text blocks."""
    if not html or not html.strip():
        return []
    # Strip WordPress/tribe block comments and shortcodes
    html = re.sub(r'<!--\s*/?wp:[^>]*?-->', '', html, flags=re.DOTALL)
    html = re.sub(r'<!--\s*/?tribe:[^>]*?-->', '', html, flags=re.DOTALL)
    html = re.sub(r'\[/?[a-zA-Z_-]+[^\]]*\]', '', html)
    html = html.strip()
    if not html:
        return []
    p = _PTParser()
    try:
        p.feed(html)
    except Exception:
        pass
    blocks = p.result()
    # Fallback: plain text block
    if not blocks:
        text = strip_html(html)
        if text:
            blocks = [{'_type': 'block', '_key': make_key(), 'style': 'normal',
                       'children': [{'_type': 'span', '_key': make_key(),
                                     'text': text, 'marks': []}],
                       'markDefs': []}]
    return blocks

# ── Sanity API ────────────────────────────────────────────────────────────────

def _request(method, path, body=None, content_type='application/json', timeout=30):
    url = f'{SANITY_API}{path}'
    headers = {'Authorization': f'Bearer {TOKEN}', 'Content-Type': content_type}
    if body is not None and isinstance(body, (dict, list)):
        body = json.dumps(body).encode()
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        print(f'  !! HTTP {e.code}: {e.read().decode()[:300]}')
        return None
    except urllib.error.URLError as e:
        print(f'  !! URL error: {e}')
        return None
    except TimeoutError as e:
        print(f'  !! Timeout: {e}')
        return None

def mutate(mutations, label=''):
    if not mutations:
        return
    result = _request('POST', f'/data/mutate/{DATASET}',
                      {'mutations': mutations, 'returnIds': True})
    if result:
        count = len(result.get('results', []))
        print(f'  ✓ {label}: {count} document(s) saved')
    else:
        print(f'  ✗ {label}: mutation failed')

def delete_documents(doc_ids, label, chunk_size=250):
    if not doc_ids:
        return
    total = len(doc_ids)
    for start in range(0, total, chunk_size):
        end = min(start + chunk_size, total)
        chunk = [{'delete': {'id': doc_id}} for doc_id in doc_ids[start:end]]
        mutate(chunk, f'{label} ({start + 1}-{end} of {total})')
        time.sleep(0.2)

def query(groq):
    """Run a GROQ query and return result array/object."""
    encoded = urllib.parse.quote(groq)
    result = _request('GET', f'/data/query/{DATASET}?query={encoded}', body=None,
                      content_type='application/json')
    if result:
        return result.get('result')
    return None

def upload_image(url):
    """Download image from URL, upload to Sanity, return asset _id or None."""
    if not url:
        return None
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=15) as r:
            ct = r.headers.get('Content-Type', 'image/jpeg').split(';')[0].strip()
            data = r.read()
    except Exception as e:
        print(f'    ↳ image download failed ({url[:50]}): {e}')
        return None

    ext = {'image/png': 'png', 'image/gif': 'gif',
           'image/webp': 'webp'}.get(ct, 'jpg')
    result = _request('POST', f'/assets/images/{DATASET}?filename=wp-img.{ext}',
                      body=data, content_type=ct, timeout=30)
    if result and 'document' in result:
        return result['document']['_id']
    return None

# ── Main ──────────────────────────────────────────────────────────────────────

def member_doc(item, district='', fallback_title=''):
    """Build a committeeMember doc from a jv_team_members item."""
    pid      = item.find('wp:post_id', NS)
    title_el = item.find('title')
    if pid is None or title_el is None:
        return None

    metas_d = _metas(item)
    name    = title_el.text or ''
    title   = metas_d.get('jv_team_designation', '') or fallback_title
    facebook_url = to_social_url(first_meta(metas_d, [
        'jv_team_facebook',
        'facebook',
        'facebook_url',
    ]), 'facebook')
    instagram_url = to_social_url(first_meta(metas_d, [
        'jv_team_instagram',
        'instagram',
        'instagram_url',
    ]), 'instagram')
    x_url = to_social_url(first_meta(metas_d, [
        'jv_team_x',
        'jv_team_twitter',
        'twitter',
        'twitter_url',
        'x',
        'x_url',
    ]), 'x')

    doc = {
        '_id':      f'wp-member-{pid.text}',
        '_type':    'committeeMember',
        'name':     name,
        'title':    title,
        'isActive': True,
    }
    if district:
        doc['district'] = district
    if facebook_url:
        doc['facebookUrl'] = facebook_url
    if instagram_url:
        doc['instagramUrl'] = instagram_url
    if x_url:
        doc['xUrl'] = x_url
    return doc, metas_d, name, title


def main():
    print(f'Parsing {WXR_FILE} ...')
    tree = ET.parse(WXR_FILE)
    items = tree.getroot().find('channel').findall('item')
    print(f'  {len(items)} total items')

    # Build attachment map: post_id -> image URL
    attachments = {}
    for item in items:
        pt = item.find('wp:post_type', NS)
        if pt is not None and pt.text == 'attachment':
            pid  = item.find('wp:post_id', NS)
            guid = item.find('guid')
            if pid is not None and guid is not None and guid.text:
                attachments[pid.text] = guid.text
    print(f'  {len(attachments)} media attachments indexed')

    # Build venue map: post_id -> {locationName, locationAddress}
    venues = {}
    for item in items:
        pt = item.find('wp:post_type', NS)
        if pt is not None and pt.text == 'tribe_venue':
            pid = item.find('wp:post_id', NS)
            if pid is None:
                continue
            title = item.find('title')
            metas = _metas(item)
            parts = [metas.get('_VenueAddress',''), metas.get('_VenueCity',''),
                     metas.get('_VenueState',''), metas.get('_VenueZip','')]
            venues[pid.text] = {
                'locationName':    (title.text or '') if title is not None else '',
                'locationAddress': ', '.join(p for p in parts if p),
            }
    print(f'  {len(venues)} venues indexed')

    # Image cache: wp_url -> sanity asset _id
    img_cache = {}

    def get_asset_by_url(url):
        if not url:
            return None
        normalized = normalize_url(url)
        if not normalized:
            return None
        if normalized not in img_cache:
            print(f'  ↑ uploading image …')
            img_cache[normalized] = upload_image(normalized)
            time.sleep(0.2)
        return img_cache[normalized]

    def get_asset(thumbnail_id):
        if not thumbnail_id or thumbnail_id == '0':
            return None
        url = attachments.get(thumbnail_id)
        return get_asset_by_url(url)

    def image_field(thumbnail_id):
        asset_id = get_asset(thumbnail_id)
        if not asset_id:
            return None
        return {'_type': 'image', 'asset': {'_type': 'reference', '_ref': asset_id}}

    def image_field_from_url(url):
        asset_id = get_asset_by_url(url)
        if not asset_id:
            return None
        return {'_type': 'image', 'asset': {'_type': 'reference', '_ref': asset_id}}

    # ── Route pages ────────────────────────────────────────────────────────
    print('\n── Importing route pages ──')
    page_docs = []
    for item in published(items, 'page'):
        slug_el = item.find('wp:post_name', NS)
        wp_slug = (slug_el.text or '').strip() if slug_el is not None else ''
        target_slug = PAGE_SLUG_MAP.get(wp_slug)
        if not target_slug:
            continue

        title_el = item.find('title')
        content_el = item.find('content:encoded', NS)
        title_txt = title_el.text if title_el is not None else target_slug.replace('-', ' ').title()
        content = content_el.text if content_el is not None else ''

        doc = {
            '_id': f'page-{target_slug}',
            '_type': 'page',
            'title': title_txt or target_slug.replace('-', ' ').title(),
            'slug': {'_type': 'slug', 'current': target_slug},
            'body': html_to_pt(content),
        }
        hero = extract_page_hero(content, fallback_title=doc['title'])
        if hero.get('headline'):
            doc['heroHeadline'] = hero['headline']
        if hero.get('subhead'):
            doc['heroSubhead'] = hero['subhead']
        hero_image = image_field_from_url(hero.get('image_url'))
        if hero_image:
            doc['heroImage'] = hero_image
        page_docs.append({'createOrReplace': doc})
        print(f'  + {wp_slug} -> {target_slug}')

    mutate(page_docs, 'pages')

    # ── External links (Democratic Organizations) ──────────────────────────
    print('\n── Importing external links ──')
    links = []
    for item in published(items, 'page'):
        slug_el = item.find('wp:post_name', NS)
        slug = (slug_el.text or '').strip() if slug_el is not None else ''
        if slug != 'democratic-organizations':
            continue
        content_el = item.find('content:encoded', NS)
        html = content_el.text if content_el is not None else ''
        for raw_url in re.findall(r'https?://[^\s"\'\]|>]+', html or ''):
            url = normalize_url(raw_url)
            if is_external_resource_url(url):
                links.append(url)
        break

    # Unique while preserving order.
    seen = set()
    unique_links = []
    for url in links:
        if url in seen:
            continue
        seen.add(url)
        unique_links.append(url)

    link_docs = []
    for idx, url in enumerate(unique_links):
        link_id = hashlib.md5(url.encode()).hexdigest()[:16]
        doc = {
            '_id': f'wp-link-{link_id}',
            '_type': 'externalLink',
            'label': label_from_url(url),
            'url': url,
            'category': 'party',
            'isActive': True,
            'displayOrder': idx,
        }
        link_docs.append({'createOrReplace': doc})
        print(f'  + {doc["label"]}: {url}')

    mutate(link_docs, 'external links')

    # ── News posts ──────────────────────────────────────────────────────────
    print('\n── Importing news posts ──')
    news_docs = []
    for item in published(items, 'post'):
        pid       = item.find('wp:post_id', NS)
        title_el  = item.find('title')
        date_el   = item.find('wp:post_date', NS)
        slug_el   = item.find('wp:post_name', NS)
        content_el= item.find('content:encoded', NS)
        excerpt_el= item.find('excerpt:encoded', NS)
        if pid is None or title_el is None:
            continue

        metas_d   = _metas(item)
        title_txt = title_el.text or ''
        slug      = (slug_el.text or '').strip() or slugify(title_txt)
        content   = content_el.text if content_el is not None else ''
        excerpt   = (strip_html(excerpt_el.text) if excerpt_el is not None else '') \
                    or strip_html(content)[:250]

        doc = {
            '_id':         f'wp-post-{pid.text}',
            '_type':       'news',
            'title':       title_txt,
            'slug':        {'_type': 'slug', 'current': slug},
            'publishedAt': parse_wp_date(date_el.text if date_el is not None else ''),
            'excerpt':     excerpt,
            'body':        html_to_pt(content),
        }
        img = image_field(metas_d.get('_thumbnail_id', '0'))
        if img:
            doc['image'] = img
        news_docs.append({'createOrReplace': doc})
        print(f'  + {title_txt}')

    mutate(news_docs, 'news')

    # ── Events ─────────────────────────────────────────────────────────────
    print('\n── Importing events ──')
    batch = []
    total = 0
    for item in published(items, 'tribe_events'):
        pid      = item.find('wp:post_id', NS)
        title_el = item.find('title')
        if pid is None or title_el is None:
            continue

        metas_d   = _metas(item)
        title_txt = title_el.text or ''
        slug_el   = item.find('wp:post_name', NS)
        slug      = (slug_el.text or '').strip() or slugify(title_txt)
        content_el= item.find('content:encoded', NS)
        content   = content_el.text if content_el is not None else ''
        venue     = venues.get(metas_d.get('_EventVenueID', ''), {})

        doc = {
            '_id':             f'wp-event-{pid.text}',
            '_type':           'event',
            'title':           title_txt,
            'slug':            {'_type': 'slug', 'current': slug},
            'date':            parse_wp_date(metas_d.get('_EventStartDate')),
            'endDate':         parse_wp_date(metas_d.get('_EventEndDate')),
            'locationName':    venue.get('locationName', ''),
            'locationAddress': venue.get('locationAddress', ''),
            'description':     html_to_pt(content),
            'isFeatured':      False,
        }
        # Drop empty optional fields
        for k in ('endDate', 'locationName', 'locationAddress', 'description'):
            if not doc[k]:
                del doc[k]

        batch.append({'createOrReplace': doc})
        total += 1
        if len(batch) >= 100:
            mutate(batch, f'events ({total} so far)')
            batch = []
            time.sleep(0.3)

    if batch:
        mutate(batch, f'events ({total} total)')
    print(f'  {total} events imported')

    # ── Committee members (Who we are) ─────────────────────────────────────
    print('\n── Importing committee members (Who we are) ──')
    who_we_are_docs = []
    for item in published(items, 'jv_team_members'):
        cats = [c.text for c in item.findall('category')
                if c.get('domain') == 'department_category']
        if 'Who we are' not in cats:
            continue

        built = member_doc(item, district='who-we-are')
        if not built:
            continue
        doc, metas_d, name, title = built
        img = image_field(metas_d.get('_thumbnail_id', '0'))
        if img:
            doc['photo'] = img

        who_we_are_docs.append({'createOrReplace': doc})
        print(f'  + {name} ({title})')

    mutate(who_we_are_docs, 'committee members (who we are)')

    # ── Elected officials ───────────────────────────────────────────────────
    print('\n── Importing elected officials ──')
    legacy_official_ids = query('*[_type == "committeeMember" && _id match "wp-official-*"]._id') or []
    if legacy_official_ids:
        cleanup = [{'delete': {'id': doc_id}} for doc_id in legacy_official_ids]
        mutate(cleanup, 'cleanup legacy elected officials')

    elected_docs = []
    for item in published(items, 'jv_team_members'):
        cats = [c.text for c in item.findall('category')
                if c.get('domain') == 'department_category']
        if 'Elected Officials' not in cats:
            continue

        built = member_doc(item, district='elected-official')
        if not built:
            continue
        doc, metas_d, name, title = built
        img = image_field(metas_d.get('_thumbnail_id', '0'))
        if img:
            doc['photo'] = img

        elected_docs.append({'createOrReplace': doc})
        print(f'  + {name} ({title})')

    mutate(elected_docs, 'elected officials')

    # ── Committee directory tables (Ninja Tables) ───────────────────────────
    print('\n── Importing committee directory tables ──')
    existing_directory_ids = query('*[_type == "committeeDirectoryEntry"]._id') or []
    if existing_directory_ids:
        delete_documents(existing_directory_ids, 'cleanup committee directory entries')

    existing_contact_ids = query('*[_type == "committeeContactEntry"]._id') or []
    if existing_contact_ids:
        delete_documents(existing_contact_ids, 'cleanup committee contact entries')

    directory_docs = []
    contact_docs = []

    for item in published(items, 'ninja-table'):
        pid = item.find('wp:post_id', NS)
        slug_el = item.find('wp:post_name', NS)
        title_el = item.find('title')
        if pid is None:
            continue

        table_id = pid.text
        slug = (slug_el.text or '').strip() if slug_el is not None else ''
        title_txt = title_el.text if title_el is not None else ''
        metas_d = _metas(item)
        rows_payload = metas_d.get('_ninja_table_cache_object', '')
        if not rows_payload:
            continue

        try:
            rows = parse_php_serialized(rows_payload)
        except Exception as e:
            print(f'  ! failed to parse ninja table {table_id}: {e}')
            continue

        if not isinstance(rows, list):
            print(f'  ! unexpected rows payload for ninja table {table_id}')
            continue

        if table_id == '13132' or slug == 'all-allegheny-county-democratic-party-committee-positions':
            print(f'  + importing table {table_id}: {title_txt} ({len(rows)} rows)')
            for idx, row in enumerate(rows):
                if not isinstance(row, dict):
                    continue

                source_row_id = row.get('___id___')
                try:
                    source_row_id = int(source_row_id)
                except (TypeError, ValueError):
                    source_row_id = idx + 1

                doc = {
                    '_id': f'committee-directory-{table_id}-{source_row_id}',
                    '_type': 'committeeDirectoryEntry',
                    'committee': (row.get('committee') or '').strip(),
                    'ward': (row.get('ward') or '').strip(),
                    'district': (row.get('district') or '').strip(),
                    'firstName': (row.get('first') or '').strip(),
                    'lastName': (row.get('last') or '').strip(),
                    'committeeOffice': (row.get('committee_office') or '').strip(),
                    'isActive': True,
                    'displayOrder': idx,
                    'sourceTableId': int(table_id),
                    'sourceRowId': source_row_id,
                }
                directory_docs.append({'createOrReplace': doc})

        if table_id == '13538' or slug == 'committee-contact-information-chairs-and-social-media':
            print(f'  + importing table {table_id}: {title_txt} ({len(rows)} rows)')
            for idx, row in enumerate(rows):
                if not isinstance(row, dict):
                    continue

                source_row_id = row.get('___id___')
                try:
                    source_row_id = int(source_row_id)
                except (TypeError, ValueError):
                    source_row_id = idx + 1

                doc = {
                    '_id': f'committee-contact-{table_id}-{source_row_id}',
                    '_type': 'committeeContactEntry',
                    'committee': (row.get('committee') or '').strip(),
                    'chair': (row.get('chair') or '').strip(),
                    'websiteUrl': normalize_url(row.get('website') or ''),
                    'facebookUrl': normalize_url(row.get('facebook') or ''),
                    'instagramUrl': normalize_url(row.get('instagram') or ''),
                    'otherUrl': normalize_url(row.get('bluesky_x_linktree') or ''),
                    'isActive': True,
                    'displayOrder': idx,
                    'sourceTableId': int(table_id),
                    'sourceRowId': source_row_id,
                }
                contact_docs.append({'createOrReplace': doc})

    chunk_size = 250
    for start in range(0, len(directory_docs), chunk_size):
        end = min(start + chunk_size, len(directory_docs))
        mutate(
            directory_docs[start:end],
            f'committee directory entries ({start + 1}-{end} of {len(directory_docs)})'
        )
        time.sleep(0.2)

    for start in range(0, len(contact_docs), chunk_size):
        end = min(start + chunk_size, len(contact_docs))
        mutate(
            contact_docs[start:end],
            f'committee contact entries ({start + 1}-{end} of {len(contact_docs)})'
        )
        time.sleep(0.2)

    # ── Backward-compat alias for who-we-are page id ───────────────────────
    print('\n── Ensuring who-we-are page alias ──')
    who_we_are_alias = []
    for item in published(items, 'page'):
        slug_el = item.find('wp:post_name', NS)
        slug = (slug_el.text or '').strip() if slug_el is not None else ''
        if slug != 'who-we-are':
            continue

        title_el = item.find('title')
        content_el = item.find('content:encoded', NS)
        title_txt = title_el.text if title_el is not None else 'Who We Are'
        content = content_el.text if content_el is not None else ''

        doc = {
            '_id': 'page-who-we-are',
            '_type': 'page',
            'title': title_txt or 'Who We Are',
            'slug': {'_type': 'slug', 'current': 'who-we-are'},
            'body': html_to_pt(content),
        }
        hero = extract_page_hero(content, fallback_title=doc['title'])
        if hero.get('headline'):
            doc['heroHeadline'] = hero['headline']
        if hero.get('subhead'):
            doc['heroSubhead'] = hero['subhead']
        hero_image = image_field_from_url(hero.get('image_url'))
        if hero_image:
            doc['heroImage'] = hero_image
        who_we_are_alias.append({'createOrReplace': doc})
        print('  + who-we-are alias')

    mutate(who_we_are_alias, 'who-we-are page alias')

    print('\n✓ Migration complete!')


# ── Utilities ─────────────────────────────────────────────────────────────────

def _metas(item):
    """Return dict of wp:postmeta key→value for an item."""
    result = {}
    for m in item.findall('wp:postmeta', NS):
        k = m.find('wp:meta_key', NS)
        v = m.find('wp:meta_value', NS)
        if k is not None and k.text:
            result[k.text] = v.text if v is not None else ''
    return result

def published(items, post_type):
    """Yield published items of a given post_type."""
    for item in items:
        pt = item.find('wp:post_type', NS)
        st = item.find('wp:status', NS)
        if (pt is not None and pt.text == post_type and
                st is not None and st.text == 'publish'):
            yield item


if __name__ == '__main__':
    main()
