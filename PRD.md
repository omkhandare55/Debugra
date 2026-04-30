# Product Requirements Document (PRD)
## Product: Debugra - AI Collaborative Code Editor

### 1. Vision & Overview
**Debugra** is a professional, browser-based online code editor that seamlessly blends real-time collaboration, multi-language execution, and intelligent AI-powered debugging tools. Designed to replicate a native VS Code-like experience, Debugra empowers teams, mentors, and students to code together seamlessly while providing instant, AI-driven explanations and fixes to accelerate the development workflow.

### 2. Target Audience
- **Students & Learners:** Beginners who need intuitive explanations for complex errors or code logic.
- **Instructors & Mentors:** Teachers seeking a platform to live-code, review student code, and visually explain execution steps.
- **Hackathon Teams & Developers:** Collaborators needing a lightweight, responsive, and reliable online IDE for pair programming and rapid prototyping.

### 3. Core Features & Functionality

#### 3.1 Advanced Code Editor (Monaco)
- **VS Code-Like Aesthetics:** High-performance, dark-themed UI with an integrated status bar, scalable output panes, and familiar keyboard shortcuts.
- **Rich Editing Experience:** Features syntax highlighting, code formatting, auto-completion, and bracket matching.

#### 3.2 Real-Time Collaboration
- **Live Syncing:** Instantaneous synchronization of code, cursors, and selections across multiple users in a "Room" using Firebase Realtime/Firestore.
- **User Presence:** Display active users with unique assigned colors and avatars.
- **Team Chat:** In-editor contextual messaging for text-based communication among collaborators.

#### 3.3 Code Execution Engine
- **Multi-Language Support:** Execution environment for 18+ languages including Python, JavaScript, Java, C++, Go, and Rust.
- **Standard Input (stdin):** Auto-detection of input functions with synchronized stdin across the collaborative room.
- **Backend Infrastructure:** Serverless execution powered by the Judge0 API (or Wandbox).

#### 3.4 AI-Powered Debugging (Groq & Llama 3)
- **Error Explanation:** Translates raw compiler/runtime errors into simple, beginner-friendly explanations.
- **One-Click Fixes:** AI analyzes the faulty code and provides the exact corrected code to resolve the issue while keeping the logic intact.
- **Logic Breakdown:** Step-by-step CS-tutor-style breakdown of time complexity, space complexity, and code behavior.
- **Execution Visualization:** Step-by-step tracing of variable states and execution paths to help visualize "how" the code runs.
- **Test Case Generation:** Automatically generates normal and edge test cases based on the provided function or code block.

### 4. User Stories
- **As a developer**, I want to create a collaborative coding room and share a link so that my teammate can pair-program with me.
- **As a beginner**, when my code throws a cryptic syntax error, I want to click an "Explain Error" button so that I can understand what went wrong in plain English.
- **As a team lead**, I want to see where my teammates' cursors are in the code so that we avoid overwriting each other's work.
- **As a student**, I want to generate test cases for my algorithm to verify its correctness before submission.
- **As a user**, I want to save my written snippets to my profile so I can revisit them later via a history panel.

### 5. Technical Architecture Overview
- **Frontend:** React 18, Vite, Monaco Editor, Vanilla CSS (Dark Theme).
- **Backend:** Node.js, Express.js.
- **Database & Realtime:** Firebase Auth, Cloud Firestore.
- **External Services:** 
  - **Judge0/Wandbox API:** Secure, isolated remote code execution.
  - **Groq API (llama-3.3-70b-versatile):** Ultra-fast inference for all AI capabilities.

### 6. Non-Functional Requirements
- **Performance:** AI responses must be rendered in < 500ms for a seamless, real-time feel (achieved via Groq). Code synchronization should have a maximum latency of < 300ms.
- **Security:** Code execution must be isolated in secure, temporary environments (handled by Judge0). AI prompts must be strictly scoped to avoid prompt injection.
- **Scalability:** The backend must stateless-ly proxy execution requests and handle concurrent collaborative sessions through Firestore efficiently.

### 7. Future Enhancements
- **Voice/Video Chat:** Integrating WebRTC for direct communication within rooms.
- **GitHub Integration:** Ability to pull/push code directly from/to GitHub repositories.
- **File System Support:** Upgrading from single-file execution to multi-file project support.
