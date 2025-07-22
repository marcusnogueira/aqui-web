'use client'

import toast from 'react-hot-toast'

// Client-side toast wrapper to avoid createContext issues
export const showToast = {
  success: (message: string) => {
    if (typeof window !== 'undefined') {
      toast.success(message)
    }
  },
  error: (message: string) => {
    if (typeof window !== 'undefined') {
      toast.error(message)
    }
  },
  loading: (message: string) => {
    if (typeof window !== 'undefined') {
      return toast.loading(message)
    }
  },
  dismiss: (toastId?: string) => {
    if (typeof window !== 'undefined') {
      toast.dismiss(toastId)
    }
  },
  promise: (promise: Promise<any>, messages: { loading: string; success: string; error: string }) => {
    if (typeof window !== 'undefined') {
      return toast.promise(promise, messages)
    }
  }
}

export default showToast