import { AlertTriangle } from 'lucide-react'
import { ReactNode } from 'react'
import { Button, Modal } from 'antd'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message: string | ReactNode
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
  loading?: boolean
}

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = '确认操作',
  message,
  confirmText = '确认',
  cancelText = '取消',
  variant = 'info',
  loading = false
}: ConfirmDialogProps) => {
  const handleConfirm = () => {
    onConfirm()
  }

  const variantStyles = {
    danger: {
      icon: 'text-red-600 dark:text-red-400',
      button: 'danger'
    },
    warning: {
      icon: 'text-yellow-600 dark:text-yellow-400',
      button: 'default'
    },
    info: {
      icon: 'text-blue-600 dark:text-blue-400',
      button: 'default'
    }
  }

  const style = variantStyles[variant]

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      title={title}
      width={500}
      footer={null}
      closable={!loading}
      maskClosable={!loading}
    >
      <div className="p-2">
        <div className="flex items-start gap-4 mb-6">
          <div className={`flex-shrink-0 ${style.icon}`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            {typeof message === 'string' ? (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {message}
              </p>
            ) : (
              <div className="text-sm text-slate-600 dark:text-slate-400">
                {message}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center justify-end gap-3">
          <Button
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            type={variant === 'danger' ? 'primary' : 'default'}
            danger={variant === 'danger'}
            onClick={handleConfirm}
            loading={loading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default ConfirmDialog
