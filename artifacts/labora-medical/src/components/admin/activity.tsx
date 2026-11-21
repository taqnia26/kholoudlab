import { useQuery } from "@tanstack/react-query"
import { History } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { adminFetch, formatDate } from "@/lib/admin-api"
import { EmptyState, Loading, PageHeader, Panel, timeAgo } from "./ui"

type Audit = { id: number; adminId: string; action: string; entity: string; summary: string; createdAt: string }

export function Activity() {
  const { data = [], isLoading, error } = useQuery({
    queryKey: ["admin", "audit"],
    queryFn: () => adminFetch<Audit[]>("/admin/audit"),
  })
  return (
    <div className="adm-rise">
      <PageHeader title="سجل النشاط" subtitle="آخر 300 عملية تمت من اللوحة: من عدّل وماذا ومتى." />
      <Panel flush>
        {isLoading ? (
          <Loading rows={6} />
        ) : error ? (
          <div className="py-14 text-center text-destructive">تعذر تحميل السجل</div>
        ) : data.length === 0 ? (
          <EmptyState icon={History} title="لا يوجد نشاط مسجل" text="كل تعديل على المحتوى أو الحجوزات أو الصور يظهر هنا." />
        ) : (
          <div className="adm-scroll overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="w-48">الوقت</TableHead>
                  <TableHead className="w-32">المسؤول</TableHead>
                  <TableHead>العملية</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      <div className="font-semibold text-foreground">{timeAgo(entry.createdAt)}</div>
                      {formatDate(entry.createdAt)}
                    </TableCell>
                    <TableCell className="font-semibold">{entry.adminId}</TableCell>
                    <TableCell>{entry.summary}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Panel>
    </div>
  )
}
