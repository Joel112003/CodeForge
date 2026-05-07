export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

export const LANGUAGES = [
  { code: 'python',     name: 'Python'     },
  { code: 'javascript', name: 'JavaScript' },
]

export const DEFAULT_CODE = {
  javascript: `// Write your code here\nconsole.log("Hello, World!")`,
  python:     `# Write your code here\nprint("Hello, World!")`,
}

export const COLORS = {
  // Base
  BASE_950:   '#0D0B09',  // page background — near-black with warm tint
  BASE_900:   '#0F0D0B',  // card / panel background
  BASE_800:   '#141210',  // input background

  // Accent: Burnt Amber / Terracotta
  ACCENT_700: '#E07B39',  // primary action, highlights
  ACCENT_600: '#F09050',  // hover state
  ACCENT_500: '#F0A060',  // light variant

  // Warm neutrals
  WARM_100:   '#E8DDD0',  // primary text
  WARM_200:   '#D4C8B8',  // secondary text
  WARM_400:   '#A09080',  // muted text
  WARM_500:   '#8C7060',  // placeholder / subtle
  WARM_600:   '#6A6460',  // very muted
  WARM_700:   '#5A5550',  // separator labels
  WARM_800:   '#4A4540',  // borders interactive
  WARM_900:   '#3A3530',  // borders static
  WARM_950:   '#2A2620',  // hairlines
  WARM_1000:  '#1E1C18',  // dividers

  // Status palette
  SUCCESS:    '#4A8C6A',  // green — completed
  WARNING:    '#A0904A',  // amber — queued / timeout
  ERROR:      '#8C3A3A',  // red — error
  INFO:       '#A8956A',  // tan — queued
}

// ── Status configuration ──────────────────────────────────────────────────────
export const STATUS_CONFIG = {
  IDLE:      { dot: COLORS.WARM_800,  text: COLORS.WARM_600,  bg: 'rgba(74,68,64,0.12)',      label: 'idle'      },
  QUEUED:    { dot: COLORS.INFO,      text: COLORS.INFO,      bg: 'rgba(168,149,106,0.1)',     label: 'queued'    },
  RUNNING:   { dot: COLORS.ACCENT_700,text: COLORS.ACCENT_700,bg: 'rgba(224,123,57,0.08)',     label: 'running'   },
  COMPLETED: { dot: COLORS.SUCCESS,   text: COLORS.SUCCESS,   bg: 'rgba(74,140,106,0.08)',     label: 'completed' },
  TIMEOUT:   { dot: COLORS.WARNING,   text: COLORS.WARNING,   bg: 'rgba(160,144,74,0.08)',     label: 'timeout'   },
  ERROR:     { dot: COLORS.ERROR,     text: '#C46A6A',        bg: 'rgba(140,58,58,0.1)',       label: 'error'     },
}

export const STATUS_STYLES = {
  IDLE:      'bg-[#1C1A16] text-[#5A5550] border border-[#2A2620]',
  QUEUED:    'bg-[#1A1810] text-[#A8956A] border border-[#A8956A]/30',
  RUNNING:   'bg-[#1A0F00] text-[#E07B39] border border-[#E07B39]/30',
  COMPLETED: 'bg-[#0A1A0F] text-[#4A8C6A] border border-[#4A8C6A]/30',
  TIMEOUT:   'bg-[#1A1500] text-[#A0904A] border border-[#A0904A]/30',
  ERROR:     'bg-[#1A0808] text-[#C46A6A] border border-[#8C3A3A]/40',
}

// ── Typography tokens ─────────────────────────────────────────────────────────
// Font stack: JetBrains Mono → Fira Code → monospace
// All UI text is mono — this gives the terminal/forge aesthetic
export const TYPOGRAPHY = {
  FONT_STACK: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
  TRACKING_WIDE: '0.08em',
  TRACKING_WIDER: '0.12em',
  TRACKING_WIDEST: '0.18em',
}