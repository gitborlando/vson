import { forwardRef, type ComponentProps } from 'react'
import { ark } from '@ark-ui/react/factory'
import { css, cx } from '@emotion/css'
import { classes } from './style-utils'
export const Input = forwardRef<HTMLInputElement, ComponentProps<'input'>>(
  ({ className, ...props }, ref) => (
    <ark.input ref={ref} className={cx(cls(), className)} {...props} />
  ),
)
const cls = classes(css`
  & {
    width: 100%;
    height: 30px;
    padding: 0 8px;
    background: var(--gray-bg);
    color: inherit;
    border: 0;
    border-radius: var(--border-radius);
    outline: none;
    font-size: 12px;
  }
  &:focus {
    background: white;
    outline: 1px solid var(--color);
  }
  &[hidden] {
    display: none;
  }
`)
