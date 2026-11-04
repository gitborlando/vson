import { useState } from 'react'
import { css } from '@emotion/css'
import { ArrowDown, ArrowUp, Minus, Plus, Trash2 } from 'lucide-react'
import { Button, Select, classes } from '@workbench/ui'
import {
  initialValue,
  isObject,
  itemSchema,
  matchesType,
  pathLabel,
  propertySchema,
  resolveSchema,
  sameJson,
} from './schema'
import { ScalarValue } from './scalar-value'
import type { JsonPath, JsonValue, VsonIssue, VsonSchema } from './types'

type NodeProps = {
  value: JsonValue
  schema?: VsonSchema
  path: JsonPath
  label?: string | number
  readOnly?: boolean
  showAnnotations: boolean
  removable?: boolean
  move?: (direction: -1 | 1) => void
  first?: boolean
  last?: boolean
  issues: VsonIssue[]
  onChange: (path: JsonPath, value: JsonValue | undefined) => void
  onPickImage?: (path: JsonPath, schema: VsonSchema) => void
  onEditIssue: (path: JsonPath, message: string) => void
}

export function JsonNode({
  value,
  schema: input,
  path,
  label,
  readOnly: inherited,
  showAnnotations,
  removable,
  move,
  first,
  last,
  issues,
  onChange,
  onPickImage,
  onEditIssue,
}: NodeProps) {
  const [open, setOpen] = useState(path.length < 2)
  const schema = resolveSchema(input ?? {}, value)
  const readOnly = Boolean(inherited || !input || schema.readOnly)
  const array = Array.isArray(value)
  const object = isObject(value)
  const container = array || object
  const arrayItem = !Array.isArray(schema.items) ? schema.items : undefined
  const entries: [string | number, JsonValue][] = array
    ? value.map((item, index) => [index, item])
    : object
      ? Object.entries(value)
      : []
  const missing = Object.entries(schema.properties ?? {}).filter(
    ([key, field]) => object && !Object.hasOwn(value, key) && !field.readOnly,
  )
  const problem = issues.filter((issue) => sameJson(issue.path, path))
  const variants = input?.anyOf
  const variant = variants?.findIndex((option) => matchesType(option, value)) ?? -1
  const changeVariant = (index: number) => {
    const nextSchema = variants?.[index]
    if (!nextSchema) return
    let next = initialValue(nextSchema)
    if (isObject(value) && isObject(next)) {
      const branchKeys = new Set(
        variants?.flatMap((option) => Object.keys(option.properties ?? {})),
      )
      const preserved = Object.fromEntries(
        Object.entries(value).filter(([key, item]) => {
          const field = propertySchema(nextSchema, key)
          return !branchKeys.has(key) || (field && matchesType(field, item))
        }),
      )
      next = { ...next, ...preserved }
    }
    onChange(path, next)
  }
  const summary =
    object && typeof value.name === 'string' ? value.name : `${entries.length} 项`
  const title = [schema.title, schema.description].filter(Boolean).join(' · ')
  return (
    <div
      className={cls()}
      data-readonly={readOnly || undefined}
      data-invalid={Boolean(problem.length) || undefined}>
      <div className={cls('line')}>
        {container ? (
          <Button
            className={cls('fold')}
            size={24}
            icon={open ? <Minus size={12} /> : <Plus size={12} />}
            aria-label={`${pathLabel(path)}${open ? '收起' : '展开'}`}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          />
        ) : (
          <span className={cls('spacer')} />
        )}
        {label !== undefined && (
          <span className={cls('key')} title={title}>
            {typeof label === 'number' ? (
              <small className={cls('index')}>{label}</small>
            ) : (
              <>
                {label}
                <span className={cls('punctuation')}>: </span>
              </>
            )}
          </span>
        )}
        {container ? (
          <Button
            className={cls('bracket')}
            size={24}
            onClick={() => setOpen(!open)}
            title={title}>
            {array ? '[' : '{'}
            {!open && (
              <>
                <span className={cls('summary')}> {summary} </span>
                {array ? ']' : '}'}
              </>
            )}
          </Button>
        ) : (
          <ScalarValue
            value={value}
            schema={schema}
            readOnly={readOnly}
            label={pathLabel(path)}
            onChange={(value) => onChange(path, value)}
            onEditIssue={(message) => onEditIssue(path, message)}
            onPickImage={onPickImage ? () => onPickImage(path, schema) : undefined}
          />
        )}
        {showAnnotations && schema.title && (
          <span className={cls('annotation')} title={schema.description}>
            {schema.title}
          </span>
        )}
        {readOnly && (
          <span className={cls('badge')}>{input ? '只读' : '扩展字段'}</span>
        )}
        <div className={cls('actions')}>
          {!readOnly && object && missing.length > 0 && (
            <Select
              className={cls('add-field')}
              label={`${pathLabel(path)}添加字段`}
              value=''
              trigger={
                <Button
                  icon={<Plus size={12} />}
                  title='添加字段'
                  aria-label={`${pathLabel(path)}添加字段`}
                />
              }
              options={missing.map(([key, field]) => ({
                value: key,
                label: `${key}${field.title ? ' · ' + field.title : ''}`,
              }))}
              onChange={(key) => {
                const field = schema.properties?.[key]
                if (!field) return
                onChange([...path, key], initialValue(field))
              }}
            />
          )}
          {!readOnly &&
            array &&
            arrayItem &&
            entries.length < (schema.maxItems ?? Infinity) && (
              <Button
                icon={<Plus size={12} />}
                title='添加项目'
                aria-label={`${pathLabel(path)}添加项目`}
                onClick={() => onChange(path, [...value, initialValue(arrayItem)])}
              />
            )}
          {!readOnly && variants && (
            <Select
              label={`${pathLabel(path)}数据形式`}
              value={String(variant)}
              options={variants.map((option, index) => ({
                value: String(index),
                label: option.title ?? option.type ?? `形式 ${index + 1}`,
              }))}
              onChange={(value) => changeVariant(Number(value))}
            />
          )}
          {!readOnly && move && (
            <>
              <Button
                icon={<ArrowUp size={12} />}
                title='上移'
                aria-label={`${pathLabel(path)}上移`}
                disabled={first}
                onClick={() => move(-1)}
              />
              <Button
                icon={<ArrowDown size={12} />}
                title='下移'
                aria-label={`${pathLabel(path)}下移`}
                disabled={last}
                onClick={() => move(1)}
              />
            </>
          )}
          {!readOnly && removable && (
            <Button
              icon={<Trash2 size={12} />}
              title='移除此字段或项目'
              aria-label={`${pathLabel(path)}移除`}
              onClick={() => onChange(path, undefined)}
            />
          )}
        </div>
      </div>
      {problem.map((issue, index) => (
        <p key={index} role='alert' className={cls('error')}>
          {issue.message}
        </p>
      ))}
      {open && container && (
        <>
          <div className={cls('children')}>
            {entries.map(([key, child], index) => (
              <JsonNode
                key={key}
                value={child}
                schema={
                  array ? itemSchema(schema, index) : propertySchema(schema, key)
                }
                path={[...path, key]}
                label={key}
                readOnly={readOnly}
                showAnnotations={showAnnotations}
                removable={
                  array
                    ? !Array.isArray(schema.items) &&
                      entries.length > (schema.minItems ?? 0)
                    : !schema.required?.includes(String(key))
                }
                move={
                  array && !Array.isArray(schema.items)
                    ? (direction) => {
                        const next = [...value]
                        const target = index + direction
                        if (target < 0 || target >= next.length) return
                        ;[next[index], next[target]] = [next[target], next[index]]
                        onChange(path, next)
                      }
                    : undefined
                }
                first={index === 0}
                last={index === entries.length - 1}
                issues={issues}
                onChange={onChange}
                onPickImage={onPickImage}
                onEditIssue={onEditIssue}
              />
            ))}
          </div>
          <div className={cls('closing')}>{array ? ']' : '}'}</div>
        </>
      )}
    </div>
  )
}

