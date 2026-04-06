import { useEffect, useState, useMemo, useCallback } from 'react'
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Archive,
  ArchiveRestore,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu'
import { api, type Contact } from '../lib/api'
import { cn } from '../lib/utils'
import CreateContactModal from '../components/contacts/CreateContactModal'

type ContactTypeFilter = 'ALL' | 'CUSTOMER' | 'SUPPLIER' | 'BOTH'

function ContactTypeBadge({ type }: { type: string }) {
  switch (type) {
    case 'CUSTOMER':
      return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">Customer</Badge>
    case 'SUPPLIER':
      return <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20">Supplier</Badge>
    case 'BOTH':
      return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Both</Badge>
    default:
      return <Badge variant="secondary">{type}</Badge>
  }
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <Badge variant="success">Active</Badge>
  ) : (
    <Badge variant="secondary">Archived</Badge>
  )
}

export default function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<ContactTypeFilter>('ALL')
  const [showTypeDropdown, setShowTypeDropdown] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [actionMenuId, setActionMenuId] = useState<string | null>(null)

  const loadContacts = useCallback(async () => {
    try {
      setLoading(true)
      const data = await api.get<Contact[]>('/contacts')
      setContacts(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contacts')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadContacts()
  }, [loadContacts])

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = () => {
      setShowTypeDropdown(false)
      setActionMenuId(null)
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const filteredContacts = useMemo(() => {
    return contacts.filter((contact) => {
      const matchesType =
        typeFilter === 'ALL' || contact.contactType === typeFilter
      const matchesSearch = search.toLowerCase() === '' ||
        contact.name.toLowerCase().includes(search.toLowerCase()) ||
        contact.email?.toLowerCase().includes(search.toLowerCase())
      return matchesType && matchesSearch
    })
  }, [contacts, typeFilter, search])

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact)
    setShowCreateModal(true)
    setActionMenuId(null)
  }

  const handleArchiveContact = async (id: string) => {
    try {
      const contact = contacts.find((c) => c.id === id)
      if (contact) {
        await api.patch(`/contacts/${id}`, { isActive: false })
        await loadContacts()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive contact')
    }
    setActionMenuId(null)
  }

  const handleRestoreContact = async (id: string) => {
    try {
      const contact = contacts.find((c) => c.id === id)
      if (contact) {
        await api.patch(`/contacts/${id}`, { isActive: true })
        await loadContacts()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restore contact')
    }
    setActionMenuId(null)
  }

  const handleCloseModal = () => {
    setShowCreateModal(false)
    setEditingContact(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
          <p className="text-muted-foreground mt-2">
            Manage your customers and suppliers
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingContact(null)
            setShowCreateModal(true)
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Contact
        </Button>
      </div>

      {/* Error */}
      {error && (
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="pt-6">
            <p className="text-red-400 text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-card"
          />
        </div>
        <div className="relative">
          <button
            onClick={() => setShowTypeDropdown(!showTypeDropdown)}
            className="px-4 py-2 rounded-md border border-border hover:bg-secondary flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            {typeFilter === 'ALL' ? 'All Types' : typeFilter}
          </button>
          {showTypeDropdown && (
            <div className="absolute right-0 mt-1 w-48 bg-card border border-border rounded-md shadow-lg z-10">
              {(['ALL', 'CUSTOMER', 'SUPPLIER', 'BOTH'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setTypeFilter(type)
                    setShowTypeDropdown(false)
                  }}
                  className={cn(
                    'w-full text-left px-4 py-2 text-sm hover:bg-secondary transition-colors',
                    typeFilter === type && 'bg-primary/10 text-primary'
                  )}
                >
                  {type === 'ALL' ? 'All Types' : type}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Contacts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Contacts</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading contacts...
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>
                {contacts.length === 0
                  ? 'No contacts found.'
                  : 'No contacts match your filters.'}
              </p>
              {contacts.length === 0 && (
                <p className="text-sm mt-2">Create your first contact to get started.</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Payment Terms</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContacts.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell className="font-medium">{contact.name}</TableCell>
                      <TableCell>
                        <ContactTypeBadge type={contact.contactType} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {contact.email || '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {contact.phone || '-'}
                      </TableCell>
                      <TableCell>
                        {contact.defaultPaymentTermsDays} days
                      </TableCell>
                      <TableCell>
                        <StatusBadge isActive={contact.isActive} />
                      </TableCell>
                      <TableCell>
                        <DropdownMenu
                          open={actionMenuId === contact.id}
                          onOpenChange={(open) =>
                            setActionMenuId(open ? contact.id : null)
                          }
                        >
                          <DropdownMenuTrigger asChild>
                            <button className="p-2 hover:bg-secondary rounded-md">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleEditContact(contact)}
                            >
                              Edit
                            </DropdownMenuItem>
                            {contact.isActive ? (
                              <DropdownMenuItem
                                onClick={() => handleArchiveContact(contact.id)}
                              >
                                <Archive className="w-4 h-4 mr-2" />
                                Archive
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => handleRestoreContact(contact.id)}
                              >
                                <ArchiveRestore className="w-4 h-4 mr-2" />
                                Restore
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <CreateContactModal
        open={showCreateModal}
        onOpenChange={handleCloseModal}
        onSuccess={() => {
          loadContacts()
          handleCloseModal()
        }}
        editingContact={editingContact}
      />
    </div>
  )
}
