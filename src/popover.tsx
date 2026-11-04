import { Popover as ArkPopover, Portal } from '@ark-ui/react'
import { css } from '@emotion/css'
import type { ReactElement, ReactNode } from 'react'
import { X } from 'lucide-react'
import { Button } from './button'
import { classes } from './style-utils'

export function Popover({
  title,
  trigger,
  children,
  onOpenChange,
}: {
  title: string
  trigger: ReactElement
  children: ReactNode
  onOpenChange?: (open: boolean) => void
}) {
  return (
    <ArkPopover.Root
      lazyMount
      unmountOnExit
      onOpenChange={({ open }) => onOpenChange?.(open)}
      positioning={{
        placement: 'left-start',
        strategy: 'fixed',
        gutter: 8,
        flip: true,
        slide: true,
        fitViewport: true,
        overflowPadding: 12,
      }}>
      <ArkPopover.Trigger asChild>{trigger}</ArkPopover.Trigger>
      <Portal>
        <ArkPopover.Positioner className={cls('positioner')}>
          <ArkPopover.Content className={cls()}>
            <div className={cls('header')}>
              <ArkPopover.Title>{title}</ArkPopover.Title>
              <ArkPopover.CloseTrigger asChild>
                <Button title='关闭' aria-label='关闭' icon={<X size={14} />} />
              </ArkPopover.CloseTrigger>
            </div>
            <div className={cls('body')}>{children}</div>
          </ArkPopover.Content>
        </ArkPopover.Positioner>
      </Portal>
    </ArkPopover.Root>
  )
}

const cls = classes(css`
  &-positioner {
    z-index: 900;
  }
  & {
    display: flex;
    flex-direction: column;
    width: min(360px, calc(100vw - 24px));
    max-height: min(560px, var(--available-height, calc(100dvh - 24px)));
    overflow: hidden;
    border: 1px solid var(--border);
    border-radius: var(--border-radius);
    background: white;
    box-shadow: var(--shadow);
    outline: none;
  }
  &-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
    padding: 6px 8px 6px 12px;
    border-bottom: 1px solid var(--border);
    font-size: 12px;
    font-weight: 600;
  }
  &-body {
    min-height: 0;
    overflow: auto;
    overscroll-behavior: contain;
  }
`)
