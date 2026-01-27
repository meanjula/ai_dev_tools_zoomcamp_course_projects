import React from "react";
import ReactMarkdown from "react-markdown";

export default function Explanation({ explanation, explanationRef }) {
  return (
    <div
      ref={explanationRef}
      className="w-full max-w-3xl bg-linear-to-b from-gray-800 to-gray-900 border border-gray-700 rounded-2xl shadow-lg p-6 focus:outline-none transition-all duration-300"
      style={{ minHeight: explanation ? "500px" : "0px" }}
    >
      <h2 className="text-xl font-semibold mb-3 text-green-400">
        💬 <span>Explanation</span>
      </h2>
      <div className="prose prose-invert max-w-none text-gray-200 leading-relaxed">
        <ReactMarkdown>{explanation}</ReactMarkdown>
      </div>
    </div>
  );
}
