import Nav from '@/components/nav'
import Footer from '@/components/footer'
import { getSiteSettings } from '@/sanity/lib/queries'

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings()
  return (
    <>
      <Nav />
      <main className="flex-1">{children}</main>
      <Footer settings={settings} />
    </>
  )
}
