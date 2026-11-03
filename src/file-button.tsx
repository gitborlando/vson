import { useRef, type ReactNode } from 'react'
import { ark } from '@ark-ui/react/factory'
import { Button } from './button'
export function FileButton({
  children,
  accept,
  onFile,
  disabled,
}: {
  children: ReactNode
  accept?: string
  onFile: (file: File) => void
  disabled?: boolean
}) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <>
      <Button disabled={disabled} onClick={() => ref.current?.click()}>
        {children}
      </Button>
      <ark.input
        ref={ref}
        type='file'
        accept={accept}
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) onFile(file)
          event.target.value = ''
        }}
      />
    </>
  )
}
