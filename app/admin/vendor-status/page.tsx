'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { Search, Power, PowerOff, Play, Square, Clock, CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { AdminVendorView } from '@/types/vendor'

type Vendor = AdminVendorView

interface VendorStatusStats {
  total: number
  live: number
  approved: number
  active: number
  pending: number
}

export default function VendorStatusControlPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [stats, setStats] = useState<VendorStatusStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all', 'live', 'offline', 'approved', 'pending'
  const [updatingVendors, setUpdatingVendors] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchVendors()
    fetchStats()
  }, [searchTerm, statusFilter])

  const fetchVendors = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter })
      })

      const response = await fetch(`/api/admin/vendor-status?${params}`)
      if (!response.ok) throw new Error('Failed to fetch vendors')
      
      const data = await response.json()
      setVendors(data.vendors)
    } catch (error) {
      console.error('Error fetching vendors:', error)
      toast.error('Failed to load vendors')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/vendor-status/stats')
      if (!response.ok) throw new Error('Failed to fetch stats')
      
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const updateVendorStatus = async (vendorId: string, action: string, value?: any) => {
    if (updatingVendors.has(vendorId)) return
    
    try {
      setUpdatingVendors(prev => new Set(prev).add(vendorId))
      
      const response = await fetch('/api/admin/vendor-status', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ vendorId, action, value })
      })

      if (!response.ok) throw new Error('Failed to update vendor status')
      
      const result = await response.json()
      toast.success(result.message || 'Vendor status updated successfully')
      
      // Refresh data
      await Promise.all([fetchVendors(), fetchStats()])
    } catch (error) {
      console.error('Error updating vendor status:', error)
      toast.error('Failed to update vendor status')
    } finally {
      setUpdatingVendors(prev => {
        const newSet = new Set(prev)
        newSet.delete(vendorId)
        return newSet
      })
    }
  }

  const getVendorLiveStatus = (vendor: Vendor) => {
    const activeSessions = vendor.vendor_live_sessions.filter(session => session.is_active)
    return activeSessions.length > 0 ? 'live' : 'offline'
  }

  const getStatusBadge = (vendor: Vendor) => {
    const isLive = getVendorLiveStatus(vendor) === 'live'
    
    if (!vendor.is_approved) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock className="w-3 h-3 mr-1" />
          Pending Approval
        </span>
      )
    }
    
    if (!vendor.is_active) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <PowerOff className="w-3 h-3 mr-1" />
          Inactive
        </span>
      )
    }
    
    if (isLive) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <Play className="w-3 h-3 mr-1" />
          Live
        </span>
      )
    }
    
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        Active
      </span>
    )
  }

  const filteredVendors = vendors.filter(vendor => {
    if (statusFilter === 'live') {
      return getVendorLiveStatus(vendor) === 'live'
    }
    if (statusFilter === 'offline') {
      return getVendorLiveStatus(vendor) === 'offline' && vendor.is_active && vendor.is_approved
    }
    if (statusFilter === 'approved') {
      return vendor.is_approved
    }
    if (statusFilter === 'pending') {
      return !vendor.is_approved
    }
    return true
  })

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Vendor Status Control</h1>
            <p className="text-gray-600">Control vendor live sessions, approval status, and activity</p>
          </div>
          <button
            onClick={() => {
              fetchVendors()
              fetchStats()
            }}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Power className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Vendors</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Play className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Currently Live</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.live}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Approved</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-[#D85D28] bg-opacity-10 rounded-lg">
                  <Power className="h-6 w-6 text-[#D85D28]" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search vendors..."
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-[#D85D28] focus:border-[#D85D28]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <select
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-[#D85D28] focus:border-[#D85D28]"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
            >
              <option value="all">All Vendors</option>
              <option value="live">Currently Live</option>
              <option value="offline">Offline (Active)</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending Approval</option>
            </select>
            
            <button
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('all')
              }}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Vendors Control Panel */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Live Sessions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quick Actions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Admin Controls
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      Loading vendors...
                    </td>
                  </tr>
                ) : filteredVendors.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      No vendors found
                    </td>
                  </tr>
                ) : (
                  filteredVendors.map((vendor) => {
                    const isUpdating = updatingVendors.has(vendor.id)
                    const isLive = getVendorLiveStatus(vendor) === 'live'
                    const activeSessions = vendor.vendor_live_sessions.filter(session => session.is_active)
                    
                    return (
                      <tr key={vendor.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {vendor.business_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {vendor.users.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(vendor)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {activeSessions.length > 0 ? (
                              <div>
                                <span className="font-medium text-red-600">{activeSessions.length} active</span>
                                <div className="text-xs text-gray-500">
                                  Started: {new Date(activeSessions[0].start_time).toLocaleTimeString()}
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-500">No active sessions</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex space-x-2">
                            {/* Stop Live Session */}
                            {isLive && (
                              <button
                                onClick={() => updateVendorStatus(vendor.id, 'stop_live_session')}
                                disabled={isUpdating}
                                className="inline-flex items-center px-2 py-1 border border-red-300 rounded text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50"
                                title="Stop live session"
                              >
                                <Square className="w-3 h-3 mr-1" />
                                Stop Live
                              </button>
                            )}
                            
                            {/* Toggle Active Status */}
                            <button
                              onClick={() => updateVendorStatus(vendor.id, 'toggle_active', !vendor.is_active)}
                              disabled={isUpdating}
                              className={`inline-flex items-center px-2 py-1 border rounded text-xs font-medium disabled:opacity-50 ${
                                vendor.is_active
                                  ? 'border-gray-300 text-gray-700 bg-gray-50 hover:bg-gray-100'
                                  : 'border-green-300 text-green-700 bg-green-50 hover:bg-green-100'
                              }`}
                              title={vendor.is_active ? 'Deactivate vendor' : 'Activate vendor'}
                            >
                              {vendor.is_active ? (
                                <>
                                  <PowerOff className="w-3 h-3 mr-1" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <Power className="w-3 h-3 mr-1" />
                                  Activate
                                </>
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex space-x-2">
                            {/* Approval Toggle */}
                            {!vendor.is_approved ? (
                              <button
                                onClick={() => updateVendorStatus(vendor.id, 'approve', true)}
                                disabled={isUpdating}
                                className="inline-flex items-center px-2 py-1 border border-green-300 rounded text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 disabled:opacity-50"
                                title="Approve vendor"
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Approve
                              </button>
                            ) : (
                              <button
                                onClick={() => updateVendorStatus(vendor.id, 'approve', false)}
                                disabled={isUpdating}
                                className="inline-flex items-center px-2 py-1 border border-yellow-300 rounded text-xs font-medium text-yellow-700 bg-yellow-50 hover:bg-yellow-100 disabled:opacity-50"
                                title="Revoke approval"
                              >
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Revoke
                              </button>
                            )}
                            
                            {/* Loading indicator */}
                            {isUpdating && (
                              <div className="inline-flex items-center px-2 py-1">
                                <RefreshCw className="w-3 h-3 animate-spin text-gray-400" />
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}