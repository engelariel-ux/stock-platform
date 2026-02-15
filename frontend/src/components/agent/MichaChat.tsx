import { useState, useRef, useEffect } from 'react'
import { Send, X } from 'lucide-react'
import type { ChatMessage, AgentState } from '../../types/agent'

interface Props {
  messages: ChatMessage[]
  agentState: AgentState
  onSend: (msg: string) => void
  onClose: () => void
  ticker: string
}

export default function MichaChat({ messages, agentState, onSend, onClose, ticker }: Props) {
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const text = input.trim()
    if (!text) return
    onSend(text)
    setInput('')
  }

  return (
    <div className="flex h-96 w-80 flex-col overflow-hidden rounded-xl border border-gray-800 bg-gray-950 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-800 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <span className="text-sm font-semibold text-yellow-400">Engelus</span>
          <span className="text-xs text-gray-500">· {ticker}</span>
        </div>
        <button onClick={onClose} className="text-gray-500 transition-colors hover:text-gray-300">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-xs text-gray-600 mt-8">
            Ask Engelus anything about {ticker}
          </p>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                msg.role === 'user'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-800 text-gray-200'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {agentState === 'thinking' && (
          <div className="flex justify-start">
            <div className="rounded-lg bg-gray-800 px-3 py-2 text-sm text-gray-400">
              <span className="inline-flex gap-1">
                <span className="animate-bounce">.</span>
                <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-gray-800 p-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask about ${ticker}...`}
            className="flex-1 rounded-lg bg-gray-900 px-3 py-2 text-sm text-white placeholder-gray-600 outline-none ring-1 ring-gray-800 focus:ring-emerald-500/50"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="rounded-lg bg-emerald-600 p-2 text-white transition-colors hover:bg-emerald-500 disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  )
}
