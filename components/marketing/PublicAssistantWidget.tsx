"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, Send, Sparkles, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { trackPublicEvent } from "@/lib/funnel/public-track";
import { readCookieConsent } from "@/lib/marketing/cookie-consent";
import {
  MARKETING_MOBILE_MEDIA_QUERY,
  subscribeMarketingCookieBannerState,
} from "@/lib/marketing/public-overlay-state";

type UiMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  ctaLabel?: string;
  ctaHref?: string;
  followUpSuggestions?: string[];
  sources?: Array<{ title: string; href: string }>;
};

type AssistantApiResponse = {
  answer?: string;
  follow_up_question?: string;
  follow_up_suggestions?: Array<string | null | undefined>;
  cta_label?: string;
  cta_href?: string;
  sources?: Array<{ title?: string; href?: string }>;
  error?: string;
};

const SESSION_KEY = "advaic_chat_session";
const HIDDEN_PREFIXES = [
  "/app",
  "/login",
  "/signup",
  "/impressum",
  "/datenschutz",
  "/nutzungsbedingungen",
  "/cookie-und-storage",
  "/unterauftragsverarbeiter",
];
const STARTER_QUESTIONS = [
  "Wann sendet Advaic automatisch und wann nicht?",
  "Wie starte ich konservativ mit möglichst wenig Risiko?",
  "Wie funktionieren Follow-ups in der Praxis?",
  "Passt Advaic für ein kleines Maklerbüro?",
];

