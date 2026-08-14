"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Topbar from "../component/topbar";
import { fetchMetAuth } from "@/app/lib/fetchMetAuth";

export default function StudentDashboardFirst() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [gebruiker, setGebruiker] = useState(null);

  useEffect(() => {
    const token =
      document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1] || localStorage.getItem("token");

    if (!token) {
      router.push("/authentificator/login");
      return;
    }

    const payload = JSON.parse(atob(token.split(".")[1]));
    setGebruiker(payload);

    fetchMetAuth("/api/student/stage")
      .then((res) => res?.json())
      .then((data) => {
        const actieveStage = data?.find((s) => s.status === "actief");
        if (actieveStage) {
          router.push("/student/dashboard");
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-100">
        <div className="text-sm text-gray-400">Laden...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <Topbar
        titel="Dashboard"
        subtitel="2025-2026 · Toegepaste Informatica"
        rechts="Geen actieve stage"
      />
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-100 p-8">
        <div className="mb-6">
          <svg
            width="48"
            height="48"
            viewBox="0 0 120 120"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="120" height="120" rx="20" fill="#1a2340" />
            <path
              d="M50 45 A30 30 0 1 0 50 75"
              fill="none"
              stroke="white"
              strokeWidth="9"
              strokeLinecap="round"
            />
            <polyline
              points="65,68 75,80 95,55"
              fill="none"
              stroke="#4ade80"
              strokeWidth="7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h2 className="text-xl font-bold mb-3">
          Welkom terug, {gebruiker?.voornaam ?? "Student"} 👋
        </h2>
        <p className="text-gray-500 text-sm text-center max-w-md mb-8 leading-relaxed">
          Je hebt nog geen stageaanvraag ingediend. Dien je voorstel in om het
          goedkeuringsproces te starten.
        </p>
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => router.push("/student/stage")}
            className="px-5 py-2.5 bg-white text-gray-800 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 cursor-pointer"
          >
            Stageaanvragen bekijken
          </button>
          <button
            onClick={() => router.push("/student/stage/nieuw")}
            className="px-5 py-2.5 bg-blue-600 text-white border-none rounded-lg text-sm font-medium hover:bg-blue-700 cursor-pointer"
          >
            Stageaanvraag indienen
          </button>
        </div>
      </div>
    </div>
  );
}
