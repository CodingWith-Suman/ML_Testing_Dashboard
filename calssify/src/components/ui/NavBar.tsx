// ui/NavBar.tsx
import React from "react";

export default function NavBar({ logoSrc }: { logoSrc: string }) {
  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-gray-800 text-white flex items-center justify-between p-4 h-16">
      <div className="flex items-center gap-2">
        <img src={logoSrc} alt="Classify IQ" width="40px" />
        <span className="text-2xl font-bold font-mono">ClassifyIQ</span>
      </div>
      {/* Right side area for future actions (user menu, etc.) */}
      <div />
    </div>
  );
}
