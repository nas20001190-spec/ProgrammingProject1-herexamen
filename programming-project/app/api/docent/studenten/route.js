import { NextResponse } from 'next/server'
import db from '@/app/lib/db'
import { verifyToken, checkRol } from '@/app/lib/auth'

export async function GET(request) {
  try {
    const auth = verifyToken(request)
    if (auth.fout) return NextResponse.json({ fout: auth.fout }, { status: auth.status })
    const rolFout = checkRol(auth.payload, ['docent'])
    if (rolFout) return NextResponse.json({ fout: rolFout.fout }, { status: rolFout.status })

    const payload = auth.payload

    const [rijen] = await db.query(`
      SELECT 
        s.id as stage_id,
        u.voornaam, u.achternaam, u.email, u.telefoon,
        b.naam as bedrijf_naam,
        mu.voornaam as mentor_voornaam, mu.achternaam as mentor_achternaam,
        s.status
      FROM stage s
      JOIN student st ON s.student_id = st.id
      JOIN user u ON st.user_id = u.id
      JOIN stagementor sm ON s.stagementor_id = sm.id
      JOIN user mu ON sm.user_id = mu.id
      JOIN bedrijf b ON sm.bedrijf_id = b.id
      JOIN docent d ON s.docent_id = d.id
      WHERE d.user_id = ?
    `, [payload.id])

    return NextResponse.json(rijen)
  } catch (error) {
    console.error('Docent studenten fout:', error)
    return NextResponse.json({ fout: error.message }, { status: 500 })
  }
}