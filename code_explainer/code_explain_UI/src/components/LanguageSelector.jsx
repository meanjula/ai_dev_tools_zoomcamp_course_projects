import React from 'react'

export default function LanguageSelector({ language, setLanguage, options }) {
  return (
    <>
      <label className="text-lg font-medium">Select Language:</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded-md p-2"
          >
            {options.map((lang) => (
              <option key={lang} value={lang}>
                {lang.at(0).toUpperCase() + lang.slice(1)}
              </option>
            ))}
          </select>
    </>
  )
}
