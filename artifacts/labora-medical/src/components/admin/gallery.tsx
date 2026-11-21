import { useState } from "react"
import { Segmented } from "./ui"
import { ImageManager } from "./image-manager"

const OFFER_COUNT = 45

export function Gallery() {
  const [kind, setKind] = useState<"gallery" | "package">("gallery")
  return (
    <div>
      <div className="mb-5">
        <Segmented<"gallery" | "package">
          label="نوع الصور"
          value={kind}
          onChange={setKind}
          options={[
            { value: "gallery", label: "معرض العروض (من عروضنا)" },
            { value: "package", label: "بنرات الباقات" },
          ]}
        />
      </div>
      {kind === "gallery" ? (
        <ImageManager
          key="gallery"
          config={{
            title: "معرض العروض",
            subtitle: "شبكة العروض في قسم «من عروضنا». الصور الطولية 9:16 تظهر بأفضل شكل. عند الاستيراد تُفعَّل أول 8 صور (كما في الموقع الحالي) وتبقى الباقي مخفية لتفعّلها متى شئت.",
            listPath: "/admin/gallery?kind=gallery",
            basePath: "/admin/gallery",
            extraBody: { kind: "gallery" },
            queryKey: "gallery-gallery",
            publicQueryKeys: [["public-gallery", "gallery"]],
            aspect: "9/16",
            maxWidth: 900,
            importLabel: `استيراد عروض المعرض الحالية (${OFFER_COUNT})`,
            importItems: Array.from({ length: OFFER_COUNT }, (_, i) => ({
              path: `assets/kholoud-offer-${String(i + 1).padStart(2, "0")}.jpg`,
              title: `عرض ${i + 1}`,
              active: i < 8,
            })),
            emptyHint: "الموقع يعرض الآن أول 8 عروض ثابتة. أضف صورك هنا لتحل محلها.",
          }}
        />
      ) : (
        <ImageManager
          key="package"
          config={{
            title: "بنرات الباقات",
            subtitle: "البنرات العريضة في قسم «باقات مصممة لاحتياجاتك». اكتب في «وصف» جملة تظهر تحت العنوان مثل «يبدأ من 140 ريال».",
            listPath: "/admin/gallery?kind=package",
            basePath: "/admin/gallery",
            extraBody: { kind: "package" },
            queryKey: "gallery-package",
            publicQueryKeys: [["public-gallery", "package"]],
            aspect: "16/9",
            maxWidth: 1400,
            caption: true,
            importLabel: "استيراد البنرين الحاليين",
            importItems: [
              { path: "assets/kholoud-packages-1.png", title: "عروض الفحص الشامل" },
              { path: "assets/kholoud-packages-2.png", title: "عروض الفحوصات التخصصية" },
            ],
            emptyHint: "الموقع يعرض الآن بنرين ثابتين. استورد الحاليين أو ارفع بنراتك.",
          }}
        />
      )}
    </div>
  )
}
