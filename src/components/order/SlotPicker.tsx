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
      {slots.map((slot) => (
        <View
          key={slot.id}
          className={`slot-picker__item ${selectedId === slot.id ? 'slot-picker__item--active' : ''}`}
          onClick={() => onSelect(slot.id)}
        >
          <Text className="slot-picker__time">{slot.startTime}-{slot.endTime}</Text>
          <Text className="slot-picker__capacity">余 {slot.availableCapacity}</Text>
        </View>
      ))}
    </View>
  )
}
