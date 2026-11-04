import { useEffect, useState } from 'react'
import { css } from '@emotion/css'
import { ImagePlus, RefreshCw, X } from 'lucide-react'
import {
  Button,
  Dialog,
  FileButton,
  Input,
  Loading,
  OssImage,
  classes,
} from '@workbench/ui'
import type { VsonMediaAdapter, VsonMediaItem } from './types'

export function MediaPicker({
  adapter,
  kind,
  onSelect,
  onClose,
  onBusyChange,
}: {
  adapter: VsonMediaAdapter
  kind?: string
  onSelect: (url: string) => void
  onClose: () => void
  onBusyChange?: (busy: boolean) => void
}) {
  const [items, setItems] = useState<VsonMediaItem[]>([])
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [refresh, setRefresh] = useState(0)
  useEffect(() => {
    if (adapter.unavailableReason) {
      setItems([])
      setLoading(false)
      return
    }
    const request = new AbortController()
    setLoading(true)
    setError('')
    void adapter
      .list(request.signal)
      .then((items) => {
        if (!request.signal.aborted) setItems(items)
      })
      .catch((error: unknown) => {
        if (!request.signal.aborted)
          setError(error instanceof Error ? error.message : '素材加载失败')
      })
      .finally(() => {
        if (!request.signal.aborted) setLoading(false)
      })
    return () => request.abort()
  }, [adapter, refresh])
  const upload = async (file: File) => {
    setError('')
    if (!file.size || file.size > 20 * 1024 * 1024) {
      setError('请选择 20MB 以内的图片')
      return
    }
    setUploading(true)
    onBusyChange?.(true)
    try {
      const item = await adapter.upload(file, kind)
      onSelect(item.url)
    } catch (error) {
      setError(error instanceof Error ? error.message : '上传失败')
    } finally {
      setUploading(false)
      onBusyChange?.(false)
    }
  }
  const visible = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()),
  )
  return (
    <Dialog
      open
      onClose={() => {
        if (!uploading) onClose()
      }}
      title='选择图片'>
      <div className={cls()}>
        <div className={cls('toolbar')}>
          <Input
            aria-label='搜索图片素材'
            placeholder='搜索素材名称'
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Button
            title='刷新素材'
            aria-label='刷新素材'
            icon={<RefreshCw size={14} />}
            disabled={loading || uploading || Boolean(adapter.unavailableReason)}
            onClick={() => setRefresh((value) => value + 1)}
          />
          <FileButton
            className={cls('upload')}
            accept='.png,.jpg,.jpeg,.webp,.svg'
            disabled={uploading || Boolean(adapter.unavailableReason)}
            aria-busy={uploading}
            onFile={(file) => void upload(file)}>
            <ImagePlus size={14} />
            上传图片
            {uploading && <Loading maskColor='#fff' label='上传图片中' />}
          </FileButton>
          <Button
            title='关闭图片选择'
            aria-label='关闭图片选择'
            icon={<X size={14} />}
            disabled={uploading}
            onClick={onClose}
          />
        </div>
        <p className={cls('hint')}>
          上传会写入素材库；选中的链接在点击“应用”后才写入配置。
        </p>
        {adapter.unavailableReason && (
          <p className={cls('hint')}>{adapter.unavailableReason}</p>
        )}
        {error && (
          <p role='alert' className={cls('error')}>
            {error}
          </p>
        )}
        {!loading && !adapter.unavailableReason && !visible.length && (
          <p className={cls('hint')}>
            {search ? '没有匹配的图片' : '暂无图片，可上传后选择'}
          </p>
        )}
        <div className={cls('assets')} aria-busy={loading}>
          <div className={cls('grid')}>
            {visible.map((item) => (
              <Button
                key={item.id}
                className={cls('item')}
                disabled={loading || uploading || Boolean(adapter.unavailableReason)}
                onClick={() => onSelect(item.url)}
                title={item.name}>
                <OssImage src={item.url} alt={item.name} className={cls('image')} />
                <span>{item.name}</span>
              </Button>
            ))}
          </div>
          {loading && <Loading label='加载素材中' />}
        </div>
      </div>
    </Dialog>
  )
}

const cls = classes(css`
  & {
    display: grid;
    gap: 12px;
  }
  &-toolbar {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  &-hint {
    color: var(--muted);
    font-size: 12px;
    line-height: 1.7;
  }
  &-upload {
    position: relative;
  }
  &-assets {
    position: relative;
    min-height: 120px;
  }
  &-error {
    color: #b54242;
    font-size: 12px;
  }
  &-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
    gap: 10px;
    max-height: 48vh;
    overflow: auto;
  }
  &-item {
    height: auto;
    display: flex;
    flex-direction: column;
    padding: 8px;
    gap: 6px;
    border: 1px solid var(--border);
  }
  &-item > span {
    font-size: 11px;
    width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  &-image {
    width: 100%;
    height: 90px;
    object-fit: contain;
    border-radius: 4px;
    background: #f6f7f9;
  }
`)
