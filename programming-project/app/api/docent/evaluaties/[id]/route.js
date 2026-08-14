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
    const rolFout = checkRol(auth.payload, ['docent'])
    if (rolFout) return NextResponse.json({ fout: rolFout.fout }, { status: rolFout.status })

    const { id } = await params

    const [evalRijen] = await db.query(`
      SELECT e.id, e.type, e.status, e.datum, e.week_nummer,
             e.algemene_feedback_docent,
             e.presentatie_datum, e.presentatie_notities, e.presentatie_score,
             u.voornaam as student_voornaam, u.achternaam as student_achternaam,
             b.naam as bedrijf_naam
      FROM evaluatie e
      JOIN stage s ON e.stage_id = s.id
      JOIN student st ON s.student_id = st.id
      JOIN user u ON st.user_id = u.id
      JOIN stagementor sm ON s.stagementor_id = sm.id
      JOIN bedrijf b ON sm.bedrijf_id = b.id
      WHERE e.id = ?
    `, [id])

    if (evalRijen.length === 0) return NextResponse.json({ fout: 'Evaluatie niet gevonden' }, { status: 404 })

    const evaluatie = {
      ...evalRijen[0],
      datum: toDateStr(evalRijen[0].datum),
      presentatie_datum: toDateStr(evalRijen[0].presentatie_datum),
    }

    const [scoreRijen] = await db.query(`
      SELECT es.competentie_id, es.score_docent, es.score_mentor,
             c.naam as competentie_naam, c.gewicht, c.omschrijving
      FROM evaluatie_score es
      JOIN competentie c ON es.competentie_id = c.id
      WHERE es.evaluatie_id = ?
      ORDER BY c.id ASC
    `, [id])

    const competentieIds = scoreRijen.map(s => s.competentie_id)
    let rubriekPerCompetentie = {}

    if (competentieIds.length > 0) {
      const [rubriekRijen] = await db.query(`
        SELECT id, competentie_id, score, score_max, beschrijving
        FROM rubriek_niveau
        WHERE competentie_id IN (?) AND rol = 'docent'
        ORDER BY competentie_id ASC, score ASC
      `, [competentieIds])

      for (const r of rubriekRijen) {
        if (!rubriekPerCompetentie[r.competentie_id]) rubriekPerCompetentie[r.competentie_id] = []
        rubriekPerCompetentie[r.competentie_id].push(r)
      }
    }

    const scoresMetRubriek = scoreRijen.map(s => ({
      ...s,
      rubriek: rubriekPerCompetentie[s.competentie_id] || []
    }))

    // Presentatie criteria + scores (alleen bij finaal)
    let presentatieCriteria = []
    if (evaluatie.type === 'finaal') {
      const [criteriaRijen] = await db.query(`
        SELECT id, naam, omschrijving, gewicht
        FROM presentatie_criterium
        ORDER BY id ASC
      `)

      const [niveausRijen] = await db.query(`
        SELECT id, criterium_id, score, score_max, beschrijving
        FROM presentatie_criterium_niveau
        ORDER BY criterium_id ASC, score ASC
      `)

      const [presentatieScores] = await db.query(`
        SELECT criterium_id, score
        FROM evaluatie_presentatie_score
        WHERE evaluatie_id = ?
      `, [id])

      const scorePerCriterium = {}
      for (const s of presentatieScores) {
        scorePerCriterium[s.criterium_id] = s.score
      }

      presentatieCriteria = criteriaRijen.map(c => ({
        ...c,
        niveaus: niveausRijen.filter(n => n.criterium_id === c.id),
        score: scorePerCriterium[c.id] ?? null
      }))
    }

    return NextResponse.json({ evaluatie, scores: scoresMetRubriek, presentatieCriteria })
  } catch (error) {
    return NextResponse.json({ fout: error.message }, { status: 500 })
  }
}