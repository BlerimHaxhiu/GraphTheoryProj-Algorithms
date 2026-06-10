'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bot, GraduationCap, MessageCircle, RotateCcw, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/use-language';
import type { AlgorithmStep, AlgorithmType, Edge, Node } from '@/types/graph';
import {
  generateChatbotResponse,
  getSuggestedQuestions,
  type ChatbotMessage,
  type ChatbotMode,
} from '@/lib/chatbot-responses';
import { parseChatbotCommand } from '@/lib/chatbot-command-parser';
import {
  executeChatbotAction,
  type ChatbotAutomationContext,
} from '@/lib/chatbot-action-handler';

type ChatbotAutomationProps = Omit<ChatbotAutomationContext, 'language'>;

interface GraphChatbotProps {
  selectedAlgorithm: AlgorithmType | null;
  nodes: Node[];
  edges: Edge[];
  startNodeId?: string | null;
  endNodeId?: string | null;
  currentStep?: AlgorithmStep | null;
  automation?: ChatbotAutomationProps;
}

function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function GraphChatbot({
  selectedAlgorithm,
  nodes,
  edges,
  startNodeId,
  endNodeId,
  currentStep,
  automation,
}: GraphChatbotProps) {
  const { t, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<ChatbotMode>('assistant');
  const [messages, setMessages] = useState<ChatbotMessage[]>([]);
  const scrollViewportRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const welcomeText = mode === 'mentor' ? t('chatbot.mentorWelcome') : t('chatbot.welcome');

  useEffect(() => {
    // Seed (or refresh) the welcome message only while the conversation hasn't
    // really started — so switching language or mode updates the greeting, but
    // an ongoing chat is never wiped.
    setMessages(prev => {
      if (prev.length <= 1) {
        return [
          {
            id: createId(),
            role: 'assistant',
            text: welcomeText,
            timestamp: Date.now(),
          },
        ];
      }
      return prev;
    });
  }, [welcomeText]);

  useEffect(() => {
    if (!isOpen) return;
    const viewport = scrollViewportRef.current;
    if (!viewport) return;
    const distanceFromBottom =
      viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
    const userIsAtBottom = distanceFromBottom < 80;
    if (userIsAtBottom) {
      viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
    }
  }, [isOpen, messages]);

  useEffect(() => {
    if (isOpen) {
      const timeout = setTimeout(() => inputRef.current?.focus(), 80);
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  const suggestions = useMemo(
    () => getSuggestedQuestions(language, selectedAlgorithm, mode),
    [language, selectedAlgorithm, mode]
  );

  const handleSend = useCallback(
    (raw: string) => {
      const text = raw.trim();
      if (!text) return;

      const userMessage: ChatbotMessage = {
        id: createId(),
        role: 'user',
        text,
        timestamp: Date.now(),
      };

      let reply: string | null = null;

      if (automation) {
        const action = parseChatbotCommand(text, {
          availableLabels: nodes.map(n => n.label),
        });
        if (action.type !== 'EXPLAIN_ONLY' && action.type !== 'UNKNOWN') {
          const result = executeChatbotAction(action, { ...automation, language });
          if (result.handled) {
            reply = result.message;
          }
        }
      }

      if (reply === null) {
        reply = generateChatbotResponse(text, {
          language,
          selectedAlgorithm,
          nodes,
          edges,
          startNodeId: startNodeId ?? null,
          endNodeId: endNodeId ?? null,
          currentStep: currentStep ?? null,
        });
      }

      const assistantMessage: ChatbotMessage = {
        id: createId(),
        role: 'assistant',
        text: reply,
        timestamp: Date.now() + 1,
      };

      setMessages(prev => [...prev, userMessage, assistantMessage]);
      setInput('');
    },
    [language, selectedAlgorithm, nodes, edges, startNodeId, endNodeId, currentStep, automation]
  );

  const handleClear = useCallback(() => {
    setMessages([
      {
        id: createId(),
        role: 'assistant',
        text: welcomeText,
        timestamp: Date.now(),
      },
    ]);
  }, [welcomeText]);

  const handleScrollAreaRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) {
      scrollViewportRef.current = null;
      return;
    }
    const viewport = node.querySelector<HTMLDivElement>(
      '[data-radix-scroll-area-viewport]'
    );
    scrollViewportRef.current = viewport;
  }, []);

  return (
    <>
      <button
        type="button"
        aria-label={t('chatbot.open')}
        aria-expanded={isOpen}
        onClick={() => setIsOpen(prev => !prev)}
        className={cn(
          'fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full',
          'bg-primary text-primary-foreground shadow-lg ring-1 ring-primary/30',
          'transition-all duration-200 hover:scale-105 hover:shadow-xl',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          isOpen && 'scale-95 opacity-0 pointer-events-none'
        )}
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="false"
          aria-label={t('chatbot.title')}
          className={cn(
            'fixed z-50 flex flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-2xl',
            'animate-in fade-in slide-in-from-bottom-4 duration-200',
            'inset-x-3 bottom-3 h-[80vh] max-h-[80vh]',
            'sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[380px] sm:max-w-[calc(100vw-3rem)] sm:h-[560px] sm:max-h-[80vh]'
          )}
        >
          <header className="flex shrink-0 items-center justify-between gap-2 border-b border-border/70 bg-gradient-to-r from-primary/15 via-primary/5 to-transparent px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-primary">
                {mode === 'mentor' ? (
                  <GraduationCap className="h-5 w-5" />
                ) : (
                  <Bot className="h-5 w-5" />
                )}
              </span>
              <div className="flex flex-col">
                <span className="text-sm font-semibold leading-tight">{t('chatbot.title')}</span>
                <span className="text-[11px] text-muted-foreground leading-tight">
                  {mode === 'mentor' ? t('chatbot.mentorSubtitle') : t('chatbot.subtitle')}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleClear}
                aria-label={t('chatbot.clear')}
                title={t('chatbot.clear')}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsOpen(false)}
                aria-label={t('chatbot.close')}
                title={t('chatbot.close')}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </header>

          <div
            className="flex shrink-0 items-center gap-1 border-b border-border/60 bg-background/40 px-3 py-2"
            role="tablist"
            aria-label={t('chatbot.modeSwitchLabel')}
          >
            {(['assistant', 'mentor'] as ChatbotMode[]).map(m => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => setMode(m)}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  mode === m
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-primary/10 hover:text-foreground'
                )}
              >
                {m === 'mentor' ? (
                  <GraduationCap className="h-3.5 w-3.5" />
                ) : (
                  <Bot className="h-3.5 w-3.5" />
                )}
                {m === 'mentor' ? t('chatbot.modeMentor') : t('chatbot.modeAssistant')}
              </button>
            ))}
          </div>

          <div className="min-h-0 flex-1 bg-background/40">
            <ScrollArea ref={handleScrollAreaRef} className="h-full w-full">
              <div className="flex flex-col gap-3 px-4 py-4">
                {messages.map(message => (
                  <MessageBubble key={message.id} message={message} />
                ))}
              </div>
            </ScrollArea>
          </div>

          <div className="shrink-0 border-t border-border/70 bg-background/60 px-3 py-2">
            <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {t('chatbot.suggestionsTitle')}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map(suggestion => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handleSend(suggestion)}
                  className={cn(
                    'rounded-full border border-border bg-card/80 px-2.5 py-1 text-xs text-muted-foreground',
                    'transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-foreground',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                  )}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          <form
            className="flex shrink-0 items-center gap-2 border-t border-border/70 bg-card px-3 py-2"
            onSubmit={event => {
              event.preventDefault();
              handleSend(input);
            }}
          >
            <Input
              ref={inputRef}
              value={input}
              onChange={event => setInput(event.target.value)}
              placeholder={t('chatbot.placeholder')}
              className="h-9 flex-1 rounded-full border-border/60 bg-background"
              autoComplete="off"
            />
            <Button
              type="submit"
              size="icon"
              className="h-9 w-9 rounded-full"
              disabled={!input.trim()}
              aria-label={t('chatbot.send')}
              title={t('chatbot.send')}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}

function MessageBubble({ message }: { message: ChatbotMessage }) {
  const isUser = message.role === 'user';
  return (
    <div className={cn('flex w-full', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm shadow-sm',
          isUser
            ? 'bg-primary text-primary-foreground rounded-br-md'
            : 'bg-muted text-foreground rounded-bl-md border border-border/60'
        )}
      >
        {message.text}
      </div>
    </div>
  );
}
