import { NextResponse } from 'next/server'
import db from '@/app/lib/db'
import bcrypt from 'bcryptjs'
import { verifyToken, checkRol } from '@/app/lib/auth'

export async function POST(request) {
  try {
    const auth = verifyToken(request)
    if (auth.fout) return NextResponse.json({ fout: auth.fout }, { status: auth.status })
    const rolFout = checkRol(auth.payload, ['admin'])
    if (rolFout) return NextResponse.json({ fout: rolFout.fout }, { status: rolFout.status })

    const body = await request.json()
    const { voornaam, achternaam, email, telefoon, wachtwoord, opleiding, academiejaar, adres } = body

    const hash = wachtwoord ? await bcrypt.hash(wachtwoord, 10) : null

    // user aanmaken
    const [userResult] = await db.query(
      `INSERT INTO user (voornaam, achternaam, email, wachtwoord_hash, telefoon, rol)
       VALUES (?, ?, ?, ?, ?, 'student')`,
      [voornaam, achternaam, email, hash, telefoon]
    )
    const user_id = userResult.insertId

    // bijbehorende student-rij aanmaken
    await db.query(
      `INSERT INTO student (user_id, opleiding, academiejaar, adres)
       VALUES (?, ?, ?, ?)`,
      [user_id, opleiding, academiejaar, adres]
    )

    return NextResponse.json({ bericht: 'Student aangemaakt!', id: user_id })
  } catch (error) {
    return NextResponse.json({ fout: error.message }, { status: 500 })
  }
}