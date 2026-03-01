import Nav from '@/components/nav'
import Footer from '@/components/footer'
import ActionAlertBanner from '@/components/action-alert-banner'
import { getSiteSettings, getMunicipalitySettings, getBannerAlert, getActiveMunicipalities } from '@/sanity/lib/queries'
import type { MunicipalityListItem } from '@/sanity/lib/queries'
import { getMunicipalitySlug, getMunicipalityPrefix } from '@/lib/tenant'
import { MunicipalityPrefixProvider } from '@/lib/municipality-prefix-context'
import { urlFor } from '@/sanity/lib/image'

export const revalidate = 300

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const municipalitySlug = await getMunicipalitySlug()
  const basePath = await getMunicipalityPrefix()
  const isCounty = municipalitySlug === 'allegheny-county'

  const [settings, municipalitySettings, bannerAlert, municipalities] = await Promise.all([
    isCounty ? getSiteSettings() : null,
    isCounty ? null : getMunicipalitySettings(municipalitySlug),
    getBannerAlert(municipalitySlug),
    isCounty ? getActiveMunicipalities() : Promise.resolve([] as MunicipalityListItem[]),
  ])

  const effectiveSettings = isCounty ? settings : municipalitySettings
  const accentColor = municipalitySettings?.accentColor ?? null
  const logoUrl = municipalitySettings?.logo ? urlFor(municipalitySettings.logo).width(80).height(80).url() : null
  const municipalityName = isCounty ? null : (municipalitySettings?.name ?? null)

  return (
    <MunicipalityPrefixProvider basePath={basePath}>
      {/* Inject per-municipality accent color override as CSS custom property */}
      {accentColor && (
        <style>{`:root { --color-blue: ${accentColor}; --color-blue-mid: ${accentColor}; }`}</style>
      )}
      {/* Parent org breadcrumb — only visible on municipality sites */}
      {!isCounty && (
        <div className="bg-[var(--color-navy)] border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 py-1.5">
            <a
              href={basePath ? '/' : 'https://alleghenydems.com'}
              className="text-xs text-white/60 hover:text-white/90 transition-colors"
            >
              ← Allegheny County Democratic Committee
            </a>
          </div>
        </div>
      )}
      <Nav navItems={effectiveSettings?.navigationItems} logoUrl={logoUrl} municipalityName={municipalityName} municipalities={municipalities} />
      {bannerAlert && <ActionAlertBanner alert={bannerAlert} />}
      <main className="flex-1">{children}</main>
      <Footer settings={effectiveSettings} basePath={basePath} />
    </MunicipalityPrefixProvider>
  )
}
