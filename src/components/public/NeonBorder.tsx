"use client"

export function NeonBorder() {
  return (
    <div 
      className="fixed inset-0 pointer-events-none z-[60] opacity-35 hidden md:block"
      style={{ 
        boxShadow: "inset 0 0 120px rgba(111, 13, 43, 0.25), inset 0 0 30px rgba(255, 90, 95, 0.15)"
      }}
    >
      <div className="absolute inset-0 border-[1px] border-[#FF5A5F]/20" />
    </div>
  )
}
