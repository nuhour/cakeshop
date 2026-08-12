import { Button, Text, View } from '@tarojs/components'
import './EmptyState.scss'

interface Props {
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({ title, description, actionLabel, onAction }: Props) {
  return (
    <View className="empty-state">
      <Text className="empty-state__icon">◌</Text>
      <Text className="empty-state__title">{title}</Text>
      {description ? <Text className="empty-state__desc">{description}</Text> : null}
      {actionLabel && onAction ? <Button className="empty-state__action" onClick={onAction}>{actionLabel}</Button> : null}
    </View>
  )
}
