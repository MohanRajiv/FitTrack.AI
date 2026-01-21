import React, { StrictMode } from "react";
import "./index.css";
import { App } from "./App";
import { BrowserRouter } from "react-router-dom";
import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";

const rootElement = document.getElementById("root");
const root = createRoot(rootElement);

const Clerk_Key = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

if (!Clerk_Key) {
  throw new Error("Clerk publishable key is missing");
}

root.render(
  <StrictMode>
    <ClerkProvider publishableKey={Clerk_Key}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ClerkProvider>
  </StrictMode>
);
