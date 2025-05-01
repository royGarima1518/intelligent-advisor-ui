import React, { useState, useRef, useEffect } from "react";
import ChatWindow from "./components/ChatWindow";
import ChatInput from "./components/ChatInput";

const starterQuestions = [
  "Where is Disneyland located?",
  "Latest news on ChatGPT",
  "Show me Apple stock price",
  "Where is disney land located and what is latest new about it"
];

const BACKEND =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:8000/chat";

export default function App() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const bottom = useRef(null);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(content) {
    if (!content || loading) return;

    setMessages((m) => [...m, { role: "user", content }]);
    setLoading(true);

    try {
      const payload = {
        message: content,
        return_sources: true,
        return_follow_up_questions: true,
        embed_sources_in_llm_response: false,
        text_chunk_size: 1000,
        text_chunk_overlap: 200,
        number_of_similarity_results: 2,
        number_of_pages_to_scan: 4,
        stream: false
      };

      const res = await fetch(BACKEND, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: data.answer,
          followUps: data.follow_up_questions || [],
          sources: data.sources || [],
          toolOutputs: data.tool_outputs || []
        }
      ]);
    } catch (e) {
      console.error(e);
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "⚠️ Sorry, something went wrong." }
      ]);
    } finally {
      setLoading(false);
    }
  }

  const lastFollowUps = () => {
    const rev = [...messages].reverse();
    const m = rev.find((x) => x.followUps?.length);
    return m?.followUps || [];
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="bg-primary text-white shadow-md py-3 px-6 text-xl font-semibold">
        Intelligent Advisor
      </header>

      {/* Scrollable Chat Window */}
      <main className="flex-1 overflow-y-auto bg-gray-100 px-4">
        <div className="max-w-3xl mx-auto py-4 space-y-6">
          <ChatWindow
            messages={messages}
            onFollowUpClick={sendMessage}
            loading={loading}
          />
          <div ref={bottom} />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t">
        <div className="max-w-3xl mx-auto p-4">
          <ChatInput
            onSend={sendMessage}
            suggestions={lastFollowUps()}
            loading={loading}
            starter={starterQuestions}
          />
        </div>
      </footer>
    </div>
  );
}
