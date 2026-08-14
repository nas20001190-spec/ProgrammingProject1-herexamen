'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Topbar from '../component/topbar';
import { fetchMetAuth } from '@/app/lib/fetchMetAuth';

const filters = ['Alle', 'Te beoordelen', 'Aanpassingen', 'Goedgekeurd', 'Actief', 'Afgekeurd'];

const statusKleur = (status) => {
  switch (status) {
    case 'ingediend': return '#92400E';
    case 'aanpassingen': return '#9A3412';
    case 'goedgekeurd': return '#065F46';
    case 'actief': return '#1E40AF';
    case 'afgekeurd': return '#DC2626';
    default: return '#64748B';
  }
};

export default function StagePage() {
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actieveFilter, setActieveFilter] = useState('Alle');

  useEffect(() => {
    fetchMetAuth('/api/admin/stages')
      .then(res => res?.json())
      .then(data => {
        if (data) setStages(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const gefilterd = actieveFilter === 'Alle'
    ? stages
    : actieveFilter === 'Te beoordelen'
    ? stages.filter(s => s.status === 'ingediend')
    : stages.filter(s => s.status === actieveFilter.toLowerCase());

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

      <div className="flex-1 p-6 bg-gray-50">

        <div className="flex justify-end mb-6">
          <Link href="/admin/stage/nieuw" className="bg-[#1A2E4A] text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-[#152438]">
            + Nieuwe stage
          </Link>
        </div>

        <div className="flex gap-2 mb-6">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActieveFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                actieveFilter === f
                  ? 'bg-[#1A2E4A] text-white border-[#1A2E4A]'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">Student</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">Bedrijf</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">Mentor</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">Periode</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">Status</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-400"></th>
              </tr>
            </thead>
            <tbody>
              {gefilterd.map((s) => (
                <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4 font-medium text-gray-900">{s.student_voornaam} {s.student_achternaam}</td>
                  <td className="px-5 py-4 text-gray-600">{s.bedrijf_naam}</td>
                  <td className="px-5 py-4 text-gray-600">{s.mentor_voornaam} {s.mentor_achternaam}</td>
                  <td className="px-5 py-4 text-gray-600">
                    {new Date(s.startdatum).toLocaleDateString('nl-BE')} – {new Date(s.einddatum).toLocaleDateString('nl-BE')}
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm" style={{ color: statusKleur(s.status) }}>
                      {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link href={`/admin/stage/${s.id}`} className="text-sm text-blue-600 hover:underline font-medium">
                      Detail
                    </Link>
                  </td>
                </tr>
              ))}
              {gefilterd.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-gray-400">
                    Geen stages gevonden voor dit filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}