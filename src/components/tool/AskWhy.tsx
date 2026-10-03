import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Seam (DESIGN-BRIEF s6): template text renders first; an LLM rewrite that
// passed its check may swap in later via llmText + status 'ready'.
export interface AskWhyProps {
  opportunityId: string
  title: string
  templateText: string
  llmText?: string | null
  status?: 'idle' | 'loading' | 'ready' | 'fallback'
  onClose: () => void
}

export function AskWhy({ opportunityId, title, templateText, llmText = null, status = 'fallback', onClose }: AskWhyProps) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (d && !d.open) d.showModal()
  }, [])
  const useLlm = status === 'ready' && llmText !== null
  return (
    <dialog
      ref={ref}
      aria-labelledby={`why-${opportunityId}`}
      onClose={onClose}
      onClick={(e) => { if (e.target === ref.current) onClose() }}
      className="m-auto w-[560px] max-w-[calc(100vw-32px)] rounded-xl border border-border bg-popover p-0 text-foreground backdrop:bg-black/60"
    >
      <div className="space-y-4 p-6">
        <div className="flex items-start justify-between gap-4">
          <h2 id={`why-${opportunityId}`} className="text-[18px] font-semibold">Why: {title}</h2>
          <Button variant="ghost" size="icon-sm" aria-label="Close" onClick={onClose}><X /></Button>
        </div>
        <p className="max-w-[68ch] text-[15px] leading-[1.55]" aria-live="polite">{useLlm ? llmText : templateText}</p>
        <p className="text-[12px] text-muted-foreground">
          {useLlm ? 'Plain-language version, checked against the rules above.' : status === 'loading' ? 'From the rules. A plain-language version is loading.' : 'From the rules. Every fact here comes from the engine.'}
        </p>
      </div>
    </dialog>
  )
}
