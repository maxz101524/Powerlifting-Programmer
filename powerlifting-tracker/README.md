# Powerlifting Progress Tracker

A simple, effective way to track your powerlifting progress.

## Features (MVP)

- User authentication (signup/login)
- Workout logging with spreadsheet-like interface
- Basic progress tracking and analytics
- Estimated 1RM calculation
- Simple dashboard with progress visualization

## Tech Stack

- **Frontend**: React.js, MUI Core, Recharts
- **Backend**: Node.js, Express.js
- **Database**: SQLite with Prisma ORM
- **Authentication**: JWT

## Getting Started

### Prerequisites

- Node.js (v14+)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   cd powerlifting-tracker
   cd client && npm install
   cd ../server && npm install
   ```
3. Set up environment variables (see .env.example)
4. Run database migrations:
   ```bash
   cd server
   npx prisma migrate dev
   ```
5. Start the development servers:
   - Backend: `npm run dev` in /server
   - Frontend: `npm start` in /client

## Project Structure

```
powerlifting-tracker/
├── client/               # Frontend React application
└── server/               # Backend Node.js/Express server
    └── prisma/           # Database schema and migrations
```

## License

MIT
