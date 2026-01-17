# Chalk2Chat — AI Tutor for Every Classroom

Turn blackboard photos into an intelligent AI tutor. Snap, learn, and ask questions grounded in classroom content.

## 🚀 Features

- **Smart OCR**: Extract text from blackboard photos and PDFs using AI vision
- **AI-Powered Chat**: Ask questions about your classroom content with context-aware responses
- **Study Materials**: Generate summaries, quizzes, and flashcards from your content
- **Multi-Session Support**: Upload multiple class sessions and chat across all of them
- **Difficulty Levels**: Adjust AI responses to easy, medium, or hard difficulty

## 🛠️ Tech Stack

- **Frontend**: React + TypeScript + Vite
- **UI**: shadcn-ui + Tailwind CSS
- **Backend**: Supabase Edge Functions (Deno)
- **Database**: Supabase PostgreSQL
- **Deployment**: Vercel (Frontend) + Supabase (Backend)

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account
- OpenAI API key

## 🏃 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/sameerbharti/Chalk2c.git
cd Chalk2c
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

Get these values from your Supabase project dashboard:
- Go to Settings → API
- Copy the Project URL and anon/public key

### 4. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:8080`

## 📚 Documentation

- [Deployment Guide](./DEPLOYMENT.md) - Deploy frontend and backend
- [Supabase Deployment](./SUPABASE_DEPLOYMENT.md) - Detailed backend setup
- [Frontend-Backend Connection](./FRONTEND_BACKEND_CONNECTION.md) - Connection setup
- [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md) - Step-by-step checklist

## 🚢 Deployment

### Frontend (Vercel)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
4. Deploy!

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

### Backend (Supabase)

1. Install Supabase CLI: `npm install -g supabase`
2. Login: `npx supabase login`
3. Link project: `npx supabase link --project-ref your-project-ref`
4. Deploy functions: `npx supabase functions deploy`
5. Set secrets in Supabase Dashboard

See [SUPABASE_DEPLOYMENT.md](./SUPABASE_DEPLOYMENT.md) for detailed instructions.

## 📖 Project Structure

```
├── src/
│   ├── components/     # React components
│   ├── hooks/          # Custom React hooks
│   ├── integrations/    # Supabase client setup
│   ├── pages/          # Page components
│   └── lib/            # Utility functions
├── supabase/
│   ├── functions/      # Edge Functions (backend)
│   └── migrations/     # Database migrations
└── public/             # Static assets
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📝 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

Built with React, Supabase, and modern web technologies.
