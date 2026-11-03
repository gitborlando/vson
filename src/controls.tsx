import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from 'react'
import { ark } from '@ark-ui/react/factory'
import { Dialog as ArkDialog } from '@ark-ui/react/dialog'
import { Portal } from '@ark-ui/react/portal'
import { Select as ArkSelect, createListCollection } from '@ark-ui/react/select'
import { Tabs as ArkTabs } from '@ark-ui/react/tabs'
import { Switch as ArkSwitch } from '@ark-ui/react/switch'
import { NumberInput } from '@ark-ui/react/number-input'
import { css, cx } from '@emotion/css'

const buttonClass = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 30px;
  padding: 0 10px;
  background: white;
  color: #4b515b;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  white-space: nowrap;
  &:hover:not(:disabled) {
    background: var(--gray-bg);
  }
  &[data-primary='true'] {
    background: var(--color);
    border-color: var(--color);
    color: white;
  }
  &[data-primary='true']:hover:not(:disabled) {
    background: #4054ba;
  }
  &[data-quiet='true'] {
    background: transparent;
    border-color: transparent;
  }
`
export const Button = forwardRef<
  HTMLButtonElement,
  ComponentProps<'button'> & { primary?: boolean; quiet?: boolean }
>(({ primary, quiet, className, type = 'button', ...props }, ref) => (
  <ark.button
    ref={ref}
    type={type}
    data-primary={primary}
    data-quiet={quiet}
    className={cx(buttonClass, className)}
    {...props}
  />
))
export const Input = forwardRef<HTMLInputElement, ComponentProps<'input'>>(
  ({ className, ...props }, ref) => (
    <ark.input ref={ref} className={cx(inputClass, className)} {...props} />
  ),
)
export const Textarea = forwardRef<HTMLTextAreaElement, ComponentProps<'textarea'>>(
  ({ className, ...props }, ref) => (
    <ark.textarea ref={ref} className={cx(inputClass, className)} {...props} />
  ),
)
const inputClass = css`
  width: 100%;
  padding: 7px 9px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: #fafbfc;
  color: inherit;
  &:focus {
    background: white;
    border-color: #adb5e5;
  }
