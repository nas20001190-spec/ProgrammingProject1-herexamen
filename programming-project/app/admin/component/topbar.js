"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function AdminTopbar({
  title,
  backHref,
  backLabel,
  subtitle = "2025 - 2026 Erasmushogeschool Brussel",
  rightContent,
}) {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      
      {/* LEFT SIDE */}
      <div className="flex items-center gap-2">
        {backHref && (
          <>
            <Link
              href={backHref}
              className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600"
            >
              <ChevronLeft className="w-4 h-4" />
              {backLabel}
            </Link>

            <span className="text-gray-300">/</span>
          </>
        )}

        <span className="text-sm font-semibold text-gray-900">
          {title}
        </span>

        {subtitle && (
          <>
            <span className="text-gray-300">·</span>
            <span className="text-sm text-gray-400">
              {subtitle}
            </span>
          </>
        )}
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center gap-3">
        {rightContent}
      </div>

    </div>
  );
}