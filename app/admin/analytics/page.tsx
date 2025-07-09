'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, Users, Store, Search, Eye, Download, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { BUSINESS_CATEGORIES } from '@/lib/constants'

interface AnalyticsData {
  userGrowth: { date: string; users: number; vendors: number }[]
  searchTrends: { term: string; count: number }[]
  vendorActivity: { date: string; live_sessions: number; total_vendors: number }[]
  platformStats: {
    total_users: number
    total_vendors: number
    total_searches: number
    total_reviews: number
    active_sessions: number
  }
  categoryDistribution: { business_type: string; count: number }[]
  recentActivity: {
    new_users_today: number
    new_vendors_today: number
    searches_today: number
    reviews_today: number
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
      
      // Mock data for now - this would come from API endpoints
      const mockData: AnalyticsData = {
        userGrowth: [
          { date: '2024-01-01', users: 120, vendors: 15 },
          { date: '2024-01-02', users: 135, vendors: 18 },
          { date: '2024-01-03', users: 142, vendors: 20 },
          { date: '2024-01-04', users: 158, vendors: 22 },
          { date: '2024-01-05', users: 167, vendors: 25 },
          { date: '2024-01-06', users: 180, vendors: 28 },
          { date: '2024-01-07', users: 195, vendors: 30 }
        ],
        searchTrends: [
          { term: 'tacos', count: 245 },
          { term: 'pizza', count: 189 },
          { term: 'coffee', count: 156 },
          { term: 'burgers', count: 134 },
          { term: 'ice cream', count: 98 }
        ],
        vendorActivity: [
          { date: '2024-01-01', live_sessions: 8, total_vendors: 15 },
          { date: '2024-01-02', live_sessions: 12, total_vendors: 18 },
          { date: '2024-01-03', live_sessions: 15, total_vendors: 20 },
          { date: '2024-01-04', live_sessions: 18, total_vendors: 22 },
          { date: '2024-01-05', live_sessions: 22, total_vendors: 25 },
          { date: '2024-01-06', live_sessions: 25, total_vendors: 28 },
          { date: '2024-01-07', live_sessions: 28, total_vendors: 30 }
        ],
        platformStats: {
          total_users: 1250,
          total_vendors: 85,
          total_searches: 5420,
          total_reviews: 342,
          active_sessions: 28
        },
        categoryDistribution: [
          { business_type: 'Food & Beverage', count: 35 },
          { business_type: 'Vintage & Thrift', count: 20 },
          { business_type: 'Handmade Crafts & Jewelry', count: 15 },
          { business_type: 'Books & Zines', count: 10 },
          { business_type: 'Art Prints & Stickers', count: 5 }
        ],
        recentActivity: {
          new_users_today: 12,
          new_vendors_today: 3,
          searches_today: 156,
          reviews_today: 8
        }
      }
      
      setData(mockData)
    } catch (error) {
      console.error('Error fetching analytics:', error)
      toast.error('Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  const refreshData = async () => {
    setRefreshing(true)
    await fetchAnalytics()
    setRefreshing(false)
    toast.success('Data refreshed successfully')
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
    
    toast.success('Analytics data exported successfully')
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
                <p className="text-2xl font-bold text-gray-900">{data.platformStats.total_users.toLocaleString()}</p>
                <p className="text-sm text-green-600">+{data.recentActivity.new_users_today} today</p>
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
                <p className="text-2xl font-bold text-gray-900">{data.platformStats.total_vendors}</p>
                <p className="text-sm text-green-600">+{data.recentActivity.new_vendors_today} today</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Search className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Searches</p>
                <p className="text-2xl font-bold text-gray-900">{data.platformStats.total_searches.toLocaleString()}</p>
                <p className="text-sm text-green-600">+{data.recentActivity.searches_today} today</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Sessions</p>
                <p className="text-2xl font-bold text-gray-900">{data.platformStats.active_sessions}</p>
                <p className="text-sm text-gray-500">Live now</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Eye className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Reviews</p>
                <p className="text-2xl font-bold text-gray-900">{data.platformStats.total_reviews}</p>
                <p className="text-sm text-green-600">+{data.recentActivity.reviews_today} today</p>
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

          {/* Vendor Activity Chart */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Vendor Activity</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.vendorActivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <Bar dataKey="live_sessions" fill="#D85D28" name="Live Sessions" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Search Trends */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Top Search Terms</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.searchTrends} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="term" type="category" width={80} />
                <Tooltip />
                <Bar dataKey="count" fill="#3A938A" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Business Type Distribution */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Vendor Business Types</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.categoryDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ business_type, percent }) => `${business_type} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {data.categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity Summary */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Today's Activity Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{data.recentActivity.new_users_today}</p>
              <p className="text-sm text-blue-600">New Users</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-2xl font-bold text-[#D85D28]">{data.recentActivity.new_vendors_today}</p>
              <p className="text-sm text-[#D85D28]">New Vendors</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">{data.recentActivity.searches_today}</p>
              <p className="text-sm text-yellow-600">Searches</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{data.recentActivity.reviews_today}</p>
              <p className="text-sm text-green-600">Reviews</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}