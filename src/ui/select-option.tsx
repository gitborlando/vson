import { Portal, Select as ArkSelect, createListCollection } from '@ark-ui/react'
import {
  forwardRef,
  useMemo,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type ReactElement,
} from 'react'
import { css, cx } from '@emotion/css'
import { classes, withCssVars } from './style-utils'
import { styles } from './styles'
import { Check, ChevronDown } from 'lucide-react'
import { OptionBalanceItem } from './option-balance-item'
import { Lucide } from './lucide'

export type SelectOptionItem = { label: string; value: string; disabled?: boolean }

export interface SelectOptionProps extends Omit<
  ComponentPropsWithRef<'div'>,
  'defaultValue' | 'onChange' | 'onSelect'
> {
  label?: string
  options: SelectOptionItem[]
  value?: string
  defaultValue?: string
  placeholder?: string
  disabled?: boolean
  autoWidth?: boolean
  trigger?: ReactElement
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  onChange?: (value: string) => void
}

export const Select = forwardRef<HTMLDivElement, SelectOptionProps>(
  (
    {
      className,
      options,
      value,
      defaultValue,
      placeholder,
      label,
      disabled,
      autoWidth,
      trigger,
      defaultOpen,
      onOpenChange,
      onChange,
      ...rest
    },
    ref,
  ) => {
    const root = useRef<HTMLDivElement | null>(null)
    const [typography, setTypography] = useState<Record<string, string>>({})
    const collection = useMemo(
      () => createListCollection({ items: options }),
      [options],
    )
    const readTypography = () => {
      if (!root.current) return
      const computed = getComputedStyle(root.current)
      setTypography({
        '--select-font-family': computed.fontFamily,
        '--select-font-size': computed.fontSize,
        '--select-line-height': computed.lineHeight,
      })
    }
    useLayoutEffect(() => {
      if (defaultOpen) readTypography()
    }, [defaultOpen])

    return (
      <ArkSelect.Root
        ref={(element) => {
          root.current = element
          if (typeof ref === 'function') return ref(element)
          if (ref) ref.current = element
        }}
        collection={collection}
        value={value === undefined ? undefined : [value]}
        defaultValue={defaultValue === undefined ? undefined : [defaultValue]}
        disabled={disabled}
        data-auto-width={autoWidth || undefined}
        defaultOpen={defaultOpen}
        positioning={{
          placement: 'bottom-start',
          strategy: 'fixed',
          gutter: 4,
          sameWidth: false,
          fitViewport: true,
          flip: true,
          slide: true,
          overflowPadding: 8,
        }}
        onValueChange={({ value }) => value[0] && onChange?.(value[0])}
        onOpenChange={({ open }) => {
          if (open) readTypography()
          onOpenChange?.(open)
        }}
        className={cx(cls(), className)}
        {...rest}>
        <ArkSelect.Control className={cls('control')}>
          {trigger ? (
            <ArkSelect.Trigger
              aria-label={label}
              className='vson-select-trigger'
              asChild>
              {trigger}
            </ArkSelect.Trigger>
          ) : (
            <ArkSelect.Trigger aria-label={label} className={cls('trigger')}>
              <ArkSelect.ValueText
                className={cls('value-text')}
                placeholder={placeholder}
              />
              <ArkSelect.Indicator className={cls('indicator')}>
                <Lucide icon={ChevronDown} size={14} />
              </ArkSelect.Indicator>
            </ArkSelect.Trigger>
          )}
        </ArkSelect.Control>
        <ArkSelect.HiddenSelect className={cls('hidden-select')} />
        <Portal>
          <ArkSelect.Positioner
            className={cls('positioner')}
            data-custom-trigger={Boolean(trigger) || undefined}
            style={withCssVars(undefined, typography)}>
            <ArkSelect.Content className={cls('content')}>
              {options.map((option) => (
                <ArkSelect.Item item={option} key={option.value} asChild>
                  <OptionBalanceItem
                    label={option.label}
                    disabled={option.disabled}
                    needHoverStyle={false}
                    className={cls('item')}
                    icon={
                      <ArkSelect.ItemIndicator className={cls('item-indicator')}>
                        <Lucide icon={Check} size={14} />
                      </ArkSelect.ItemIndicator>
                    }
                  />
                </ArkSelect.Item>
              ))}
            </ArkSelect.Content>
          </ArkSelect.Positioner>
        </Portal>
      </ArkSelect.Root>
    )
  },
)

const cls = classes('select')(css`
  @layer local-components {
    & {
      width: 100%;
      min-width: 0;
      font-size: 12px;
    }
    &[data-auto-width] {
      width: max-content;
      max-width: 100%;
      flex-shrink: 1;
    }

    &-trigger {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: center;
      width: 100%;
      height: max(30px, 1.8em);
      padding-inline: 8px 6px;
      border: 0;
      outline: 0;
      color: rgba(0, 0, 0, 0.78);
      background: var(--gray-bg);
      font: inherit;
      text-align: left;
      cursor: pointer;
      ${styles.borderRadius}

      &:focus-visible,
      &[data-state='open'] {
        background: white;
        outline: 1px solid var(--color);
      }

      &[data-disabled] {
        opacity: 0.4;
        cursor: not-allowed;
      }
    }

    &-indicator {
      display: inline-flex;
      transition: rotate 0.15s ease;

      &[data-state='open'] {
        rotate: 180deg;
      }
    }

    &-trigger [data-part='value-text'] {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &-positioner {
      z-index: 1000;
      width: max-content;
      min-width: max(160px, var(--reference-width, 0px));
      max-width: min(480px, calc(100vw - 16px));
      font-family: var(--select-font-family, inherit);
      font-size: var(--select-font-size, 12px);
      line-height: var(--select-line-height, normal);
    }

    &-positioner[data-custom-trigger] {
      min-width: 180px;
    }

    &-content {
      position: relative;
      z-index: 1000;
      width: 100%;
      max-height: inherit;
      padding: 6px;
      overflow-y: auto;
      outline: 0;
      background: white;
      ${styles.shadow}
      ${styles.borderRadius}
    }

    &-item {
      height: auto;
      min-height: max(30px, 1.8em);
      padding-block: 4px;
      outline: 0;
      font: inherit;
      white-space: nowrap;
      padding-inline: 8px 12px;

      &[data-highlighted] {
        color: white;
        background: var(--color);
      }

      &[data-disabled] {
        opacity: 0.4;
        cursor: not-allowed;
      }
    }

    &-item > span:first-child {
      min-width: 0;
    }
    &-item > span:first-child > span:last-child {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    &-item > span:last-child:empty {
      display: none;
    }

    &-item-indicator {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      color: var(--color);

      &[data-state='unchecked'] {
        display: none;
      }
    }

    &-item[data-highlighted] &-item-indicator {
      color: white;
    }
  }
`)
