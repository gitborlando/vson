import { useMemo, useRef, useState } from 'react'
import { css } from '@emotion/css'
import { Braces, Code2, ListCollapse, WrapText } from 'lucide-react'
import { Button, Segments, classes } from '@workbench/ui'
import { CodeView } from './code-view'
import { editJson, inspectJson } from './document'
import { JsonNode } from './json-node'
import { MediaPicker } from './media-picker'
import { pathLabel } from './schema'
import type { JsonPath, VsonInspection, VsonMediaAdapter, VsonSchema } from './types'

export function VsonEditor({
  value,
  schema,
  onChange,
  inspect: suppliedInspect,
  media,
  mode,
  onModeChange,
  onInteractionChange,
  history,
}: {
  value: string
  schema: VsonSchema
  onChange: (text: string) => void
  inspect?: (text: string) => VsonInspection
  media?: VsonMediaAdapter
  mode: 'structure' | 'code'
  onModeChange: (mode: 'structure' | 'code') => void
  onInteractionChange?: (state: { busy: boolean; error: string }) => void
  history?: { undo: () => void; redo: () => void }
}) {
  const inspect = suppliedInspect ?? ((text: string) => inspectJson(text, schema))
  const inspection = useMemo(() => inspect(value), [value, inspect])
  const [treeVersion, setTreeVersion] = useState(0)
  const [mediaTarget, setMediaTarget] = useState<{
    path: JsonPath
    schema: VsonSchema
    source: string
  }>()
  const [interaction, setInteraction] = useState({ busy: false, error: '' })
  const interactionRef = useRef(interaction)
  const fieldErrors = useRef(new Map<string, string>())
  const latest = useRef({ value, onChange })
  latest.current = { value, onChange }
  const interact = (patch: Partial<typeof interaction>) => {
    const next = { ...interactionRef.current, ...patch }
    interactionRef.current = next
    setInteraction(next)
    onInteractionChange?.(next)
  }
  const format = () => {
    if (!inspection.syntaxValid || inspection.value === undefined) return
    onChange(JSON.stringify(inspection.value, null, 2))
  }
  return (
    <div
      className={cls()}
      data-vson-editor
      onKeyDownCapture={(event) => {
        if (!history || interaction.error || !(event.ctrlKey || event.metaKey))
          return
        const key = event.key.toLowerCase()
        if (key !== 'z' && key !== 'y') return
        event.preventDefault()
        event.stopPropagation()
        if (key === 'y' || event.shiftKey) history.redo()
        else history.undo()
      }}>
      <div className={cls('toolbar')}>
        <span className={cls('brand')}>
          VSON<span>VISUAL JSON</span>
        </span>
        <Segments
          value={mode}
          disabled={interaction.busy || Boolean(interaction.error)}
          onChange={(mode) => {
            if (mode === 'structure' || mode === 'code') onModeChange(mode)
          }}
          options={[
            {
              value: 'structure',
              label: (
                <>
                  <Braces size={12} />
                  结构
                </>
              ),
            },
            {
              value: 'code',
              label: (
                <>
                  <Code2 size={12} />
                  代码
                </>
              ),
            },
          ]}
        />
        <div className={cls('tools')}>
          {mode === 'structure' && (
            <Button
              size={24}
              icon={<ListCollapse size={13} />}
              title='恢复默认展开层级'
              aria-label='恢复默认展开层级'
              disabled={Boolean(interaction.error)}
              onClick={() => setTreeVersion((value) => value + 1)}
            />
          )}
          <Button
            size={24}
            icon={<WrapText size={13} />}
            title='格式化 JSON'
            aria-label='格式化 JSON'
            disabled={!inspection.syntaxValid || Boolean(interaction.error)}
            onClick={format}
          />
        </div>
      </div>
      <div className={cls('body')}>
        {mode === 'code' ? (
          <CodeView
            value={value}
            onChange={onChange}
            schema={schema}
            inspect={inspect}
          />
        ) : inspection.syntaxValid && inspection.value !== undefined ? (
          <div className={cls('structure')}>
            <JsonNode
              key={treeVersion}
              schema={schema}
              path={[]}
              value={inspection.value}
              issues={inspection.issues}
              onEditIssue={(path, error) => {
                const key = JSON.stringify(path)
                if (error) fieldErrors.current.set(key, error)
                else fieldErrors.current.delete(key)
                const next = [...fieldErrors.current.values()].join('；')
                if (next !== interactionRef.current.error) interact({ error: next })
              }}
              onChange={(path, value) =>
                onChange(editJson(latest.current.value, path, value))
              }
              onPickImage={
                media
                  ? (path, schema) => setMediaTarget({ path, schema, source: value })
                  : undefined
              }
            />
          </div>
        ) : (
          <div className={cls('invalid')}>
            <Braces size={24} />
            <strong>先修正 JSON 语法</strong>
            <p>未完成的代码已保留。修正后即可继续结构化编辑。</p>
            <Button size={28} variant='outline' onClick={() => onModeChange('code')}>
              转到代码视图
            </Button>
          </div>
        )}
      </div>
      {inspection.issues.length > 0 && (
        <div className={cls('issues')} role='status'>
          {inspection.issues.slice(0, 8).map((issue, index) => (
            <div key={index}>
              <code>{pathLabel(issue.path)}</code>
              <span>{issue.message}</span>
              {issue.from !== undefined && (
                <small>第 {value.slice(0, issue.from).split('\n').length} 行</small>
              )}
            </div>
          ))}
          {inspection.issues.length > 8 && (
            <small>另有 {inspection.issues.length - 8} 项问题</small>
          )}
        </div>
      )}
      {media && mediaTarget && (
        <MediaPicker
          adapter={media}
          kind={mediaTarget.schema.mediaKind}
          onClose={() => {
            setMediaTarget(undefined)
            interact({ error: '' })
          }}
          onBusyChange={(busy) => interact({ busy })}
          onSelect={(url) => {
            if (latest.current.value !== mediaTarget.source) {
              interact({ error: '选择图片期间内容已变化，请关闭后重新选择' })
              return
            }
            latest.current.onChange(
              editJson(latest.current.value, mediaTarget.path, url),
            )
            setMediaTarget(undefined)
          }}
        />
      )}
    </div>
  )
}

