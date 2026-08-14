'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Topbar from '../../component/topbar';
import { fetchMetAuth } from '@/app/lib/fetchMetAuth';

export default function StageNieuwPage() {
  const router = useRouter();
  const [docenten, setDocenten] = useState([]);
  const [bezig, setBezig] = useState(false);

  const [form, setForm] = useState({
    student_email: '',
    opleiding: 'Toegepaste Informatica',
    academiejaar: '',
    telefoon: '',
    docent_id: '',
    bedrijf_naam: '', bedrijf_adres: '', sector: '', website: '',
    mentor_voornaam: '', mentor_achternaam: '', mentor_email: '',
    mentor_telefoon: '', mentor_functie: '',
    opdracht_omschrijving: '', startdatum: '', einddatum: '',
  });

  useEffect(() => {
    fetchMetAuth('/api/admin/docenten')
      .then(res => res?.json())
      .then(data => { if (Array.isArray(data)) setDocenten(data); })
      .catch(() => {});
  }, []);

  const update = (veld, waarde) => setForm({ ...form, [veld]: waarde });

  const handleBevestigen = async () => {
    if (!form.student_email) {
      alert('Vul het e-mailadres van de student in.');
      return;
    }
    if (!window.confirm('Weet u zeker dat u deze stage wilt registreren?')) return;

    setBezig(true);
    const response = await fetchMetAuth('/api/admin/stages', {
      method: 'POST',
      body: JSON.stringify(form),
    });
    if (!response) { setBezig(false); return; }
    const data = await response.json();
    if (response.ok) {
      alert('Stage aangemaakt!');
      router.push('/admin/stage');
    } else {
      alert(data.fout || 'Er ging iets mis');
      setBezig(false);
    }
  };

  const inputClass = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1A2E4A] focus:border-transparent';

  return (
    <main className="flex-1 flex flex-col">
      <Topbar title="Stage" />

      <div className="flex-1 p-6 bg-gray-50 overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Nieuwe stage registreren</h2>
        <p className="text-sm text-gray-400 mb-6">Handmatig een stage aanmaken (zelfde structuur als studentenformulier)</p>

        <div className="flex gap-6">
          <div className="flex-1 flex flex-col gap-6">

            {/* Sectie 1 – Studentgegevens */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-sm font-semibold text-gray-500 mb-4">Sectie 1 — Studentgegevens</h3>
              <p className="text-xs text-gray-400 mb-4">De student moet al bestaan in het systeem. Zoek op e-mailadres.</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <div className="col-span-2">
                  <label className="text-xs text-gray-400 block mb-1">E-mail student ⚠️ verplicht</label>
                  <input type="email" value={form.student_email} onChange={(e) => update('student_email', e.target.value)} placeholder="student@student.ehb.be" className={inputClass} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Opleiding</label>
                  <input type="text" value={form.opleiding} onChange={(e) => update('opleiding', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Academiejaar</label>
                  <input type="text" value={form.academiejaar} onChange={(e) => {
                    let v = e.target.value.replace(/[^0-9\-\s]/g, '');
                    if (v.length === 4 && !v.includes('-')) v += ' - ';
                    if (v.length <= 11) update('academiejaar', v);
                  }} placeholder="bv. 2025 - 2026" className={inputClass} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Telefoon</label>
                  <input type="tel" value={form.telefoon} onChange={(e) => update('telefoon', e.target.value)} placeholder="+32 ..." className={inputClass} />
                </div>
              </div>
            </div>

            {/* Sectie 2 – Bedrijfsgegevens */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-sm font-semibold text-gray-500 mb-4">Sectie 2 — Bedrijfsgegevens</h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Bedrijfsnaam</label>
                  <input type="text" value={form.bedrijf_naam} onChange={(e) => update('bedrijf_naam', e.target.value)} placeholder="Naam van het bedrijf" className={inputClass} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Adres</label>
                  <input type="text" value={form.bedrijf_adres} onChange={(e) => update('bedrijf_adres', e.target.value)} placeholder="Straat, postcode, stad" className={inputClass} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Sector</label>
                  <input type="text" value={form.sector} onChange={(e) => update('sector', e.target.value)} placeholder="bv. IT-consultancy" className={inputClass} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Website</label>
                  <input type="url" value={form.website} onChange={(e) => update('website', e.target.value)} placeholder="https://..." className={inputClass} />
                </div>
              </div>

              <h4 className="text-sm font-semibold text-gray-500 mt-6 mb-4">Bedrijfsmentor</h4>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Voornaam</label>
                  <input type="text" value={form.mentor_voornaam} onChange={(e) => update('mentor_voornaam', e.target.value)} placeholder="Voornaam mentor" className={inputClass} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Achternaam</label>
                  <input type="text" value={form.mentor_achternaam} onChange={(e) => update('mentor_achternaam', e.target.value)} placeholder="Achternaam mentor" className={inputClass} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">E-mail</label>
                  <input type="email" value={form.mentor_email} onChange={(e) => update('mentor_email', e.target.value)} placeholder="mentor@bedrijf.be" className={inputClass} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Telefoon</label>
                  <input type="tel" value={form.mentor_telefoon} onChange={(e) => update('mentor_telefoon', e.target.value)} placeholder="+32 ..." className={inputClass} />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-gray-400 block mb-1">Functie</label>
                  <input type="text" value={form.mentor_functie} onChange={(e) => update('mentor_functie', e.target.value)} placeholder="bv. Senior Software Engineer" className={inputClass} />
                </div>
              </div>
            </div>

            {/* Sectie 3 – Opdracht & periode */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-sm font-semibold text-gray-500 mb-4">Sectie 3 — Opdracht & periode</h3>
              <div className="mb-4">
                <label className="text-xs text-gray-400 block mb-1">Omschrijving van de opdracht</label>
                <textarea value={form.opdracht_omschrijving} onChange={(e) => update('opdracht_omschrijving', e.target.value)} placeholder="Beschrijf de stageopdracht..." rows={3} className={`${inputClass} resize-none`} />
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Startdatum</label>
                  <input type="date" value={form.startdatum} onChange={(e) => update('startdatum', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Einddatum</label>
                  <input type="date" value={form.einddatum} onChange={(e) => update('einddatum', e.target.value)} className={inputClass} />
                </div>
              </div>
            </div>

            <Link href="/admin/stage" className="text-sm text-gray-500 hover:text-gray-900 mb-4">
              ← Terug naar overzicht
            </Link>
          </div>

          {/* Rechterkolom */}
          <div className="w-72 flex flex-col gap-6">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-1">Docent</h3>
              <p className="text-xs text-gray-400 mb-4">De docent die de student zal opvolgen tijdens de stage.</p>
              <label className="text-xs text-gray-400 block mb-1">Docent voor deze stage</label>
              <select value={form.docent_id} onChange={(e) => update('docent_id', e.target.value)} className={inputClass}>
                <option value="">Selecteer docent</option>
                {docenten.map((d) => (
                  <option key={d.id} value={d.id}>{d.voornaam} {d.achternaam}</option>
                ))}
              </select>
            </div>

            <div className="bg-orange-50 rounded-xl border border-orange-100 p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-4">Bevestigen</h3>
              <p className="text-xs text-gray-400 mb-4">De stage wordt aangemaakt met status <span className="font-medium">ingediend</span>.</p>
              <button onClick={handleBevestigen} disabled={bezig} className="w-full py-2.5 rounded-lg text-sm font-medium text-white bg-[#1A2E4A] hover:bg-[#152438] disabled:opacity-50 transition-colors">
                {bezig ? 'Bezig...' : 'Bevestigen'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}