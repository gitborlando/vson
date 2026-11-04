import {
  initialValue,
  isObject,
  matchesType,
  resolveSchema,
  sameJson,
  valueAt,
} from './schema'
import type { JsonValue, VsonSchema } from './types'

export const creationOptions = (
  input: VsonSchema,
  existing: JsonValue[] = [],
  array?: VsonSchema,
) => {
  const schema = resolveSchema(input)
  const initial = initialValue(input)
  const key = array?.uniqueBy
  const keySchema = key ? schema.properties?.[key] : undefined
  const options = schema.creationOptions?.length
    ? schema.creationOptions
    : key && isObject(initial) && keySchema?.enum?.length
      ? keySchema.enum.map((value, index) => ({
          label: keySchema.enumLabels?.[index] ?? String(value),
          value: { ...initial, [key]: value },
        }))
      : schema.enum?.length
        ? schema.enum.map((value, index) => ({
            label: schema.enumLabels?.[index] ?? String(value),
            value,
          }))
        : [{ label: schema.title ?? '默认值', value: initial }]
  const identity = (value: JsonValue) =>
    array?.uniqueBy ? valueAt(value, [array.uniqueBy]) : value
  const unused = options.filter(
    (option) =>
      !existing.some((item) => sameJson(identity(item), identity(option.value))),
  )
  const available =
    unused.length || array?.uniqueItems || array?.uniqueBy ? unused : options
  const preferred =
    schema.default === undefined
      ? available
      : [...available].sort(
          (left, right) =>
            Number(sameJson(right.value, initial)) -
            Number(sameJson(left.value, initial)),
        )
  return preferred.map((option) => ({
    ...option,
    value:
      input.omitFalse &&
      option.value === false &&
      matchesType(resolveSchema(input, true), true)
        ? true
        : structuredClone(option.value),
  }))
}
