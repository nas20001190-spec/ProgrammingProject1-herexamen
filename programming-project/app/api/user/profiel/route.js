import { NextResponse } from 'next/server'
import db from '@/app/lib/db'
import bcrypt from 'bcryptjs'
import { verifyToken } from '@/app/lib/auth'

export async function GET(request) {
  try {
    const auth = verifyToken(request)
    if (auth.fout) return NextResponse.json({ fout: auth.fout }, { status: auth.status })

    const payload = auth.payload

    const [rijen] = await db.query(
      'SELECT id, voornaam, achternaam, email, telefoon, rol FROM user WHERE id = ?',
      [payload.id]
    )

    if (rijen.length === 0) {
      return NextResponse.json({ fout: 'Gebruiker niet gevonden' }, { status: 404 })
    }

    return NextResponse.json(rijen[0])

  } catch (error) {
    console.error('Profiel ophalen fout:', error)
    return NextResponse.json({ fout: error.message }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const auth = verifyToken(request)
    if (auth.fout) return NextResponse.json({ fout: auth.fout }, { status: auth.status })

    const payload = auth.payload

    const body = await request.json()
    const { huidigWachtwoord, nieuwWachtwoord } = body

    const [rijen] = await db.query(
      'SELECT wachtwoord_hash FROM user WHERE id = ?',
      [payload.id]
    )

    const klopt = await bcrypt.compare(huidigWachtwoord, rijen[0].wachtwoord_hash)
    if (!klopt) {
      return NextResponse.json({ fout: 'Huidig wachtwoord klopt niet' }, { status: 400 })
    }

    const nieuweHash = await bcrypt.hash(nieuwWachtwoord, 10)
    await db.query(
      'UPDATE user SET wachtwoord_hash = ? WHERE id = ?',
      [nieuweHash, payload.id]
    )

    return NextResponse.json({ bericht: 'Wachtwoord gewijzigd!' })

  } catch (error) {
    console.error('Wachtwoord wijzigen fout:', error)
    return NextResponse.json({ fout: error.message }, { status: 500 })
  }
}