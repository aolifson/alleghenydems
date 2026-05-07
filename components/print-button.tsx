'use client'

export default function PrintButton({ label = 'Print Guide' }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print rounded-md bg-[var(--color-navy)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-blue-mid)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-mid)] focus:ring-offset-2"
    >
      {label}
    </button>
  )
}
