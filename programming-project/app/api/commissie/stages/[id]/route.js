import { NextResponse } from 'next/server'
import db from '@/app/lib/db'
import { verifyToken, checkRol } from '@/app/lib/auth'
import { stuurMail, genereerCode } from '@/app/lib/mailer'
import { stagementorUitnodigingTemplate, stageStatusTemplate } from '@/app/lib/emailTemplates'

const TOEGESTANE_STATUSSEN = ['goedgekeurd', 'afgekeurd', 'aanpassingen']

export async function GET(request, { params }) {
  try {
    const auth = verifyToken(request)
    if (auth.fout) return NextResponse.json({ fout: auth.fout }, { status: auth.status })
    const rolFout = checkRol(auth.payload, ['commissie'])
    if (rolFout) return NextResponse.json({ fout: rolFout.fout }, { status: rolFout.status })

    const { id } = await params

    const [rijen] = await db.query(`
      SELECT
        s.id, s.status, s.opdracht_omschrijving, s.startdatum, s.einddatum,
        s.aantal_weken, s.uren_per_week, s.feedback_commissie, s.ingediend_op,
        su.voornaam AS student_voornaam, su.achternaam AS student_achternaam,
        su.email AS student_email,
        st.opleiding, st.academiejaar,
        mu.voornaam AS mentor_voornaam, mu.achternaam AS mentor_achternaam,
        mu.email AS mentor_email,
        b.naam AS bedrijf_naam, b.adres AS bedrijf_adres, b.sector, b.website
      FROM stage s
      LEFT JOIN student st ON s.student_id = st.id
      LEFT JOIN user su ON st.user_id = su.id
      LEFT JOIN stagementor sm ON s.stagementor_id = sm.id
      LEFT JOIN user mu ON sm.user_id = mu.id
      LEFT JOIN bedrijf b ON sm.bedrijf_id = b.id
      WHERE s.id = ?
    `, [id])

    if (rijen.length === 0) return NextResponse.json({ fout: 'Stage niet gevonden' }, { status: 404 })
    return NextResponse.json(rijen[0])
  } catch (error) {
    return NextResponse.json({ fout: error.message }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const auth = verifyToken(request)
    if (auth.fout) return NextResponse.json({ fout: auth.fout }, { status: auth.status })
    const rolFout = checkRol(auth.payload, ['commissie'])
    if (rolFout) return NextResponse.json({ fout: rolFout.fout }, { status: rolFout.status })

    const { id } = await params
    const body = await request.json()
    const { status, feedback_commissie } = body

    if (!TOEGESTANE_STATUSSEN.includes(status)) {
      return NextResponse.json({ fout: 'Ongeldige status' }, { status: 400 })
    }

    await db.query(
      `UPDATE stage SET 
        status = ?, 
        feedback_commissie = ?,
        goedgekeurd_op = CASE WHEN ? = 'goedgekeurd' THEN NOW() ELSE goedgekeurd_op END
      WHERE id = ?`,
      [status, feedback_commissie || null, status, id]
    )

    const [stageRijen] = await db.query(`
      SELECT 
        u.voornaam as student_voornaam, u.email as student_email,
        b.naam as bedrijf_naam,
        mu.id as mentor_user_id,
        mu.voornaam as mentor_voornaam, mu.email as mentor_email
      FROM stage s
      JOIN student st ON s.student_id = st.id
      JOIN user u ON st.user_id = u.id
      JOIN stagementor sm ON s.stagementor_id = sm.id
      JOIN user mu ON sm.user_id = mu.id
      JOIN bedrijf b ON sm.bedrijf_id = b.id
      WHERE s.id = ?
    `, [id])

    if (stageRijen.length > 0) {
      const stage = stageRijen[0]

      try {
        await stuurMail({
          naar: stage.student_email,
          onderwerp: `Update over je stageaanvraag bij ${stage.bedrijf_naam}`,
          html: stageStatusTemplate({
            naam: stage.student_voornaam,
            bedrijf: stage.bedrijf_naam,
            status,
            feedback: feedback_commissie,
          })
        })
      } catch (mailError) {
        console.error('Mail mislukt:', mailError)
      }
    }

    return NextResponse.json({ bericht: 'Stage status bijgewerkt!' })
  } catch (error) {
    return NextResponse.json({ fout: error.message }, { status: 500 })
  }
}