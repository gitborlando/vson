import { useEffect, useRef, useState } from 'react'
import { css } from '@emotion/css'
import { ImagePlus } from 'lucide-react'
import { Button, Input, OssImage, Select, classes } from '@workbench/ui'
import type { JsonValue, VsonSchema } from './types'

export function ScalarValue({
  value,
  schema,
  readOnly,
  label,
  onChange,
  onPickImage,
  onEditIssue,
}: {
  value: JsonValue
  schema: VsonSchema
  readOnly: boolean
  label: string
  onChange: (value: JsonValue) => void
  onPickImage?: () => void
  onEditIssue: (message: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [number, setNumber] = useState('')
  const [numberError, setNumberError] = useState('')
  const reportIssue = useRef(onEditIssue)
  reportIssue.current = onEditIssue
  useEffect(() => () => reportIssue.current(''), [])
  const choices =
    schema.enum ??
    (schema.const !== undefined
      ? [schema.const]
      : schema.type === 'boolean'
        ? [true, false]
        : undefined)
  const image = schema.format === 'image' && typeof value === 'string'
  const start = () => {
    setNumber(String(value))
    setNumberError('')
    setEditing(true)
  }
  const stop = () => {
    if (!numberError) setEditing(false)
  }
  const valueType = value === null ? 'null' : typeof value
  return (
    <span className={cls()} data-type={valueType}>
      {image && value && (
        <OssImage className={cls('image')} src={value} alt={schema.title ?? label} />
      )}
      {editing && !readOnly ? (
        choices ? (
          <Select
            label={label}
            value={JSON.stringify(value)}
            options={choices.map((choice, index) => ({
              value: JSON.stringify(choice),
              label: schema.enumLabels?.[index] ?? JSON.stringify(choice),
            }))}
            onChange={(next) => {
              onChange(JSON.parse(next) as JsonValue)
              setEditing(false)
            }}
          />
        ) : (
          <Input
            autoFocus
            aria-label={label}
            type='text'
            inputMode={typeof value === 'number' ? 'decimal' : undefined}
            value={
              typeof value === 'number'
                ? number
                : typeof value === 'string'
                  ? value
                  : ''
            }
            onChange={(event) => {
              const next = event.target.value
              if (typeof value !== 'number') {
                onChange(next)
                return
              }
              setNumber(next)
              const valid =
                /^-?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(next) &&
                Number.isFinite(Number(next))
              const error = valid ? '' : '请输入完整的有限数字'
              setNumberError(error)
              onEditIssue(error)
              if (valid) onChange(Number(next))
            }}
            onBlur={stop}
            onKeyDown={(event) => {
              if (event.key === 'Enter') stop()
              if (event.key === 'Escape') {
                setNumberError('')
                onEditIssue('')
                setEditing(false)
              }
            }}
          />
        )
      ) : (
        <Button
          className={cls('value')}
          size={24}
          disabled={readOnly}
          title={readOnly ? `${label} · 只读` : `${label} · 点击编辑`}
          aria-label={`${label}：${typeof value === 'string' ? value : JSON.stringify(value)}`}
          onClick={start}>
          {JSON.stringify(value)}
        </Button>
      )}
      {image && !readOnly && onPickImage && (
        <Button
          icon={<ImagePlus size={13} />}
          title='选择或上传图片'
          aria-label={`${label}选择或上传图片`}
          onClick={onPickImage}
        />
      )}
      {numberError && (
        <span role='alert' className={cls('error')}>
          {numberError}
        </span>
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
    border-radius: 3px;
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
  & > input,
  & > [data-scope='select'] {
    min-width: 120px;
    max-width: 360px;
    color: #303746;
    font: inherit;
  }
  & > input {
    height: max(30px, 1.8em);
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
    font-size: 10px;
    color: #b54242;
  }
`)
