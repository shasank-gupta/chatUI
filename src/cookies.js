const USER_EMAIL_COOKIE = 'userEmail'
const USER_NAME_COOKIE = 'userName'
const MAX_AGE_DAYS = 30

function setCookie(name, value) {
  const maxAge = MAX_AGE_DAYS * 24 * 60 * 60
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`
}

function getCookie(name) {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

export function saveUserSession(email, name) {
  setCookie(USER_EMAIL_COOKIE, email)
  setCookie(USER_NAME_COOKIE, name)
}

export function getUserEmail() {
  return getCookie(USER_EMAIL_COOKIE)
}

export function getUserName() {
  return getCookie(USER_NAME_COOKIE)
}

export function clearUserSession() {
  document.cookie = `${USER_EMAIL_COOKIE}=; path=/; max-age=0`
  document.cookie = `${USER_NAME_COOKIE}=; path=/; max-age=0`
}
