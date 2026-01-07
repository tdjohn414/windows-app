'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Customer {
  id: number
  name: string
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
}

interface Product {
  id: number
  name: string
  description: string | null
  category: string | null
  unit: string
  unitPrice: number
  isActive: boolean
}

interface LineItem {
  id: string
  productId: number | null
  description: string
  quantity: number
  unit: string
  unitPrice: number
  total: number
}

const UNITS = ['ea', 'sq ft', 'ln ft', 'hr', 'day', 'opening', 'set']

export default function NewEstimatePage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [customerId, setCustomerId] = useState<number | ''>('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [jobAddress, setJobAddress] = useState({ address: '', city: '', state: '', zip: '' })
  const [useCustomerAddress, setUseCustomerAddress] = useState(true)
  const [notes, setNotes] = useState('')
  const [taxRate, setTaxRate] = useState(0)

  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: crypto.randomUUID(), productId: null, description: '', quantity: 1, unit: 'ea', unitPrice: 0, total: 0 }
  ])

  useEffect(() => {
    Promise.all([
      fetch('/api/customers').then(r => r.json()),
      fetch('/api/products').then(r => r.json()),
    ]).then(([custData, prodData]) => {
      setCustomers(custData.customers || [])
      setProducts(prodData.products || [])
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (customerId) {
      const customer = customers.find(c => c.id === customerId)
      setSelectedCustomer(customer || null)
      if (customer && useCustomerAddress) {
        setJobAddress({
          address: customer.address || '',
          city: customer.city || '',
          state: customer.state || '',
          zip: customer.zip || '',
        })
      }
    }
  }, [customerId, customers, useCustomerAddress])

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      { id: crypto.randomUUID(), productId: null, description: '', quantity: 1, unit: 'ea', unitPrice: 0, total: 0 }
    ])
  }

  const addFromProduct = (product: Product) => {
    setLineItems([
      ...lineItems,
      {
        id: crypto.randomUUID(),
        productId: product.id,
        description: product.name,
        quantity: 1,
        unit: product.unit,
        unitPrice: Number(product.unitPrice),
        total: Number(product.unitPrice),
      }
    ])
  }

  const updateLineItem = (id: string, field: keyof LineItem, value: any) => {
    setLineItems(items =>
      items.map(item => {
        if (item.id !== id) return item
        const updated = { ...item, [field]: value }
        if (field === 'quantity' || field === 'unitPrice') {
          updated.total = Number(updated.quantity) * Number(updated.unitPrice)
        }
        return updated
      })
    )
  }

  const deleteLineItem = (id: string) => {
    if (lineItems.length === 1) {
      setLineItems([{ id: crypto.randomUUID(), productId: null, description: '', quantity: 1, unit: 'ea', unitPrice: 0, total: 0 }])
    } else {
      setLineItems(items => items.filter(item => item.id !== id))
    }
  }

  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0)
  const taxAmount = subtotal * (taxRate / 100)
  const total = subtotal + taxAmount

  const handleSubmit = async () => {
    if (!customerId) {
      alert('Please select a customer')
      return
    }

    if (lineItems.every(item => !item.description.trim())) {
      alert('Please add at least one line item')
      return
    }

    setSaving(true)

    try {
      const res = await fetch('/api/estimates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          jobAddress: jobAddress.address,
          jobCity: jobAddress.city,
          jobState: jobAddress.state,
          jobZip: jobAddress.zip,
          taxRate,
          notes,
          lineItems: lineItems.filter(item => item.description.trim()),
        }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error)

      router.push(`/dashboard/estimates/${data.estimate.id}`)
    } catch (error) {
      alert('Failed to create estimate')
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>
  }

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">New Estimate</h1>

      {/* Customer Selection */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Customer</h2>
        
        {customers.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-gray-500 dark:text-gray-400 mb-2">No customers yet</p>
            <a href="/dashboard/customers" className="text-blue-600 dark:text-blue-400 hover:underline">
              Add a customer first →
            </a>
          </div>
        ) : (
          <>
            <select
              className="input mb-4"
              value={customerId}
              onChange={(e) => setCustomerId(Number(e.target.value) || '')}
            >
              <option value="">Select a customer...</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>{customer.name}</option>
              ))}
            </select>

            {selectedCustomer && (
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedCustomer.name}</p>
                    {selectedCustomer.address && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedCustomer.address}
                        {selectedCustomer.city && `, ${selectedCustomer.city}`}
                        {selectedCustomer.state && `, ${selectedCustomer.state}`}
                        {selectedCustomer.zip && ` ${selectedCustomer.zip}`}
                      </p>
                    )}
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={useCustomerAddress}
                      onChange={(e) => setUseCustomerAddress(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-gray-600 dark:text-gray-400">Same as job address</span>
                  </label>
                </div>

                {!useCustomerAddress && (
                  <div className="mt-4 pt-4 border-t dark:border-gray-600">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Job Address</p>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div className="md:col-span-2">
                        <input
                          type="text"
                          className="input"
                          placeholder="Street Address"
                          value={jobAddress.address}
                          onChange={(e) => setJobAddress({ ...jobAddress, address: e.target.value })}
                        />
                      </div>
                      <input
                        type="text"
                        className="input"
                        placeholder="City"
                        value={jobAddress.city}
                        onChange={(e) => setJobAddress({ ...jobAddress, city: e.target.value })}
                      />
                      <div className="flex gap-2">
                        <input
                          type="text"
                          className="input w-20"
                          placeholder="State"
                          value={jobAddress.state}
                          onChange={(e) => setJobAddress({ ...jobAddress, state: e.target.value })}
                        />
                        <input
                          type="text"
                          className="input"
                          placeholder="ZIP"
                          value={jobAddress.zip}
                          onChange={(e) => setJobAddress({ ...jobAddress, zip: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Product Quick Add */}
      {products.length > 0 && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Add Products</h2>
          <div className="flex flex-wrap gap-2">
            {products.filter(p => p.isActive !== false).slice(0, 12).map(product => (
              <button
                key={product.id}
                onClick={() => addFromProduct(product)}
                className="btn-secondary btn-sm"
              >
                + {product.name}
              </button>
            ))}
            {products.length > 12 && (
              <span className="text-sm text-gray-500 dark:text-gray-400 self-center">
                +{products.length - 12} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Line Items */}
      <div className="card mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Line Items</h2>
          <button onClick={addLineItem} className="btn-primary btn-sm">
            + Add Line
          </button>
        </div>

        {/* Header */}
        <div className="hidden md:grid grid-cols-12 gap-2 mb-2 text-sm font-medium text-gray-600 dark:text-gray-400 px-2">
          <div className="col-span-5">Description</div>
          <div className="col-span-1 text-center">Qty</div>
          <div className="col-span-2 text-center">Unit</div>
          <div className="col-span-2 text-right">Price</div>
          <div className="col-span-1 text-right">Total</div>
          <div className="col-span-1"></div>
        </div>

        {/* Items */}
        <div className="space-y-2">
          {lineItems.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-1 md:grid-cols-12 gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
            >
              <div className="md:col-span-5">
                <label className="md:hidden text-xs text-gray-500 dark:text-gray-400">Description</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Description"
                  value={item.description}
                  onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                />
              </div>
              <div className="md:col-span-1">
                <label className="md:hidden text-xs text-gray-500 dark:text-gray-400">Qty</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="input text-center"
                  value={item.quantity}
                  onChange={(e) => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="md:col-span-2">
                <label className="md:hidden text-xs text-gray-500 dark:text-gray-400">Unit</label>
                <select
                  className="input text-center"
                  value={item.unit}
                  onChange={(e) => updateLineItem(item.id, 'unit', e.target.value)}
                >
                  {UNITS.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="md:hidden text-xs text-gray-500 dark:text-gray-400">Unit Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="input pl-7 text-right"
                    value={item.unitPrice || ''}
                    onChange={(e) => updateLineItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
              <div className="md:col-span-1 flex items-center justify-end">
                <span className="font-semibold text-gray-900 dark:text-white">
                  ${item.total.toFixed(2)}
                </span>
              </div>
              <div className="md:col-span-1 flex items-center justify-end">
                <button
                  onClick={() => deleteLineItem(item.id)}
                  className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="mt-6 pt-4 border-t dark:border-gray-600">
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-4">
              <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
              <span className="font-medium text-gray-900 dark:text-white w-28 text-right">
                ${subtotal.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-600 dark:text-gray-400">Tax:</span>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                className="input w-20 text-center"
                value={taxRate}
                onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
              />
              <span className="text-gray-600 dark:text-gray-400">%</span>
              <span className="font-medium text-gray-900 dark:text-white w-28 text-right">
                ${taxAmount.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xl">
              <span className="font-semibold text-gray-700 dark:text-gray-300">Total:</span>
              <span className="font-bold text-blue-600 dark:text-blue-400 w-28 text-right">
                ${total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Notes</h2>
        <textarea
          className="input h-24"
          placeholder="Terms, conditions, or special instructions..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-4 justify-end">
        <button
          onClick={() => router.back()}
          className="btn-secondary"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={saving || !customerId}
          className="btn-success"
        >
          {saving ? 'Saving...' : 'Create Estimate'}
        </button>
      </div>
    </div>
  )
}
