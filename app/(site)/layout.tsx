import Nav from '@/components/nav'
import Footer from '@/components/footer'
import ActionAlertBanner from '@/components/action-alert-banner'
import { getSiteSettings, getBannerAlert } from '@/sanity/lib/queries'

export const revalidate = 300

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, bannerAlert] = await Promise.all([getSiteSettings(), getBannerAlert()])
  return (
    <>
      <Nav navItems={settings?.navigationItems} />
      {bannerAlert && <ActionAlertBanner alert={bannerAlert} />}
      <main className="flex-1">{children}</main>
      <Footer settings={settings} />
    </>
  )
}
