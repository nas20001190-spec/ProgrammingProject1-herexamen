import { NextResponse } from 'next/server'
import db from '@/app/lib/db'
import { verifyToken, checkRol } from '@/app/lib/auth'
import { stuurMail } from '@/app/lib/mailer'

export async function GET(request, { params }) {
  try {
    const auth = verifyToken(request)
    if (auth.fout) return NextResponse.json({ fout: auth.fout }, { status: auth.status })
    const rolFout = checkRol(auth.payload, ['admin'])
    if (rolFout) return NextResponse.json({ fout: rolFout.fout }, { status: rolFout.status })

    const { id } = await params

    const [rijen] = await db.query(`
      SELECT
        s.id, s.status, s.opdracht_omschrijving, s.startdatum, s.einddatum,
        s.aantal_weken, s.uren_per_week, s.feedback_commissie, s.ingediend_op,
        s.student_id, s.docent_id, s.stagementor_id,
        su.voornaam AS student_voornaam, su.achternaam AS student_achternaam,
        su.email AS student_email, su.telefoon AS student_telefoon,
        st.opleiding, st.academiejaar, st.adres AS student_adres,
        mu.voornaam AS mentor_voornaam, mu.achternaam AS mentor_achternaam,
        mu.email AS mentor_email, mu.telefoon AS mentor_telefoon,
        sm.functie AS mentor_functie, sm.bedrijf_id,
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
    const rolFout = checkRol(auth.payload, ['admin'])
    if (rolFout) return NextResponse.json({ fout: rolFout.fout }, { status: rolFout.status })

    const { id } = await params
    const body = await request.json()

    const [stageRows] = await db.query('SELECT student_id, stagementor_id FROM stage WHERE id = ?', [id])
    if (stageRows.length === 0) return NextResponse.json({ fout: 'Stage niet gevonden' }, { status: 404 })

    const { student_id, stagementor_id } = stageRows[0]

    if (student_id) {
      const [stRows] = await db.query('SELECT user_id FROM student WHERE id = ?', [student_id])
      const studentUserId = stRows[0]?.user_id
      if (studentUserId) {
        await db.query(
          'UPDATE user SET voornaam=?, achternaam=?, email=?, telefoon=? WHERE id=?',
          [body.student_voornaam, body.student_achternaam, body.student_email, body.student_telefoon, studentUserId]
        )
      }
      await db.query(
        'UPDATE student SET opleiding=?, academiejaar=?, adres=? WHERE id=?',
        [body.opleiding, body.academiejaar, body.student_adres, student_id]
      )
    }

    let mentorUserId = null
    if (stagementor_id) {
      const [smRows] = await db.query('SELECT user_id, bedrijf_id FROM stagementor WHERE id = ?', [stagementor_id])
      mentorUserId = smRows[0]?.user_id
      const bedrijfId = smRows[0]?.bedrijf_id
      if (mentorUserId) {
        await db.query(
          'UPDATE user SET voornaam=?, achternaam=?, email=?, telefoon=? WHERE id=?',
          [body.mentor_voornaam, body.mentor_achternaam, body.mentor_email, body.mentor_telefoon, mentorUserId]
        )
      }
      await db.query('UPDATE stagementor SET functie=? WHERE id=?', [body.mentor_functie, stagementor_id])
      if (bedrijfId) {
        await db.query(
          'UPDATE bedrijf SET naam=?, adres=?, sector=?, website=? WHERE id=?',
          [body.bedrijf_naam, body.bedrijf_adres, body.sector, body.website, bedrijfId]
        )
      }
    }

    await db.query(
      `UPDATE stage SET
        docent_id=?, opdracht_omschrijving=?, startdatum=?, einddatum=?,
        aantal_weken=?, uren_per_week=?, status=?, feedback_commissie=?,
        goedgekeurd_op = CASE WHEN ? = 'goedgekeurd' THEN NOW() ELSE goedgekeurd_op END
      WHERE id=?`,
      [
        body.docent_id || null,
        body.opdracht_omschrijving,
        body.startdatum || null,
        body.einddatum || null,
        body.aantal_weken || null,
        body.uren_per_week || null,
        body.status,
        body.feedback_commissie,
        body.status,
        id,
      ]
    )

    if (body.status === 'goedgekeurd' && body.mentor_email) {
      try {
        const code = Math.floor(100000 + Math.random() * 900000).toString()
        const vervalt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        if (mentorUserId) {
          await db.query('UPDATE user SET reset_code=?, reset_code_expiry=? WHERE id=?', [code, vervalt, mentorUserId])
        }
        const link = `${process.env.APP_URL}/authentificator/first-time?email=${encodeURIComponent(body.mentor_email)}`
        await stuurMail({
          naar: body.mentor_email,
          onderwerp: 'Activeer uw Competent-account',
          html: `<p>Beste ${body.mentor_voornaam || ''},</p>
                 <p>Een stage werd goedgekeurd en u bent aangeduid als stagementor. Activeer uw account met deze code:</p>
                 <p style="font-size:24px;font-weight:bold;letter-spacing:3px;">${code}</p>
                 <p><a href="${link}">${link}</a></p>
                 <p>Deze code is 7 dagen geldig.</p>`,
        })
      } catch (mailError) {
        console.error('Mail mislukt:', mailError)
      }
    }

    return NextResponse.json({ bericht: 'Stage bijgewerkt!' })
  } catch (error) {
    return NextResponse.json({ fout: error.message }, { status: 500 })
  }
}