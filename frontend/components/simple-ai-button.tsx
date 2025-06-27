"use client"

interface SimpleAIButtonProps {
  onClick: () => void
}

export default function SimpleAIButton({ onClick }: SimpleAIButtonProps) {
  return (
    <div
      className="fixed top-4 right-4 z-[9999]"
      style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        zIndex: 9999,
      }}
    >
      <button
        onClick={onClick}
        style={{
          backgroundColor: "#ff0000",
          color: "white",
          padding: "15px 25px",
          fontSize: "18px",
          fontWeight: "bold",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        🤖 AI ASSISTANT
      </button>
    </div>
  )
}
