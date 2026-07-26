import type { CsStore } from '@/types'
import { csApi } from '@/api/cakeshop'
import { demoStores } from './demo'

let stores: CsStore[] = demoStores

export const slotStore = {
  getStores: () => stores,
  async loadStores() {
    try {
      stores = await csApi.stores()
    } catch (_error) {
      stores = demoStores
    }
    return stores
  }
}
