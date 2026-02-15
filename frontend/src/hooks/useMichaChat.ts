import { useState, useCallback } from 'react'
import type { ChatMessage, AgentState } from '../types/agent'
import { askMicha } from '../services/api'

let msgId = 0

export function useMichaChat(ticker: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [agentState, setAgentState] = useState<AgentState>('idle')

  const sendMessage = useCallback(
    async (content: string) => {
      const userMsg: ChatMessage = {
        id: String(++msgId),
        role: 'user',
        content,
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, userMsg])
      setAgentState('thinking')

      try {
        const reply = await askMicha(content, ticker)
        setAgentState('talking')
        setMessages((prev) => [...prev, reply])
        setTimeout(() => setAgentState('idle'), 1500)
      } catch (err) {
        console.error('Micha error:', err)
        setAgentState('idle')
        setMessages((prev) => [
          ...prev,
          {
            id: String(++msgId),
            role: 'agent',
            content: "Sorry, I couldn't process that. Please try again.",
            timestamp: Date.now(),
          },
        ])
      }
    },
    [ticker],
  )

  const clearChat = useCallback(() => setMessages([]), [])

  return { messages, agentState, sendMessage, clearChat }
}
