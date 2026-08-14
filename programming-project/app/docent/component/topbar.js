'use client'

export default function DocentTopbar({ titel, subtitel, rechts }) {
  return (
    <div className="w-full bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <div>
        <h1 className="text-sm font-semibold text-gray-900">{titel}</h1>
        {subtitel && <p className="text-xs text-gray-400">{subtitel}</p>}
      </div>
      {rechts && <div>{rechts}</div>}
    </div>
  )
}