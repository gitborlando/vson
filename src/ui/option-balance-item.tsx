import { forwardRef, type ComponentPropsWithRef, type ReactNode } from 'react'
import { Check } from 'lucide-react'
import { ark } from '@ark-ui/react/factory'
import { css, cx } from '@emotion/css'
import { classes } from './style-utils'
import { styles } from './styles'

// Adapted from Sigma OptionBalanceItem; removes its application-level Grid/Text dependency.
export interface OptionBalanceItemProps extends ComponentPropsWithRef<'div'> {
  label: string
  icon?: ReactNode
  reserveIconSpace?: boolean
  needHoverStyle?: boolean
  disabled?: boolean
  checked?: boolean
  onChecked?: (checked: boolean) => void
}
export const OptionBalanceItem = forwardRef<HTMLDivElement, OptionBalanceItemProps>(
  (
    {
      className,
      label,
      icon,
      reserveIconSpace = true,
      needHoverStyle = true,
      disabled,
      checked,
      onChecked,
      onClick,
      children,
      ...rest
    },
    ref,
  ) => {
    const checkable = checked !== undefined && onChecked !== undefined
    return (
      <ark.div
        ref={ref}
        {...rest}
        className={cx(
          cls(),
          needHoverStyle && cls('hover'),
          disabled && cls('disabled'),
          className,
        )}
        onClick={(event) => {
          if (disabled) return
          onClick?.(event)
          onChecked?.(!checked)
        }}>
        <span className={cls('left')}>
          {reserveIconSpace && (
            <span className={cls('icon')}>
              {checkable ? checked && <Check size={16} /> : icon}
            </span>
          )}
          {!reserveIconSpace && icon}
          <span>{label}</span>
        </span>
        <span className={cls('right')}>{children}</span>
      </ark.div>
    )
  },
)
const cls = classes(css`
  @layer local-components {
    & {
      display: flex;
      width: 100%;
      height: 32px;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      padding-inline: 8px 20px;
      cursor: pointer;
      ${styles.borderRadiusSM}
    }
    &-left,
    &-right {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    &-icon {
      display: inline-flex;
      min-width: 16px;
      color: var(--color);
    }
    &-disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    &-hover:hover:not(&-disabled) {
      color: white;
      background: var(--color);
    }
    &-hover:hover:not(&-disabled) &-icon {
      color: white;
    }
  }
`)
