import { Switch as ArkSwitch } from '@ark-ui/react/switch'
import { css } from '@emotion/css'
import type { ReactNode } from 'react'
import { classes } from './style-utils'
export function Switch({
  checked,
  onChange,
  children,
  disabled,
  'aria-label': ariaLabel,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  children?: ReactNode
  disabled?: boolean
  'aria-label'?: string
}) {
  return (
    <ArkSwitch.Root
      checked={checked}
      disabled={disabled}
      onCheckedChange={(details) => onChange(details.checked)}
      className={cls()}>
      {children && (
        <ArkSwitch.Label className={cls('label')}>{children}</ArkSwitch.Label>
      )}
      <ArkSwitch.Control className={cls('control')}>
        <ArkSwitch.Thumb className={cls('thumb')} />
      </ArkSwitch.Control>
      <ArkSwitch.HiddenInput
        className={cls('hidden-input')}
        aria-label={ariaLabel}
      />
    </ArkSwitch.Root>
  )
}
const cls = classes('switch')(css`
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
    border: 1px solid #c8ced8;
    background: #e2e5eb;
    border-radius: 20px;
    transition:
      background 0.15s,
      border-color 0.15s;
  }
  &-control[data-state='checked'] {
    background: var(--color);
    border-color: var(--color);
  }
  &-control[data-focus-visible] {
    box-shadow: inset 0 0 0 1px #ffffff80;
  }
  &-thumb {
    display: block;
    width: 10px;
    height: 10px;
    background: #a9b2c1;
    border-radius: 50%;
    transition: transform 0.15s;
  }
  &-thumb[data-state='checked'] {
    transform: translateX(12px);
    background: white;
  }
`)
