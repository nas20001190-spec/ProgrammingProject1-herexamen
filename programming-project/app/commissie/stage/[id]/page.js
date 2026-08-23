'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Topbar from '../../component/topbar';
import { fetchMetAuth } from '@/app/lib/fetchMetAuth';

export default function CommissieStageDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [bezig, setBezig] = useState(false);
  const [status, setStatus] = useState('');
  const [feedback, setFeedback] = useState('');
  const [stage, setStage] = useState(null);

  useEffect(() => {
    if (!id) return;
    fetchMetAuth(`/api/commissie/stages/${id}`)
      .then(res => res?.json())
      .then(data => {
        if (data && !data.fout) {
          setStage(data);
          setStatus(data.status || '');
          setFeedback(data.feedback_commissie || '');
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const isGesloten = status === 'goedgekeurd' || status === 'actief' || status === 'afgekeurd';

  const verstuur = async (nieuweStatus) => {
    const teksten = {
      goedgekeurd: 'Weet u zeker dat u deze stage wilt goedkeuren?',
      aanpassingen: 'Aanpassingen vereist versturen?',
      afgekeurd: 'Weet u zeker dat u deze stage wilt afkeuren?',
    };
    if (!window.confirm(teksten[nieuweStatus])) return;

    setBezig(true);
    const response = await fetchMetAuth(`/api/commissie/stages/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: nieuweStatus, feedback_commissie: feedback }),
    });
    if (!response) { setBezig(false); return; }
    const data = await response.json();
    if (response.ok) {
      alert('Opgeslagen!');
      router.push('/commissie/stage');
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
      <Topbar title="Stage beoordelen" />

      <div className="flex-1 p-6 bg-gray-50 overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Stageaanvraag beoordelen</h2>
        <p className="text-sm text-gray-400 mb-6">Bekijk de aanvraag en neem een beslissing</p>

        <div className="flex gap-6">
          <div className="flex-1 flex flex-col gap-6">

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-sm font-semibold text-gray-500 mb-4">Studentgegevens</h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div><span className="text-gray-400">Naam: </span>{stage.student_voornaam} {stage.student_achternaam}</div>
                <div><span className="text-gray-400">E-mail: </span>{stage.student_email}</div>
                <div><span className="text-gray-400">Opleiding: </span>{stage.opleiding}</div>
                <div><span className="text-gray-400">Academiejaar: </span>{stage.academiejaar}</div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-sm font-semibold text-gray-500 mb-4">Bedrijf & mentor</h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div><span className="text-gray-400">Bedrijf: </span>{stage.bedrijf_naam}</div>
                <div><span className="text-gray-400">Sector: </span>{stage.sector}</div>
                <div><span className="text-gray-400">Adres: </span>{stage.bedrijf_adres}</div>
                <div><span className="text-gray-400">Website: </span>{stage.website}</div>
                <div><span className="text-gray-400">Mentor: </span>{stage.mentor_voornaam} {stage.mentor_achternaam}</div>
                <div><span className="text-gray-400">E-mail mentor: </span>{stage.mentor_email}</div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-sm font-semibold text-gray-500 mb-4">Opdracht & periode</h3>
              <p className="text-sm text-gray-700 mb-4">{stage.opdracht_omschrijving}</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div><span className="text-gray-400">Startdatum: </span>{stage.startdatum ? new Date(stage.startdatum).toLocaleDateString('nl-BE') : '—'}</div>
                <div><span className="text-gray-400">Einddatum: </span>{stage.einddatum ? new Date(stage.einddatum).toLocaleDateString('nl-BE') : '—'}</div>
                <div><span className="text-gray-400">Aantal weken: </span>{stage.aantal_weken ?? '—'}</div>
                <div><span className="text-gray-400">Uren per week: </span>{stage.uren_per_week ?? '—'}</div>
              </div>
            </div>

            <Link href="/commissie/stage" className="text-sm text-gray-500 hover:text-gray-900 mb-4">← Terug naar overzicht</Link>
          </div>

          <div className="w-72 flex flex-col gap-6">
            {!isGesloten ? (
              <div className="bg-orange-50 rounded-xl border border-orange-100 p-5">
                <h3 className="text-sm font-bold text-gray-900 mb-1">Beoordeling</h3>
                <p className="text-xs text-gray-400 mb-1">Huidige status: <span className="font-medium">{status}</span></p>
                <p className="text-xs text-gray-400 mb-4">Beoordeel de stageaanvraag</p>
                <label className="text-xs text-gray-500 block mb-2">Feedback (bij aanpassingen)</label>
                <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Geef duidelijke feedback..." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 mb-4 resize-none bg-white focus:outline-none focus:ring-2 focus:ring-[#1A2E4A] focus:border-transparent" rows={3} />
                <div className="flex flex-col gap-2">
                  <button onClick={() => verstuur('goedgekeurd')} disabled={bezig || feedback.trim().length > 0} className="w-full py-2.5 rounded-lg text-sm font-medium text-white bg-[#065F46] hover:bg-[#054F3B] disabled:opacity-50 transition-colors">Goedkeuren</button>
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