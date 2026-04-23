# Debugra

A professional online code editor with real-time collaboration, multi-language execution, and AI-powered debugging tools.

## Features

- **Code Execution** — Run 18+ programming languages (Python, Java, C++, JavaScript, Go, Rust, Ruby, and more) powered by the Wandbox compiler
- **Monaco Editor** — VS Code-like editing experience with syntax highlighting, autocomplete, bracket matching, and code formatting
- **AI Debugging Tools** — Error explanations, one-click fixes, logic breakdowns, execution visualization, and test case generation (powered by Groq/Llama)
- **Real-Time Collaboration** — Create rooms, share a room ID, and code together with live sync via Firebase
- **Team Chat** — In-editor messaging for collaborators
- **User Input (stdin)** — Auto-detects input functions (`input()`, `Scanner`, `cin`, etc.) and prompts for stdin before execution
- **Save & Download** — Sign in to persist code to Firebase, download files locally
- **Responsive** — Works on desktop, tablet, and mobile

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Monaco Editor |
| Styling | Vanilla CSS (dark theme) |
| Auth & Database | Firebase Auth, Cloud Firestore |
| Code Execution | Wandbox API (free, no key needed) |
| AI Features | Groq SDK (Llama 3) |
| Backend | Express.js (Node.js) |

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
│   │   └── judge0Service.js # Wandbox compiler wrapper
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

### Frontend — Firebase Hosting (Free)

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login and init
firebase login
firebase init hosting
# Select your project, set public dir to "dist", configure as SPA

# Build and deploy
npm run build
firebase deploy --only hosting
```

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

Built for Hackathon 2026 — Debugra Team

## License

MIT
