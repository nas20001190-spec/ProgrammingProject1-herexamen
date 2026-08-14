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

    // logboek week info
    const [weekRijen] = await db.query(`
      SELECT lw.id, lw.week_nummer, lw.datum_van, lw.datum_tot,
             lw.totaal_uren, lw.status,
             u.voornaam as student_voornaam, u.achternaam as student_achternaam
      FROM logboek_week lw
      JOIN stage s ON lw.stage_id = s.id
      JOIN student st ON s.student_id = st.id
      JOIN user u ON st.user_id = u.id
      WHERE lw.id = ?
    `, [id])

    if (weekRijen.length === 0) {
      return NextResponse.json({ fout: 'Logboek niet gevonden' }, { status: 404 })
    }

    const logboek = {
      ...weekRijen[0],
      datum_van: toDateStr(weekRijen[0].datum_van),
      datum_tot: toDateStr(weekRijen[0].datum_tot),
    }

    // dagen
    const [dagen] = await db.query(`
      SELECT id, logboek_week_id, datum, uren,
             uitgevoerde_taken, reflectie, leerpunten, status
      FROM logboek_dag
      WHERE logboek_week_id = ?
      ORDER BY datum ASC
    `, [id])

    const dagenGenorm = dagen.map(d => ({ ...d, datum: toDateStr(d.datum) }))

    // competenties per dag
    let competentiesPerDag = {}
    if (dagen.length > 0) {
      const dagIds = dagen.map(d => d.id)
      const [compRijen] = await db.query(`
        SELECT ldc.logboek_dag_id, c.id as competentie_id, c.naam
        FROM logboek_dag_competentie ldc
        JOIN competentie c ON ldc.competentie_id = c.id
        WHERE ldc.logboek_dag_id IN (?)
      `, [dagIds])
      for (const row of compRijen) {
        if (!competentiesPerDag[row.logboek_dag_id]) competentiesPerDag[row.logboek_dag_id] = []
        competentiesPerDag[row.logboek_dag_id].push({ id: row.competentie_id, naam: row.naam })
      }
    }

    const dagenMetCompetenties = dagenGenorm.map(d => ({
      ...d,
      competenties: competentiesPerDag[d.id] || [],
    }))

    return NextResponse.json({ logboek, dagen: dagenMetCompetenties })
  } catch (error) {
    return NextResponse.json({ fout: error.message }, { status: 500 })
  }
}