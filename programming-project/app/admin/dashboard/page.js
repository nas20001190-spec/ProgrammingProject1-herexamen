'use client';

import { useEffect, useState } from 'react';
import Topbar from '../component/topbar';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchMetAuth } from '@/app/lib/fetchMetAuth';

export default function DashboardPage() {
  const router = useRouter()
  const [gebruiker, setGebruiker] = useState(null);
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = document.cookie.split('; ').find(r => r.startsWith('token='))?.split('=')[1]
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        setGebruiker(payload)
      } catch {}
    }

    fetchMetAuth('/api/admin/stages')
      .then(res => res?.json())
      .then(data => {
        if (Array.isArray(data)) setStages(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const teBeoordelen = stages.filter(s => s.status === 'ingediend').length
  const aanpassingen = stages.filter(s => s.status === 'aanpassingen').length
  const actief = stages.filter(s => s.status === 'actief').length
  const overeenkomstOntbreekt = stages.filter(s => s.status === 'actief' && !s.signed_student && !s.signed_stagementor).length
  const openstaand = stages.filter(s => s.status === 'ingediend')

  const stats = [
    { label: 'Te beoordelen', value: teBeoordelen, href: '/admin/stage', linkText: 'Bekijk aanvragen →' },
    { label: 'Aanpassingen gevraagd', value: aanpassingen, href: '/admin/stage', linkText: 'Bekijk →' },
    { label: 'Overeenkomst ontbreekt', value: overeenkomstOntbreekt, href: '/admin/overeenkomsten', linkText: 'Bekijk →' },
    { label: 'Actieve stages', value: actief, href: '/admin/stage', linkText: 'Bekijk →' },
  ]

  if (loading) return <div className="flex-1 flex items-center justify-center bg-gray-50"><div className="text-sm text-gray-400">Laden...</div></div>

  return (
    <main className="flex-1 flex flex-col">
      <Topbar title="Dashboard" />
      <div className="flex-1 p-6 bg-gray-50">

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Welkom terug, {gebruiker?.voornaam ?? 'Admin'}</h2>
          {teBeoordelen > 0 && (
            <span className="bg-orange-50 text-orange-500 text-xs font-medium px-3 py-1.5 rounded-full border border-orange-100">
              {teBeoordelen} aanvraag{teBeoordelen > 1 ? 'en' : ''} te beoordelen
            </span>
          )}
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          {stats.map(stat => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs text-gray-400 mb-2">{stat.label}</p>
              <p className="text-3xl font-bold text-gray-900 mb-3">{stat.value}</p>
              <Link href={stat.href} className="text-xs text-blue-600 font-medium hover:underline">{stat.linkText}</Link>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">Openstaande aanvragen</h3>
              <Link href="/admin/stage" className="text-xs text-blue-600 font-medium hover:underline">Alles bekijken</Link>
            </div>
            {openstaand.length === 0 ? (
              <p className="text-sm text-gray-400">Geen openstaande aanvragen.</p>
            ) : (
              openstaand.slice(0, 3).map(s => (
                <div key={s.id} className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{s.student_voornaam} {s.student_achternaam}</p>
                    <p className="text-xs text-gray-400">{s.bedrijf_naam}</p>
                  </div>
                  <span className="bg-orange-50 text-orange-500 text-xs font-semibold px-2.5 py-1 rounded-full">Ingediend</span>
                </div>
              ))
            )}
            <Link href="/admin/stage" className="block mt-4 w-full bg-[#1A2E4A] text-white text-sm text-center py-2.5 rounded-lg font-medium hover:bg-[#152438]">
              → Aanvraag beoordelen
            </Link>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 border border-gray-200 rounded-xl flex items-center justify-center mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Stage handmatig registreren</h3>
            <p className="text-xs text-gray-400 mb-5 max-w-xs">Maak een stage aan wanneer een student buiten het portaal heeft aangemeld.</p>
            <Link href="/admin/stage/nieuw" className="block w-full bg-[#1A2E4A] text-white text-sm text-center py-2.5 rounded-lg font-medium hover:bg-[#152438]">
              → Stage aanmaken
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-3 rounded-xl overflow-hidden border border-gray-100 shadow-sm">
          <div className="bg-white px-5 py-4 border-r border-gray-100">
            <p className="text-xs text-gray-400 mb-1">Admin</p>
            <p className="text-sm font-semibold text-gray-900">{gebruiker?.voornaam} {gebruiker?.achternaam}</p>
          </div>
          <div className="bg-white px-5 py-4 border-r border-gray-100">
            <p className="text-xs text-gray-400 mb-1">E-mail</p>
            <p className="text-sm font-semibold text-gray-900">{gebruiker?.email}</p>
          </div>
          <div className="bg-white px-5 py-4">
            <p className="text-xs text-gray-400 mb-1">Rol</p>
            <p className="text-sm font-semibold text-gray-900">Stagecommissie / Admin</p>
          </div>
        </div>

      </div>
    </main>
  )
}