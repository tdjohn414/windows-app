'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

interface Estimate {
  id: number
  estimateNumber: string
  status: string
  jobStatus: string
  jobAddress: string | null
  jobCity: string | null
  jobState: string | null
  jobZip: string | null
  subtotal: number
  taxRate: number | null
  taxAmount: number | null
  total: number
  notes: string | null
  scheduledDate: string | null
  completedDate: string | null
  createdAt: string
  customer: {
    name: string
    email: string | null
    phone: string | null
    address: string | null
    city: string | null
    state: string | null
    zip: string | null
  }
  lineItems: Array<{
    id: number
    description: string
    quantity: number
    unit: string
    unitPrice: number
    total: number
  }>
  user: {
    companyName: string
    companyAddress: string | null
    companyPhone: string | null
    companyEmail: string | null
  }
}

const JOB_STATUSES = [
  { value: 'quote', label: 'Quote', color: 'bg-gray-500' },
  { value: 'sold', label: 'Sold', color: 'bg-blue-500' },
  { value: 'scheduled', label: 'Scheduled', color: 'bg-yellow-500' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-purple-500' },
  { value: 'completed', label: 'Completed', color: 'bg-green-500' },
  { value: 'paid', label: 'Paid', color: 'bg-green-600' },
]

export default function EstimateDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [estimate, setEstimate] = useState<Estimate | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    fetch(`/api/estimates/${params.id}`)
      .then(res => res.json())
      .then(data => {
        setEstimate(data.estimate)
        setLoading(false)
      })
      .catch(() => {
        router.push('/dashboard/estimates')
      })
  }, [params.id, router])

  const updateStatus = async (jobStatus: string) => {
    await fetch(`/api/estimates/${params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobStatus }),
    })
    setEstimate(prev => prev ? { ...prev, jobStatus } : null)
  }

  const generatePDF = async () => {
    if (!estimate) return
    setGenerating(true)

    try {
      const { default: jsPDF } = await import('jspdf')
      const { default: autoTable } = await import('jspdf-autotable')

      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      let y = 20

      // Company Header
      doc.setFontSize(20)
      doc.setFont('helvetica', 'bold')
      doc.text(estimate.user.companyName, 20, y)

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      y += 7
      if (estimate.user.companyAddress) {
        doc.text(estimate.user.companyAddress, 20, y)
        y += 5
      }
      if (estimate.user.companyPhone) {
        doc.text(estimate.user.companyPhone, 20, y)
        y += 5
      }

      // Estimate Title
      doc.setFontSize(24)
      doc.setFont('helvetica', 'bold')
      doc.text('ESTIMATE', pageWidth - 20, 25, { align: 'right' })

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`#${estimate.estimateNumber}`, pageWidth - 20, 33, { align: 'right' })
      doc.text(`Date: ${new Date(estimate.createdAt).toLocaleDateString()}`, pageWidth - 20, 40, { align: 'right' })

      // Divider
      y = Math.max(y, 50)
      doc.setDrawColor(200, 200, 200)
      doc.line(20, y, pageWidth - 20, y)
      y += 10

      // Customer Info
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text('CUSTOMER:', 20, y)
      doc.setFont('helvetica', 'normal')
      y += 6
      doc.text(estimate.customer.name, 20, y)
      y += 5
      if (estimate.customer.phone) {
        doc.text(estimate.customer.phone, 20, y)
        y += 5
      }

      // Job Address
      if (estimate.jobAddress) {
        doc.setFont('helvetica', 'bold')
        doc.text('JOB ADDRESS:', pageWidth / 2, y - 11)
        doc.setFont('helvetica', 'normal')
        doc.text(estimate.jobAddress, pageWidth / 2, y - 5)
        if (estimate.jobCity) {
          doc.text(
            `${estimate.jobCity}${estimate.jobState ? ', ' + estimate.jobState : ''} ${estimate.jobZip || ''}`,
            pageWidth / 2,
            y
          )
        }
      }

      y += 10

      // Line Items Table
      const tableData = estimate.lineItems.map(item => [
        item.description,
        item.quantity.toString(),
        item.unit,
        `$${Number(item.unitPrice).toFixed(2)}`,
        `$${Number(item.total).toFixed(2)}`,
      ])

      autoTable(doc, {
        startY: y,
        head: [['Description', 'Qty', 'Unit', 'Unit Price', 'Total']],
        body: tableData,
        theme: 'striped',
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: 255,
          fontStyle: 'bold',
        },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 20, halign: 'center' },
          2: { cellWidth: 25, halign: 'center' },
          3: { cellWidth: 30, halign: 'right' },
          4: { cellWidth: 30, halign: 'right' },
        },
        margin: { left: 20, right: 20 },
      })

      // Totals
      const finalY = (doc as any).lastAutoTable.finalY + 10

      doc.setFontSize(10)
      const totalsX = pageWidth - 80

      doc.text('Subtotal:', totalsX, finalY)
      doc.text(`$${Number(estimate.subtotal).toFixed(2)}`, pageWidth - 20, finalY, { align: 'right' })

      if (estimate.taxRate && estimate.taxAmount) {
        doc.text(`Tax (${estimate.taxRate}%):`, totalsX, finalY + 6)
        doc.text(`$${Number(estimate.taxAmount).toFixed(2)}`, pageWidth - 20, finalY + 6, { align: 'right' })
      }

      doc.setFillColor(240, 240, 240)
      doc.rect(totalsX - 5, finalY + 10, pageWidth - totalsX - 10, 10, 'F')

      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('TOTAL:', totalsX, finalY + 17)
      doc.text(`$${Number(estimate.total).toFixed(2)}`, pageWidth - 20, finalY + 17, { align: 'right' })

      // Notes
      if (estimate.notes) {
        const notesY = finalY + 30
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.text('Notes:', 20, notesY)
        doc.setFont('helvetica', 'normal')
        const splitNotes = doc.splitTextToSize(estimate.notes, pageWidth - 40)
        doc.text(splitNotes, 20, notesY + 5)
      }

      // Footer
      doc.setFontSize(8)
      doc.setTextColor(128, 128, 128)
      doc.text('Thank you for your business!', pageWidth / 2, doc.internal.pageSize.getHeight() - 15, { align: 'center' })

      doc.save(`Estimate_${estimate.estimateNumber}.pdf`)
    } catch (error) {
      console.error('PDF generation error:', error)
      alert('Failed to generate PDF')
    } finally {
      setGenerating(false)
    }
  }

  if (loading || !estimate) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>
  }

  const currentStatusIndex = JOB_STATUSES.findIndex(s => s.value === estimate.jobStatus)

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <Link href="/dashboard/estimates" className="text-blue-600 dark:text-blue-400 hover:underline text-sm mb-2 block">
            ← Back to Estimates
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Estimate {estimate.estimateNumber}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Created {new Date(estimate.createdAt).toLocaleDateString()}
          </p>
        </div>
        <button
          onClick={generatePDF}
          disabled={generating}
          className="btn-primary"
        >
          {generating ? '⏳ Generating...' : '📄 Download PDF'}
        </button>
      </div>

      {/* Status Pipeline */}
      <div className="card mb-6">
        <h2 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Job Status</h2>
        <div className="flex flex-wrap gap-2">
          {JOB_STATUSES.map((status, index) => (
            <button
              key={status.value}
              onClick={() => updateStatus(status.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                estimate.jobStatus === status.value
                  ? `${status.color} text-white`
                  : index <= currentStatusIndex
                    ? 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {status.label}
            </button>
          ))}
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Customer */}
        <div className="card">
          <h2 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Customer</h2>
          <p className="font-semibold text-gray-900 dark:text-white text-lg">{estimate.customer.name}</p>
          {estimate.customer.phone && (
            <p className="text-gray-600 dark:text-gray-400">{estimate.customer.phone}</p>
          )}
          {estimate.customer.email && (
            <p className="text-gray-600 dark:text-gray-400">{estimate.customer.email}</p>
          )}
        </div>

        {/* Job Address */}
        <div className="card">
          <h2 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Job Address</h2>
          {estimate.jobAddress ? (
            <>
              <p className="font-semibold text-gray-900 dark:text-white">{estimate.jobAddress}</p>
              {estimate.jobCity && (
                <p className="text-gray-600 dark:text-gray-400">
                  {estimate.jobCity}{estimate.jobState && `, ${estimate.jobState}`} {estimate.jobZip}
                </p>
              )}
            </>
          ) : (
            <p className="text-gray-400 dark:text-gray-500 italic">Not specified</p>
          )}
        </div>
      </div>

      {/* Line Items */}
      <div className="card mb-6 p-0 overflow-hidden">
        <div className="px-6 py-4 border-b dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">Line Items</h2>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="text-left p-4 text-sm font-medium text-gray-600 dark:text-gray-400">Description</th>
              <th className="text-center p-4 text-sm font-medium text-gray-600 dark:text-gray-400">Qty</th>
              <th className="text-center p-4 text-sm font-medium text-gray-600 dark:text-gray-400 hidden sm:table-cell">Unit</th>
              <th className="text-right p-4 text-sm font-medium text-gray-600 dark:text-gray-400 hidden sm:table-cell">Price</th>
              <th className="text-right p-4 text-sm font-medium text-gray-600 dark:text-gray-400">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-gray-700">
            {estimate.lineItems.map(item => (
              <tr key={item.id}>
                <td className="p-4 text-gray-900 dark:text-white">{item.description}</td>
                <td className="p-4 text-center text-gray-600 dark:text-gray-400">{item.quantity}</td>
                <td className="p-4 text-center text-gray-600 dark:text-gray-400 hidden sm:table-cell">{item.unit}</td>
                <td className="p-4 text-right text-gray-600 dark:text-gray-400 hidden sm:table-cell">
                  ${Number(item.unitPrice).toFixed(2)}
                </td>
                <td className="p-4 text-right font-medium text-gray-900 dark:text-white">
                  ${Number(item.total).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <td colSpan={4} className="p-4 text-right font-medium text-gray-600 dark:text-gray-400">Subtotal</td>
              <td className="p-4 text-right font-medium text-gray-900 dark:text-white">
                ${Number(estimate.subtotal).toFixed(2)}
              </td>
            </tr>
            {estimate.taxRate && estimate.taxAmount && (
              <tr>
                <td colSpan={4} className="p-4 text-right text-gray-600 dark:text-gray-400">
                  Tax ({estimate.taxRate}%)
                </td>
                <td className="p-4 text-right text-gray-900 dark:text-white">
                  ${Number(estimate.taxAmount).toFixed(2)}
                </td>
              </tr>
            )}
            <tr className="bg-blue-50 dark:bg-blue-900/30">
              <td colSpan={4} className="p-4 text-right font-bold text-gray-900 dark:text-white text-lg">Total</td>
              <td className="p-4 text-right font-bold text-blue-600 dark:text-blue-400 text-lg">
                ${Number(estimate.total).toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Notes */}
      {estimate.notes && (
        <div className="card">
          <h2 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Notes</h2>
          <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{estimate.notes}</p>
        </div>
      )}
    </div>
  )
}
