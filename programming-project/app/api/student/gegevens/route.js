import { NextResponse } from 'next/server'
import db from '@/app/lib/db'
import { verifyToken, checkRol } from '@/app/lib/auth'

export async function GET(request) {
  try {
    const auth = verifyToken(request)
    if (auth.fout) return NextResponse.json({ fout: auth.fout }, { status: auth.status })

    const rolFout = checkRol(auth.payload, ['student'])
    if (rolFout) return NextResponse.json({ fout: rolFout.fout }, { status: rolFout.status })

    const payload = auth.payload

    const [rijen] = await db.query(
      `SELECT u.id, u.voornaam, u.achternaam, u.email, u.telefoon,
              s.opleiding, s.academiejaar, s.adres
       FROM user u
       JOIN student s ON s.user_id = u.id
       WHERE u.id = ?`,
      [payload.id]
    )

    if (rijen.length === 0) {
      return NextResponse.json({ fout: 'Student niet gevonden' }, { status: 404 })
    }

    return NextResponse.json(rijen[0])

  } catch (error) {
    console.error('Student gegevens ophalen fout:', error)
    return NextResponse.json({ fout: error.message }, { status: 500 })
  }
}