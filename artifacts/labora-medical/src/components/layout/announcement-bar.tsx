import { useState } from "react"
import { X } from "lucide-react"
import { useSiteContent } from "@/lib/site-content"

export function AnnouncementBar() {
  const { announcement } = useSiteContent()
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem("kholoud_announcement_dismissed") === announcement.text
    } catch {
      return false
    }
  })

  if (!announcement.enabled || !announcement.text.trim() || dismissed) return null

  return (
    <div className="relative z-[60] bg-primary px-10 py-2 text-center text-sm font-medium text-primary-foreground" role="status">
      <span>{announcement.text}</span>
      {announcement.linkUrl && announcement.linkLabel && (
        <a href={announcement.linkUrl} className="mr-3 font-bold underline underline-offset-4 hover:opacity-90">
          {announcement.linkLabel}
        </a>
      )}
      <button
        type="button"
        aria-label="إغلاق الإعلان"
        onClick={() => {
          try {
            sessionStorage.setItem("kholoud_announcement_dismissed", announcement.text)
          } catch {
            /* ignore */
          }
          setDismissed(true)
        }}
        className="absolute left-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full hover:bg-white/15"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
