'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { MessageCircle, X, Send, Bot, User, Sparkles, ChevronDown } from 'lucide-react'

interface Message {
    id: string
    text: string
    sender: 'user' | 'bot'
    timestamp: Date
}

const QUICK_REPLIES = [
    '🔑 How do I get access?',
    '💳 Lost my RFID card',
    '🚪 Gate not working',
    '👤 Update my profile',
    '📊 View access history',
    '🆘 Emergency contact',
]

const BOT_RESPONSES: Record<string, string> = {
    'how do i get access': `Welcome! To get campus access:\n\n1. **Register** through the Users tab with your details\n2. **Collect your RFID card** from the security office\n3. **Enroll biometrics** at any registration kiosk\n4. Your card will be activated within 24 hours\n\nNeed help? Visit the Admin office in Block A, Room 102.`,

    'lost my rfid card': `Sorry to hear that! Here's what to do:\n\n1. **Report immediately** — your old card will be deactivated to prevent misuse\n2. **Visit Security Office** (Block A, Ground Floor) with your campus ID\n3. **Get a replacement** — a new RFID card will be issued (₹200 replacement fee)\n4. **Re-link biometrics** if needed\n\n⏰ Office hours: Mon-Fri, 9 AM - 5 PM`,

    'gate not working': `If a gate isn't responding:\n\n1. **Try your card again** — hold it steady for 2 seconds\n2. **Check the gate status** on the Dashboard — it may be under maintenance\n3. **Use an alternate gate** if available\n4. **Contact Security**: Call ext. 1234 or use the intercom at the gate\n\n🔧 If the issue persists, report it through the Alerts tab.`,

    'update my profile': `To update your profile:\n\n1. Go to the **Users** tab\n2. Find your name in the user list\n3. Click the **Edit** (pencil) icon\n4. Update your details and save\n\n📝 Note: RFID/Biometric changes require admin approval and an in-person visit.`,

    'view access history': `You can view access history in two ways:\n\n1. **Dashboard Tab** — See recent activity in the "Recent Activity" card\n2. **Access Control Tab** — View detailed scan logs with timestamps\n\n📊 The Reports tab also shows system-wide statistics and performance metrics.`,

    'emergency contact': `🚨 **Emergency Contacts:**\n\n• **Campus Security**: Ext. 1234 / +91-XXXXX-XXXXX\n• **Fire Emergency**: 101\n• **Medical Emergency**: Ext. 5678\n• **Admin Office**: Ext. 4321\n\n📍 Security Office: Block A, Ground Floor\n⏰ 24/7 Emergency Response Available`,
}

function getBotResponse(userMessage: string): string {
    const lower = userMessage.toLowerCase().trim()

    // Check for keyword matches
    if (lower.includes('access') && (lower.includes('get') || lower.includes('how'))) {
        return BOT_RESPONSES['how do i get access']
    }
    if (lower.includes('lost') || (lower.includes('rfid') && lower.includes('card'))) {
        return BOT_RESPONSES['lost my rfid card']
    }
    if (lower.includes('gate') && (lower.includes('not working') || lower.includes('issue') || lower.includes('problem') || lower.includes('broken') || lower.includes('stuck'))) {
        return BOT_RESPONSES['gate not working']
    }
    if (lower.includes('update') || lower.includes('profile') || lower.includes('edit')) {
        return BOT_RESPONSES['update my profile']
    }
    if (lower.includes('history') || lower.includes('log') || lower.includes('access history')) {
        return BOT_RESPONSES['view access history']
    }
    if (lower.includes('emergency') || lower.includes('contact') || lower.includes('help') || lower.includes('sos')) {
        return BOT_RESPONSES['emergency contact']
    }
    if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey') || lower.includes('good morning') || lower.includes('good afternoon')) {
        return `Hello! 👋 Welcome to the Smart Campus Support Bot.\n\nI can help you with:\n• Getting campus access\n• Lost RFID cards\n• Gate issues\n• Profile updates\n• Access history\n• Emergency contacts\n\nHow can I assist you today?`
    }
    if (lower.includes('thank') || lower.includes('thanks')) {
        return `You're welcome! 😊 Is there anything else I can help you with?`
    }
    if (lower.includes('bye') || lower.includes('goodbye')) {
        return `Goodbye! 👋 Have a great day on campus. Feel free to reach out anytime you need help!`
    }

    // Default response
    return `I'm not sure I understand that query. Here are some things I can help with:\n\n• **Getting campus access** — registration & card setup\n• **Lost RFID card** — reporting & replacement\n• **Gate issues** — troubleshooting & contacts\n• **Profile updates** — editing your information\n• **Access history** — viewing your logs\n• **Emergency contacts** — security & admin numbers\n\nPlease try one of the options above, or type your question differently.`
}

