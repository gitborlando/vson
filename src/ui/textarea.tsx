import { forwardRef, type ComponentProps } from 'react'
import { ark } from '@ark-ui/react/factory'
import { css, cx } from '@emotion/css'
import { classes } from './style-utils'
export const Textarea = forwardRef<HTMLTextAreaElement, ComponentProps<'textarea'>>(
  ({ className, ...props }, ref) => (
    <ark.textarea ref={ref} className={cx(cls(), className)} {...props} />
  ),
)
const cls = classes('textarea')(css`
  & {
    width: 100%;
    padding: 9px;
    background: var(--gray-bg);
    color: inherit;
    border: 0;
    border-radius: var(--border-radius);
    font-size: 12px;
    outline: none;
    resize: none;
  }
  &:focus {
    background: white;
    outline: 1px solid var(--color);
  }
`)
