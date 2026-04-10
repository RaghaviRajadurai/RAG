import React from "react";
import { AppRoutes } from "./routes/AppRoutes.jsx";
import { AceternityBackground } from "./animations/AceternityBackground.jsx";
import { Toaster } from "./components/ui/toast.jsx";

function App() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-slate-100">
      <AceternityBackground />
      <div className="relative z-10">
        <AppRoutes />
      </div>
      <Toaster />
    </div>
  );
}

export default App;
