import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
} from 'react'

type ImageSize = { width: number; height: number; mode: 'm_mfit' | 'm_lfit' }

const processableUrl = (src: string) => {
  if (!/^(https?:)?\/\//i.test(src)) return
  try {
    const url = new URL(src, window.location.href)
    if (/\.svg$/i.test(url.pathname)) return
    // 签名地址必须由签发方将图片处理参数一起签名。
    const signed = [...url.searchParams.keys()].some((key) =>
      /^(signature|ossaccesskeyid|security-token|x-oss-signature|x-oss-credential|x-oss-security-token)$/i.test(
        key,
      ),
    )
    const process = url.searchParams.get('x-oss-process')
    if (signed || (process && process !== 'image' && !process.startsWith('image/')))
      return
    return url
  } catch {
    return
  }
}

const resizedUrl = (url: URL, size: ImageSize) => {
  const result = new URL(url)
  const process = result.searchParams.get('x-oss-process') || 'image'
  result.searchParams.set(
    'x-oss-process',
    `${process}/resize,${size.mode},w_${size.width},h_${size.height},limit_1`,
  )
  return result.href
}

/** 按实际 CSS 尺寸请求 2 倍 OSS 缩略图；不支持图片处理时回退原地址。 */
export function OssImage({
  src = '',
  resolutionScale = 1,
  onError,
  ...props
}: Omit<ComponentProps<'img'>, 'srcSet' | 'sizes'> & { resolutionScale?: number }) {
  const image = useRef<HTMLImageElement>(null)
  const [size, setSize] = useState<ImageSize>()
  const [failedUrl, setFailedUrl] = useState<string>()
  const url = useMemo(() => processableUrl(src), [src])

  useLayoutEffect(() => {
    const element = image.current
    if (!element || !url) return
    let timer: ReturnType<typeof setTimeout> | undefined
    let measured = false
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return
      const { width, height } = entry.contentRect
      if (width <= 0 || height <= 0) return
      const scale = Math.abs(resolutionScale) || 1
      // 向上取偶数，固定 2 倍 CSS 像素，不随设备像素比重复放大。
      const pixels = (value: number) => Math.min(16384, Math.ceil(value * scale) * 2)
      const next: ImageSize = {
        width: pixels(width),
        height: pixels(height),
        mode: getComputedStyle(element).objectFit === 'cover' ? 'm_mfit' : 'm_lfit',
      }
      const update = () =>
        setSize((previous) =>
          previous?.width === next.width &&
          previous.height === next.height &&
          previous.mode === next.mode
            ? previous
            : next,
        )
      clearTimeout(timer)
      if (!measured) update()
      else timer = setTimeout(update, 150)
      measured = true
    })
    observer.observe(element)
    return () => {
      observer.disconnect()
      clearTimeout(timer)
    }
  }, [url, resolutionScale])

  // 首次测量之前不设置 OSS 图片 src，避免先下载整张原图。
  const thumbnail = url && size ? resizedUrl(url, size) : undefined
  const requested = !url || (thumbnail && failedUrl === thumbnail) ? src : thumbnail
  return (
    <img
      {...props}
      ref={image}
      src={requested || undefined}
      onError={(event) => {
        if (thumbnail && requested === thumbnail && thumbnail !== src) {
          setFailedUrl(thumbnail)
          return
        }
        onError?.(event)
      }}
    />
  )
}