const cls = classes(css`
  & {
    min-width: 0;
  }
  &-line {
    display: flex;
    align-items: center;
    gap: 3px;
    min-height: 30px;
    padding-right: 6px;
    border-radius: 4px;
  }
  &-line:hover,
  &-line:focus-within {
    background: #f6f7fb;
  }
  &-fold,
  &-spacer {
    width: 18px;
    flex-shrink: 0;
  }
  &-fold {
    color: #9198a5;
  }
  &-key {
    color: #526582;
    white-space: nowrap;
  }
  &-index {
    color: #b3bac5;
    font-size: 0.75em;
    margin-right: 3px;
  }
  &-punctuation,
  &-bracket {
    color: #8b94a3;
  }
  &-bracket {
    font: inherit;
    height: auto;
    min-height: 24px;
    padding-inline: 1px;
  }
  &-summary {
    color: #8d96a5;
    font-size: 0.92em;
  }
  &-annotation {
    margin-left: 8px;
    color: #9ba3af;
    font-size: 0.84em;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  }
  &-badge {
    color: #a5acb7;
    font-size: 0.75em;
    margin-left: 4px;
    white-space: nowrap;
  }
  &-children {
    margin-left: 14px;
    padding-left: 5px;
    border-left: 1px solid #edf0f5;
  }
  &-closing {
    color: #8b94a3;
    padding-left: 21px;
    line-height: max(26px, 1.8em);
  }
  &-actions {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 2px;
    flex-shrink: 0;
    opacity: 0;
  }
  &-actions > [data-scope='select'] {
    width: 125px;
    font: inherit;
  }
  &-actions > &-add-field {
    width: 24px;
  }
  &-line:hover &-actions,
  &-line:focus-within &-actions,
  &-actions:has([data-state='open']) {
    opacity: 1;
  }
  @media (hover: none) {
    &-actions {
      opacity: 1;
    }
  }
  &-actions:empty {
    display: none;
  }
  &[data-invalid] > &-line {
    background: #fff6f5;
  }
  &-error {
    margin: 2px 0 4px 22px;
    color: #b54242;
    font-size: 0.84em;
  }
`)
