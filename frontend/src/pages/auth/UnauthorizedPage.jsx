import React from "react";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui/button.jsx";
import { usePageTitle } from "../../hooks/usePageTitle.js";

function UnauthorizedPage() {
  usePageTitle("Unauthorized");
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md space-y-4 text-center">
        <h1 className="text-3xl font-semibold text-slate-50">
          Restricted clinical area
        </h1>
        <p className="text-sm text-slate-400">
          Your current role does not have access to this part of the system.
          Please contact an administrator if you believe this is an error.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button asChild variant="outline">
            <Link to="/login">Return to login</Link>
          </Button>
          <Button asChild>
            <Link to="/">Back to landing</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export { UnauthorizedPage };

