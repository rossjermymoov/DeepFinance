import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Users,
  Receipt,
  CreditCard,
  Landmark,
  Calculator,
  BarChart3,
  Settings,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useState } from 'react'

interface NavItem {
  label: string
  path: string
  icon: React.ElementType
  disabled?: boolean
}

const navSections: { title: string; items: NavItem[] }[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    ],
  },
  {
    title: 'General Ledger',
    items: [
      { label: 'Chart of Accounts', path: '/accounts', icon: BookOpen },
      { label: 'Journal Entries', path: '/journals', icon: FileText },
      { label: 'Financial Periods', path: '/periods', icon: Calendar },
    ],
  },
  {
    title: 'Transactions',
    items: [
      { label: 'Contacts', path: '/contacts', icon: Users },
      { label: 'Invoices', path: '/invoices', icon: Receipt },
      { label: 'Bills', path: '/bills', icon: CreditCard },
      { label: 'Banking', path: '/banking', icon: Landmark, disabled: true },
    ],
  },
  {
    title: 'Compliance',
    items: [
      { label: 'VAT Returns', path: '/vat', icon: Calculator, disabled: true },
      { label: 'Reports', path: '/reports', icon: BarChart3 },
    ],
  },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()

  return (
    <aside
      className={cn(
        'flex flex-col h-screen border-r border-border bg-card transition-all duration-200',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Brand */}
      <div className="flex items-center justify-between h-14 px-4 border-b border-border">
        {!collapsed && (
          <h1 className="text-lg font-bold tracking-tight">
            Deep<span className="text-primary">Finance</span>
          </h1>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {navSections.map((section) => (
          <div key={section.title} className="mb-6">
            {!collapsed && (
              <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {section.title}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon
                const isActive =
                  item.path === '/'
                    ? location.pathname === '/'
                    : location.pathname.startsWith(item.path)

                if (item.disabled) {
                  return (
                    <div
                      key={item.path}
                      className={cn(
                        'flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground/40 cursor-not-allowed',
                        collapsed && 'justify-center px-2'
                      )}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {!collapsed && <span>{item.label}</span>}
                      {!collapsed && (
                        <span className="ml-auto text-[10px] font-medium uppercase tracking-wide bg-secondary px-1.5 py-0.5 rounded text-muted-foreground/50">
                          Soon
                        </span>
                      )}
                    </div>
                  )
                }

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                      collapsed && 'justify-center px-2'
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </NavLink>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-2">
        <NavLink
          to="/settings"
          className={cn(
            'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors',
            collapsed && 'justify-center px-2'
          )}
          title={collapsed ? 'Settings' : undefined}
        >
          <Settings className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Settings</span>}
        </NavLink>
      </div>
    </aside>
  )
}
