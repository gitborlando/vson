import { useEffect, useRef, useState } from 'react'
import { css } from '@emotion/css'
import { ArrowDown, ArrowUp, CircleAlert, Minus, Plus, Trash2 } from 'lucide-react'
import { Button, Select, classes } from '@workbench/ui'
import {
  initialValue,
  isObject,
  itemSchema,
  matchesType,
  orderedKeys,
  pathLabel,
  propertySchema,
  resolveSchema,
  sameJson,
} from './schema'
import { ScalarValue } from './scalar-value'
import { creationOptions } from './creation'
import type {
  JsonPath,
  JsonValue,
  VsonExpansion,
  VsonIssue,
  VsonSchema,
} from './types'

export type FocusRequest = { id: number; path: JsonPath }

type NodeProps = {
  value: JsonValue
  schema?: VsonSchema
  path: JsonPath
  label?: string | number
  readOnly?: boolean
  showAnnotations: boolean
  expansion: VsonExpansion
  onToggle: (path: JsonPath, open: boolean) => void
  focusRequest?: FocusRequest
  onFocusHandled: () => void
  inline?: boolean
  removable?: boolean
  move?: (direction: -1 | 1) => void
  first?: boolean
  last?: boolean
  issues: VsonIssue[]
  onChange: (path: JsonPath, value: JsonValue | undefined) => string
  onAdd: (path: JsonPath, value: JsonValue, target?: JsonPath) => void
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
  expansion,
  onToggle,
  focusRequest,
  onFocusHandled,
  inline,
  removable,
  move,
  first,
  last,
  issues,
  onChange,
  onAdd,
  onPickImage,
  onEditIssue,
}: NodeProps) {
  const open =
    expansion.paths[JSON.stringify(path)] ?? (expansion.all || path.length === 0)
  const toggle = () => onToggle(path, !open)
  const row = useRef<HTMLDivElement>(null)
  const [actionError, setActionError] = useState('')
  const change = (path: JsonPath, value: JsonValue | undefined) => {
    const message = onChange(path, value)
    setActionError(message)
    return message
  }
  const schema = resolveSchema(input ?? {}, value)
  const array = Array.isArray(value)
  const object = isObject(value)
  const container = array || object
  const readOnly = Boolean(
    inherited || !input || schema.readOnly || (!container && schema.createOnly),
  )
  const focused = focusRequest && sameJson(focusRequest.path, path)
  useEffect(() => {
    if (!focused || !container) return
    const frame = requestAnimationFrame(() => {
      row.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
      row.current
        ?.querySelector<HTMLButtonElement>(
          '[data-add-field] button, button[data-add-item]',
        )
        ?.focus({ preventScroll: true })
      onFocusHandled()
    })
    return () => cancelAnimationFrame(frame)
  }, [focusRequest?.id, focused, container])
  const arrayItem = !Array.isArray(schema.items) ? schema.items : undefined
  const itemOptions =
    array && arrayItem ? creationOptions(arrayItem, value, schema) : []
  const addItem = (index: number) => {
    if (!array || !itemOptions[index]) return
    onAdd(path, [...value, itemOptions[index].value], [...path, value.length])
  }
  const entries: [string | number, JsonValue][] = array
    ? value.map((item, index) => [index, item])
    : object
      ? orderedKeys(schema, value).map((key) => [key, value[key]])
      : []
  const missing = Object.entries(schema.properties ?? {}).filter(
    ([key, field]) => object && !Object.hasOwn(value, key) && !field.readOnly,
  )
  const fieldOptions = missing.flatMap(([key, field]) =>
    creationOptions(field).map((option, index, options) => ({
      key,
      value: JSON.stringify([key, index]),
      label: `${key}${field.title ? ' · ' + field.title : ''}${options.length > 1 ? ' · ' + option.label : ''}`,
      initial: option.value,
    })),
  )
  const onlyEntry = object && entries.length === 1 ? entries[0] : undefined
  const single = Boolean(
    onlyEntry && !isObject(onlyEntry[1]) && !Array.isArray(onlyEntry[1]),
  )
  const foldable = container && entries.length > 0 && !single
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
    change(path, next)
  }
  const renderChild = (
    [key, child]: [string | number, JsonValue],
    index: number,
    inline = false,
  ) => (
    <JsonNode
      key={key}
      value={child}
      schema={array ? itemSchema(schema, index) : propertySchema(schema, key)}
      path={[...path, key]}
      label={key}
      readOnly={readOnly}
      showAnnotations={showAnnotations}
      expansion={expansion}
      onToggle={onToggle}
      focusRequest={focusRequest}
      onFocusHandled={onFocusHandled}
      inline={inline}
      removable={
        array
          ? !Array.isArray(schema.items) && entries.length > (schema.minItems ?? 0)
          : !schema.required?.includes(String(key))
      }
      move={
        array && !Array.isArray(schema.items)
          ? (direction) => {
              const next = [...value]
              const target = index + direction
              if (target < 0 || target >= next.length) return
              ;[next[index], next[target]] = [next[target], next[index]]
              change(path, next)
            }
          : undefined
      }
      first={index === 0}
      last={index === entries.length - 1}
      issues={issues}
      onChange={onChange}
      onAdd={onAdd}
      onPickImage={onPickImage}
      onEditIssue={onEditIssue}
    />
  )
  const summary =
    object && typeof value.name === 'string' ? value.name : `${entries.length} 项`
  const title = [schema.title, schema.description].filter(Boolean).join(' · ')
  return (
    <div
      className={cls()}
      data-inline={inline || undefined}
      data-readonly={readOnly || undefined}
      data-invalid={Boolean(problem.length) || undefined}>
      <div ref={row} className={cls('line')}>
        {foldable ? (
          <Button
            className={cls('fold')}
            size={24}
            icon={open ? <Minus size={12} /> : <Plus size={12} />}
            aria-label={`${pathLabel(path)}${open ? '收起' : '展开'}`}
            aria-expanded={open}
            onClick={toggle}
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
          single ? (
            <>
              <span className={cls('punctuation')}>{'{'}</span>
              {renderChild(entries[0], 0, true)}
              <span className={cls('punctuation')}>{'}'}</span>
            </>
          ) : !entries.length ? (
            <span className={cls('punctuation')}>{array ? '[]' : '{}'}</span>
          ) : (
            <Button
              className={cls('bracket')}
              size={24}
              onClick={toggle}
              title={title}>
              {array ? '[' : '{'}
              {!open && (
                <>
                  <span className={cls('summary')}> {summary} </span>
                  {array ? ']' : '}'}
                </>
              )}
            </Button>
          )
        ) : (
          <ScalarValue
            value={value}
            schema={schema}
            readOnly={readOnly}
            label={pathLabel(path)}
            focusRequest={focused ? focusRequest?.id : undefined}
            onFocusHandled={onFocusHandled}
            onChange={(value) => onChange(path, value)}
            onEditIssue={(message) => onEditIssue(path, message)}
            onPickImage={onPickImage ? () => onPickImage(path, schema) : undefined}
          />
        )}
        <div className={cls('actions')}>
          {!readOnly && object && missing.length > 0 && (
            <Select
              className={cls('add-field')}
              data-add-field
              label={`${pathLabel(path)}添加字段`}
              value=''
              trigger={
                <Button
                  icon={<Plus size={12} />}
                  title='添加字段'
                  aria-label={`${pathLabel(path)}添加字段`}
                />
              }
              options={fieldOptions}
              onChange={(selected) => {
                const option = fieldOptions.find(
                  (option) => option.value === selected,
                )
                if (option) onAdd([...path, option.key], option.initial)
              }}
            />
          )}
          {!readOnly &&
            array &&
            arrayItem &&
            entries.length < (schema.maxItems ?? Infinity) &&
            (itemOptions.length > 1 &&
            (arrayItem.creationOptions?.length || isObject(itemOptions[0].value)) ? (
              <Select
                className={cls('add-field')}
                label={`${pathLabel(path)}添加项目`}
                value=''
                trigger={
                  <Button
                    icon={<Plus size={12} />}
                    title={`添加项目，推荐${itemOptions[0].label}`}
                    data-add-item
                    aria-label={`${pathLabel(path)}添加项目`}
                  />
                }
                options={itemOptions.map((option, index) => ({
                  value: String(index),
                  label: `${option.label}${index === 0 ? ' · 推荐' : ''}`,
                }))}
                onChange={(index) => addItem(Number(index))}
              />
            ) : (
              <Button
                icon={<Plus size={12} />}
                title={
                  itemOptions.length
                    ? `添加项目：${itemOptions[0].label}`
                    : '可用选项已添加完'
                }
                disabled={!itemOptions.length}
                data-add-item
                aria-label={`${pathLabel(path)}添加项目`}
                onClick={() => addItem(0)}
              />
            ))}
          {!readOnly && variants && (
            <Select
              autoWidth
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
              onClick={() => change(path, undefined)}
            />
          )}
        </div>
        {showAnnotations && schema.title && (
          <span className={cls('annotation')} title={schema.description}>
            {schema.title}
          </span>
        )}
        {readOnly && (
          <span className={cls('badge')}>{input ? '只读' : '扩展字段'}</span>
        )}
        {(problem.length > 0 || actionError) && (
          <span
            className={cls('error')}
            role='alert'
            title={[...problem.map((issue) => issue.message), actionError]
              .filter(Boolean)
              .join('；')}>
            <CircleAlert size={12} aria-hidden='true' />
            <span className={cls('error-text')}>
              {[...problem.map((issue) => issue.message), actionError]
                .filter(Boolean)
                .join('；')}
            </span>
          </span>
        )}
      </div>
      {open && foldable && (
        <>
          <div className={cls('children')}>
            {entries.map((entry, index) => renderChild(entry, index))}
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
  &[data-inline] {
    display: inline-flex;
    flex-direction: column;
  }
  &[data-inline] > &-line {
    padding-right: 0;
  }
  &[data-inline] > &-line > &-spacer {
    display: none;
  }
  &-line {
    display: flex;
    align-items: center;
    gap: 6px;
    min-height: 30px;
    padding-right: 6px;
    border-radius: 4px;
  }
  &-line:hover,
  &-line:has(
      input:not([type='checkbox']):focus,
      [data-scope='select'][data-state='open']
    ) {
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
    padding-right: 2px;
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
    padding-left: 2ch;
    background: linear-gradient(#edf0f5, #edf0f5) 9px 0 / 1px 100% no-repeat;
  }
  &-closing {
    color: #8b94a3;
    padding-left: 25px;
    line-height: max(26px, 1.8em);
  }
  &-actions {
    display: flex;
    align-items: center;
    gap: 2px;
    flex-shrink: 0;
    opacity: 0;
  }
  &-actions > [data-scope='select'] {
    max-width: 240px;
    font: inherit;
  }
  &-actions button {
    border: 0;
    background: transparent;
    border-radius: 4px;
    outline: 0;
    box-shadow: none;
  }
  &-actions [data-scope='select'][data-part='trigger'] {
    height: 24px;
  }
  &-actions button:is(:hover, :focus-visible, [data-state='open']) {
    background: var(--gray-bg);
  }
  &-actions button:focus-visible {
    outline: 2px solid var(--color);
    outline-offset: 2px;
  }
  &-actions > &-add-field {
    width: 24px;
  }
  &-line:hover &-actions,
  &-line:has(:focus-visible, input:not([type='checkbox']):focus) > &-actions,
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
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
    color: #b54242;
    font-size: 0.84em;
  }
  &-error-text {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
`)
