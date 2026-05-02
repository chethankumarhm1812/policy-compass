import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, Send, Mic, MicOff, Volume2 } from 'lucide-react';
import { PolicyQueryRequest, UserProfile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { queryPolicyPipeline } from '@/lib/policyQuery';
import { fetchUserProfile } from '@/lib/profileService';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const translations = {
  en: {
    title: 'PolicyLens AI Assistant',
    subtitle: 'Ask anything about government policies and eligibility.',
    allowProfileLabel: 'Allow AI to use my saved profile details for personalized answers.',
    profileUsed: 'Your profile will be used to personalize AI responses.',
    profileNotUsed: 'AI will not use your saved profile details.',
    placeholder: 'Ask about any policy...',
    suggestions: [
      'What policies am I eligible for?',
      'How can I apply for PM Kisan?',
      'Show me health insurance schemes',
      'I am a farmer, what benefits can I get?',
    ],
    languageLabel: 'Language',
    english: 'English',
    kannada: 'Kannada',
    loadingProfile: 'Loading your profile...',
    startListening: 'Start voice chat',
    stopListening: 'Stop listening',
    voiceOn: 'Speak responses',
    voiceOff: 'Mute responses',
    voiceNotSupported: 'Voice is not supported in this browser.',
    listening: 'Listening... Speak now.',
    saySomething: 'Press the mic and ask in English or Kannada.',
  },
  kn: {
    title: 'PolicyLens AI ಸಹಾಯಕ',
    subtitle: 'ಸರ್ಕಾರದ ಯೋಜನೆಗಳು ಮತ್ತು ಅರ್ಹತೆ ಬಗ್ಗೆ ಏನೆಲ್ಲಾ ಕೇಳಬಹುದು.',
    allowProfileLabel: 'ವೈಯಕ್ತಿಕ ಉತ್ತರಗಳಿಗಾಗಿ ನನ್ನ ಸಂಗ್ರಹಿಸಿದ ಪ್ರೊಫೈಲ್ ವಿವರಗಳನ್ನು AI ಬಳಸಲು ಅನುಮತಿಸಿ.',
    profileUsed: 'ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ವಿವರಗಳು AI ಉತ್ತರಗಳನ್ನು ವೈಯಕ್ತಿಕಗೊಳಿಸಲು ಬಳಸಲಾಗುತ್ತದೆ.',
    profileNotUsed: 'AI ನಿಮ್ಮ ಸಂಗ್ರಹಿಸಿದ ಪ್ರೊಫೈಲ್ ವಿವರಗಳನ್ನು ಬಳಸುವುದಿಲ್ಲ.',
    placeholder: 'ಯಾವುದಾದರೂ ಯೋಜನೆಯ ಬಗ್ಗೆ ಕೇಳಿ...',
    suggestions: [
      'ನಾನು ಯಾವ ಯೋಜನೆಗಳಿಗೆ ಅರ್ಹನಾಗಿದ್ದೇನೆ?',
      'ನಾನು PM Kisan ಗೆ ಹೇಗೆ ಅರ್ಜಿ ಹಾಕಬಹುದು?',
      'ಆರೋಗ್ಯ ವಿಮಾ ಯೋಜನೆಗಳನ್ನು ತೋರಿಸಿ',
      'ನಾನು ರೈತ, ನನಗೆ ಯಾವ ಪ್ರಯೋಜನಗಳು ಸಿಗುತ್ತವೆ?',
    ],
    languageLabel: 'ಭಾಷೆ',
    english: 'ಆಂಗ್ಲ',
    kannada: 'ಕನ್ನಡ',
    loadingProfile: 'ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ಲೋಡ್ ಆಗುತ್ತಿದೆ...',
    startListening: 'ವಾಯ್ಸ್ ಚಾಟ್ ಆರಂಭಿಸಿ',
    stopListening: 'ಶ್ರವಣ ಸ್ಥಗಿತ ಮಾಡಿ',
    voiceOn: 'ಉತ್ತರಗಳನ್ನು ಮಾತನಾಡಿಸಿ',
    voiceOff: 'ಉತ್ತರಗಳನ್ನು ಮೌನಗೊಳಿಸಿ',
    voiceNotSupported: 'ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ವಾಯ್ಸ್ ಬೆಂಬಲ ಇಲ್ಲ.',
    listening: 'ಶ್ರವಣೆ ಮಾಡುತ್ತಿದೆ... ಈಗ ಮಾತನಾಡಿ.',
    saySomething: 'ಮೈಕ್ ಒತ್ತಿ ಮತ್ತು ಆಂಗ್ಲ ಅಥವಾ ಕನ್ನಡದಲ್ಲಿ ಕೇಳಿ.',
  },
};

export default function ChatPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({});
  const [profilePermission, setProfilePermission] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [language, setLanguage] = useState<'en' | 'kn'>('en');
  const [listening, setListening] = useState(false);
  const [recognitionSupported, setRecognitionSupported] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const messagesRef = useRef<ChatMessage[]>([]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (!user?.id) return;

    const loadProfile = async () => {
      setProfileLoading(true);
      try {
        const { data } = await fetchUserProfile(user.id);
        if (data) setProfile(data as UserProfile);
      } catch (error) {
        console.error('Failed to load profile:', error);
      } finally {
        setProfileLoading(false);
      }
    };

    loadProfile();
  }, [user?.id]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setRecognitionSupported(false);
      return;
    }

    setRecognitionSupported(true);
    const recognition = new SpeechRecognition();
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.lang = language === 'kn' ? 'kn-IN' : 'en-US';

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setListening(false);
      if (transcript.trim()) {
        send(transcript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setListening(false);
      toast({
        title: 'Voice error',
        description: 'Could not recognize speech. Please try again.',
        variant: 'destructive',
      });
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop?.();
    };
  }, [language, toast]);

  useEffect(() => {
    if (!speechEnabled || !messages.length) return;

    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== 'assistant') return;

    const utterance = new SpeechSynthesisUtterance(lastMessage.content);
    utterance.lang = language === 'kn' ? 'kn-IN' : 'en-US';

    const voices = window.speechSynthesis.getVoices();
    const selectedVoice = voices.find((voice) => voice.lang.startsWith(language === 'kn' ? 'kn' : 'en'));
    if (selectedVoice) utterance.voice = selectedVoice;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, [messages, speechEnabled, language]);

  const startVoiceChat = () => {
    if (!recognitionSupported || !recognitionRef.current) return;
    try {
      recognitionRef.current.lang = language === 'kn' ? 'kn-IN' : 'en-US';
      recognitionRef.current.start();
      setListening(true);
    } catch (error) {
      console.error('Speech recognition failed to start:', error);
      setListening(false);
      toast({
        title: 'Voice error',
        description: 'Unable to start voice chat. Please refresh or use a supported browser.',
        variant: 'destructive',
      });
    }
  };

  const stopVoiceChat = () => {
    recognitionRef.current?.stop?.();
    setListening(false);
  };

  const toggleVoiceChat = () => {
    if (listening) {
      stopVoiceChat();
    } else {
      startVoiceChat();
    }
  };

  const send = async (text?: string) => {
    const msg = text || input;
    if (!msg.trim() || loading) return;
    setInput('');

    const userMessage: ChatMessage = {
      id: `${Date.now()}-${Math.random()}`,
      role: 'user',
      content: msg,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const chatHistory = messagesRef.current
        .slice(-5)
        .map((m) => ({ role: m.role, content: m.content }));

      const requestBody: PolicyQueryRequest = {
        query: msg,
        user_id: user?.id,
        allow_profile_access: profilePermission,
        language,
        top_k: 5,
        chat_history: chatHistory,
      };

      if (profilePermission && Object.keys(profile).length > 0) {
        requestBody.user_profile = profile;
      }

      const payload = await queryPolicyPipeline(requestBody);

      if (!payload.success || !payload.data) {
        throw new Error(payload.error || 'No response from assistant');
      }

      const assistantMessage: ChatMessage = {
        id: `${Date.now()}-${Math.random()}`,
        role: 'assistant',
        content: payload.data.answer.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to reach the assistant',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const text = translations[language];

  const suggestions = text.suggestions;

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
                    <h2 className="text-2xl font-bold mb-2">{text.title}</h2>
            <p className="text-muted-foreground mb-6">{text.subtitle}</p>
            <div className="flex flex-wrap justify-center gap-2">
              {suggestions.map((item) => (
                <Button key={item} variant="outline" size="sm" onClick={() => send(item)}>
                  {item}
                </Button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
            <Card className={`max-w-[85%] p-4 ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card'}`}>
              <p className="whitespace-pre-wrap">{message.content}</p>
            </Card>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <Card className="p-4 bg-card flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{language === 'kn' ? 'ಆಲೋಚಿಸುತ್ತಿದೆ...' : 'Thinking...'}</p>
            </Card>
          </div>
        )}

        <div ref={scrollRef} />
      </div>

      <div className="p-4 border-t border-border bg-background">
        <div className="mb-3 flex flex-col gap-3 text-sm text-muted-foreground">
          <div className="flex flex-wrap items-center gap-3">
            <span>{text.languageLabel}:</span>
            <Button
              variant={language === 'en' ? 'secondary' : 'outline'}
              className="h-8 px-3"
              onClick={() => setLanguage('en')}
            >
              {text.english}
            </Button>
            <Button
              variant={language === 'kn' ? 'secondary' : 'outline'}
              className="h-8 px-3"
              onClick={() => setLanguage('kn')}
            >
              {text.kannada}
            </Button>
          </div>

          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={profilePermission}
              onChange={(e) => setProfilePermission(e.target.checked)}
              className="h-4 w-4 rounded border border-muted-foreground text-primary focus:ring-primary"
            />
            {text.allowProfileLabel}
          </label>
          {profileLoading ? (
            <span>{text.loadingProfile}</span>
          ) : profilePermission && Object.keys(profile).length > 0 ? (
            <span>{text.profileUsed}</span>
          ) : (
            <span>{text.profileNotUsed}</span>
          )}
        </div>
        <div className="mb-3 flex flex-col gap-2 text-sm text-muted-foreground">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={listening ? 'destructive' : 'secondary'}
              className="h-8 px-3"
              onClick={toggleVoiceChat}
              disabled={!recognitionSupported || loading}
            >
              {listening ? <MicOff className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}
              {listening ? text.stopListening : text.startListening}
            </Button>
            <Button
              variant={speechEnabled ? 'secondary' : 'outline'}
              className="h-8 px-3"
              onClick={() => setSpeechEnabled((prev) => !prev)}
            >
              <Volume2 className="mr-2 h-4 w-4" />
              {speechEnabled ? text.voiceOn : text.voiceOff}
            </Button>
            {!recognitionSupported && (
              <span className="text-xs text-foreground/70">{text.voiceNotSupported}</span>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            {listening ? text.listening : text.saySomething}
          </div>
        </div>
        <div className="flex gap-2">
          <Input
            className="flex-1"
            placeholder={text.placeholder}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
            disabled={loading}
          />
          <Button onClick={() => send()} disabled={loading || !input.trim()} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
