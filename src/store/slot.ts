import type { CsStore } from '@/types'
import { csApi } from '@/api/cakeshop'

let stores: CsStore[] = []

export const slotStore = {
  getStores: () => stores,
  async loadStores() {
    stores = await csApi.stores()
    return stores
  }
}
