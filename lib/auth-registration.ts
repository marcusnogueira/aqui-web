import { errorHandler, createNetworkError, Result, createResult } from '@/lib/error-handler'

/**
 * Client-side registration helper
 * Use this to register new users with email/password
 */
export const registerUser = async (userData: {
  email: string
  password: string
  name?: string
}): Promise<Result<any>> => {
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      const error = createNetworkError(
        data.error || 'Registration failed',
        'REGISTRATION_FAILED',
        { email: userData.email, status: response.status, data }
      )
      return createResult.error(error)
    }
    
    return createResult.success(data)
  } catch (error) {
    const standardError = errorHandler.handle(error as Error, 'registerUser')
    return createResult.error(standardError)
  }
}

/**
 * Helper to register and then sign in the user
 */
export const registerAndSignIn = async (userData: {
  email: string
  password: string
  name?: string
}) => {
  // First register the user
  const registrationResult = await registerUser(userData)
  
  if (!registrationResult.success) {
    return registrationResult
  }
  
  // Then sign them in with NextAuth
  const { signIn } = await import('next-auth/react')
  const signInResult = await signIn('credentials', {
    email: userData.email,
    password: userData.password,
    redirect: false,
  })
  
  if (signInResult?.error) {
    const error = createNetworkError(
      'Registration successful but sign-in failed',
      'SIGNIN_AFTER_REGISTRATION_FAILED',
      { email: userData.email, signInError: signInResult.error }
    )
    return createResult.error(error)
  }
  
  return createResult.success({
    user: registrationResult.data.user,
    signInResult
  })
}