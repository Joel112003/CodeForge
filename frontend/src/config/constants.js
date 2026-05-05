export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export const LANGUAGES = [
  { code: "python", name: "Python" },
  { code: "javascript", name: "JavaScript" },
];

export const DEFAULT_CODE = {
  javascript: `// Write your code here\nconsole.log("Hello, World!")`,
  python: `# Write your code here\nprint("Hello, World!")`,
};

export const STATUS_STYLES = {
  IDLE:      'bg-gray-800 text-gray-400',
  QUEUED:    'bg-yellow-500/20 text-yellow-400',
  RUNNING:   'bg-blue-500/20 text-blue-400',
  COMPLETED: 'bg-green-500/20 text-green-400',
  TIMEOUT:   'bg-orange-500/20 text-orange-400',
  ERROR:     'bg-red-500/20 text-red-400',
}
