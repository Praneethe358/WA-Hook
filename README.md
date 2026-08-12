# WA-Hook

A Local WhatsApp Cloud API simulator and webhook handler.

## Features
- Webhook Verification Handshake
- Outgoing WhatsApp Graph API Mock
- Designed for local testing of WhatsApp integrations

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and adjust variables if needed
4. Run the development server: `npm run dev`

The server will start (default port `3000`).

## Endpoints
- Webhook Verification: `GET /webhook`
- Outbound Mock API: `POST /v19.0/:phoneNumberId/messages`
