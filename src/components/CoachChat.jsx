import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, User } from 'lucide-react';
import { sendMessageToGemini } from '../services/coachService';

const CoachChat = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'model', text: 'Halo! Saya Coach Este 🏃‍♂️. Ada yang bisa saya bantu soal lari hari ini?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg = { role: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        // Call API
        try {
            const historyForService = messages.filter(m => true);
            const responseText = await sendMessageToGemini(historyForService, userMsg.text);
            setMessages(prev => [...prev, { role: 'model', text: responseText }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'model', text: "Maaf, ada gangguan koneksi. 😔" }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <>
            {/* Backdrop Blur Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 animate-in fade-in duration-200"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Chat Window Container */}
            <div className={`fixed bottom-24 right-4 z-50 flex flex-col items-end pointer-events-none transition-all duration-300 ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'}`}>
                {isOpen && (
                    <div className="bg-white dark:bg-navy-900 w-80 h-96 rounded-2xl shadow-2xl border border-gray-100 dark:border-navy-700 mb-4 flex flex-col overflow-hidden pointer-events-auto">
                        {/* Header */}
                        <div className="bg-navy-600 p-4 flex justify-between items-center text-white">
                            <div className="flex items-center gap-2">
                                <div className="bg-white/20 p-1.5 rounded-full">
                                    <Sparkles size={20} className="text-yellow-300" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm">Coach Este</h3>
                                    <p className="text-[10px] text-navy-100 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                                        Online
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-1 rounded-full transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-navy-950">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 
                                        ${msg.role === 'user' ? 'bg-gray-200 dark:bg-navy-700 text-gray-600 dark:text-gray-300' : 'bg-navy-100 dark:bg-navy-800 text-navy-600 dark:text-navy-300'}`}>
                                        {msg.role === 'user' ? <User size={14} /> : <Sparkles size={14} />}
                                    </div>
                                    <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm leading-relaxed
                                        ${msg.role === 'user'
                                            ? 'bg-navy-600 text-white rounded-tr-none'
                                            : 'bg-white dark:bg-navy-800 text-gray-700 dark:text-gray-200 shadow-sm border border-gray-100 dark:border-navy-700 rounded-tl-none'}`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex gap-2">
                                    <div className="w-8 h-8 rounded-full bg-navy-100 dark:bg-navy-800 flex items-center justify-center">
                                        <Sparkles size={14} className="text-navy-600" />
                                    </div>
                                    <div className="bg-white dark:bg-navy-800 px-4 py-3 rounded-2xl rounded-tl-none border border-gray-100 dark:border-navy-700 flex gap-1">
                                        <div className="w-2 h-2 bg-navy-400 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-navy-400 rounded-full animate-bounce delay-75"></div>
                                        <div className="w-2 h-2 bg-navy-400 rounded-full animate-bounce delay-150"></div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-3 bg-white dark:bg-navy-900 border-t border-gray-100 dark:border-navy-800 flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyPress}
                                placeholder="Tanya soal lari..."
                                className="flex-1 bg-gray-100 dark:bg-navy-950 text-navy-900 dark:text-white px-4 py-2 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
                                disabled={isLoading}
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || isLoading}
                                className="bg-navy-600 text-white p-2 rounded-full hover:bg-navy-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-4 right-4 z-50 w-14 h-14 bg-gradient-to-tr from-navy-600 to-indigo-500 text-white rounded-full shadow-lg shadow-navy-600/30 flex items-center justify-center hover:scale-105 transition-transform active:scale-95 pointer-events-auto border-4 border-white dark:border-navy-950"
            >
                {isOpen ? <X size={28} /> : <Sparkles size={28} />}
            </button>
        </>
    );
};

export default CoachChat;
