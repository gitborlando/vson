import { useEffect, useState } from 'react'
import { ark } from '@ark-ui/react/factory'
import { css, cx } from '@emotion/css'
import { classes, withCssVars } from './style-utils'

/** 始终覆盖最近的定位容器；立即拦截点击，延迟显示动画和背景。 */
export function Loading({
  boxed = false,
  maskColor = 'transparent',
  delay = 150,
  label = '加载中',
  className,
}: {
  boxed?: boolean
  maskColor?: string
  /** 动画和背景的显示延迟，单位 ms；设为 0 可立即显示。 */
  delay?: number
  label?: string
  className?: string
}) {
  const [visible, setVisible] = useState(delay <= 0)
  useEffect(() => {
    setVisible(delay <= 0)
    if (delay <= 0) return
    const timer = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  return (
    <ark.span
      className={cx(cls(), className)}
      style={withCssVars(undefined, { '--loading-mask-color': maskColor })}
      data-visible={visible}
      role='status'
      aria-label={label}
      onPointerDown={(event) => {
        event.preventDefault()
        event.stopPropagation()
      }}
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
      }}>
      <span className={cls('indicator')} data-boxed={boxed} aria-hidden='true'>
        <span className={cls('spinner')} />
      </span>
    </ark.span>
  )
}

const cls = classes(css`
  & {
    position: absolute;
    inset: 0;
    z-index: 32;
    display: grid;
    place-items: center;
    border-radius: inherit;
    background: transparent;
    pointer-events: auto;
    touch-action: none;
    cursor: wait;
    color: var(--color);
  }
  &[data-visible='true'] {
    background: var(--loading-mask-color);
  }
  &-indicator {
    display: grid;
    place-items: center;
    visibility: hidden;
  }
  &[data-visible='true'] &-indicator {
    visibility: visible;
  }
  &-indicator[data-boxed='true'] {
    width: 76px;
    height: 64px;
    border-radius: 12px;
    background: #fff;
    box-shadow: var(--shadow);
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
