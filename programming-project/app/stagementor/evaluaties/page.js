'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Topbar from '../component/topbar';
import { fetchMetAuth } from '@/app/lib/fetchMetAuth';

export default function EvaluatiesPage() {
  const router = useRouter();
  const [evaluaties, setEvaluaties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetAuth('/api/stagementor/evaluaties')
      .then(res => res?.json())
      .then(data => {
        if (data) setEvaluaties(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const perStudent = evaluaties.reduce((acc, e) => {
    const naam = `${e.student_voornaam} ${e.student_achternaam}`;
    if (!acc[naam]) acc[naam] = [];
    acc[naam].push(e);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-100">
        <div className="text-sm text-gray-400">Laden...</div>
      </div>
    );
  }

  return (
    <div>
      <Topbar title="Evaluaties" subtitel="2025–2026" />

      <div className="p-6 flex flex-col gap-6">
        {Object.keys(perStudent).length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg px-5 py-10 text-center">
            <p className="text-sm text-gray-400">Geen evaluaties gevonden</p>
          </div>
        ) : (
          Object.entries(perStudent).map(([naam, evals]) => (
            <div key={naam}>
              <p className="text-xs text-gray-400 mb-2">{naam}</p>
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                {evals.map((e, i) => (
                  <div
                    key={e.id}
                    onClick={() => router.push(`/stagementor/evaluaties/${e.id}`)}
                    className={`flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 ${
                      i < evals.length - 1 ? 'border-b border-gray-100' : ''
                    }`}
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {e.type === 'tussentijds' ? 'Tussentijdse evaluatie' : 'Finale evaluatie'}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {e.datum ? new Date(e.datum).toLocaleDateString('nl-BE') : `Verwacht rond week ${e.week_nummer}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-medium ${
                        e.status === 'voltooid' ? 'text-[#3B6D11]' :
                        e.status === 'open' ? 'text-[#1d4ed8]' :
                        'text-[#854F0B]'
                      }`}>
                        {e.status === 'voltooid' ? 'Voltooid' :
                         e.status === 'open' ? 'Nog in te vullen' :
                         e.status}
                      </span>
                      <span className="text-black text-[10px]">▸</span>
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