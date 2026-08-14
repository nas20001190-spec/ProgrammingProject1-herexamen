import { NextResponse } from 'next/server'
import db from '@/app/lib/db'
import { verifyToken, checkRol } from '@/app/lib/auth'

function toDateStr(val) {
  if (!val) return null
  const d = new Date(val)
  d.setHours(12, 0, 0, 0)
  return d.toISOString().split('T')[0]
}

export async function GET(request) {
  try {
    const auth = verifyToken(request)
    if (auth.fout) return NextResponse.json({ fout: auth.fout }, { status: auth.status })
    const rolFout = checkRol(auth.payload, ['admin'])
    if (rolFout) return NextResponse.json({ fout: rolFout.fout }, { status: rolFout.status })

    const [rijen] = await db.query(`
      SELECT e.id, e.type, e.status, e.datum,
             u.voornaam as student_voornaam, u.achternaam as student_achternaam
      FROM evaluatie e
      JOIN stage s ON e.stage_id = s.id
      JOIN student st ON s.student_id = st.id
      JOIN user u ON st.user_id = u.id
      ORDER BY u.achternaam ASC, e.datum DESC
    `)

    return NextResponse.json(rijen.map(r => ({
      ...r,
      datum: toDateStr(r.datum),
    })))
  } catch (error) {
    return NextResponse.json({ fout: error.message }, { status: 500 })
  }
}