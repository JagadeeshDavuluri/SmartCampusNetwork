import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
    icon: LucideIcon
    title: string
    description?: string
    className?: string
}

export function EmptyState({ icon: Icon, title, description, className = '' }: EmptyStateProps) {
    return (
        <div className={`flex flex-col items-center justify-center py-12 text-center ${className}`}>
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                <Icon className="w-8 h-8 text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-1">{title}</h3>
            {description && (
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">{description}</p>
            )}
        </div>
    )
}
