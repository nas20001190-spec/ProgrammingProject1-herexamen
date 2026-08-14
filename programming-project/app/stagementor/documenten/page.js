'use client';

import { useEffect, useState } from 'react';
import Topbar from '../component/topbar';
import { FileText, Download } from 'lucide-react';
import { fetchMetAuth } from '@/app/lib/fetchMetAuth';

export default function DocumentenPage() {
  const [stagiairs, setStagiairs] = useState([]);
  const [overeenkomsten, setOvereenkomsten] = useState({});
  const [loading, setLoading] = useState(true);
  const [bezig, setBezig] = useState({});

  useEffect(() => {
    fetchMetAuth('/api/stagementor/stagiairs')
      .then(res => res?.json())
      .then(async data => {
        if (data) {
          setStagiairs(data);
          // laad overeenkomst status per stagiair
          const statusMap = {}
          for (const s of data) {
            const r = await fetchMetAuth(`/api/stagementor/documenten/ondertekenen?stage_id=${s.stage_id}`)
            const d = await r?.json()
            if (d && !d.fout) statusMap[s.stage_id] = d
          }
          setOvereenkomsten(statusMap)
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleOndertekenen = async (stage_id) => {
    setBezig(prev => ({ ...prev, [stage_id]: true }))
    const response = await fetchMetAuth('/api/stagementor/documenten/ondertekenen', {
      method: 'PUT',
      body: JSON.stringify({ stage_id }),
    });
    if (response?.ok) {
      const refresh = await fetchMetAuth(`/api/stagementor/documenten/ondertekenen?stage_id=${stage_id}`)
      const refreshData = await refresh?.json()
      if (refreshData && !refreshData.fout) {
        setOvereenkomsten(prev => ({ ...prev, [stage_id]: refreshData }))
      }
    } else {
      alert('Er is een fout opgetreden.');
    }
    setBezig(prev => ({ ...prev, [stage_id]: false }))
  };

  const handleDownload = (stage_id) => {
    window.open(`/api/admin/stages/${stage_id}/pdf`, '_blank')
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-100">
        <div className="text-sm text-gray-400">Laden...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <Topbar titel="Documenten" subtitel="2025-2026 · Erasmushogeschool Brussel" />
      <div className="flex-1 bg-gray-100 p-6 space-y-4">
        {stagiairs.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center">
            <p className="text-sm text-gray-400">Geen stagiairs gevonden.</p>
          </div>
        ) : (
          stagiairs.map((s) => {
            const ov = overeenkomsten[s.stage_id]
            return (
              <div key={s.stage_id}>
                <p className="text-xs font-semibold text-gray-400 mb-2">{s.voornaam} {s.achternaam}</p>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#1e3a5f] rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Stageovereenkomst</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                            ov?.signed_student && ov?.signed_stagementor
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : ov?.signed_stagementor
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                          }`}>
                            {ov?.signed_student && ov?.signed_stagementor
                              ? 'Volledig ondertekend'
                              : ov?.signed_stagementor
                              ? 'Jij hebt ondertekend — wacht op student'
                              : 'Wacht op ondertekening'}
                          </span>
                          {ov?.signed_student ? (
                            <span className="text-xs text-green-600">✓ Student ondertekend</span>
                          ) : (
                            <span className="text-xs text-gray-400">Student nog niet ondertekend</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!ov?.signed_stagementor && (
                        <button
                          onClick={() => handleOndertekenen(s.stage_id)}
                          disabled={bezig[s.stage_id]}
                          className="px-3 py-1.5 bg-[#1e3a5f] text-white text-xs rounded-lg cursor-pointer font-medium disabled:opacity-50"
                        >
                          {bezig[s.stage_id] ? 'Bezig...' : 'Ondertekenen'}
                        </button>
                      )}
                      <button
                        onClick={() => handleDownload(s.stage_id)}
                        className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 text-gray-600 text-xs rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        <Download size={14} />
                        Download PDF
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  );
}