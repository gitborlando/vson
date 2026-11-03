import type { ReactNode } from 'react'
import { css } from '@emotion/css'
import { classes } from './style-utils'

export function PanelHeader({
  title,
  icon,
  aside,
}: {
  title: string
  icon?: ReactNode
  aside?: ReactNode
}) {
  return (
    <header className={cls()}>
      <span className={cls('title')}>
        {icon}
        {title}
      </span>
      <span className={cls('aside')}>{aside}</span>
    </header>
  )
}
const cls = classes(css`
  & {
    padding: 15px 17px;
    border-bottom: 1px solid var(--border);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
  }
  &-title {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  &-aside {
    color: var(--muted);
    font-size: 12px;
  }
`)
