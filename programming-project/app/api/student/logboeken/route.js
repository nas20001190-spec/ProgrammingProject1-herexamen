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
    const rolFout = checkRol(auth.payload, ['student'])
    if (rolFout) return NextResponse.json({ fout: rolFout.fout }, { status: rolFout.status })

    const payload = auth.payload

    const [stageRijen] = await db.query(`
      SELECT s.id, s.startdatum, s.einddatum, s.aantal_weken,
             b.naam as bedrijf_naam
      FROM stage s
      JOIN student st ON s.student_id = st.id
      JOIN stagementor sm ON s.stagementor_id = sm.id
      JOIN bedrijf b ON sm.bedrijf_id = b.id
      WHERE st.user_id = ? AND s.status = 'actief'
      LIMIT 1
    `, [payload.id])

    if (stageRijen.length === 0) return NextResponse.json({ weken: [], dagen: [], stage: null })

    const stageRaw = stageRijen[0]
    const stage = {
      ...stageRaw,
      startdatum: toDateStr(stageRaw.startdatum),
      einddatum: toDateStr(stageRaw.einddatum),
    }

    const [weken] = await db.query(`
      SELECT lw.id, lw.week_nummer, lw.datum_van, lw.datum_tot,
             lw.totaal_uren, lw.status, lw.ingediend_op
      FROM logboek_week lw
      WHERE lw.stage_id = ?
      ORDER BY lw.week_nummer ASC
    `, [stage.id])

    const [dagen] = await db.query(`
      SELECT ld.id, ld.logboek_week_id, ld.datum, ld.uren, ld.status
      FROM logboek_dag ld
      JOIN logboek_week lw ON ld.logboek_week_id = lw.id
      WHERE lw.stage_id = ?
      ORDER BY ld.datum ASC
    `, [stage.id])

    const wekenGenorm = weken.map(w => ({
      ...w,
      datum_van: toDateStr(w.datum_van),
      datum_tot: toDateStr(w.datum_tot),
      ingediend_op: w.ingediend_op ? new Date(w.ingediend_op).toISOString() : null,
    }))

    const dagenGenorm = dagen.map(d => ({
      ...d,
      datum: toDateStr(d.datum),
    }))

    return NextResponse.json({ weken: wekenGenorm, dagen: dagenGenorm, stage })
  } catch (error) {
    return NextResponse.json({ fout: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const auth = verifyToken(request)
    if (auth.fout) return NextResponse.json({ fout: auth.fout }, { status: auth.status })
    const rolFout = checkRol(auth.payload, ['student'])
    if (rolFout) return NextResponse.json({ fout: rolFout.fout }, { status: rolFout.status })

    const body = await request.json()
    const { stage_id, week_nummer, datum_van, datum_tot, dagen } = body

    const [bestaandeWeek] = await db.query(
      'SELECT id FROM logboek_week WHERE stage_id = ? AND week_nummer = ?',
      [stage_id, week_nummer]
    )

    let logboek_week_id

    if (bestaandeWeek.length > 0) {
      logboek_week_id = bestaandeWeek[0].id
    } else {
      const [weekResult] = await db.query(
        `INSERT INTO logboek_week (stage_id, week_nummer, datum_van, datum_tot, status)
         VALUES (?, ?, ?, ?, 'onvolledig')`,
        [stage_id, week_nummer, datum_van, datum_tot]
      )
      logboek_week_id = weekResult.insertId
    }

    for (const dag of dagen) {
      const [bestaandeDag] = await db.query(
        'SELECT id FROM logboek_dag WHERE logboek_week_id = ? AND datum = ?',
        [logboek_week_id, dag.datum]
      )

      let dag_id

      if (bestaandeDag.length > 0) {
        dag_id = bestaandeDag[0].id
        await db.query(
          `UPDATE logboek_dag SET uren=?, uitgevoerde_taken=?, reflectie=?, leerpunten=? WHERE id=?`,
          [dag.uren, dag.taken, dag.reflectie, dag.leerpunten, dag_id]
        )
      } else {
        const [dagResult] = await db.query(
          `INSERT INTO logboek_dag (logboek_week_id, datum, uren, uitgevoerde_taken, reflectie, leerpunten, status)
           VALUES (?, ?, ?, ?, ?, ?, 'concept')`,
          [logboek_week_id, dag.datum, dag.uren, dag.taken, dag.reflectie, dag.leerpunten]
        )
        dag_id = dagResult.insertId
      }

      // competenties opslaan
      await db.query('DELETE FROM logboek_dag_competentie WHERE logboek_dag_id = ?', [dag_id])
      if (dag.competenties && dag.competenties.length > 0) {
        for (const competentie_id of dag.competenties) {
          await db.query(
            'INSERT INTO logboek_dag_competentie (logboek_dag_id, competentie_id) VALUES (?, ?)',
            [dag_id, competentie_id]
          )
        }
      }
    }

    const [urenRijen] = await db.query(
      'SELECT SUM(uren) as totaal, COUNT(*) as aantal_dagen FROM logboek_dag WHERE logboek_week_id = ?',
      [logboek_week_id]
    )
    const totaal_uren = urenRijen[0]?.totaal || 0
    const aantal_dagen = urenRijen[0]?.aantal_dagen || 0
    const status = aantal_dagen >= 5 ? 'volledig' : 'onvolledig'

    await db.query(
      'UPDATE logboek_week SET totaal_uren=?, status=? WHERE id=?',
      [totaal_uren, status, logboek_week_id]
    )

    return NextResponse.json({ bericht: 'Logboek opgeslagen!' })
  } catch (error) {
    return NextResponse.json({ fout: error.message }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const auth = verifyToken(request)
    if (auth.fout) return NextResponse.json({ fout: auth.fout }, { status: auth.status })
    const rolFout = checkRol(auth.payload, ['student'])
    if (rolFout) return NextResponse.json({ fout: rolFout.fout }, { status: rolFout.status })

    const body = await request.json()
    const { logboek_week_id } = body

    const [dagRijen] = await db.query(
      'SELECT COUNT(*) as aantal FROM logboek_dag WHERE logboek_week_id = ?',
      [logboek_week_id]
    )

    if (dagRijen[0].aantal < 5) {
      return NextResponse.json({ fout: 'Je moet eerst 5 dagen invullen voor je de week kan indienen.' }, { status: 400 })
    }

    await db.query(
      `UPDATE logboek_week SET status='ingediend', ingediend_op=NOW() WHERE id=?`,
      [logboek_week_id]
    )

    return NextResponse.json({ bericht: 'Logboek ingediend!' })
  } catch (error) {
    return NextResponse.json({ fout: error.message }, { status: 500 })
  }
}