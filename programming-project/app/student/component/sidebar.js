'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LayoutDashboard, FileText, BookOpen, Star, Paperclip, Layers } from 'lucide-react';

const navItems = [
  { href: '/student/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { href: '/student/mijn-stage', label: 'Mijn Stage', icon: <FileText className="w-4 h-4" /> },
  { href: '/student/logboeken', label: 'Logboeken', icon: <BookOpen className="w-4 h-4" /> },
  { href: '/student/evaluaties', label: 'Evaluaties', icon: <Star className="w-4 h-4" /> },
  { href: '/student/documenten', label: 'Documenten', icon: <Paperclip className="w-4 h-4" /> },
];

const disabledItems = ['/student/mijn-stage', '/student/logboeken', '/student/evaluaties', '/student/documenten'];

export default function Sidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const isDashboardFirst = pathname === '/student/dashboard-first' || pathname === '/student/stage/nieuw' || pathname === '/student/stage'

  useEffect(() => {
    const token = document.cookie.split('; ').find(r => r.startsWith('token='))?.split('=')[1]
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        setUser({ name: `${payload.voornaam} ${payload.achternaam}` })
      } catch {}
    }
  }, [])

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '—'

  return (
    <aside className="w-52 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col py-5 min-h-screen">
      <div className="flex items-center gap-2.5 px-4 mb-7">
        <div className="w-8 h-8 bg-[#1e3a5f] rounded-lg grid place-items-center flex-shrink-0">
          <Layers className="w-4 h-4 text-white" />
        </div>
        <span className="text-sm font-bold text-gray-900 tracking-tight">Competent</span>
      </div>

      <nav className="flex flex-col flex-1">
        {navItems.map((item) => {
          const isDisabled = isDashboardFirst && disabledItems.includes(item.href);
          const isActive = item.href === '/student/dashboard-first'
            ? pathname === '/student/dashboard-first' || pathname === '/student/dashboard'
            : pathname.startsWith(item.href);

          if (isDisabled) {
            return (
              <div key={item.href} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-300 cursor-not-allowed">
                <span className="text-gray-300">{item.icon}</span>
                {item.label}
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors duration-100 ${
                isActive ? 'bg-[#eef2ff] text-[#1e3a5f] font-semibold' : 'text-gray-500 font-medium'
              }`}
            >
              <span className={isActive ? 'text-[#1e3a5f]' : 'text-gray-400'}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <Link
        href="/student/profiel"
        className={`flex items-center gap-2.5 px-4 py-3 border-t border-gray-100 mt-2 hover:bg-gray-50 ${
          pathname === '/student/profiel' ? 'bg-[#eef2ff]' : ''
        }`}
      >
        <div className={`w-8 h-8 rounded-full grid place-items-center text-xs font-bold flex-shrink-0 ${
          pathname === '/student/profiel' ? 'bg-[#1e3a5f] text-white' : 'bg-[#c7d2e8] text-[#1e3a5f]'
        }`}>
          {initials}
        </div>
        <div className="min-w-0">
          <div className="text-xs font-semibold text-gray-900 truncate">{user?.name ?? '—'}</div>
          <div className="text-xs text-gray-400">Student</div>
        </div>
      </Link>
    </aside>
  );
}