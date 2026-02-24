'use client'

// Facebook Page Plugin — no API key required.
// Pass the full Facebook page URL, e.g. https://www.facebook.com/AlleghenyDems

interface FacebookFeedProps {
  pageUrl: string
  width?: number
  height?: number
}

export default function FacebookFeed({ pageUrl, width = 400, height = 500 }: FacebookFeedProps) {
  const src = `https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(pageUrl)}&tabs=timeline&width=${width}&height=${height}&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true&appId`

  return (
    <div className="overflow-hidden rounded-lg shadow-sm bg-white" style={{ maxWidth: width }}>
      <iframe
        src={src}
        width={width}
        height={height}
        style={{ border: 'none', overflow: 'hidden' }}
        scrolling="no"
        frameBorder="0"
        allowFullScreen
        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
        title="Allegheny Dems Facebook Feed"
      />
    </div>
  )
}
