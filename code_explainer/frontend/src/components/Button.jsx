import React from 'react'

export default function Button({ onClick, disabled, loading }) {
  return (
      <button
        onClick={onClick}
        disabled={disabled}
        className=" bg-blue-600 hover:bg-blue-700 transition text-white p-3 rounded-md font-semibold disabled:opacity-50"
      >
        {loading ? "Explaining..." : "Explain Code"}
      </button>
    );
}
