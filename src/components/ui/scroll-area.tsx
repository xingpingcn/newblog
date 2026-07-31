import * as React from 'react'
import { ScrollArea as ScrollAreaPrimitive } from 'radix-ui'

import { cn } from '@/lib/utils'

function ScrollArea({
  className,
  children,
  type = 'auto',
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.Root>) {
  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      className={cn('relative', className)}
      type={type}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        data-slot="scroll-area-viewport"
        className="ring-ring/10 dark:ring-ring/20 dark:outline-ring/40 outline-ring/50 size-full rounded-[inherit] transition-[color,box-shadow] focus-visible:ring-4 focus-visible:outline-1"
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  )
}

function ScrollBar({
  className,
  orientation = 'vertical',
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>) {
  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      data-slot="scroll-area-scrollbar"
      orientation={orientation}
      className={cn(
        'before:bg-border relative flex touch-none select-none before:pointer-events-none before:absolute',
        orientation === 'vertical' &&
          'h-full w-[15px] before:inset-y-0 before:left-1/2 before:w-px before:-translate-x-1/2',
        orientation === 'horizontal' &&
          'h-[15px] flex-col before:inset-x-0 before:top-1/2 before:h-px before:-translate-y-1/2',
        className,
      )}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb
        data-slot="scroll-area-thumb"
        className={cn(
          'after:bg-muted-foreground relative flex-1 after:pointer-events-none after:absolute after:rounded-full',
          orientation === 'vertical' &&
            'after:inset-y-0 after:left-1/2 after:w-px after:-translate-x-1/2 hover:after:w-[7px]',
          orientation === 'horizontal' &&
            'after:inset-x-0 after:top-1/2 after:h-px after:-translate-y-1/2 hover:after:h-[7px]',
        )}
      />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  )
}

export { ScrollArea, ScrollBar }
