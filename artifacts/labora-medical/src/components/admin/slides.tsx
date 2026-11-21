import { ImageManager } from "./image-manager"

const STATIC_COUNT = 17

export function Slides() {
  return (
    <ImageManager
      config={{
        title: "سلايدر العروض",
        subtitle: "الصور الظاهرة في السلايدر أعلى الصفحة الرئيسية. يفضّل صور طولية 9:16 (1080×1920). تُصغَّر تلقائياً قبل الرفع، ويمكنك جدولة بداية ونهاية كل عرض.",
        listPath: "/admin/slides",
        basePath: "/admin/slides",
        queryKey: "slides",
        publicQueryKeys: [["public-slides"]],
        aspect: "9/16",
        maxWidth: 1080,
        schedule: true,
        importLabel: `استيراد العروض الحالية (${STATIC_COUNT})`,
        importItems: Array.from({ length: STATIC_COUNT }, (_, i) => ({
          path: `assets/white-friday/kholoud-white-friday-${String(i + 1).padStart(2, "0")}.webp`,
          title: `عرض ${i + 1}`,
        })),
        emptyHint: "الموقع يعرض الآن العروض الثابتة. بمجرد إضافة أي عرض هنا يعتمد الموقع على عروض اللوحة فقط. اضغط «استيراد العروض الحالية» لتبدأ منها.",
      }}
    />
  )
}
