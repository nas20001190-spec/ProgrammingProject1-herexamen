import { NextResponse } from 'next/server'
import db from '@/app/lib/db'
import bcrypt from 'bcryptjs'
import { verifyToken, checkRol } from '@/app/lib/auth'

export async function GET(request, { params }) {
  try {
    const auth = verifyToken(request)
    if (auth.fout) return NextResponse.json({ fout: auth.fout }, { status: auth.status })
    const rolFout = checkRol(auth.payload, ['admin'])
    if (rolFout) return NextResponse.json({ fout: rolFout.fout }, { status: rolFout.status })

    const { id } = await params

    const [rijen] = await db.query(
      'SELECT id, voornaam, achternaam, email, telefoon, rol, created_at FROM user WHERE id = ?',
      [id]
    )
    if (rijen.length === 0) {
      return NextResponse.json({ fout: 'Gebruiker niet gevonden' }, { status: 404 })
    }
    return NextResponse.json(rijen[0])
  } catch (error) {
    return NextResponse.json({ fout: error.message }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const auth = verifyToken(request)
    if (auth.fout) return NextResponse.json({ fout: auth.fout }, { status: auth.status })
    const rolFout = checkRol(auth.payload, ['admin'])
    if (rolFout) return NextResponse.json({ fout: rolFout.fout }, { status: rolFout.status })

    const { id } = await params
    const body = await request.json()
    const { voornaam, achternaam, email, telefoon, rol, wachtwoord } = body

    if (wachtwoord) {
      const hash = await bcrypt.hash(wachtwoord, 10)
      await db.query(
        'UPDATE user SET voornaam=?, achternaam=?, email=?, telefoon=?, rol=?, wachtwoord_hash=? WHERE id=?',
        [voornaam, achternaam, email, telefoon, rol, hash, id]
      )
    } else {
      await db.query(
        'UPDATE user SET voornaam=?, achternaam=?, email=?, telefoon=?, rol=? WHERE id=?',
        [voornaam, achternaam, email, telefoon, rol, id]
      )
    }

    return NextResponse.json({ bericht: 'Gebruiker bijgewerkt!' })
  } catch (error) {
    return NextResponse.json({ fout: error.message }, { status: 500 })
  }
}