export default function Chatbot() {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: "Hi there! 👋 I'm the Smart Campus Assistant. How can I help you today?",
            sender: 'bot',
            timestamp: new Date(),
        },
    ])
    const [inputValue, setInputValue] = useState('')
    const [isTyping, setIsTyping] = useState(false)
    const [showScrollDown, setShowScrollDown] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const scrollAreaRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [])

    useEffect(() => {
        scrollToBottom()
    }, [messages, isTyping, scrollToBottom])

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 300)
        }
    }, [isOpen])

    const handleScroll = () => {
        if (!scrollAreaRef.current) return
        const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current
        setShowScrollDown(scrollHeight - scrollTop - clientHeight > 100)
    }

    const sendMessage = (text: string) => {
        if (!text.trim()) return

        const userMsg: Message = {
            id: Date.now().toString(),
            text: text.trim(),
            sender: 'user',
            timestamp: new Date(),
        }

        setMessages((prev) => [...prev, userMsg])
        setInputValue('')
        setIsTyping(true)

        // Simulate bot thinking
        setTimeout(() => {
            const botResponse = getBotResponse(text)
            const botMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: botResponse,
                sender: 'bot',
                timestamp: new Date(),
            }
            setMessages((prev) => [...prev, botMsg])
            setIsTyping(false)
        }, 800 + Math.random() * 700)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        sendMessage(inputValue)
    }

    const handleQuickReply = (reply: string) => {
        // Remove the emoji prefix for processing
        const cleanReply = reply.replace(/^[^\w]*/, '').trim()
        sendMessage(cleanReply)
    }

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }

    return (
        <>
            {/* Chat Window */}
            <div
                className={`fixed bottom-24 right-6 z-[9999] transition-all duration-300 ease-in-out ${isOpen
                        ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
                        : 'opacity-0 translate-y-4 scale-95 pointer-events-none'
                    }`}
                style={{ width: '400px', maxWidth: 'calc(100vw - 2rem)' }}
            >
                <div
                    className="rounded-2xl overflow-hidden flex flex-col"
                    style={{
                        height: '550px',
                        maxHeight: 'calc(100vh - 10rem)',
                        background: 'rgba(255, 255, 255, 0.97)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(0, 0, 0, 0.08)',
                        boxShadow:
                            '0 25px 60px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0,0,0,0.03)',
                    }}
                >
                    {/* Header */}
                    <div
                        className="px-5 py-4 flex items-center justify-between flex-shrink-0"
                        style={{
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)',
                        }}
                    >
                        <div className="flex items-center gap-3">
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center"
                                style={{ background: 'rgba(255,255,255,0.2)' }}
                            >
                                <Bot className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white text-sm">Campus Assistant</h3>
                                <div className="flex items-center gap-1.5">
                                    <div
                                        className="w-2 h-2 rounded-full"
                                        style={{ background: '#86efac', animation: 'pulse 2s infinite' }}
                                    />
                                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.85)' }}>
                                        Online • Ready to help
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                            style={{ background: 'rgba(255,255,255,0.15)' }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.25)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
                        >
                            <X className="w-4 h-4 text-white" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div
                        ref={scrollAreaRef}
                        onScroll={handleScroll}
                        className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
                        style={{ scrollBehavior: 'smooth' }}
                    >
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex items-end gap-2 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                            >
                                {/* Avatar */}
                                <div
                                    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                                    style={{
                                        background:
                                            msg.sender === 'bot'
                                                ? 'linear-gradient(135deg, #10b981, #059669)'
                                                : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                                    }}
                                >
                                    {msg.sender === 'bot' ? (
                                        <Bot className="w-3.5 h-3.5 text-white" />
                                    ) : (
                                        <User className="w-3.5 h-3.5 text-white" />
                                    )}
                                </div>

                                {/* Message Bubble */}
                                <div
                                    className="max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                                    style={
                                        msg.sender === 'user'
                                            ? {
                                                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                                                color: 'white',
                                                borderBottomRightRadius: '6px',
                                            }
                                            : {
                                                background: '#f1f5f9',
                                                color: '#1e293b',
                                                borderBottomLeftRadius: '6px',
                                            }
                                    }
                                >
                                    <div className="whitespace-pre-wrap" style={{ wordBreak: 'break-word' }}>
                                        {msg.text.split(/(\*\*[^*]+\*\*)/).map((part, i) => {
                                            if (part.startsWith('**') && part.endsWith('**')) {
                                                return (
                                                    <strong key={i} style={{ fontWeight: 600 }}>
                                                        {part.slice(2, -2)}
                                                    </strong>
                                                )
                                            }
                                            return <span key={i}>{part}</span>
                                        })}
                                    </div>
                                    <p
                                        className="text-[10px] mt-1"
                                        style={{
                                            opacity: 0.6,
                                            textAlign: msg.sender === 'user' ? 'right' : 'left',
                                        }}
                                    >
                                        {formatTime(msg.timestamp)}
                                    </p>
                                </div>
                            </div>
                        ))}

                        {/* Typing Indicator */}
                        {isTyping && (
                            <div className="flex items-end gap-2">
                                <div
                                    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                                    style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
                                >
                                    <Bot className="w-3.5 h-3.5 text-white" />
                                </div>
                                <div
                                    className="px-4 py-3 rounded-2xl"
                                    style={{ background: '#f1f5f9', borderBottomLeftRadius: '6px' }}
                                >
                                    <div className="flex gap-1.5">
                                        <div
                                            className="w-2 h-2 rounded-full"
                                            style={{
                                                background: '#94a3b8',
                                                animation: 'chatBounce 1.4s infinite ease-in-out',
                                                animationDelay: '0s',
                                            }}
                                        />
                                        <div
                                            className="w-2 h-2 rounded-full"
                                            style={{
                                                background: '#94a3b8',
                                                animation: 'chatBounce 1.4s infinite ease-in-out',
                                                animationDelay: '0.2s',
                                            }}
                                        />
                                        <div
                                            className="w-2 h-2 rounded-full"
                                            style={{
                                                background: '#94a3b8',
                                                animation: 'chatBounce 1.4s infinite ease-in-out',
                                                animationDelay: '0.4s',
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Scroll to bottom button */}
                    {showScrollDown && (
                        <button
                            onClick={scrollToBottom}
                            className="absolute bottom-36 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-lg"
                            style={{ background: 'white', border: '1px solid #e2e8f0' }}
                        >
                            <ChevronDown className="w-4 h-4 text-slate-600" />
                        </button>
                    )}

                    {/* Quick Replies */}
                    {messages.length <= 2 && (
                        <div className="px-4 pb-2 flex-shrink-0">
                            <div className="flex flex-wrap gap-1.5">
                                {QUICK_REPLIES.map((reply) => (
                                    <button
                                        key={reply}
                                        onClick={() => handleQuickReply(reply)}
                                        className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                                        style={{
                                            background: '#f0fdf4',
                                            color: '#059669',
                                            border: '1px solid #bbf7d0',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = '#dcfce7'
                                            e.currentTarget.style.borderColor = '#86efac'
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = '#f0fdf4'
                                            e.currentTarget.style.borderColor = '#bbf7d0'
                                        }}
                                    >
                                        {reply}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Input */}
                    <form
                        onSubmit={handleSubmit}
                        className="px-4 py-3 flex items-center gap-2 flex-shrink-0"
                        style={{ borderTop: '1px solid #f1f5f9' }}
                    >
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Type your message..."
                            className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                            style={{
                                background: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                color: '#1e293b',
                            }}
                            onFocus={(e) => (e.currentTarget.style.borderColor = '#10b981')}
                            onBlur={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
                        />
                        <button
                            type="submit"
                            disabled={!inputValue.trim()}
                            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0"
                            style={{
                                background:
                                    inputValue.trim()
                                        ? 'linear-gradient(135deg, #10b981, #059669)'
                                        : '#f1f5f9',
                                cursor: inputValue.trim() ? 'pointer' : 'default',
                            }}
                        >
                            <Send
                                className="w-4 h-4"
                                style={{ color: inputValue.trim() ? 'white' : '#94a3b8' }}
                            />
                        </button>
                    </form>
                </div>
            </div>

            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 z-[9999] w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 group"
                style={{
                    background: isOpen
                        ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                        : 'linear-gradient(135deg, #10b981, #059669)',
                    boxShadow: isOpen
                        ? '0 8px 30px rgba(239, 68, 68, 0.4)'
                        : '0 8px 30px rgba(16, 185, 129, 0.4)',
                }}
            >
                <div
                    className="transition-transform duration-300"
                    style={{ transform: isOpen ? 'rotate(0deg)' : 'rotate(0deg)' }}
                >
                    {isOpen ? (
                        <X className="w-6 h-6 text-white" />
                    ) : (
                        <MessageCircle className="w-6 h-6 text-white" />
                    )}
                </div>

                {/* Pulse ring when closed */}
                {!isOpen && (
                    <span
                        className="absolute w-full h-full rounded-full"
                        style={{
                            background: 'rgba(16, 185, 129, 0.3)',
                            animation: 'chatPing 2s cubic-bezier(0, 0, 0.2, 1) infinite',
                        }}
                    />
                )}

                {/* Notification dot */}
                {!isOpen && (
                    <span
                        className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center"
                        style={{ background: '#ef4444', border: '2px solid white' }}
                    >
                        <Sparkles className="w-2 h-2 text-white" />
                    </span>
                )}
            </button>

            {/* CSS animations */}
            <style jsx global>{`
        @keyframes chatBounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
        @keyframes chatPing {
          0% { transform: scale(1); opacity: 0.75; }
          75%, 100% { transform: scale(1.8); opacity: 0; }
        }
      `}</style>
        </>
    )
}
