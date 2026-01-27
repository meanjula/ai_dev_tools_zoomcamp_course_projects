import React from "react";

export default function TextArea({ code, setCode }) {
  return (
    <textarea
      value={code}
      onChange={(e) => setCode(e.target.value)}
      placeholder="Paste your code here..."
      className="w-full h-48 bg-gray-900 border border-gray-700 rounded-md p-3 font-mono text-sm text-white"
    />
  );
}
