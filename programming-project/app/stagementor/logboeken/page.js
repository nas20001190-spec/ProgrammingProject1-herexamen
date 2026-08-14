'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Topbar from '../component/topbar';
import { fetchMetAuth } from '@/app/lib/fetchMetAuth';

export default function LogboekenPage() {
  const router = useRouter();
  const [logboeken, setLogboeken] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetAuth('/api/stagementor/logboeken')
      .then(res => res?.json())
      .then(data => {
        if (data?.weken) setLogboeken(data.weken);
        else if (Array.isArray(data)) setLogboeken(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const perStudent = logboeken.reduce((acc, l) => {
    const naam = `${l.student_voornaam} ${l.student_achternaam}`;
    if (!acc[naam]) acc[naam] = [];
    acc[naam].push(l);
    return acc;
  }, {});

  const fmt = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('nl-BE', {
      day: '2-digit', month: 'short', year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-100">
        <div className="text-sm text-gray-400">Laden...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <Topbar titel="Logboeken" subtitel="2025 - 2026" />

      <div className="flex-1 bg-gray-100 p-6 flex flex-col gap-6">
        {Object.keys(perStudent).length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl px-5 py-10 text-center">
            <p className="text-sm text-gray-400">Geen logboeken gevonden</p>
          </div>
        ) : (
          Object.entries(perStudent).map(([naam, weken]) => (
            <div key={naam}>
              <p className="text-xs text-gray-400 mb-2">{naam}</p>
              <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                {weken.map((l, i) => (
                  <div
                    key={l.id}
                    onClick={() => router.push(`/stagementor/logboeken/${l.id}`)}
                    className={`flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 ${
                      i < weken.length - 1 ? 'border-b border-gray-100' : ''
                    }`}
                  >
                    <div className="flex items-center gap-6">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Week {l.week_nummer}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {fmt(l.datum_van)} – {fmt(l.datum_tot)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-gray-800" />
                        <span className="text-xs text-gray-500">{l.totaal_uren}u gelogd</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full border ${
                        l.status === 'goedgekeurd' ? 'bg-green-50 text-green-700 border-green-200' :
                        l.status === 'ingediend' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                        l.status === 'afgekeurd' ? 'bg-red-50 text-red-700 border-red-200' :
                        'bg-gray-50 text-gray-400 border-gray-200'
                      }`}>
                        {l.status === 'goedgekeurd' ? 'Goedgekeurd' :
                         l.status === 'ingediend' ? 'Wacht op goedkeuring' :
                         l.status === 'afgekeurd' ? 'Afgekeurd' :
                         l.status}
                      </span>
                      <span className="text-gray-400 text-xs">▸</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}