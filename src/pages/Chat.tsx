/**
 * CHAT PAGE WITH 3-LAYER OUTPUT
 *
 * Uses the policy-query RAG pipeline:
 * 1. Query embedding + RAG retrieval
 * 2. PPRAG policy processing
 * 3. LLM answer generation
 */

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, Send } from 'lucide-react';
import { LLMResponse, PolicyQueryRequest, UserProfile } from '@/lib/types';
import { queryPolicyPipeline } from '@/lib/policyQuery';
import { useToast } from '@/hooks/use-toast';
import { fetchUserProfile } from '@/lib/profileService';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  llmResponse?: LLMResponse;
}

export default function ChatPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<Partial<UserProfile> | null>(null);
  const [expandedDetailsId, setExpandedDetailsId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      try {
        const { data, error } = await fetchUserProfile(user.id);
        
        if (error) {
          // PGRST116 = "no rows" - this is expected for new users
          if (error.code !== 'PGRST116') {
            console.error('Profile fetch error:', error);
          } else {
            console.log('No profile found yet (new user)');
          }
          return;
        }
        
        if (data) setUserProfile(data as Partial<UserProfile>);
      } catch (err) {
        console.error('Unexpected error fetching profile:', err);
      }
    };
    
    fetchProfile();
  }, [user]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

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
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) {
        throw new Error('Missing Supabase environment variables.');
      }

      const requestBody: PolicyQueryRequest = {
        query: msg,
        user_profile: userProfile || undefined,
        top_k: 5,
      };

      const payload = await queryPolicyPipeline(requestBody);
      if (!payload.success || !payload.data) {
        throw new Error(payload.error || 'Policy assistant returned invalid data');
      }

      const assistantMessage: ChatMessage = {
        id: `${Date.now()}-${Math.random()}`,
        role: 'assistant',
        content: payload.data.answer.trim(),
        timestamp: new Date(),
        llmResponse: payload.data,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to reach the policy assistant',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    'What policies am I eligible for?',
    'How can I apply for PM Kisan?',
    'Show me health insurance schemes',
    'I am a farmer, what benefits can I get?',
  ];

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-2">PolicyLens AI Assistant</h2>
            <p className="text-muted-foreground mb-6">Ask anything about government policies and eligibility.</p>
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
              <div className="space-y-4">
                <p>{message.content}</p>
                {message.llmResponse && (
                  <div className="rounded-2xl border border-muted p-4 bg-muted/20">
                    <div className="mb-3 text-sm font-semibold">Policy Assistant Details</div>
                    <div className="space-y-2 text-sm">
                      <p>{message.llmResponse.explanation.why_eligible}</p>
                      {message.llmResponse.explanation.missing_requirements && (
                        <p className="text-warning">Missing: {message.llmResponse.explanation.missing_requirements}</p>
                      )}
                      <p className="text-muted-foreground">Next steps: {message.llmResponse.explanation.next_steps}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-3"
                      onClick={() => setExpandedDetailsId(expandedDetailsId === message.id ? null : message.id)}
                    >
                      {expandedDetailsId === message.id ? 'Hide full details' : 'Show full policy details'}
                    </Button>
                    {expandedDetailsId === message.id && (
                      <div className="mt-3 space-y-3 text-sm">
                        {message.llmResponse.full_details.processed_policies.map((policy) => (
                          <div key={policy.policy_id} className="rounded-xl border border-border p-3 bg-background">
                            <p className="font-semibold">{policy.policy_name}</p>
                            <p>{policy.eligibility_summary} • {policy.benefits_summary}</p>
                            <p className="text-xs text-muted-foreground">Key conditions: {policy.key_conditions.join(', ')}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mt-1 text-primary">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
            <Card className="p-4 bg-card">
              <p className="text-sm text-muted-foreground">Thinking...</p>
            </Card>
          </div>
        )}

        <div ref={scrollRef} />
      </div>

      <div className="p-4 border-t border-border bg-background">
        <div className="flex gap-2">
          <Input
            className="flex-1"
            placeholder="Ask about any policy..."
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') send();
            }}
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
