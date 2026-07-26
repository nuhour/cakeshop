import { Text, View } from '@tarojs/components'
import './EmptyState.scss'

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <View className="empty-state">
      <Text className="empty-state__icon">◌</Text>
      <Text className="empty-state__title">{title}</Text>
      {description ? <Text className="empty-state__desc">{description}</Text> : null}
    </View>
  )
}
