import Taro from '@tarojs/taro'
import { Text, View } from '@tarojs/components'
import { useEffect, useState } from 'react'
import './AppNavBar.scss'

interface Props {
  title: string
  back?: boolean
  rightText?: string
  onRight?: () => void
}

export function AppNavBar({ title, back = false, rightText, onRight }: Props) {
  const [metric, setMetric] = useState(() => {
    try {
      const menu = Taro.getMenuButtonBoundingClientRect()
      return {
        top: menu.top || 44,
        bottom: menu.bottom || 80,
        height: menu.height || 32
      }
    } catch (_error) {
      return { top: 44, bottom: 80, height: 32 }
    }
  })

  useEffect(() => {
    try {
      const menu = Taro.getMenuButtonBoundingClientRect()
      setMetric({
        top: menu.top || 44,
        bottom: menu.bottom || 80,
        height: menu.height || 32
      })
    } catch (_error) {
      setMetric({ top: 44, bottom: 80, height: 32 })
    }
  }, [])

  const style = {
    paddingTop: `${metric.bottom + 6}px`
  }
  const backStyle = {
    top: `${metric.top}px`,
    height: `${metric.height}px`,
    width: `${metric.height}px`
  }

  return (
    <View className="app-nav" style={style}>
      {back ? (
        <View className="app-nav__back" style={backStyle} onClick={() => Taro.navigateBack()}>
          <Text className="app-nav__icon">‹</Text>
        </View>
      ) : null}
      <Text className="app-nav__title">{title}</Text>
      {rightText ? (
        <View className="app-nav__right" onClick={onRight}>
          <Text>{rightText}</Text>
        </View>
      ) : null}
    </View>
  )
}
