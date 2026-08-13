import Taro, { useDidShow } from '@tarojs/taro'
import { Button, Input, Text, View } from '@tarojs/components'
import { useEffect, useState } from 'react'
import type { CsAddress } from '@/types'
import { addressStore } from '@/store/address'
import { userStore } from '@/store/user'
import { AppNavBar } from '@/components/ui/AppNavBar'
import { EmptyState } from '@/components/ui/EmptyState'
import { getErrorMessage } from '@/api/client'
import './index.scss'

const emptyForm = (isDefault = true): CsAddress => ({
  id: '',
  name: '',
  phone: '',
  region: '',
  detail: '',
  tag: '',
  isDefault
})

export default function AddressListPage() {
  const [loggedIn, setLoggedIn] = useState(userStore.isLoggedIn())
  const [addresses, setAddresses] = useState<CsAddress[]>(addressStore.getList())
  const [form, setForm] = useState<CsAddress>(emptyForm(addressStore.getList().length === 0))
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState('')

  useEffect(() => userStore.onLoginRequired(() => {
    setLoggedIn(false)
    setAddresses([])
    setForm(emptyForm(true))
    setEditing(false)
    setLoadError('')
  }), [])

  const reload = async () => {
    setLoadError('')
    try {
      const items = await addressStore.load()
      setAddresses([...items])
      if (!editing) {
        setForm((current) => ({ ...current, isDefault: items.length === 0 }))
      }
    } catch (error) {
      setLoadError(getErrorMessage(error, '地址加载失败，请稍后重试'))
    }
  }

  useDidShow(() => {
    const authed = userStore.isLoggedIn()
    setLoggedIn(authed)
    if (authed) {
      void reload()
    } else {
      setAddresses([])
      setLoadError('')
      setForm(emptyForm(true))
      setEditing(false)
    }
  })

  const updateForm = (key: keyof CsAddress, value: string | boolean) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const scrollToForm = () => {
    setTimeout(() => Taro.pageScrollTo({ selector: '#address-form', duration: 300 }), 0)
  }

  const resetForm = (nextAddresses = addressStore.getList()) => {
    setForm(emptyForm(nextAddresses.length === 0))
    setEditing(false)
  }

  const edit = (address: CsAddress) => {
    setForm({ ...address })
    setEditing(true)
    scrollToForm()
  }

  const submit = async () => {
    if (saving) return
    const normalized = {
      ...form,
      name: form.name.trim(),
      phone: form.phone.replace(/\s/g, ''),
      region: form.region.trim(),
      detail: form.detail.trim(),
      tag: form.tag.trim()
    }
    if (!normalized.name || !normalized.phone || !normalized.region || !normalized.detail) {
      Taro.showToast({ title: '请填写完整地址', icon: 'none' })
      return
    }
    if (!/^1\d{10}$/.test(normalized.phone)) {
      Taro.showToast({ title: '请输入正确的11位手机号', icon: 'none' })
      return
    }
    setSaving(true)
    try {
      await addressStore.save(normalized)
      const nextAddresses = [...addressStore.getList()]
      setAddresses(nextAddresses)
      setLoadError('')
      resetForm(nextAddresses)
      Taro.showToast({ title: '已保存', icon: 'success' })
    } catch (error) {
      Taro.showToast({ title: error instanceof Error ? error.message : '保存失败', icon: 'none' })
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: string) => {
    const result = await Taro.showModal({ title: '删除配送地址', content: '删除后将不再用于新订单，确定继续吗？' })
    if (!result.confirm) return
    try {
      await addressStore.remove(id)
      const nextAddresses = [...addressStore.getList()]
      setAddresses(nextAddresses)
      setLoadError('')
      if (form.id === id) resetForm(nextAddresses)
    } catch (error) {
      Taro.showToast({ title: error instanceof Error ? error.message : '删除失败', icon: 'none' })
    }
  }

  const setDefault = async (id: string) => {
    try {
      await addressStore.setDefault(id)
      setAddresses([...addressStore.getList()])
      setLoadError('')
    } catch (error) {
      Taro.showToast({ title: error instanceof Error ? error.message : '设置失败', icon: 'none' })
    }
  }

  const login = async () => {
    try {
      await userStore.login()
      setLoggedIn(true)
      await reload()
      Taro.showToast({ title: '登录成功', icon: 'success' })
    } catch (error) {
      Taro.showToast({ title: error instanceof Error ? error.message : '登录失败', icon: 'none' })
    }
  }

  if (!loggedIn) {
    return (
      <View className="cakeshop-page address-page">
        <AppNavBar title="配送地址" back />
        <EmptyState title="登录后管理地址" description="登录后可以保存常用配送地址" />
        <Button className="cs-login-btn" onClick={login}>微信一键登录</Button>
      </View>
    )
  }

  return (
    <View className="cakeshop-page address-page">
      <AppNavBar title="配送地址" back />
      {loadError ? (
        <View className="address-error">
          <Text>{loadError}</Text>
          <Button className="address-error__retry" onClick={() => void reload()}>重试</Button>
        </View>
      ) : null}
      {!addresses.length && !loadError ? (
        <EmptyState
          title="还没有配送地址"
          description="添加一个常用地址，预约配送更快"
          actionLabel="立即添加"
          onAction={scrollToForm}
        />
      ) : null}
      {addresses.map((item) => (
        <View key={item.id} className="address-card">
          <View className="address-card__head">
            <View className="address-card__who">
              <Text className="address-card__name cs-serif">{item.name}</Text>
              <Text className="address-card__phone">{item.phone}</Text>
            </View>
            <Button className="address-card__edit" onClick={() => edit(item)}>编辑</Button>
          </View>
          <View className="address-card__tags">
            {item.isDefault ? <Text className="address-card__tag address-card__tag--default">默认</Text> : null}
            {item.tag ? <Text className="address-card__tag">{item.tag}</Text> : null}
          </View>
          <Text className="address-card__detail">{item.region} {item.detail}</Text>
          <View className="address-card__actions">
            {!item.isDefault ? <Button onClick={() => setDefault(item.id)}>设为默认</Button> : null}
            <Button onClick={() => remove(item.id)}>删除</Button>
          </View>
        </View>
      ))}

      <View id="address-form" className="address-form">
        <Text className="address-form__title cs-serif">{editing ? '编辑地址' : '新增地址'}</Text>
        <Input className="address-form__input" placeholder="收货人" value={form.name} onInput={(event) => updateForm('name', String(event.detail.value || ''))} />
        <Input className="address-form__input" type="number" maxlength={11} placeholder="手机号" value={form.phone} onInput={(event) => updateForm('phone', String(event.detail.value || ''))} />
        <Input className="address-form__input" placeholder="配送区域，例如 陕西省 西安市 雁塔区" value={form.region} onInput={(event) => updateForm('region', String(event.detail.value || ''))} />
        <Input className="address-form__input" placeholder="详细地址，例如 甜蜜路18号2单元" value={form.detail} onInput={(event) => updateForm('detail', String(event.detail.value || ''))} />
        <Input className="address-form__input" placeholder="标签，例如 家 / 公司" value={form.tag} onInput={(event) => updateForm('tag', String(event.detail.value || ''))} />
        <Button className="address-form__default" onClick={() => updateForm('isDefault', !form.isDefault)}>
          <Text className={form.isDefault ? 'address-check address-check--active' : 'address-check'} />
          <Text>设为默认地址</Text>
        </Button>
        <View className="address-form__buttons">
          {editing ? <Button className="address-cancel" disabled={saving} onClick={() => resetForm(addresses)}>取消</Button> : null}
          <Button className="address-submit" disabled={saving} onClick={submit}>{saving ? '保存中…' : '保存地址'}</Button>
        </View>
      </View>
    </View>
  )
}
