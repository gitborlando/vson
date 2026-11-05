import { useEffect, useState } from 'react'
import { css } from '@emotion/css'
import { ImagePlus, Plus } from 'lucide-react'
import { Button, FileButton, Loading, OssImage, Popover, classes } from './ui'

export function ImagePreviewPopover({
  value,
  label,
}: {
  value: string
  label: string
}) {
  const [preview, setPreview] = useState<string>()
  const [failed, setFailed] = useState<string>()
  const [error, setError] = useState('')
  const [pending, setPending] = useState<File>()
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview)
    },
    [preview],
  )
  useEffect(() => {
    setPreview(undefined)
    setError('')
    setPending(undefined)
  }, [value])
  useEffect(() => {
    if (!pending) return
    const timer = setTimeout(() => {
      setPreview(URL.createObjectURL(pending))
      setPending(undefined)
    }, 900)
    return () => clearTimeout(timer)
  }, [pending, value])
  const source = preview ?? value
  const select = (file: File) => {
    if (
      !file.type.startsWith('image/') &&
      !/\.(png|jpe?g|webp|gif|svg|avif)$/i.test(file.name)
    ) {
      setError('请选择图片文件')
      return
    }
    if (!file.size || file.size > 20 * 1024 * 1024) {
      setError('请选择 20MB 以内的图片')
      return
    }
    setError('')
    setPending(file)
  }
  return (
    <Popover
      title={`${label}图片预览`}
      showHeader={false}
      className={cls()}
      trigger={
        <Button
          icon={<ImagePlus size={13} />}
          title='预览或选择图片'
          aria-label={`${label}预览或选择图片`}
        />
      }>
      <FileButton
        className={cls('upload')}
        accept='image/*'
        disabled={Boolean(pending)}
        aria-busy={Boolean(pending)}
        aria-label={`${label}选择本地图片预览`}
        title='点击选择图片（仅本地预览）'
        onFile={select}>
        <span className={cls('preview')}>
          {source && source !== failed ? (
            <OssImage
              src={source}
              alt={label}
              className={cls('image')}
              onError={() => setFailed(source)}
            />
          ) : (
            <Plus size={24} strokeWidth={1.5} aria-hidden='true' />
          )}
          {preview && <span className={cls('badge')}>本地预览</span>}
          {pending && <Loading maskColor='#f0f1f4' label='模拟上传中' />}
        </span>
        {error && (
          <span className={cls('error')} role='alert'>
            {error}
          </span>
        )}
      </FileButton>
    </Popover>
  )
}

const cls = classes(css`
  & {
    width: min(256px, calc(100vw - 24px));
    border-radius: 8px;
  }
  &-upload,
  &-upload:hover {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: auto;
    min-height: 0;
    padding: 12px;
    gap: 8px;
    border: 0;
    border-radius: 8px;
    background: #fff;
  }
  &-upload:focus-visible {
    outline: 2px solid var(--color);
    outline-offset: -2px;
  }
  &-upload:disabled {
    opacity: 1;
    cursor: wait;
  }
  &-preview {
    position: relative;
    display: grid;
    place-items: center;
    width: 100%;
    aspect-ratio: 3 / 2;
    overflow: hidden;
    border-radius: 5px;
    background: #f0f1f4;
    color: #9ba3af;
  }
  &-image {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    min-height: 0;
    object-fit: contain;
  }
  &-badge {
    position: absolute;
    right: 6px;
    bottom: 6px;
    padding: 2px 5px;
    border-radius: 3px;
    background: #ffffffeb;
    color: #727b89;
    font-size: 10px;
    line-height: 16px;
  }
  &-error {
    max-width: 100%;
    color: #b54242;
    font-size: 11px;
    white-space: normal;
    line-height: 1.5;
  }
`)
