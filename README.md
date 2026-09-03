# Brno Fried Cheese

This is a small React application that lists Brno restaurants serving Smažený sýr and shows the price for each offer. When a restaurant does not list a price, the app shows `N/A` instead of an empty or broken value.

## Purpose

The app provides a simple browser-based interface for the curated Brno fried-cheese dataset. It reads from the local dataset file, renders restaurant cards, and makes the menu information easy to browse without inspecting raw JSON.

## Features

- restaurant list with dish names
- price display for each restaurant
- graceful fallback to `N/A` when pricing is missing
- responsive single-page layout
- GitHub Pages deployment workflow

## Local development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev -- --host 0.0.0.0
   ```
3. Open the local address shown in the terminal, typically:
   ```text
   http://localhost:5173/
   ```

## Production build

```bash
npm run build
```

The optimized static files are generated in the `dist/` folder.

## Linting

```bash
npm run lint
```

## GitHub Pages deployment

This repository includes a GitHub Actions workflow in `.github/workflows/deploy-pages.yml` that builds the app and deploys it to GitHub Pages after every push to `master`.

## Project structure

- `src/` — React application source
- `src/data.js` — dataset import and normalizer
- `src/main.jsx` — app rendering and list UI
- `src/styles.css` — styling
- `brno-fried-cheese-app.js` — restaurant dataset
- `README.md` — project overview
- `.github/workflows/` — deployment automation
