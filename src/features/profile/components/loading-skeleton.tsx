import {
  Card,
  CardContent,
  CardHeader,
} from '#/shared/components/ui/card'
import { Skeleton } from '#/shared/components/ui/skeleton'

export function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card
          key={i}
          className="rounded-4xl border border-border/10 shadow-xl overflow-hidden"
        >
          <CardHeader className="border-b dark:border-white/5 border-black/5 bg-muted/10 px-6 py-5">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3 w-72 mt-2" />
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {Array.from({ length: 3 }).map((__, j) => (
              <Skeleton key={j} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
