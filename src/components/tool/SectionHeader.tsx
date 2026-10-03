import type { ReactNode } from 'react'

export interface SectionHeaderProps {
  id: string
  eyebrow: string
  title: string
  description?: ReactNode
  aside?: ReactNode
}

export function SectionHeader({ id, eyebrow, title, description, aside }: SectionHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
      <div>
        <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-muted-foreground">{eyebrow}</p>
        <h2 id={id} className="mt-1 text-[28px] font-semibold leading-[1.2] tracking-[-0.01em]">{title}</h2>
        {description && <p className="mt-1.5 max-w-[68ch] text-[15px] text-muted-foreground">{description}</p>}
      </div>
      {aside}
    </div>
  )
}
