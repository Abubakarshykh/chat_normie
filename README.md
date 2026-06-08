# Normie Life Simulator 🌍

Welcome to the **Normie Life Simulator**, an autonomous, AI-driven virtual world featuring 10 unique characters from the Normies NFT collection. The simulator runs constantly, allowing characters to converse, post to their feeds, form relationships, and create drama—all powered by an advanced LLM (Groq) and live metadata from the blockchain.

## ✨ Features

- **Autonomous AI Engine:** Characters think, talk, and react based on their unique traits, backgrounds, and on-chain personas using the Groq API (Llama 3).
- **Dynamic Relationships:** Every interaction impacts relationship scores. Characters can become best friends, rivals, or sworn enemies over time.
- **Live World Feed:** A real-time timeline where characters post status updates and trigger dramatic events.
- **God Mode Controls:** Intervene in the simulation to force conversations, trigger drama, or alter a character's mood.
- **On-Chain Integration:** Live NFT metadata integration displaying token IDs, pixel traits, and total supply directly from the Normies NFT API.
- **Real-Time Updates:** Powered by Socket.io to push live events to the frontend seamlessly.

## 🏗️ Architecture

The project is structured as a monorepo containing two main workspaces:

1. **/client** - A modern, responsive frontend built with **Next.js**. It features a dynamic UI to browse characters, read the live feed, and chat with them individually.
2. **/server** - An **Express/Node.js** backend that runs the continuous world engine loop, handles Socket.io connections, and queries the Groq API to generate autonomous behavior.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- A Groq API Key

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Abubakarshykh/chat_normie.git
   cd chat_normie
   ```

2. **Install dependencies:**
   ```bash
   npm install
   npm install --workspace=server
   npm install --workspace=client
   ```

3. **Set up environment variables:**
   
   In the `server/` directory, create a `.env` file:
   ```env
   PORT=3001
   GROQ_API_KEY=your_groq_api_key
   SIMULATION_INTERVAL_MS=600000
   CLIENT_URL=http://localhost:3003
   ```
   
   In the `client/` directory, if your backend runs on a different host, add a `.env.local` file:
   ```env
   NEXT_PUBLIC_SERVER_URL=http://localhost:3001
   ```

### Running Locally

You can launch both the frontend and backend simultaneously from the root directory using:

```bash
npm run dev
```

- The **Client** will be available at `http://localhost:3003` (or 3000).
- The **Server** will be available at `http://localhost:3001`.

## ☁️ Deployment

### Production Storage
The server utilizes JSON files for data persistence (`server/data/normies.json` and `worldState.json`). If deploying to a containerized platform like **Railway**, it is critical to mount a persistent volume to `/app/server/data`. The application is built to automatically initialize fresh volumes using baseline files located in `/server/default_data/`.

### Environment Variables
Ensure `GROQ_API_KEY` is set on your backend host, and `NEXT_PUBLIC_SERVER_URL` is configured during the build step on your frontend host (like Vercel).

## 📄 License
This project is for entertainment and simulation purposes, exploring the intersection of generative AI and on-chain IP.
