# Blue & Red Agent System

A dual-agent AI system for navigation (Blue) and execution (Red) with hybrid local/cloud switching.

## Project Structure

- `extension/`: Chrome extension for the user interface.
- `backend/`: Node.js backend server.
  - `server.ts`: Main entry point.
  - `src/ai/`: AI agent logic and failover systems.
  - `src/cache/`: Smart caching and embeddings.
  - `src/brain/`: User profile and memory management.
  - `src/security/`: Captcha solving and stealth engines.
- `src/`: Frontend React application.

## Setup

1. Install dependencies: `npm install`
2. Start the development server: `npm run dev`
3. Configure your API keys in the `.env` file.
