"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  StickyNote,
  GraduationCap,
  BookOpen,
  ClipboardList,
  Layers,
} from "lucide-react";

const navItems = [
  {
    href: "/admin/dashboard",
    label: "dashboard",
    icon: <LayoutDashboard className="w-4 h-4" />,
  },
  {
    href: "/admin/stage",
    label: "stage",
    icon: <StickyNote className="w-4 h-4" />,
  },
  {
    href: "/admin/studenten",
    label: "studenten",
    icon: <Users className="w-4 h-4" />,
  },
  {
    href: "/admin/docenten",
    label: "docenten",
    icon: <Users className="w-4 h-4" />,
  },
  {
    href: "/admin/stagementors",
    label: "stagementors",
    icon: <Users className="w-4 h-4" />,
  },
  {
    href: "/admin/overeenkomsten",
    label: "overeenkomsten",
    icon: <GraduationCap className="w-4 h-4" />,
  },
  {
    href: "/admin/competenties",
    label: "competenties",
    icon: <BookOpen className="w-4 h-4" />,
  },
  {
    href: "/admin/evaluaties",
    label: "evaluaties",
    icon: <ClipboardList className="w-4 h-4" />,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = document.cookie
      .split("; ")
      .find((r) => r.startsWith("token="))
      ?.split("=")[1];
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUser({ name: `${payload.voornaam} ${payload.achternaam}` });
      } catch {}
    }
  }, []);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "—";

  return (
    <aside className="w-52 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col py-5 h-screen sticky top-0">
      <div className="flex items-center gap-2.5 px-4 mb-7">
        <div className="w-8 h-8 bg-[#1e3a5f] rounded-lg grid place-items-center flex-shrink-0">
          <Layers className="w-4 h-4 text-white" />
        </div>
        <span className="text-sm font-bold text-gray-900 tracking-tight">
          Competent
        </span>
      </div>

      <nav className="flex flex-col flex-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors duration-100 ${
                isActive
                  ? "bg-[#eef2ff] text-[#1e3a5f] font-semibold border-l-2 border-[#1A2E4A]"
                  : "text-gray-500 font-medium border-l-2 border-transparent"
              }`}
            >
              <span className={isActive ? "text-[#1e3a5f]" : "text-gray-400"}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <Link
        href="/admin/profiel"
        className={`flex items-center gap-2.5 px-4 py-3 border-t border-gray-100 mt-2 hover:bg-gray-50 ${
          pathname === "/admin/profiel" ? "bg-[#eef2ff]" : ""
        }`}
      >
        <div
          className={`w-8 h-8 rounded-full grid place-items-center text-xs font-bold flex-shrink-0 ${
            pathname === "/admin/profiel"
              ? "bg-[#1e3a5f] text-white"
              : "bg-[#B5D4F4] text-[#0C447C]"
          }`}
        >
          {initials}
        </div>
        <div className="min-w-0">
          <div className="text-xs font-semibold text-gray-900 truncate">
            {user?.name ?? "—"}
          </div>
          <div className="text-xs text-gray-400">Admin</div>
        </div>
      </Link>
    </aside>
  );
}
