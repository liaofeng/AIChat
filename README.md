# AIChat

A chat application using DeepSeek's AI models.

## Environment Variables

The following environment variables are required:

- `DEEPSEEK_API_KEY`: Your DeepSeek API key for accessing the chat models
- `SESSION_SECRET`: Secret key for session management
- `PORT`: (Optional) Port number for the server, defaults to 3000

## Development

1. Install dependencies:
```bash
pnpm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your DEEPSEEK_API_KEY
```

3. Start the development server:
```bash
pnpm dev
```
