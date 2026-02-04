// Layout.tsx
import React from "react";
import NavBar from "./ui/NavBar";
import Sidebar from "./Sidebar";

const IQ = "/images/IQ.png";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed top navbar (h-16) */}
      <NavBar logoSrc={IQ} />

      {/* Fixed left sidebar (w-64) below navbar */}
      <Sidebar />

      {/* Main content: padding top for navbar, margin-left for sidebar */}
      <main className="pt-16 ml-64 p-6">{children}</main>
    </div>
  );
}
