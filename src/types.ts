export type JsonPrimitive = string | number | boolean | null
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue }
export type JsonPath = (string | number)[]

/** VSON 支持的 JSON Schema 子集；format=image 和 mediaKind 为显示增强。 */
export type VsonSchema = {
  type?: 'object' | 'array' | 'string' | 'number' | 'integer' | 'boolean' | 'null'
  title?: string
  description?: string
  properties?: Record<string, VsonSchema>
  required?: string[]
  items?: VsonSchema | VsonSchema[]
  anyOf?: VsonSchema[]
  enum?: JsonPrimitive[]
  enumLabels?: string[]
  const?: JsonPrimitive
  default?: JsonValue
  readOnly?: boolean
  minItems?: number
  maxItems?: number
  minimum?: number
  exclusiveMinimum?: number
  maximum?: number
  minLength?: number
  maxLength?: number
  format?: 'image'
  mediaKind?: string
}

export type VsonIssue = {
  path: JsonPath
  message: string
  from?: number
  to?: number
}
export type VsonInspection = {
  value?: JsonValue
  issues: VsonIssue[]
  syntaxValid: boolean
}

export type VsonMediaItem = { id: string; name: string; url: string }
export type VsonMediaAdapter = {
  unavailableReason?: string
  list: (signal: AbortSignal) => Promise<VsonMediaItem[]>
  upload: (file: File, kind?: string) => Promise<VsonMediaItem>
}
