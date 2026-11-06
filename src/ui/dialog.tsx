import { Dialog as ArkDialog } from '@ark-ui/react/dialog'
import { Portal } from '@ark-ui/react/portal'
import { css } from '@emotion/css'
import type { ReactNode } from 'react'
import { classes } from './style-utils'
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
        <ArkDialog.Backdrop className={cls('backdrop')} />
        <ArkDialog.Positioner className={cls('positioner')}>
          <ArkDialog.Content className={cls('content')}>
            <ArkDialog.Title className={cls('title')}>{title}</ArkDialog.Title>
            <ArkDialog.Description className={cls('description')}>
              {title}
            </ArkDialog.Description>
            {children}
          </ArkDialog.Content>
        </ArkDialog.Positioner>
      </Portal>
    </ArkDialog.Root>
  )
}
const cls = classes('dialog')(css`
  &-backdrop {
    position: fixed;
    inset: 0;
    background: #17203245;
    z-index: 80;
  }
  &-positioner {
    position: fixed;
    inset: 0;
    display: grid;
    place-items: center;
    z-index: 81;
    padding: 24px;
  }
  &-content {
    width: min(720px, 95vw);
    max-height: 85vh;
    overflow: auto;
    background: white;
    border-radius: 11px;
    box-shadow: 0 15px 90px #10182825;
    padding: 24px;
    outline: none;
  }
  &-title {
    font-size: 17px;
    font-weight: 600;
    margin-bottom: 18px;
  }
  &-description {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
  }
`)
