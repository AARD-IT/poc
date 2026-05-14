import { useEffect } from 'react'
import type { Poc } from '@/types/domain'
import { PocDetailBody } from './PocDetailBody'

interface SolutionModalProps {
  poc: Poc | null
  readOnly?: boolean
  onClose: () => void
}

export function SolutionModal({ poc, readOnly, onClose }: SolutionModalProps) {
  useEffect(() => {
    if (poc) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [poc])

  if (!poc) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

      <div className="relative max-w-4xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <PocDetailBody poc={poc} readOnly={readOnly} onClose={onClose} showClose />
      </div>
    </div>
  )
}
