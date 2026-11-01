import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export function SkeletonDashboard() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
            {/* Header skeleton */}
            <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b sticky top-0 z-50">
                <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Skeleton className="w-10 h-10 rounded-xl" />
                        <div>
                            <Skeleton className="h-5 w-32 mb-1" />
                            <Skeleton className="h-3 w-24" />
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded-lg" />
                        <Skeleton className="h-8 w-20 rounded-lg" />
                        <Skeleton className="h-8 w-24 rounded-lg" />
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-6">
                {/* Tab skeleton */}
                <div className="flex gap-2 mb-6">
                    {Array.from({ length: 7 }).map((_, i) => (
                        <Skeleton key={i} className="h-9 w-24 rounded-lg" />
                    ))}
                </div>

                {/* Stat cards skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i}>
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-8 w-8 rounded-lg" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-8 w-16 mb-2" />
                                <Skeleton className="h-3 w-32" />
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Chart + table skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-5 w-40 mb-1" />
                            <Skeleton className="h-3 w-52" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-64 w-full rounded-lg" />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-5 w-36 mb-1" />
                            <Skeleton className="h-3 w-48" />
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <Skeleton className="w-8 h-8 rounded-full" />
                                    <div className="flex-1">
                                        <Skeleton className="h-4 w-32 mb-1" />
                                        <Skeleton className="h-3 w-48" />
                                    </div>
                                    <Skeleton className="h-5 w-16 rounded-full" />
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    )
}
