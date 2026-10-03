import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface NoticeProps {
  kind: 'uncommitted' | 'error'
  message: string
  items: string[]
  onDismiss: () => void
}

export function Notice({ message, items, onDismiss }: NoticeProps) {
  return (
    <div role="status" className="flex items-start justify-between gap-4 rounded-xl border border-border bg-popover px-5 py-3">
      <div className="text-[15px]">
        <p>{message}</p>
        {items.length > 0 && (
          <ul className="mt-1 space-y-0.5 text-muted-foreground">
            {items.map((i) => <li key={i}>{i}</li>)}
          </ul>
        )}
      </div>
      <Button variant="ghost" size="icon-sm" aria-label="Dismiss notice" onClick={onDismiss}><X /></Button>
    </div>
  )
}
