import { Tabs as ArkTabs } from '@ark-ui/react/tabs'
import { css } from '@emotion/css'
import type { ReactNode } from 'react'
import { classes } from './style-utils'
export function Tabs({
  items,
  value,
  onChange,
}: {
  items: { value: string; label: ReactNode; content: ReactNode }[]
  value: string
  onChange: (value: string) => void
}) {
  return (
    <ArkTabs.Root
      value={value}
      onValueChange={(details) => onChange(details.value)}
      className={cls()}>
      <ArkTabs.List className={cls('list')}>
        {items.map((item) => (
          <ArkTabs.Trigger
            key={item.value}
            value={item.value}
            className={cls('trigger')}>
            {item.label}
          </ArkTabs.Trigger>
        ))}
      </ArkTabs.List>
      {items.map((item) => (
        <ArkTabs.Content
          key={item.value}
          value={item.value}
          className={cls('content')}>
          {item.content}
        </ArkTabs.Content>
      ))}
    </ArkTabs.Root>
  )
}
const cls = classes('tabs')(css`
  & {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
  }
  &-list {
    display: flex;
    gap: 14px;
    padding: 0 10px;
    flex-shrink: 0;
    border-bottom: 1px solid var(--border);
  }
  &-trigger {
    border: 0;
    border-bottom: 2px solid transparent;
    color: var(--muted);
    background: none;
    padding: 8px 0 6px;
    font-size: 12px;
  }
  &-trigger[data-selected] {
    border-bottom-color: var(--color);
    color: var(--color);
  }
  &-content {
    overflow: auto;
    flex: 1;
    min-height: 0;
    overscroll-behavior: contain;
    outline: none;
  }
`)
