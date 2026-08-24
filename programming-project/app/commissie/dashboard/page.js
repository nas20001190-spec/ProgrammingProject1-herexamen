"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Topbar from "../component/topbar";
import { fetchMetAuth } from "@/app/lib/fetchMetAuth";

const statusStyles = {
  alle: {
    bg: "bg-gray-50",
    text: "text-gray-700",
    border: "border-gray-200",
    label: "Alle",
  },
  ingediend: {
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
    label: "Te beoordelen",
  },
  aanpassingen: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    label: "Aanpassingen",
  },
  goedgekeurd: {
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
    label: "Goedgekeurd",
  },
  actief: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    label: "Actief",
  },
  afgekeurd: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    label: "Afgekeurd",
  },
};
function dagenGeleden(datum) {
  if (!datum) return null;
  const diff = Date.now() - new Date(datum).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export default function CommissieDashboard() {
  const router = useRouter();
  const [stages, setStages] = useState([]);
  const [gebruiker, setGebruiker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [zoek, setZoek] = useState("");

  useEffect(() => {
    const token = document.cookie
      .split("; ")
      .find((r) => r.startsWith("token="))
      ?.split("=")[1];
    if (!token) {
      router.push("/authentificator/login");
      return;
    }
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setGebruiker(payload);
    } catch {}

    fetchMetAuth("/api/commissie/stages")
      .then((r) => r?.json())
      .then((data) => {
        setStages(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const counts = {
    ingediend: stages.filter((s) => s.status === "ingediend").length,
    aanpassingen: stages.filter((s) => s.status === "aanpassingen").length,
    goedgekeurd: stages.filter((s) => s.status === "goedgekeurd").length,
    actief: stages.filter((s) => s.status === "actief").length,
    afgekeurd: stages.filter((s) => s.status === "afgekeurd").length,
    alle: stages.length,
  };

  const teBeoordelen = stages
    .filter((s) => s.status === "ingediend")
    .sort((a, b) => new Date(a.ingediend_op) - new Date(b.ingediend_op));

  const gezocht =
    zoek.trim().length > 0
      ? stages.filter(
          (s) =>
            `${s.student_voornaam} ${s.student_achternaam}`
              .toLowerCase()
              .includes(zoek.toLowerCase()) ||
            s.bedrijf_naam?.toLowerCase().includes(zoek.toLowerCase()),
        )
      : [];

  if (loading)
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-100">
        <div className="text-sm text-gray-400">Laden...</div>
      </div>
    );

  return (
    <div className="flex-1 flex flex-col">
      <Topbar
        title="Dashboard"
        subtitle="2025-2026 · Erasmushogeschool Brussel"
      />
      <div className="flex-1 bg-gray-100 p-6 space-y-4">
        <div className="bg-white rounded-xl p-5">
          <h2 className="text-lg font-bold text-gray-900">
            Welkom terug, {gebruiker?.voornaam ?? "Commissielid"}
          </h2>
          <p className="text-sm text-gray-400">
            Hier vind je een overzicht van alle stageaanvragen.
          </p>
        </div>

        <div className="grid grid-cols-6 gap-4">
          {Object.entries(statusStyles).map(([key, s]) => (
            <div
              key={key}
              onClick={() =>
                router.push(
                  key === "alle"
                    ? "/commissie/stage"
                    : `/commissie/stage?filter=${key}`,
                )
              }
              className={`rounded-xl p-5 cursor-pointer border ${s.bg} ${s.border} hover:opacity-80 transition-opacity`}
            >
              <div className={`text-3xl font-bold ${s.text}`}>
                {counts[key]}
              </div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-800">
              Te beoordelen — op volgorde van indiening
            </h2>
            {teBeoordelen.length > 0 && (
              <span className="text-xs text-orange-700 bg-orange-50 border border-orange-200 px-2 py-1 rounded-full">
                {teBeoordelen.length} wachtend
              </span>
            )}
          </div>

          {teBeoordelen.length === 0 ? (
            <p className="text-sm text-gray-400">
              Geen aanvragen te beoordelen. 🎉
            </p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-gray-600 pb-3">
                    Student
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-600 pb-3">
                    Bedrijf
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-600 pb-3">
                    Ingediend op
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-600 pb-3">
                    Wachttijd
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-600 pb-3">
                    Actie
                  </th>
                </tr>
              </thead>
              <tbody>
                {teBeoordelen.map((s) => {
                  const dagen = dagenGeleden(s.ingediend_op);
                  const urgent = dagen !== null && dagen >= 5;
                  return (
                    <tr key={s.id} className="border-b border-gray-50">
                      <td className="text-sm text-gray-800 py-3">
                        {s.student_voornaam} {s.student_achternaam}
                      </td>
                      <td className="text-sm text-gray-600 py-3">
                        {s.bedrijf_naam}
                      </td>
                      <td className="text-sm text-gray-600 py-3">
                        {s.ingediend_op
                          ? new Date(s.ingediend_op).toLocaleDateString("nl-BE")
                          : "—"}
                      </td>
                      <td className="py-3">
                        {dagen !== null && (
                          <span
                            className={`text-xs px-2 py-1 rounded-full border ${urgent ? "bg-red-50 text-red-700 border-red-200" : "bg-gray-50 text-gray-600 border-gray-200"}`}
                          >
                            {dagen === 0
                              ? "Vandaag"
                              : `${dagen} ${dagen === 1 ? "dag" : "dagen"}`}
                          </span>
                        )}
                      </td>
                      <td className="py-3">
                        <button
                          onClick={() =>
                            router.push(`/commissie/stage/${s.id}`)
                          }
                          className="px-3 py-1.5 bg-[#1e3a5f] text-white text-xs rounded-lg cursor-pointer"
                        >
                          Beoordelen
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="bg-white rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">
            Zoek een student of bedrijf
          </h2>
          <input
            type="text"
            placeholder="Zoek op naam of bedrijf..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 mb-4"
            value={zoek}
            onChange={(e) => setZoek(e.target.value)}
          />
          {gezocht.length > 0 && (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-gray-600 pb-3">
                    Student
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-600 pb-3">
                    Bedrijf
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-600 pb-3">
                    Status
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-600 pb-3">
                    Actie
                  </th>
                </tr>
              </thead>
              <tbody>
                {gezocht.map((s) => (
                  <tr key={s.id} className="border-b border-gray-50">
                    <td className="text-sm text-gray-800 py-3">
                      {s.student_voornaam} {s.student_achternaam}
                    </td>
                    <td className="text-sm text-gray-600 py-3">
                      {s.bedrijf_naam}
                    </td>
                    <td className="text-sm text-gray-600 py-3">{s.status}</td>
                    <td className="py-3">
                      <button
                        onClick={() => router.push(`/commissie/stage/${s.id}`)}
                        className="px-3 py-1.5 bg-[#1e3a5f] text-white text-xs rounded-lg cursor-pointer"
                      >
                        Bekijken
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {zoek.trim().length > 0 && gezocht.length === 0 && (
            <p className="text-sm text-gray-400">Geen resultaten gevonden.</p>
          )}
        </div>
      </div>
    </div>
  );
}
