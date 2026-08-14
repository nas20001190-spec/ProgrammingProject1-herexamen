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
    const rolFout = checkRol(auth.payload, ['stagementor'])
    if (rolFout) return NextResponse.json({ fout: rolFout.fout }, { status: rolFout.status })

    const payload = auth.payload

    const [rijen] = await db.query(`
      SELECT 
        lw.id, lw.week_nummer, lw.datum_van, lw.datum_tot,
        lw.totaal_uren, lw.status, lw.ingediend_op,
        u.voornaam as student_voornaam, u.achternaam as student_achternaam
      FROM logboek_week lw
      JOIN stage s ON lw.stage_id = s.id
      JOIN stagementor sm ON s.stagementor_id = sm.id
      JOIN student st ON s.student_id = st.id
      JOIN user u ON st.user_id = u.id
      WHERE sm.user_id = ?
      ORDER BY lw.ingediend_op DESC
    `, [payload.id])

    const wekenGenorm = rijen.map(w => ({
      ...w,
      datum_van: toDateStr(w.datum_van),
      datum_tot: toDateStr(w.datum_tot),
      ingediend_op: w.ingediend_op ? new Date(w.ingediend_op).toISOString() : null,
    }))

    if (wekenGenorm.length === 0) {
      return NextResponse.json({ weken: [], dagen: [] })
    }

    const weekIds = wekenGenorm.map(w => w.id)

    const [dagen] = await db.query(`
      SELECT id, logboek_week_id, datum, uren, uitgevoerde_taken, reflectie, leerpunten, status
      FROM logboek_dag
      WHERE logboek_week_id IN (?)
      ORDER BY datum ASC
    `, [weekIds])

    const dagenGenorm = dagen.map(d => ({
      ...d,
      datum: toDateStr(d.datum),
    }))

    // competenties per dag ophalen
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
        if (!competentiesPerDag[row.logboek_dag_id]) {
          competentiesPerDag[row.logboek_dag_id] = []
        }
        competentiesPerDag[row.logboek_dag_id].push({ id: row.competentie_id, naam: row.naam })
      }
    }

    const dagenMetCompetenties = dagenGenorm.map(d => ({
      ...d,
      competenties: competentiesPerDag[d.id] || [],
    }))

    return NextResponse.json({ weken: wekenGenorm, dagen: dagenMetCompetenties })

  } catch (error) {
    console.error('Stagementor logboeken fout:', error)
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
    const { id, status } = body

    await db.query(
      `UPDATE logboek_week SET status=?, goedgekeurd_op=NOW() WHERE id=?`,
      [status, id]
    )

    return NextResponse.json({ bericht: 'Logboek status bijgewerkt!' })
  } catch (error) {
    return NextResponse.json({ fout: error.message }, { status: 500 })
  }
}