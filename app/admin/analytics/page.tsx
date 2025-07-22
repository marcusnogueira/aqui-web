'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, Users, Store, Search, Eye, Download, RefreshCw } from 'lucide-react'
import { showToast } from '@/lib/toast'
import { BUSINESS_CATEGORIES } from '@/lib/constants'

interface AnalyticsData {
  userGrowth: { date: string; users: number; vendors: number }[]
  vendorGrowth: { date: string; users: number; vendors: number }[]
  liveSessionsStats: { date: string; sessions: number; totalDuration: number; averageDuration: number }[]
  feedbackStats: {
    total: number
    byType: { GENERAL: number; FEATURE: number; BUG: number }
    byStatus: { pending: number; reviewed: number; resolved: number; dismissed: number }
  }
  revenueData: { date: string; revenue: number; transactions: number }[]
  topVendors: { id: string; name: string; type: string; sessions: number; revenue: number }[]
  summary: {
    totalUsers: number
    totalVendors: number
    activeVendors: number
    totalLiveSessions: number
    totalFeedback: number
  }
}

const COLORS = ['#D85D28', '#3A938A', '#F59E0B', '#EF4444', '#8B5CF6', '#10B981']

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [dateRange, setDateRange] = useState('7d') // 7d, 30d, 90d

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      
      const response = await fetch(`/api/admin/analytics?dateRange=${dateRange}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch analytics data')
      }
      
      setData(result.data)
    } catch (error) {
      console.error('Error fetching analytics:', error)
      showToast.error('Failed to load analytics data')
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  const refreshData = async () => {
    setRefreshing(true)
    await fetchAnalytics()
    setRefreshing(false)
    showToast.success('Data refreshed successfully')
  }

  const exportData = () => {
    if (!data) return
    
    const exportData = {
      generated_at: new Date().toISOString(),
      date_range: dateRange,
      ...data
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `aqui-analytics-${dateRange}-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    showToast.success('Analytics data exported successfully')
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D85D28] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading analytics...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (!data) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-gray-600">Failed to load analytics data</p>
          <button
            onClick={fetchAnalytics}
            className="mt-4 px-4 py-2 bg-[#D85D28] text-white rounded-md hover:bg-[#B54A1F]"
          >
            Retry
          </button>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Platform Analytics</h1>
            <p className="text-gray-600">Monitor platform performance and user engagement</p>
          </div>
          <div className="flex space-x-3">
            <select
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-[#D85D28] focus:border-[#D85D28]"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              aria-label="Select date range"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            <button
              onClick={refreshData}
              disabled={refreshing}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 flex items-center"
              aria-label="Refresh data"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={exportData}
              className="px-4 py-2 bg-[#D85D28] text-white rounded-md hover:bg-[#B54A1F] flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{data.summary.totalUsers.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Platform users</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-[#D85D28] bg-opacity-10 rounded-lg">
                <Store className="h-6 w-6 text-[#D85D28]" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Vendors</p>
                <p className="text-2xl font-bold text-gray-900">{data.summary.totalVendors}</p>
                <p className="text-sm text-green-600">{data.summary.activeVendors} active</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Live Sessions</p>
                <p className="text-2xl font-bold text-gray-900">{data.summary.totalLiveSessions.toLocaleString()}</p>
                <p className="text-sm text-gray-500">In period</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Eye className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Feedback</p>
                <p className="text-2xl font-bold text-gray-900">{data.summary.totalFeedback}</p>
                <p className="text-sm text-orange-600">{data.feedbackStats.byStatus.pending} pending</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Search className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${data.revenueData.reduce((sum, day) => sum + day.revenue, 0).toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">In period</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Growth Chart */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">User & Vendor Growth</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.userGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <Line 
                  type="monotone" 
                  dataKey="users" 
                  stroke="#3A938A" 
                  strokeWidth={2}
                  name="Users"
                />
                <Line 
                  type="monotone" 
                  dataKey="vendors" 
                  stroke="#D85D28" 
                  strokeWidth={2}
                  name="Vendors"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Live Sessions Chart */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Live Sessions Activity</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.liveSessionsStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value, name) => {
                    if (name === 'sessions') return [value, 'Sessions']
                    if (name === 'totalDuration') return [`${value} min`, 'Total Duration']
                    return [value, name]
                  }}
                />
                <Bar dataKey="sessions" fill="#D85D28" name="sessions" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis 
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value, name) => {
                    if (name === 'revenue') return [`$${value.toLocaleString()}`, 'Revenue']
                    if (name === 'transactions') return [value, 'Transactions']
                    return [value, name]
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  name="revenue"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Top Vendors */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Top Vendors by Sessions</h3>
            {data.topVendors.length > 0 ? (
              <div className="space-y-4">
                {data.topVendors.map((vendor, index) => (
                  <div key={vendor.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-[#D85D28] text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{vendor.name}</p>
                        <p className="text-sm text-gray-500">{vendor.type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{vendor.sessions} sessions</p>
                      <p className="text-sm text-green-600">${vendor.revenue.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Store className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No vendor data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Feedback Statistics Summary */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Feedback Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Feedback by Type */}
            <div>
              <h4 className="text-md font-medium text-gray-700 mb-3">By Type</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-blue-700 font-medium">General</span>
                  <span className="text-blue-600 font-bold">{data.feedbackStats.byType.GENERAL}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-green-700 font-medium">Feature Request</span>
                  <span className="text-green-600 font-bold">{data.feedbackStats.byType.FEATURE}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                  <span className="text-red-700 font-medium">Bug Report</span>
                  <span className="text-red-600 font-bold">{data.feedbackStats.byType.BUG}</span>
                </div>
              </div>
            </div>
            
            {/* Feedback by Status */}
            <div>
              <h4 className="text-md font-medium text-gray-700 mb-3">By Status</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                  <span className="text-yellow-700 font-medium">Pending</span>
                  <span className="text-yellow-600 font-bold">{data.feedbackStats.byStatus.pending}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-blue-700 font-medium">Reviewed</span>
                  <span className="text-blue-600 font-bold">{data.feedbackStats.byStatus.reviewed}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-green-700 font-medium">Resolved</span>
                  <span className="text-green-600 font-bold">{data.feedbackStats.byStatus.resolved}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700 font-medium">Dismissed</span>
                  <span className="text-gray-600 font-bold">{data.feedbackStats.byStatus.dismissed}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}