import type { ReactNode } from 'react'
import TopBar from './TopBar'
import Watchlist from '../watchlist/Watchlist'

interface Props {
  children: ReactNode
}

export default function DashboardLayout({ children }: Props) {
  return (
    <div className="flex h-screen w-screen flex-col bg-gray-950 text-white">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <Watchlist />
        <main className="flex flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  )
}
