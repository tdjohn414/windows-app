import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import Link from 'next/link'

const JOB_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  quote: { label: 'Quote', color: 'badge-gray' },
  sold: { label: 'Sold', color: 'badge-blue' },
  scheduled: { label: 'Scheduled', color: 'badge-yellow' },
  in_progress: { label: 'In Progress', color: 'badge-purple' },
  completed: { label: 'Completed', color: 'badge-green' },
  paid: { label: 'Paid', color: 'badge-green' },
}

export default async function DashboardPage() {
  const user = await getAuthUser()
  if (!user) return null

  const [customers, products, estimates, recentEstimates] = await Promise.all([
    prisma.customer.count({ where: { userId: user.id } }),
    prisma.product.count({ where: { userId: user.id } }),
    prisma.estimate.findMany({
      where: { userId: user.id },
      select: { total: true, jobStatus: true },
    }),
    prisma.estimate.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { customer: true },
    }),
  ])

  const totalValue = estimates.reduce((sum, e) => sum + Number(e.total), 0)
  const soldValue = estimates
    .filter(e => ['sold', 'scheduled', 'in_progress', 'completed', 'paid'].includes(e.jobStatus))
    .reduce((sum, e) => sum + Number(e.total), 0)

  const statusCounts = estimates.reduce((acc, e) => {
    acc[e.jobStatus] = (acc[e.jobStatus] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <Link href="/dashboard/estimates/new" className="btn-primary">
          + New Estimate
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Estimates</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{estimates.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500 dark:text-gray-400">Pipeline Value</p>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            ${totalValue.toLocaleString()}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500 dark:text-gray-400">Sold Value</p>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">
            ${soldValue.toLocaleString()}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500 dark:text-gray-400">Customers</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{customers}</p>
        </div>
      </div>

      {/* Status Pipeline */}
      <div className="card mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Job Pipeline</h2>
        <div className="flex flex-wrap gap-4">
          {Object.entries(JOB_STATUS_CONFIG).map(([status, config]) => (
            <div key={status} className="flex items-center gap-2">
              <span className={config.color}>{config.label}</span>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                {statusCounts[status] || 0}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions & Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/dashboard/estimates/new" className="btn-primary text-center">
              📝 New Estimate
            </Link>
            <Link href="/dashboard/customers" className="btn-secondary text-center">
              👥 Add Customer
            </Link>
            <Link href="/dashboard/products" className="btn-secondary text-center">
              📦 Manage Products
            </Link>
            <Link href="/dashboard/estimates" className="btn-secondary text-center">
              📋 All Estimates
            </Link>
          </div>
          
          {products === 0 && (
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                💡 <strong>Tip:</strong> Add your products/services first to quickly build estimates.{' '}
                <Link href="/dashboard/products" className="underline">Add products →</Link>
              </p>
            </div>
          )}
        </div>

        {/* Recent Estimates */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Estimates</h2>
          {recentEstimates.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No estimates yet.{' '}
              <Link href="/dashboard/estimates/new" className="text-blue-600 dark:text-blue-400 underline">
                Create your first one
              </Link>
            </p>
          ) : (
            <div className="space-y-3">
              {recentEstimates.map((estimate) => (
                <Link
                  key={estimate.id}
                  href={`/dashboard/estimates/${estimate.id}`}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {estimate.customer.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {estimate.estimateNumber}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      ${Number(estimate.total).toLocaleString()}
                    </p>
                    <span className={JOB_STATUS_CONFIG[estimate.jobStatus]?.color || 'badge-gray'}>
                      {JOB_STATUS_CONFIG[estimate.jobStatus]?.label || estimate.jobStatus}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
