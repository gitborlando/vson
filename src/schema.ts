import type { JsonPath, JsonValue, VsonSchema } from './types'

export const isObject = (value: unknown): value is Record<string, JsonValue> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

export const sameJson = (left: unknown, right: unknown): boolean => {
  if (Object.is(left, right)) return true
  if (Array.isArray(left) && Array.isArray(right))
    return (
      left.length === right.length &&
      left.every((item, i) => sameJson(item, right[i]))
    )
  if (!isObject(left) || !isObject(right)) return false
  const keys = Object.keys(left)
  return (
    keys.length === Object.keys(right).length &&
    keys.every((key) => Object.hasOwn(right, key) && sameJson(left[key], right[key]))
  )
}

export const matchesType = (schema: VsonSchema, value: JsonValue) => {
  if (schema.const !== undefined && value !== schema.const) return false
  if (schema.enum && !schema.enum.some((option) => option === value)) return false
  if (!schema.type) return true
  if (schema.type === 'object') {
    if (!isObject(value)) return false
    return Object.entries(schema.properties ?? {}).every(
      ([key, field]) =>
        field.const === undefined ||
        (!Object.hasOwn(value, key)
          ? !schema.required?.includes(key)
          : value[key] === field.const),
    )
  }
  if (schema.type === 'array') return Array.isArray(value)
  if (schema.type === 'null') return value === null
  if (schema.type === 'integer')
    return typeof value === 'number' && Number.isInteger(value)
  return typeof value === schema.type
}

export const resolveSchema = (schema: VsonSchema, value?: JsonValue): VsonSchema => {
  if (!schema.anyOf) return schema
  const { anyOf, ...rest } = schema
  const selected =
    anyOf.find((option) => value !== undefined && matchesType(option, value)) ??
    anyOf[0]
  return { ...rest, ...selected }
}

export const itemSchema = (schema: VsonSchema, index: number) =>
  Array.isArray(schema.items) ? schema.items[index] : schema.items

export const propertySchema = (schema: VsonSchema, key: string | number) =>
  schema.properties && Object.hasOwn(schema.properties, key)
    ? schema.properties[key]
    : undefined

export const valueAt = (
  value: JsonValue | undefined,
  path: JsonPath,
): JsonValue | undefined => {
  let current = value
  for (const part of path) {
    if (Array.isArray(current) && typeof part === 'number') current = current[part]
    else if (isObject(current) && Object.hasOwn(current, part))
      current = current[part]
    else return undefined
  }
  return current
}

export const schemaAt = (
  schema: VsonSchema,
  value: JsonValue | undefined,
  path: JsonPath,
): VsonSchema | undefined => {
  let field: VsonSchema | undefined = schema
  let current = value
  for (const part of path) {
    if (!field) return
    field = resolveSchema(field, current)
    field =
      typeof part === 'number'
        ? itemSchema(field, part)
        : propertySchema(field, part)
    current = valueAt(current, [part])
  }
  return field
}

export const initialValue = (input: VsonSchema): JsonValue => {
  const schema = resolveSchema(input)
  if (schema.default !== undefined) return structuredClone(schema.default)
  if (schema.const !== undefined) return schema.const
  if (schema.enum?.length) return schema.enum[0]
  if (schema.type === 'object')
    return Object.fromEntries(
      (schema.required ?? []).map((key) => [
        key,
        initialValue(schema.properties?.[key] ?? {}),
      ]),
    )
  if (schema.type === 'array')
    return Array.from(
      {
        length:
          schema.minItems ?? (Array.isArray(schema.items) ? schema.items.length : 0),
      },
      (_, index) => initialValue(itemSchema(schema, index) ?? {}),
    )
  if (schema.type === 'boolean') return false
  if (schema.type === 'number' || schema.type === 'integer')
    return (
      schema.minimum ??
      (schema.exclusiveMinimum === undefined ? 0 : schema.exclusiveMinimum + 1)
    )
  if (schema.type === 'null') return null
  return ''
}

export const pathLabel = (path: JsonPath) =>
  path.reduce<string>(
    (label, part) =>
      typeof part === 'number' ? `${label}[${part}]` : `${label}.${part}`,
    '$',
  )
