import { Dialog, Heading, Modal, ModalOverlay } from 'react-aria-components'
import { Button } from './Button'

export function ConfirmDialog({
  isOpen,
  onOpenChange,
  title,
  children,
  confirmLabel,
  cancelLabel = 'Cancelar',
  confirmVariant = 'primary',
  onConfirm,
  isPending,
}: {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  title: string
  children: React.ReactNode
  confirmLabel: string
  /** The button that closes the dialog without doing anything. */
  cancelLabel?: string
  confirmVariant?: 'primary' | 'danger'
  onConfirm: () => void
  isPending?: boolean
}) {
  return (
    <ModalOverlay isOpen={isOpen} onOpenChange={onOpenChange} isDismissable className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <Modal className="w-full max-w-md rounded-t-lg bg-surface p-5 shadow-raised sm:rounded-lg">
        <Dialog role="alertdialog" className="outline-none">
          <Heading slot="title" className="mb-2 text-lg font-bold">{title}</Heading>
          <div className="mb-5 text-muted">{children}</div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onPress={() => onOpenChange(false)}>{cancelLabel}</Button>
            <Button variant={confirmVariant} onPress={onConfirm} isPending={isPending}>{confirmLabel}</Button>
          </div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  )
}
