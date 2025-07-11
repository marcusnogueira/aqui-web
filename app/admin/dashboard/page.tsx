'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { adminAuth } from '@/lib/admin-auth'
import { useFadeInUp, useStaggeredAnimation, useSpin } from '@/lib/animations'
import {
  Users,
  Store,
  Shield,
  BarChart3,
  MessageSquare,
  Download,
  Activity,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Eye,
  ArrowUpRight,
  Zap,
  Calendar,
  Settings
} from 'lucide-react'

interface AdminUser {
  id: string
  username: string
  email: string
}

interface StatCard {
  title: string
  value: string
  change: string
  changeType: 'positive' | 'negative' | 'neutral'
  icon: React.ComponentType<{ className?: string }>
  color: string
}

interface QuickAction {
  title: string
  description: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  badge?: string
}

interface DashboardStats {
  totalUsers: number
  activeVendors: number
  pendingReviews: number
  revenue: number
}

interface QuickActionData {
  pendingApplications: number
  moderationQueue: number
  pendingExports: number
  recentUsers: number
  pendingFeedback: number
  recentExports: number
}

export default function AdminDashboard() {
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [quickActionData, setQuickActionData] = useState<QuickActionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const router = useRouter()
  const headerRef = useFadeInUp({ delay: 100 })
  const statsRef = useFadeInUp({ delay: 200 })
  const actionsRef = useFadeInUp({ delay: 300 })
  const activityRef = useFadeInUp({ delay: 400 })
  const spinRef = useSpin(loading)
  const setStaggerRef = useStaggeredAnimation(6, { stagger: 150 })

  useEffect(() => {
    checkAuth()
    fetchStats()
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

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
        setQuickActionData(data.quickActions)
      } else {
        console.error('Failed to fetch stats')
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setStatsLoading(false)
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div ref={spinRef} className="w-16 h-16 border-4 border-[#D85D28] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!admin) {
    return null // Will redirect to login
  }

  const statsData: StatCard[] = stats ? [
    {
      title: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      change: '+12.5%', // Could be calculated from historical data
      changeType: 'positive',
      icon: Users,
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Active Vendors',
      value: stats.activeVendors.toLocaleString(),
      change: '+8.2%', // Could be calculated from historical data
      changeType: 'positive',
      icon: Store,
      color: 'from-emerald-500 to-emerald-600'
    },
    {
      title: 'Pending Reviews',
      value: stats.pendingReviews.toLocaleString(),
      change: stats.pendingReviews > 0 ? `${stats.pendingReviews} pending` : 'All clear',
      changeType: stats.pendingReviews > 0 ? 'negative' : 'positive',
      icon: Shield,
      color: 'from-amber-500 to-amber-600'
    },
    {
      title: 'Revenue',
      value: '$45.2K', // Placeholder - would need transaction data
      change: '+23.1%',
      changeType: 'positive',
      icon: TrendingUp,
      color: 'from-purple-500 to-purple-600'
    }
  ] : []

  const quickActions: QuickAction[] = quickActionData ? [
    {
      title: 'Vendor Management',
      description: 'Approve vendors, manage listings, and monitor vendor activity across the platform.',
      href: '/admin/vendors',
      icon: Store,
      color: 'from-[#D85D28] to-[#B54A1F]',
      badge: quickActionData.pendingApplications > 0 ? `${quickActionData.pendingApplications} pending` : undefined
    },
    {
      title: 'Moderation Queue',
      description: 'Review reported content and moderate user-generated content for quality assurance.',
      href: '/admin/moderation',
      icon: Shield,
      color: 'from-[#3A938A] to-[#2F7A73]',
      badge: quickActionData.moderationQueue > 0 ? `${quickActionData.moderationQueue} reports` : undefined
    },
    {
      title: 'Platform Analytics',
      description: 'View detailed analytics, user metrics, and comprehensive platform insights.',
      href: '/admin/analytics',
      icon: BarChart3,
      color: 'from-purple-600 to-purple-700',
      badge: quickActionData.pendingExports > 0 ? `${quickActionData.pendingExports} pending` : undefined
    },
    {
      title: 'User Management',
      description: 'Manage user accounts, permissions, and monitor user activity patterns.',
      href: '/admin/users',
      icon: Users,
      color: 'from-blue-600 to-blue-700',
      badge: quickActionData.recentUsers > 0 ? `${quickActionData.recentUsers} new` : undefined
    },
    {
      title: 'Vendor Feedback',
      description: 'Review vendor feedback, customer reports, and satisfaction metrics.',
      href: '/admin/feedback',
      icon: MessageSquare,
      color: 'from-yellow-600 to-yellow-700',
      badge: quickActionData.pendingFeedback > 0 ? `${quickActionData.pendingFeedback} new` : undefined
    },
    {
      title: 'Export Center',
      description: 'Generate and download comprehensive data exports and detailed reports.',
      href: '/admin/exports',
      icon: Download,
      color: 'from-green-600 to-green-700',
      badge: quickActionData.recentExports > 0 ? `${quickActionData.recentExports} recent` : undefined
    }
  ] : []

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Modern Header */}
      <div ref={headerRef} className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#D85D28]/5 to-[#3A938A]/5"></div>
        <div className="relative fluid-container fluid-spacing-md">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between fluid-gap">
            <div className="mb-6 sm:mb-0">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-[#D85D28] to-[#B54A1F] rounded-xl flex items-center justify-center shadow-lg">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="fluid-text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Admin Dashboard
                  </h1>
                  <p className="fluid-text-base text-slate-600 font-medium">Welcome back, {admin.username}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 text-sm text-slate-500">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>System Online</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="group bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center space-x-2"
            >
              <span>Sign Out</span>
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div ref={statsRef} className="fluid-container -mt-4">
        <div className="fluid-grid">
          {statsLoading ? (
            // Loading skeleton
            Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
                <div className="animate-pulse">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-slate-200 rounded-xl"></div>
                    <div className="w-16 h-4 bg-slate-200 rounded"></div>
                  </div>
                  <div className="w-20 h-8 bg-slate-200 rounded mb-2"></div>
                  <div className="w-24 h-4 bg-slate-200 rounded"></div>
                </div>
              </div>
            ))
          ) : (
            statsData.map((stat, index) => {
              const Icon = stat.icon
              return (
                <div
                  key={stat.title}
                  className="group relative bg-white/80 backdrop-blur-sm rounded-2xl fluid-spacing-sm shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 hover:border-white/40 transform hover:-translate-y-1 container-responsive"
                >
                  <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-2xl" style={{ backgroundImage: `linear-gradient(135deg, ${stat.color.split(' ')[1]}, ${stat.color.split(' ')[3]})` }}></div>
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className={`flex items-center space-x-1 fluid-text-sm font-medium ${
                        stat.changeType === 'positive' ? 'text-emerald-600' : 
                        stat.changeType === 'negative' ? 'text-red-600' : 'text-slate-600'
                      }`}>
                        <TrendingUp className={`w-4 h-4 ${
                          stat.changeType === 'negative' ? 'rotate-180' : ''
                        }`} />
                        <span>{stat.change}</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
                      <p className="text-slate-600 font-medium">{stat.title}</p>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Admin Profile & System Status */}
      <div className="fluid-container fluid-spacing-md">
        <div className="fluid-grid">
          {/* Enhanced Admin Profile */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-[#3A938A] to-[#2F7A73] rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-xl">
                    {admin?.username?.charAt(0)?.toUpperCase() || 'A'}
                  </span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                  <CheckCircle className="w-3 h-3 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900">Admin Profile</h3>
                <p className="text-lg font-semibold text-[#D85D28] mt-1">{admin?.username || 'Admin'}</p>
                <p className="text-sm text-slate-600">{admin?.email || 'admin@example.com'}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-slate-500 font-medium">Active Session</span>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced System Status */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">System Health</h3>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Database', status: 'Online', icon: CheckCircle, color: 'text-emerald-600' },
                { label: 'API Gateway', status: 'Healthy', icon: CheckCircle, color: 'text-emerald-600' },
                { label: 'Auth System', status: 'Active', icon: CheckCircle, color: 'text-emerald-600' },
                { label: 'Cache Layer', status: 'Optimal', icon: Zap, color: 'text-blue-600' }
              ].map((item, index) => {
                const StatusIcon = item.icon
                return (
                  <div key={item.label} className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <StatusIcon className={`w-5 h-5 ${item.color}`} />
                      <span className="font-medium text-gray-700">{item.label}</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 ${item.color}`}>
                      {item.status}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Section */}
      <div ref={actionsRef} className="fluid-container fluid-spacing-lg">
        <div className="flex items-center fluid-gap fluid-spacing-sm">
          <div className="w-8 h-8 bg-gradient-to-br from-[#D85D28] to-[#B54A1F] rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <h2 className="fluid-text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Quick Actions</h2>
        </div>
        <div className="fluid-grid">
          {quickActions.map((action, index) => {
            const Icon = action.icon
            return (
              <div
                key={action.title}
                ref={setStaggerRef(index)}
                className="group relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 border border-white/20 hover:border-white/40 transform hover:-translate-y-2 overflow-hidden"
              >
                {/* Background gradient overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
                
                {/* Badge */}
                {action.badge && (
                  <div className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                    {action.badge}
                  </div>
                )}
                
                <div className="relative">
                  {/* Icon and Title */}
                  <div className="flex items-start space-x-4 mb-4">
                    <div className={`w-14 h-14 bg-gradient-to-br ${action.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-gray-800 transition-colors">
                        {action.title}
                      </h3>
                    </div>
                  </div>
                  
                  {/* Description */}
                  <p className="text-slate-600 mb-6 leading-relaxed group-hover:text-slate-700 transition-colors">
                    {action.description}
                  </p>
                  
                  {/* Action Button */}
                  <a 
                    href={action.href}
                    className={`group/btn inline-flex items-center space-x-2 bg-gradient-to-r ${action.color} text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 w-full justify-center`}
                  >
                    <span>Access {action.title.split(' ')[0]}</span>
                    <ArrowUpRight className="w-4 h-4 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div ref={activityRef} className="fluid-container fluid-spacing-lg">
        <div className="flex items-center fluid-gap fluid-spacing-sm">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg flex items-center justify-center">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <h2 className="fluid-text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Recent Activity</h2>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 fluid-spacing-md container-responsive">
          <div className="space-y-6">
            {[
              { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50', title: 'New vendor application approved', time: '2 hours ago', type: 'success' },
              { icon: BarChart3, color: 'text-blue-500', bg: 'bg-blue-50', title: 'Platform analytics updated', time: '4 hours ago', type: 'info' },
              { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-50', title: 'Moderation queue requires attention', time: '6 hours ago', type: 'warning' },
              { icon: Eye, color: 'text-red-500', bg: 'bg-red-50', title: 'System maintenance scheduled', time: '8 hours ago', type: 'error' }
            ].map((activity, index) => {
              const Icon = activity.icon
              return (
                <div key={index} className="group flex items-center justify-between p-4 rounded-xl hover:bg-gray-50/50 transition-all duration-300 border border-transparent hover:border-gray-200/50">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 ${activity.bg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`w-6 h-6 ${activity.color}`} />
                    </div>
                    <div>
                      <span className="text-gray-900 font-semibold text-lg group-hover:text-gray-800 transition-colors">
                        {activity.title}
                      </span>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className={`w-2 h-2 rounded-full ${
                          activity.type === 'success' ? 'bg-green-500' :
                          activity.type === 'info' ? 'bg-blue-500' :
                          activity.type === 'warning' ? 'bg-yellow-500' :
                          'bg-red-500'
                        } animate-pulse`}></div>
                        <span className="text-slate-500 text-sm font-medium">{activity.time}</span>
                      </div>
                    </div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <ArrowUpRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              )
            })}
          </div>
          
          {/* View All Activity Button */}
          <div className="mt-8 pt-6 border-t border-gray-200/50">
            <button className="w-full bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-all duration-300 hover:shadow-md border border-gray-200/50 hover:border-gray-300/50">
              View All Activity
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}