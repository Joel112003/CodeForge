export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

export const LANGUAGES = [
  { code: 'python',     name: 'Python'     },
  { code: 'javascript', name: 'JavaScript' },
]

export const DEFAULT_CODE = {
  javascript: `// Write your code here\nconsole.log("Hello, World!")`,
  python:     `# Write your code here\nprint("Hello, World!")`,
}

// Design system colors (warm palette)
export const COLORS = {
  BASE_950: '#1A1612',
  BASE_CREAM: '#F5F0E8',
  ACCENT_700: '#C4622D',
  ACCENT_600: '#D97A3B',
  WARM_100: '#EFF0E8',
  WARM_300: '#E8E2D9',
  WARM_500: '#8C8478',
  WARM_600: '#6B6459',
  WARM_700: '#4A4440',
  WARM_800: '#3A3530',
}

export const STATUS_CONFIG = {
  IDLE:      { dot: COLORS.WARM_600, text: COLORS.WARM_600, bg: `rgba(106,100,89,0.08)`,       label: 'idle'      },
  QUEUED:    { dot: COLORS.WARM_500, text: COLORS.WARM_500, bg: `rgba(140,132,120,0.1)`,       label: 'queued'    },
  RUNNING:   { dot: COLORS.ACCENT_700, text: COLORS.ACCENT_700, bg: `rgba(196,98,45,0.08)`,    label: 'running'   },
  COMPLETED: { dot: COLORS.WARM_600, text: COLORS.WARM_600, bg: `rgba(106,100,89,0.08)`,       label: 'completed' },
  TIMEOUT:   { dot: COLORS.WARM_500, text: COLORS.WARM_500, bg: `rgba(140,132,120,0.1)`,       label: 'timeout'   },
  ERROR:     { dot: COLORS.WARM_700, text: COLORS.WARM_700, bg: `rgba(74,68,64,0.1)`,          label: 'error'     },
}

export const STATUS_GLOW = {
  IDLE:      '',
  QUEUED:    '',
  RUNNING:   '',
  COMPLETED: '',
  TIMEOUT:   '',
  ERROR:     '',
}

export const STATUS_STYLES = {
  IDLE:      'bg-warm-700/20 text-warm-600',
  QUEUED:    'bg-warm-600/20 text-warm-500',
  RUNNING:   'bg-accent-700/20 text-accent-600',
  COMPLETED: 'bg-warm-700/20 text-warm-600',
  TIMEOUT:   'bg-warm-600/20 text-warm-500',
  ERROR:     'bg-warm-800/20 text-warm-700',
}