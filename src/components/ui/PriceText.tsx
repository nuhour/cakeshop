import { Text, View } from '@tarojs/components'
import './PriceText.scss'

interface Props {
  value: number
  original?: number
  size?: 'small' | 'normal' | 'large'
}

export function PriceText({ value, original, size = 'normal' }: Props) {
  const showOriginal = typeof original === 'number' && original > value
  return (
    <View className={`price-text price-text--${size}`}>
      <Text className="price-text__symbol">¥</Text>
      <Text className="price-text__value">{value.toLocaleString()}</Text>
      {showOriginal ? <Text className="price-text__original">¥{original?.toLocaleString()}</Text> : null}
    </View>
  )
}
