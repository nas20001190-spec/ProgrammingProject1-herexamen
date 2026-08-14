import { NextResponse } from 'next/server'
import db from '@/app/lib/db'
import { verifyToken, checkRol } from '@/app/lib/auth'

export async function GET(request) {
  try {
    const auth = verifyToken(request)
    if (auth.fout) return NextResponse.json({ fout: auth.fout }, { status: auth.status })

    const rolFout = checkRol(auth.payload, ['stagementor'])
    if (rolFout) return NextResponse.json({ fout: rolFout.fout }, { status: rolFout.status })

    const payload = auth.payload

    const [rijen] = await db.query(`
      SELECT 
        e.id,
        e.type,
        e.status,
        e.datum,
        e.week_nummer,
        u.voornaam as student_voornaam,
        u.achternaam as student_achternaam
      FROM evaluatie e
      JOIN stage s ON e.stage_id = s.id
      JOIN stagementor sm ON s.stagementor_id = sm.id
      JOIN student st ON s.student_id = st.id
      JOIN user u ON st.user_id = u.id
      WHERE sm.user_id = ?
      ORDER BY e.datum DESC
    `, [payload.id])

    return NextResponse.json(rijen)

  } catch (error) {
    console.error('Stagementor evaluaties fout:', error)
    return NextResponse.json({ fout: error.message }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const auth = verifyToken(request)
    if (auth.fout) return NextResponse.json({ fout: auth.fout }, { status: auth.status })

    const rolFout = checkRol(auth.payload, ['stagementor'])
    if (rolFout) return NextResponse.json({ fout: rolFout.fout }, { status: rolFout.status })

    const body = await request.json()
    const { evaluatie_id, scores, feedback } = body

    await db.query(
      `UPDATE evaluatie SET status = 'voltooid' WHERE id = ?`,
      [evaluatie_id]
    )

    for (const score of scores) {
      await db.query(
        `UPDATE evaluatie_score 
         SET score_mentor = ?, feedback_mentor = ?
         WHERE evaluatie_id = ? AND competentie_id = ?`,
        [score.score, score.feedback, evaluatie_id, score.competentie_id]
      )
    }

    return NextResponse.json({ bericht: 'Evaluatie scores opgeslagen!' })

  } catch (error) {
    console.error('Evaluatie scores opslaan fout:', error)
    return NextResponse.json({ fout: error.message }, { status: 500 })
  }
}