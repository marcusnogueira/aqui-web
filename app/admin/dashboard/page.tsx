'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { adminAuth } from '@/lib/admin-auth'

interface AdminUser {
  id: string
  username: string
  email: string
}

export default function AdminDashboard() {
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const adminUser = await adminAuth.checkAuth()
      if (adminUser) {
        setAdmin(adminUser)
      } else {
        router.push('/admin/login')
      }
    } catch (error) {
      router.push('/admin/login')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await adminAuth.logout()
      router.push('/admin/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!admin) {
    return null // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AQUI Admin Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome back, {admin.username}</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Admin Info Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-sm">
                        {admin.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Admin Profile
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {admin.username}
                      </dd>
                      <dd className="text-sm text-gray-500">
                        {admin.email}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Vendor Management</h3>
            <p className="text-gray-600 mb-4">Approve vendors, manage listings, and monitor vendor activity.</p>
            <a href="/admin/vendors" className="bg-[#D85D28] text-white px-4 py-2 rounded-md hover:bg-[#B54A1F] inline-block">
              Manage Vendors
            </a>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Moderation Queue</h3>
            <p className="text-gray-600 mb-4">Review reported content and moderate user-generated content.</p>
            <a href="/admin/moderation" className="bg-[#3A938A] text-white px-4 py-2 rounded-md hover:bg-[#2F7A73] inline-block">
              View Queue
            </a>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Platform Analytics</h3>
            <p className="text-gray-600 mb-4">View detailed analytics, user metrics, and platform insights.</p>
            <a href="/admin/analytics" className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 inline-block">
              View Analytics
            </a>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">User Management</h3>
            <p className="text-gray-600 mb-4">Manage user accounts, permissions, and monitor user activity.</p>
            <a href="/admin/users" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 inline-block">
              Manage Users
            </a>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Vendor Feedback</h3>
            <p className="text-gray-600 mb-4">Review vendor feedback and customer reports.</p>
            <a href="/admin/feedback" className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 inline-block">
              View Feedback
            </a>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Export Center</h3>
            <p className="text-gray-600 mb-4">Generate and download data exports and reports.</p>
            <a href="/admin/exports" className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 inline-block">
              Export Data
            </a>
          </div>
        </div>

            {/* System Status */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <h3 className="text-lg font-medium text-gray-900 mb-4">System Status</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Database</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Online
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">API</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Healthy
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Auth System</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="mt-8">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
                <div className="text-sm text-gray-500">
                  <p>Admin dashboard is ready. You can now:</p>
                  <ul className="mt-2 list-disc list-inside space-y-1">
                    <li>Manage user accounts and vendor profiles</li>
                    <li>Monitor system performance and analytics</li>
                    <li>Configure platform settings</li>
                    <li>Handle customer support requests</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}