'use client';

import { fetchMetAuth } from '@/app/lib/fetchMetAuth';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Topbar from '../component/topbar';

export default function StudentenPage() {
  const [studenten, setStudenten] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bewerkModus, setBewerkModus] = useState(false);
  const [geselecteerd, setGeselecteerd] = useState([]);

  useEffect(() => {
    fetchMetAuth('/api/admin/gebruikers')
      .then(res => res?.json())
      .then(data => {
        if (data) {
          setStudenten(data.filter(u => u.rol === 'student'));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const toggleSelectie = (id) => {
    setGeselecteerd(prev =>
      prev.includes(id) ? prev.filter(n => n !== id) : [...prev, id]
    );
  };

  const handleVerwijder = async () => {
    if (geselecteerd.length === 0) {
      alert('Selecteer minstens één student.');
      return;
    }

    if (window.confirm(`Weet u zeker dat u ${geselecteerd.length} student(en) wilt verwijderen?`)) {
      for (const id of geselecteerd) {
        await fetchMetAuth('/api/admin/gebruikers', {
          method: 'DELETE',
          body: JSON.stringify({ id })
        });
      }

      setStudenten(prev => prev.filter(s => !geselecteerd.includes(s.id)));
      setGeselecteerd([]);
      setBewerkModus(false);
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
      <Topbar title="Student" />

      <div className="flex-1 p-6 bg-gray-50">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Studentenoverzicht</h2>
            <p className="text-sm text-gray-400">Voeg toe, bewerk en verwijder één of meerdere student(en)</p>
          </div>
          <div className="flex gap-2">
            {bewerkModus ? (
              <>
                <button
                  onClick={handleVerwijder}
                  className="bg-[#DC2626] text-white text-sm px-5 py-2 rounded-lg font-medium hover:bg-[#B91C1C]"
                >
                  Verwijderen
                </button>
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
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">E-mail</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">Telefoon</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-400"></th>
              </tr>
            </thead>
            <tbody>
              {studenten.map((s) => (
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
                  <td className="px-5 py-4 font-medium text-gray-900">{s.voornaam} {s.achternaam}</td>
                  <td className="px-5 py-4 text-gray-600">{s.email}</td>
                  <td className="px-5 py-4 text-gray-600">{s.telefoon}</td>
                  <td className="px-5 py-4 text-right">
                    {bewerkModus && (
                      <Link
                        href={`/admin/studenten/${s.id}`}
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

        {bewerkModus && (
          <div className="flex justify-center mt-6">
            <Link
              href="/admin/studenten/nieuw"
              className="w-12 h-12 rounded-full bg-[#1A2E4A] text-white text-2xl font-light grid place-items-center hover:bg-[#152438] shadow-md"
            >
              +
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}