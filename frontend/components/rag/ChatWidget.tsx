'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, ExternalLink, Video } from 'lucide-react';

interface RAGSource {
  lessonId: string | null;
  courseId: string;
  content: string;
  sourceType: 'text' | 'video_transcript';
  similarity: number;
  timestamp?: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: RAGSource[];
}

interface ChatWidgetProps {
  courseId: string;
  courseName?: string;
}

export default function ChatWidget({ courseId, courseName }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const question = input.trim();
    if (!question || isLoading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: question }]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/rag/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, courseId }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to get answer');
      }

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.answer,
          sources: data.sources,
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            error instanceof Error
              ? error.message
              : 'Sorry, something went wrong. Please try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          id="rag-chat-toggle"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-primary hover:bg-primary-dark text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group"
          aria-label="Ask AI about this course"
        >
          <MessageCircle size={24} className="group-hover:rotate-12 transition-transform" />
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[400px] max-h-[600px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-blue-600 text-white px-5 py-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-lg p-1.5">
                <MessageCircle size={18} />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Course AI Assistant</h3>
                <p className="text-[11px] text-white/70 truncate max-w-[220px]">
                  {courseName || 'Ask anything about this course'}
                </p>
              </div>
            </div>
            <button
              id="rag-chat-close"
              onClick={() => setIsOpen(false)}
              className="text-white/70 hover:text-white hover:bg-white/10 rounded-lg p-1.5 transition-colors"
              aria-label="Close chat"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 min-h-[300px] max-h-[400px]">
            {messages.length === 0 && (
              <div className="text-center py-10">
                <div className="bg-primary/5 dark:bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <MessageCircle size={28} className="text-primary/50" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                  Ask me anything about this course!
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  I can answer questions from lessons and video content.
                </p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-primary text-white rounded-br-md'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-md'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>

                  {/* Sources */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-gray-200/50 dark:border-gray-700/50">
                      <p className="text-[10px] font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1.5 tracking-wider">
                        Sources
                      </p>
                      <div className="space-y-1">
                        {msg.sources.map((source, j) => (
                          <div
                            key={j}
                            className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400"
                          >
                            {source.sourceType === 'video_transcript' ? (
                              <>
                                <Video size={10} className="text-red-400 flex-shrink-0" />
                                {source.timestamp ? (
                                  <span className="hover:text-primary cursor-pointer">
                                    Jump to {source.timestamp} in video
                                  </span>
                                ) : (
                                  <span>Video transcript</span>
                                )}
                              </>
                            ) : (
                              <>
                                <ExternalLink size={10} className="flex-shrink-0" />
                                <span className="truncate">
                                  {source.content.substring(0, 60)}...
                                </span>
                              </>
                            )}
                            <span className="ml-auto text-[9px] bg-gray-200 dark:bg-gray-700 rounded px-1 py-0.5 flex-shrink-0">
                              {Math.round(source.similarity * 100)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin text-primary" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Thinking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-2 flex-shrink-0"
          >
            <input
              ref={inputRef}
              id="rag-chat-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              disabled={isLoading}
              className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-50 transition-colors"
            />
            <button
              id="rag-chat-send"
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-primary hover:bg-primary-dark disabled:opacity-40 disabled:hover:bg-primary text-white rounded-xl p-2.5 transition-colors flex-shrink-0"
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
