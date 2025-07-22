import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

// Mock dependencies first
const mockSupabaseClient = {
  from: vi.fn(),
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  eq: vi.fn(),
  single: vi.fn(),
}

const mockAuth = vi.fn()
const mockGetCurrentSession = vi.fn()
const mockSetUserContext = vi.fn()
const mockClearUserContext = vi.fn()
const mockRefreshUserSessionWithVendorData = vi.fn()
const mockGetSessionRefreshInstructions = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: () => mockSupabaseClient,
}))

vi.mock('@/app/api/auth/[...nextauth]/auth', () => ({
  auth: mockAuth,
}))

vi.mock('@/lib/nextauth-context', () => ({
  getCurrentSession: mockGetCurrentSession,
  setUserContext: mockSetUserContext,
  clearUserContext: mockClearUserContext,
}))

vi.mock('@/lib/session-refresh', () => ({
  refreshUserSessionWithVendorData: mockRefreshUserSessionWithVendorData,
  getSessionRefreshInstructions: mockGetSessionRefreshInstructions,
}))

vi.mock('next/headers', () => ({
  cookies: () => ({}),
}))

// Import after mocks
const { POST } = await import('@/app/api/user/become-vendor/route')

describe('Vendor Creation API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default mocks
    mockGetCurrentSession.mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' }
    })
    
    mockAuth.mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' }
    })
    
    mockRefreshUserSessionWithVendorData.mockResolvedValue({
      success: true
    })
    
    mockGetSessionRefreshInstructions.mockReturnValue({
      refreshRequired: true,
      message: 'Session refresh required'
    })
    
    // Setup Supabase chain mocks
    mockSupabaseClient.from.mockReturnValue(mockSupabaseClient)
    mockSupabaseClient.select.mockReturnValue(mockSupabaseClient)
    mockSupabaseClient.insert.mockReturnValue(mockSupabaseClient)
    mockSupabaseClient.update.mockReturnValue(mockSupabaseClient)
    mockSupabaseClient.delete.mockReturnValue(mockSupabaseClient)
    mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient)
    mockSupabaseClient.single.mockReturnValue(mockSupabaseClient)
  })

  describe('Input Validation', () => {
    it('should return 400 for missing business_name', async () => {
      const request = new NextRequest('http://localhost:3000/api/user/become-vendor', {
        method: 'POST',
        body: JSON.stringify({
          business_type: 'restaurant',
          contact_email: 'test@example.com'
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Business name and type are required')
    })

    it('should return 400 for missing business_type', async () => {
      const request = new NextRequest('http://localhost:3000/api/user/become-vendor', {
        method: 'POST',
        body: JSON.stringify({
          business_name: 'Test Business',
          contact_email: 'test@example.com'
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Business name and type are required')
    })

    it('should return 400 for missing contact_email', async () => {
      const request = new NextRequest('http://localhost:3000/api/user/become-vendor', {
        method: 'POST',
        body: JSON.stringify({
          business_name: 'Test Business',
          business_type: 'restaurant'
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Contact email is required')
    })

    it('should return 400 for invalid email format', async () => {
      const request = new NextRequest('http://localhost:3000/api/user/become-vendor', {
        method: 'POST',
        body: JSON.stringify({
          business_name: 'Test Business',
          business_type: 'restaurant',
          contact_email: 'invalid-email'
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Please provide a valid email address')
    })

    it('should return 400 for business name too short', async () => {
      const request = new NextRequest('http://localhost:3000/api/user/become-vendor', {
        method: 'POST',
        body: JSON.stringify({
          business_name: 'A',
          business_type: 'restaurant',
          contact_email: 'test@example.com'
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Business name must be at least 2 characters long')
    })
  })

  describe('Authentication', () => {
    it('should return 401 when no session exists', async () => {
      mockGetCurrentSession.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/user/become-vendor', {
        method: 'POST',
        body: JSON.stringify({
          business_name: 'Test Business',
          business_type: 'restaurant',
          contact_email: 'test@example.com'
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Authentication required')
    })

    it('should return 401 when auth session is invalid', async () => {
      mockAuth.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/user/become-vendor', {
        method: 'POST',
        body: JSON.stringify({
          business_name: 'Test Business',
          business_type: 'restaurant',
          contact_email: 'test@example.com'
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized access')
    })
  })

  describe('Existing Vendor Check', () => {
    it('should return 400 when user already has vendor profile', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: { id: 'vendor-123' },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/user/become-vendor', {
        method: 'POST',
        body: JSON.stringify({
          business_name: 'Test Business',
          business_type: 'restaurant',
          contact_email: 'test@example.com'
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('User already has a vendor profile')
    })
  })

  describe('Unique Constraint Error Handling', () => {
    beforeEach(() => {
      // Mock no existing vendor
      mockSupabaseClient.single
        .mockResolvedValueOnce({ data: null, error: null }) // existing vendor check
        .mockResolvedValueOnce({ // platform settings
          data: { require_vendor_approval: false },
          error: null
        })
    })

    it('should handle duplicate business name error', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: {
          code: '23505',
          message: 'duplicate key value violates unique constraint "vendors_business_name_unique"'
        }
      })

      const request = new NextRequest('http://localhost:3000/api/user/become-vendor', {
        method: 'POST',
        body: JSON.stringify({
          business_name: 'Duplicate Business',
          business_type: 'restaurant',
          contact_email: 'test@example.com'
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Vendor name already taken. Please choose a different business name.')
    })

    it('should handle duplicate contact email error', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: {
          code: '23505',
          message: 'duplicate key value violates unique constraint "vendors_contact_email_unique"'
        }
      })

      const request = new NextRequest('http://localhost:3000/api/user/become-vendor', {
        method: 'POST',
        body: JSON.stringify({
          business_name: 'Test Business',
          business_type: 'restaurant',
          contact_email: 'duplicate@example.com'
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Email already registered. Please use a different contact email.')
    })

    it('should handle generic unique constraint error', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: {
          code: '23505',
          message: 'duplicate key value violates unique constraint "some_other_constraint"'
        }
      })

      const request = new NextRequest('http://localhost:3000/api/user/become-vendor', {
        method: 'POST',
        body: JSON.stringify({
          business_name: 'Test Business',
          business_type: 'restaurant',
          contact_email: 'test@example.com'
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('This information is already registered. Please check your business name and contact email.')
    })
  })

  describe('Platform Settings and Approval Logic', () => {
    beforeEach(() => {
      // Mock no existing vendor
      mockSupabaseClient.single
        .mockResolvedValueOnce({ data: null, error: null })
    })

    it('should create approved vendor when require_vendor_approval is false', async () => {
      mockSupabaseClient.single
        .mockResolvedValueOnce({ // platform settings
          data: { require_vendor_approval: false },
          error: null
        })
        .mockResolvedValueOnce({ // vendor creation
          data: { id: 'vendor-123', status: 'approved' },
          error: null
        })
        .mockResolvedValueOnce({ // user update
          data: { id: 'user-123', is_vendor: true, active_role: 'vendor' },
          error: null
        })

      const request = new NextRequest('http://localhost:3000/api/user/become-vendor', {
        method: 'POST',
        body: JSON.stringify({
          business_name: 'Test Business',
          business_type: 'restaurant',
          contact_email: 'test@example.com'
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Vendor profile created and approved successfully.')
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'approved' })
      )
    })

    it('should create pending vendor when require_vendor_approval is true', async () => {
      mockSupabaseClient.single
        .mockResolvedValueOnce({ // platform settings
          data: { require_vendor_approval: true },
          error: null
        })
        .mockResolvedValueOnce({ // vendor creation
          data: { id: 'vendor-123', status: 'pending' },
          error: null
        })
        .mockResolvedValueOnce({ // user update
          data: { id: 'user-123', is_vendor: true, active_role: 'vendor' },
          error: null
        })

      const request = new NextRequest('http://localhost:3000/api/user/become-vendor', {
        method: 'POST',
        body: JSON.stringify({
          business_name: 'Test Business',
          business_type: 'restaurant',
          contact_email: 'test@example.com'
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Vendor profile created successfully. It is now pending approval.')
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'pending' })
      )
    })

    it('should fallback to allow_auto_vendor_approval when require_vendor_approval is not set', async () => {
      mockSupabaseClient.single
        .mockResolvedValueOnce({ // platform settings
          data: { allow_auto_vendor_approval: true },
          error: null
        })
        .mockResolvedValueOnce({ // vendor creation
          data: { id: 'vendor-123', status: 'approved' },
          error: null
        })
        .mockResolvedValueOnce({ // user update
          data: { id: 'user-123', is_vendor: true, active_role: 'vendor' },
          error: null
        })

      const request = new NextRequest('http://localhost:3000/api/user/become-vendor', {
        method: 'POST',
        body: JSON.stringify({
          business_name: 'Test Business',
          business_type: 'restaurant',
          contact_email: 'test@example.com'
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'approved' })
      )
    })
  })

  describe('Session Management', () => {
    beforeEach(() => {
      // Mock successful flow
      mockSupabaseClient.single
        .mockResolvedValueOnce({ data: null, error: null }) // existing vendor check
        .mockResolvedValueOnce({ // platform settings
          data: { require_vendor_approval: false },
          error: null
        })
        .mockResolvedValueOnce({ // vendor creation
          data: { id: 'vendor-123', status: 'approved' },
          error: null
        })
        .mockResolvedValueOnce({ // user update
          data: { id: 'user-123', is_vendor: true, active_role: 'vendor' },
          error: null
        })
    })

    it('should call session refresh after successful vendor creation', async () => {
      const request = new NextRequest('http://localhost:3000/api/user/become-vendor', {
        method: 'POST',
        body: JSON.stringify({
          business_name: 'Test Business',
          business_type: 'restaurant',
          contact_email: 'test@example.com'
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(mockRefreshUserSessionWithVendorData).toHaveBeenCalledWith('user-123')
      expect(mockGetSessionRefreshInstructions).toHaveBeenCalled()
      expect(data.sessionRefresh).toBeDefined()
    })

    it('should handle session refresh failure gracefully', async () => {
      mockRefreshUserSessionWithVendorData.mockResolvedValue({
        success: false,
        error: 'Session refresh failed'
      })

      const request = new NextRequest('http://localhost:3000/api/user/become-vendor', {
        method: 'POST',
        body: JSON.stringify({
          business_name: 'Test Business',
          business_type: 'restaurant',
          contact_email: 'test@example.com'
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      // Should still succeed even if session refresh fails
    })
  })

  describe('Error Recovery', () => {
    it('should cleanup vendor profile if user update fails', async () => {
      mockSupabaseClient.single
        .mockResolvedValueOnce({ data: null, error: null }) // existing vendor check
        .mockResolvedValueOnce({ // platform settings
          data: { require_vendor_approval: false },
          error: null
        })
        .mockResolvedValueOnce({ // vendor creation
          data: { id: 'vendor-123', status: 'approved' },
          error: null
        })
        .mockResolvedValueOnce({ // user update fails
          data: null,
          error: { message: 'User update failed' }
        })

      const request = new NextRequest('http://localhost:3000/api/user/become-vendor', {
        method: 'POST',
        body: JSON.stringify({
          business_name: 'Test Business',
          business_type: 'restaurant',
          contact_email: 'test@example.com'
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
      expect(mockSupabaseClient.delete).toHaveBeenCalled()
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 'vendor-123')
    })
  })

  describe('Context Management', () => {
    it('should set and clear user context properly', async () => {
      mockSupabaseClient.single
        .mockResolvedValueOnce({ data: null, error: null }) // existing vendor check
        .mockResolvedValueOnce({ // platform settings
          data: { require_vendor_approval: false },
          error: null
        })
        .mockResolvedValueOnce({ // vendor creation
          data: { id: 'vendor-123', status: 'approved' },
          error: null
        })
        .mockResolvedValueOnce({ // user update
          data: { id: 'user-123', is_vendor: true, active_role: 'vendor' },
          error: null
        })

      const request = new NextRequest('http://localhost:3000/api/user/become-vendor', {
        method: 'POST',
        body: JSON.stringify({
          business_name: 'Test Business',
          business_type: 'restaurant',
          contact_email: 'test@example.com'
        }),
      })

      await POST(request)

      expect(mockSetUserContext).toHaveBeenCalledWith(mockSupabaseClient, 'user-123')
      expect(mockClearUserContext).toHaveBeenCalledWith(mockSupabaseClient)
    })
  })
})