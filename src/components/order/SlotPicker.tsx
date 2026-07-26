import { ScrollView, Text, View } from '@tarojs/components'
import { useEffect, useMemo, useState } from 'react'
import type { FulfillmentType, CsFulfillmentSlot } from '@/types'
import { csApi } from '@/api/cakeshop'
import { demoSlots } from '@/store/demo'
import './SlotPicker.scss'

interface Props {
  fulfillmentType: FulfillmentType
  storeId?: string
  minLeadHours?: number
  selectedId?: string
  onSelect: (slotId: string) => void
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']
const DAY_COUNT = 7

const pad = (value: number) => String(value).padStart(2, '0')
const toDateKey = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

interface SlotDate {
  key: string
  label: string
  sub: string
}

const buildDateList = (): SlotDate[] => {
  const today = new Date()
  return Array.from({ length: DAY_COUNT }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + index)
    let label = `周${WEEKDAYS[date.getDay()]}`
    if (index === 0) label = '今天'
    else if (index === 1) label = '明天'
    else if (index === 2) label = '后天'
    return { key: toDateKey(date), label, sub: `${date.getMonth() + 1}/${date.getDate()}` }
  })
}

export function SlotPicker({ fulfillmentType, storeId, minLeadHours, selectedId, onSelect }: Props) {
  const dateList = useMemo(buildDateList, [])
  const [activeDate, setActiveDate] = useState(dateList[0].key)
  const [slots, setSlots] = useState<CsFulfillmentSlot[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    csApi.slots({ date: activeDate, fulfillmentType, storeId, minLeadHours })
      .then((items) => {
        if (active) setSlots(items)
      })
      .catch(() => {
        if (!active) return
        setSlots(demoSlots.filter((item) => (
          item.date === activeDate &&
          item.fulfillmentType === fulfillmentType &&
          (!storeId || item.storeId === storeId)
        )))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [activeDate, fulfillmentType, storeId, minLeadHours])

  return (
    <View className="slot-picker">
      <ScrollView className="slot-picker__dates" scrollX scrollWithAnimation showScrollbar={false}>
        {dateList.map((item) => (
          <View
            key={item.key}
            className={`slot-picker__date ${activeDate === item.key ? 'slot-picker__date--active' : ''}`}
            onClick={() => setActiveDate(item.key)}
          >
            <Text className="slot-picker__date-label">{item.label}</Text>
            <Text className="slot-picker__date-sub">{item.sub}</Text>
          </View>
        ))}
      </ScrollView>
      <View className="slot-picker__grid">
        {loading ? (
          <Text className="slot-picker__empty">加载中…</Text>
        ) : slots.length ? slots.map((slot) => {
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
              <Text className="slot-picker__capacity">{isFull ? '已满' : `余${slot.availableCapacity}`}</Text>
            </View>
          )
        }) : (
          <Text className="slot-picker__empty">该日期暂无可约时段</Text>
        )}
      </View>
    </View>
  )
}
