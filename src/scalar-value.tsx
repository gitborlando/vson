import { useEffect, useId, useRef, useState } from 'react'
import { css } from '@emotion/css'
import { CircleAlert, ImagePlus } from 'lucide-react'
import {
  Button,
  Input,
  OssImage,
  Select,
  Switch,
  classes,
  withCssVars,
} from '@workbench/ui'
import type { JsonValue, VsonSchema } from './types'

export function ScalarValue({
  value,
  schema,
  readOnly,
  label,
  focusRequest,
  onFocusHandled,
  onChange,
  onPickImage,
  onEditIssue,
}: {
  value: JsonValue
  schema: VsonSchema
  readOnly: boolean
  label: string
  focusRequest?: number
  onFocusHandled: () => void
  onChange: (value: JsonValue) => string
  onPickImage?: () => void
  onEditIssue: (message: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')
  const element = useRef<HTMLSpanElement>(null)
  const handledFocus = useRef<number>()
  const editingRef = useRef(false)
  const errorId = useId()
  const reportIssue = useRef(onEditIssue)
  reportIssue.current = onEditIssue
  useEffect(() => () => reportIssue.current(''), [])
  const choices =
    schema.enum ?? (schema.const !== undefined ? [schema.const] : undefined)
  const image = schema.format === 'image' && typeof value === 'string'
  const fixed = schema.const !== undefined || schema.enum?.length === 1
  const report = (message: string) => {
    setError(message)
    onEditIssue(message)
  }
  const cancel = () => {
    report('')
    editingRef.current = false
    setEditing(false)
  }
  const start = () => {
    setDraft(typeof value === 'string' ? value : String(value))
    report('')
    editingRef.current = true
    setEditing(true)
  }
  const commitValue = (next: JsonValue, blur = false) => {
    const message = onChange(next)
    setError(message)
    onEditIssue(blur ? '' : message)
    if (!message || blur) {
      editingRef.current = false
      setEditing(false)
    }
  }
  const commit = (blur = false) => {
    if (!editingRef.current) return
    if (typeof value !== 'number') {
      commitValue(draft, blur)
      return
    }
    if (
      !/^-?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(draft) ||
      !Number.isFinite(Number(draft))
    ) {
      setError('请输入完整的有限数字')
      onEditIssue(blur ? '' : '请输入完整的有限数字')
      if (blur) {
        editingRef.current = false
        setEditing(false)
      }
      return
    }
    commitValue(Number(draft), blur)
  }
  useEffect(() => {
    if (!focusRequest || handledFocus.current === focusRequest || readOnly || fixed)
      return
    const frame = requestAnimationFrame(() => {
      handledFocus.current = focusRequest
      element.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
      if (typeof value === 'boolean') {
        element.current?.querySelector('input')?.focus({ preventScroll: true })
        onFocusHandled()
        return
      }
      start()
      onFocusHandled()
    })
    return () => cancelAnimationFrame(frame)
  }, [focusRequest, readOnly, fixed])
  return (
    <span
      ref={element}
      className={cls()}
      data-type={value === null ? 'null' : typeof value}>
      {image && value && (
        <OssImage className={cls('image')} src={value} alt={schema.title ?? label} />
      )}
      <span className={cls('field')}>
        {typeof value === 'boolean' ? (
          <span className={cls('boolean')}>
            <Switch
              checked={value}
              disabled={readOnly || fixed}
              aria-label={label}
              onChange={(next) => commitValue(next, true)}
            />
          </span>
        ) : editing && !readOnly ? (
          <span
            className={cls('editor')}
            data-invalid={Boolean(error) || undefined}
            style={withCssVars(undefined, {
              '--vson-input-width': `${Math.min(34, Math.max(10, draft.length + 2))}ch`,
            })}>
            {choices ? (
              <Select
                defaultOpen
                label={label}
                value={JSON.stringify(value)}
                options={choices.map((choice, index) => ({
                  value: JSON.stringify(choice),
                  label: schema.enumLabels?.[index] ?? JSON.stringify(choice),
                }))}
                onChange={(next) => commitValue(JSON.parse(next) as JsonValue, true)}
                onOpenChange={(open) => {
                  if (!open && editingRef.current) cancel()
                }}
              />
            ) : (
              <Input
                autoFocus
                aria-label={label}
                aria-invalid={Boolean(error) || undefined}
                aria-describedby={error ? errorId : undefined}
                inputMode={typeof value === 'number' ? 'decimal' : undefined}
                value={draft}
                onFocus={(event) => event.currentTarget.select()}
                onChange={(event) => {
                  setDraft(event.target.value)
                  setError('')
                  onEditIssue('字段输入尚未确认，请按 Enter 或移出输入框')
                }}
                onBlur={() => commit(true)}
                onKeyDown={(event) => {
                  if (event.nativeEvent.isComposing) return
                  if (event.key !== 'Enter' && event.key !== 'Escape') return
                  event.preventDefault()
                  event.stopPropagation()
                  if (event.key === 'Escape') cancel()
                  else commit(false)
                }}
              />
            )}
          </span>
        ) : (
          <Button
            className={cls('value')}
            size={24}
            disabled={readOnly || fixed}
            title={
              readOnly || fixed ? `${label} · 固定值或只读` : `${label} · 点击编辑`
            }
            aria-label={`${label}：${typeof value === 'string' ? value : JSON.stringify(value)}`}
            onClick={start}>
            {JSON.stringify(value)}
          </Button>
        )}
        {error && (
          <span id={errorId} role='alert' className={cls('error')} title={error}>
            <CircleAlert size={12} aria-hidden='true' />
            <span className={cls('error-text')}>{error}</span>
          </span>
        )}
      </span>
      {image && !readOnly && onPickImage && (
        <Button
          icon={<ImagePlus size={13} />}
          title='选择或上传图片'
          aria-label={`${label}选择或上传图片`}
          onClick={onPickImage}
        />
      )}
    </span>
  )
}

const cls = classes(css`
  & {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    min-width: 0;
    max-width: 100%;
    vertical-align: middle;
  }
  &-field {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    min-width: 0;
    max-width: 100%;
  }
  &-value {
    display: inline-block;
    min-width: 20px;
    max-width: 100%;
    text-align: left;
    overflow: hidden;
    text-overflow: ellipsis;
    font: inherit;
    height: auto;
    min-height: 24px;
    color: inherit;
    padding: 1px 4px;
    border-radius: 4px;
  }
  &[data-type='string'] {
    color: #27825d;
  }
  &[data-type='number'] {
    color: #ac6a20;
  }
  &[data-type='boolean'],
  &[data-type='null'] {
    color: #8053b1;
  }
  &-value:disabled {
    opacity: 0.85;
  }
  &-boolean {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding-inline: 4px;
    min-height: 24px;
  }
  &-boolean > [data-scope='switch'] {
    gap: 0;
  }
  &-editor {
    display: inline-flex;
    align-items: center;
    width: fit-content;
    max-width: 100%;
    height: 24px;
    padding: 0;
    line-height: 20px;
    border: 1px solid #dce1ea;
    border-radius: 6px;
    background: #fff;
    color: #394457;
    box-shadow: 0 1px 2px #24365305;
    transition:
      border-color 0.15s,
      box-shadow 0.15s;
  }
  &-editor:focus-within {
    border-color: #a6add4;
    box-shadow: none;
  }
  &-editor[data-invalid] {
    border-color: #dba8a2;
    box-shadow: none;
  }
  &-editor > input {
    width: var(--vson-input-width);
    min-width: 0;
    max-width: 360px;
    height: 22px;
    padding: 0 7px;
    background: transparent;
    font: inherit;
    color: inherit;
    border: 0;
    outline: 0;
    box-shadow: none;
  }
  &-editor > [data-scope='select'] {
    min-width: 100px;
    max-width: 300px;
    font: inherit;
  }
  &-editor [data-scope='select'][data-part='trigger'] {
    height: 22px;
    background: transparent;
    outline: 0;
  }
  &-image {
    width: 30px;
    height: 30px;
    flex-shrink: 0;
    object-fit: contain;
    border: 1px solid var(--border);
    border-radius: 4px;
    background: #f7f8fa;
  }
  &-error {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 10px;
    line-height: 1.6;
    color: #b54242;
    flex-shrink: 0;
  }
  &-error-text {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
`)
