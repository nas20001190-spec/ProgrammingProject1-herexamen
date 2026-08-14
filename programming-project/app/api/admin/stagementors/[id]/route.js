import { NextResponse } from 'next/server'
import db from '@/app/lib/db'
import { verifyToken, checkRol } from '@/app/lib/auth'
import bcrypt from 'bcryptjs'

export async function GET(request, { params }) {
  try {
    const auth = verifyToken(request)
    if (auth.fout) return NextResponse.json({ fout: auth.fout }, { status: auth.status })
    const rolFout = checkRol(auth.payload, ['admin'])
    if (rolFout) return NextResponse.json({ fout: rolFout.fout }, { status: rolFout.status })

    const { id } = await params

    const [rijen] = await db.query(`
      SELECT u.id, u.voornaam, u.achternaam, u.email, u.telefoon, u.rol, u.created_at,
             sm.functie, sm.bedrijf_id,
             b.naam AS bedrijf_naam, b.adres, b.sector, b.website
      FROM user u
      LEFT JOIN stagementor sm ON sm.user_id = u.id
      LEFT JOIN bedrijf b ON sm.bedrijf_id = b.id
      WHERE u.id = ?
    `, [id])

    if (rijen.length === 0) {
      return NextResponse.json({ fout: 'Stagementor niet gevonden' }, { status: 404 })
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
    const { voornaam, achternaam, email, telefoon, rol, functie, bedrijf_naam, adres, sector, website, wachtwoord } = body

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

    await db.query(
      'UPDATE stagementor SET functie=? WHERE user_id=?',
      [functie, id]
    )

    const [smRows] = await db.query('SELECT bedrijf_id FROM stagementor WHERE user_id = ?', [id])
    const bedrijf_id = smRows[0]?.bedrijf_id
    if (bedrijf_id) {
      await db.query(
        'UPDATE bedrijf SET naam=?, adres=?, sector=?, website=? WHERE id=?',
        [bedrijf_naam, adres, sector, website, bedrijf_id]
      )
    }

    return NextResponse.json({ bericht: 'Stagementor bijgewerkt!' })
  } catch (error) {
    return NextResponse.json({ fout: error.message }, { status: 500 })
  }
}