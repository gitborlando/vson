import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ark } from '@ark-ui/react/factory'
import { css, cx } from '@emotion/css'
import { classes, withCssVars } from './style-utils'

/** 始终锁定最近的定位容器交互；颜色与延迟只控制视觉显示。 */
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
  const mask = useRef<HTMLSpanElement>(null)
  useLayoutEffect(() => {
    const element = mask.current
    const host = element?.offsetParent
    if (!element || !(host instanceof HTMLElement)) return

    const releases: (() => void)[] = []
    let branch: Element = element
    while (branch.parentElement) {
      const parent = branch.parentElement
      for (const sibling of parent.children) {
        if (sibling !== branch) releases.push(lockContent(sibling))
      }
      if (parent === host) break
      branch = parent
    }
    const block = (event: Event) => {
      // 允许 Tab 离开当前区域，区域内的内容已通过 inert 移出焦点顺序。
      if (event instanceof KeyboardEvent && event.key === 'Tab') return
      event.preventDefault()
      event.stopImmediatePropagation()
    }
    for (const event of blockedEvents)
      host.addEventListener(event, block, { capture: true, passive: false })
    return () => {
      for (const event of blockedEvents) host.removeEventListener(event, block, true)
      for (const release of releases) release()
    }
  }, [])
  useEffect(() => {
    setVisible(delay <= 0)
    if (delay <= 0) return
    const timer = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  return (
    <ark.span
      ref={mask}
      className={cx(cls(), className)}
      style={withCssVars(undefined, { '--loading-mask-color': maskColor })}
      data-visible={visible}
      role='status'
      aria-label={label}>
      <span className={cls('indicator')} data-boxed={boxed} aria-hidden='true'>
        <span className={cls('spinner')} />
      </span>
    </ark.span>
  )
}

// 多个加载区域可能同时覆盖同一子树，最后一处释放后才恢复原状态。
const locks = new WeakMap<Element, { count: number; inert: boolean }>()
const lockContent = (element: Element) => {
  const lock = locks.get(element) ?? {
    count: 0,
    inert: element.hasAttribute('inert'),
  }
  lock.count++
  locks.set(element, lock)
  element.setAttribute('inert', '')
  return () => {
    if (--lock.count) return
    if (!lock.inert) element.removeAttribute('inert')
    locks.delete(element)
  }
}

const blockedEvents = [
  'click',
  'dblclick',
  'auxclick',
  'contextmenu',
  'pointerdown',
  'pointerup',
  'pointermove',
  'keydown',
  'keyup',
  'beforeinput',
  'wheel',
  'touchstart',
  'touchmove',
  'dragstart',
  'dragover',
  'drop',
]

const cls = classes('loading')(css`
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
    user-select: none;
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
