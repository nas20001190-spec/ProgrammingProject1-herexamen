'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Topbar from '../../component/topbar';
import { fetchMetAuth } from '@/app/lib/fetchMetAuth';

export default function StageDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [bezig, setBezig] = useState(false);
  const [docenten, setDocenten] = useState([]);
  const [status, setStatus] = useState('');

  const [form, setForm] = useState({
    student_voornaam: '', student_achternaam: '', student_email: '', student_telefoon: '',
    opleiding: '', academiejaar: '', student_adres: '',
    bedrijf_naam: '', bedrijf_adres: '', sector: '', website: '',
    mentor_voornaam: '', mentor_achternaam: '', mentor_email: '', mentor_telefoon: '', mentor_functie: '',
    opdracht_omschrijving: '', startdatum: '', einddatum: '', aantal_weken: '', uren_per_week: '',
    docent_id: '', feedback_commissie: '',
  });

  useEffect(() => {
    if (!id) return;

    fetchMetAuth(`/api/admin/stages/${id}`)
      .then(res => res?.json())
      .then(data => {
        if (data && !data.fout) {
          setStatus(data.status || '');
          setForm({
            student_voornaam: data.student_voornaam || '',
            student_achternaam: data.student_achternaam || '',
            student_email: data.student_email || '',
            student_telefoon: data.student_telefoon || '',
            opleiding: data.opleiding || '',
            academiejaar: data.academiejaar || '',
            student_adres: data.student_adres || '',
            bedrijf_naam: data.bedrijf_naam || '',
            bedrijf_adres: data.bedrijf_adres || '',
            sector: data.sector || '',
            website: data.website || '',
            mentor_voornaam: data.mentor_voornaam || '',
            mentor_achternaam: data.mentor_achternaam || '',
            mentor_email: data.mentor_email || '',
            mentor_telefoon: data.mentor_telefoon || '',
            mentor_functie: data.mentor_functie || '',
            opdracht_omschrijving: data.opdracht_omschrijving || '',
            startdatum: data.startdatum ? data.startdatum.slice(0, 10) : '',
            einddatum: data.einddatum ? data.einddatum.slice(0, 10) : '',
            aantal_weken: data.aantal_weken ?? '',
            uren_per_week: data.uren_per_week ?? '',
            docent_id: data.docent_id ?? '',
            feedback_commissie: data.feedback_commissie || '',
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));

    fetchMetAuth('/api/admin/docenten')
      .then(res => res?.json())
      .then(data => { if (Array.isArray(data)) setDocenten(data); })
      .catch(() => {});
  }, [id]);

  const update = (veld, waarde) => setForm({ ...form, [veld]: waarde });

  const isGesloten = status === 'goedgekeurd' || status === 'actief';

  const inputClass = isGesloten
    ? 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-500 bg-gray-50'
    : 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1A2E4A] focus:border-transparent';

  const verstuur = async (nieuweStatus) => {
    const teksten = {
      goedgekeurd: 'Weet u zeker dat u deze stage wilt goedkeuren?',
      aanpassingen: 'Aanpassingen vereist versturen?',
      afgekeurd: 'Weet u zeker dat u deze stage wilt afkeuren?',
    };
    if (!window.confirm(teksten[nieuweStatus])) return;

    setBezig(true);
    const response = await fetchMetAuth(`/api/admin/stages/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...form, status: nieuweStatus }),
    });
    if (!response) { setBezig(false); return; }
    const data = await response.json();
    if (response.ok) {
      alert('Opgeslagen!');
      router.push('/admin/stage');
    } else {
      alert(data.fout || 'Er ging iets mis');
      setBezig(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-sm text-gray-400">Laden...</div>
      </div>
    );
  }

  return (
    <main className="flex-1 flex flex-col">
      <Topbar title="Stage" />

      <div className="flex-1 p-6 bg-gray-50 overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Stage bewerken</h2>
        <p className="text-sm text-gray-400 mb-6">Bekijk en pas de stagegegevens aan</p>

        <div className="flex gap-6">
          <div className="flex-1 flex flex-col gap-6">

            {/* Sectie 1 – Studentgegevens */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-sm font-semibold text-gray-500 mb-4">Sectie 1 — Studentgegevens</h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Voornaam</label>
                  <input type="text" value={form.student_voornaam} onChange={(e) => update('student_voornaam', e.target.value)} disabled={isGesloten} className={inputClass} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Achternaam</label>
                  <input type="text" value={form.student_achternaam} onChange={(e) => update('student_achternaam', e.target.value)} disabled={isGesloten} className={inputClass} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Opleiding</label>
                  <input type="text" value={form.opleiding} onChange={(e) => update('opleiding', e.target.value)} disabled={isGesloten} className={inputClass} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Academiejaar</label>
                  <input type="text" value={form.academiejaar} onChange={(e) => update('academiejaar', e.target.value)} disabled={isGesloten} className={inputClass} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">E-mail</label>
                  <input type="email" value={form.student_email} onChange={(e) => update('student_email', e.target.value)} disabled={isGesloten} className={inputClass} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Telefoon</label>
                  <input type="tel" value={form.student_telefoon} onChange={(e) => update('student_telefoon', e.target.value)} disabled={isGesloten} className={inputClass} />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-gray-400 block mb-1">Adres</label>
                  <input type="text" value={form.student_adres} onChange={(e) => update('student_adres', e.target.value)} disabled={isGesloten} className={inputClass} />
                </div>
              </div>
            </div>

            {/* Sectie 2 – Bedrijfsgegevens */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-sm font-semibold text-gray-500 mb-4">Sectie 2 — Bedrijfsgegevens</h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Bedrijfsnaam</label>
                  <input type="text" value={form.bedrijf_naam} onChange={(e) => update('bedrijf_naam', e.target.value)} disabled={isGesloten} className={inputClass} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Adres</label>
                  <input type="text" value={form.bedrijf_adres} onChange={(e) => update('bedrijf_adres', e.target.value)} disabled={isGesloten} className={inputClass} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Sector</label>
                  <input type="text" value={form.sector} onChange={(e) => update('sector', e.target.value)} disabled={isGesloten} className={inputClass} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Website</label>
                  <input type="text" value={form.website} onChange={(e) => update('website', e.target.value)} disabled={isGesloten} className={inputClass} />
                </div>
              </div>

              <h4 className="text-sm font-semibold text-gray-500 mt-6 mb-4">Bedrijfsmentor</h4>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Voornaam</label>
                  <input type="text" value={form.mentor_voornaam} onChange={(e) => update('mentor_voornaam', e.target.value)} disabled={isGesloten} className={inputClass} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Achternaam</label>
                  <input type="text" value={form.mentor_achternaam} onChange={(e) => update('mentor_achternaam', e.target.value)} disabled={isGesloten} className={inputClass} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">E-mail</label>
                  <input type="email" value={form.mentor_email} onChange={(e) => update('mentor_email', e.target.value)} disabled={isGesloten} className={inputClass} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Telefoon</label>
                  <input type="tel" value={form.mentor_telefoon} onChange={(e) => update('mentor_telefoon', e.target.value)} disabled={isGesloten} className={inputClass} />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-gray-400 block mb-1">Functie</label>
                  <input type="text" value={form.mentor_functie} onChange={(e) => update('mentor_functie', e.target.value)} disabled={isGesloten} className={inputClass} />
                </div>
              </div>
            </div>

            {/* Sectie 3 – Opdracht & periode */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-sm font-semibold text-gray-500 mb-4">Sectie 3 — Opdracht & periode</h3>
              <div className="mb-4">
                <label className="text-xs text-gray-400 block mb-1">Omschrijving van de opdracht</label>
                <textarea value={form.opdracht_omschrijving} onChange={(e) => update('opdracht_omschrijving', e.target.value)} rows={3} disabled={isGesloten} className={`${inputClass} resize-none`} />
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Startdatum</label>
                  <input type="date" value={form.startdatum} onChange={(e) => update('startdatum', e.target.value)} disabled={isGesloten} className={inputClass} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Einddatum</label>
                  <input type="date" value={form.einddatum} onChange={(e) => update('einddatum', e.target.value)} disabled={isGesloten} className={inputClass} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Aantal weken</label>
                  <input type="number" value={form.aantal_weken} onChange={(e) => update('aantal_weken', e.target.value)} disabled={isGesloten} className={inputClass} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Uren per week</label>
                  <input type="number" value={form.uren_per_week} onChange={(e) => update('uren_per_week', e.target.value)} disabled={isGesloten} className={inputClass} />
                </div>
              </div>
            </div>

            <Link href="/admin/stage" className="text-sm text-gray-500 hover:text-gray-900 mb-4">← Terug naar overzicht</Link>
          </div>

          {/* Rechterkolom */}
          <div className="w-72 flex flex-col gap-6">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-1">Docent</h3>
              <p className="text-xs text-gray-400 mb-4">De docent die de student zal opvolgen tijdens de stage.</p>
              <label className="text-xs text-gray-400 block mb-1">Docent voor deze stage</label>
              <select value={form.docent_id || ''} onChange={(e) => update('docent_id', e.target.value)} disabled={isGesloten} className={inputClass}>
                <option value="">Selecteer docent</option>
                {docenten.map((d) => (
                  <option key={d.id} value={d.id}>{d.voornaam} {d.achternaam}</option>
                ))}
              </select>
            </div>

            {!isGesloten ? (
              <div className="bg-orange-50 rounded-xl border border-orange-100 p-5">
                <h3 className="text-sm font-bold text-gray-900 mb-1">Beoordeling</h3>
                <p className="text-xs text-gray-400 mb-1">Huidige status: <span className="font-medium">{status}</span></p>
                <p className="text-xs text-gray-400 mb-4">Beoordeel de stageaanvraag</p>
                <label className="text-xs text-gray-500 block mb-2">Feedback (bij aanpassingen)</label>
                <textarea value={form.feedback_commissie} onChange={(e) => update('feedback_commissie', e.target.value)} placeholder="Geef duidelijke feedback..." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 mb-4 resize-none bg-white focus:outline-none focus:ring-2 focus:ring-[#1A2E4A] focus:border-transparent" rows={3} />
                <div className="flex flex-col gap-2">
                  <button onClick={() => verstuur('goedgekeurd')} disabled={bezig} className="w-full py-2.5 rounded-lg text-sm font-medium text-white bg-[#065F46] hover:bg-[#054F3B] disabled:opacity-50 transition-colors">Goedkeuren</button>
                  <button onClick={() => verstuur('aanpassingen')} disabled={bezig} className="w-full py-2.5 rounded-lg text-sm font-medium text-white bg-[#D97706] hover:bg-[#B45309] disabled:opacity-50 transition-colors">Aanpassingen vereist</button>
                  <button onClick={() => verstuur('afgekeurd')} disabled={bezig} className="w-full py-2.5 rounded-lg text-sm font-medium text-white bg-[#DC2626] hover:bg-[#B91C1C] disabled:opacity-50 transition-colors">Afkeuren</button>
                </div>
              </div>
            ) : (
              <div className="bg-green-50 rounded-xl border border-green-100 p-5">
                <h3 className="text-sm font-bold text-gray-900 mb-1">Status</h3>
                <p className="text-sm text-gray-600">Deze stage is <span className="font-semibold">{status}</span> en kan niet meer worden beoordeeld.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}