export type JsonPrimitive = string | number | boolean | null
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue }
export type JsonPath = (string | number)[]

/** 结构视图的展开状态，不写入配置 JSON。 */
export type VsonExpansion = { all: boolean; paths: Record<string, boolean> }

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
  /** 字段级结构编辑规则：可选对象字段设为 false 时删除键；默认保留 false。 */
  omitFalse?: boolean
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