`
export function CommitInput({
  value,
  onCommit,
  ...props
}: Omit<ComponentProps<typeof Input>, 'value' | 'onChange'> & {
  value: string
  onCommit: (value: string) => void
}) {
  const [buffer, setBuffer] = useState(value)
  useEffect(() => setBuffer(value), [value])
  return (
    <Input
      {...props}
      value={buffer}
      onChange={(e) => setBuffer(e.target.value)}
      onBlur={() => buffer !== value && onCommit(buffer)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur()
      }}
    />
  )
}
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
      }}
      className={css`
        display: flex;
        align-items: center;
        gap: 5px;
        min-width: 0;
      `}>
      {label && (
        <NumberInput.Label
          className={css`
            font-size: 11px;
            color: var(--muted);
          `}>
          {label}
        </NumberInput.Label>
      )}
      <NumberInput.Input aria-label={label} className={inputClass} />
    </NumberInput.Root>
  )
}
export function Select({
  value,
  options,
  onChange,
  label,
  disabled,
}: {
  value: string
  options: { label: string; value: string }[]
  onChange: (value: string) => void
  label: string
  disabled?: boolean
}) {
  const collection = createListCollection({ items: options })
  return (
    <ArkSelect.Root
      collection={collection}
      value={[value]}
      disabled={disabled}
      onValueChange={(detail) => detail.value[0] && onChange(detail.value[0])}
      positioning={{ sameWidth: true }}
      className={css`
        min-width: 100px;
      `}>
      <ArkSelect.Control>
        <ArkSelect.Trigger
          aria-label={label}
          className={css`
            ${buttonClass};
            width: 100%;
            justify-content: space-between;
            gap: 12px;
            text-align: left;
          `}>
          <ArkSelect.ValueText placeholder={label} />
          <ArkSelect.Indicator>⌄</ArkSelect.Indicator>
        </ArkSelect.Trigger>
      </ArkSelect.Control>
      <ArkSelect.HiddenSelect />
      <Portal>
        <ArkSelect.Positioner
          className={css`
            z-index: 70;
          `}>
          <ArkSelect.Content
            className={css`
              padding: 5px;
              background: white;
              border: 1px solid var(--border);
              border-radius: 7px;
              box-shadow: 0 7px 25px #20273516;
              min-width: 160px;
            `}>
            {collection.items.map((item) => (
              <ArkSelect.Item
                key={item.value}
                item={item}
                className={css`
                  padding: 8px 10px;
                  border-radius: 4px;
                  cursor: pointer;
                  &[data-highlighted] {
                    background: #eff1fb;
                  }
                  &[data-state='checked'] {
                    color: var(--color);
                  }
                `}>
                <ArkSelect.ItemText>{item.label}</ArkSelect.ItemText>
              </ArkSelect.Item>
            ))}
          </ArkSelect.Content>
        </ArkSelect.Positioner>
      </Portal>
    </ArkSelect.Root>
  )
}
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
      className={css`
        display: flex;
        flex-direction: column;
        flex: 1;
        min-height: 0;
      `}>
      <ArkTabs.List
        className={css`
          display: flex;
          gap: 16px;
          border-bottom: 1px solid var(--border);
          padding: 0 17px;
        `}>
        {items.map((item) => (
          <ArkTabs.Trigger
            key={item.value}
            value={item.value}
            className={css`
              border: 0;
              border-bottom: 2px solid transparent;
              color: var(--muted);
              background: none;
              padding: 13px 0 10px;
              &[data-selected] {
                border-bottom-color: var(--color);
                color: var(--color);
              }
            `}>
            {item.label}
          </ArkTabs.Trigger>
        ))}
      </ArkTabs.List>
      {items.map((item) => (
        <ArkTabs.Content
          key={item.value}
          value={item.value}
          className={css`
            overflow: auto;
            flex: 1;
            outline: none;
          `}>
          {item.content}
        </ArkTabs.Content>
      ))}
    </ArkTabs.Root>
  )
}
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
      className={css`
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        cursor: pointer;
      `}>
      <ArkSwitch.Label>{children}</ArkSwitch.Label>
      <ArkSwitch.Control
        className={css`
          width: 28px;
          height: 16px;
          padding: 2px;
          background: #d8dce5;
          border-radius: 20px;
          &[data-state='checked'] {
            background: var(--color);
          }
        `}>
        <ArkSwitch.Thumb
          className={css`
            display: block;
            width: 12px;
            height: 12px;
            background: white;
            border-radius: 50%;
            transition: transform 0.15s;
            &[data-state='checked'] {
              transform: translateX(12px);
            }
          `}
        />
      </ArkSwitch.Control>
      <ArkSwitch.HiddenInput />
    </ArkSwitch.Root>
  )
}
export function Dialog({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}) {
  return (
    <ArkDialog.Root
      open={open}
      onOpenChange={(details) => {
        if (!details.open) onClose()
      }}>
      <Portal>
        <ArkDialog.Backdrop
          className={css`
            position: fixed;
            inset: 0;
            background: #17203245;
            z-index: 80;
          `}
        />
        <ArkDialog.Positioner
          className={css`
            position: fixed;
            inset: 0;
            display: grid;
            place-items: center;
            z-index: 81;
            padding: 24px;
          `}>
          <ArkDialog.Content
            className={css`
              width: min(720px, 95vw);
              max-height: 85vh;
              overflow: auto;
              background: white;
              border-radius: 11px;
              box-shadow: 0 15px 90px #10182825;
              padding: 24px;
              outline: none;
            `}>
            <ArkDialog.Title
              className={css`
                font-size: 17px;
                font-weight: 600;
                margin-bottom: 18px;
              `}>
              {title}
            </ArkDialog.Title>
            <ArkDialog.Description
              className={css`
                position: absolute;
                width: 1px;
                height: 1px;
                overflow: hidden;
                clip-path: inset(50%);
              `}>
              {title}
            </ArkDialog.Description>
            {children}
          </ArkDialog.Content>
        </ArkDialog.Positioner>
      </Portal>
    </ArkDialog.Root>
  )
}
export function FileButton({
  children,
  accept,
  onFile,
  disabled,
}: {
  children: ReactNode
  accept?: string
  onFile: (file: File) => void
  disabled?: boolean
}) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <>
      <Button disabled={disabled} onClick={() => ref.current?.click()}>
        {children}
      </Button>
      <Input
        ref={ref}
        type='file'
        accept={accept}
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) onFile(file)
          event.target.value = ''
        }}
      />
    </>
  )
}
