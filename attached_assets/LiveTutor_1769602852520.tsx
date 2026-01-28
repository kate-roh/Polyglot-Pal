
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { Language, TranscriptionItem } from '../types';
import { encode, decode, decodeAudioData, createBlob } from '../services/audioUtils';

interface LiveTutorProps {
  targetLanguage: Language;
}

const LiveTutor: React.FC<LiveTutorProps> = ({ targetLanguage }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcriptions, setTranscriptions] = useState<TranscriptionItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const sessionRef = useRef<any>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const transcriptionRef = useRef<{ user: string; ai: string }>({ user: '', ai: '' });

  const startSession = async () => {
    try {
      setIsConnecting(true);
      setError(null);

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      inputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            setIsConnecting(false);
            
            const source = inputAudioCtxRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioCtxRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              if (isMuted) return;
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioCtxRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Audio
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && outputAudioCtxRef.current) {
              const ctx = outputAudioCtxRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
              source.onended = () => sourcesRef.current.delete(source);
            }

            // Handle Transcriptions
            if (message.serverContent?.inputTranscription) {
              transcriptionRef.current.user += message.serverContent.inputTranscription.text;
            }
            if (message.serverContent?.outputTranscription) {
              transcriptionRef.current.ai += message.serverContent.outputTranscription.text;
            }

            if (message.serverContent?.turnComplete) {
              setTranscriptions(prev => [
                ...prev,
                { speaker: 'user', text: transcriptionRef.current.user, timestamp: new Date() },
                { speaker: 'ai', text: transcriptionRef.current.ai, timestamp: new Date() }
              ]);
              transcriptionRef.current = { user: '', ai: '' };
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => {
            console.error(e);
            setError("Connection error occurred.");
            stopSession();
          },
          onclose: () => {
            setIsConnected(false);
            setIsConnecting(false);
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
          },
          systemInstruction: `You are a professional language tutor specializing in ${targetLanguage.name}. 
          Your goal is to help the user practice speaking. Keep responses encouraging, corrections gentle, and maintain a conversational flow. 
          Use ${targetLanguage.name} primarily, but provide English translations for difficult phrases if needed.`,
          inputAudioTranscription: {},
          outputAudioTranscription: {}
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      setError("Could not start audio session. Check permissions.");
      setIsConnecting(false);
    }
  };

  const stopSession = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (inputAudioCtxRef.current) {
      inputAudioCtxRef.current.close();
      inputAudioCtxRef.current = null;
    }
    if (outputAudioCtxRef.current) {
      outputAudioCtxRef.current.close();
      outputAudioCtxRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
  };

  useEffect(() => {
    return () => stopSession();
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] gap-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-0">
        <div className="flex-1 flex flex-col glass rounded-3xl p-6 shadow-sm overflow-hidden border-2 border-indigo-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isConnected ? 'bg-green-400' : 'bg-slate-400'} opacity-75`}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 ${isConnected ? 'bg-green-500' : 'bg-slate-500'}`}></span>
              </span>
              Session Status: {isConnected ? 'Live' : 'Inactive'}
            </h3>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsMuted(!isMuted)}
                className={`p-3 rounded-full transition-colors ${isMuted ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                <i className={`fas ${isMuted ? 'fa-microphone-slash' : 'fa-microphone'}`}></i>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 px-2 pb-4 scroll-smooth">
            {transcriptions.length === 0 && !isConnected && (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mb-4">
                  <i className="fas fa-comment-dots text-3xl"></i>
                </div>
                <h4 className="text-lg font-bold text-slate-800 mb-2">Start your conversation</h4>
                <p className="text-slate-500 max-w-sm">Connect with your AI tutor to practice speaking {targetLanguage.name} in real-time.</p>
              </div>
            )}
            {transcriptions.map((t, i) => (
              <div key={i} className={`flex ${t.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-4 rounded-2xl ${
                  t.speaker === 'user' 
                    ? 'bg-indigo-600 text-white rounded-br-none shadow-md' 
                    : 'bg-white text-slate-800 rounded-bl-none shadow-sm border border-slate-100'
                }`}>
                  <p className="text-sm md:text-base leading-relaxed">{t.text}</p>
                  <span className={`text-[10px] mt-1 block opacity-60`}>
                    {t.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            {isConnecting && (
              <div className="flex justify-start">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-75"></div>
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-150"></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 flex gap-4">
            {!isConnected ? (
              <button
                onClick={startSession}
                disabled={isConnecting}
                className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-indigo-200"
              >
                {isConnecting ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Connecting...
                  </>
                ) : (
                  <>
                    <i className="fas fa-phone-alt"></i>
                    Start Practice Session
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={stopSession}
                className="flex-1 py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all"
              >
                <i className="fas fa-phone-slash"></i>
                End Session
              </button>
            )}
          </div>
        </div>

        <div className="md:w-80 glass rounded-3xl p-6 shadow-sm border border-slate-100 overflow-y-auto">
          <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
            <i className="fas fa-lightbulb text-yellow-500"></i>
            Tutor Notes
          </h4>
          <div className="space-y-4">
            <div className="p-4 bg-indigo-50 rounded-2xl">
              <p className="text-sm font-bold text-indigo-700 mb-1">Current Focus</p>
              <p className="text-sm text-indigo-900">Conversational fillers and natural flow.</p>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-bold text-slate-600 uppercase tracking-widest">Recommended Topics</p>
              {[
                "Daily routine in Korea",
                "Favorite travel destinations",
                "Ordering food at a restaurant",
                "Explaining your hobbies"
              ].map((topic, i) => (
                <button key={i} className="w-full text-left p-3 text-sm rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all text-slate-700">
                  {topic}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <i className="fas fa-exclamation-circle"></i>
            <span className="font-medium">{error}</span>
          </div>
          <button onClick={() => setError(null)}>
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}
    </div>
  );
};

export default LiveTutor;
