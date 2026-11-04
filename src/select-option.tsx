import { Portal, Select as ArkSelect, createListCollection } from '@ark-ui/react'
import { forwardRef, useMemo, type ComponentPropsWithRef } from 'react'
import { css, cx } from '@emotion/css'
import { classes } from './style-utils'
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
      onChange,
      ...rest
    },
    ref,
  ) => {
    const collection = useMemo(
      () => createListCollection({ items: options }),
      [options],
    )
    const menuOffset = options.length < 3 ? -((options.length + 1) * 30) / 2 : -60

    return (
      <ArkSelect.Root
        ref={ref}
        collection={collection}
        value={value === undefined ? undefined : [value]}
        defaultValue={defaultValue === undefined ? undefined : [defaultValue]}
        disabled={disabled}
        positioning={{
          placement: 'bottom-start',
          strategy: 'fixed',
          gutter: menuOffset,
          sameWidth: true,
          fitViewport: true,
          flip: false,
          slide: true,
          overflowPadding: 8,
        }}
        onValueChange={({ value }) => value[0] && onChange?.(value[0])}
        className={cx(cls(), className)}
        {...rest}>
        <ArkSelect.Control>
          <ArkSelect.Trigger aria-label={label} className={cls('trigger')}>
            <ArkSelect.ValueText placeholder={placeholder} />
            <ArkSelect.Indicator className={cls('indicator')}>
              <Lucide icon={ChevronDown} size={14} />
            </ArkSelect.Indicator>
          </ArkSelect.Trigger>
        </ArkSelect.Control>
        <ArkSelect.HiddenSelect />
        <Portal>
          <ArkSelect.Positioner className={cls('positioner')}>
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

const cls = classes(css`
  @layer local-components {
    & {
      width: 100%;
      min-width: 0;
    }

    &-trigger {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: center;
      width: 100%;
      height: 30px;
      padding-inline: 8px 6px;
      border: 0;
      outline: 0;
      color: rgba(0, 0, 0, 0.78);
      background: var(--gray-bg);
      font-size: 12px;
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
      height: 30px;
      outline: 0;
      font-size: 12px;

      &[data-highlighted] {
        color: white;
        background: var(--color);
      }

      &[data-disabled] {
        opacity: 0.4;
        cursor: not-allowed;
      }
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
