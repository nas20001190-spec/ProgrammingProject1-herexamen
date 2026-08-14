import { NextResponse } from 'next/server'
import db from '@/app/lib/db'
import { stuurMail, genereerCode } from '@/app/lib/mailer'
import { wachtwoordResetTemplate } from '@/app/lib/emailTemplates'

export async function POST(request) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ fout: 'E-mailadres is verplicht' }, { status: 400 })
    }

    const [rijen] = await db.query('SELECT id, voornaam, email FROM user WHERE email = ?', [email])

    if (rijen.length === 0) {
      // Geen bestaand account: geen fout teruggeven (security best practice)
      return NextResponse.json({ bericht: 'Als dit e-mailadres bestaat, is er een mail verstuurd.' })
    }

    const gebruiker = rijen[0]
    const code = genereerCode()
    const verloopt = new Date(Date.now() + 15 * 60 * 1000)

    await db.query(
      'UPDATE user SET reset_code = ?, reset_code_expiry = ? WHERE id = ?',
      [code, verloopt, gebruiker.id]
    )

    await stuurMail({
      naar: gebruiker.email,
      onderwerp: 'Wachtwoord resetten — Competent',
      html: wachtwoordResetTemplate({ naam: gebruiker.voornaam, code })
    })

    return NextResponse.json({ bericht: 'Als dit e-mailadres bestaat, is er een mail verstuurd.' })

  } catch (error) {
    console.error('Forgot password fout:', error)
    return NextResponse.json({ fout: error.message }, { status: 500 })
  }
}