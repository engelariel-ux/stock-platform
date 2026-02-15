export type AgentState = 'idle' | 'thinking' | 'talking'

export interface ChatMessage {
  id: string
  role: 'user' | 'agent'
  content: string
  timestamp: number
}
