import { NextResponse } from 'next/server'
import db from '@/app/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(request) {
  try {
    const body = await request.json()
    const { email, code, nieuwWachtwoord } = body

    if (!email || !code || !nieuwWachtwoord) {
      return NextResponse.json({ fout: 'Vul alle velden in!' }, { status: 400 })
    }

    const [rijen] = await db.query(
      'SELECT id, reset_code, reset_code_expiry FROM user WHERE email = ?',
      [email]
    )

    if (rijen.length === 0) {
      return NextResponse.json({ fout: 'Ongeldige code of e-mailadres' }, { status: 400 })
    }

    const gebruiker = rijen[0]

    if (gebruiker.reset_code !== code) {
      return NextResponse.json({ fout: 'Ongeldige code' }, { status: 400 })
    }

    if (new Date() > new Date(gebruiker.reset_code_expiry)) {
      return NextResponse.json({ fout: 'Code is verlopen, vraag een nieuwe aan' }, { status: 400 })
    }

    const nieuweHash = await bcrypt.hash(nieuwWachtwoord, 10)

    await db.query(
      'UPDATE user SET wachtwoord_hash = ?, reset_code = NULL, reset_code_expiry = NULL WHERE id = ?',
      [nieuweHash, gebruiker.id]
    )

    return NextResponse.json({ bericht: 'Wachtwoord succesvol ingesteld!' })

  } catch (error) {
    console.error('Reset password fout:', error)
    return NextResponse.json({ fout: error.message }, { status: 500 })
  }
}