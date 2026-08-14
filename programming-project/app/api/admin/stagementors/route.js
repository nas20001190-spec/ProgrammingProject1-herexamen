import { NextResponse } from 'next/server'
import db from '@/app/lib/db'
import bcrypt from 'bcryptjs'
import { verifyToken, checkRol } from '@/app/lib/auth'

export async function GET(request) {
  try {
    const auth = verifyToken(request)
    if (auth.fout) return NextResponse.json({ fout: auth.fout }, { status: auth.status })
    const rolFout = checkRol(auth.payload, ['admin'])
    if (rolFout) return NextResponse.json({ fout: rolFout.fout }, { status: rolFout.status })

    const [rijen] = await db.query(`
      SELECT sm.id as stagementor_id, u.id as user_id,
             u.voornaam, u.achternaam, u.email,
             b.naam as bedrijf_naam
      FROM stagementor sm
      JOIN user u ON sm.user_id = u.id
      LEFT JOIN bedrijf b ON sm.bedrijf_id = b.id
      ORDER BY u.achternaam, u.voornaam
    `)

    return NextResponse.json(rijen)
  } catch (error) {
    return NextResponse.json({ fout: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const auth = verifyToken(request)
    if (auth.fout) return NextResponse.json({ fout: auth.fout }, { status: auth.status })
    const rolFout = checkRol(auth.payload, ['admin'])
    if (rolFout) return NextResponse.json({ fout: rolFout.fout }, { status: rolFout.status })

    const body = await request.json()
    const { voornaam, achternaam, email, telefoon, wachtwoord, functie, bedrijf_naam, adres, sector, website } = body

    const [bedrijfResult] = await db.query(
      'INSERT INTO bedrijf (naam, adres, sector, website) VALUES (?, ?, ?, ?)',
      [bedrijf_naam, adres, sector, website]
    )
    const bedrijf_id = bedrijfResult.insertId

    const hash = wachtwoord ? await bcrypt.hash(wachtwoord, 10) : null
    const [userResult] = await db.query(
      `INSERT INTO user (voornaam, achternaam, email, wachtwoord_hash, telefoon, rol)
       VALUES (?, ?, ?, ?, ?, 'stagementor')`,
      [voornaam, achternaam, email, hash, telefoon]
    )
    const user_id = userResult.insertId

    await db.query(
      'INSERT INTO stagementor (user_id, bedrijf_id, functie) VALUES (?, ?, ?)',
      [user_id, bedrijf_id, functie]
    )

    return NextResponse.json({ bericht: 'Stagementor aangemaakt!', id: user_id })
  } catch (error) {
    return NextResponse.json({ fout: error.message }, { status: 500 })
  }
}