import {
  autocompletion,
  type Completion,
  type CompletionSource,
} from '@codemirror/autocomplete'
import { linter, lintGutter } from '@codemirror/lint'
import { hoverTooltip } from '@codemirror/view'
import { getLocation, parse } from 'jsonc-parser'
import { initialValue, isObject, resolveSchema, schemaAt, valueAt } from './schema'
import type { JsonValue, VsonInspection, VsonSchema } from './types'

export const codeExtensions = (
  schema: VsonSchema,
  inspect: (text: string) => VsonInspection,
) => {
  const complete: CompletionSource = (context) => {
    const text = context.state.doc.toString()
    const location = getLocation(text, context.pos)
    const value = parse(text) as JsonValue | undefined
    const token = location.previousNode
    const inToken =
      token &&
      context.pos >= token.offset &&
      context.pos <= token.offset + token.length
    const from = inToken ? token.offset : context.pos
    const to = inToken ? token.offset + token.length : context.pos
    const options: Completion[] = []
    if (location.isAtPropertyKey) {
      const path = location.path.slice(0, -1)
      const parent = schemaAt(schema, value, path)
      if (!parent) return null
      const objectSchema = resolveSchema(parent, valueAt(value, path))
      const object = valueAt(value, path)
      const hasColon = /^\s*:/.test(text.slice(to))
      for (const [key, field] of Object.entries(objectSchema.properties ?? {})) {
        if (
          isObject(object) &&
          Object.hasOwn(object, key) &&
          key !== location.path.at(-1)
        )
          continue
        options.push({
          label: key,
          detail: field.title,
          info: field.description ?? field.title,
          type: 'property',
          boost: objectSchema.required?.includes(key) ? 1 : 0,
          apply:
            JSON.stringify(key) +
            (hasColon ? '' : ': ' + JSON.stringify(initialValue(field))),
        })
      }
    } else {
      const field = schemaAt(schema, value, location.path)
      if (!field) return null
      const variants = field.anyOf ?? [field]
      const candidates = variants.flatMap(
        (item) =>
          item.enum ??
          (item.const !== undefined
            ? [item.const]
            : item.type === 'boolean'
              ? [true, false]
              : [initialValue(item)]),
      )
      const seen = new Set<string>()
      for (const candidate of candidates) {
        const label = JSON.stringify(candidate)
        if (seen.has(label)) continue
        seen.add(label)
        const index = field.enum?.findIndex((option) => option === candidate) ?? -1
        options.push({
          label,
          detail: field.enumLabels?.[index] ?? field.title,
          info: field.description,
          type: 'value',
          apply: label,
        })
      }
    }
    if (!context.explicit && from === context.pos && !location.isAtPropertyKey)
      return null
    const prefix = text.slice(from, context.pos).replace(/^"/, '').toLowerCase()
    return {
      from,
      to,
      options: options.filter((option) =>
        option.label.replace(/^"/, '').toLowerCase().includes(prefix),
      ),
      filter: false,
    }
  }
  return [
    autocompletion({ override: [complete] }),
    lintGutter(),
    linter(
      (view) =>
        inspect(view.state.doc.toString()).issues.map((issue) => ({
          from: Math.min(view.state.doc.length, issue.from ?? 0),
          to: Math.min(view.state.doc.length, issue.to ?? issue.from ?? 0),
          severity: 'error' as const,
          message: issue.message,
        })),
      { delay: 250 },
    ),
    hoverTooltip((view, pos) => {
      const text = view.state.doc.toString()
      const location = getLocation(text, pos)
      const field = schemaAt(schema, parse(text) as JsonValue, location.path)
      if (!field?.title && !field?.description) return null
      return {
        pos: location.previousNode?.offset ?? pos,
        end: location.previousNode
          ? location.previousNode.offset + location.previousNode.length
          : pos,
        above: true,
        create: () => {
          const dom = document.createElement('div')
          dom.className = 'vson-code-description'
          dom.textContent = [field.title, field.description]
            .filter(Boolean)
            .join(' · ')
          return { dom }
        },
      }
    }),
  ]
}
