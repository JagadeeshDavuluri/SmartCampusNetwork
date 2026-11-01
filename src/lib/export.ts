export function exportToCSV(
    data: Record<string, unknown>[],
    columns: { key: string; label: string }[],
    filename: string
) {
    if (!data.length) return

    // Build CSV header
    const header = columns.map((c) => `"${c.label}"`).join(',')

    // Build CSV rows
    const rows = data.map((row) =>
        columns
            .map((c) => {
                const value = row[c.key]
                if (value === null || value === undefined) return '""'
                const str = String(value).replace(/"/g, '""')
                return `"${str}"`
            })
            .join(',')
    )

    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}

export function printReport() {
    window.print()
}
