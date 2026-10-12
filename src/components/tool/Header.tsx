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
  const links = SECTIONS.map((s) => <li key={s.href}><a href={s.href}>{s.label}</a></li>)
  return (
    <header className="nav">
      <div className="wrap nav-in">
        <span className="brand"><span className="brand-mark" aria-hidden="true" />Opportunity OS</span>
        <nav aria-label="Sections" className="contents"><ul className="links">{links}</ul></nav>
        <nav className="nav-right" aria-label="Main">
          <a
            className="textlink"
            href={mode === 'story' ? '?mode=tool' : '?'}
            onClick={(e) => { e.preventDefault(); onToggleMode() }}
          >
            {mode === 'story' ? 'Skip intro' : 'Story'}
          </a>
          <Button variant="outline" size="sm" onClick={onOpenProfile}>
            <User aria-hidden="true" />
            Profile
          </Button>
        </nav>
      </div>
      <nav aria-label="Sections (compact)"><ul className="links-m">{links}</ul></nav>
    </header>
  )
}
