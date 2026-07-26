import Taro, { useDidShow } from '@tarojs/taro'
import { Button, Input, Text, View } from '@tarojs/components'
import { useState } from 'react'
import type { CsAddress } from '@/types'
import { addressStore } from '@/store/address'
import { userStore } from '@/store/user'
import { AppNavBar } from '@/components/ui/AppNavBar'
import { EmptyState } from '@/components/ui/EmptyState'
import './index.scss'

const emptyForm = (): CsAddress => ({
  id: '',
  name: '',
  phone: '',
  region: '',
  detail: '',
  tag: '',
  isDefault: true
})

export default function AddressListPage() {
  const [addresses, setAddresses] = useState<CsAddress[]>(addressStore.getList())
  const [form, setForm] = useState<CsAddress>(emptyForm())
  const [editing, setEditing] = useState(false)

  const reload = () => addressStore.load().then((items) => setAddresses([...items]))

  useDidShow(() => {
    if (userStore.requireLogin('登录后可管理配送地址')) reload()
  })

  const updateForm = (key: keyof CsAddress, value: string | boolean) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const edit = (address: CsAddress) => {
    setForm({ ...address })
    setEditing(true)
  }

  const submit = async () => {
    if (!form.name || !form.phone || !form.region || !form.detail) {
      Taro.showToast({ title: '请填写完整地址', icon: 'none' })
      return
    }
    try {
      await addressStore.save(form)
      setForm(emptyForm())
      setEditing(false)
      setAddresses([...addressStore.getList()])
      Taro.showToast({ title: '已保存', icon: 'success' })
    } catch (error) {
      Taro.showToast({ title: error instanceof Error ? error.message : '保存失败', icon: 'none' })
    }
  }

  const remove = async (id: string) => {
    try {
      await addressStore.remove(id)
      setAddresses([...addressStore.getList()])
    } catch (error) {
      Taro.showToast({ title: error instanceof Error ? error.message : '删除失败', icon: 'none' })
    }
  }

  const setDefault = async (id: string) => {
    try {
      await addressStore.setDefault(id)
      setAddresses([...addressStore.getList()])
    } catch (error) {
      Taro.showToast({ title: error instanceof Error ? error.message : '设置失败', icon: 'none' })
    }
  }

  return (
    <View className="cakeshop-page address-page">
      <AppNavBar title="配送地址" back />
      {!addresses.length ? <EmptyState title="还没有配送地址" description="添加一个常用地址，预约配送更快" /> : null}
      {addresses.map((item) => (
        <View key={item.id} className="address-card">
          <View className="address-card__head">
            <View className="address-card__who">
              <Text className="address-card__name cs-serif">{item.name}</Text>
              <Text className="address-card__phone">{item.phone}</Text>
            </View>
            <Text className="address-card__edit" onClick={() => edit(item)}>编辑</Text>
          </View>
          <View className="address-card__tags">
            {item.isDefault ? <Text className="address-card__tag address-card__tag--default">默认</Text> : null}
            {item.tag ? <Text className="address-card__tag">{item.tag}</Text> : null}
          </View>
          <Text className="address-card__detail">{item.region} {item.detail}</Text>
          <View className="address-card__actions">
            {!item.isDefault ? <Text onClick={() => setDefault(item.id)}>设为默认</Text> : null}
            <Text onClick={() => remove(item.id)}>删除</Text>
          </View>
        </View>
      ))}

      <View className="address-form">
        <Text className="address-form__title cs-serif">{editing ? '编辑地址' : '新增地址'}</Text>
        <Input className="address-form__input" placeholder="收货人" value={form.name} onInput={(event) => updateForm('name', String(event.detail.value || ''))} />
        <Input className="address-form__input" placeholder="手机号" value={form.phone} onInput={(event) => updateForm('phone', String(event.detail.value || ''))} />
        <Input className="address-form__input" placeholder="配送区域，例如 陕西省 西安市 雁塔区" value={form.region} onInput={(event) => updateForm('region', String(event.detail.value || ''))} />
        <Input className="address-form__input" placeholder="详细地址，例如 甜蜜路18号2单元" value={form.detail} onInput={(event) => updateForm('detail', String(event.detail.value || ''))} />
        <Input className="address-form__input" placeholder="标签，例如 家 / 公司" value={form.tag} onInput={(event) => updateForm('tag', String(event.detail.value || ''))} />
        <View className="address-form__default" onClick={() => updateForm('isDefault', !form.isDefault)}>
          <Text className={form.isDefault ? 'address-check address-check--active' : 'address-check'} />
          <Text>设为默认地址</Text>
        </View>
        <View className="address-form__buttons">
          {editing ? <Button className="address-cancel" onClick={() => { setForm(emptyForm()); setEditing(false) }}>取消</Button> : null}
          <Button className="address-submit" onClick={submit}>保存地址</Button>
        </View>
      </View>
    </View>
  )
}
