# PolicyLens AI - Government Policy Navigator

A smart web application that helps Indian citizens understand government policies personalized for them using AI analysis.

## Features

- **Smart Search**: Find relevant policies using natural language
- **Eligibility Check**: Instant personalized eligibility analysis
- **AI Assistant**: Ask questions and get clear answers about government schemes
- **Policy Categories**: Browse policies by category (Education, Agriculture, Health, Employment, Social Welfare)
- **User Profiles**: Complete your profile for personalized recommendations

## Getting Started

### Prerequisites
- Node.js 18+ or Bun
- npm or Bun package manager

### Installation

```bash
npm install
# or
bun install
```

### Development

```bash
npm run dev
# or
bun run dev
```

The application will be available at `http://localhost:5173`

### Build

```bash
npm run build
# or
bun run build
```

## Technology Stack

- **Frontend**: React 19 + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Build Tool**: Vite
- **Backend**: Supabase
- **AI**: OpenAI API for policy analysis

## Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/          # Page components
├── hooks/          # Custom React hooks
├── lib/            # Utility functions and libraries
├── integrations/   # Third-party integrations
└── App.tsx         # Main app component
```

## License

MIT
