import db from '@/app/lib/db';
import { NextResponse } from 'next/server';
import { verifyToken, checkRol } from '@/app/lib/auth';

export async function GET(request, { params }) {
  try {
    const auth = verifyToken(request);
    if (auth.fout) return NextResponse.json({ fout: auth.fout }, { status: auth.status });

    const rolFout = checkRol(auth.payload, ['stagementor']);
    if (rolFout) return NextResponse.json({ fout: rolFout.fout }, { status: rolFout.status });

    const stagementor_id = auth.payload.stagementor_id;
    const { id: stage_id } = await params;

    const [rows] = await db.query(`
      SELECT 
        u.voornaam, u.achternaam, u.email, u.telefoon,
        s.opleiding, s.academiejaar,
        stage.id as stage_id, stage.startdatum, stage.einddatum,
        stage.aantal_weken, stage.status,
        du.voornaam as docent_voornaam, du.achternaam as docent_achternaam,
        b.naam as bedrijf_naam,
        (SELECT COUNT(*) FROM logboek_week lw WHERE lw.stage_id = stage.id AND lw.status = 'ingediend') as logboeken_te_keuren,
        (SELECT COUNT(*) FROM evaluatie e WHERE e.stage_id = stage.id AND e.status IN ('open', 'ingevuld')) as evaluaties_te_doen
      FROM stage
      JOIN student s ON stage.student_id = s.id
      JOIN user u ON s.user_id = u.id
      JOIN docent d ON stage.docent_id = d.id
      JOIN user du ON d.user_id = du.id
      JOIN stagementor sm ON stage.stagementor_id = sm.id
      JOIN bedrijf b ON sm.bedrijf_id = b.id
      WHERE stage.id = ? AND stage.stagementor_id = ?
    `, [stage_id, stagementor_id]);

    if (rows.length === 0) return NextResponse.json({ fout: 'Niet gevonden' }, { status: 404 });

    return NextResponse.json(rows[0]);
  } catch (error) {
    return NextResponse.json({ fout: error.message }, { status: 500 });
  }
}