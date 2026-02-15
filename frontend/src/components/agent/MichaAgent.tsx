import { useState } from 'react'
import { useTicker } from '../../context/TickerContext'
import { useMichaChat } from '../../hooks/useMichaChat'
import MichaAvatar from './MichaAvatar'
import MichaChat from './MichaChat'

export default function MichaAgent() {
  const { selectedTicker } = useTicker()
  const { messages, agentState, sendMessage, clearChat } = useMichaChat(selectedTicker)
  const [open, setOpen] = useState(false)

  const handleClose = () => {
    setOpen(false)
    clearChat()
  }

  return (
    <div className="fixed right-6 bottom-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <MichaChat
          messages={messages}
          agentState={agentState}
          onSend={sendMessage}
          onClose={handleClose}
          ticker={selectedTicker}
        />
      )}
      <MichaAvatar state={agentState} onClick={() => setOpen((o) => !o)} />
    </div>
  )
}
