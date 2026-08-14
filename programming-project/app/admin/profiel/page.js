'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Topbar from '../component/topbar';
import { fetchMetAuth } from '@/app/lib/fetchMetAuth';

export default function ProfielPage() {
  const router = useRouter();
  const [gebruiker, setGebruiker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [vorig, setVorig] = useState('');
  const [nieuw, setNieuw] = useState('');
  const [bevestig, setBevestig] = useState('');
  const [bericht, setBericht] = useState('');
  const [fout, setFout] = useState('');

  useEffect(() => {
    fetchMetAuth('/api/user/profiel')
      .then(res => res?.json())
      .then(data => { if (data) setGebruiker(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleOpslaan = async (e) => {
    e.preventDefault();
    setFout(''); setBericht('');
    if (!vorig || !nieuw || !bevestig) { setFout('Vul alle velden in.'); return; }
    if (nieuw !== bevestig) { setFout('De nieuwe wachtwoorden komen niet overeen.'); return; }
    const response = await fetchMetAuth('/api/user/profiel', {
      method: 'PUT',
      body: JSON.stringify({ huidigWachtwoord: vorig, nieuwWachtwoord: nieuw })
    });
    if (!response) return;
    const data = await response.json();
    if (!response.ok) { setFout(data.fout); } 
    else { setBericht('Wachtwoord succesvol gewijzigd!'); setVorig(''); setNieuw(''); setBevestig(''); }
  };

  const handleUitloggen = () => {
    document.cookie = 'token=; path=/; max-age=0';
    document.cookie = 'rol=; path=/; max-age=0';
    router.push('/authentificator/login');
  };

  const inputClass = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1A2E4A]";

  if (loading) return <div className="flex-1 flex items-center justify-center bg-gray-50"><div className="text-sm text-gray-400">Laden...</div></div>;

  return (
    <main className="flex-1 flex flex-col">
      <Topbar title="Profiel" />
      <div className="flex-1 p-6 bg-gray-50 overflow-y-auto">
        <div className="max-w-2xl flex flex-col gap-4">

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#B5D4F4] text-[#0C447C] grid place-items-center text-xl font-bold flex-shrink-0">
              {gebruiker?.voornaam?.[0]}{gebruiker?.achternaam?.[0]}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{gebruiker?.voornaam} {gebruiker?.achternaam}</h2>
              <p className="text-sm text-gray-400">Admin · Erasmushogeschool Brussel</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Persoonlijke gegevens</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              {[
                { label: 'Voornaam', waarde: gebruiker?.voornaam },
                { label: 'Achternaam', waarde: gebruiker?.achternaam },
                { label: 'E-mailadres', waarde: gebruiker?.email },
                { label: 'Telefoon', waarde: gebruiker?.telefoon },
                { label: 'Functie', waarde: 'Admin' },
                { label: 'School', waarde: 'Erasmushogeschool Brussel' },
              ].map(item => (
                <div key={item.label}>
                  <p className="text-xs text-gray-400 mb-1">{item.label}</p>
                  <p className="text-sm font-medium text-gray-900">{item.waarde || '—'}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Wachtwoord wijzigen</h3>
            <form onSubmit={handleOpslaan} className="flex flex-col gap-3">
              <div><label className="text-xs text-gray-400 block mb-1">Huidig wachtwoord</label><input type="password" value={vorig} onChange={e => setVorig(e.target.value)} placeholder="Uw huidig wachtwoord" className={inputClass} /></div>
              <div><label className="text-xs text-gray-400 block mb-1">Nieuw wachtwoord</label><input type="password" value={nieuw} onChange={e => setNieuw(e.target.value)} placeholder="Kies een nieuw wachtwoord" className={inputClass} /></div>
              <div><label className="text-xs text-gray-400 block mb-1">Bevestig nieuw wachtwoord</label><input type="password" value={bevestig} onChange={e => setBevestig(e.target.value)} placeholder="Herhaal uw nieuw wachtwoord" className={inputClass} /></div>
              {fout && <p className="text-red-500 text-xs">{fout}</p>}
              {bericht && <p className="text-green-500 text-xs">{bericht}</p>}
              <div><button type="submit" className="px-5 py-2 bg-[#1A2E4A] text-white text-sm rounded-lg font-medium hover:bg-[#152438]">Wachtwoord opslaan</button></div>
            </form>
          </div>

          <div>
            <button onClick={handleUitloggen} className="px-4 py-2 bg-white border border-red-200 text-red-500 text-sm rounded-lg font-medium hover:bg-red-50 flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Uitloggen
            </button>
          </div>

        </div>
      </div>
    </main>
  );
}