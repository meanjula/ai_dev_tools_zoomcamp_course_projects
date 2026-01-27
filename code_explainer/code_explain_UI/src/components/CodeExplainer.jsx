import { useState, useRef } from "react";
import Explanation from "./Explanation.jsx";
import Button from "./Button.jsx";
import LanguageSelector from "./LanguageSelector.jsx";
import TextArea from "./TextArea.jsx";

export default function App() {
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState("");
  const [explanation, setExplanation] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const explanationRef = useRef(null);
  const scrollToBottom = () => {
    explanationRef.current?.scrollIntoView();
  };
  const handleExplain = async () => {
    setLoading(true);
    setExplanation("");
    setError("");
 
    try {
      const res = await fetch("http://localhost:3001/api/explain-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language }),
      });

      if (!res.ok) throw new Error("Server returned an error");

      // Get readable stream
      const reader = res.body.getReader(); // catching each word chunk
      const decoder = new TextDecoder();  // translator converting binary data into text
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter(Boolean);
        let firstChunkSeen = false;

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.type === "token" && data.content) {
              setLoading(false);
              if (!firstChunkSeen) {
                firstChunkSeen = true;
                scrollToBottom
              }
              // Update progressively
              setExplanation((prev) => prev + data.content);
            } else if (data.type === "done" && data.content) {
              scrollToBottom
              explanationRef.current?.focus();
              // Final content (ensure complete)
              setExplanation(data.content);
            } else if (data.type === "error") {
              setError(data.message || "Unknown error");
            }
          } catch {
            console.warn("Skipping malformed line:", line);
          }
        }
      }
    } catch (err) {
      console.error("❌ Frontend error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  const options = ["javascript", "python", "java", "c++", "typescript", "go"];
 
  return (
    <div className="min-w-[45vw] bg-gray-800 text-gray-100 flex flex-col items-center p-6 rounded-3xl shadow-2xl  ">
      <h1 className="text-3xl font-bold mb-6">🦙 Code Explainer</h1>
      <div className="bg-gray-800 p-6 rounded-2xl shadow-lg w-full max-w-3xl space-y-4">
        <div className="flex justify-between items-center">
          <LanguageSelector
            language={language}
            setLanguage={setLanguage}
            options={options}
          />
        </div>
        <TextArea code={code} setCode={setCode} />
        <Button
          onClick={handleExplain}
          disabled={loading || !code.trim()}
          loading={loading}
        />
      </div>
      <>
        {error && (
          <div className="text-red-400 mt-4 text-sm">⚠️ Error: {error}</div>
        )}
        {loading && (
          <div className="text-yellow-400 mt-4 text-sm">⏳ Loading...</div>
        )}
        {explanation && (
          <>
            <Explanation
              explanation={explanation}
            />
            <div ref={explanationRef}></div>
          </>
        )}
      </>
    </div>
  );
}
