export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

export const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python',     label: 'Python'     },
]

export const DEFAULT_CODE = {
  javascript: `// Write your code here\nconsole.log("Hello, World!")`,
  python:     `# Write your code here\nprint("Hello, World!")`,
}