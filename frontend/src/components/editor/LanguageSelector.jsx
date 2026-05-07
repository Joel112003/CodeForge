// src/components/editor/LanguageSelector.jsx
import { LANGUAGES } from '../../config/constants'

export default function LanguageSelector({ value, onChange }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        background: '#FAF7F0',
        border: '1px solid #E0D8CA',
        borderLeft: '3px solid #C04A1A',
        color: '#1A1208',
        fontFamily: "'DM Mono', monospace",
        fontSize: 10,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        padding: '5px 10px',
        cursor: 'pointer',
        outline: 'none',
        height: 32,
        appearance: 'none',
        WebkitAppearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23A0917E' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 8px center',
        paddingRight: 28,
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = '#C04A1A'
        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(192,74,26,0.12)'
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = '#E0D8CA'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {LANGUAGES.map((l) => (
        <option key={l.value} value={l.value}>{l.label}</option>
      ))}
    </select>
  )
}