import {
  applyEdits,
  findNodeAtLocation,
  getNodePath,
  modify,
  parseTree,
  printParseErrorCode,
  type Node,
  type ParseError,
} from 'jsonc-parser'
import {
  isObject,
  itemSchema,
  matchesType,
  orderValue,
  resolveSchema,
  sameJson,
  schemaAt,
  valueAt,
} from './schema'
import type {
  JsonPath,
  JsonValue,
  VsonInspection,
  VsonIssue,
  VsonSchema,
} from './types'

const parseOptions = {
  allowTrailingComma: false,
  disallowComments: true,
  allowEmptyContent: false,
}
const formattingOptions = { insertSpaces: true, tabSize: 2, eol: '\n' }

export const editJson = (
  text: string,
  path: JsonPath,
  value: JsonValue | undefined,
  schema?: VsonSchema,
) => {
  if (!schema)
    return applyEdits(text, modify(text, path, value, { formattingOptions }))
  const current = JSON.parse(text) as JsonValue
  const field = schemaAt(schema, current, path)
  const next = field && value !== undefined ? orderValue(field, value) : value
  const parentPath = path.slice(0, -1)
  const parent = resolveSchema(
    schemaAt(schema, current, parentPath) ?? {},
    valueAt(current, parentPath),
  )
  const order = new Map(
    Object.keys(parent.properties ?? {}).map((key, index) => [key, index]),
  )
  const rank = order.get(String(path.at(-1))) ?? Infinity
  return applyEdits(
    text,
    modify(text, path, next, {
      formattingOptions,
      getInsertionIndex: (properties) => {
        const index = properties.findIndex(
          (key) => (order.get(key) ?? Infinity) > rank,
        )
        return index < 0 ? properties.length : index
      },
    }),
  )
}

export const issueRange = (text: string, path: JsonPath) => {
  const tree = parseTree(text)
  let node = tree
  for (let length = path.length; length >= 0; length--) {
    node = tree && findNodeAtLocation(tree, path.slice(0, length))
    if (node) break
  }
  return {
    from: node?.offset ?? 0,
    to: Math.min(text.length, (node?.offset ?? 0) + (node?.length ?? 1)),
  }
}

export function inspectJson(
  text: string,
  schema: VsonSchema,
  base?: JsonValue,
): VsonInspection {
  const errors: ParseError[] = []
  const tree = parseTree(text, errors, parseOptions)
  if (!tree || errors.length)
    return {
      syntaxValid: false,
      issues: errors.length
        ? errors.map((error) => ({
            path: [],
            message: 'JSON 语法错误：' + printParseErrorCode(error.error),
            from: error.offset,
            to: error.offset + error.length,
          }))
        : [{ path: [], message: '请输入 JSON', from: 0, to: 0 }],
    }
  const value = JSON.parse(text) as JsonValue
  const issues: VsonIssue[] = []
  const add = (path: JsonPath, message: string) =>
    issues.push({ path, message, ...issueRange(text, path) })
  const duplicates = (node: Node) => {
    if (node.type === 'number' && !Number.isFinite(node.value))
      issues.push({
        path: getNodePath(node),
        message: '数字必须有限',
        from: node.offset,
        to: node.offset + node.length,
      })
    if (node.type === 'object') {
      const keys = new Set<string>()
      for (const property of node.children ?? []) {
        const key = property.children?.[0]
        if (!key) continue
        if (keys.has(key.value))
          issues.push({
            path: [...getNodePath(node), key.value],
            message: '字段重复',
            from: key.offset,
            to: key.offset + key.length,
          })
        keys.add(key.value)
      }
    }
    node.children?.forEach(duplicates)
  }
  duplicates(tree)
  if (issues.length) return { syntaxValid: false, issues }
  const visit = (
    input: VsonSchema,
    current: JsonValue | undefined,
    path: JsonPath,
  ) => {
    if (
      input.readOnly &&
      base !== undefined &&
      !sameJson(current, valueAt(base, path))
    )
      add(path, '只读字段不能修改或删除')
    if (current === undefined) return
    if (input.anyOf && !input.anyOf.some((option) => matchesType(option, current))) {
      add(path, '值不符合可选的数据结构')
      return
    }
    const field = resolveSchema(input, current)
    if (!matchesType(field, current)) {
      add(path, field.enum ? '请选择允许的值' : `应为 ${field.type ?? '指定的值'}`)
      return
    }
    if (typeof current === 'number') {
      if (!Number.isFinite(current)) add(path, '数字必须有限')
      if (field.minimum !== undefined && current < field.minimum)
        add(path, `不能小于 ${field.minimum}`)
      if (field.exclusiveMinimum !== undefined && current <= field.exclusiveMinimum)
        add(path, `必须大于 ${field.exclusiveMinimum}`)
      if (field.maximum !== undefined && current > field.maximum)
        add(path, `不能大于 ${field.maximum}`)
    }
    if (typeof current === 'string') {
      if (field.minLength !== undefined && current.length < field.minLength)
        add(path, `至少 ${field.minLength} 个字符`)
      if (field.maxLength !== undefined && current.length > field.maxLength)
        add(path, `最多 ${field.maxLength} 个字符`)
    }
    if (isObject(current)) {
      for (const key of field.required ?? [])
        if (!Object.hasOwn(current, key)) add([...path, key], '缺少必填字段')
      for (const [key, child] of Object.entries(field.properties ?? {}))
        visit(child, current[key], [...path, key])
    }
    if (Array.isArray(current)) {
      if (field.minItems !== undefined && current.length < field.minItems)
        add(path, `至少 ${field.minItems} 项`)
      if (field.maxItems !== undefined && current.length > field.maxItems)
        add(path, `最多 ${field.maxItems} 项`)
      current.forEach((item, index) => {
        const identity = field.uniqueBy ? valueAt(item, [field.uniqueBy]) : item
        if (
          (field.uniqueItems || field.uniqueBy) &&
          current
            .slice(0, index)
            .some((previous) =>
              sameJson(
                field.uniqueBy ? valueAt(previous, [field.uniqueBy]) : previous,
                identity,
              ),
            )
        )
          add(
            [...path, index],
            field.uniqueBy ? `${field.uniqueBy} 不能重复` : '项目不能重复',
          )
        const child = itemSchema(field, index)
        if (child) visit(child, item, [...path, index])
      })
    }
  }
  visit(schema, value, [])
  return { value, issues, syntaxValid: true }
}
