'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { adminAuth, AdminUser } from '@/lib/admin-auth'
import { useFadeInUp, useSpin } from '@/lib/animations'
import {
  Settings,
  Shield,
  Users,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Save,
  RotateCcw
} from 'lucide-react'

interface PlatformSettings {
  allow_auto_vendor_approval: boolean
  maintenance_mode: boolean
  require_vendor_approval: boolean
}

export default function AdminSettings() {
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [settings, setSettings] = useState<PlatformSettings>({
    allow_auto_vendor_approval: false,
    maintenance_mode: false,
    require_vendor_approval: false
  })
  const [originalSettings, setOriginalSettings] = useState<PlatformSettings>({
    allow_auto_vendor_approval: false,
    maintenance_mode: false,
    require_vendor_approval: false
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const router = useRouter()
  const headerRef = useFadeInUp({ delay: 100 })
  const contentRef = useFadeInUp({ delay: 200 })
  const spinRef = useSpin(loading)

  useEffect(() => {
    checkAuth()
    fetchSettings()
  }, [])

  useEffect(() => {
    // Check if settings have changed
    const changed = JSON.stringify(settings) !== JSON.stringify(originalSettings)
    setHasChanges(changed)
  }, [settings, originalSettings])

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

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.settings) {
          const fetchedSettings = {
            allow_auto_vendor_approval: data.settings.allow_auto_vendor_approval || false,
            maintenance_mode: data.settings.maintenance_mode || false,
            require_vendor_approval: data.settings.require_vendor_approval || false
          }
          setSettings(fetchedSettings)
          setOriginalSettings(fetchedSettings)
        }
      } else {
        console.error('Failed to fetch platform settings')
      }
    } catch (error) {
      console.error('Error fetching platform settings:', error)
    }
  }

  const handleSettingChange = (key: keyof PlatformSettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setSaveStatus('idle')
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveStatus('idle')
    
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setOriginalSettings(settings)
          setSaveStatus('success')
          setTimeout(() => setSaveStatus('idle'), 3000)
        } else {
          setSaveStatus('error')
        }
      } else {
        setSaveStatus('error')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      setSaveStatus('error')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setSettings(originalSettings)
    setSaveStatus('idle')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div ref={spinRef} className="w-16 h-16 border-4 border-[#D85D28] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading settings...</p>
        </div>
      </div>
    )
  }

  if (!admin) {
    return null // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <div ref={headerRef} className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#D85D28]/5 to-[#3A938A]/5"></div>
        <div className="relative fluid-container fluid-spacing-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/admin/dashboard')}
                className="group p-2 rounded-xl bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 hover:border-white/40"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 group-hover:text-gray-800 transition-colors" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#D85D28] to-[#B54A1F] rounded-xl flex items-center justify-center shadow-lg">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="fluid-text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Platform Settings
                  </h1>
                  <p className="fluid-text-base text-slate-600 font-medium">Configure platform behavior and policies</p>
                </div>
              </div>
            </div>
            
            {/* Save/Reset Actions */}
            {hasChanges && (
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleReset}
                  disabled={saving}
                  className="group bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center space-x-2 disabled:opacity-50"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset</span>
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="group bg-gradient-to-r from-[#3A938A] to-[#2F7A73] hover:from-[#2F7A73] hover:to-[#256B65] text-white px-6 py-2 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center space-x-2 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
          
          {/* Save Status */}
          {saveStatus !== 'idle' && (
            <div className={`mt-4 p-4 rounded-xl flex items-center space-x-3 ${
              saveStatus === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {saveStatus === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-600" />
              )}
              <span className="font-medium">
                {saveStatus === 'success' 
                  ? 'Settings saved successfully!' 
                  : 'Failed to save settings. Please try again.'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Settings Content */}
      <div ref={contentRef} className="fluid-container fluid-spacing-lg">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Vendor Management Settings */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-[#D85D28] to-[#B54A1F] rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Vendor Management</h2>
                <p className="text-sm text-gray-600">Control how vendors are onboarded and approved</p>
              </div>
            </div>
            
            <div className="space-y-6">
              {/* Require Vendor Approval */}
              <div className="flex items-start justify-between p-4 bg-slate-50/50 rounded-xl border border-slate-200/50">
                <div className="flex-1">
                  <label htmlFor="require-vendor-approval" className="font-semibold text-gray-800 text-lg">
                    Require Vendor Approval
                  </label>
                  <p className="text-gray-600 mt-1 leading-relaxed">
                    When enabled, new vendor applications will require manual admin approval before they can access vendor features. 
                    When disabled, vendors are automatically approved upon registration.
                  </p>
                  <div className="mt-2 flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${settings.require_vendor_approval ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                    <span className="text-sm font-medium text-gray-600">
                      {settings.require_vendor_approval ? 'Manual approval required' : 'Auto-approval enabled'}
                    </span>
                  </div>
                </div>
                <button
                  id="require-vendor-approval"
                  role="switch"
                  aria-checked={settings.require_vendor_approval}
                  onClick={() => handleSettingChange('require_vendor_approval', !settings.require_vendor_approval)}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ml-4 ${
                    settings.require_vendor_approval ? 'bg-[#D85D28]' : 'bg-gray-300'
                  }`}
                  disabled={saving}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-lg ${
                      settings.require_vendor_approval ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Legacy Auto Approval Setting */}
              <div className="flex items-start justify-between p-4 bg-slate-50/50 rounded-xl border border-slate-200/50 opacity-75">
                <div className="flex-1">
                  <label htmlFor="auto-approve" className="font-semibold text-gray-800 text-lg">
                    Legacy Auto-Approval (Deprecated)
                  </label>
                  <p className="text-gray-600 mt-1 leading-relaxed">
                    This is the legacy setting for vendor auto-approval. Use "Require Vendor Approval" above instead. 
                    This setting will be removed in a future update.
                  </p>
                  <div className="mt-2 flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-medium text-yellow-600">Deprecated - Use setting above</span>
                  </div>
                </div>
                <button
                  id="auto-approve"
                  role="switch"
                  aria-checked={settings.allow_auto_vendor_approval}
                  onClick={() => handleSettingChange('allow_auto_vendor_approval', !settings.allow_auto_vendor_approval)}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ml-4 ${
                    settings.allow_auto_vendor_approval ? 'bg-[#3A938A]' : 'bg-gray-300'
                  }`}
                  disabled={saving}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-lg ${
                      settings.allow_auto_vendor_approval ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* System Settings */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">System Settings</h2>
                <p className="text-sm text-gray-600">Platform-wide system controls</p>
              </div>
            </div>
            
            <div className="space-y-6">
              {/* Maintenance Mode */}
              <div className="flex items-start justify-between p-4 bg-slate-50/50 rounded-xl border border-slate-200/50">
                <div className="flex-1">
                  <label htmlFor="maintenance-mode" className="font-semibold text-gray-800 text-lg">
                    Maintenance Mode
                  </label>
                  <p className="text-gray-600 mt-1 leading-relaxed">
                    When enabled, the platform will display a maintenance message to users and restrict access to most features. 
                    Admin functions will remain accessible.
                  </p>
                  <div className="mt-2 flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${settings.maintenance_mode ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
                    <span className="text-sm font-medium text-gray-600">
                      {settings.maintenance_mode ? 'Platform in maintenance' : 'Platform operational'}
                    </span>
                  </div>
                </div>
                <button
                  id="maintenance-mode"
                  role="switch"
                  aria-checked={settings.maintenance_mode}
                  onClick={() => handleSettingChange('maintenance_mode', !settings.maintenance_mode)}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ml-4 ${
                    settings.maintenance_mode ? 'bg-red-500' : 'bg-gray-300'
                  }`}
                  disabled={saving}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-lg ${
                      settings.maintenance_mode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Settings Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200/50">
            <h3 className="text-lg font-bold text-blue-900 mb-4">Current Configuration Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/60 rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <div className={`w-3 h-3 rounded-full ${settings.require_vendor_approval ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                  <span className="font-semibold text-gray-800">Vendor Approval</span>
                </div>
                <p className="text-sm text-gray-600">
                  {settings.require_vendor_approval ? 'Manual approval required' : 'Auto-approved'}
                </p>
              </div>
              <div className="bg-white/60 rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <div className={`w-3 h-3 rounded-full ${settings.maintenance_mode ? 'bg-red-500' : 'bg-green-500'}`}></div>
                  <span className="font-semibold text-gray-800">System Status</span>
                </div>
                <p className="text-sm text-gray-600">
                  {settings.maintenance_mode ? 'Under maintenance' : 'Operational'}
                </p>
              </div>
              <div className="bg-white/60 rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <div className={`w-3 h-3 rounded-full ${hasChanges ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                  <span className="font-semibold text-gray-800">Changes</span>
                </div>
                <p className="text-sm text-gray-600">
                  {hasChanges ? 'Unsaved changes' : 'All saved'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}