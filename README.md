# Dev Analytics Dashboard

A real-time analytics dashboard that visualizes GitHub profile statistics, built with Django, Next.js, and WebSockets.

**Tech Stack:** Django Ninja (Backend) · Next.js (Frontend) · PostgreSQL · Tailwind CSS · WebSockets

## The Problem
Developers and recruiters often need a quick, visual way to assess a GitHub profile's activity, language distribution, and contribution consistency. This dashboard consumes the public GitHub API, processes the data, and presents it in a clean, real-time interface.

## Engineering Decisions
*(This section is crucial for recruiters. It shows how you think.)*

- **WebSockets over Polling:** Implemented Django Channels and WebSockets to push real-time updates to the frontend instead of forcing the client to poll the server every few seconds. This reduces server load and improves the user experience.
- **Caching Strategy:** GitHub's public API has strict rate limits (60 requests/hour for unauthenticated users). Implemented a Redis-backed caching layer to store fetched profile data for 15 minutes. This prevents the app from breaking under heavy traffic and avoids rate-limit bans.
- **Data Processing:** Chose to process and aggregate the raw GitHub API response on the server side before sending it to the frontend. This keeps the client lightweight and ensures that the heavy lifting is done where it belongs.

## Features
- Search for any public GitHub user
- Visualize commit activity, language breakdown, and repository stats
- Real-time updates via WebSockets
- Responsive design (mobile-first)

## Local Setup
1. Clone the repo.
2. Backend: `cd backend && pip install -r requirements.txt && python manage.py migrate && python manage.py runserver`
3. Frontend: `cd frontend && npm install && npm run dev`
4. Set up `.env` for database credentials and GitHub API token (optional, to increase rate limits).
