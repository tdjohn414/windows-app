'use client'

import { useState, useEffect } from 'react'

interface Customer {
  id: number
  name: string
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  notes: string | null
  _count: { estimates: number }
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', address: '', city: '', state: '', zip: '', notes: ''
  })

  const fetchCustomers = async () => {
    const res = await fetch('/api/customers')
    const data = await res.json()
    setCustomers(data.customers || [])
    setLoading(false)
  }

  useEffect(() => { fetchCustomers() }, [])

  const openModal = (customer?: Customer) => {
    if (customer) {
      setEditing(customer)
      setFormData({
        name: customer.name,
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || '',
        city: customer.city || '',
        state: customer.state || '',
        zip: customer.zip || '',
        notes: customer.notes || '',
      })
    } else {
      setEditing(null)
      setFormData({ name: '', email: '', phone: '', address: '', city: '', state: '', zip: '', notes: '' })
    }
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const url = editing ? `/api/customers/${editing.id}` : '/api/customers'
    const method = editing ? 'PUT' : 'POST'

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })

    setShowModal(false)
    fetchCustomers()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this customer? This will also delete their estimates.')) return
    await fetch(`/api/customers/${id}`, { method: 'DELETE' })
    fetchCustomers()
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customers</h1>
        <button onClick={() => openModal()} className="btn-primary">
          + Add Customer
        </button>
      </div>

      {customers.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 mb-4">No customers yet</p>
          <button onClick={() => openModal()} className="btn-primary">
            Add Your First Customer
          </button>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="text-left p-4 font-medium text-gray-600 dark:text-gray-300">Name</th>
                <th className="text-left p-4 font-medium text-gray-600 dark:text-gray-300 hidden md:table-cell">Phone</th>
                <th className="text-left p-4 font-medium text-gray-600 dark:text-gray-300 hidden lg:table-cell">Location</th>
                <th className="text-center p-4 font-medium text-gray-600 dark:text-gray-300">Estimates</th>
                <th className="text-right p-4 font-medium text-gray-600 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="p-4">
                    <p className="font-medium text-gray-900 dark:text-white">{customer.name}</p>
                    {customer.email && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">{customer.email}</p>
                    )}
                  </td>
                  <td className="p-4 hidden md:table-cell text-gray-600 dark:text-gray-300">
                    {customer.phone || '-'}
                  </td>
                  <td className="p-4 hidden lg:table-cell text-gray-600 dark:text-gray-300">
                    {customer.city && customer.state ? `${customer.city}, ${customer.state}` : '-'}
                  </td>
                  <td className="p-4 text-center">
                    <span className="badge-blue">{customer._count.estimates}</span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => openModal(customer)}
                      className="text-blue-600 dark:text-blue-400 hover:underline mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(customer.id)}
                      className="text-red-600 dark:text-red-400 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {editing ? 'Edit Customer' : 'Add Customer'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Name *</label>
                  <input
                    type="text"
                    required
                    className="input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Email</label>
                    <input
                      type="email"
                      className="input"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Phone</label>
                    <input
                      type="tel"
                      className="input"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Address</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="label">City</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">State</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">ZIP</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.zip}
                      onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Notes</label>
                  <textarea
                    className="input h-20"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary flex-1">
                    {editing ? 'Update' : 'Add'} Customer
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
