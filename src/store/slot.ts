import type { FulfillmentType, CsFulfillmentSlot, CsStore } from '@/types'
import { csApi } from '@/api/cakeshop'
import { demoSlots, demoStores } from './demo'

let stores: CsStore[] = demoStores
let slots: CsFulfillmentSlot[] = demoSlots

export const slotStore = {
  getStores: () => stores,
  getSlots: () => slots,
  async loadStores() {
    try {
      stores = await csApi.stores()
    } catch (_error) {
      stores = demoStores
    }
    return stores
  },
  async loadSlots(params: { date?: string; fulfillmentType?: FulfillmentType; storeId?: string } = {}) {
    try {
      slots = await csApi.slots(params)
    } catch (_error) {
      slots = demoSlots.filter((item) => {
        const matchesType = !params.fulfillmentType || item.fulfillmentType === params.fulfillmentType
        const matchesStore = !params.storeId || item.storeId === params.storeId
        return matchesType && matchesStore
      })
    }
    return slots
  },
  findSlot(id?: string) {
    return slots.find((item) => item.id === id)
  }
}
