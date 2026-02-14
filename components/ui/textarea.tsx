import * as React from 'react'

import { cn } from '@/lib/utils'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'border-input placeholder:text-muted-foreground flex field-sizing-content min-h-[4.5rem] w-full rounded-xl border bg-background/78 px-3 py-2.5 text-base shadow-xs transition-[color,box-shadow,background-color,border-color] outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'focus-visible:border-primary/45 focus-visible:bg-card focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        'hover:border-primary/25 dark:bg-input/30 dark:hover:bg-input/45',
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
