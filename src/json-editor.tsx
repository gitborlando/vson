import { classes } from './style-utils'
import CodeMirror from '@uiw/react-codemirror'
import { json } from '@codemirror/lang-json'
import { css } from '@emotion/css'
export function JsonEditor({
  value,
  onChange,
  readOnly = false,
}: {
  value: string
  onChange: (value: string) => void
  readOnly?: boolean
}) {
  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      extensions={[json()]}
      readOnly={readOnly}
      basicSetup={{ foldGutter: true, lineNumbers: true, highlightActiveLine: true }}
      className={cls('code-mirror')}
    />
  )
}

const cls = classes(css`
  &-code-mirror {
    font-size: 12px;
    border: 1px solid var(--border);
    border-radius: 6px;
    overflow: hidden;
    .cm-editor {
      background: #fbfcfd;
    }
    .cm-gutters {
      background: #f6f7f9;
      border: 0;
      color: #a0a6b1;
    }
    .cm-scroller {
      max-height: 58vh;
    }
  }
`)
