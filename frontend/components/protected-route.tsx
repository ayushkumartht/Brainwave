'use client'

import { useAccount } from 'wagmi'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const { isConnected, isConnecting, status } = useAccount()
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !isConnecting && status !== 'reconnecting' && !isConnected) {
      router.push('/')
    }
  }, [mounted, isConnected, isConnecting, status, router])

  if (!mounted || isConnecting || status === 'reconnecting') {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-[#050505] text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
          <p className="text-white/60 text-xs font-mono tracking-wider uppercase">Checking wallet connection...</p>
        </div>
      </div>
    )
  }

  if (!isConnected) {
    return null // Will redirect
  }

  return <>{children}</>
}
