import Nav from '@/components/nav'
import Footer from '@/components/footer'
import ActionAlertBanner from '@/components/action-alert-banner'
import { getSiteSettings, getMunicipalitySettings, getBannerAlert } from '@/sanity/lib/queries'
import { getMunicipalitySlug } from '@/lib/tenant'
import { urlFor } from '@/sanity/lib/image'

export const revalidate = 300

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const municipalitySlug = await getMunicipalitySlug()
  const isCounty = municipalitySlug === 'allegheny-county'

  const [settings, municipalitySettings, bannerAlert] = await Promise.all([
    isCounty ? getSiteSettings() : null,
    isCounty ? null : getMunicipalitySettings(municipalitySlug),
    getBannerAlert(municipalitySlug),
  ])

  const effectiveSettings = isCounty ? settings : municipalitySettings
  const accentColor = municipalitySettings?.accentColor ?? null
  const logoUrl = municipalitySettings?.logo ? urlFor(municipalitySettings.logo).width(80).height(80).url() : null
  const municipalityName = isCounty ? null : (municipalitySettings?.name ?? null)

  return (
    <>
      {/* Inject per-municipality accent color override as CSS custom property */}
      {accentColor && (
        <style>{`:root { --color-blue: ${accentColor}; --color-blue-mid: ${accentColor}; }`}</style>
      )}
      <Nav navItems={effectiveSettings?.navigationItems} logoUrl={logoUrl} municipalityName={municipalityName} />
      {bannerAlert && <ActionAlertBanner alert={bannerAlert} />}
      <main className="flex-1">{children}</main>
      <Footer settings={effectiveSettings} />
    </>
  )
}
