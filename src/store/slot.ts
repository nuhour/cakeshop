import type { CsStore } from '@/types'
import { csApi } from '@/api/cakeshop'

let stores: CsStore[] = []

export const slotStore = {
  getStores: () => stores,
  async loadStores() {
    try {
      stores = await csApi.stores()
    } catch (_error) {}
    return stores
  }
}
