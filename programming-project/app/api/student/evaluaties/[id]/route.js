import { NextResponse } from 'next/server'
import db from '@/app/lib/db'
import { verifyToken, checkRol } from '@/app/lib/auth'

function toDateStr(val) {
  if (!val) return null
  const d = new Date(val)
  d.setHours(12, 0, 0, 0)
  return d.toISOString().split('T')[0]
}

export async function GET(request, { params }) {
  try {
    const auth = verifyToken(request)
    if (auth.fout) return NextResponse.json({ fout: auth.fout }, { status: auth.status })
    const rolFout = checkRol(auth.payload, ['student'])
    if (rolFout) return NextResponse.json({ fout: rolFout.fout }, { status: rolFout.status })

    const { id } = await params

    const [evalRijen] = await db.query(`
      SELECT e.id, e.type, e.status, e.datum,
             e.algemene_feedback_docent, e.algemene_zelfreflectie_student
      FROM evaluatie e
      WHERE e.id = ?
    `, [id])

    if (evalRijen.length === 0) return NextResponse.json({ fout: 'Evaluatie niet gevonden' }, { status: 404 })

    const evaluatie = { ...evalRijen[0], datum: toDateStr(evalRijen[0].datum) }

    const [scoreRijen] = await db.query(`
      SELECT es.competentie_id, es.score_mentor, es.score_docent,
             es.feedback_mentor, es.zelfreflectie_student,
             c.naam as competentie_naam, c.omschrijving, c.gewicht
      FROM evaluatie_score es
      JOIN competentie c ON es.competentie_id = c.id
      WHERE es.evaluatie_id = ?
      ORDER BY c.id ASC
    `, [id])

    const competentieIds = scoreRijen.map(s => s.competentie_id)
    let scoreMaxDocent = {}
    let scoreMaxMentor = {}

    if (competentieIds.length > 0) {
      const [maxDocent] = await db.query(`
        SELECT competentie_id, MAX(score_max) as score_max
        FROM rubriek_niveau
        WHERE competentie_id IN (?) AND rol = 'docent'
        GROUP BY competentie_id
      `, [competentieIds])
      for (const r of maxDocent) scoreMaxDocent[r.competentie_id] = r.score_max

      const [maxMentor] = await db.query(`
        SELECT competentie_id, MAX(score_max) as score_max
        FROM rubriek_niveau
        WHERE competentie_id IN (?) AND rol = 'mentor'
        GROUP BY competentie_id
      `, [competentieIds])
      for (const r of maxMentor) scoreMaxMentor[r.competentie_id] = r.score_max
    }

    return NextResponse.json({
      evaluatie,
      scores: scoreRijen.map(s => ({
        ...s,
        score_mentor: s.score_mentor !== null && s.score_mentor !== '' ? parseFloat(s.score_mentor) : null,
        score_docent: s.score_docent !== null && s.score_docent !== '' ? parseFloat(s.score_docent) : null,
        score_max_docent: scoreMaxDocent[s.competentie_id] || 10,
        score_max_mentor: scoreMaxMentor[s.competentie_id] || 4,
      }))
    })
  } catch (error) {
    return NextResponse.json({ fout: error.message }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const auth = verifyToken(request)
    if (auth.fout) return NextResponse.json({ fout: auth.fout }, { status: auth.status })
    const rolFout = checkRol(auth.payload, ['student'])
    if (rolFout) return NextResponse.json({ fout: rolFout.fout }, { status: rolFout.status })

    const { id } = await params
    const body = await request.json()
    const { scores } = body

    for (const score of scores) {
      await db.query(
        `UPDATE evaluatie_score SET zelfreflectie_student=? WHERE evaluatie_id=? AND competentie_id=?`,
        [score.zelfreflectie || null, id, score.competentie_id]
      )
    }

    return NextResponse.json({ bericht: 'Zelfreflectie opgeslagen!' })
  } catch (error) {
    return NextResponse.json({ fout: error.message }, { status: 500 })
  }
}