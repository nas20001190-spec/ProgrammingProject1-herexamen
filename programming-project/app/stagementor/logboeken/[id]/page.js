'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Topbar from '../../component/topbar';
import { fetchMetAuth } from '@/app/lib/fetchMetAuth';

function fmt(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('nl-BE')
}

const DAGEN_NAMEN = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag']

export default function LogboekDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const [logboek, setLogboek] = useState(null);
  const [dagen, setDagen] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bezig, setBezig] = useState(false);
  const [geselecteerdeDag, setGeselecteerdeDag] = useState(null);

  useEffect(() => {
    fetchMetAuth('/api/stagementor/logboeken')
      .then(res => res?.json())
      .then(data => {
        if (!data) return;
        const gevonden = data.weken?.find(l => l.id === parseInt(id));
        const dagenVanWeek = data.dagen?.filter(d => d.logboek_week_id === parseInt(id)) ?? [];
        setLogboek(gevonden);
        setDagen(dagenVanWeek);
        if (dagenVanWeek.length > 0) setGeselecteerdeDag(dagenVanWeek[0]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const handleGoedkeuren = async (nieuweStatus) => {
    setBezig(true);
    const response = await fetchMetAuth('/api/stagementor/logboeken', {
      method: 'PUT',
      body: JSON.stringify({ id: parseInt(id), status: nieuweStatus }),
    });
    if (!response) { setBezig(false); return; }
    const data = await response.json();
    if (response.ok) {
      router.push('/stagementor/logboeken');
    } else {
      alert(data.fout);
      setBezig(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-100">
        <div className="text-sm text-gray-400">Laden...</div>
      </div>
    );
  }

  if (!logboek) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-100">
        <div className="text-sm text-gray-400">Logboek niet gevonden.</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <Topbar
        titel={`Logboek Week ${logboek.week_nummer}`}
        subtitel={`${logboek.student_voornaam} ${logboek.student_achternaam} · ${fmt(logboek.datum_van)} - ${fmt(logboek.datum_tot)}`}
      />

      <div className="flex-1 bg-gray-100 p-6 space-y-4">

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-400 mb-1">Student</p>
              <p className="text-sm font-medium">{logboek.student_voornaam} {logboek.student_achternaam}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Periode</p>
              <p className="text-sm font-medium">{fmt(logboek.datum_van)} – {fmt(logboek.datum_tot)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Totaal uren</p>
              <p className="text-sm font-medium">{logboek.totaal_uren}u</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Status</p>
              <p className={`text-sm font-medium ${
                logboek.status === 'goedgekeurd' ? 'text-green-600' :
                logboek.status === 'ingediend' ? 'text-yellow-600' :
                logboek.status === 'afgekeurd' ? 'text-red-600' :
                'text-gray-600'
              }`}>
                {logboek.status === 'goedgekeurd' ? 'Goedgekeurd' :
                 logboek.status === 'ingediend' ? 'Wacht op goedkeuring' :
                 logboek.status === 'afgekeurd' ? 'Afgekeurd' :
                 logboek.status}
              </p>
            </div>
          </div>
        </div>

        {dagen.length > 0 ? (
          <div className="grid grid-cols-3 gap-4">

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-2">
              <h3 className="text-xs font-semibold text-gray-400 mb-3">Dagen</h3>
              {dagen.map((dag) => {
                const dagNaam = DAGEN_NAMEN[new Date(dag.datum + 'T12:00:00').getDay() - 1] || dag.datum
                return (
                  <button
                    key={dag.id}
                    onClick={() => setGeselecteerdeDag(dag)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      geselecteerdeDag?.id === dag.id
                        ? 'bg-[#1e3a5f] text-white'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="font-medium">{dagNaam}</div>
                    <div className="text-xs opacity-70">{fmt(dag.datum)} · {dag.uren}u</div>
                  </button>
                )
              })}
            </div>

            {geselecteerdeDag && (
              <div className="col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
                <h3 className="text-sm font-semibold text-gray-800">
                  {DAGEN_NAMEN[new Date(geselecteerdeDag.datum + 'T12:00:00').getDay() - 1]} — {fmt(geselecteerdeDag.datum)} · {geselecteerdeDag.uren}u
                </h3>

                <div>
                  <p className="text-xs text-gray-400 mb-1">Uitgevoerde taken</p>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 leading-relaxed">
                    {geselecteerdeDag.uitgevoerde_taken || '—'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-400 mb-1">Reflectie</p>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 leading-relaxed">
                    {geselecteerdeDag.reflectie || '—'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-400 mb-1">Leerpunten / problemen</p>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 leading-relaxed">
                    {geselecteerdeDag.leerpunten || '—'}
                  </p>
                </div>

                {geselecteerdeDag.competenties && geselecteerdeDag.competenties.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-400 mb-2">Competenties aangetoond</p>
                    <div className="flex flex-wrap gap-2">
                      {geselecteerdeDag.competenties.map(c => (
                        <span key={c.id} className="text-xs px-3 py-1 rounded-full bg-[#eef2ff] text-[#1e3a5f] border border-[#c7d2e8]">
                          {c.naam}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-6 text-center text-sm text-gray-400">
            Geen dagverslagen gevonden voor deze week.
          </div>
        )}

        <div className="flex gap-3">
          {logboek.status === 'ingediend' && (
            <>
              <button
                onClick={() => handleGoedkeuren('goedgekeurd')}
                disabled={bezig}
                className="px-5 py-2 bg-green-600 text-white text-sm rounded-lg font-medium hover:bg-green-700 cursor-pointer disabled:opacity-50"
              >
                ✓ Goedkeuren
              </button>
              <button
                onClick={() => handleGoedkeuren('afgekeurd')}
                disabled={bezig}
                className="px-5 py-2 bg-red-600 text-white text-sm rounded-lg font-medium hover:bg-red-700 cursor-pointer disabled:opacity-50"
              >
                ✗ Afkeuren
              </button>
            </>
          )}
          <button
            onClick={() => router.push('/stagementor/logboeken')}
            className="px-5 py-2 bg-white border border-gray-200 text-gray-600 text-sm rounded-lg font-medium hover:bg-gray-50 cursor-pointer"
          >
            ← Terug
          </button>
        </div>

      </div>
    </div>
  );
}