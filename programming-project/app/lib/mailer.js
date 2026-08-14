import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

export async function stuurMail({ naar, onderwerp, html }) {
  try {
    await transporter.sendMail({
      from: `"Competent" <${process.env.GMAIL_USER}>`,
      to: naar,
      subject: onderwerp,
      html,
    })
    return { succes: true }
  } catch (error) {
    console.error('Mail versturen mislukt:', error)
    return { succes: false, fout: error.message }
  }
}

export function genereerCode() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}