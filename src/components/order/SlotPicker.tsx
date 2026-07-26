import { Text, View } from '@tarojs/components'
import type { CsFulfillmentSlot } from '@/types'
import './SlotPicker.scss'

interface Props {
  slots: CsFulfillmentSlot[]
  selectedId?: string
  onSelect: (slotId: string) => void
}

export function SlotPicker({ slots, selectedId, onSelect }: Props) {
  return (
    <View className="slot-picker">
      {slots.map((slot) => {
        const isFull = slot.availableCapacity <= 0
        const isActive = selectedId === slot.id
        return (
          <View
            key={slot.id}
            className={`slot-picker__item ${isActive ? 'slot-picker__item--active' : ''} ${
              isFull ? 'slot-picker__item--full' : ''
            }`}
            onClick={() => {
              if (isFull) return
              onSelect(slot.id)
            }}
          >
            <Text className="slot-picker__time">{slot.startTime}-{slot.endTime}</Text>
            <Text className="slot-picker__capacity">{isFull ? '已满' : `余 ${slot.availableCapacity}`}</Text>
          </View>
        )
      })}
    </View>
  )
}
