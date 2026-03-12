import type { ReactNode } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog"

interface ModalProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  width?: 'sm' | 'md' | 'lg'
}

export function Modal({ open, title, onClose, children, width = 'md' }: ModalProps) {
  const maxWidthClass = width === 'sm' ? 'sm:max-w-[425px]' : width === 'lg' ? 'sm:max-w-[800px]' : 'sm:max-w-[600px]'

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className={maxWidthClass}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  )
}
