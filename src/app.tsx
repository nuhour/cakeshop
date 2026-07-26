import React, { useEffect } from 'react'
import { userStore } from '@/store/user'
import './app.scss'

export default function App({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (userStore.isLoggedIn()) {
      userStore.loadProfile()
    }
  }, [])

  return children
}
