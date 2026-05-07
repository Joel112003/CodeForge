// src/components/editor/CodeEditor.jsx
import MonacoEditor from '@monaco-editor/react'

export default function CodeEditor({ code, language, onChange, readOnly = false }) {
  return (
    <div className="h-full w-full overflow-hidden" style={{ border: '1px solid #E0D8CA' }}>
      <MonacoEditor
        height="100%"
        language={language}
        value={code}
        onChange={(val) => onChange?.(val || '')}
        theme="vs-dark"
        options={{
          fontSize: 13,
          fontFamily: "'DM Mono', 'JetBrains Mono', monospace",
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          padding: { top: 16 },
          readOnly,
          lineNumbersMinChars: 3,
        }}
      />
    </div>
  )
}