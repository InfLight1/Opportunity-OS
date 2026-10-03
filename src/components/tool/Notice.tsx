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
    <div role="status" className="fixed right-6 bottom-6 z-40 flex w-[420px] max-w-[calc(100vw-48px)] items-start justify-between gap-4 rounded-xl border border-fog-3 bg-popover px-5 py-3">
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
