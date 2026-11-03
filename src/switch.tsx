import { Switch as ArkSwitch } from '@ark-ui/react/switch'
import { css } from '@emotion/css'
import type { ReactNode } from 'react'
import { classes } from './style-utils'
export function Switch({
  checked,
  onChange,
  children,
  disabled,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  children?: ReactNode
  disabled?: boolean
}) {
  return (
    <ArkSwitch.Root
      checked={checked}
      disabled={disabled}
      onCheckedChange={(details) => onChange(details.checked)}
      className={cls()}>
      <ArkSwitch.Label>{children}</ArkSwitch.Label>
      <ArkSwitch.Control className={cls('control')}>
        <ArkSwitch.Thumb className={cls('thumb')} />
      </ArkSwitch.Control>
      <ArkSwitch.HiddenInput />
    </ArkSwitch.Root>
  )
}
const cls = classes(css`
  & {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    cursor: pointer;
  }
  &[data-disabled] {
    opacity: 0.5;
    cursor: not-allowed;
  }
  &-control {
    width: 28px;
    height: 16px;
    padding: 2px;
    flex-shrink: 0;
    background: #d8dce5;
    border-radius: 20px;
  }
  &-control[data-state='checked'] {
    background: var(--color);
  }
  &-thumb {
    display: block;
    width: 12px;
    height: 12px;
    background: white;
    border-radius: 50%;
    transition: transform 0.15s;
  }
  &-thumb[data-state='checked'] {
    transform: translateX(12px);
  }
`)
