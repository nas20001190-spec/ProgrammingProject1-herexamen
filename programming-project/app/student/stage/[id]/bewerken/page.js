'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Topbar from '../../../component/topbar'
import { fetchMetAuth } from '@/app/lib/fetchMetAuth'

export default function StageBewerken() {
  const router = useRouter()
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState('')
  const [student, setStudent] = useState(null)

  const [bedrijf, setBedrijf] = useState({
    naam: '', adres: '', sector: '', website: '', telefoon: ''
  })
  const [mentor, setMentor] = useState({
    naam: '', functie: '', email: '', telefoon: ''
  })
  const [opdracht, setOpdracht] = useState({
    omschrijving: '', startdatum: '', einddatum: ''
  })
  const [commentaar, setCommentaar] = useState('')

  useEffect(() => {
    fetchMetAuth('/api/user/profiel')
      .then(res => res?.json())
      .then(data => { if (data && !data.fout) setStudent(data) })
      .catch(() => {})

    fetchMetAuth(`/api/student/stage/${id}`)
      .then(res => res?.json())
      .then(data => {
        if (data && !data.fout) {
          setBedrijf({
            naam: data.bedrijf_naam || '',
            adres: data.bedrijf_adres || '',
            sector: data.sector || '',
            website: data.website || '',
            telefoon: data.bedrijf_telefoon || '',
          })
          setMentor({
            naam: `${data.mentor_voornaam || ''} ${data.mentor_achternaam || ''}`.trim(),
            functie: data.mentor_functie || '',
            email: data.mentor_email || '',
            telefoon: data.mentor_telefoon || '',
          })
          setOpdracht({
            omschrijving: data.opdracht_omschrijving || '',
            startdatum: data.startdatum ? data.startdatum.slice(0, 10) : '',
            einddatum: data.einddatum ? data.einddatum.slice(0, 10) : '',
          })
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  const handleOpslaan = async (e) => {
    e.preventDefault()
    setFout('')

    if (!bedrijf.naam || !bedrijf.adres || !mentor.naam || !mentor.email || !opdracht.omschrijving || !opdracht.startdatum || !opdracht.einddatum) {
      setFout('Vul alle verplichte velden in!')
      return
    }

    if (!window.confirm('Aanpassingen indienen?')) return

    setBezig(true)
    const response = await fetchMetAuth(`/api/student/stage/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        actie: 'aanpassen',
        commentaar_student: commentaar,
        bedrijf_naam: bedrijf.naam,
        bedrijf_adres: bedrijf.adres,
        bedrijf_sector: bedrijf.sector,
        bedrijf_website: bedrijf.website,
        bedrijf_telefoon: bedrijf.telefoon,
        mentor_naam: mentor.naam,
        mentor_functie: mentor.functie,
        mentor_email: mentor.email,
        mentor_telefoon: mentor.telefoon,
        opdracht_omschrijving: opdracht.omschrijving,
        startdatum: opdracht.startdatum,
        einddatum: opdracht.einddatum,
      })
    })

    if (!response) { setBezig(false); return }
    const data = await response.json()
    if (response.ok) {
      alert('Aanpassingen ingediend!')
      router.push('/student/stage')
    } else {
      setFout(data.fout || 'Er ging iets mis')
      setBezig(false)
    }
  }

  const inputStyle = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
  const labelStyle = "block text-xs text-gray-500 mb-1"

  if (loading) return <div className="flex-1 flex items-center justify-center bg-gray-100"><div className="text-sm text-gray-400">Laden...</div></div>

  return (
    <div className="flex-1 flex flex-col">
      <Topbar titel="Stageaanvraag aanpassen" subtitel="Dashboard › Stageaanvraag aanpassen" />
      <div className="flex-1 bg-gray-100 p-6 overflow-y-auto">

        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4 text-sm text-orange-800">
          De admin heeft aanpassingen gevraagd. Pas je aanvraag aan en dien opnieuw in.
        </div>

        <form onSubmit={handleOpslaan} className="space-y-4">

          {/* Jouw gegevens */}
          <div className="bg-white rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-[#1e3a5f] text-white text-xs flex items-center justify-center font-bold">1</div>
              <h2 className="font-semibold text-gray-800">Jouw gegevens</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelStyle}>Naam</label>
                <input className={`${inputStyle} bg-gray-50`} value={student ? `${student.voornaam} ${student.achternaam}` : 'Laden...'} disabled />
              </div>
              <div>
                <label className={labelStyle}>E-mailadres</label>
                <input className={`${inputStyle} bg-gray-50`} value={student?.email || 'Laden...'} disabled />
              </div>
            </div>
          </div>

          {/* Bedrijfsgegevens */}
          <div className="bg-white rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-[#1e3a5f] text-white text-xs flex items-center justify-center font-bold">2</div>
              <h2 className="font-semibold text-gray-800">Bedrijfsgegevens</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelStyle}>Bedrijfsnaam *</label>
                <input className={inputStyle} value={bedrijf.naam} onChange={e => setBedrijf({...bedrijf, naam: e.target.value})} />
              </div>
              <div>
                <label className={labelStyle}>Adres *</label>
                <input className={inputStyle} value={bedrijf.adres} onChange={e => setBedrijf({...bedrijf, adres: e.target.value})} />
              </div>
              <div>
                <label className={labelStyle}>Sector</label>
                <input className={inputStyle} value={bedrijf.sector} onChange={e => setBedrijf({...bedrijf, sector: e.target.value})} />
              </div>
              <div>
                <label className={labelStyle}>Website</label>
                <input className={inputStyle} value={bedrijf.website} onChange={e => setBedrijf({...bedrijf, website: e.target.value})} />
              </div>
              <div className="col-span-2">
                <label className={labelStyle}>Telefoonnummer</label>
                <input className={inputStyle} value={bedrijf.telefoon} onChange={e => setBedrijf({...bedrijf, telefoon: e.target.value})} />
              </div>
            </div>
          </div>

          {/* Stagementor */}
          <div className="bg-white rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-[#1e3a5f] text-white text-xs flex items-center justify-center font-bold">3</div>
              <h2 className="font-semibold text-gray-800">Stagementor</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelStyle}>Naam mentor *</label>
                <input className={inputStyle} value={mentor.naam} onChange={e => setMentor({...mentor, naam: e.target.value})} />
              </div>
              <div>
                <label className={labelStyle}>Functie</label>
                <input className={inputStyle} value={mentor.functie} onChange={e => setMentor({...mentor, functie: e.target.value})} />
              </div>
              <div>
                <label className={labelStyle}>E-mail mentor *</label>
                <input className={inputStyle} value={mentor.email} onChange={e => setMentor({...mentor, email: e.target.value})} />
              </div>
              <div>
                <label className={labelStyle}>Telefoonnummer mentor</label>
                <input className={inputStyle} value={mentor.telefoon} onChange={e => setMentor({...mentor, telefoon: e.target.value})} />
              </div>
            </div>
          </div>

          {/* Opdracht & periode */}
          <div className="bg-white rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-[#1e3a5f] text-white text-xs flex items-center justify-center font-bold">4</div>
              <h2 className="font-semibold text-gray-800">Stageopdracht & periode</h2>
            </div>
            <div className="mb-3">
              <label className={labelStyle}>Omschrijving van de opdracht *</label>
              <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 h-24 resize-none" value={opdracht.omschrijving} onChange={e => setOpdracht({...opdracht, omschrijving: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelStyle}>Startdatum *</label>
                <input type="date" className={inputStyle} value={opdracht.startdatum} onChange={e => setOpdracht({...opdracht, startdatum: e.target.value})} />
              </div>
              <div>
                <label className={labelStyle}>Einddatum *</label>
                <input type="date" className={inputStyle} value={opdracht.einddatum} onChange={e => setOpdracht({...opdracht, einddatum: e.target.value})} />
              </div>
            </div>
          </div>

          {/* Commentaar */}
          <div className="bg-white rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-[#1e3a5f] text-white text-xs flex items-center justify-center font-bold">5</div>
              <h2 className="font-semibold text-gray-800">Commentaar voor de admin</h2>
            </div>
            <textarea
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 h-24 resize-none"
              placeholder="Leg uit wat je hebt aangepast en waarom..."
              value={commentaar}
              onChange={e => setCommentaar(e.target.value)}
            />
          </div>

          {fout && <div className="bg-red-50 text-red-600 border border-red-200 rounded-lg p-3 text-sm">{fout}</div>}

          <div className="flex items-center justify-between pb-6">
            <button type="button" onClick={() => router.push('/student/stage')} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
              ← Annuleren
            </button>
            <button type="submit" disabled={bezig} className="px-5 py-2 text-sm bg-[#1e3a5f] text-white rounded-lg hover:bg-[#162d4a] font-medium disabled:opacity-50">
              {bezig ? 'Bezig...' : 'Aanpassingen indienen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}