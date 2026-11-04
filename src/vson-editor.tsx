import { useMemo, useRef, useState, type ReactNode } from 'react'
import { css } from '@emotion/css'
import {
  Braces,
  Code2,
  ListCollapse,
  ListTree,
  MessageSquareText,
  WrapText,
} from 'lucide-react'
import { Button, Segments, classes } from '@workbench/ui'
import { CodeView } from './code-view'
import { editJson, inspectJson } from './document'
import { JsonNode, type FocusRequest } from './json-node'
import { MediaPicker } from './media-picker'
import {
  isObject,
  matchesType,
  pathLabel,
  resolveSchema,
  sameJson,
  schemaAt,
  valueAt,
} from './schema'
import { useAppearance } from './use-appearance'
import type {
  JsonPath,
  JsonValue,
  VsonExpansion,
  VsonInspection,
  VsonMediaAdapter,
  VsonSchema,
} from './types'

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
  expansion: suppliedExpansion,
  onExpansionChange,
  toolbarActions,
}: {
  value: string
  schema: VsonSchema
  onChange: (text: string, expansion: VsonExpansion) => void
  inspect?: (text: string) => VsonInspection
  media?: VsonMediaAdapter
  mode: 'structure' | 'code'
  onModeChange: (mode: 'structure' | 'code') => void
  onInteractionChange?: (state: { busy: boolean; error: string }) => void
  history?: { undo: () => void; redo: () => void }
  expansion?: VsonExpansion
  onExpansionChange?: (expansion: VsonExpansion) => void
  toolbarActions?: ReactNode
}) {
  const inspect = suppliedInspect ?? ((text: string) => inspectJson(text, schema))
  const [structureDraft, setStructureDraft] = useState<{
    text: string
    source: string
  }>()
  const text = structureDraft?.text ?? value
  const inspection = useMemo(() => inspect(text), [text, inspect])
  const [treeVersion, setTreeVersion] = useState(0)
  const [localExpansion, setLocalExpansion] = useState<VsonExpansion>({
    all: false,
    paths: {},
  })
  const expansion = suppliedExpansion ?? localExpansion
  const setExpansion = (next: VsonExpansion) => {
    if (sameJson(expansion, next)) return
    setLocalExpansion(next)
    onExpansionChange?.(next)
  }
  const [focusRequest, setFocusRequest] = useState<FocusRequest>()
  const focusId = useRef(0)
  const [appearance, setAppearance] = useAppearance()
  const [mediaTarget, setMediaTarget] = useState<{
    path: JsonPath
    schema: VsonSchema
    source: string
  }>()
  const [interaction, setInteraction] = useState({ busy: false, error: '' })
  const interactionRef = useRef(interaction)
  const fieldErrors = useRef(new Map<string, string>())
  const mediaError = useRef('')
  const draftError = useRef('')
  const latest = useRef({ value: text, onChange })
  latest.current = { value: text, onChange }
  const interact = (patch: Partial<typeof interaction>) => {
    const next = { ...interactionRef.current, ...patch }
    interactionRef.current = next
    setInteraction(next)
    onInteractionChange?.(next)
  }
  const reportErrors = () => {
    const error = [
      ...fieldErrors.current.values(),
      mediaError.current,
      draftError.current,
    ]
      .filter(Boolean)
      .join('；')
    if (error !== interactionRef.current.error) interact({ error })
  }
  const writeStructure = (
    next: string,
    result: VsonInspection,
    nextExpansion = expansion,
  ) => {
    if (structureDraft && structureDraft.source !== value) {
      draftError.current = '原 JSON 已变化，请先放弃本轮结构修改再重试'
      reportErrors()
      return
    }
    if (result.issues.length) {
      setStructureDraft({ text: next, source: value })
      draftError.current = '结构修改尚未通过校验，请补全或放弃本轮修改'
    } else {
      setStructureDraft(undefined)
      draftError.current = ''
      latest.current.onChange(next, nextExpansion)
    }
    reportErrors()
  }
  const changeStructure = (path: JsonPath, nextValue: JsonValue | undefined) => {
    if (structureDraft && structureDraft.source !== value)
      return '原 JSON 已变化，请先放弃本轮结构修改再重试'
    const parentPath = path.slice(0, -1)
    const key = path.at(-1)
    const parent = resolveSchema(
      schemaAt(schema, inspection.value, parentPath) ?? {},
      valueAt(inspection.value, parentPath),
    )
    const field = schemaAt(schema, inspection.value, path)
    const removeFalse =
      nextValue === false &&
      typeof key === 'string' &&
      isObject(valueAt(inspection.value, parentPath)) &&
      !parent.required?.includes(key) &&
      field?.omitFalse === true &&
      !field.readOnly &&
      matchesType(resolveSchema(field, false), false)
    const normalized = removeFalse ? undefined : nextValue
    if (sameJson(normalized, valueAt(inspection.value, path))) return ''
    const next = editJson(latest.current.value, path, normalized)
    const result = inspect(next)
    const problems = result.issues.filter((issue) => {
      const related = path
        .slice(0, Math.min(path.length, issue.path.length))
        .every((part, index) => part === issue.path[index])
      const unchanged = inspection.issues.some(
        (existing) =>
          existing.message === issue.message && sameJson(existing.path, issue.path),
      )
      // 父级已有问题可以逐字段修正，固定标记切换等新问题仍必须拒绝。
      const withinField = issue.path.length >= path.length && related
      return withinField || !unchanged
    })
    if (problems.length) return problems.map((issue) => issue.message).join('；')
    writeStructure(next, result)
    return ''
  }
  const addStructure = (path: JsonPath, nextValue: JsonValue, target = path) => {
    if (structureDraft && structureDraft.source !== value) return
    const next = editJson(latest.current.value, path, nextValue)
    const result = inspect(next)
    const findEditable = (path: JsonPath): JsonPath | undefined => {
      const field = resolveSchema(
        schemaAt(schema, result.value, path) ?? {},
        valueAt(result.value, path),
      )
      if (
        field.readOnly ||
        field.createOnly ||
        field.const !== undefined ||
        field.enum?.length === 1
      )
        return
      const current = valueAt(result.value, path)
      if (current === undefined) return
      const keys = Array.isArray(current)
        ? current.map((_, index) => index)
        : isObject(current)
          ? Object.keys(current)
          : undefined
      if (!keys) return path
      for (const key of keys) {
        const editable = findEditable([...path, key])
        if (editable) return editable
      }
      return path
    }
    const focusPath = findEditable(target) ?? target
    const paths = { ...expansion.paths }
    for (let length = 0; length <= focusPath.length; length++) {
      paths[JSON.stringify(focusPath.slice(0, length))] = true
    }
    const nextExpansion = { ...expansion, paths }
    writeStructure(next, result, nextExpansion)
    setExpansion(nextExpansion)
    setFocusRequest({ id: ++focusId.current, path: focusPath })
  }
  const format = () => {
    if (!inspection.syntaxValid || inspection.value === undefined) return
    onChange(JSON.stringify(inspection.value, null, 2), expansion)
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
          {toolbarActions && (
            <>
              {toolbarActions}
              <span className={cls('divider')} aria-hidden='true' />
            </>
          )}
          {mode === 'structure' && (
            <Button
              size={24}
              icon={<MessageSquareText size={13} />}
              title={appearance.showAnnotations ? '隐藏字段注释' : '显示字段注释'}
              aria-label='显示字段注释'
              aria-pressed={appearance.showAnnotations}
              active={appearance.showAnnotations}
              onClick={() =>
                setAppearance((current) => ({
                  ...current,
                  showAnnotations: !current.showAnnotations,
                }))
              }
            />
          )}
          {mode === 'structure' && (
            <Button
              size={24}
              icon={
                expansion.all ? <ListCollapse size={13} /> : <ListTree size={13} />
              }
              title={expansion.all ? '收起到第二级' : '全部展开'}
              aria-label={expansion.all ? '收起到第二级' : '全部展开'}
              disabled={interaction.busy}
              onClick={() => setExpansion({ all: !expansion.all, paths: {} })}
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
      {structureDraft && (
        <div className={cls('draft')} role='status'>
          <span>
            {structureDraft.source !== value
              ? '原 JSON 已变化，请放弃本轮结构修改后重试'
              : '当前修改待补全，通过校验后写入 JSON'}
          </span>
          <Button
            size={24}
            onClick={() => {
              setStructureDraft(undefined)
              draftError.current = ''
              fieldErrors.current.clear()
              setTreeVersion((version) => version + 1)
              reportErrors()
            }}>
            放弃本轮修改
          </Button>
        </div>
      )}
      <div className={cls('body')}>
        {mode === 'code' ? (
          <CodeView
            value={value}
            onChange={(next) => onChange(next, expansion)}
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
              showAnnotations={appearance.showAnnotations}
              expansion={expansion}
              focusRequest={focusRequest}
              onFocusHandled={() => setFocusRequest(undefined)}
              onToggle={(path, open) =>
                setExpansion({
                  ...expansion,
                  paths: { ...expansion.paths, [JSON.stringify(path)]: open },
                })
              }
              onEditIssue={(path, error) => {
                const key = JSON.stringify(path)
                if (error) fieldErrors.current.set(key, error)
                else fieldErrors.current.delete(key)
                reportErrors()
              }}
              onChange={changeStructure}
              onAdd={addStructure}
              onPickImage={
                media
                  ? (path, schema) => setMediaTarget({ path, schema, source: text })
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
                <small>第 {text.slice(0, issue.from).split('\n').length} 行</small>
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
            mediaError.current = ''
            reportErrors()
          }}
          onBusyChange={(busy) => interact({ busy })}
          onSelect={(url) => {
            if (latest.current.value !== mediaTarget.source) {
              mediaError.current = '选择图片期间内容已变化，请关闭后重新选择'
              reportErrors()
              return
            }
            const error = changeStructure(mediaTarget.path, url)
            if (error) {
              mediaError.current = error
              reportErrors()
              return
            }
            mediaError.current = ''
            reportErrors()
            setMediaTarget(undefined)
          }}
        />
      )}
    </div>
  )
}

const cls = classes(css`
  & {
    --vson-font-size: 13px;
    --vson-font-family: 'Cascadia Code', Consolas, 'Microsoft YaHei', monospace;
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
    flex-wrap: wrap;
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
    align-items: center;
    gap: 2px;
    margin-left: auto;
    color: #8e97a6;
  }
  &-divider {
    width: 1px;
    height: 16px;
    margin-inline: 4px;
    background: var(--border);
    flex-shrink: 0;
  }
  &-draft {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 5px 12px;
    font-size: 11px;
    color: #897754;
    background: #fffcf5;
    border-bottom: 1px solid #f0e9d8;
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
    font: var(--vson-font-size)/1.8 var(--vson-font-family);
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
