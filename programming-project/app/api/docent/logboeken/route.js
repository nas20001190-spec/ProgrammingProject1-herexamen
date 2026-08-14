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
    const rolFout = checkRol(auth.payload, ['docent'])
    if (rolFout) return NextResponse.json({ fout: rolFout.fout }, { status: rolFout.status })

    const payload = auth.payload

    const [rijen] = await db.query(`
      SELECT 
        lw.id, lw.week_nummer, lw.datum_van, lw.datum_tot,
        lw.totaal_uren, lw.status,
        u.voornaam as student_voornaam, u.achternaam as student_achternaam
      FROM logboek_week lw
      JOIN stage s ON lw.stage_id = s.id
      JOIN student st ON s.student_id = st.id
      JOIN user u ON st.user_id = u.id
      JOIN docent d ON s.docent_id = d.id
      WHERE d.user_id = ?
      ORDER BY lw.datum_van DESC
    `, [payload.id])

    const genorm = rijen.map(r => ({
      ...r,
      datum_van: toDateStr(r.datum_van),
      datum_tot: toDateStr(r.datum_tot),
    }))

    return NextResponse.json(genorm)
  } catch (error) {
    return NextResponse.json({ fout: error.message }, { status: 500 })
  }
}