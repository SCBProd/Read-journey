# Read Journey

Read Journey is a responsive reading tracker built with Next.js and React. It helps readers discover books, organize a personal library, and track reading sessions and progress.

## Features

- Registration and login screens with Firebase integration
- Recommended books and book search/filtering
- Personal library with reading-status filters
- Reading sessions with diary and statistics views
- Responsive layouts for desktop, tablet, and mobile

## Requirements

- Node.js 20.9 or later
- npm

## Getting started

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available scripts

| Command         | Description                                |
| --------------- | ------------------------------------------ |
| `npm run dev`   | Start the Next.js development server       |
| `npm run build` | Create a production build                  |
| `npm run start` | Start the production server after building |

## Pages

- `/` — home and book recommendations
- `/register` — create an account
- `/login` — sign in
- `/library` — personal book library
- `/reading` — reading session and progress tracking
- `/recommended` — browse recommended books

## Tech stack

- Next.js 16
- React 18
- Axios
- React Hook Form and Yup
- Chart.js with `react-chartjs-2`

