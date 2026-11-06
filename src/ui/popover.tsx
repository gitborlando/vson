import { Popover as ArkPopover, Portal } from '@ark-ui/react'
import { css, cx } from '@emotion/css'
import type { ReactElement, ReactNode } from 'react'
import { X } from 'lucide-react'
import { Button } from './button'
import { classes } from './style-utils'

export function Popover({
  title,
  trigger,
  children,
  onOpenChange,
  showHeader = true,
  className,
}: {
  title: string
  trigger: ReactElement
  children: ReactNode
  onOpenChange?: (open: boolean) => void
  showHeader?: boolean
  className?: string
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
      <ArkPopover.Trigger className={cls('trigger')} asChild>
        {trigger}
      </ArkPopover.Trigger>
      <Portal>
        <ArkPopover.Positioner className={cls('positioner')}>
          <ArkPopover.Content className={cx(cls(), className)}>
            {showHeader ? (
              <div className={cls('header')}>
                <ArkPopover.Title className={cls('title')}>{title}</ArkPopover.Title>
                <ArkPopover.CloseTrigger className={cls('close-trigger')} asChild>
                  <Button title='关闭' aria-label='关闭' icon={<X size={14} />} />
                </ArkPopover.CloseTrigger>
              </div>
            ) : (
              <ArkPopover.Title className={cx(cls('title'), cls('hidden-title'))}>
                {title}
              </ArkPopover.Title>
            )}
            <div className={cls('body')}>{children}</div>
          </ArkPopover.Content>
        </ArkPopover.Positioner>
      </Portal>
    </ArkPopover.Root>
  )
}

const cls = classes('popover')(css`
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
  &-hidden-title {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
`)
