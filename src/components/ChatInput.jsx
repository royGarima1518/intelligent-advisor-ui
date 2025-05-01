import React, { useState, useRef } from "react";

export default function ChatInput({
  onSend,
  suggestions,
  loading,
  starter = []
}) {
  const [input, setInput] = useState("");
  const [showSug, setShowSug] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [listening, setListening] = useState(false);
  const textRef = useRef(null);

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = SpeechRecognition ? new SpeechRecognition() : null;

  const handleVoiceInput = () => {
    if (!recognition) return alert("Speech recognition not supported in this browser.");

    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => prev + " " + transcript);
      setShowSug(true);
    };

    recognition.start();
  };

  const filtered =
    input.length === 0
      ? suggestions
      : suggestions.filter((q) =>
          q.toLowerCase().includes(input.toLowerCase())
        );

  const inline =
    input &&
    suggestions.find((q) =>
      q.toLowerCase().startsWith(input.toLowerCase())
    );

  const send = (txt) => {
    const clean = txt.trim();
    if (!clean) return;
    onSend(clean);
    setInput("");
    setShowSug(false);
    setHighlight(0);
  };

  return (
    <div className="relative">
      {/* starter chips */}
      {input.length === 0 && starter.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {starter.map((q, i) => (
            <button
              key={i}
              onClick={() => send(q)}
              className="bg-gray-200 hover:bg-gray-300 text-xs px-3 py-1 rounded-full"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* ghost + textarea wrapper */}
      <div className="relative">
        {inline && (
          <div
            className="absolute top-0 left-0 w-full h-full pointer-events-none text-gray-400 whitespace-pre-wrap p-3 leading-6"
            style={{ fontFamily: "inherit" }}
          >
            <span className="opacity-0">{input}</span>
            <span>{inline.slice(input.length)}</span>
          </div>
        )}

        <textarea
          ref={textRef}
          className="w-full border border-gray-300 rounded-lg p-3 focus:outline-primary resize-none bg-transparent pr-20"
          rows={2}
          placeholder="Ask something..."
          value={input}
          disabled={loading}
          onChange={(e) => {
            const val = e.target.value;
            setInput(val);
            setShowSug(val.trim().length > 0);   // show list only after typing
          }}
          onKeyDown={(e) => {
            if ((e.key === "Tab" || e.key === "ArrowRight") && inline) {
              e.preventDefault();
              setInput(inline);
              setShowSug(false);
              return;
            }

            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
              return;
            }

            if (showSug && filtered.length) {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setHighlight((highlight + 1) % filtered.length);
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setHighlight(
                  (highlight - 1 + filtered.length) % filtered.length
                );
              } else if (e.key === "Enter") {
                e.preventDefault();
                send(filtered[highlight]);
              }
            }
          }}
        />

        {/* mic button */}
        <button
          className={`absolute bottom-3 right-20 px-3 py-1 rounded-lg text-white ${
            listening ? "bg-red-500 animate-pulse" : "bg-blue-500"
          }`}
          onClick={handleVoiceInput}
          disabled={loading}
          title="Voice Input"
        >
          🎤
        </button>
      </div>

      {/* dropdown */}
      {showSug && filtered.length > 0 && (
        <ul className="absolute bottom-full mb-1 left-0 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
          {filtered.map((sug, idx) => (
            <li
              key={idx}
              className={`px-4 py-2 cursor-pointer text-sm ${
                idx === highlight ? "bg-gray-100" : "hover:bg-gray-50"
              }`}
              onMouseEnter={() => setHighlight(idx)}
              onClick={() => send(sug)}
            >
              {sug}
            </li>
          ))}
        </ul>
      )}

      {/* send button */}
      <button
        disabled={loading}
        className="absolute bottom-3 right-3 bg-primary text-white px-4 py-1 rounded-lg disabled:opacity-50"
        onClick={() => send(input)}
      >
        Send
      </button>
    </div>
  );
}
