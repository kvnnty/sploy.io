"use client"

import * as React from "react"
import { CheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"

type CheckboxProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, ...props }, ref) => {
    return (
      <label className="inline-flex items-center">
        <input
          ref={ref}
          type="checkbox"
          checked={checked}
          className="peer sr-only"
          {...props}
        />
        <span
          data-slot="checkbox"
          className={cn(
            "flex size-4 items-center justify-center rounded-[4px] border border-border bg-background text-primary-foreground transition-all peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 peer-checked:border-primary peer-checked:bg-primary",
            className,
          )}
        >
          <CheckIcon className="size-3 opacity-0 transition-opacity peer-checked:opacity-100" />
        </span>
      </label>
    )
  },
)

Checkbox.displayName = "Checkbox"

export { Checkbox }
