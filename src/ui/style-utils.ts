import type { CSSProperties } from 'react'

// Adapted from Sigma view/styles/classes.ts.
export const classes = (name: string) => (suffix?: string) =>
  suffix ? name + '-' + suffix : name
export const withCssVars = (
  style: CSSProperties | undefined,
  values: Record<string, string | number | undefined>,
) => ({ ...style, ...values }) as CSSProperties
