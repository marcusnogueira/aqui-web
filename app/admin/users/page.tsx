'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { Users, Search, Filter, Eye, Ban, CheckCircle, XCircle, Mail, Calendar, Star } from 'lucide-react'
import toast from 'react-hot-toast'
import { USER_ROLES, USER_ACCOUNT_STATUS } from '@/lib/constants'

interface User {
  id: string
  email: string
  full_name?: string
  status: string
  created_at: string
  phone?: string
  avatar_url?: string
  is_vendor: boolean
  is_admin: boolean
  active_role: string
  location?: string
}

interface UserStats {
  total: number
  active: number
  suspended: number
  banned: number
  new_this_month: number
  verified_emails: number
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [filters, setFilters] = useState({
    status: 'all',
    verified: 'all',
    search: ''
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  useEffect(() => {
    fetchUsers()
    fetchStats()
  }, [filters, currentPage])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      
      // Mock data for now - this would come from API
      const mockUsers: User[] = [
        {
          id: '1',
          email: 'john.doe@email.com',
          full_name: 'John Doe',
          status: USER_ACCOUNT_STATUS.ACTIVE,
          created_at: '2024-01-01T10:00:00Z',
          phone: '+1-555-0123',
          avatar_url: 'https://via.placeholder.com/40',
          is_vendor: false,
          is_admin: false,
          active_role: USER_ROLES.CUSTOMER
        },
        {
          id: '2',
          email: 'jane.smith@email.com',
          full_name: 'Jane Smith',
          status: USER_ACCOUNT_STATUS.ACTIVE,
          created_at: '2024-01-02T11:15:00Z',
          is_vendor: true,
          is_admin: false,
          active_role: USER_ROLES.VENDOR
        },
        {
          id: '3',
          email: 'mike.johnson@email.com',
          full_name: 'Mike Johnson',
          status: USER_ACCOUNT_STATUS.SUSPENDED,
          created_at: '2024-01-03T16:45:00Z',
          is_vendor: false,
          is_admin: false,
          active_role: USER_ROLES.CUSTOMER
        },
        {
          id: '4',
          email: 'sarah.wilson@email.com',
          full_name: 'Sarah Wilson',
          status: USER_ACCOUNT_STATUS.ACTIVE,
          created_at: '2024-01-04T08:30:00Z',
          phone: '+1-555-0456',
          is_vendor: true,
          is_admin: false,
          active_role: 'vendor'
        },
        {
          id: '5',
          email: 'spam.user@email.com',
          full_name: 'Spam User',
          status: USER_ACCOUNT_STATUS.BANNED,
          created_at: '2024-01-05T13:20:00Z',
          is_vendor: false,
          is_admin: false,
          active_role: 'customer'
        }
      ]
      
      setUsers(mockUsers)
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      // Mock stats data
      const mockStats: UserStats = {
        total: 1250,
        active: 1180,
        suspended: 45,
        banned: 25,
        new_this_month: 156,
        verified_emails: 1050
      }
      
      setStats(mockStats)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const updateUserStatus = async (userId: string, newStatus: string) => {
    try {
      // This would be an API call
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, status: newStatus as any }
          : user
      ))
      
      toast.success(`User status updated to ${newStatus}`)
      setShowModal(false)
      setSelectedUser(null)
      fetchStats() // Refresh stats
    } catch (error) {
      console.error('Error updating user status:', error)
      toast.error('Failed to update user status')
    }
  }

  const sendEmailToUser = async (userId: string, email: string) => {
    try {
      // This would be an API call to send email
      toast.success(`Email sent to ${email}`)
    } catch (error) {
      console.error('Error sending email:', error)
      toast.error('Failed to send email')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case USER_ACCOUNT_STATUS.ACTIVE: return 'bg-green-100 text-green-800'
      case USER_ACCOUNT_STATUS.SUSPENDED: return 'bg-yellow-100 text-yellow-800'
      case USER_ACCOUNT_STATUS.BANNED: return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case USER_ACCOUNT_STATUS.ACTIVE: return <CheckCircle className="h-4 w-4 text-green-500" />
      case USER_ACCOUNT_STATUS.SUSPENDED: return <XCircle className="h-4 w-4 text-yellow-500" />
      case USER_ACCOUNT_STATUS.BANNED: return <Ban className="h-4 w-4 text-red-500" />
      default: return <CheckCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const filteredUsers = users.filter(user => {
    if (filters.status !== 'all' && user.status !== filters.status) return false
    if (filters.verified !== 'all') {
      // Note: verified_email field not in schema, treating all as verified for now
      const isVerified = true
      if (filters.verified === 'verified' && !isVerified) return false
      if (filters.verified === 'unverified' && isVerified) return false
    }
    if (filters.search && !(
      user.full_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
      user.email.toLowerCase().includes(filters.search.toLowerCase())
    )) return false
    return true
  })

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D85D28] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading users...</p>
          </div>
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
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600">Manage user accounts and monitor user activity</p>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total.toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-green-600">{stats.active.toLocaleString()}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm font-medium text-gray-600">Suspended</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.suspended}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm font-medium text-gray-600">Banned</p>
              <p className="text-2xl font-bold text-red-600">{stats.banned}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm font-medium text-gray-600">New This Month</p>
              <p className="text-2xl font-bold text-[#D85D28]">{stats.new_this_month}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm font-medium text-gray-600">Verified Emails</p>
              <p className="text-2xl font-bold text-purple-600">{stats.verified_emails.toLocaleString()}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#D85D28] focus:border-[#D85D28]"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#D85D28] focus:border-[#D85D28]"
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                aria-label="Filter by status"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="banned">Banned</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Verification</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#D85D28] focus:border-[#D85D28]"
                value={filters.verified}
                onChange={(e) => setFilters(prev => ({ ...prev, verified: e.target.value }))}
                aria-label="Filter by email verification"
              >
                <option value="all">All Users</option>
                <option value="verified">Verified</option>
                <option value="unverified">Unverified</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {user.avatar_url ? (
                            <img className="h-10 w-10 rounded-full" src={user.avatar_url} alt="" />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <Users className="h-5 w-5 text-gray-600" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center">
                            <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
                            <div className="flex items-center space-x-1 ml-2">
                              <span className="text-xs text-blue-600 capitalize">{user.active_role}</span>
                              {user.is_vendor && (
                                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Vendor</span>
                              )}
                              {user.is_admin && (
                                <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Admin</span>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(user.status)}
                        <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.status)}`}>
                          {user.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="text-xs text-gray-500 space-y-1">
                        <div className="flex justify-between">
                          <span>Role:</span>
                          <span className="capitalize">{user.active_role}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Phone:</span>
                          <span>{user.phone || 'Not provided'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.location || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedUser(user)
                          setShowModal(true)
                        }}
                        className="text-[#D85D28] hover:text-[#B54A1F]"
                        aria-label="View user details"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} results
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                aria-label="Previous page"
              >
                Previous
              </button>
              <span className="px-3 py-2 text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                aria-label="Next page"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* User Detail Modal */}
        {showModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-medium text-gray-900">User Details</h3>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                    aria-label="Close modal"
                  >
                    ×
                  </button>
                </div>
                
                <div className="space-y-6">
                  {/* User Info */}
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-16 w-16">
                      {selectedUser.avatar_url ? (
                        <img className="h-16 w-16 rounded-full" src={selectedUser.avatar_url} alt="" />
                      ) : (
                        <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center">
                          <Users className="h-8 w-8 text-gray-600" />
                        </div>
                      )}
                    </div>
                    <div className="ml-6">
                      <div className="flex items-center">
                        <h4 className="text-xl font-medium text-gray-900">{selectedUser.full_name}</h4>
                        <div className="flex items-center space-x-2 ml-2">
                          <span className="text-sm text-blue-600 capitalize">{selectedUser.active_role}</span>
                          {selectedUser.is_vendor && (
                            <span className="text-sm bg-purple-100 text-purple-800 px-2 py-1 rounded">Vendor</span>
                          )}
                          {selectedUser.is_admin && (
                            <span className="text-sm bg-red-100 text-red-800 px-2 py-1 rounded">Admin</span>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-600">{selectedUser.email}</p>
                      <div className="flex items-center mt-2">
                        {getStatusIcon(selectedUser.status)}
                        <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedUser.status)}`}>
                          {selectedUser.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Contact Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <p className="text-sm text-gray-900 mt-1">{selectedUser.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Avatar</label>
                      <p className="text-sm text-gray-900 mt-1">{selectedUser.avatar_url ? 'Provided' : 'Not provided'}</p>
                    </div>
                  </div>
                  
                  {/* Account Info */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Account Information</label>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-lg font-bold text-blue-600 capitalize">{selectedUser.active_role}</p>
                        <p className="text-sm text-blue-600">Active Role</p>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <p className="text-lg font-bold text-purple-600">{selectedUser.is_vendor ? 'Yes' : 'No'}</p>
                        <p className="text-sm text-purple-600">Is Vendor</p>
                      </div>
                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <p className="text-lg font-bold text-red-600">{selectedUser.is_admin ? 'Yes' : 'No'}</p>
                        <p className="text-sm text-red-600">Is Admin</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Dates */}
                  <div className="grid grid-cols-1 gap-4 text-sm text-gray-500">
                    <div>
                      <label className="block font-medium">Joined</label>
                      <div className="flex items-center mt-1">
                        <Calendar className="h-4 w-4 mr-2" />
                        <p>{new Date(selectedUser.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
                  <div className="flex space-x-3">
                    <button
                      onClick={() => sendEmailToUser(selectedUser.id, selectedUser.email)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium flex items-center"
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Send Email
                    </button>
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Close
                    </button>
                    
                    {selectedUser.status === USER_ACCOUNT_STATUS.ACTIVE && (
                      <>
                        <button
                          onClick={() => updateUserStatus(selectedUser.id, USER_ACCOUNT_STATUS.SUSPENDED)}
                          className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 text-sm font-medium"
                        >
                          Suspend User
                        </button>
                        <button
                          onClick={() => updateUserStatus(selectedUser.id, USER_ACCOUNT_STATUS.BANNED)}
                          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium"
                        >
                          Ban User
                        </button>
                      </>
                    )}
                    
                    {selectedUser.status === USER_ACCOUNT_STATUS.SUSPENDED && (
                      <>
                        <button
                          onClick={() => updateUserStatus(selectedUser.id, USER_ACCOUNT_STATUS.ACTIVE)}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
                        >
                          Reactivate User
                        </button>
                        <button
                          onClick={() => updateUserStatus(selectedUser.id, USER_ACCOUNT_STATUS.BANNED)}
                          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium"
                        >
                          Ban User
                        </button>
                      </>
                    )}
                    
                    {selectedUser.status === USER_ACCOUNT_STATUS.BANNED && (
                      <button
                        onClick={() => updateUserStatus(selectedUser.id, USER_ACCOUNT_STATUS.ACTIVE)}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
                      >
                        Unban User
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}