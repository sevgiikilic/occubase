const SESSION_KEY = 'occubase_session'
const DEFAULT_PASSWORD = 'occubase2024'

export function login(email, password) {
  if (!email || !password) return { ok: false, error: 'E-posta ve şifre zorunludur.' }
  const saved = getSavedPassword()
  if (password !== saved) return { ok: false, error: 'E-posta veya şifre hatalı.' }
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ email, loggedIn: true }))
  return { ok: true }
}

export function logout() {
  sessionStorage.removeItem(SESSION_KEY)
}

export function getSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function isLoggedIn() {
  return !!getSession()?.loggedIn
}

export function changePassword(current, next) {
  const saved = getSavedPassword()
  if (current !== saved) return { ok: false, error: 'Mevcut şifre hatalı.' }
  if (next.length < 6) return { ok: false, error: 'Yeni şifre en az 6 karakter olmalı.' }
  localStorage.setItem('occubase_pw', next)
  return { ok: true }
}

function getSavedPassword() {
  return localStorage.getItem('occubase_pw') || DEFAULT_PASSWORD
}
