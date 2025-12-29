import { Fragment, ReactNode } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  type?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
  confirmDisabled?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant,
  type,
  isLoading = false,
  confirmDisabled = false,
}: ConfirmDialogProps) {
  // Support both 'variant' and 'type' props for backwards compatibility
  const selectedVariant = variant || type || 'danger';

  const variantClasses = {
    danger: {
      icon: 'bg-danger-100 text-danger-600',
      button: 'btn-danger',
    },
    warning: {
      icon: 'bg-warning-100 text-warning-600',
      button: 'bg-warning-500 text-white hover:bg-warning-600 focus:ring-warning-500',
    },
    primary: {
      icon: 'bg-primary-100 text-primary-600',
      button: 'btn-primary',
    },
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-start gap-4">
                  <div className={`flex-shrink-0 rounded-full p-2 ${variantClasses[selectedVariant].icon}`}>
                    <ExclamationTriangleIcon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900">
                      {title}
                    </Dialog.Title>
                    {typeof message === 'string' ? (
                      <Dialog.Description className="mt-2 text-sm text-gray-500">
                        {message}
                      </Dialog.Description>
                    ) : (
                      <div className="mt-2 text-sm text-gray-500">{message}</div>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    className="btn-secondary flex-1"
                    onClick={onClose}
                    disabled={isLoading}
                  >
                    {cancelText}
                  </button>
                  <button
                    type="button"
                    className={`btn flex-1 ${variantClasses[selectedVariant].button} disabled:opacity-50`}
                    onClick={onConfirm}
                    disabled={isLoading || confirmDisabled}
                  >
                    {isLoading ? 'Processando...' : confirmText}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
