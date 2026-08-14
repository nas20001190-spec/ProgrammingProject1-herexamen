import { NextResponse } from "next/server";
import db from "@/app/lib/db";
import { verifyToken, checkRol } from "@/app/lib/auth";

export async function GET(request) {
  try {
    const auth = verifyToken(request);
    if (auth.fout)
      return NextResponse.json({ fout: auth.fout }, { status: auth.status });
    const rolFout = checkRol(auth.payload, ["docent"]);
    if (rolFout)
      return NextResponse.json(
        { fout: rolFout.fout },
        { status: rolFout.status },
      );

    const payload = auth.payload;

    const [rijen] = await db.query(
      `
      SELECT 
        e.id, e.type, e.status, e.datum, e.week_nummer,
        e.algemene_feedback_docent,
        u.voornaam as student_voornaam, u.achternaam as student_achternaam,
        b.naam as bedrijf_naam
      FROM evaluatie e
      JOIN stage s ON e.stage_id = s.id
      JOIN student st ON s.student_id = st.id
      JOIN user u ON st.user_id = u.id
      JOIN docent d ON s.docent_id = d.id
      JOIN stagementor sm ON s.stagementor_id = sm.id
      JOIN bedrijf b ON sm.bedrijf_id = b.id
      WHERE d.user_id = ?
      ORDER BY e.datum DESC
    `,
      [payload.id],
    );

    return NextResponse.json(
      rijen.map((r) => ({
        ...r,
        datum: r.datum ? new Date(r.datum).toISOString().split("T")[0] : null,
      })),
    );
  } catch (error) {
    return NextResponse.json({ fout: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = verifyToken(request);
    if (auth.fout)
      return NextResponse.json({ fout: auth.fout }, { status: auth.status });
    const rolFout = checkRol(auth.payload, ["docent"]);
    if (rolFout)
      return NextResponse.json(
        { fout: rolFout.fout },
        { status: rolFout.status },
      );

    const payload = auth.payload;
    const body = await request.json();
    const { stage_id, type, datum, feedback } = body;

    const [evaluatieResult] = await db.query(
      `INSERT INTO evaluatie 
        (stage_id, beoordelaar_id, type, status, algemene_feedback_docent, datum)
       VALUES (?, ?, ?, 'open', ?, ?)`,
      [stage_id, payload.id, type, feedback || null, datum],
    );
    const evaluatie_id = evaluatieResult.insertId;

    const [competenties] = await db.query(
      "SELECT id FROM competentie ORDER BY id ASC",
    );
    for (const c of competenties) {
      await db.query(
        "INSERT INTO evaluatie_score (evaluatie_id, competentie_id) VALUES (?, ?)",
        [evaluatie_id, c.id],
      );
    }

    return NextResponse.json({
      bericht: "Evaluatie aangemaakt!",
      id: evaluatie_id,
    });
  } catch (error) {
    return NextResponse.json({ fout: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const auth = verifyToken(request);
    if (auth.fout)
      return NextResponse.json({ fout: auth.fout }, { status: auth.status });
    const rolFout = checkRol(auth.payload, ["docent"]);
    if (rolFout)
      return NextResponse.json(
        { fout: rolFout.fout },
        { status: rolFout.status },
      );

    const body = await request.json();
    const {
      evaluatie_id,
      algemene_feedback,
      scores,
      presentatie_datum,
      presentatie_notities,
      presentatie_score,
      presentatie_scores,
    } = body;

    await db.query(
      `UPDATE evaluatie SET 
        algemene_feedback_docent=?,
        status=?,
        presentatie_datum=?,
        presentatie_notities=?,
        presentatie_score=?
       WHERE id=?`,
      [
        algemene_feedback || null,
        "ingevuld",
        presentatie_datum || null,
        presentatie_notities || null,
        presentatie_score !== undefined && presentatie_score !== ""
          ? parseFloat(presentatie_score)
          : null,
        evaluatie_id,
      ],
    );

    for (const score of scores) {
      await db.query(
        "UPDATE evaluatie_score SET score_docent=? WHERE evaluatie_id=? AND competentie_id=?",
        [score.score_docent ?? null, evaluatie_id, score.competentie_id],
      );
    }

    if (presentatie_scores && Array.isArray(presentatie_scores)) {
      for (const ps of presentatie_scores) {
        const [bestaand] = await db.query(
          "SELECT id FROM evaluatie_presentatie_score WHERE evaluatie_id=? AND criterium_id=?",
          [evaluatie_id, ps.criterium_id],
        );
        if (bestaand.length > 0) {
          await db.query(
            "UPDATE evaluatie_presentatie_score SET score=? WHERE evaluatie_id=? AND criterium_id=?",
            [ps.score ?? null, evaluatie_id, ps.criterium_id],
          );
        } else {
          await db.query(
            "INSERT INTO evaluatie_presentatie_score (evaluatie_id, criterium_id, score) VALUES (?, ?, ?)",
            [evaluatie_id, ps.criterium_id, ps.score ?? null],
          );
        }
      }
    }

    return NextResponse.json({ bericht: "Evaluatie opgeslagen!" });
  } catch (error) {
    return NextResponse.json({ fout: error.message }, { status: 500 });
  }
}
