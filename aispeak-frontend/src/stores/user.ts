import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { AccountInfo } from '@/models/models'

export const useUserStore = defineStore('user', () => {
  const userInfo = ref<AccountInfo | null>(null)
  const userRole = ref<string>('')
  const isLoggedIn = ref(false)

  function setUserInfo(info: AccountInfo) {
    userInfo.value = info
    userRole.value = info.user_role || ''
    isLoggedIn.value = true
  }

  function updateUserRole(role: string) {
    userRole.value = role
    if (userInfo.value) {
      userInfo.value.user_role = role
    }
  }

  function updateUserName(name: string) {
    if (userInfo.value) {
      userInfo.value.user_name = name
    }
  }

  function clearUser() {
    userInfo.value = null
    userRole.value = ''
    isLoggedIn.value = false
  }

  return {
    userInfo,
    userRole,
    isLoggedIn,
    setUserInfo,
    updateUserRole,
    updateUserName,
    clearUser
  }
})