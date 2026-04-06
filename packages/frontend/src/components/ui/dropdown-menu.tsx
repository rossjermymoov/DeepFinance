import * as React from "react"
import { cn } from "../../lib/utils"

interface DropdownMenuProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

interface DropdownMenuTriggerProps extends React.HTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  children: React.ReactNode
}

interface DropdownMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'start' | 'center' | 'end'
  children: React.ReactNode
}

interface DropdownMenuItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void
}

export const DropdownMenuContext = React.createContext<{
  open: boolean
  setOpen: (open: boolean) => void
}>({ open: false, setOpen: () => {} })

export function DropdownMenu({
  open = false,
  onOpenChange,
  children,
}: DropdownMenuProps) {
  const [internalOpen, setInternalOpen] = React.useState(open)
  const isControlled = onOpenChange !== undefined
  const isOpen = isControlled ? open : internalOpen

  const handleOpenChange = (newOpen: boolean) => {
    if (isControlled) {
      onOpenChange?.(newOpen)
    } else {
      setInternalOpen(newOpen)
    }
  }

  return (
    <DropdownMenuContext.Provider value={{ open: isOpen, setOpen: handleOpenChange }}>
      <div className="relative inline-block">
        {children}
      </div>
    </DropdownMenuContext.Provider>
  )
}

export function DropdownMenuTrigger({
  asChild,
  children,
  ...props
}: DropdownMenuTriggerProps) {
  const { open, setOpen } = React.useContext(DropdownMenuContext)

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...props,
      onClick: (e: React.MouseEvent<HTMLElement>) => {
        e.stopPropagation()
        setOpen(!open)
        children.props.onClick?.(e)
      },
    } as React.HTMLAttributes<HTMLElement>)
  }

  return (
    <button
      {...props}
      onClick={(e) => {
        e.stopPropagation()
        setOpen(!open)
        props.onClick?.(e)
      }}
    >
      {children}
    </button>
  )
}

export function DropdownMenuContent({
  align = 'start',
  children,
  ...props
}: DropdownMenuContentProps) {
  const { open, setOpen } = React.useContext(DropdownMenuContext)

  React.useEffect(() => {
    if (!open) return

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      const portal = document.querySelector('[data-dropdown-portal]')
      if (portal && !portal.contains(target)) {
        setOpen(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [open, setOpen])

  if (!open) return null

  return (
    <div
      data-dropdown-portal
      className={cn(
        'absolute mt-1 bg-card border border-border rounded-md shadow-lg z-10 min-w-[150px]',
        align === 'end' && 'right-0',
        align === 'center' && 'left-1/2 -translate-x-1/2',
        align === 'start' && 'left-0'
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function DropdownMenuItem({
  children,
  ...props
}: DropdownMenuItemProps) {
  const { setOpen } = React.useContext(DropdownMenuContext)

  return (
    <div
      {...props}
      onClick={(e) => {
        setOpen(false)
        props.onClick?.(e)
      }}
      className={cn(
        'px-4 py-2 text-sm cursor-pointer hover:bg-secondary transition-colors',
        props.className
      )}
    >
      {children}
    </div>
  )
}
