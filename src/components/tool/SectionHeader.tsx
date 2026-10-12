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
    <div className="sec-head">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2 id={id}>{title}</h2>
        {description && <p className="lead">{description}</p>}
      </div>
      {aside}
    </div>
  )
}
