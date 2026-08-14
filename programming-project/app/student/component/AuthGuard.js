"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthGuard({ children }) {
  const router = useRouter();
  const [toegestaan, setToegestaan] = useState(false);

  useEffect(() => {
    const token = document.cookie
      .split("; ")
      .find((c) => c.startsWith("token="))
      ?.split("=")[1];
    if (!token) {
      router.replace("/authentificator/login");
      return;
    }
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.exp && Date.now() >= payload.exp * 1000) {
        localStorage.removeItem("token");
        router.replace("/authentificator/login");
        return;
      }
      if (payload.rol !== "student") {
        router.replace("/authentificator/login");
        return;
      }
      setToegestaan(true);
    } catch {
      localStorage.removeItem("token");
      router.replace("/authentificator/login");
    }
  }, [router]);

  if (!toegestaan) return null;
  return children;
}
