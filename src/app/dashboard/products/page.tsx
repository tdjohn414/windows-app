'use client'

import { useState, useEffect } from 'react'

interface Product {
  id: number
  name: string
  description: string | null
  category: string | null
  unit: string
  unitPrice: number
  cost: number | null
  isActive: boolean
}

const CATEGORIES = ['Window', 'Door', 'Labor', 'Material', 'Hardware', 'Other']
const UNITS = ['ea', 'sq ft', 'ln ft', 'hr', 'day', 'opening', 'set']

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [filter, setFilter] = useState('')
  const [formData, setFormData] = useState({
    name: '', description: '', category: '', unit: 'ea', unitPrice: '', cost: '', isActive: true
  })

  const fetchProducts = async () => {
    const res = await fetch('/api/products')
    const data = await res.json()
    setProducts(data.products || [])
    setLoading(false)
  }

  useEffect(() => { fetchProducts() }, [])

  const openModal = (product?: Product) => {
    if (product) {
      setEditing(product)
      setFormData({
        name: product.name,
        description: product.description || '',
        category: product.category || '',
        unit: product.unit,
        unitPrice: String(product.unitPrice),
        cost: product.cost ? String(product.cost) : '',
        isActive: product.isActive,
      })
    } else {
      setEditing(null)
      setFormData({ name: '', description: '', category: '', unit: 'ea', unitPrice: '', cost: '', isActive: true })
    }
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const url = editing ? `/api/products/${editing.id}` : '/api/products'
    const method = editing ? 'PUT' : 'POST'

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        unitPrice: parseFloat(formData.unitPrice) || 0,
        cost: formData.cost ? parseFloat(formData.cost) : null,
      }),
    })

    setShowModal(false)
    fetchProducts()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this product?')) return
    await fetch(`/api/products/${id}`, { method: 'DELETE' })
    fetchProducts()
  }

  const filteredProducts = products.filter(p => 
    !filter || p.category === filter
  )

  const groupedProducts = filteredProducts.reduce((acc, product) => {
    const cat = product.category || 'Uncategorized'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(product)
    return acc
  }, {} as Record<string, Product[]>)

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Products & Services</h1>
        <div className="flex gap-3">
          <select
            className="input w-auto"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <button onClick={() => openModal()} className="btn-primary">
            + Add Product
          </button>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 mb-4">No products yet</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">
            Add your windows, doors, and services to quickly build estimates
          </p>
          <button onClick={() => openModal()} className="btn-primary">
            Add Your First Product
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedProducts).map(([category, items]) => (
            <div key={category} className="card p-0 overflow-hidden">
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-2 border-b dark:border-gray-600">
                <h2 className="font-semibold text-gray-700 dark:text-gray-300">{category}</h2>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b dark:border-gray-700">
                    <th className="text-left p-3 text-sm font-medium text-gray-600 dark:text-gray-400">Product</th>
                    <th className="text-center p-3 text-sm font-medium text-gray-600 dark:text-gray-400 hidden sm:table-cell">Unit</th>
                    <th className="text-right p-3 text-sm font-medium text-gray-600 dark:text-gray-400">Price</th>
                    <th className="text-right p-3 text-sm font-medium text-gray-600 dark:text-gray-400 hidden md:table-cell">Cost</th>
                    <th className="text-right p-3 text-sm font-medium text-gray-600 dark:text-gray-400 hidden md:table-cell">Margin</th>
                    <th className="text-right p-3 text-sm font-medium text-gray-600 dark:text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-gray-700">
                  {items.map((product) => {
                    const margin = product.cost 
                      ? ((Number(product.unitPrice) - Number(product.cost)) / Number(product.unitPrice) * 100).toFixed(0)
                      : null
                    return (
                      <tr key={product.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${!product.isActive ? 'opacity-50' : ''}`}>
                        <td className="p-3">
                          <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                          {product.description && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                              {product.description}
                            </p>
                          )}
                        </td>
                        <td className="p-3 text-center text-gray-600 dark:text-gray-300 hidden sm:table-cell">
                          {product.unit}
                        </td>
                        <td className="p-3 text-right font-medium text-gray-900 dark:text-white">
                          ${Number(product.unitPrice).toFixed(2)}
                        </td>
                        <td className="p-3 text-right text-gray-600 dark:text-gray-300 hidden md:table-cell">
                          {product.cost ? `$${Number(product.cost).toFixed(2)}` : '-'}
                        </td>
                        <td className="p-3 text-right hidden md:table-cell">
                          {margin ? (
                            <span className={`badge ${Number(margin) >= 30 ? 'badge-green' : Number(margin) >= 15 ? 'badge-yellow' : 'badge-red'}`}>
                              {margin}%
                            </span>
                          ) : '-'}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => openModal(product)}
                            className="text-blue-600 dark:text-blue-400 hover:underline mr-3"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="text-red-600 dark:text-red-400 hover:underline"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {editing ? 'Edit Product' : 'Add Product'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Product/Service Name *</label>
                  <input
                    type="text"
                    required
                    className="input"
                    placeholder="e.g., Double Hung Window - Standard"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Description</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Optional details"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Category</label>
                    <select
                      className="input"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      <option value="">Select...</option>
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Unit</label>
                    <select
                      className="input"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    >
                      {UNITS.map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Sell Price *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        required
                        step="0.01"
                        min="0"
                        className="input pl-7"
                        value={formData.unitPrice}
                        onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="label">Your Cost</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="input pl-7"
                        placeholder="Optional"
                        value={formData.cost}
                        onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">
                    Active (show in product picker)
                  </label>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary flex-1">
                    {editing ? 'Update' : 'Add'} Product
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
