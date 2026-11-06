import type { CSSProperties } from 'react'

// 稳定类名供宿主覆盖；Emotion 类名及其后缀继续承载默认样式。
export const classes =
  (component: string) => (name: string) => (suffix?: string) => {
    const part = suffix ? `-${suffix}` : ''
    return `vson-${component}${part} ${name}${part}`
  }
export const withCssVars = (
  style: CSSProperties | undefined,
  values: Record<string, string | number | undefined>,
) => ({ ...style, ...values }) as CSSProperties
