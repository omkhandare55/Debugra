# Debugra

A professional online code editor and social study room with real-time collaboration, multi-language execution, and AI-powered debugging tools designed for CS students and friends.

## Features

- **VS Code-Like UI** — Professional, responsive design with an integrated status bar, scalable output panes, and keyboard shortcuts
- **Code Execution** — Run 18+ programming languages (Python, Java, C++, JavaScript, Go, Rust, C# Mono, and more) permanently free powered by the Piston API
- **Monaco Editor** — High-performance editing experience with syntax highlighting, autocomplete, bracket matching, and code formatting
- **AI Time-Travel Debugger** — Visual, step-by-step memory and algorithm visualization, error explanations, one-click fixes, and test case generation (powered by Groq's fast Llama 3.3 70B model)
- **Real-Time Collaboration** — Create rooms, share a room ID, and code together with live sync of code and input streams via Firebase
- **Team Chat** — In-editor messaging for collaborators
- **Saved Code History** — Authenticated users can save their code snippets and access them anytime through a dedicated History Panel sidebar
- **User Input (stdin)** — Auto-detects input functions (`input()`, `Scanner`, `cin`, etc.) and seamlessly syncs stdin across all users in a room

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Monaco Editor |
| Styling | Vanilla CSS (Dark theme, VS Code aesthetics) |
| Auth & Database | Firebase Auth, Cloud Firestore |
| Code Execution | Piston API (100% Free Serverless execution) |
| AI Features | Groq SDK (llama-3.3-70b-versatile) + node-cache |
| Backend | Express.js (Node.js) with Rate Limiting & Helmet |

## Project Structure

```
debugra/
├── src/                    # Frontend (React + Vite)
│   ├── components/
│   │   ├── Auth/           # Login/Signup modal
│   │   ├── Chat/           # Team chat panel
│   │   ├── Editor/         # Main editor page
│   │   └── Landing/        # Landing page
│   ├── services/
│   │   ├── api.js          # Backend API calls
│   │   └── firebase.js     # Firebase config
│   ├── utils/
│   │   └── languageConfig.js
│   ├── App.jsx
│   └── index.css
├── server/                 # Backend (Express.js)
│   ├── routes/
│   │   ├── execute.js      # Code execution endpoint
│   │   └── ai.js           # AI features endpoint
│   ├── services/
│   │   └── judge0Service.js # Piston API compiler wrapper
│   ├── middleware/
│   │   └── errorHandler.js
│   └── server.js
├── index.html
├── package.json
└── vite.config.js
```

## Local Development

### Prerequisites

- Node.js 18+
- A Firebase project (Auth + Firestore enabled)
- A Groq API key (free at console.groq.com)

### 1. Clone the repo

```bash
git clone https://github.com/your-username/debugra.git
cd debugra
```

### 2. Install dependencies

```bash
# Frontend
npm install

# Backend
cd server
npm install
cd ..
```

### 3. Configure environment variables

**Frontend** — create `.env` in root:

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_API_URL=http://localhost:3001
```

**Backend** — create `.env` in `server/`:

```env
PORT=3001
CLIENT_URL=http://localhost:5173
GROQ_API_KEY=your_groq_api_key
```

### 4. Start development servers

```bash
# Terminal 1 — Frontend
npm run dev

# Terminal 2 — Backend
cd server
npm run dev
```

Frontend runs at `http://localhost:5173`, backend at `http://localhost:3001`.

## Deployment

### Frontend — Vercel

1. Push your code to GitHub.
2. Log in to [Vercel](https://vercel.com/) and click **Add New Project**.
3. Import your GitHub repository. Vercel will automatically detect Vite.
4. Add the following **Environment Variables** in the Vercel dashboard:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_API_URL` (Set this to your Cloud Run URL)
5. Click **Deploy**.

### Backend — Google Cloud Run

```bash
# Install gcloud CLI, then:
cd server

# Build and deploy in one command
gcloud run deploy debugra-api \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "GROQ_API_KEY=your_key,CLIENT_URL=https://your-app.web.app"
```

After deploying, update your frontend `.env`:

```env
VITE_API_URL=https://debugra-api-xxxxx-uc.a.run.app
```

Then rebuild and redeploy the frontend.

## Supported Languages

Python, JavaScript, TypeScript, Java, C++, C, C#, Go, Rust, Ruby, PHP, Swift, Perl, Lua, Scala, Haskell, SQL, Bash

## Team

Built for Hackathon Svkm 2026 — Debugra Team 
