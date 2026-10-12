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
      className="nr-dialog"
    >
      <div className="dlg">
        <h2 id={`why-${opportunityId}`}>Why: {title}</h2>
        <Button className="dlg-x" variant="outline" size="icon-sm" aria-label="Close" onClick={onClose}><X /></Button>
        <p className="ans" aria-live="polite">{useLlm ? llmText : templateText}</p>
        <p className="note">
          {useLlm ? 'Plain-language version, checked against the rules.' : status === 'loading' ? 'From the rules. A plain-language version is loading.' : 'From the rules. Every fact here comes from the engine.'}
        </p>
        {useLlm && (
          <details>
            <summary>Exact rule details</summary>
            <p>{templateText}</p>
          </details>
        )}
      </div>
    </dialog>
  )
}
