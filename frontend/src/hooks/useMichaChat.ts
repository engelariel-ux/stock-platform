import { useState, useCallback } from 'react'
import type { ChatMessage, AgentState } from '../types/agent'

const PLACEHOLDER_RESPONSES: Record<string, string> = {
  default: "I'm Micha, your AI stock analyst. I'm not connected to the backend yet, but once I am, I'll provide real-time analysis!",
}

let msgId = 0

export function useMichaChat(ticker: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [agentState, setAgentState] = useState<AgentState>('idle')

  const sendMessage = useCallback(
    (content: string) => {
      const userMsg: ChatMessage = {
        id: String(++msgId),
        role: 'user',
        content,
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, userMsg])
      setAgentState('thinking')

      setTimeout(() => {
        setAgentState('talking')
        const reply: ChatMessage = {
          id: String(++msgId),
          role: 'agent',
          content:
            PLACEHOLDER_RESPONSES[ticker.toLowerCase()] ??
            `Analyzing ${ticker}... ${PLACEHOLDER_RESPONSES.default}`,
          timestamp: Date.now(),
        }
        setMessages((prev) => [...prev, reply])

        setTimeout(() => setAgentState('idle'), 1500)
      }, 1200)
    },
    [ticker],
  )

  const clearChat = useCallback(() => setMessages([]), [])

  return { messages, agentState, sendMessage, clearChat }
}
