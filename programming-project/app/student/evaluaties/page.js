'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Topbar from '../component/topbar'
import { fetchMetAuth } from '@/app/lib/fetchMetAuth'

export default function Evaluaties() {
  const router = useRouter()
  const [evaluaties, setEvaluaties] = useState([])
  const [loading, setLoading] = useState(true)
  const [actieveTab, setActieveTab] = useState('tussentijds')
  const [stage, setStage] = useState(null)

  useEffect(() => {
    Promise.all([
      fetchMetAuth('/api/student/evaluaties').then(r => r?.json()),
      fetchMetAuth('/api/student/stage').then(r => r?.json()),
    ]).then(([evalData, stageData]) => {
      setEvaluaties(evalData ?? [])
      const actief = stageData?.find(s => s.status === 'actief')
      if (actief) setStage(actief)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const tussentijdse = evaluaties.filter(e => e.type === 'tussentijds')
  const finale = evaluaties.filter(e => e.type === 'finaal')

  const statusBadge = (status) => {
    const map = {
      open: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      ingevuld: 'bg-blue-50 text-blue-700 border-blue-200',
      mentor_beoordeelt: 'bg-orange-50 text-orange-700 border-orange-200',
      voltooid: 'bg-green-50 text-green-700 border-green-200',
    }
    const labels = {
      open: 'Open',
      ingevuld: 'Ingevuld',
      mentor_beoordeelt: 'Mentor beoordeelt',
      voltooid: 'Voltooid',
    }
    return <span className={`text-xs px-2 py-1 rounded-full font-medium border ${map[status] || map.open}`}>{labels[status] || status}</span>
  }

  if (loading) return <div className="flex-1 flex items-center justify-center bg-gray-100"><div className="text-sm text-gray-400">Laden...</div></div>

  const renderLijst = (lijst) => {
    if (lijst.length === 0) return (
      <div className="bg-white rounded-xl p-8 text-center">
        <p className="text-sm text-gray-400">Geen evaluatie gevonden.</p>
      </div>
    )

    return lijst.map(e => (
      <div key={e.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-4">
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-gray-900 capitalize">{e.type} evaluatie</p>
            <p className="text-xs text-gray-400 mt-0.5">{e.datum ? new Date(e.datum + 'T12:00:00').toLocaleDateString('nl-BE') : '—'}</p>
          </div>
          <div className="flex items-center gap-3">
            {statusBadge(e.status)}
            <button
              onClick={() => router.push(`/student/evaluaties/${e.id}`)}
              className="px-3 py-1.5 bg-[#1e3a5f] text-white text-xs rounded-lg cursor-pointer"
            >
              {e.status === 'open' ? 'Invullen' : 'Bekijken'}
            </button>
          </div>
        </div>
        {e.algemene_feedback_docent && (
          <div className="px-5 pb-4">
            <p className="text-xs text-gray-400 mb-1">Feedback docent</p>
            <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{e.algemene_feedback_docent}</p>
          </div>
        )}
      </div>
    ))
  }

  return (
    <div className="flex-1 flex flex-col">
      <Topbar titel="Evaluaties" subtitel={stage?.bedrijf_naam ?? 'Stage'} />
      <div className="flex-1 bg-gray-100 p-6">
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          {[{ id: 'tussentijds', label: 'Tussentijds' }, { id: 'finaal', label: 'Finaal' }].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActieveTab(tab.id)}
              className={`pb-3 text-sm font-medium border-b-2 cursor-pointer ${
                actieveTab === tab.id ? 'border-[#1e3a5f] text-[#1e3a5f]' : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {actieveTab === 'tussentijds' && renderLijst(tussentijdse)}
        {actieveTab === 'finaal' && renderLijst(finale)}
      </div>
    </div>
  )
}