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
    <>
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-6">
          <div className="mb-4 sm:mb-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">AQUI Admin Dashboard</h1>
            <p className="text-sm text-gray-600 mt-1">Welcome back, {admin.username}</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 self-start sm:self-auto"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="space-y-8">
        {/* Admin Profile & System Status Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Admin Info Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-semibold text-lg">
                  {admin.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900">Admin Profile</h3>
                <p className="text-lg font-medium text-gray-700 mt-1">{admin.username}</p>
                <p className="text-sm text-gray-500">{admin.email}</p>
              </div>
            </div>
          </div>

          {/* System Status */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">System Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Database</span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Online
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">API</span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Healthy
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Auth System</span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-gray-300 transition-all duration-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Vendor Management</h3>
              <p className="text-gray-600 mb-4 text-sm leading-relaxed">Approve vendors, manage listings, and monitor vendor activity.</p>
              <a 
                href="/admin/vendors" 
                className="inline-block bg-[#D85D28] text-white px-6 py-2.5 rounded-lg hover:bg-[#B54A1F] transition-colors duration-200 text-sm font-medium min-w-[140px] text-center"
              >
                Manage Vendors
              </a>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-gray-300 transition-all duration-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Moderation Queue</h3>
              <p className="text-gray-600 mb-4 text-sm leading-relaxed">Review reported content and moderate user-generated content.</p>
              <a 
                href="/admin/moderation" 
                className="inline-block bg-[#3A938A] text-white px-6 py-2.5 rounded-lg hover:bg-[#2F7A73] transition-colors duration-200 text-sm font-medium min-w-[140px] text-center"
              >
                View Queue
              </a>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-gray-300 transition-all duration-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Platform Analytics</h3>
              <p className="text-gray-600 mb-4 text-sm leading-relaxed">View detailed analytics, user metrics, and platform insights.</p>
              <a 
                href="/admin/analytics" 
                className="inline-block bg-purple-600 text-white px-6 py-2.5 rounded-lg hover:bg-purple-700 transition-colors duration-200 text-sm font-medium min-w-[140px] text-center"
              >
                View Analytics
              </a>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-gray-300 transition-all duration-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">User Management</h3>
              <p className="text-gray-600 mb-4 text-sm leading-relaxed">Manage user accounts, permissions, and monitor user activity.</p>
              <a 
                href="/admin/users" 
                className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium min-w-[140px] text-center"
              >
                Manage Users
              </a>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-gray-300 transition-all duration-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Vendor Feedback</h3>
              <p className="text-gray-600 mb-4 text-sm leading-relaxed">Review vendor feedback and customer reports.</p>
              <a 
                href="/admin/feedback" 
                className="inline-block bg-yellow-600 text-white px-6 py-2.5 rounded-lg hover:bg-yellow-700 transition-colors duration-200 text-sm font-medium min-w-[140px] text-center"
              >
                View Feedback
              </a>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-gray-300 transition-all duration-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Export Center</h3>
              <p className="text-gray-600 mb-4 text-sm leading-relaxed">Generate and download data exports and reports.</p>
              <a 
                href="/admin/exports" 
                className="inline-block bg-green-600 text-white px-6 py-2.5 rounded-lg hover:bg-green-700 transition-colors duration-200 text-sm font-medium min-w-[140px] text-center"
              >
                Export Data
              </a>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="text-sm text-gray-600">
              <p className="font-medium text-gray-900 mb-3">Admin dashboard is ready. You can now:</p>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Manage user accounts and vendor profiles
                </li>
                <li className="flex items-start">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Monitor system performance and analytics
                </li>
                <li className="flex items-start">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Configure platform settings
                </li>
                <li className="flex items-start">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Handle customer support requests
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}