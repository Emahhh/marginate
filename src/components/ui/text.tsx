import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const textVariants = cva("", {
  variants: {
    variant: {
      default: "text-foreground",
      muted: "text-muted-foreground",
    },
    size: {
      default: "text-base",
      xs: "text-xs",
      sm: "text-sm",
      lg: "text-lg",
    },
    weight: {
      default: "font-normal",
      medium: "font-medium",
      bold: "font-bold",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
    weight: "default",
  },
})

export interface TextProps extends React.HTMLAttributes<HTMLParagraphElement>, VariantProps<typeof textVariants> {}

const Text = React.forwardRef<HTMLParagraphElement, TextProps>(
  ({ className, variant, size, weight, ...props }, ref) => {
    return <p ref={ref} className={cn(textVariants({ variant, size, weight }), className)} {...props} />
  },
)
Text.displayName = "Text"

export { Text, textVariants }

