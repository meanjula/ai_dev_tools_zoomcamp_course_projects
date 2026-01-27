import { useState, useRef, useEffect } from "react";
import Explanation from "./Explanation.jsx";
import Button from "./Button.jsx";
import LanguageSelector from "./LanguageSelector.jsx";
import TextArea from "./TextArea.jsx";
import { register, login, explainCode } from "../api.js";

export default function App() {
  const [language, setLanguage] = useState("javascript");
  const [model, setModel] = useState(import.meta.env.VITE_DEFAULT_MODEL || "llama3");
  const [code, setCode] = useState("");
  const [explanation, setExplanation] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [authUser, setAuthUser] = useState(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authName, setAuthName] = useState("");
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);

  const explanationRef = useRef(null);
  const scrollToBottom = () => {
    explanationRef.current?.scrollIntoView();
  };
  const handleExplain = async () => {
    setLoading(true);
    setExplanation("");
    setError("");
 
    try {
      const token = authUser?.id;
      const res = await explainCode({ code, language, userId: authUser?.id, token, model });

      // Stream the NDJSON response (do not throw on non-ok so we can parse error NDJSON)
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let firstChunkSeen = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter(Boolean);
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.type === "token" && data.content) {
              setLoading(false);
              if (!firstChunkSeen) {
                firstChunkSeen = true;
                scrollToBottom();
              }
              setExplanation((prev) => prev + data.content);
            } else if (data.type === "done") {
              scrollToBottom();
              explanationRef.current?.focus();
              if (data.content) setExplanation(data.content);
            } else if (data.type === "error") {
              setError(data.message || "Unknown error");
            }
          } catch (err) {
            console.warn("Skipping malformed line:", line, err);
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

  useEffect(()=>{
    try{
      const raw = localStorage.getItem('ce_user');
      if(raw) setAuthUser(JSON.parse(raw));
    }catch{}
  },[])
  const options = ["javascript", "python", "java", "c++", "typescript", "go"];
  const modelOptions = [
    "llama3",
    "mixtral-8x7b",
    "mistral-7b",
    "vicuna-13b",
    "llama2",
    "deepseek-v3.1",
    "qwen3",
    "gpt-oss"
  ];
 
  return (
    <div className="min-w-[45vw] bg-gray-800 text-gray-100 flex flex-col items-center p-6 rounded-3xl shadow-2xl  ">
      <h1 className="text-3xl font-bold mb-6">🦙 Code Explainer</h1>
      <div className="bg-gray-800 p-6 rounded-2xl shadow-lg w-full max-w-3xl space-y-4">
        {/* Simple auth panel */}
        <div className="flex items-center justify-between mb-4">
          {authUser ? (
            <div className="flex items-center gap-3">
              <div className="text-sm">Logged in as <strong>{authUser.name || authUser.email}</strong></div>
              <button
                className="text-xs bg-red-600 hover:bg-red-700 px-2 py-1 rounded"
                onClick={() => {
                  localStorage.removeItem('ce_user');
                  setAuthUser(null);
                }}
              >Logout</button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input className="bg-gray-900 border border-gray-700 rounded p-2 text-sm" placeholder="name (optional)" value={authName} onChange={e=>setAuthName(e.target.value)} />
              <input className="bg-gray-900 border border-gray-700 rounded p-2 text-sm" placeholder="email" value={authEmail} onChange={e=>setAuthEmail(e.target.value)} />
              <button
                className="text-sm bg-green-600 hover:bg-green-700 px-3 py-1 rounded"
                onClick={async ()=>{
                  try {
                    const data = await register({ name: authName, email: authEmail });
                    if (data && !data.error) {
                      localStorage.setItem('ce_user', JSON.stringify(data));
                      setAuthUser(data);
                    } else {
                      alert(data.error || 'register failed');
                    }
                  } catch (err) { console.error(err); alert('register failed'); }
                }}
              >Register</button>
              <button
                className="text-sm bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded"
                onClick={async ()=>{
                  try {
                    const data = await login({ email: authEmail });
                    if (data && !data.error) {
                      localStorage.setItem('ce_user', JSON.stringify(data));
                      setAuthUser(data);
                    } else {
                      alert(data.error || 'login failed');
                    }
                  } catch (err) { console.error(err); alert('login failed'); }
                }}
              >Login</button>
            </div>
          )}
        </div>
        <div className="flex justify-between items-center">
          <LanguageSelector
            language={language}
            setLanguage={setLanguage}
            options={options}
          />
          <div className="ml-4">
            <label className="text-sm block mb-1">LLM Model</label>
            <select className="bg-gray-900 border border-gray-700 rounded p-2 text-sm" value={model} onChange={e=>setModel(e.target.value)}>
              {modelOptions.map(m=> (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>
        <TextArea code={code} setCode={setCode} />
        <div className="flex items-center gap-3">
          <Button
            onClick={handleExplain}
            disabled={loading || !code.trim() || !authUser}
            loading={loading}
          />
          {!authUser && (
            <div className="text-sm text-yellow-300">Please register or login to save explanations.</div>
          )}
        </div>
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
