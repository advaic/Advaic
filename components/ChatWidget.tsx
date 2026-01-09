"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// 💬 Chatbot Component
export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [messages, setMessages] = useState<
    { sender: "user" | "bot"; text: string }[]
  >([]);
  const [input, setInput] = useState("");
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  // Create persistent session ID
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.localStorage.getItem("advaic_session")) {
      const newId = crypto.randomUUID();
      window.localStorage.setItem("advaic_session", newId);
    }
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Greeting message when chat opens
  useEffect(() => {
    if (isOpen && !hasGreeted) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "Hallo! 👋 Ich bin der Advaic‑Assistant. Wie kann ich dir helfen?",
        },
      ]);
      setHasGreeted(true);
    }
  }, [isOpen, hasGreeted]);

  // Send message to Make
  async function sendMessage() {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages((prev) => [...prev, { sender: "user", text: userMessage }]);
    setInput("");
    setIsBotTyping(true);

    try {
      const sessionId =
        typeof window !== "undefined"
          ? window.localStorage.getItem("advaic_session")
          : null;

      const response = await fetch(
        "https://hook.eu2.make.com/f06jt1knx6bhwt0ftpp6wmfpedqfwm2a",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: userMessage,
            session_id: sessionId,
          }),
        }
      );

      // always read as text first
      const raw = await response.text();
      setIsBotTyping(false);

      let replyText = raw;

      // try-parse JSON safely
      try {
        const parsed = JSON.parse(raw);

        if (typeof parsed === "string") {
          replyText = parsed;
        } else if (parsed && typeof parsed.reply === "string") {
          replyText = parsed.reply;
        }
      } catch (parseErr) {
        // fallback: try to extract reply manually
        const match = raw.match(/"reply"\s*:\s*"([\s\S]*)"/);
        if (match && match[1]) {
          replyText = match[1];
        } else {
          console.warn("Invalid JSON from webhook, using raw text:", raw);
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: replyText || "Es gab ein Problem bei der Antwort.",
        },
      ]);
    } catch (error) {
      console.error("Chatbot error:", error);
      setIsBotTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "Technisches Problem. Bitte später erneut versuchen.",
        },
      ]);
    }
  }

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.07 }}
        className="fixed bottom-6 right-6 z-50 bg-white/70 backdrop-blur-xl border border-[#E5C97B]/60 shadow-advaicLg w-14 h-14 rounded-full flex items-center justify-center hover:shadow-advaicLg transition-all duration-300 text-2xl"
      >
        💬
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 80, y: 80 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 60, y: 60 }}
            transition={{ type: "spring", stiffness: 180, damping: 25 }}
            className={
              "fixed bottom-0 right-0 bg-white shadow-advaicLg border-l border-t border-[#E5C97B] rounded-tl-2xl z-50 flex flex-col " +
              (isFullscreen
                ? "w-full h-full rounded-none"
                : "w-full sm:w-[380px] h-[75vh]")
            }
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-[#121212] to-[#1a1a1a] text-white rounded-tl-2xl flex justify-between items-center border-b border-[#E5C97B]/40 shadow-advaicLg">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-[#121212] text-white flex items-center justify-center text-sm font-bold">
                  A
                </div>
                <h3 className="font-semibold text-lg">Advaic Assistant</h3>
              </div>
              <div className="flex items-center">
                <button
                  onClick={() => setIsFullscreen((prev) => !prev)}
                  className="text-xl mr-3"
                >
                  ⤢
                </button>
                <button onClick={() => setIsOpen(false)} className="text-xl">
                  −
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#f9f9f9]">
              {messages.map((msg, idx) =>
                msg.sender === "user" ? (
                  <div key={idx} className="flex w-full justify-end">
                    <div className="max-w-[80%] p-3 rounded-2xl text-sm shadow-advaicLg bg-[#121212] text-white self-end">
                      {msg.text}
                    </div>
                  </div>
                ) : (
                  <div
                    key={idx}
                    className="flex gap-3 items-start justify-start"
                  >
                    <div className="w-7 h-7 rounded-full bg-[#121212] text-white flex items-center justify-center font-bold">
                      A
                    </div>
                    <div className="max-w-[80%] p-4 rounded-2xl shadow-advaicSm bg-white border border-[#E5C97B]/40 text-[#1a1a1a] prose prose-sm prose-headings:font-semibold prose-headings:text-[#121212] prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-p:leading-relaxed prose-li:leading-relaxed prose-a:text-[#121212] prose-a:underline prose-strong:text-[#121212]">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.text}
                      </ReactMarkdown>
                    </div>
                  </div>
                )
              )}

              {isBotTyping && (
                <div className="max-w-[80%] p-3 rounded-2xl text-sm shadow-advaic bg-white border border-[#E5C97B] text-[#1a1a1a] flex gap-2 items-center animate-pulse">
                  <div className="w-7 h-7 rounded-full bg-[#121212] text-white flex items-center justify-center font-bold">
                    A
                  </div>
                  <span className="w-2 h-2 bg-[#E5C97B] rounded-full"></span>
                  <span className="w-2 h-2 bg-[#E5C97B] rounded-full"></span>
                  <span className="w-2 h-2 bg-[#E5C97B] rounded-full"></span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-[#E5C97B]/30 bg-white/90 backdrop-blur-xl flex gap-3 items-center shadow-inner rounded-xl drop-shadow-sm">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = e.target.scrollHeight + "px";
                }}
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  !e.shiftKey &&
                  (e.preventDefault(), sendMessage())
                }
                className="flex-1 border border-[#E5C97B]/40 rounded-xl px-3 py-2 outline-none shadow-advaicSm focus:border-[#121212] resize-none overflow-hidden"
                placeholder="Stelle eine Frage..."
                rows={1}
              />
              <button
                onClick={sendMessage}
                disabled={isBotTyping}
                className="bg-[#121212] text-white px-4 py-2 rounded-xl hover:bg-[#E5C97B] hover:text-black transition disabled:opacity-50"
              >
                Senden
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
