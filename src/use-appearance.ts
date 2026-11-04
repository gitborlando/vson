import { useEffect, useState } from 'react'

const storageKey = 'vson:appearance'
const defaults = { showAnnotations: true }

const readAppearance = () => {
  try {
    const saved: { showAnnotations?: unknown } | null = JSON.parse(
      localStorage.getItem(storageKey) ?? 'null',
    )
    return {
      showAnnotations:
        typeof saved?.showAnnotations === 'boolean'
          ? saved.showAnnotations
          : defaults.showAnnotations,
    }
  } catch {
    return defaults
  }
}

export function useAppearance() {
  const [appearance, setAppearance] = useState(readAppearance)
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(appearance))
    } catch {
      // 无法访问本地存储时，仍保留当前编辑器内的显示设置。
    }
  }, [appearance])
  return [appearance, setAppearance] as const
}
