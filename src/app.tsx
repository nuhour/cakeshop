import Taro from '@tarojs/taro'
import React, { useEffect } from 'react'
import { userStore } from '@/store/user'
import './app.scss'

export default function App({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (userStore.isLoggedIn()) {
      userStore.loadProfile()
    }
    const handleLoginRequired = () => {
      userStore.logout()
    }
    Taro.eventCenter.on('cakeshop:login-required', handleLoginRequired)
    return () => {
      Taro.eventCenter.off('cakeshop:login-required', handleLoginRequired)
    }
  }, [])

  return children
}
