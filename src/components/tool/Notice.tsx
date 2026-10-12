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
    <div role="status" className="notice">
      <div>
        <p>{message}</p>
        {items.length > 0 && (
          <ul>
            {items.map((i) => <li key={i}>{i}</li>)}
          </ul>
        )}
      </div>
      <Button variant="outline" size="icon-sm" aria-label="Dismiss notice" onClick={onDismiss}><X /></Button>
    </div>
  )
}
