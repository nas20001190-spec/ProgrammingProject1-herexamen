import { NextResponse } from 'next/server'
import db from '@/app/lib/db'
import jwt from 'jsonwebtoken'
import puppeteer from 'puppeteer'

let browserInstance = null

async function getBrowser() {
  if (!browserInstance) {
    browserInstance = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
  }
  return browserInstance
}

export async function GET(request, { params }) {
  try {
    let token = null
    const authHeader = request.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1]
    } else {
      const cookieHeader = request.headers.get('cookie') || ''
      const match = cookieHeader.match(/token=([^;]+)/)
      if (match) token = match[1]
    }
    if (!token) return NextResponse.json({ fout: 'Geen token' }, { status: 401 })

    const payload = jwt.verify(token, process.env.JWT_SECRET)
    if (!['admin', 'student', 'stagementor', 'docent'].includes(payload.rol)) {
      return NextResponse.json({ fout: 'Geen toegang' }, { status: 403 })
    }

    const { id } = await params

    const [rijen] = await db.query(`
      SELECT
        s.id as stage_id, s.startdatum, s.einddatum, s.opdracht_omschrijving,
        s.aantal_weken, s.uren_per_week, s.ingediend_op,
        su.voornaam as student_voornaam, su.achternaam as student_achternaam,
        su.email as student_email, su.telefoon as student_telefoon,
        st.opleiding, st.academiejaar, st.adres as student_adres,
        mu.voornaam as mentor_voornaam, mu.achternaam as mentor_achternaam,
        mu.email as mentor_email, mu.telefoon as mentor_telefoon,
        sm.functie as mentor_functie,
        b.naam as bedrijf_naam, b.adres as bedrijf_adres, b.sector, b.website,
        du.voornaam as docent_voornaam, du.achternaam as docent_achternaam,
        du.email as docent_email,
        COALESCE(o.signed_student, 0) as signed_student,
        COALESCE(o.signed_stagementor, 0) as signed_stagementor,
        o.signed_at
      FROM stage s
      LEFT JOIN student st ON s.student_id = st.id
      LEFT JOIN user su ON st.user_id = su.id
      LEFT JOIN stagementor sm ON s.stagementor_id = sm.id
      LEFT JOIN user mu ON sm.user_id = mu.id
      LEFT JOIN bedrijf b ON sm.bedrijf_id = b.id
      LEFT JOIN docent d ON s.docent_id = d.id
      LEFT JOIN user du ON d.user_id = du.id
      LEFT JOIN overeenkomst o ON o.stage_id = s.id
      WHERE s.id = ?
    `, [id])

    if (rijen.length === 0) {
      return NextResponse.json({ fout: 'Stage niet gevonden' }, { status: 404 })
    }

    const data = rijen[0]
    const fmt = (d) => d ? new Date(d).toLocaleDateString('nl-BE') : '—'
    const sig = (signed) => signed
      ? `<div style="color:#065F46;font-weight:600;font-size:13px;">✓ Ondertekend</div>`
      : `<div style="color:#9CA3AF;font-size:13px;">Nog niet ondertekend</div>`

    const html = `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8"/>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size:13px; color:#111; background:#fff; padding:40px; }
    .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:32px; padding-bottom:20px; border-bottom:2px solid #1A2E4A; }
    .logo { display:flex; align-items:center; gap:10px; }
    .logo-box { width:36px; height:36px; background:#1A2E4A; border-radius:6px; }
    .logo-text { font-size:20px; font-weight:700; color:#1A2E4A; }
    .doc-info { text-align:right; font-size:11px; color:#6B7280; }
    h1 { font-size:22px; font-weight:700; color:#1A2E4A; margin-bottom:4px; }
    .subtitle { font-size:12px; color:#6B7280; margin-bottom:32px; }
    .section { margin-bottom:24px; }
    .section-title { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; color:#6B7280; margin-bottom:12px; padding-bottom:6px; border-bottom:1px solid #E5E7EB; }
    .grid { display:grid; grid-template-columns:1fr 1fr; gap:12px 24px; }
    .field label { font-size:10px; color:#9CA3AF; display:block; margin-bottom:2px; text-transform:uppercase; letter-spacing:0.05em; }
    .field p { font-size:13px; color:#111; font-weight:500; }
    .opdracht { background:#F9FAFB; border:1px solid #E5E7EB; border-radius:6px; padding:12px; font-size:13px; line-height:1.6; color:#374151; margin-top:4px; }
    .signatures { margin-top:32px; padding-top:24px; border-top:2px solid #1A2E4A; }
    .sig-grid { display:grid; grid-template-columns:1fr 1fr; gap:24px; margin-top:16px; break-inside:avoid; page-break-inside:avoid; }
    .sig-box { border:1px solid #E5E7EB; border-radius:8px; padding:16px; break-inside:avoid; page-break-inside:avoid; }
    .signatures { margin-top:32px; padding-top:24px; border-top:2px solid #1A2E4A; break-inside:avoid; page-break-inside:avoid; }
    .sig-box h4 { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:#6B7280; margin-bottom:12px; }
    .sig-line { height:48px; border-bottom:1px solid #D1D5DB; margin-bottom:8px; }
    .footer { margin-top:40px; padding-top:16px; border-top:1px solid #E5E7EB; font-size:10px; color:#9CA3AF; display:flex; justify-content:space-between; }
    .badge { font-size:11px; font-weight:600; }
    .badge-green { color:#065F46; }
    .badge-orange { color:#92400E; }
  </style>
</head>
<body>

  <div class="header">
    <div class="logo">
      <div class="logo-box"></div>
      <div>
        <div class="logo-text">Competent</div>
        <div style="font-size:11px;color:#6B7280;">Erasmushogeschool Brussel</div>
      </div>
    </div>
    <div class="doc-info">
      <div style="font-weight:600;font-size:12px;">Stageovereenkomst</div>
      <div>DOC-2025-${String(data.stage_id).padStart(3, '0')}</div>
      <div>Aangemaakt op ${fmt(new Date())}</div>
    </div>
  </div>

  <h1>Stageovereenkomst</h1>
  <p class="subtitle">${data.academiejaar || '2025-2026'} · ${data.opleiding || 'Toegepaste Informatica'}</p>

  <div class="section">
    <div class="section-title">Studentgegevens</div>
    <div class="grid">
      <div class="field"><label>Naam</label><p>${data.student_voornaam} ${data.student_achternaam}</p></div>
      <div class="field"><label>E-mail</label><p>${data.student_email || '—'}</p></div>
      <div class="field"><label>Telefoon</label><p>${data.student_telefoon || '—'}</p></div>
      <div class="field"><label>Adres</label><p>${data.student_adres || '—'}</p></div>
      <div class="field"><label>Opleiding</label><p>${data.opleiding || '—'}</p></div>
      <div class="field"><label>Academiejaar</label><p>${data.academiejaar || '—'}</p></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Bedrijfsgegevens</div>
    <div class="grid">
      <div class="field"><label>Bedrijf</label><p>${data.bedrijf_naam || '—'}</p></div>
      <div class="field"><label>Adres</label><p>${data.bedrijf_adres || '—'}</p></div>
      <div class="field"><label>Sector</label><p>${data.sector || '—'}</p></div>
      <div class="field"><label>Website</label><p>${data.website || '—'}</p></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Stagementor</div>
    <div class="grid">
      <div class="field"><label>Naam</label><p>${data.mentor_voornaam} ${data.mentor_achternaam}</p></div>
      <div class="field"><label>Functie</label><p>${data.mentor_functie || '—'}</p></div>
      <div class="field"><label>E-mail</label><p>${data.mentor_email || '—'}</p></div>
      <div class="field"><label>Telefoon</label><p>${data.mentor_telefoon || '—'}</p></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Begeleidend docent</div>
    <div class="grid">
      <div class="field"><label>Naam</label><p>${data.docent_voornaam || '—'} ${data.docent_achternaam || ''}</p></div>
      <div class="field"><label>E-mail</label><p>${data.docent_email || '—'}</p></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Stageperiode & opdracht</div>
    <div class="grid" style="margin-bottom:12px;">
      <div class="field"><label>Startdatum</label><p>${fmt(data.startdatum)}</p></div>
      <div class="field"><label>Einddatum</label><p>${fmt(data.einddatum)}</p></div>
      <div class="field"><label>Aantal weken</label><p>${data.aantal_weken || '—'}</p></div>
      <div class="field"><label>Uren per week</label><p>${data.uren_per_week || '—'}</p></div>
    </div>
    <div class="field"><label>Omschrijving van de opdracht</label>
      <div class="opdracht">${data.opdracht_omschrijving || '—'}</div>
    </div>
  </div>

  <div class="signatures">
    <div style="font-size:14px;font-weight:700;color:#1A2E4A;margin-bottom:4px;">Handtekeningen</div>
    <div style="font-size:11px;color:#6B7280;margin-bottom:16px;">
      Status:
      ${data.signed_student && data.signed_stagementor
        ? '<span class="badge badge-green">Volledig ondertekend</span>'
        : '<span class="badge badge-orange">Wacht op ondertekening</span>'
      }
      ${data.signed_at ? `· Ondertekend op ${fmt(data.signed_at)}` : ''}
    </div>
    <div class="sig-grid">
      <div class="sig-box">
        <h4>Student</h4>
        <div class="sig-line"></div>
        <div class="field"><label>Naam</label><p>${data.student_voornaam} ${data.student_achternaam}</p></div>
        <div style="margin-top:8px;">${sig(data.signed_student)}</div>
      </div>
      <div class="sig-box">
        <h4>Stagementor</h4>
        <div class="sig-line"></div>
        <div class="field"><label>Naam</label><p>${data.mentor_voornaam} ${data.mentor_achternaam}</p></div>
        <div style="margin-top:8px;">${sig(data.signed_stagementor)}</div>
      </div>
    </div>
  </div>

  <div class="footer">
    <span>Competent · Erasmushogeschool Brussel · Toegepaste Informatica</span>
    <span>DOC-2025-${String(data.stage_id).padStart(3, '0')} · ${fmt(new Date())}</span>
  </div>

</body>
</html>`

    const browser = await getBrowser()
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' }
    })
    await page.close()

    return new NextResponse(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="stageovereenkomst-${data.stage_id}.pdf"`,
      },
    })
  } catch (error) {
    console.error('PDF fout:', error)
    return NextResponse.json({ fout: error.message }, { status: 500 })
  }
}