import { Dialog as ArkDialog } from '@ark-ui/react/dialog'
import { css, cx } from '@emotion/css'
import { classes } from './style-utils'

/** masked 模式覆盖最近的定位容器，不使用全屏 Portal。 */
export function Loading({
  variant = 'spinner',
  label = '加载中',
  className,
}: {
  variant?: 'spinner' | 'masked'
  label?: string
  className?: string
}) {
  const spinner = (
    <span className={cls('spinner')} role='status' aria-label={label} />
  )
  if (variant === 'spinner')
    return <span className={cx(cls(), className)}>{spinner}</span>

  return (
    <ArkDialog.Root
      open
      modal={false}
      trapFocus
      preventScroll={false}
      closeOnEscape={false}
      closeOnInteractOutside={false}>
      <ArkDialog.Backdrop className={cls('mask')} />
      <ArkDialog.Positioner className={cls('positioner')}>
        <ArkDialog.Content className={cx(cls('box'), className)}>
          <ArkDialog.Title className={cls('title')}>{label}</ArkDialog.Title>
          {spinner}
        </ArkDialog.Content>
      </ArkDialog.Positioner>
    </ArkDialog.Root>
  )
}

const cls = classes(css`
  & {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: var(--color);
    vertical-align: middle;
  }
  &-spinner {
    display: block;
    width: 20px;
    height: 20px;
    box-sizing: border-box;
    border: 2px solid currentColor;
    border-right-color: transparent;
    border-radius: 50%;
    animation: workbench-loading-spin 0.7s linear infinite;
  }
  &-mask {
    position: absolute;
    inset: 0;
    z-index: 32;
    background: #17203235;
  }
  &-positioner {
    position: absolute;
    inset: 0;
    z-index: 33;
    display: grid;
    place-items: center;
    cursor: wait;
  }
  &-box {
    display: grid;
    place-items: center;
    width: 76px;
    height: 64px;
    border-radius: 12px;
    background: #fff;
    color: var(--color);
    box-shadow: var(--shadow);
    outline: none;
  }
  &-title {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
  @keyframes workbench-loading-spin {
    to {
      transform: rotate(360deg);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    &-spinner {
      animation-duration: 1.4s;
    }
  }
`)
