'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { adminAuth, AdminUser } from '@/lib/admin-auth'
import { toast, Toaster } from 'react-hot-toast'
import { useSpin } from '@/lib/animations'
import {
  LayoutDashboard,
  Users,
  Store,
  Shield,
  BarChart3,
  MessageSquare,
  Download,
  LogOut,
  Menu,
  X,
  Settings,
  Bell,
} from 'lucide-react'



interface Notification {
  id: string;
  message: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  current?: boolean
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Vendor Management', href: '/admin/vendors', icon: Store },
  { name: 'Vendor Status Control', href: '/admin/vendor-status', icon: Settings },
  { name: 'Notification Center', href: '/admin/notifications', icon: Bell },
  { name: 'User Management', href: '/admin/users', icon: Users },
  { name: 'Moderation Queue', href: '/admin/moderation', icon: Shield },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { name: 'Feedback Hub', href: '/admin/feedback', icon: MessageSquare },
  { name: 'Export Center', href: '/admin/exports', icon: Download },
]

function AdminLayout({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const spinRef = useSpin(loading)

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (admin) {
      fetchNotifications();
    }
  }, [admin]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/admin/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    }
  };

  const markNotificationAsRead = async (id: string) => {
    try {
      await fetch(`/api/admin/notifications/${id}/read`, { method: 'POST' });
      fetchNotifications(); // Refresh notifications
    } catch (error) {
      console.error('Failed to mark notification as read', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const checkAuth = async () => {
    try {
      const result = await adminAuth.checkAuth()
      if (result.success && result.data) {
        setAdmin(result.data)
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
      const result = await adminAuth.logout()
      if (result.success) {
        toast.success('Logged out successfully')
        router.push('/admin/login')
      } else {
        toast.error('Logout failed')
        console.error('Logout error:', result.error)
      }
    } catch (error) {
      toast.error('Logout failed')
      console.error('Logout error:', error)
      router.push('/admin/login') // Force logout on any error
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div ref={spinRef} className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D85D28]"></div>
      </div>
    )
  }

  if (!admin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
          <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200">
            <h1 className="text-xl font-bold text-[#D85D28]">Aqui Admin</h1>
            <button onClick={() => setSidebarOpen(false)} aria-label="Close sidebar">
              <X className="h-6 w-6 text-gray-400" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? 'bg-[#D85D28] text-white'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex h-16 items-center px-4 border-b border-gray-200">
            <h1 className="text-xl font-bold text-[#D85D28]">Aqui Admin</h1>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? 'bg-[#D85D28] text-white'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                  {item.name}
                </Link>
              )
            })}
          </nav>
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-[#3A938A] rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {admin.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-700">{admin.username}</p>
                <p className="text-xs text-gray-500">{admin.email}</p>
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="ml-3 text-gray-400 hover:text-gray-600"
                  title="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                      {unreadCount}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 bottom-full mb-2 w-80 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                    <div className="p-3 font-semibold border-b">Notifications</div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="text-center text-gray-500 py-4">No notifications</p>
                      ) : (
                        notifications.map(n => (
                          <div key={n.id} className={`p-3 border-b ${!n.is_read ? 'bg-blue-50' : ''}`}>
                            <p className="text-sm">{n.message}</p>
                            <div className="flex justify-between items-center mt-2">
                              <span className="text-xs text-gray-400">{new Date(n.created_at).toLocaleString()}</span>
                              {!n.is_read && (
                                <button onClick={() => markNotificationAsRead(n.id)} className="text-xs text-blue-500 hover:underline">
                                  Mark as read
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="ml-3 text-gray-400 hover:text-gray-600"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <div className="lg:hidden sticky top-0 z-40 flex h-16 items-center justify-between px-4 border-b border-gray-200 bg-white shadow-sm">
          <button onClick={() => setSidebarOpen(true)} aria-label="Open sidebar">
            <Menu className="h-6 w-6 text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Aqui Admin</h1>
          <button
            onClick={handleLogout}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Logout"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>

        {/* Page content */}
        <main className="flex-1 min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default AdminLayout