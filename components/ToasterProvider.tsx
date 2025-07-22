'use client'

import { Toaster, ToasterProps } from 'react-hot-toast'

const ToasterProvider = (props: ToasterProps) => {
  return <Toaster {...props} />
}

export default ToasterProvider
