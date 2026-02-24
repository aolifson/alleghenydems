'use server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const contactEmail = process.env.CONTACT_EMAIL ?? 'Info@alleghenydems.com'

export async function sendContactEmail(formData: FormData) {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const subject = formData.get('subject') as string || 'Website Contact Form'
  const message = formData.get('message') as string

  if (!name || !email || !message) {
    return { success: false, error: 'Please fill in all required fields.' }
  }

  try {
    await resend.emails.send({
      from: 'Allegheny Dems Website <noreply@alleghenydems.com>',
      to: contactEmail,
      replyTo: email,
      subject: `[Website] ${subject}`,
      text: `From: ${name} <${email}>\n\n${message}`,
    })
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to send message. Please email us directly.' }
  }
}
