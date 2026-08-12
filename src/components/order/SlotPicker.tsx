import { Button, Text, View } from '@tarojs/components'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { FulfillmentType, CsFulfillmentSlot } from '@/types'
import { csApi } from '@/api/cakeshop'
import { getErrorMessage } from '@/api/client'
import './SlotPicker.scss'

interface Props {
  fulfillmentType: FulfillmentType
  storeId?: string
  minLeadHours?: number
  selectedId?: string
  onSelect: (slotId: string) => void
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

const pad = (value: number) => String(value).padStart(2, '0')
const toDateKey = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

interface SlotDate {
  key: string
  label: string
  sub: string
}

const buildDateList = (minLeadHours?: number): SlotDate[] => {
  const dayCount = Math.max(7, Math.ceil((minLeadHours || 0) / 24) + 1)
  const today = new Date()
  return Array.from({ length: dayCount }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + index)
    let label = `周${WEEKDAYS[date.getDay()]}`
    if (index === 0) label = '今天'
    else if (index === 1) label = '明天'
    else if (index === 2) label = '后天'
    return { key: toDateKey(date), label, sub: `${date.getMonth() + 1}/${date.getDate()}` }
  })
}

export function SlotPicker({ fulfillmentType, storeId, minLeadHours, selectedId, onSelect }: Props) {
  const dateList = useMemo(() => buildDateList(minLeadHours), [minLeadHours])
  const [activeDate, setActiveDate] = useState(dateList[0].key)
  const [slots, setSlots] = useState<CsFulfillmentSlot[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [retryKey, setRetryKey] = useState(0)
  const autoResolved = useRef(false)
  const criteriaKey = `${fulfillmentType}:${storeId || ''}:${minLeadHours || 0}`
  const previousCriteria = useRef(criteriaKey)

  useEffect(() => {
    if (previousCriteria.current === criteriaKey) return
    previousCriteria.current = criteriaKey
    autoResolved.current = false
    onSelect('')
    // 只有配送方式、门店或提前时长变化时重置自动定位，手动切换日期不回跳。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [criteriaKey])

  useEffect(() => {
    if (dateList.some((item) => item.key === activeDate)) return
    setActiveDate(dateList[0].key)
    onSelect('')
    // onSelect 由父组件内联提供，不纳入依赖以免仅因函数引用变化重置日期。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDate, dateList])

  useEffect(() => {
    let active = true
    setLoading(true)
    setLoadError('')
    setSlots([])
    csApi.slots({ date: activeDate, fulfillmentType, storeId, minLeadHours })
      .then((items) => {
        if (!active) return
        if (!items.length && !autoResolved.current) {
          autoResolved.current = true
          return csApi.slots({ fulfillmentType, storeId, minLeadHours }).then((allItems) => {
            if (!active) return
            const selectedSlot = selectedId ? allItems.find((item) => item.id === selectedId && item.availableCapacity > 0) : undefined
            const firstAvailable = selectedSlot || allItems.find((item) => item.availableCapacity > 0)
            if (firstAvailable && dateList.some((item) => item.key === firstAvailable.date) && firstAvailable.date !== activeDate) {
              setActiveDate(firstAvailable.date)
              onSelect(firstAvailable.id)
              return
            }
            setSlots([])
          })
        }
        setSlots(items)
        if (selectedId && !items.some((item) => item.id === selectedId)) onSelect('')
      })
      .catch((error) => {
        if (!active) return
        setSlots([])
        setLoadError(getErrorMessage(error, '时段加载失败，请稍后重试'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
    // selectedId/onSelect 只用于校验响应，不触发网络重载。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDate, fulfillmentType, storeId, minLeadHours, retryKey])

  return (
    <View className="slot-picker">
      <View className="slot-picker__dates">
        {dateList.map((item) => (
          <Button
            key={item.key}
            className={`slot-picker__date ${activeDate === item.key ? 'slot-picker__date--active' : ''}`}
            onClick={() => {
              if (activeDate === item.key) return
              onSelect('')
              setActiveDate(item.key)
            }}
          >
            <Text className="slot-picker__date-label">{item.label}</Text>
            <Text className="slot-picker__date-sub">{item.sub}</Text>
          </Button>
        ))}
      </View>
      <View className="slot-picker__grid">
        {loading ? (
          <Text className="slot-picker__empty">加载中…</Text>
        ) : loadError ? (
          <Button className="slot-picker__empty slot-picker__empty--error" onClick={() => setRetryKey((value) => value + 1)}>
            {loadError} · 点此重试
          </Button>
        ) : slots.length ? slots.map((slot) => {
          const isFull = slot.availableCapacity <= 0
          const isActive = selectedId === slot.id
          return (
            <Button
              key={slot.id}
              className={`slot-picker__item ${isActive ? 'slot-picker__item--active' : ''} ${
                isFull ? 'slot-picker__item--full' : ''
              }`}
              disabled={isFull}
              onClick={() => {
                if (isFull) return
                onSelect(slot.id)
              }}
            >
              <Text className="slot-picker__time">{slot.startTime}-{slot.endTime}</Text>
              <Text className="slot-picker__capacity">{isFull ? '已满' : `余${slot.availableCapacity}`}</Text>
            </Button>
          )
        }) : (
          <Text className="slot-picker__empty">该日期暂无可约时段</Text>
        )}
      </View>
    </View>
  )
}
