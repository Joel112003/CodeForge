// src/components/ui/Button.jsx
export default function Button({ children, onClick, disabled, variant = 'primary', className = '' }) {
  const base = 'px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed'

  const variants = {
    primary:  'bg-blue-600 hover:bg-blue-500 text-white',
    success:  'bg-green-600 hover:bg-green-500 text-white',
    ghost:    'bg-transparent hover:bg-gray-800 text-gray-400 hover:text-white',
    danger:   'bg-red-600 hover:bg-red-500 text-white',
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  )
}