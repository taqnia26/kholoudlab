const TOKEN_KEY = "kholoud_admin_token"
const STAFF_TOKEN_KEY = "kholoud_staff_token"

export function getAdminToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setAdminSession(session: { sessionToken: string; staffToken: string }) {
  sessionStorage.setItem(TOKEN_KEY, session.sessionToken)
  // Lets the existing /staff/results page open already signed in.
  sessionStorage.setItem(STAFF_TOKEN_KEY, session.staffToken)
}

export function clearAdminSession() {
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(STAFF_TOKEN_KEY)
}

export class AdminApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

const base = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "")

export async function adminFetch<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getAdminToken()
  const headers = new Headers(init.headers)
  if (token) headers.set("Authorization", `Bearer ${token}`)
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json")
  const response = await fetch(`${base}/api${path}`, { ...init, headers })
  if (!response.ok) {
    if (response.status === 401 && path !== "/admin/session") {
      clearAdminSession()
      window.dispatchEvent(new Event("kholoud-admin-logout"))
    }
    let message = "حدث خطأ، حاول مرة أخرى"
    try {
      const data = await response.json()
      if (typeof data?.error === "string") message = data.error
    } catch {
      /* ignore */
    }
    throw new AdminApiError(message, response.status)
  }
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

export async function adminDownload(path: string, fallbackName: string) {
  const token = getAdminToken()
  const response = await fetch(`${base}/api${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
  if (!response.ok) throw new AdminApiError("تعذر تحميل الملف", response.status)
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = fallbackName
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}

export function formatDate(value: string | null | undefined, withTime = true): string {
  if (!value) return "—"
  return new Intl.DateTimeFormat(
    "ar-SA-u-ca-gregory-nu-latn",
    withTime
      ? { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Riyadh" }
      : { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Asia/Riyadh" },
  ).format(new Date(value))
}

export function whatsappLink(phone: string, text?: string): string {
  let digits = phone.replace(/\D/g, "")
  if (digits.startsWith("00")) digits = digits.slice(2)
  if (digits.startsWith("0")) digits = `966${digits.slice(1)}`
  else if (digits.length === 9 && digits.startsWith("5")) digits = `966${digits}`
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`
}

export function downloadCsv(filename: string, rows: Array<Array<string | number>>) {
  const escape = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`
  const csv = "﻿" + rows.map((row) => row.map(escape).join(",")).join("\r\n")
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }))
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}
