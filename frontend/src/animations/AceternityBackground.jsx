import React from "react";

function AceternityBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background">
      {/* Subtle top border accent */}
      <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-primary/20 to-transparent" />
      
      {/* Optional: Very subtle diagonal lines for document feel */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: 'repeating-linear-gradient(45deg, currentColor 0px, currentColor 1px, transparent 1px, transparent 35px)',
          color: 'rgb(30, 41, 59)'
        }}
      />
    </div>
  );
}

export { AceternityBackground };
