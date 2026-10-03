import { User } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface HeaderProps {
  mode: 'story' | 'tool'
  onToggleMode: () => void
  onOpenProfile: () => void
}

export function Header({ mode, onToggleMode, onOpenProfile }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 h-14 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-full max-w-[1120px] items-center justify-between px-8">
        <span className="text-[15px] font-semibold tracking-tight">Opportunity OS</span>
        <nav className="flex items-center gap-2" aria-label="Main">
          <a
            href={mode === 'story' ? '?mode=tool' : '?'}
            onClick={(e) => { e.preventDefault(); onToggleMode() }}
            className="rounded-md px-2.5 py-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
          >
            {mode === 'story' ? 'Skip intro' : 'Story'}
          </a>
          <Button variant="outline" size="sm" onClick={onOpenProfile}>
            <User aria-hidden="true" />
            Profile
          </Button>
        </nav>
      </div>
    </header>
  )
}
