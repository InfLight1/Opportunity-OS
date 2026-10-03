import { User } from 'lucide-react'
import { Button } from '@/components/ui/button'

const SECTIONS = [
  { href: '#tool', label: 'Plan' },
  { href: '#opportunities', label: 'Opportunities' },
  { href: '#weeks-section', label: 'Weeks' },
  { href: '#reuse-section', label: 'Reuse' },
  { href: '#add-section', label: 'Add your own' },
]

export interface HeaderProps {
  mode: 'story' | 'tool'
  onToggleMode: () => void
  onOpenProfile: () => void
}

export function Header({ mode, onToggleMode, onOpenProfile }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 h-14 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-full max-w-[1120px] items-center justify-between px-8">
        <div className="flex items-center gap-8">
          <span className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
            <span className="grid size-5 place-items-center rounded-[5px] bg-fog-1 text-[11px] font-bold text-ink" aria-hidden="true">O</span>
            Opportunity OS
          </span>
          <nav aria-label="Sections" className="flex items-center gap-1">
            {SECTIONS.map((s) => (
              <a key={s.href} href={s.href} className="rounded-md px-2.5 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                {s.label}
              </a>
            ))}
          </nav>
        </div>
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
