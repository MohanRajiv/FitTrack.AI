import { createAgent } from "langchain";
import { usdaTool } from "./tool.js"; 
import { SYSTEM_PROMPT } from "./prompts.js";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const model = new ChatGoogleGenerativeAI({
    model: "gemini-3-flash-preview", 
    apiKey: `${process.env.GEMINI_API_KEY}`,
  });
  
  export const agent = createAgent({
    model: model,
  
    tools: [usdaTool],
  
    systemPrompt: SYSTEM_PROMPT,
  });