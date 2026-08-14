"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import DocentTopbar from "../../component/topbar";
import { fetchMetAuth } from "@/app/lib/fetchMetAuth";

export default function DocentEvaluatieDetail() {
  const router = useRouter();
  const { id } = useParams();
  const [evaluatie, setEvaluatie] = useState(null);
  const [scores, setScores] = useState([]);
  const [presentatieCriteria, setPresentatieCriteria] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState("");
  const [feedback, setFeedback] = useState("");
  const [presentatieDatum, setPresentatieDatum] = useState("");
  const [presentatieNotities, setPresentatieNotities] = useState("");

  useEffect(() => {
    fetchMetAuth(`/api/docent/evaluaties/${id}`)
      .then((r) => r?.json())
      .then((data) => {
        if (data && !data.fout) {
          setEvaluatie(data.evaluatie);
          setScores(data.scores);
          setFeedback(data.evaluatie.algemene_feedback_docent || "");
          setPresentatieDatum(data.evaluatie.presentatie_datum || "");
          setPresentatieNotities(data.evaluatie.presentatie_notities || "");
          setPresentatieCriteria(data.presentatieCriteria || []);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const selecteerScore = (competentie_id, score) => {
    if (evaluatie.type === "finaal") return;
    setScores((prev) =>
      prev.map((s) =>
        s.competentie_id === competentie_id ? { ...s, score_docent: score } : s,
      ),
    );
  };

  const selecteerPresentatieScore = (criterium_id, score) => {
    setPresentatieCriteria((prev) =>
      prev.map((c) => (c.id === criterium_id ? { ...c, score } : c)),
    );
  };

  const handleOpslaan = async () => {
    setFout("");
    setBezig(true);

    const response = await fetchMetAuth("/api/docent/evaluaties", {
      method: "PUT",
      body: JSON.stringify({
        evaluatie_id: parseInt(id),
        algemene_feedback: feedback,
        scores: scores.map((s) => ({
          competentie_id: s.competentie_id,
          score_docent:
            s.score_docent !== "" && s.score_docent !== null
              ? parseFloat(s.score_docent)
              : null,
        })),
        presentatie_datum:
          evaluatie.type === "finaal" ? presentatieDatum || null : undefined,
        presentatie_notities:
          evaluatie.type === "finaal" ? presentatieNotities || null : undefined,
        presentatie_scores:
          evaluatie.type === "finaal"
            ? presentatieCriteria.map((c) => ({
                criterium_id: c.id,
                score:
                  c.score !== null && c.score !== ""
                    ? parseFloat(c.score)
                    : null,
              }))
            : undefined,
      }),
    });

    if (!response) {
      setBezig(false);
      return;
    }
    const data = await response.json();
    if (response.ok) {
      alert("Opgeslagen!");
      router.push("/docent/evaluaties");
    } else {
      setFout(data.fout || "Er ging iets mis");
      setBezig(false);
    }
  };

  const isVerlopen =
    evaluatie?.datum &&
    new Date() >
      new Date(new Date(evaluatie.datum).toDateString() + " 23:59:59");
  const isFinaal = evaluatie?.type === "finaal";

  if (loading)
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-100">
        <div className="text-sm text-gray-400">Laden...</div>
      </div>
    );
  if (!evaluatie)
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-100">
        <div className="text-sm text-gray-400">Evaluatie niet gevonden.</div>
      </div>
    );

  return (
    <div className="flex-1 flex flex-col">
      <DocentTopbar
        titel={`Evaluatie — ${evaluatie.type}`}
        subtitel={`${evaluatie.student_voornaam} ${evaluatie.student_achternaam} · ${evaluatie.datum ? new Date(evaluatie.datum + "T12:00:00").toLocaleDateString("nl-BE") : ""}`}
      />
      <div className="flex-1 bg-gray-100 p-6 space-y-4 overflow-y-auto">
        {/* Info */}
        <div className="bg-white rounded-xl p-5">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-400 mb-1">Student</p>
              <p className="text-sm font-medium">
                {evaluatie.student_voornaam} {evaluatie.student_achternaam}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Bedrijf</p>
              <p className="text-sm font-medium">{evaluatie.bedrijf_naam}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Type</p>
              <p className="text-sm font-medium capitalize">{evaluatie.type}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Deadline</p>
              <p
                className={`text-sm font-medium ${isVerlopen ? "text-red-500" : "text-gray-800"}`}
              >
                {evaluatie.datum
                  ? new Date(evaluatie.datum).toLocaleDateString("nl-BE")
                  : "—"}
                {isVerlopen && " (verlopen)"}
              </p>
            </div>
          </div>
        </div>

        {isVerlopen && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">
            De deadline is verstreken. Je kan deze evaluatie niet meer
            aanpassen.
          </div>
        )}

        {/* Scores per competentie */}
        {isFinaal && (
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-xs font-semibold text-gray-400 mb-3">
              Tussentijdse scores (ter info)
            </p>
            <div className="space-y-2">
              {scores.map((s) => (
                <div
                  key={s.competentie_id}
                  className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                >
                  <div>
                    <p className="text-xs font-medium text-gray-700">
                      {s.competentie_naam}
                    </p>
                    <p className="text-xs text-gray-400">{s.omschrijving}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-xs text-gray-500">
                      Mentor:{" "}
                      <span className="font-semibold text-gray-700">
                        {s.score_mentor ?? "—"}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Docent:{" "}
                      <span className="font-semibold text-gray-700">
                        {s.score_docent ?? "—"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!isFinaal && (
          <div className="space-y-4">
            {scores.map((s) => (
              <div key={s.competentie_id} className="bg-white rounded-xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {s.competentie_naam}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {s.omschrijving}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Mentor score:</span>
                    <span className="text-xs font-semibold text-gray-600">
                      {s.score_mentor ?? "—"}
                    </span>
                  </div>
                </div>

                {s.rubriek.length > 0 ? (
                  <div
                    className="grid gap-2"
                    style={{
                      gridTemplateColumns: `repeat(${s.rubriek.length}, 1fr)`,
                    }}
                  >
                    {s.rubriek.map((niveau) => {
                      const geselecteerd =
                        parseFloat(s.score_docent) === parseFloat(niveau.score);
                      return (
                        <button
                          key={niveau.id}
                          type="button"
                          disabled={isVerlopen}
                          onClick={() =>
                            selecteerScore(s.competentie_id, niveau.score)
                          }
                          className={`text-left p-3 rounded-lg border-2 transition-all cursor-pointer ${
                            geselecteerd
                              ? "border-[#1e3a5f] bg-[#1e3a5f] text-white"
                              : "border-gray-200 bg-gray-50 text-gray-700 hover:border-[#1e3a5f] hover:bg-blue-50"
                          } ${isVerlopen ? "cursor-not-allowed opacity-60" : ""}`}
                        >
                          <div
                            className={`text-sm font-bold mb-1 ${geselecteerd ? "text-white" : "text-[#1e3a5f]"}`}
                          >
                            {niveau.score}/{niveau.score_max}
                          </div>
                          <div
                            className={`text-xs leading-relaxed ${geselecteerd ? "text-blue-100" : "text-gray-500"}`}
                          >
                            {niveau.beschrijving}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <p className="text-xs text-gray-400">
                      Geen rubriek beschikbaar — geef een score:
                    </p>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.5"
                      disabled={isVerlopen}
                      className="w-24 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400 text-center"
                      placeholder="0-10"
                      value={s.score_docent ?? ""}
                      onChange={(e) =>
                        selecteerScore(s.competentie_id, e.target.value)
                      }
                    />
                  </div>
                )}

                {s.score_docent !== null && s.score_docent !== "" && (
                  <div className="mt-2 text-xs text-gray-500">
                    Geselecteerde score:{" "}
                    <span className="font-semibold text-[#1e3a5f]">
                      {s.score_docent}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Eindpresentatie rubriek — alleen bij finaal */}
        {isFinaal && (
          <div className="bg-white rounded-xl p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-1">
              Eindpresentatie
            </h2>
            <p className="text-xs text-gray-400 mb-4">
              Beoordeel de eindpresentatie van de student per criterium.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Datum presentatie
                </label>
                <input
                  type="date"
                  disabled={isVerlopen}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 disabled:bg-gray-50"
                  value={presentatieDatum}
                  onChange={(e) => setPresentatieDatum(e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-gray-400 mb-1">
                  Notities / commentaar
                </label>
                <textarea
                  disabled={isVerlopen}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 h-24 resize-none disabled:bg-gray-50"
                  placeholder="Algemene notities en commentaar over de eindpresentatie..."
                  value={presentatieNotities}
                  onChange={(e) => setPresentatieNotities(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-5">
              {presentatieCriteria.map((c) => (
                <div key={c.id}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {c.naam}
                      </p>
                      <p className="text-xs text-gray-400">
                        {c.omschrijving} · {c.gewicht}%
                      </p>
                    </div>
                    {c.score !== null && c.score !== "" && (
                      <span className="text-xs font-semibold text-[#1e3a5f]">
                        Score: {c.score}
                      </span>
                    )}
                  </div>

                  {c.niveaus.length > 0 ? (
                    <div
                      className="grid gap-2"
                      style={{
                        gridTemplateColumns: `repeat(${c.niveaus.length}, 1fr)`,
                      }}
                    >
                      {c.niveaus.map((niveau) => {
                        const geselecteerd =
                          parseFloat(c.score) === parseFloat(niveau.score);
                        return (
                          <button
                            key={niveau.id}
                            type="button"
                            disabled={isVerlopen}
                            onClick={() =>
                              selecteerPresentatieScore(c.id, niveau.score)
                            }
                            className={`text-left p-3 rounded-lg border-2 transition-all cursor-pointer ${
                              geselecteerd
                                ? "border-[#1e3a5f] bg-[#1e3a5f] text-white"
                                : "border-gray-200 bg-gray-50 text-gray-700 hover:border-[#1e3a5f] hover:bg-blue-50"
                            } ${isVerlopen ? "cursor-not-allowed opacity-60" : ""}`}
                          >
                            <div
                              className={`text-sm font-bold mb-1 ${geselecteerd ? "text-white" : "text-[#1e3a5f]"}`}
                            >
                              {niveau.score}/{niveau.score_max}
                            </div>
                            <div
                              className={`text-xs leading-relaxed ${geselecteerd ? "text-blue-100" : "text-gray-500"}`}
                            >
                              {niveau.beschrijving}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <p className="text-xs text-gray-400">
                        Geen niveaus — geef een score:
                      </p>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.5"
                        disabled={isVerlopen}
                        className="w-24 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400 text-center"
                        value={c.score ?? ""}
                        onChange={(e) =>
                          selecteerPresentatieScore(c.id, e.target.value)
                        }
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Algemene feedback */}
        <div className="bg-white rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-1">
            Algemene feedback
          </h2>
          <p className="text-xs text-gray-400 mb-3">
            Jouw algemene feedback voor de student.
          </p>
          <textarea
            disabled={isVerlopen}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 h-32 resize-none disabled:bg-gray-50 disabled:text-gray-400"
            placeholder="Algemene feedback..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
        </div>

        {fout && (
          <div className="bg-red-50 text-red-600 border border-red-200 rounded-lg p-3 text-sm">
            {fout}
          </div>
        )}

        <div className="flex gap-3 pb-6">
          <button
            onClick={() => router.push("/docent/evaluaties")}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
          >
            Annuleren
          </button>
          <button
            onClick={handleOpslaan}
            disabled={bezig || isVerlopen}
            className={`px-5 py-2 text-sm rounded-lg font-medium ${
              isVerlopen
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-[#1e3a5f] text-white cursor-pointer hover:bg-[#162d4a]"
            } disabled:opacity-50`}
          >
            {isVerlopen
              ? "Deadline verstreken"
              : bezig
                ? "Bezig..."
                : "Opslaan"}
          </button>
        </div>
      </div>
    </div>
  );
}
