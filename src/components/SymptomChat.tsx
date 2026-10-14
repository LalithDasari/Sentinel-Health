import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Sparkles,
  Bot,
  User,
  HeartPulse,
  Volume2,
  VolumeX,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  FileText
} from 'lucide-react';
import { getPincodeLocation } from '../lib/pincodeData';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  extractedSymptom?: string;
  severity?: 'low' | 'moderate' | 'high' | 'critical';
}

interface SymptomChatProps {
  pincode: string;
  reportContext?: {
    title: string;
    summary: string;
    symptom: string;
    keyFindings: any[];
  } | null;
  onNavigateToDashboard?: (pincode: string) => void;
  onSwitchToScanner?: () => void;
}

export const SymptomChat: React.FC<SymptomChatProps> = ({
  pincode,
  reportContext,
  onNavigateToDashboard,
  onSwitchToScanner
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      role: 'model',
      text: `Hello! I'm your Sentinel Health Clinical Assistant.

How are you feeling physically today? You can describe any sensations, discomfort, or changes you've noticed (such as dizziness, fatigue, aches, or nausea).

I will help explain **what might be happening inside your body in plain English**, outline what to monitor, suggest questions for your doctor, and flag any warning signs.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const pincodeInfo = pincode && pincode.length === 6 ? getPincodeLocation(pincode) : null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const historyPayload = messages.map((m) => ({
        role: m.role,
        text: m.text
      }));

      const res = await fetch('/api/symptom-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history: historyPayload,
          reportContext: reportContext || undefined,
          pincode: pincode && pincode.length === 6 ? pincode : undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to analyze symptoms');
      }

      const botMsg: ChatMessage = {
        id: `model-${Date.now()}`,
        role: 'model',
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        extractedSymptom: data.extractedSymptom,
        severity: data.severity
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'model',
        text: `I apologize, I encountered a temporary connection issue. Please check your network or try asking again. If your symptoms feel severe or worsening, please consult a medical provider immediately.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleSpeak = (id: string, text: string) => {
    if (!('speechSynthesis' in window)) return;

    if (playingId === id) {
      window.speechSynthesis.cancel();
      setPlayingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    // Clean text of markdown asterisks for smoother speech
    const cleanSpeech = text.replace(/[*#_`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanSpeech);
    utterance.rate = 0.95;

    utterance.onend = () => setPlayingId(null);
    utterance.onerror = () => setPlayingId(null);

    setPlayingId(id);
    window.speechSynthesis.speak(utterance);
  };

  const quickPrompts = [
    "I've been feeling unusually exhausted and lightheaded for 3 days",
    "I have burning stomach pain and nausea after meals",
    "My heart feels like it's racing and I feel shaky",
    "I have a dull headache, stiff neck, and mild fever",
    ...(reportContext ? [`How do my symptoms relate to my ${reportContext.title}?`] : [])
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 flex flex-col h-[700px] max-h-[85vh] overflow-hidden">
      {/* Header Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Symptom Health Assistant</h2>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
                AI Clinical Guidance
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Describe how you feel to understand possible physiological causes
            </p>
          </div>
        </div>

        {pincodeInfo && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 text-[11px] text-teal-300 border border-slate-700">
            <span>Surveillance PIN:</span>
            <span className="font-bold">{pincode}</span>
          </div>
        )}
      </div>

      {/* Lab Context Banner if present */}
      {reportContext && (
        <div className="bg-teal-50/90 border-b border-teal-200 px-4 py-2.5 flex items-center justify-between text-xs text-teal-900 shrink-0">
          <div className="flex items-center gap-2 truncate">
            <FileText className="w-4 h-4 text-teal-700 shrink-0" />
            <span className="truncate">
              Active Lab Context: <span className="font-bold">{reportContext.title}</span> (
              {reportContext.symptom})
            </span>
          </div>
          <span className="text-[10px] font-bold bg-teal-200/70 text-teal-800 px-2 py-0.5 rounded-full shrink-0">
            Integrated
          </span>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-slate-50/50">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  isUser
                    ? 'bg-slate-900 text-white'
                    : 'bg-teal-600 text-white shadow-sm shadow-teal-600/30'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <HeartPulse className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div className={`max-w-[85%] sm:max-w-[78%] space-y-2`}>
                <div
                  className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-slate-900 text-white rounded-tr-none'
                      : 'bg-white text-slate-800 border border-slate-200/90 shadow-sm rounded-tl-none'
                  }`}
                >
                  {/* Formatted body */}
                  <div className="whitespace-pre-wrap space-y-2">
                    {msg.text.split('\n\n').map((paragraph, pIdx) => {
                      if (paragraph.startsWith('### ') || paragraph.startsWith('## ')) {
                        const heading = paragraph.replace(/^#+\s*/, '');
                        return (
                          <h4
                            key={pIdx}
                            className="font-extrabold text-teal-700 text-xs sm:text-sm pt-1 border-b border-slate-100 pb-1"
                          >
                            {heading}
                          </h4>
                        );
                      }
                      if (paragraph.startsWith('1. ') || paragraph.startsWith('- ')) {
                        const items = paragraph.split('\n');
                        return (
                          <ul key={pIdx} className="space-y-1 pl-3 text-xs sm:text-sm">
                            {items.map((it, itIdx) => (
                              <li key={itIdx} className="list-disc">
                                {it.replace(/^[-*•]\s*|^\d+\.\s*/, '')}
                              </li>
                            ))}
                          </ul>
                        );
                      }
                      return <p key={pIdx}>{paragraph}</p>;
                    })}
                  </div>

                  {/* Extracted Symptom Tag */}
                  {msg.extractedSymptom && (
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-[11px] text-teal-800 font-semibold bg-teal-50 px-2 py-1 rounded-lg border border-teal-200">
                        <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                        <span>Logged Symptom: {msg.extractedSymptom}</span>
                      </div>
                      {onNavigateToDashboard && pincode && (
                        <button
                          onClick={() => onNavigateToDashboard(pincode)}
                          className="text-[11px] text-slate-600 hover:text-teal-700 font-bold underline"
                        >
                          View Map
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Meta & Audio Button */}
                <div
                  className={`flex items-center gap-2 px-1 text-[10px] text-slate-400 ${
                    isUser ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <span>{msg.timestamp}</span>
                  {!isUser && (
                    <button
                      onClick={() => handleSpeak(msg.id, msg.text)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-teal-700"
                      title="Read out response"
                    >
                      {playingId === msg.id ? (
                        <>
                          <VolumeX className="w-3.5 h-3.5 text-rose-600" />
                          <span>Stop</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5 text-teal-600" />
                          <span>Listen</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center shrink-0">
              <HeartPulse className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 rounded-tl-none shadow-sm flex items-center gap-2 text-xs text-slate-500">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce"></span>
              <span
                className="w-2 h-2 rounded-full bg-teal-500 animate-bounce"
                style={{ animationDelay: '0.2s' }}
              ></span>
              <span
                className="w-2 h-2 rounded-full bg-teal-500 animate-bounce"
                style={{ animationDelay: '0.4s' }}
              ></span>
              <span className="ml-1 font-semibold text-slate-700">
                Evaluating physiological signals...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Query Chips */}
      {messages.length <= 3 && !loading && (
        <div className="px-4 py-2.5 bg-slate-100/70 border-t border-slate-200 overflow-x-auto shrink-0 flex items-center gap-1.5 scrollbar-none">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-1">
            Try:
          </span>
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(prompt)}
              className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-white text-slate-700 hover:bg-teal-50 hover:text-teal-800 border border-slate-200 shrink-0 transition"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input Box */}
      <div className="p-3 sm:p-4 border-t border-slate-200 bg-white shrink-0 space-y-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Describe how you feel (e.g. 'I feel dizzy and exhausted after eating')..."
              className="w-full resize-none bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition"
            />
          </div>

          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="w-10 h-10 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white flex items-center justify-center transition shadow-md shrink-0"
            title="Send symptom query"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
          <span>Press Enter to send • Educational medical triage AI</span>
          {onSwitchToScanner && (
            <button
              type="button"
              onClick={onSwitchToScanner}
              className="text-teal-600 font-bold hover:underline"
            >
              Upload Lab Sheet Instead →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