const cls = classes(css`
  & {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    min-width: 0;
    background: #fff;
  }
  &-toolbar {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 42px;
    padding: 6px 12px;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }
  &-brand {
    display: inline-flex;
    align-items: baseline;
    gap: 6px;
    font-size: 12px;
    font-weight: 650;
    letter-spacing: 0.8px;
    color: #46536b;
  }
  &-brand > span {
    font-size: 8px;
    font-weight: 400;
    color: #a0a8b5;
    letter-spacing: 1px;
  }
  &-tools {
    display: flex;
    gap: 2px;
    margin-left: auto;
    color: #8e97a6;
  }
  &-body {
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }
  &-structure {
    height: 100%;
    overflow: auto;
    padding: 12px 10px 24px;
    font:
      12px/1.8 'Cascadia Code',
      Consolas,
      'Microsoft YaHei',
      monospace;
  }
  &-invalid {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    color: #8c95a5;
    padding: 20px;
    font-size: 12px;
  }
  &-invalid strong {
    font-weight: 500;
    color: #46536b;
  }
  &-invalid p {
    line-height: 1.7;
    text-align: center;
  }
  &-issues {
    max-height: 150px;
    overflow: auto;
    padding: 8px 12px;
    border-top: 1px solid #f0dada;
    background: #fff9f8;
    color: #af5555;
    font-size: 11px;
  }
  &-issues > div {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    line-height: 1.8;
  }
  &-issues small {
    color: #aa8b8b;
  }
  @container (max-width: 420px) {
    &-brand > span {
      display: none;
    }
  }
`)
