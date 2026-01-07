'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useTheme } from './ThemeProvider'

interface User {
  companyName: string
  email: string
}

export default function DashboardNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const [user, setUser] = useState<User | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => data.user && setUser(data.user))
      .catch(() => {})
  }, [])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/dashboard/estimates', label: 'Estimates', icon: '📝' },
    { href: '/dashboard/customers', label: 'Customers', icon: '👥' },
    { href: '/dashboard/products', label: 'Products', icon: '📦' },
  ]

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-lg transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="text-2xl">🪟</span>
              <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                {user?.companyName || 'Windows Pro'}
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <span className="mr-1">{item.icon}</span>
                {item.label}
              </Link>
            ))}
            
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2" />
            
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            
            {/* User Menu */}
            <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
              {user?.email}
            </span>
            <button
              onClick={handleLogout}
              className="ml-2 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium"
            >
              Logout
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-600 dark:text-gray-300"
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-800 border-t dark:border-gray-700 pb-3">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-4 py-2 text-sm ${
                isActive(item.href)
                  ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-300'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="mr-2">{item.icon}</span>
              {item.label}
            </Link>
          ))}
          <div className="border-t dark:border-gray-700 mt-2 pt-2 px-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
            <button
              onClick={handleLogout}
              className="mt-2 text-sm text-red-600 dark:text-red-400"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}
