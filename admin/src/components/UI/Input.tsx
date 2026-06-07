import { forwardRef } from 'react'
import { cn } from '@/utils/cn'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg',
          'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100',
          'placeholder:text-neutral-500 dark:placeholder:text-neutral-400',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'transition-colors',
          className
        )}
        {...props}
      />
    )
  }
)

Input.displayName = 'Input'

export default Input
