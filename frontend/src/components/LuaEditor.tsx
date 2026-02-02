import { useRef } from 'react'
import Editor from '@monaco-editor/react'

interface LuaEditorProps {
  value: string
  onChange: (value: string) => void
  height?: string
  readOnly?: boolean
}

export default function LuaEditor({ value, onChange, height = '200px', readOnly = false }: LuaEditorProps) {
  const editorRef = useRef<any>(null)

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor

    // Register Lua language (Monaco has basic Lua support)
    if (!monaco.languages.getLanguages().some((lang: any) => lang.id === 'lua')) {
      monaco.languages.register({ id: 'lua' })
      
      // Basic Lua tokens for syntax highlighting
      monaco.languages.setMonarchTokensProvider('lua', {
        keywords: [
          'and', 'break', 'do', 'else', 'elseif', 'end', 'false', 'for', 'function',
          'if', 'in', 'local', 'nil', 'not', 'or', 'repeat', 'return', 'then', 'true',
          'until', 'while', 'goto'
        ],
        operators: [
          '+', '-', '*', '/', '%', '^', '#', '==', '~=', '<=', '>=', '<', '>', '=',
          '(', ')', '{', '}', '[', ']', ';', ':', ',', '.', '..', '...'
        ],
        builtins: [
          'assert', 'collectgarbage', 'dofile', 'error', 'getmetatable', 'ipairs',
          'load', 'loadfile', 'next', 'pairs', 'pcall', 'print', 'rawequal', 'rawget',
          'rawlen', 'rawset', 'require', 'select', 'setmetatable', 'tonumber',
          'tostring', 'type', 'xpcall', '_G', '_VERSION',
          // Common Lua libs
          'string', 'table', 'math', 'io', 'os', 'debug', 'coroutine', 'package'
        ],
        tokenizer: {
          root: [
            // Comments
            [/--\[\[/, 'comment', '@comment'],
            [/--.*$/, 'comment'],
            
            // Strings
            [/"([^"\\]|\\.)*$/, 'string.invalid'],
            [/'([^'\\]|\\.)*$/, 'string.invalid'],
            [/"/, 'string', '@string_double'],
            [/'/, 'string', '@string_single'],
            [/\[\[/, 'string', '@string_bracket'],
            
            // Numbers
            [/0[xX][0-9a-fA-F]+/, 'number.hex'],
            [/[0-9]+\.?[0-9]*([eE][\-+]?[0-9]+)?/, 'number'],
            
            // Identifiers
            [/[a-zA-Z_]\w*/, {
              cases: {
                '@keywords': 'keyword',
                '@builtins': 'type.identifier',
                '@default': 'identifier'
              }
            }],
            
            // Operators
            [/[+\-*/%^#=<>]|==|~=|<=|>=|\.\.\.?/, 'operator'],
            
            // Whitespace
            [/[ \t\r\n]+/, ''],
          ],
          comment: [
            [/\]\]/, 'comment', '@pop'],
            [/./, 'comment']
          ],
          string_double: [
            [/[^\\"]+/, 'string'],
            [/\\./, 'string.escape'],
            [/"/, 'string', '@pop']
          ],
          string_single: [
            [/[^\\']+/, 'string'],
            [/\\./, 'string.escape'],
            [/'/, 'string', '@pop']
          ],
          string_bracket: [
            [/\]\]/, 'string', '@pop'],
            [/./, 'string']
          ]
        }
      })

      // Define Lua theme
      monaco.editor.defineTheme('lua-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: 'comment', foreground: '6A9955' },
          { token: 'keyword', foreground: 'C586C0' },
          { token: 'string', foreground: 'CE9178' },
          { token: 'number', foreground: 'B5CEA8' },
          { token: 'type.identifier', foreground: '4EC9B0' },
          { token: 'operator', foreground: 'D4D4D4' },
        ],
        colors: {
          'editor.background': '#1e293b',
          'editor.foreground': '#e2e8f0',
          'editorLineNumber.foreground': '#64748b',
          'editorCursor.foreground': '#60a5fa',
        }
      })
    }
  }

  const handleChange = (value: string | undefined) => {
    onChange(value || '')
  }

  return (
    <div className="border border-slate-600 rounded overflow-hidden">
      <Editor
        height={height}
        language="lua"
        theme="lua-dark"
        value={value}
        onChange={handleChange}
        onMount={handleEditorDidMount}
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 13,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          automaticLayout: true,
          tabSize: 2,
          insertSpaces: true,
          renderWhitespace: 'selection',
          bracketPairColorization: { enabled: true },
          suggestOnTriggerCharacters: true,
          quickSuggestions: true,
        }}
      />
    </div>
  )
}
