import { NextResponse } from 'next/server'
import db from '@/app/lib/db'
import { verifyToken, checkRol } from '@/app/lib/auth'

export async function GET(request) {
  try {
    const auth = verifyToken(request)
    if (auth.fout) return NextResponse.json({ fout: auth.fout }, { status: auth.status })
    const rolFout = checkRol(auth.payload, ['admin', 'commissie'])
    if (rolFout) return NextResponse.json({ fout: rolFout.fout }, { status: rolFout.status })

    const [rijen] = await db.query(`
      SELECT d.id, u.voornaam, u.achternaam
      FROM docent d
      JOIN user u ON d.user_id = u.id
      ORDER BY u.achternaam, u.voornaam
    `)
    return NextResponse.json(rijen)
  } catch (error) {
    return NextResponse.json({ fout: error.message }, { status: 500 })
  }
}