function shouldHide(pathname: string) {
  return HIDDEN_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function nextId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function ensureSessionId() {
  if (typeof window === "undefined") return null;
  try {
    const existing = window.sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const created = nextId();
    window.sessionStorage.setItem(SESSION_KEY, created);
    return created;
  } catch {
    return null;
  }
}

function normalizeFollowupSuggestions(data: AssistantApiResponse) {
  const values = [
    ...(Array.isArray(data?.follow_up_suggestions)
      ? data.follow_up_suggestions
      : []),
    data?.follow_up_question,
  ];

  const seen = new Set<string>();
  const out: string[] = [];

  for (const raw of values) {
    const value = String(raw || "").replace(/\s+/g, " ").trim();
    if (!value || value.length < 12) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
    if (out.length >= 2) break;
  }

  return out;
}

export default function PublicAssistantWidget() {
  const pathname = usePathname() || "/";
  const hidden = shouldHide(pathname);

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [cookieBannerOpen, setCookieBannerOpen] = useState(false);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const greetedRef = useRef(false);

  const hasMessages = messages.length > 0;
  const canSend = !!input.trim() && !sending;

  const requestPayloadMessages = useMemo(
    () =>
      messages.slice(-10).map((m) => ({
        role: m.role,
        content: m.text,
      })),
    [messages],
  );

  useEffect(() => {
    if (hidden) return;
    ensureSessionId();
  }, [hidden]);

  useEffect(() => {
    if (hidden) return;

    const media = window.matchMedia(MARKETING_MOBILE_MEDIA_QUERY);
    const syncViewport = () => setIsMobileViewport(media.matches);
    syncViewport();

    setCookieBannerOpen(!readCookieConsent());
    const unsubscribeCookieBanner = subscribeMarketingCookieBannerState(
      setCookieBannerOpen,
    );

    media.addEventListener("change", syncViewport);
    return () => {
      media.removeEventListener("change", syncViewport);
      unsubscribeCookieBanner();
    };
  }, [hidden]);

  useEffect(() => {
    if (!open || greetedRef.current) return;
    greetedRef.current = true;
    setMessages([
      {
        id: nextId(),
        role: "assistant",
        text: "Hallo, ich bin Ihr Advaic-Assistent. Ich beantworte Fragen zu Advaic, zum Makleralltag und zu einem sicheren Start mit Autopilot und Freigabe.",
      },
    ]);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    textareaRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    scrollerRef.current?.scrollTo({
      top: scrollerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, sending, open]);

  useEffect(() => {
    if (!open) return;
    if (!cookieBannerOpen && !isMobileViewport) return;
    setOpen(false);
  }, [cookieBannerOpen, isMobileViewport, open]);

  const sendQuestion = async (value?: string) => {
    const raw = typeof value === "string" ? value : input;
    const userText = String(raw || "").trim();
    if (!userText || sending) return;

    setErrorText(null);
    setSending(true);

    const userMessage: UiMessage = {
      id: nextId(),
      role: "user",
      text: userText,
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");

    void trackPublicEvent({
      event: "marketing_chat_message_send",
      source: "website",
      pageGroup: "marketing",
      meta: {
        section: "public_assistant",
        path: pathname,
        message_preview: userText.slice(0, 800),
        message_chars: userText.length,
      },
    });

    try {
      const res = await fetch("/api/public/assistant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          path: pathname,
          messages: [...requestPayloadMessages, { role: "user", content: userText }].slice(-10),
        }),
      });

      const data = (await res.json().catch(() => ({}))) as AssistantApiResponse;
      if (!res.ok) {
        const message =
          data?.error === "rate_limited"
            ? "Sie haben gerade viele Anfragen gesendet. Bitte warten Sie kurz und versuchen Sie es erneut."
            : "Ich konnte gerade nicht antworten. Versuchen Sie es bitte gleich noch einmal.";
        throw new Error(message);
      }

      const answer = String(data?.answer || "").trim();
      const followUpSuggestions = normalizeFollowupSuggestions(data);

      const botMessage: UiMessage = {
        id: nextId(),
        role: "assistant",
        text:
          answer ||
          "Ich helfe Ihnen gern. Fragen Sie mich am besten konkret zu Autopilot, Freigabe, Follow-ups oder Setup.",
        ctaLabel: data?.cta_label ? String(data.cta_label) : undefined,
        ctaHref: data?.cta_href ? String(data.cta_href) : undefined,
        followUpSuggestions,
        sources: Array.isArray(data?.sources)
          ? data.sources
              .map((source) => ({
                title: String(source?.title || "").trim(),
                href: String(source?.href || "").trim(),
              }))
              .filter((source) => source.title && source.href)
              .slice(0, 3)
          : undefined,
      };

      setMessages((prev) => [...prev, botMessage]);

      void trackPublicEvent({
        event: "marketing_chat_message_response",
        source: "website",
        pageGroup: "marketing",
        meta: {
          section: "public_assistant",
          path: pathname,
          has_cta: Boolean(botMessage.ctaLabel && botMessage.ctaHref),
          answer_preview: botMessage.text.slice(0, 800),
          answer_chars: botMessage.text.length,
        },
      });
    } catch (err: any) {
      const message = String(err?.message || "Unerwarteter Fehler");
      setErrorText(message);
      setMessages((prev) => [
        ...prev,
        {
          id: nextId(),
          role: "assistant",
          text: "Aktuell gibt es ein technisches Problem. Schreib uns gern an support@advaic.com, dann helfen wir dir direkt weiter.",
        },
      ]);

      void trackPublicEvent({
        event: "marketing_chat_error",
        source: "website",
        pageGroup: "marketing",
        meta: {
          section: "public_assistant",
          path: pathname,
          message,
        },
      });
    } finally {
      setSending(false);
    }
  };

  const suppressWidget = hidden || cookieBannerOpen || isMobileViewport;

  if (suppressWidget) return null;

  return (
    <>
      {!open ? (
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            void trackPublicEvent({
              event: "marketing_chat_open",
              source: "website",
              pageGroup: "marketing",
              meta: {
                section: "public_assistant",
                path: pathname,
              },
            });
          }}
          className="fixed bottom-[92px] right-4 z-[80] inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 py-3 text-sm font-semibold text-[var(--text)] shadow-[var(--shadow-md)] transition hover:-translate-y-[1px] hover:ring-1 hover:ring-[var(--gold-soft)] md:bottom-6 md:right-6"
          aria-label="Advaic Assistent öffnen"
          data-tour="marketing-assistant-launcher"
        >
          <MessageCircle className="h-4 w-4 text-[var(--gold)]" />
          Frage an Advaic
        </button>
      ) : (
        <div
          className="fixed bottom-[92px] right-4 z-[80] w-[min(92vw,400px)] overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-[var(--shadow-md)] md:bottom-6 md:right-6"
          data-tour="marketing-assistant-panel"
        >
          <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] bg-[var(--surface-2)] px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-[var(--text)]">Advaic Assistent</p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Schnellantworten zu Produkt, Makleralltag und sicherem Setup
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg p-1.5 text-[var(--muted)] transition hover:bg-white hover:text-[var(--text)]"
              aria-label="Assistent schließen"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div
            ref={scrollerRef}
            className="max-h-[52vh] space-y-3 overflow-y-auto bg-white px-4 py-4"
          >
            {!hasMessages ? (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-sm text-[var(--muted)]">
                Starte mit einer Frage, zum Beispiel: Wann läuft Autopilot, wann geht es zur Freigabe?
              </div>
            ) : null}

            {messages.map((message) => (
              <article
                key={message.id}
                className={
                  message.role === "user"
                    ? "ml-auto max-w-[92%] rounded-xl bg-[var(--black)] px-3 py-2 text-sm text-white"
                    : "max-w-[95%] rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text)]"
                }
              >
                <p className="whitespace-pre-line leading-6">{message.text}</p>
                {message.role === "assistant" && message.ctaLabel && message.ctaHref ? (
                  <div className="mt-3">
                    <Link
                      href={message.ctaHref}
                      className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] bg-white px-2.5 py-1.5 text-xs font-semibold text-[var(--text)] transition hover:ring-1 hover:ring-[var(--gold-soft)]"
                      onClick={() => {
                        void trackPublicEvent({
                          event: "marketing_chat_cta_click",
                          source: "website",
                          pageGroup: "marketing",
                          meta: {
                            section: "public_assistant",
                            path: pathname,
                            target: message.ctaHref,
                          },
                        });
                      }}
                    >
                      <Sparkles className="h-3.5 w-3.5 text-[var(--gold)]" />
                      {message.ctaLabel}
                    </Link>
                  </div>
                ) : null}
                {message.role === "assistant" && message.followUpSuggestions?.length ? (
                  <div className="mt-3 border-t border-[var(--border)] pt-2">
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--muted)]">
                      Weiter fragen
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {message.followUpSuggestions.map((question) => (
                        <button
                          key={`${message.id}_${question}`}
                          type="button"
                          onClick={() => {
                            void trackPublicEvent({
                              event: "marketing_chat_followup_chip_click",
                              source: "website",
                              pageGroup: "marketing",
                              meta: {
                                section: "public_assistant",
                                path: pathname,
                                question,
                              },
                            });
                            void sendQuestion(question);
                          }}
                          disabled={sending}
                          className="rounded-full border border-[var(--border)] bg-white px-2.5 py-1 text-[11px] text-[var(--text)] transition hover:ring-1 hover:ring-[var(--gold-soft)] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {question}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
                {message.role === "assistant" && message.sources?.length ? (
                  <div className="mt-3 border-t border-[var(--border)] pt-2">
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--muted)]">
                      Quellen
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {message.sources.map((source) => (
                        <Link
                          key={`${message.id}_${source.href}`}
                          href={source.href}
                          className="rounded-md border border-[var(--border)] bg-white px-2 py-1 text-[11px] text-[var(--muted)] transition hover:text-[var(--text)] hover:ring-1 hover:ring-[var(--gold-soft)]"
                          onClick={() => {
                            void trackPublicEvent({
                              event: "marketing_chat_source_click",
                              source: "website",
                              pageGroup: "marketing",
                              meta: {
                                section: "public_assistant",
                                path: pathname,
                                target: source.href,
                              },
                            });
                          }}
                        >
                          {source.title}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : null}
              </article>
            ))}

            {sending ? (
              <div className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--muted)]">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--gold)]" />
                Antwort wird erstellt...
              </div>
            ) : null}
          </div>

          <div className="border-t border-[var(--border)] bg-white px-4 py-3">
            {!hasMessages ? (
              <div className="mb-3 flex flex-wrap gap-2">
                {STARTER_QUESTIONS.map((question) => (
                  <button
                    key={question}
                    type="button"
                    onClick={() => {
                      void sendQuestion(question);
                    }}
                    className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-xs text-[var(--text)] transition hover:ring-1 hover:ring-[var(--gold-soft)]"
                  >
                    {question}
                  </button>
                ))}
              </div>
            ) : null}

            <div className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void sendQuestion();
                  }
                }}
                rows={2}
                placeholder="Stellen Sie Ihre Frage..."
                className="min-h-[44px] flex-1 resize-none rounded-xl border border-[var(--border)] px-3 py-2 text-sm text-[var(--text)] outline-none transition focus:ring-2 focus:ring-[var(--gold-soft)]"
              />
              <button
                type="button"
                onClick={() => {
                  void sendQuestion();
                }}
                disabled={!canSend}
                className="inline-flex h-[44px] items-center justify-center rounded-xl bg-[var(--black)] px-3 text-white transition hover:ring-1 hover:ring-[var(--gold)] disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Nachricht senden"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-2 text-[11px] text-[var(--muted)]">
              Keine Rechts-, Steuer- oder Finanzberatung. Bei sensiblen Themen bitte fachlich prüfen.
            </p>
            {errorText ? (
              <p className="mt-1 text-[11px] text-red-600">{errorText}</p>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}
