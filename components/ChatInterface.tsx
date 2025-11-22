import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Zap, Heart, Volume2, Loader2, Lightbulb, Copy, RefreshCcw } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Message } from '../types';
import { generateAnyaResponse, generateSpeech, generateFlirtSuggestions } from '../services/gemini';
import { saveChatHistory } from '../services/firebase';

const ChatInterface = () => {
  const { userId, anyaProfile, longTermMemories } = useAppContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  
  // Audio States
  const [loadingAudioIndex, setLoadingAudioIndex] = useState<number | null>(null);
  const [playingAudioIndex, setPlayingAudioIndex] = useState<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Cleanup audio context on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (!inputText.trim() || isGenerating) return;

    const userMsg: Message = { role: 'user', content: inputText.trim() };
    const newHistory = [...messages, userMsg];
    
    setMessages(newHistory);
    setInputText('');
    setSuggestions([]);
    setIsGenerating(true);

    // Save to Firebase (fire and forget)
    if (userId) saveChatHistory(userId, newHistory);

    try {
      const response = await generateAnyaResponse(newHistory, longTermMemories, anyaProfile.trait);
      
      const aiMsg: Message = {
        role: 'anya',
        content: response.dialogue,
        emotion: response.emotion,
        sensory: response.sensory,
        fullText: response.dialogue // Mostly just dialogue for TTS, or could combine
      };

      const finalHistory = [...newHistory, aiMsg];
      setMessages(finalHistory);
      if (userId) saveChatHistory(userId, finalHistory);

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'system', content: "Anya is momentarily disconnected." }]);
    } finally {
      setIsGenerating(false);
      // Keep focus on desktop, but maybe not on mobile to prevent keyboard popping up unnecessarily
      if (window.innerWidth > 768) {
          setTimeout(() => inputRef.current?.focus(), 100);
      }
    }
  }, [inputText, isGenerating, messages, userId, longTermMemories, anyaProfile]);

  const handlePlayAudio = async (text: string, index: number) => {
    // If already loading or playing this index, do nothing
    if (loadingAudioIndex === index || playingAudioIndex === index) return;
    
    // If playing another, stop it (by closing context)
    if (audioContextRef.current) {
       await audioContextRef.current.close();
       audioContextRef.current = null;
       setPlayingAudioIndex(null);
    }

    setLoadingAudioIndex(index);
    
    try {
      const audioBuffer = await generateSpeech(text);
      setLoadingAudioIndex(null);

      if (audioBuffer) {
        setPlayingAudioIndex(index);
        
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        audioContextRef.current = ctx;
        
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        
        source.onended = () => {
          setPlayingAudioIndex(null);
        };
        
        source.start(0);
      } else {
        alert("Could not generate audio.");
      }
    } catch (e) {
      console.error("Audio playback failed", e);
      setLoadingAudioIndex(null);
      setPlayingAudioIndex(null);
    }
  };

  const fetchSuggestions = async () => {
    setIsLoadingSuggestions(true);
    const sugs = await generateFlirtSuggestions(messages);
    setSuggestions(sugs);
    setIsLoadingSuggestions(false);
  };

  return (
    <div className="flex flex-col h-full md:bg-gray-900/50 rounded-xl overflow-hidden relative">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-4 md:space-y-6">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-60 animate-fade-in-up px-6 text-center">
            <Heart className="w-12 h-12 md:w-16 md:h-16 mb-4 stroke-1" />
            <p className="text-base md:text-lg font-light">Say hello to {anyaProfile.name}...</p>
            <p className="text-xs mt-2">Try "How was your day?"</p>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
            {msg.role === 'user' ? (
              <div className="bg-indigo-600 text-white px-4 py-2.5 md:px-5 md:py-3 rounded-2xl rounded-br-none max-w-[90%] md:max-w-[85%] shadow-md text-sm md:text-base">
                {msg.content}
              </div>
            ) : msg.role === 'anya' ? (
              <div className="max-w-[95%] md:max-w-[75%] relative group">
                <div className="bg-gray-800 border border-gray-700/50 text-gray-100 p-4 md:p-5 rounded-2xl rounded-tl-none shadow-xl">
                  
                  {/* Metadata */}
                  <div className="mb-2 md:mb-3 space-y-1 md:space-y-1.5">
                    <div className="flex items-center text-[10px] md:text-xs font-medium text-pink-400 tracking-wide">
                       <Zap className="w-3 h-3 mr-1" />
                       {msg.emotion}
                    </div>
                    <div className="flex items-center text-xs md:text-sm text-gray-300 italic bg-gray-900/50 p-1.5 md:p-2 rounded-lg border border-gray-700/30">
                       <Heart className="w-3 h-3 md:w-3.5 md:h-3.5 mr-1.5 text-pink-600 flex-shrink-0" />
                       <span className="truncate">{msg.sensory}</span>
                    </div>
                  </div>

                  {/* Main Text */}
                  <p className="text-sm md:text-base leading-relaxed text-white/90">{msg.content}</p>
                </div>

                {/* Actions */}
                <button 
                   onClick={() => handlePlayAudio(msg.content, idx)}
                   className={`absolute -top-2 -right-2 md:-top-3 md:-right-3 w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95 z-10
                     ${playingAudioIndex === idx ? 'bg-yellow-500 text-gray-900 ring-2 ring-yellow-200/50' : 'bg-pink-600 hover:bg-pink-500 text-white'}
                   `}
                   disabled={loadingAudioIndex !== null}
                >
                   {loadingAudioIndex === idx ? (
                     <Loader2 className="w-3.5 h-3.5 md:w-4 md:h-4 animate-spin" />
                   ) : playingAudioIndex === idx ? (
                     <Volume2 className="w-3.5 h-3.5 md:w-4 md:h-4 animate-pulse fill-current" />
                   ) : (
                     <Volume2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                   )}
                </button>
              </div>
            ) : (
              <div className="text-xs text-center w-full text-gray-500">{msg.content}</div>
            )}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Flirt Coach (Premium Feature) */}
      {anyaProfile.isPremium && (
        <div className="bg-gray-800/90 backdrop-blur-md border-t border-gray-700 p-2 animate-fade-in-up shrink-0">
          {suggestions.length > 0 ? (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide px-2">
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => setInputText(s)} className="whitespace-nowrap text-xs bg-gray-700 hover:bg-gray-600 active:bg-gray-600 text-gray-200 px-3 py-2 rounded-full transition flex items-center flex-shrink-0">
                  <Copy className="w-3 h-3 mr-1 opacity-70"/> {s}
                </button>
              ))}
              <button onClick={fetchSuggestions} className="text-xs p-2 text-gray-400 hover:text-white flex-shrink-0"><RefreshCcw className="w-4 h-4" /></button>
            </div>
          ) : (
            <button 
              onClick={fetchSuggestions} 
              disabled={isLoadingSuggestions || messages.length < 2}
              className="w-full text-center text-xs text-indigo-400 hover:text-indigo-300 py-1 flex items-center justify-center disabled:opacity-50"
            >
              {isLoadingSuggestions ? <Loader2 className="w-3 h-3 animate-spin mr-1"/> : <Lightbulb className="w-3 h-3 mr-1"/>}
              Coach Suggestions
            </button>
          )}
        </div>
      )}

      {/* Input Area */}
      <div className="p-3 md:p-4 bg-gray-900 border-t border-gray-800 flex items-center gap-2 md:gap-3 shrink-0 pb-safe">
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Message..."
          className="flex-1 bg-gray-800 text-white placeholder-gray-500 rounded-full px-4 py-2.5 md:px-5 md:py-3 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-pink-500/50 border border-gray-700 transition-all"
          disabled={isGenerating}
        />
        <button
          onClick={handleSendMessage}
          disabled={!inputText.trim() || isGenerating}
          className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-pink-600 hover:bg-pink-500 active:scale-95 disabled:bg-gray-700 text-white flex items-center justify-center transition-all shadow-lg shadow-pink-900/20 shrink-0"
        >
          {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-0.5" />}
        </button>
      </div>
    </div>
  );
};

export default ChatInterface;