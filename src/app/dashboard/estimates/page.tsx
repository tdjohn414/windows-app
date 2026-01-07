'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Estimate {
  id: number
  estimateNumber: string
  status: string
  jobStatus: string
  total: number
  createdAt: string
  customer: {
    name: string
  }
}

const JOB_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  quote: { label: 'Quote', color: 'badge-gray' },
  sold: { label: 'Sold', color: 'badge-blue' },
  scheduled: { label: 'Scheduled', color: 'badge-yellow' },
  in_progress: { label: 'In Progress', color: 'badge-purple' },
  completed: { label: 'Completed', color: 'badge-green' },
  paid: { label: 'Paid', color: 'badge-green' },
}

export default function EstimatesPage() {
  const [estimates, setEstimates] = useState<Estimate[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    const params = filter ? `?jobStatus=${filter}` : ''
    fetch(`/api/estimates${params}`)
      .then(res => res.json())
      .then(data => {
        setEstimates(data.estimates || [])
        setLoading(false)
      })
  }, [filter])

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this estimate?')) return
    await fetch(`/api/estimates/${id}`, { method: 'DELETE' })
    setEstimates(estimates.filter(e => e.id !== id))
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Estimates</h1>
        <div className="flex gap-3">
          <select
            className="input w-auto"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="">All Status</option>
            {Object.entries(JOB_STATUS_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>
          <Link href="/dashboard/estimates/new" className="btn-primary">
            + New Estimate
          </Link>
        </div>
      </div>

      {estimates.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {filter ? 'No estimates with this status' : 'No estimates yet'}
          </p>
          <Link href="/dashboard/estimates/new" className="btn-primary">
            Create Your First Estimate
          </Link>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="text-left p-4 font-medium text-gray-600 dark:text-gray-300">Estimate</th>
                <th className="text-left p-4 font-medium text-gray-600 dark:text-gray-300 hidden md:table-cell">Customer</th>
                <th className="text-center p-4 font-medium text-gray-600 dark:text-gray-300">Status</th>
                <th className="text-right p-4 font-medium text-gray-600 dark:text-gray-300">Total</th>
                <th className="text-right p-4 font-medium text-gray-600 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {estimates.map((estimate) => (
                <tr key={estimate.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="p-4">
                    <Link href={`/dashboard/estimates/${estimate.id}`} className="hover:underline">
                      <p className="font-medium text-gray-900 dark:text-white">{estimate.estimateNumber}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(estimate.createdAt).toLocaleDateString()}
                      </p>
                    </Link>
                  </td>
                  <td className="p-4 hidden md:table-cell text-gray-600 dark:text-gray-300">
                    {estimate.customer.name}
                  </td>
                  <td className="p-4 text-center">
                    <span className={JOB_STATUS_CONFIG[estimate.jobStatus]?.color || 'badge-gray'}>
                      {JOB_STATUS_CONFIG[estimate.jobStatus]?.label || estimate.jobStatus}
                    </span>
                  </td>
                  <td className="p-4 text-right font-semibold text-gray-900 dark:text-white">
                    ${Number(estimate.total).toLocaleString()}
                  </td>
                  <td className="p-4 text-right">
                    <Link
                      href={`/dashboard/estimates/${estimate.id}`}
                      className="text-blue-600 dark:text-blue-400 hover:underline mr-3"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => handleDelete(estimate.id)}
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
    </div>
  )
}
