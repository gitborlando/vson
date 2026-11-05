import { Dialog as ArkDialog } from '@ark-ui/react/dialog'
import { css } from '@emotion/css'
import { useRef, useState, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { Button } from './button'
import { classes, withCssVars } from './style-utils'

// 留在宿主容器内渲染，使预览设备内的遮罩、圆角和安全区保持一致。
export function BottomSheet({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
}) {
  const start = useRef<{ y: number; scale: number }>()
  const [offset, setOffset] = useState(0)
  const close = () => {
    start.current = undefined
    setOffset(0)
    onClose()
  }
  return (
    <ArkDialog.Root
      open={open}
      lazyMount
      unmountOnExit
      modal={false}
      preventScroll={false}
      trapFocus
      onOpenChange={({ open }) => {
        if (!open) close()
      }}>
      <ArkDialog.Backdrop className={cls('backdrop')} />
      <ArkDialog.Positioner className={cls('positioner')}>
        <ArkDialog.Content
          className={cls()}
          style={withCssVars(undefined, { '--sheet-offset': offset + 'px' })}>
          <div
            className={cls('handle')}
            onPointerDown={(event) => {
              start.current = {
                y: event.clientY,
                scale:
                  event.currentTarget.getBoundingClientRect().width /
                    event.currentTarget.offsetWidth || 1,
              }
              event.currentTarget.setPointerCapture(event.pointerId)
            }}
            onPointerMove={(event) => {
              if (start.current !== undefined)
                setOffset(
                  Math.max(
                    0,
                    (event.clientY - start.current.y) / start.current.scale,
                  ),
                )
            }}
            onPointerUp={() => {
              start.current = undefined
              if (offset > 70) close()
              else setOffset(0)
            }}
            onPointerCancel={() => {
              start.current = undefined
              setOffset(0)
            }}
            onLostPointerCapture={() => {
              start.current = undefined
              setOffset(0)
            }}>
            <span />
          </div>
          <header className={cls('header')}>
            <ArkDialog.Title>{title}</ArkDialog.Title>
            <ArkDialog.CloseTrigger asChild>
              <Button
                title='关闭面板'
                aria-label='关闭面板'
                icon={<X size={18} />}
                size={30}
              />
            </ArkDialog.CloseTrigger>
          </header>
          <div className={cls('body')}>{children}</div>
          {footer && <footer className={cls('footer')}>{footer}</footer>}
        </ArkDialog.Content>
      </ArkDialog.Positioner>
    </ArkDialog.Root>
  )
}

const cls = classes(css`
  &-backdrop {
    position: absolute;
    inset: 0;
    z-index: 30;
    background: #0006;
  }
  &-positioner {
    position: absolute;
    inset: 0;
    z-index: 31;
    display: flex;
    align-items: flex-end;
    pointer-events: none;
  }
  & {
    width: 100%;
    max-height: calc(
      100% - var(--safe-area-top, env(safe-area-inset-top, 0px)) - var(
          --navigation-height,
          0px
        )
    );
    min-height: 160px;
    display: flex;
    flex-direction: column;
    pointer-events: auto;
    transform: translateY(var(--sheet-offset, 0px));
    border-radius: 24px 24px 0 0;
    background: white;
    overflow: hidden;
    outline: none;
    padding-bottom: var(--safe-area-bottom, env(safe-area-inset-bottom, 0px));
    box-shadow: 0 -8px 32px #00000012;
    animation: sheet-enter 0.18s ease-out;
  }
  &-handle {
    height: 20px;
    flex-shrink: 0;
    display: grid;
    place-items: center;
    touch-action: none;
    cursor: grab;
  }
  &-handle span {
    width: 36px;
    height: 4px;
    border-radius: 4px;
    background: #d6d7db;
  }
  &-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px 10px;
    flex-shrink: 0;
    font-size: 17px;
    font-weight: 600;
  }
  &-body {
    padding: 4px 16px 16px;
    min-height: 0;
    overflow: auto;
    overscroll-behavior: contain;
  }
  &-footer {
    flex-shrink: 0;
    padding: 12px 16px;
    border-top: 1px solid var(--border);
  }
  @keyframes sheet-enter {
    from {
      translate: 0 24px;
      opacity: 0;
    }
    to {
      translate: 0 0;
      opacity: 1;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    & {
      animation: none;
    }
  }
`)
