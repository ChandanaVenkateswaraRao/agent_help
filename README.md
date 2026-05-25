# ⚡ AI Productivity Dashboard

A full-stack MERN application for IT professionals with AI-powered features including Gmail summarization, daily briefing, GitHub tracking, tech news, weather, and an AI chat assistant with tool calling.

---

## 🚀 Features

| Feature | Description |
|---|---|
| 🤖 AI Assistant | Chat with GPT-3.5, supports tool calling (weather, tasks, news) |
| 📧 Gmail Summarizer | AI-powered email summaries with priority detection |
| ☀️ Weather Widget | Real-time weather + 4-step forecast |
| 🐙 GitHub Activity | Commits, repos, PRs from any GitHub user |
| 📰 Tech/AI News | Live news via NewsAPI |
| ✅ Task Manager | MongoDB-backed tasks with priority levels |
| 🌟 Daily Briefing | AI-generated personalized morning briefing |

---

## 🛠️ Tech Stack

- **Frontend**: React 18, React Router v6, Recharts, Lucide
- **Backend**: Node.js, Express.js
- **Database**: MongoDB + Mongoose
- **AI**: OpenAI GPT-3.5 (chat + email summarization + briefing)
- **Auth**: Google OAuth 2.0 (with Gmail access)
- **APIs**: OpenWeatherMap, NewsAPI, GitHub API

---

## ⚙️ Setup Instructions

### 1. Clone and install

```bash
git clone <your-repo>
cd ai-dashboard
npm run install-all
```

### 2. Get API Keys

| Service | Where to get |
|---|---|
| **Google OAuth** | [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials |
| **OpenAI** | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| **OpenWeather** | [openweathermap.org/api](https://openweathermap.org/api) |
| **NewsAPI** | [newsapi.org/register](https://newsapi.org/register) |
| **GitHub Token** | GitHub Settings → Developer settings → Personal access tokens |

### 3. Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable **Gmail API** and **Google+ API**
4. Go to Credentials → Create OAuth 2.0 Client ID
5. Set Authorized redirect URI: `http://localhost:5000/api/auth/google/callback`
6. Set Authorized JavaScript origin: `http://localhost:3000`

### 4. Set up environment variables

```bash
# In server/
cp .env.example .env
# Fill in all values
```

### 5. Start MongoDB

```bash
# Local MongoDB
mongod

# OR use MongoDB Atlas (cloud) - update MONGODB_URI in .env
```

### 6. Run the project

```bash
npm run dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:5000

---

## 📁 Project Structure

```
ai-dashboard/
├── server/
│   ├── index.js              # Express app entry
│   ├── models/
│   │   ├── User.js
│   │   ├── Task.js
│   │   └── EmailSummary.js
│   ├── routes/
│   │   ├── authRoutes.js     # Google OAuth
│   │   ├── weatherRoutes.js  # OpenWeatherMap
│   │   ├── newsRoutes.js     # NewsAPI
│   │   ├── githubRoutes.js   # GitHub API
│   │   ├── emailRoutes.js    # Gmail + OpenAI summarization
│   │   ├── taskRoutes.js     # MongoDB CRUD
│   │   └── aiRoutes.js       # GPT chat + briefing
│   └── middleware/
│       └── auth.js           # JWT middleware
│
└── client/
    └── src/
        ├── components/
        │   ├── Navbar.js
        │   ├── WeatherCard.js
        │   ├── EmailCard.js
        │   ├── TaskCard.js
        │   ├── NewsCard.js
        │   ├── GithubCard.js
        │   ├── AIBriefing.js
        │   ├── AIChat.js
        │   └── SettingsModal.js
        ├── pages/
        │   ├── LoginPage.js
        │   ├── DashboardPage.js
        │   └── AuthCallback.js
        ├── context/
        │   └── AuthContext.js
        └── utils/
            └── api.js
```

---

## 🔐 MongoDB Collections

**users** — Google profile + OAuth tokens + preferences  
**tasks** — User tasks with priority and completion status  
**emailsummaries** — Cached AI summaries (to reduce OpenAI API calls)

---

## 🚢 Deployment

### Backend (Railway / Render)
- Push server/ to GitHub
- Add environment variables in platform dashboard
- Deploy as Node.js service

### Frontend (Vercel / Netlify)
- Push client/ to GitHub
- Set `REACT_APP_API_URL` to your deployed backend URL
- Deploy as Create React App

---

## 💡 Resume Points

This project demonstrates:
- ✅ Full-stack MERN development
- ✅ Google OAuth 2.0 (Gmail access)
- ✅ OpenAI tool calling / function calling
- ✅ AI email summarization pipeline
- ✅ Real-time API integration (4 APIs)
- ✅ JWT authentication
- ✅ MongoDB CRUD operations
- ✅ Responsive dashboard UI
- ✅ Prompt engineering
