"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"

import { cn } from "@/lib/utils"

/**
 * Renders a styled Label by wrapping Radix UI's Label primitive and forwarding all received props.
 *
 * The component applies a set of base utility classes for layout, typography, and disabled/interaction states,
 * sets `data-slot="label"`, and merges any `className` provided.
 *
 * @param className - Additional CSS class names to merge with the component's base classes
 * @returns The rendered label element with merged classes and forwarded props
 */
function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Label }