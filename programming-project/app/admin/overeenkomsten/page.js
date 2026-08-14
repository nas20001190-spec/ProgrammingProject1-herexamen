'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Topbar from '../component/topbar';
import { fetchMetAuth } from '@/app/lib/fetchMetAuth';

export default function OvereenkomstenPage() {
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bewerkModus, setBewerkModus] = useState(false);
  const [geselecteerd, setGeselecteerd] = useState([]);

  useEffect(() => {
    fetchMetAuth('/api/admin/stages')
      .then(res => res?.json())
      .then(data => {
        if (data) setStages(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const toggleSelectie = (id) => {
    setGeselecteerd(prev =>
      prev.includes(id) ? prev.filter(n => n !== id) : [...prev, id]
    );
  };

  const getStatusKleur = (status) => {
    switch (status) {
      case 'actief': return '#1E40AF';
      case 'goedgekeurd': return '#065F46';
      case 'ingediend': return '#92400E';
      default: return '#6B7280';
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
      <Topbar title="Overeenkomsten" />

      <div className="flex-1 p-6 bg-gray-50">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Overeenkomstenoverzicht</h2>
            <p className="text-sm text-gray-400">Voeg toe, bewerk en verwijder één of meerdere overeenkomsten</p>
          </div>
          <div className="flex gap-2">
            {bewerkModus ? (
              <>
                <button
                  onClick={() => { setGeselecteerd([]); setBewerkModus(false); }}
                  className="bg-[#1A2E4A] text-white text-sm px-5 py-2 rounded-lg font-medium hover:bg-[#152438]"
                >
                  Voltooien
                </button>
              </>
            ) : (
              <button
                onClick={() => setBewerkModus(true)}
                className="bg-[#1A2E4A] text-white text-sm px-5 py-2 rounded-lg font-medium hover:bg-[#152438]"
              >
                Bewerken
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {bewerkModus && <th className="px-5 py-3 w-10"></th>}
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">Student</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">Bedrijf</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">Status stage</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">Overeenkomst</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-400">Actie</th>
              </tr>
            </thead>
            <tbody>
              {stages.map((s) => (
                <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  {bewerkModus && (
                    <td className="px-5 py-4">
                      <input
                        type="checkbox"
                        checked={geselecteerd.includes(s.id)}
                        onChange={() => toggleSelectie(s.id)}
                        className="w-4 h-4 accent-[#1A2E4A] cursor-pointer"
                      />
                    </td>
                  )}
                  <td className="px-5 py-4 font-medium text-gray-900">{s.student_voornaam} {s.student_achternaam}</td>
                  <td className="px-5 py-4 text-gray-600">{s.bedrijf_naam}</td>
                  <td className="px-5 py-4">
                    <span className="text-sm" style={{ color: getStatusKleur(s.status) }}>
                      {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm" style={{ color: '#065F46' }}>
                      Geregistreerd
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    {bewerkModus && (
                      <Link
                        href={`/admin/overeenkomsten/${s.id}`}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-500"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </main>
  );
}