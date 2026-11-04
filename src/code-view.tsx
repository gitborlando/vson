import { useMemo, useRef } from 'react'
import CodeMirror, { type ReactCodeMirrorRef } from '@uiw/react-codemirror'
import { json } from '@codemirror/lang-json'
import { css } from '@emotion/css'
import { classes } from '@workbench/ui'
import { codeExtensions } from './code-extensions'
import type { VsonInspection, VsonSchema } from './types'

export function CodeView({
  value,
  onChange,
  schema,
  inspect,
}: {
  value: string
  onChange: (value: string) => void
  schema: VsonSchema
  inspect: (text: string) => VsonInspection
}) {
  const latestInspect = useRef(inspect)
  latestInspect.current = inspect
  const extensions = useMemo(
    () => [json(), ...codeExtensions(schema, (text) => latestInspect.current(text))],
    [schema],
  )
  const editor = useRef<ReactCodeMirrorRef>(null)
  return (
    <CodeMirror
      ref={editor}
      value={value}
      onChange={onChange}
      extensions={extensions}
      height='100%'
      basicSetup={{ foldGutter: true, lineNumbers: true, highlightActiveLine: true }}
      aria-label='VSON JSON 代码编辑器'
      className={cls()}
    />
  )
}

const cls = classes(css`
  & {
    height: 100%;
    min-height: 0;
    font-size: 12px;
  }
  & .cm-editor {
    height: 100%;
    background: #fff;
  }
  & .cm-scroller {
    overflow: auto;
    font-family: 'Cascadia Code', Consolas, monospace;
    line-height: 1.8;
  }
  & .cm-gutters {
    background: #fafbfc;
    color: #a3a9b3;
    border: 0;
  }
  & .cm-activeLine {
    background: #f7f8fc;
  }
  & .cm-focused {
    outline: none;
  }
  & .cm-content {
    padding-block: 12px;
  }
  & .vson-code-description {
    padding: 8px 10px;
    max-width: 360px;
    line-height: 1.6;
    font-family: var(--font-family, sans-serif);
  }
`)
