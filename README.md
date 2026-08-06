# Tomo

Tomo is a quiet space for personal reflection. It is a web application built to listen and support you. 

## Features

* Privacy First: Your data is secure. Your conversations are never used to train models.
* Personalized Experience: You configure your identity, language, and goals before starting.
* Multi-Language Support: Tomo can talk with you in English, Hindi, Bengali, Urdu, and other regional languages.
* Session Modes: You can choose between a classic open chat or a guided session.
* Gen Z Mode: A toggle to make the conversation feel more casual.
* Proactive Empathy: Tomo checks in on you if you hesitate or delete long messages.
* Long-Term Memory: Tomo remembers past conversations to build context for future sessions.

## Tech Stack

* Frontend: Next.js and React
* Backend: Next.js API Routes
* Database and Auth: Supabase
* Intelligence: OpenRouter API

## Setup

1. Clone the repository.
2. Run `npm install` to install dependencies.
3. Copy `.env.example` to `.env.local` and add your keys.
4. Run `npm run dev` to start the local server.
5. Open `http://localhost:3000` in your browser.

## Environment Variables

You need the following keys in your `.env.local` file:

* `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL.
* `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase public anon key.
* `OPENROUTER_API_KEY`: Your OpenRouter API key.
