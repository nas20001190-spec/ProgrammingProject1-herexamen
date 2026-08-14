"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Topbar from "../component/topbar";
import { fetchMetAuth } from "@/app/lib/fetchMetAuth";

function getDatumVanWeek(startdatum, weekNummer) {
  if (!startdatum) return null;
  const start = new Date(startdatum + "T12:00:00");
  if (isNaN(start.getTime())) return null;
  const dagVanWeek = start.getDay();
  const diff = dagVanWeek === 0 ? -6 : 1 - dagVanWeek;
  const eersteMandag = new Date(start);
  eersteMandag.setDate(start.getDate() + diff);
  const maandag = new Date(eersteMandag);
  maandag.setDate(eersteMandag.getDate() + (weekNummer - 1) * 7);
  const vrijdag = new Date(maandag);
  vrijdag.setDate(maandag.getDate() + 4);
  if (isNaN(maandag.getTime()) || isNaN(vrijdag.getTime())) return null;
  return {
    van: maandag.toLocaleDateString("nl-BE"),
    tot: vrijdag.toLocaleDateString("nl-BE"),
    maandag: maandag.toLocaleDateString("en-CA"),
  };
}

function fmt(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T12:00:00");
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("nl-BE");
}

export default function Logboeken() {
  const router = useRouter();
  const [data, setData] = useState({ weken: [], dagen: [], stage: null });
  const [loading, setLoading] = useState(true);
  const [week, setWeek] = useState(1);
  const [bezig, setBezig] = useState(false);

  useEffect(() => {
    fetchMetAuth("/api/student/logboeken")
      .then((r) => r?.json())
      .then((d) => {
        if (d && !d.fout) {
          setData(d);
          if (d.weken?.length > 0) {
            const maxWeek = Math.max(...d.weken.map((w) => w.week_nummer));
            setWeek(maxWeek);
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const stage = data.stage;
  const aantalWeken = stage?.aantal_weken || 20;
  const weken = data.weken;
  const dagen = data.dagen;

  const huidigWeek = weken.find((w) => w.week_nummer === week);
  const dagenDezeWeek = huidigWeek
    ? dagen.filter((d) => d.logboek_week_id === huidigWeek.id)
    : [];
  const vorigeWeek = weken.find((w) => w.week_nummer === week - 1);

  const kanToevoegen = week === 1 || vorigeWeek?.status === "ingediend";
  const kanIndienen =
    huidigWeek &&
    dagenDezeWeek.length >= 5 &&
    dagenDezeWeek.every((d) => d.uren > 0) &&
    huidigWeek.status !== "ingediend" &&
    huidigWeek.status !== "goedgekeurd";
  const datums = stage?.startdatum
    ? getDatumVanWeek(stage.startdatum, week)
    : null;
  const startdatumParam = stage?.startdatum || "";

  const handleIndienen = async () => {
    if (!huidigWeek) return;
    if (!window.confirm("Week indienen bij stagementor?")) return;
    setBezig(true);
    const response = await fetchMetAuth("/api/student/logboeken", {
      method: "PUT",
      body: JSON.stringify({ logboek_week_id: huidigWeek.id }),
    });
    if (!response) {
      setBezig(false);
      return;
    }
    const d = await response.json();
    if (response.ok) {
      const updated = await fetchMetAuth("/api/student/logboeken").then((r) =>
        r?.json(),
      );
      if (updated && !updated.fout) setData(updated);
      alert("Logboek ingediend!");
    } else {
      alert(d.fout || "Er ging iets mis");
    }
    setBezig(false);
  };

  if (loading)
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-100">
        <div className="text-sm text-gray-400">Laden...</div>
      </div>
    );

  return (
    <div className="flex-1 flex flex-col">
      <Topbar
        titel="Logboeken"
        subtitel={`${stage?.bedrijf_naam ?? "Stage"} · Week ${week} van ${aantalWeken}`}
        rechts={
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">
              <strong>{huidigWeek?.totaal_uren ?? 0}u</strong> ·{" "}
              {dagenDezeWeek.length}/5 dagen
            </span>
            {kanToevoegen &&
              huidigWeek?.status !== "ingediend" &&
              huidigWeek?.status !== "goedgekeurd" && (
                <button
                  onClick={() =>
                    router.push(
                      `/student/logboeken/nieuw?week=${week}&start=${startdatumParam}`,
                    )
                  }
                  className="px-4 py-2 bg-[#1e3a5f] text-white text-sm rounded-lg cursor-pointer font-medium"
                >
                  Dag toevoegen
                </button>
              )}
          </div>
        }
      />
      <div className="flex-1 bg-gray-100 p-6 space-y-4">
        <div className="bg-white rounded-xl p-4 flex items-center justify-between">
          <button
            onClick={() => setWeek((w) => Math.max(1, w - 1))}
            className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 cursor-pointer"
          >
            ‹
          </button>

          <div className="text-center">
            <div className="text-sm font-semibold text-gray-900">
              Week {week} — {datums ? `${datums.van} t/m ${datums.tot}` : ""}
            </div>
            <div className="text-xs text-gray-400">
              Wekelijks afgecheckt door stagementor
            </div>
          </div>

          <div className="flex items-center gap-2">
            {huidigWeek?.status === "ingediend" && (
              <span className="text-xs px-3 py-1 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200">
                Wacht op afcheck mentor
              </span>
            )}
            {huidigWeek?.status === "goedgekeurd" && (
              <span className="text-xs px-3 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
                Goedgekeurd
              </span>
            )}
            <button
              onClick={() => setWeek((w) => Math.min(aantalWeken, w + 1))}
              className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 cursor-pointer"
            >
              ›
            </button>
          </div>
        </div>

        {!huidigWeek && (
          <div className="bg-white rounded-xl p-6">
            <p className="text-sm text-gray-500 mb-4">
              Nog geen logboek voor week {week}{" "}
              {datums ? `(${datums.van} t/m ${datums.tot})` : ""}.
            </p>
            {kanToevoegen ? (
              <button
                onClick={() =>
                  router.push(
                    `/student/logboeken/nieuw?week=${week}&start=${startdatumParam}`,
                  )
                }
                className="px-4 py-2 bg-[#1e3a5f] text-white text-sm rounded-lg cursor-pointer font-medium"
              >
                Dag toevoegen voor week {week}
              </button>
            ) : (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-700">
                Je moet eerst week {week - 1} volledig invullen (5 dagen) en
                indienen voor je aan week {week} kan beginnen.
              </div>
            )}
          </div>
        )}

        {huidigWeek && (
          <div className="bg-white rounded-xl p-5">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <div className="text-xs text-gray-400 mb-1">Totaal uren</div>
                <div className="text-sm font-bold text-yellow-600">
                  {huidigWeek.totaal_uren}u
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-1">Dagen ingevuld</div>
                <div className="text-sm font-bold text-gray-900">
                  {dagenDezeWeek.length}/5
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-1">Status</div>
                <div className="text-sm font-bold text-gray-900">
                  {huidigWeek.status}
                </div>
              </div>
            </div>

            <div className="mb-4 space-y-2">
              {datums &&
                ["Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag"].map(
                  (dagNaam, i) => {
                    const dagDatum = new Date(datums.maandag + "T12:00:00");
                    dagDatum.setDate(dagDatum.getDate() + i);
                    if (isNaN(dagDatum.getTime())) return null;
                    const dagStr = dagDatum.toLocaleDateString("en-CA");
                    const dag = dagenDezeWeek.find(
                      (d) => d.datum?.slice(0, 10) === dagStr,
                    );
                    return (
                      <div
                        key={dagNaam}
                        className="flex items-center justify-between text-sm py-2 border-b border-gray-50"
                      >
                        <span className="text-gray-600 w-24">{dagNaam}</span>
                        <span className="text-xs text-gray-400">
                          {fmt(dagStr)}
                        </span>
                        {dag ? (
                          <span className="text-green-600 font-medium text-xs">
                            {dag.uren}u ingevuld
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs">
                            Nog open
                          </span>
                        )}
                      </div>
                    );
                  },
                )}
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-gray-800">
                  Week indienen bij stagementor
                </div>
                <div className="text-xs text-gray-400">
                  Alle 5 dagen moeten ingevuld zijn met uren.
                </div>
              </div>
              <button
                onClick={handleIndienen}
                disabled={bezig || !kanIndienen}
                className={`px-4 py-2 text-sm rounded-lg font-medium ${
                  !kanIndienen
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-[#1e3a5f] text-white cursor-pointer"
                }`}
              >
                {huidigWeek.status === "ingediend"
                  ? "Ingediend"
                  : huidigWeek.status === "goedgekeurd"
                    ? "Goedgekeurd"
                    : "Week indienen"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
