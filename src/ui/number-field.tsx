import { NumberInput } from '@ark-ui/react/number-input'
import { css } from '@emotion/css'
import { classes } from './style-utils'
export function NumberField({
  value,
  onChange,
  onCommit,
  min = 0,
  max = 10000,
  step = 1,
  label,
}: {
  value: number
  onChange: (value: number) => void
  onCommit: () => void
  min?: number
  max?: number
  step?: number
  label?: string
}) {
  return (
    <NumberInput.Root
      value={String(value)}
      min={min}
      max={max}
      step={step}
      className={cls()}
      onValueChange={(details) => {
        if (Number.isFinite(details.valueAsNumber)) onChange(details.valueAsNumber)
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) onCommit()
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          onCommit()
          ;(event.target as HTMLElement).blur()
        }
      }}>
      {label && (
        <NumberInput.Label className={cls('label')}>{label}</NumberInput.Label>
      )}
      <NumberInput.Input aria-label={label} className={cls('input')} />
    </NumberInput.Root>
  )
}
const cls = classes(css`
  & {
    display: flex;
    align-items: center;
    gap: 5px;
    min-width: 0;
  }
  &-label {
    font-size: 11px;
    color: var(--muted);
    white-space: nowrap;
  }
  &-input {
    width: 100%;
    height: 30px;
    min-width: 0;
    padding: 0 8px;
    background: var(--gray-bg);
    border: 0;
    border-radius: var(--border-radius);
    font-size: 12px;
    color: inherit;
  }
  &-input:focus {
    background: white;
    outline: 1px solid var(--color);
  }
`)
