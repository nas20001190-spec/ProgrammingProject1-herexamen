"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Topbar from "../component/topbar";
import { fetchMetAuth } from "@/app/lib/fetchMetAuth";
import { Pencil, Trash2, Plus, X, Check, BookOpen } from "lucide-react";

export default function CompetentiesPage() {
  const router = useRouter();
  const [competenties, setCompetenties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bewerkId, setBewerkId] = useState(null);
  const [nieuwFormulier, setNieuwFormulier] = useState(false);

  const leegForm = {
    naam: "",
    omschrijving: "",
    gewicht: "",
  };
  const [form, setForm] = useState(leegForm);

  useEffect(() => {
    laadCompetenties();
  }, []);

  const laadCompetenties = () => {
    fetchMetAuth("/api/competenties")
      .then((res) => res?.json())
      .then((data) => {
        setCompetenties(data ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const totaalGewicht = competenties.reduce(
    (acc, c) => acc + (c.gewicht || 0),
    0,
  );

  const handleOpslaan = async () => {
    if (!form.naam || !form.gewicht) {
      alert("Naam en gewicht zijn verplicht.");
      return;
    }

    const nieuwGewicht = parseFloat(form.gewicht);
    const huidigTotaal = competenties
      .filter((c) => c.id !== bewerkId)
      .reduce((acc, c) => acc + (c.gewicht || 0), 0);

    if (huidigTotaal + nieuwGewicht > 100) {
      alert(
        `Het totale gewicht mag niet meer dan 100% zijn.\nHuidig totaal zonder deze competentie: ${huidigTotaal.toFixed(2)}%.\nMaximaal nog beschikbaar: ${(100 - huidigTotaal).toFixed(2)}%.`,
      );
      return;
    }

    const response = await fetchMetAuth("/api/competenties", {
      method: bewerkId ? "PUT" : "POST",
      body: JSON.stringify({
        id: bewerkId,
        naam: form.naam,
        omschrijving: form.omschrijving,
        gewicht: nieuwGewicht,
      }),
    });

    if (!response) return;
    const data = await response.json();
    if (response.ok) {
      laadCompetenties();
      setBewerkId(null);
      setNieuwFormulier(false);
      setForm(leegForm);
    } else {
      alert(data.fout || "Er ging iets mis");
    }
  };

  const handleBewerken = (c) => {
    setBewerkId(c.id);
    setNieuwFormulier(false);
    setForm({
      naam: c.naam,
      omschrijving: c.omschrijving || "",
      gewicht: c.gewicht,
    });
  };

  const handleVerwijderen = async (id) => {
    if (!window.confirm("Competentie verwijderen?")) return;
    const response = await fetchMetAuth("/api/competenties", {
      method: "DELETE",
      body: JSON.stringify({ id }),
    });
    if (response?.ok) {
      setCompetenties((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const handleAnnuleren = () => {
    setBewerkId(null);
    setNieuwFormulier(false);
    setForm(leegForm);
  };

  const inputClass =
    "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1A2E4A] focus:border-transparent";

  if (loading)
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-sm text-gray-400">Laden...</div>
      </div>
    );

  return (
    <main className="flex-1 flex flex-col">
      <Topbar title="Competenties" />

      <div className="flex-1 p-6 bg-gray-50 overflow-y-auto">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              Competenties beheren
            </h2>
            <p className="text-sm text-gray-400">
              Voeg toe, bewerk en verwijder evaluatiecompetenties
            </p>
          </div>
          <button
            onClick={() => {
              setNieuwFormulier(true);
              setBewerkId(null);
              setForm(leegForm);
            }}
            className="flex items-center gap-2 bg-[#1A2E4A] text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-[#152438]"
          >
            <Plus size={16} />
            Nieuwe competentie
          </button>
        </div>

        {(nieuwFormulier || bewerkId) && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              {bewerkId ? "Competentie bewerken" : "Nieuwe competentie"}
            </h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <div className="col-span-2">
                <label className="text-xs text-gray-400 block mb-1">Naam *</label>
                <input
                  type="text"
                  value={form.naam}
                  onChange={(e) => setForm({ ...form, naam: e.target.value })}
                  placeholder="bv. D1. Projectplanning"
                  className={inputClass}
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-400 block mb-1">Omschrijving</label>
                <textarea
                  value={form.omschrijving}
                  onChange={(e) => setForm({ ...form, omschrijving: e.target.value })}
                  placeholder="Beschrijving van de competentie..."
                  rows={2}
                  className={`${inputClass} resize-none`}
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">
                  Gewicht (%) * — nog beschikbaar:{" "}
                  <span className="font-semibold">
                    {(
                      100 -
                      totaalGewicht +
                      (bewerkId
                        ? competenties.find((c) => c.id === bewerkId)?.gewicht || 0
                        : 0)
                    ).toFixed(2)}%
                  </span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={form.gewicht}
                  onChange={(e) => setForm({ ...form, gewicht: e.target.value })}
                  placeholder="bv. 20"
                  className={inputClass}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleOpslaan}
                className="flex items-center gap-2 bg-[#1A2E4A] text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-[#152438]"
              >
                <Check size={16} />
                Opslaan
              </button>
              <button
                onClick={handleAnnuleren}
                className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 text-sm px-4 py-2 rounded-lg font-medium hover:bg-gray-50"
              >
                <X size={16} />
                Annuleren
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">Naam</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">Omschrijving</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">Gewicht</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-400">Acties</th>
              </tr>
            </thead>
            <tbody>
              {competenties.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-gray-400">
                    Geen competenties gevonden.
                  </td>
                </tr>
              ) : (
                competenties.map((c) => (
                  <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 font-medium text-gray-900">{c.naam}</td>
                    <td className="px-5 py-4 text-gray-500 max-w-xs truncate">{c.omschrijving || "—"}</td>
                    <td className="px-5 py-4 text-gray-600">{c.gewicht}%</td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => router.push(`/admin/competenties/${c.id}/rubriek`)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-blue-50 text-blue-500"
                          title="Rubriek beheren"
                        >
                          <BookOpen size={15} />
                        </button>
                        <button
                          onClick={() => handleBewerken(c)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-500"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleVerwijderen(c.id)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-red-50 text-red-500"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {competenties.length > 0 && (
          <div className="mt-4 text-xs text-right">
            Totaal gewicht:{" "}
            <span className={`font-semibold ${
              totaalGewicht > 100 ? "text-red-500" :
              totaalGewicht === 100 ? "text-green-600" : "text-gray-600"
            }`}>
              {totaalGewicht.toFixed(1)}%
            </span>
            {totaalGewicht < 100 && (
              <span className="text-gray-400 ml-2">
                (nog {(100 - totaalGewicht).toFixed(1)}% beschikbaar)
              </span>
            )}
            {totaalGewicht === 100 && (
              <span className="text-green-500 ml-2">— perfect verdeeld</span>
            )}
          </div>
        )}
      </div>
    </main>
  );
}