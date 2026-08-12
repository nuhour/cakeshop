import Taro from '@tarojs/taro'
import type { CsAddress } from '@/types'
import { csApi } from '@/api/cakeshop'
import { userStore } from './user'

const KEY = 'cakeshop_addresses'
export const ADDRESS_UPDATED_EVENT = 'cakeshop:address-updated'

let addresses: CsAddress[] = Taro.getStorageSync(KEY) || []

const persist = () => Taro.setStorageSync(KEY, addresses)
const notifyUpdated = () => Taro.eventCenter.trigger(ADDRESS_UPDATED_EVENT, [...addresses])

const replace = (next: CsAddress[]) => {
  addresses = next.map((item) => ({ ...item }))
  persist()
  notifyUpdated()
}

export const addressStore = {
  getList: () => addresses,
  getDefault: () => addresses.find((item) => item.isDefault) || addresses[0],
  find: (id?: string) => addresses.find((item) => item.id === id),
  async load() {
    if (!userStore.isLoggedIn()) return addresses
    replace(await csApi.addresses())
    return addresses
  },
  async save(address: CsAddress) {
    const saved = await csApi.saveAddress(address)
    const next = addresses.some((item) => item.id === saved.id)
      ? addresses.map((item) => item.id === saved.id ? saved : item)
      : [saved, ...addresses]
    replace(saved.isDefault ? next.map((item) => ({ ...item, isDefault: item.id === saved.id })) : next)
    return saved
  },
  async setDefault(id: string) {
    const saved = await csApi.setDefaultAddress(id)
    replace(addresses.map((item) => ({ ...item, isDefault: item.id === saved.id })))
    return saved
  },
  async remove(id: string) {
    await csApi.deleteAddress(id)
    const removed = addresses.find((item) => item.id === id)
    const next = addresses.filter((item) => item.id !== id)
    replace(removed?.isDefault && next.length
      ? next.map((item, index) => ({ ...item, isDefault: index === 0 }))
      : next)
    return addresses
  }
}
