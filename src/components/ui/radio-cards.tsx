import * as React from "react"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import { cn } from "@/lib/utils"

const RadioCardsRoot = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root> & {
    columns?: {
      initial?: string
      sm?: string
      md?: string
      lg?: string
      xl?: string
      "2xl"?: string
    }
    className?: string
  }
>(({ className, columns = { initial: "1" }, ...props }, ref) => {
  const gridCols = cn(
    columns.initial && `grid-cols-${columns.initial}`,
    columns.sm && `sm:grid-cols-${columns.sm}`,
    columns.md && `md:grid-cols-${columns.md}`,
    columns.lg && `lg:grid-cols-${columns.lg}`,
    columns.xl && `xl:grid-cols-${columns.xl}`,
    columns["2xl"] && `2xl:grid-cols-${columns["2xl"]}`,
  )

  return <RadioGroupPrimitive.Root className={cn("grid gap-3", gridCols, className)} {...props} ref={ref} />
})
RadioCardsRoot.displayName = RadioGroupPrimitive.Root.displayName

const RadioCardsItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item> & {
    className?: string
    image?: {
      src: string
      alt: string
    }
  }
>(({ className, children, image, ...props }, ref) => (
  <RadioGroupPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex items-start rounded-md border-2 border-muted bg-popover p-4 cursor-pointer hover:bg-accent hover:text-accent-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary",
      className,
    )}
    {...props}
  >
    {image && (
      <div className="flex-shrink-0 mr-4">
        <img
          src={image.src || "/placeholder.svg"}
          alt={image.alt}
          width={48}
          height={48}
          className="rounded-md object-cover"
        />
      </div>
    )}
    <div>{children}</div>
    <RadioGroupPrimitive.Indicator className="absolute inset-0" />
  </RadioGroupPrimitive.Item>
))
RadioCardsItem.displayName = RadioGroupPrimitive.Item.displayName

export const RadioCards = {
  Root: RadioCardsRoot,
  Item: RadioCardsItem,
}

