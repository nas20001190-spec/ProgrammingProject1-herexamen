import { NextResponse } from 'next/server'
import db from '@/app/lib/db'
import { verifyToken, checkRol } from '@/app/lib/auth'
import { stuurMail } from '@/app/lib/mailer'

export async function GET(request, { params }) {
  try {
    const auth = verifyToken(request)
    if (auth.fout) return NextResponse.json({ fout: auth.fout }, { status: auth.status })
    const rolFout = checkRol(auth.payload, ['student'])
    if (rolFout) return NextResponse.json({ fout: rolFout.fout }, { status: rolFout.status })

    const { id } = await params

    const [rijen] = await db.query(`
      SELECT
        s.id, s.status, s.startdatum, s.einddatum,
        s.opdracht_omschrijving, s.feedback_commissie, s.commentaar_student,
        b.naam as bedrijf_naam, b.adres as bedrijf_adres, b.sector, b.website, b.telefoon as bedrijf_telefoon,
        mu.voornaam as mentor_voornaam, mu.achternaam as mentor_achternaam,
        mu.email as mentor_email, mu.telefoon as mentor_telefoon,
        sm.functie as mentor_functie,
        du.voornaam as docent_voornaam, du.achternaam as docent_achternaam
      FROM stage s
      JOIN stagementor sm ON s.stagementor_id = sm.id
      JOIN user mu ON sm.user_id = mu.id
      JOIN bedrijf b ON sm.bedrijf_id = b.id
      LEFT JOIN docent d ON s.docent_id = d.id
      LEFT JOIN user du ON d.user_id = du.id
      WHERE s.id = ?
    `, [id])

    if (rijen.length === 0) return NextResponse.json({ fout: 'Niet gevonden' }, { status: 404 })
    return NextResponse.json(rijen[0])
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
    const { actie, commentaar_student,
      bedrijf_naam, bedrijf_adres, bedrijf_sector, bedrijf_website, bedrijf_telefoon,
      mentor_naam, mentor_functie, mentor_email, mentor_telefoon,
      opdracht_omschrijving, startdatum, einddatum
    } = body

    const [stageRijen] = await db.query(`
      SELECT s.*, s.student_id,
             sm.id as sm_id, sm.user_id as mentor_user_id, sm.bedrijf_id,
             mu.email as mentor_email_huidig, mu.voornaam as mentor_voornaam
      FROM stage s
      JOIN stagementor sm ON s.stagementor_id = sm.id
      JOIN user mu ON sm.user_id = mu.id
      WHERE s.id = ?
    `, [id])

    if (stageRijen.length === 0) return NextResponse.json({ fout: 'Stage niet gevonden' }, { status: 404 })
    const stage = stageRijen[0]

    if (actie === 'accepteren') {
      await db.query('UPDATE stage SET status = ?, commentaar_student = ? WHERE id = ?', ['actief', commentaar_student || null, id])

      // andere stages verwijderen
      const [andereStages] = await db.query(
        'SELECT id, stagementor_id FROM stage WHERE student_id = ? AND id != ?',
        [stage.student_id, id]
      )
      for (const andere of andereStages) {
        const [smRijen] = await db.query('SELECT bedrijf_id, user_id FROM stagementor WHERE id = ?', [andere.stagementor_id])
        if (smRijen.length > 0) {
          const { bedrijf_id, user_id } = smRijen[0]
          await db.query('DELETE FROM stage WHERE id = ?', [andere.id])
          await db.query('DELETE FROM stagementor WHERE id = ?', [andere.stagementor_id])
          await db.query('DELETE FROM user WHERE id = ?', [user_id])
          await db.query('DELETE FROM bedrijf WHERE id = ?', [bedrijf_id])
        }
      }

      // mail naar stagementor
      try {
        const code = Math.floor(100000 + Math.random() * 900000).toString()
        const vervalt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        await db.query('UPDATE user SET reset_code = ?, reset_code_expiry = ? WHERE id = ?', [code, vervalt, stage.mentor_user_id])
        const link = `${process.env.APP_URL || 'http://localhost:3000'}/authentificator/first-time?email=${encodeURIComponent(stage.mentor_email_huidig)}`
        await stuurMail({
          naar: stage.mentor_email_huidig,
          onderwerp: 'Welkom bij Competent — Activeer je account',
          html: `<p>Beste ${stage.mentor_voornaam},</p>
                 <p>Een student heeft je stage geaccepteerd. Activeer je account met deze code:</p>
                 <p style="font-size:24px;font-weight:bold;letter-spacing:3px;">${code}</p>
                 <p><a href="${link}">${link}</a></p>
                 <p>Deze code is 7 dagen geldig.</p>`
        })
      } catch (mailError) {
        console.error('Mail mislukt:', mailError)
      }

      return NextResponse.json({ bericht: 'Stage geaccepteerd!' })

    } else if (actie === 'weigeren') {
      await db.query('UPDATE stage SET status = ?, commentaar_student = ? WHERE id = ?', ['afgekeurd', commentaar_student || null, id])
      return NextResponse.json({ bericht: 'Stage geweigerd.' })

    } else if (actie === 'aanpassen') {
      // data updaten als meegegeven
      if (bedrijf_naam) {
        await db.query(
          'UPDATE bedrijf SET naam=?, adres=?, sector=?, website=?, telefoon=? WHERE id=?',
          [bedrijf_naam, bedrijf_adres, bedrijf_sector, bedrijf_website, bedrijf_telefoon, stage.bedrijf_id]
        )
      }
      if (mentor_naam) {
        const delen = mentor_naam.split(' ')
        const voornaam = delen[0]
        const achternaam = delen.slice(1).join(' ')
        await db.query(
          'UPDATE user SET voornaam=?, achternaam=?, email=?, telefoon=? WHERE id=?',
          [voornaam, achternaam, mentor_email, mentor_telefoon, stage.mentor_user_id]
        )
        await db.query('UPDATE stagementor SET functie=? WHERE id=?', [mentor_functie, stage.sm_id])
      }
      if (opdracht_omschrijving) {
        await db.query(
          'UPDATE stage SET opdracht_omschrijving=?, startdatum=?, einddatum=? WHERE id=?',
          [opdracht_omschrijving, startdatum, einddatum, id]
        )
      }

      await db.query(
        'UPDATE stage SET status=?, commentaar_student=? WHERE id=?',
        ['ingediend', commentaar_student || null, id]
      )
      return NextResponse.json({ bericht: 'Aanpassingen ingediend!' })

    } else {
      return NextResponse.json({ fout: 'Ongeldige actie' }, { status: 400 })
    }

  } catch (error) {
    console.error('Stage actie fout:', error)
    return NextResponse.json({ fout: error.message }, { status: 500 })
  }
}