# Website Automation Agent

A Node.js + TypeScript project that uses **Playwright** and **Gemini 2.5 Flash** to autonomously navigate, interact, and perform tasks on websites.

## Overview
This agent uses Gemini 2.5 Flash's multimodal capabilities to act as a fully autonomous browser agent. It operates by capturing the visual state of the browser (screenshots), passing it to the Gemini model, and executing the functional commands the model decides on (clicking, typing, scrolling, etc.).

## Prerequisites
- Node.js (v18+)
- A valid [Google Gemini API Key](https://aistudio.google.com/app/apikey)

## Setup

1. **Install dependencies**: 
   ```bash
   npm install
   ```

2. **Install Playwright Browsers**:
   ```bash
   npx playwright install chromium
   ```

3. **Configure Environment Variables**:
   Update the `.env` file in the root directory and replace the placeholder with your actual Gemini API Key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

## Running the Agent

To start the agent, simply run:
```bash
npx ts-node src/index.ts
```

This will launch a headful instance of Chromium. The agent will read the objective defined in `src/index.ts` and begin interacting with the browser. 

## Project Structure
- `src/tools.ts`: Contains the Playwright browser automation primitives (click, scroll, type, etc.).
- `src/agent.ts`: The core execution loop connecting the Gemini API to the browser tools.
- `src/index.ts`: The entry point that initializes the browser, sets the objective, and gracefully handles teardowns.
