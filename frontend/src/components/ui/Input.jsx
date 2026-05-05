// src/components/ui/Input.jsx
export default function Input({ label, error, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-gray-400 text-sm">{label}</label>}
      <input
        {...props}
        className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
      />
      {error && <span className="text-red-400 text-xs">{error}</span>}
    </div>
  )
}