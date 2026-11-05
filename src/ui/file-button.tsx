import { useRef, type ReactNode, type ComponentProps } from 'react'
import { ark } from '@ark-ui/react/factory'
import { Button } from './button'
export function FileButton({
  children,
  accept,
  onFile,
  disabled,
  size,
  ...buttonProps
}: {
  children: ReactNode
  accept?: string
  onFile: (file: File) => void
  disabled?: boolean
  size?: ComponentProps<typeof Button>['size']
} & Omit<ComponentProps<typeof Button>, 'onClick' | 'ref'>) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <>
      <Button
        {...buttonProps}
        size={size}
        disabled={disabled}
        onClick={() => ref.current?.click()}>
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
