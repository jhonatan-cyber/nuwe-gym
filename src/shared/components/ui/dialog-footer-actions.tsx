import { Button } from './button'
import { LoadingButton } from './loading-button'

interface DialogFooterActionsProps {
  onCancel: () => void
  isLoading?: boolean
  submitLabel?: string
  cancelLabel?: string
  submitDisabled?: boolean
}

export function DialogFooterActions({
  onCancel,
  isLoading,
  submitLabel = 'Guardar',
  cancelLabel = 'Cancelar',
  submitDisabled,
}: DialogFooterActionsProps) {
  return (
    <div className="flex items-center justify-end gap-2 pt-4">
      <Button type="button" variant="outline" onClick={onCancel} className="rounded-xl">
        {cancelLabel}
      </Button>
      <LoadingButton type="submit" isLoading={isLoading} disabled={submitDisabled} className="rounded-xl font-bold">
        {submitLabel}
      </LoadingButton>
    </div>
  )
}
