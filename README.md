# Synapse Snake (SNKRX Engine Port)

A high-fidelity arcade survival auto-battler inspired by: [SNKRX](https://github.com/a327ex/SNKRX), completely rebuilt with a custom React + ECS Render Engine on HTML5 Canvas.

## 🌟 Huge Shoutout and Inspiration
This project is a direct tribute to **[a327ex/SNKRX](https://github.com/a327ex/SNKRX)**, a masterclass in minimalist game design, deep synergies, and "juicy" combat feel. 

I highly recommend checking out [the original repository](https://github.com/a327ex/SNKRX) and playing the phenomenal game on Steam.

## 🛠️ Technology Stack
- **Library**: React 18
- **Bundler**: Vite
- **Language**: TypeScript
- **Auth**: Clerk (`@clerk/clerk-react`)
- **Analytics**: Vercel Analytics (`@vercel/analytics`)
- **Styling**: Tokenized CSS Utility Framework (`index.css`) + BEM Layouts (`App.css`)
- **Rendering Engine**: Custom Entity-Component-System (ECS) running on the `HTML5 Canvas API`

## 🕹️ Features
- **Dynamic Classes & Synergies**: Combine different heroes to unlock powerful class-based area effects and stat boosts.
- **Procedural Rendering**: No image assets/sprites. Every visual element is procedurally drawn on the Canvas.
- **Exponential Scaling**: Enemies scale dynamically in health and speed to provide a challenging rogue-lite experience.
- **The Armory**: Strategically purchase heroes, merge duplicates for power spikes, and manage your snake's max capacity.
- **Built-in Wiki**: Access comprehensive data on heroes, classes, and synergies directly in-game.
- **Dev Mode**: Test synergies and late-game scenarios without having to play through the early levels.

## 🔑 Authentication Setup
Clerk authentication guards the game logic. To run this project locally, you must provide your own API key:
1. Create a `Clerk` application on their dashboard.
2. Create a `.env.local` file in the root directory.
3. Set `VITE_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY` or `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY`.

## 🚀 Getting Started

```bash
# Install the web port dependencies
npm install

# Run the development server locally at http://localhost:5173
npm run dev
```

## 🏗️ Deployment (Vercel)
This project is structured as a standard SPA, ready to be deployed instantly on [Vercel](https://vercel.com):
1. Import your GitHub repository to Vercel.
2. Set the framework preset to **Vite**.
3. Leave the root directory as `/`. 
4. Build command: `npm run build`
5. Output directory: `dist`
6. Click **Deploy**.
