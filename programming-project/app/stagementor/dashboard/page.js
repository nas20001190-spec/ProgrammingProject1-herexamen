'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Topbar from '../component/topbar';
import { ChevronRight, BookOpen, Star, Users } from 'lucide-react';
import { fetchMetAuth } from '@/app/lib/fetchMetAuth';

export default function StagementorDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [stagiairs, setStagiairs] = useState([]);
  const [logboekenCount, setLogboekenCount] = useState(0);
  const [evaluatiesCount, setEvaluatiesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = document.cookie.split('; ').find(r => r.startsWith('token='))?.split('=')[1]
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        setUser(payload)
      } catch {}
    }

    Promise.all([
      fetchMetAuth('/api/stagementor/stagiairs').then(r => r?.json()),
      fetchMetAuth('/api/stagementor/logboeken').then(r => r?.json()),
      fetchMetAuth('/api/stagementor/evaluaties').then(r => r?.json()),
    ]).then(([stagiairsData, logboekenData, evaluatiesData]) => {
      setStagiairs(stagiairsData ?? [])

      // logboeken ingediend maar nog niet goedgekeurd
      const weken = logboekenData?.weken ?? []
      setLogboekenCount(weken.filter(w => w.status === 'ingediend').length)

      // evaluaties open
      const evaluaties = Array.isArray(evaluatiesData) ? evaluatiesData : []
      setEvaluatiesCount(evaluaties.filter(e => e.status === 'open' || e.status === 'ingevuld').length)

      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const getInitials = (voornaam, achternaam) => {
    return `${voornaam?.[0] ?? ''}${achternaam?.[0] ?? ''}`.toUpperCase();
  };

  if (loading) return <div className="flex-1 flex items-center justify-center bg-gray-100"><div className="text-sm text-gray-400">Laden...</div></div>

  return (
    <div className="flex-1 flex flex-col">
      <Topbar titel="Dashboard" subtitel="2025-2026 · Erasmushogeschool Brussel" />

      <div className="flex-1 bg-gray-100 p-6 flex flex-col gap-4">

        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welkom terug, {user?.voornaam ?? '...'}
          </h1>
          <p className="text-sm text-gray-400 mt-1">Overzicht van uw stagiairs</p>
        </div>

        <p className="text-xs font-semibold text-gray-400">Mijn stagiairs</p>

        {stagiairs.length === 0 ? (
          <div className="bg-white rounded-xl p-8 flex flex-col items-center gap-2">
            <div className="w-12 h-12 bg-gray-100 rounded-full grid place-items-center mb-1">
              <Users className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm font-semibold text-gray-600">Geen stagiairs toegewezen</p>
            <p className="text-xs text-gray-400">U heeft momenteel geen actieve stagiairs</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {stagiairs.map((s, i) => (
              <div
                key={s.stage_id}
                onClick={() => router.push('/stagementor/logboeken')}
                className={`flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 ${
                  i < stagiairs.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#dbeafe] grid place-items-center text-xs font-bold text-[#1d4ed8] flex-shrink-0">
                    {getInitials(s.voornaam, s.achternaam)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{s.voornaam} {s.achternaam}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Stage loopt · Docent: {s.docent_voornaam} {s.docent_achternaam}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div
            onClick={() => router.push('/stagementor/logboeken')}
            className="bg-white rounded-xl border border-gray-100 shadow-sm flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#1e3a5f] grid place-items-center rounded-lg flex-shrink-0">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Logboeken te keuren</p>
                <p className="text-2xl font-bold text-gray-900">{logboekenCount}</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>

          <div
            onClick={() => router.push('/stagementor/evaluaties')}
            className="bg-white rounded-xl border border-gray-100 shadow-sm flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#1e3a5f] grid place-items-center rounded-lg flex-shrink-0">
                <Star className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Evaluaties te doen</p>
                <p className="text-2xl font-bold text-gray-900">{evaluatiesCount}</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
        </div>

      </div>
    </div>
  );
}