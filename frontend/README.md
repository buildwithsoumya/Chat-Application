# ChatSphere Frontend

Vite + React + TypeScript chat UI for ChatSphere.

## Tech Stack

- Vite
- React 19
- TypeScript
- React Router
- Zustand (state management)
- Axios (REST API)
- Tailwind CSS
- shadcn/ui components

## Prerequisites

- Node.js 18+
- pnpm, npm, or yarn
- Running ChatSphere backend (see `../backend`)

## Environment Variables

Copy `.env.example` to `.env` and adjust the values:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:8000` | Backend REST API base URL |
| `VITE_WS_URL` | derived from `VITE_API_URL` | Backend WebSocket base URL |

## Available Scripts

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Type-check and build for production
npm run build

# Lint with Oxlint
npm run lint

# Preview production build
npm run preview
```

The dev server runs at `http://localhost:5173` by default.

## Project Structure

```text
src/
├── components/       # UI components (chat, sidebar, common, ui)
├── pages/            # Route-level pages
├── routes/           # Protected route wrappers
├── services/         # API and WebSocket service modules
├── store/            # Zustand stores (auth, chat, toast)
├── lib/              # Axios instance and utilities
├── hooks/            # Custom React hooks
├── types/            # Shared TypeScript types
└── utils/            # Helper utilities
```

## Notes

- Messages are sent over WebSocket for real-time delivery; the backend persists and broadcasts them.
- Authentication uses JWT tokens stored in `localStorage` (HttpOnly cookies are recommended for production hardening).
- Conversation creation requires selecting at least one participant via the `GET /users/search` endpoint.
