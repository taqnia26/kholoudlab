import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"
import { adminFetch } from "@/lib/admin-api"
import { DEFAULT_CONTENT, mergeBlock, type SiteContent } from "@/lib/site-content"

type Saved = Record<string, { value: unknown; updatedAt: string; updatedBy: string }>

/** Draft state for one editable content block, with dirty tracking, save and restore-to-default. */
export function useContentBlock<K extends keyof SiteContent>(key: K) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "content"],
    queryFn: () => adminFetch<Saved>("/admin/content"),
  })

  const saved = useMemo(
    () => mergeBlock(DEFAULT_CONTENT[key], data?.[key]?.value) as SiteContent[K],
    [data, key],
  )
  const [draft, setDraft] = useState<SiteContent[K]>(saved)
  const savedJson = JSON.stringify(saved)
  useEffect(() => {
    setDraft(saved)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedJson])

  const dirty = JSON.stringify(draft) !== savedJson

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "content"] })
    queryClient.invalidateQueries({ queryKey: ["site-content"] })
    queryClient.invalidateQueries({ queryKey: ["admin", "audit"] })
  }

  const save = useMutation({
    mutationFn: () => adminFetch(`/admin/content/${key}`, { method: "PUT", body: JSON.stringify({ value: draft }) }),
    onSuccess: () => {
      toast({ title: "تم الحفظ", description: "التعديل ظاهر الآن في الموقع" })
      refresh()
    },
    onError: (err: Error) => toast({ title: "تعذر الحفظ", description: err.message, variant: "destructive" }),
  })

  const restore = useMutation({
    mutationFn: () => adminFetch(`/admin/content/${key}`, { method: "DELETE" }),
    onSuccess: () => {
      toast({ title: "تم استرجاع النص الأصلي" })
      refresh()
    },
    onError: (err: Error) => toast({ title: "تعذر الاسترجاع", description: err.message, variant: "destructive" }),
  })

  return {
    draft,
    setDraft,
    dirty,
    isLoading,
    saving: save.isPending || restore.isPending,
    save: () => save.mutate(),
    reset: () => setDraft(saved),
    restoreDefaults: () => restore.mutate(),
  }
}
