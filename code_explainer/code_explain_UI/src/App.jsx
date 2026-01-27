import ollamaLogo from "./assets/ollama.svg";
import CodeExplainer from "./components/CodeExplainer.jsx";

function App() {
  return (
    <>
      <a
        href=""
        target="_blank"
        className="flex items-center justify-center"
      >
        <img src={ollamaLogo} className="logo" alt="Ollama logo" />
      </a>
      <CodeExplainer />
    </>
  );
}

export default App;
