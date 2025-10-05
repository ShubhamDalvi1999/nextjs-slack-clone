import { useState } from 'react'

const MessageInput = ({ onSubmit, disabled }) => {
  const [messageText, setMessageText] = useState('')

  const submitOnEnter = (event) => {
    // Watch for enter key
    if (event.keyCode === 13 && !disabled) {
      const text = messageText.trim()
      if (!text) return
      onSubmit(text)
      setMessageText('')
    }
  }

  return (
    <div className="flex items-center space-x-2">
      <input
        className="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        type="text"
        placeholder="Message #channel"
        value={messageText}
        onChange={(e) => setMessageText(e.target.value)}
        onKeyDown={(e) => submitOnEnter(e)}
        disabled={disabled}
      />
      <button
        className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded disabled:opacity-50"
        disabled={disabled || !messageText.trim()}
        onClick={() => {
          if (disabled) return
          const text = messageText.trim()
          if (!text) return
          onSubmit(text)
          setMessageText('')
        }}
      >
        Send
      </button>
    </div>
  )
}

export default MessageInput
