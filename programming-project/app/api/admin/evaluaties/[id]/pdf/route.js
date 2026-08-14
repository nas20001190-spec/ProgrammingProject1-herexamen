import { NextResponse } from "next/server";
import db from "@/app/lib/db";
import jwt from "jsonwebtoken";
import puppeteer from "puppeteer";

let browserInstance = null;

async function getBrowser() {
  if (!browserInstance) {
    browserInstance = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }
  return browserInstance;
}

export async function GET(request, { params }) {
  try {
    let token = null;
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else {
      const cookieHeader = request.headers.get("cookie") || "";
      const match = cookieHeader.match(/token=([^;]+)/);
      if (match) token = match[1];
    }

    if (!token)
      return NextResponse.json({ fout: "Geen token" }, { status: 401 });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.rol !== "admin")
      return NextResponse.json({ fout: "Geen toegang" }, { status: 403 });

    const { id } = await params;

    const [evalRijen] = await db.query(
      `
      SELECT e.id, e.type, e.status, e.datum,
             e.algemene_feedback_docent,
             e.presentatie_datum, e.presentatie_notities,
             u.voornaam as student_voornaam, u.achternaam as student_achternaam,
             u.email as student_email,
             st.opleiding, st.academiejaar,
             b.naam as bedrijf_naam,
             mu.voornaam as mentor_voornaam, mu.achternaam as mentor_achternaam,
             du.voornaam as docent_voornaam, du.achternaam as docent_achternaam
      FROM evaluatie e
      JOIN stage s ON e.stage_id = s.id
      JOIN student st ON s.student_id = st.id
      JOIN user u ON st.user_id = u.id
      JOIN stagementor sm ON s.stagementor_id = sm.id
      JOIN user mu ON sm.user_id = mu.id
      JOIN bedrijf b ON sm.bedrijf_id = b.id
      LEFT JOIN docent d ON s.docent_id = d.id
      LEFT JOIN user du ON d.user_id = du.id
      WHERE e.id = ?
    `,
      [id],
    );

    if (evalRijen.length === 0)
      return NextResponse.json(
        { fout: "Evaluatie niet gevonden" },
        { status: 404 },
      );

    const evaluatie = evalRijen[0];

    const [scoreRijen] = await db.query(
      `
      SELECT es.competentie_id, es.score_mentor, es.score_docent,
             es.feedback_mentor, es.zelfreflectie_student,
             c.naam as competentie_naam, c.omschrijving, c.gewicht
      FROM evaluatie_score es
      JOIN competentie c ON es.competentie_id = c.id
      WHERE es.evaluatie_id = ?
      ORDER BY c.id ASC
    `,
      [id],
    );

    const competentieIds = scoreRijen.map((s) => s.competentie_id);
    let scoreMaxDocent = {};
    let scoreMaxMentor = {};

    if (competentieIds.length > 0) {
      const [maxDocent] = await db.query(
        `
        SELECT competentie_id, MAX(score_max) as score_max
        FROM rubriek_niveau WHERE competentie_id IN (?) AND rol = 'docent'
        GROUP BY competentie_id
      `,
        [competentieIds],
      );
      for (const r of maxDocent) scoreMaxDocent[r.competentie_id] = r.score_max;

      const [maxMentor] = await db.query(
        `
        SELECT competentie_id, MAX(score_max) as score_max
        FROM rubriek_niveau WHERE competentie_id IN (?) AND rol = 'mentor'
        GROUP BY competentie_id
      `,
        [competentieIds],
      );
      for (const r of maxMentor) scoreMaxMentor[r.competentie_id] = r.score_max;
    }

    // Pondering
    const [ponderingRijen] = await db.query(
      "SELECT * FROM evaluatie_pondering ORDER BY id DESC LIMIT 1",
    );
    const pondering = ponderingRijen[0] ?? {
      mentor_gewicht: 30,
      docent_gewicht: 30,
      presentatie_gewicht: 40,
    };

    // Presentatie scores (alleen bij finaal)
    let presentatieScores = [];
    let presentatieCriteria = [];
    if (evaluatie.type === "finaal") {
      const [criteriaRijen] = await db.query(`
        SELECT pc.id, pc.naam, pc.omschrijving, pc.gewicht
        FROM presentatie_criterium pc ORDER BY pc.id ASC
      `);
      const [psRijen] = await db.query(
        `
        SELECT eps.criterium_id, eps.score, pc.naam, pc.gewicht,
               pcn.score_max
        FROM evaluatie_presentatie_score eps
        JOIN presentatie_criterium pc ON eps.criterium_id = pc.id
        LEFT JOIN (
          SELECT criterium_id, MAX(score_max) as score_max
          FROM presentatie_criterium_niveau
          GROUP BY criterium_id
        ) pcn ON pcn.criterium_id = eps.criterium_id
        WHERE eps.evaluatie_id = ?
      `,
        [id],
      );

      presentatieScores = psRijen;
      presentatieCriteria = criteriaRijen;
    }

    // Berekening eindnota /20
    let notaMentor = 0;
    let notaDocent = 0;
    let notaPresentatie = 0;

    // Mentor score (gewogen gemiddelde genormaliseerd)
    let mentorTeller = 0,
      mentorNoemer = 0;
    for (const s of scoreRijen) {
      if (s.score_mentor !== null && s.score_mentor !== "") {
        const max = scoreMaxMentor[s.competentie_id] || 4;
        mentorTeller +=
          (parseFloat(s.score_mentor) / max) * parseFloat(s.gewicht);
        mentorNoemer += parseFloat(s.gewicht);
      }
    }
    if (mentorNoemer > 0) notaMentor = mentorTeller / mentorNoemer;

    // Docent score (gewogen gemiddelde genormaliseerd)
    let docentTeller = 0,
      docentNoemer = 0;
    for (const s of scoreRijen) {
      if (s.score_docent !== null && s.score_docent !== "") {
        const max = scoreMaxDocent[s.competentie_id] || 10;
        docentTeller +=
          (parseFloat(s.score_docent) / max) * parseFloat(s.gewicht);
        docentNoemer += parseFloat(s.gewicht);
      }
    }
    if (docentNoemer > 0) notaDocent = docentTeller / docentNoemer;

    // Presentatie score (gewogen gemiddelde genormaliseerd)
    if (evaluatie.type === "finaal" && presentatieScores.length > 0) {
      let presTeller = 0,
        presNoemer = 0;
      for (const ps of presentatieScores) {
        if (ps.score !== null && ps.score !== "") {
          const max = ps.score_max || 10;
          presTeller += (parseFloat(ps.score) / max) * parseFloat(ps.gewicht);
          presNoemer += parseFloat(ps.gewicht);
        }
      }
      if (presNoemer > 0) notaPresentatie = presTeller / presNoemer;
    }

    // Eindnota /20
    const pMentor = parseFloat(pondering.mentor_gewicht) / 100;
    const pDocent = parseFloat(pondering.docent_gewicht) / 100;
    const pPresentatie = parseFloat(pondering.presentatie_gewicht) / 100;

    const eindnota =
      evaluatie.type === "finaal"
        ? (notaMentor * pMentor +
            notaDocent * pDocent +
            notaPresentatie * pPresentatie) *
          20
        : (notaMentor *
            (pondering.mentor_gewicht /
              (pondering.mentor_gewicht + pondering.docent_gewicht)) +
            notaDocent *
              (pondering.docent_gewicht /
                (pondering.mentor_gewicht + pondering.docent_gewicht))) *
          20;

    const fmt = (d) => (d ? new Date(d).toLocaleDateString("nl-BE") : "—");

    const competentiesHtml = scoreRijen
      .map(
        (s) => `
      <div class="competentie-blok">
        <div class="comp-header">
          <div class="comp-naam">${s.competentie_naam}</div>
          <div class="comp-scores">
            <span class="score-badge mentor">Mentor: ${s.score_mentor !== null && s.score_mentor !== "" ? s.score_mentor + "/" + (scoreMaxMentor[s.competentie_id] || 4) : "—"}</span>
            <span class="score-badge docent">Docent: ${s.score_docent !== null && s.score_docent !== "" ? s.score_docent + "/" + (scoreMaxDocent[s.competentie_id] || 10) : "—"}</span>
          </div>
        </div>
        <p class="comp-omschrijving">${s.omschrijving || ""}</p>
        ${
          s.zelfreflectie_student
            ? `
          <div class="feedback-blok zelfreflectie">
            <div class="feedback-label">Zelfreflectie student</div>
            <div class="feedback-tekst">${s.zelfreflectie_student}</div>
          </div>
        `
            : ""
        }
        ${
          s.feedback_mentor
            ? `
          <div class="feedback-blok mentor-feedback">
            <div class="feedback-label">Feedback mentor</div>
            <div class="feedback-tekst">${s.feedback_mentor}</div>
          </div>
        `
            : ""
        }
      </div>
    `,
      )
      .join("");

    const presentatieHtml =
      evaluatie.type === "finaal"
        ? `
      <div class="section">
        <div class="section-title">Eindpresentatie</div>
        ${evaluatie.presentatie_datum ? `<p style="font-size:12px;color:#6B7280;margin-bottom:12px;">Datum: ${fmt(evaluatie.presentatie_datum)}</p>` : ""}
        ${
          evaluatie.presentatie_notities
            ? `
          <div class="algemene-feedback" style="margin-bottom:12px;">${evaluatie.presentatie_notities}</div>
        `
            : ""
        }
        ${presentatieScores
          .map(
            (ps) => `
          <div class="competentie-blok">
            <div class="comp-header">
              <div class="comp-naam">${ps.naam}</div>
              <span class="score-badge docent">${ps.score !== null ? ps.score + "/" + (ps.score_max || 10) : "—"}</span>
            </div>
          </div>
        `,
          )
          .join("")}
      </div>
    `
        : "";

    const html = `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8"/>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: Arial, sans-serif; font-size:12px; color:#111; background:#fff; padding:40px 50px; }
    .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:30px; }
    .logo { font-size:18px; font-weight:700; color:#111; }
    .doc-info { text-align:right; font-size:11px; color:#555; }
    h1 { font-size:20px; font-weight:700; color:#111; margin-bottom:4px; }
    .subtitle { font-size:11px; color:#555; margin-bottom:24px; }
    .section { margin-bottom:20px; }
    .section-title { font-size:12px; font-weight:700; color:#111; margin-bottom:8px; border-bottom:1px solid #111; padding-bottom:4px; }
    table { width:100%; border-collapse:collapse; margin-bottom:16px; }
    table th { background:#f0f0f0; font-size:11px; font-weight:700; text-align:left; padding:6px 8px; border:1px solid #ccc; }
    table td { font-size:11px; padding:6px 8px; border:1px solid #ccc; vertical-align:top; }
    .eindnota-blok { border:2px solid #111; padding:12px 16px; margin-bottom:20px; display:flex; justify-content:space-between; align-items:center; }
    .eindnota-label { font-size:12px; font-weight:700; }
    .eindnota-sub { font-size:10px; color:#555; margin-top:2px; }
    .eindnota-score { font-size:28px; font-weight:700; }
    .feedback-blok { border:1px solid #ccc; padding:8px; margin-top:4px; font-size:11px; line-height:1.5; }
    .footer { margin-top:30px; padding-top:10px; border-top:1px solid #ccc; font-size:10px; color:#777; display:flex; justify-content:space-between; }
  </style>
</head>
<body>

  <div class="header">
    <div>
      <div class="logo">Competent</div>
      <div style="font-size:11px;color:#555;">Erasmushogeschool Brussel</div>
    </div>
    <div class="doc-info">
      <div style="font-weight:700;">Eindoverzicht ${evaluatie.type === "tussentijds" ? "Tussentijdse" : "Finale"} Evaluatie</div>
      <div>Gegenereerd op ${fmt(new Date())}</div>
    </div>
  </div>

  <h1>Eindoverzicht — ${evaluatie.type === "tussentijds" ? "Tussentijdse" : "Finale"} Evaluatie</h1>
  <p class="subtitle">${evaluatie.academiejaar || "2025-2026"} · ${evaluatie.opleiding || "Toegepaste Informatica"}</p>

  <div class="section">
    <div class="section-title">Studentgegevens</div>
    <table>
      <tr>
        <td><strong>Naam</strong><br>${evaluatie.student_voornaam} ${evaluatie.student_achternaam}</td>
        <td><strong>E-mail</strong><br>${evaluatie.student_email || "—"}</td>
      </tr>
      <tr>
        <td><strong>Bedrijf</strong><br>${evaluatie.bedrijf_naam || "—"}</td>
        <td><strong>Datum</strong><br>${fmt(evaluatie.datum)}</td>
      </tr>
      <tr>
        <td><strong>Stagementor</strong><br>${evaluatie.mentor_voornaam} ${evaluatie.mentor_achternaam}</td>
        <td><strong>Docent</strong><br>${evaluatie.docent_voornaam || "—"} ${evaluatie.docent_achternaam || ""}</td>
      </tr>
    </table>
  </div>

  <div class="eindnota-blok">
    <div>
      <div class="eindnota-label">Eindnota</div>
      <div class="eindnota-sub">Mentor ${pondering.mentor_gewicht}% · Docent ${pondering.docent_gewicht}%${evaluatie.type === "finaal" ? ` · Presentatie ${pondering.presentatie_gewicht}%` : ""}</div>
    </div>
    <div class="eindnota-score">${eindnota.toFixed(1)}<span style="font-size:16px;color:#555">/20</span></div>
  </div>

  ${
    evaluatie.algemene_feedback_docent
      ? `
  <div class="section">
    <div class="section-title">Algemene feedback docent</div>
    <div class="feedback-blok">${evaluatie.algemene_feedback_docent}</div>
  </div>
  `
      : ""
  }

  <div class="section">
    <div class="section-title">Evaluatie per competentie</div>
    <table>
      <thead>
        <tr>
          <th style="width:40%">Competentie</th>
          <th style="width:12%">Mentor</th>
          <th style="width:12%">Docent</th>
          <th style="width:36%">Zelfreflectie student</th>
        </tr>
      </thead>
      <tbody>
        ${scoreRijen
          .map(
            (s) => `
          <tr>
            <td>
              <strong>${s.competentie_naam}</strong><br>
              <span style="font-size:10px;color:#555;">${s.omschrijving || ""}</span>
            </td>
            <td>${s.score_mentor !== null && s.score_mentor !== "" ? s.score_mentor + "/" + (scoreMaxMentor[s.competentie_id] || 4) : "—"}</td>
            <td>${s.score_docent !== null && s.score_docent !== "" ? s.score_docent + "/" + (scoreMaxDocent[s.competentie_id] || 10) : "—"}</td>
            <td style="font-size:10px;">${s.zelfreflectie_student || "—"}</td>
          </tr>
          ${
            s.feedback_mentor
              ? `
          <tr>
            <td colspan="4" style="background:#fafafa;font-size:10px;color:#555;">
              <strong>Feedback mentor:</strong> ${s.feedback_mentor}
            </td>
          </tr>
          `
              : ""
          }
        `,
          )
          .join("")}
      </tbody>
    </table>
  </div>

  ${
    evaluatie.type === "finaal" && presentatieScores.length > 0
      ? `
  <div class="section">
    <div class="section-title">Eindpresentatie${evaluatie.presentatie_datum ? " — " + fmt(evaluatie.presentatie_datum) : ""}</div>
    ${evaluatie.presentatie_notities ? `<div class="feedback-blok" style="margin-bottom:8px;">${evaluatie.presentatie_notities}</div>` : ""}
    <table>
      <thead>
        <tr>
          <th style="width:40%">Criterium</th>
          <th style="width:20%">Score</th>
          <th style="width:40%">Omschrijving</th>
        </tr>
      </thead>
      <tbody>
        ${presentatieScores
          .map(
            (ps) => `
          <tr>
            <td><strong>${ps.naam}</strong></td>
            <td>${ps.score !== null ? ps.score + "/" + (ps.score_max || 10) : "—"}</td>
            <td style="font-size:10px;color:#555;">${ps.omschrijving || ""}</td>
          </tr>
        `,
          )
          .join("")}
      </tbody>
    </table>
  </div>
  `
      : ""
  }

  <div class="footer">
    <span>Competent · Erasmushogeschool Brussel · Toegepaste Informatica</span>
    <span>${evaluatie.student_voornaam} ${evaluatie.student_achternaam} · ${fmt(new Date())}</span>
  </div>

</body>
</html>`;

    const browser = await getBrowser();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: false,
      margin: { top: "20px", right: "0", bottom: "20px", left: "0" },
    });
    await page.close();

    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="eindoverzicht-${evaluatie.student_voornaam}-${evaluatie.student_achternaam}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF fout:", error);
    return NextResponse.json({ fout: error.message }, { status: 500 });
  }
}
