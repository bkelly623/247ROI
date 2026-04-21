# 247ROI Website

Next.js marketing site for **247ROI** — positioning: **revenue / ROI around the clock**, including while you sleep.

Forked from the Automagixx site framework (same layout stack, rebranded copy and messaging).

## Setup

```bash
npm install
cp .env.example .env   # if present; configure OPENAI_API_KEY for chat, etc.
npm run dev
```

## Before production

- [ ] Register **`contact@247roi.com`** (or your chosen address) and enable [FormSubmit](https://formsubmit.co) for intake + any forms.  
- [ ] Point legal URLs and footer if the live domain differs from `247roi.com`.  
- [ ] Replace `test-chatbot` embed URL if you deploy a dedicated chat server.  
- [ ] Swap `public/logo-robot.png` if you want a 247ROI-specific mark.

## Scripts

- `npm run dev` — local dev  
- `npm run build` — production build  
- `npm run lint` — ESLint  
