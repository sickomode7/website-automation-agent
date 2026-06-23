# Architecture & Design Decisions

This document outlines the core architectural choices made in the Website Automation Agent.

## 1. Tool-Based Function Calling
The system relies heavily on the `Function Calling` capability of Gemini 2.5 Flash. Rather than trying to parse raw text commands, the agent is initialized with strict JSON schema definitions (`FunctionDeclaration`) mapping to local Playwright functions.
- **Advantage**: Provides strongly-typed arguments (e.g., `x` and `y` coordinates for clicking) ensuring the agent's requested actions map cleanly to executable code.

## 2. Visual State Verification
Websites are dynamic, and DOM structures are often heavily obfuscated.
- **Decision**: The agent relies purely on **Screenshots (`inlineData`)** rather than DOM parsing to understand the page state. 
- **Advantage**: It makes the agent completely robust against DOM changes, React virtual DOM complexities, and obfuscated class names. The agent "sees" the page exactly as a human does.

## 3. Manual Chat History Management
A known limitation of the Google Generative AI Node SDK is that it strictly prohibits mixing a `FunctionResponse` and an `inlineData` (screenshot) part in the same `chat.sendMessage()` payload to maintain formal turn-taking semantics.
- **Decision**: The agent loop bypasses `chat.sendMessage` and manually manages the `history` array using `model.generateContent()`.
- **Workflow**:
  1. User Turn: Submits objective and initial screenshot.
  2. Model Turn: Predicts the necessary `FunctionCall` (e.g., `openBrowser`).
  3. User Turn: Feeds back the raw `FunctionResponse` JSON.
  4. Model Turn: *Dummy injection* ("I have received the function execution results...").
  5. User Turn: Feeds back the newly captured screenshot.
  6. Loop repeats.
- **Advantage**: Bypasses strict SDK validation errors while ensuring the model *always* gets a fresh visual state immediately after executing an action.

## 4. Robust Error Handling & Retries
Browser automation is inherently flaky.
- **Decision**: Tool executions are wrapped in a 2-attempt retry loop. If an action fails, it warns and retries. If it fails twice, it throws a fatal error that terminates the loop and safely shuts down the Chromium process in a top-level `finally` block.
- **Stagnation Handling**: If the model fails to return a function call for 3 consecutive turns, the agent automatically terminates to prevent infinite loops and API token burn.
