# SEO Content Analyzer

An AI-powered SEO analysis and content generation platform that helps businesses optimize their online presence through competitor analysis, LLM-optimized content, and multi-model comparison.

## Features

### 🔍 SEO Analysis
- **Website Scraping**: Extract and analyze content from any URL using Firecrawl
- **Competitor Analysis**: Identify and analyze competitor strategies
- **Query Generation**: AI-generated SEO queries tailored to your business

### 🤖 Multi-LLM Support (BYOK)
- **Bring Your Own Key**: Configure your own API keys for various LLM providers
- **Supported Providers**:
  - OpenAI (GPT-4o, GPT-4o-mini, GPT-4 Turbo)
  - Anthropic (Claude 4 Sonnet, Claude 4 Opus)
  - Google (Gemini 2.0 Flash, Gemini 1.5 Pro)
  - Perplexity (Sonar, Sonar Pro)
- **Model Comparison**: Compare responses across different LLMs side-by-side

### 📝 Content Generation
- Generate SEO-optimized HTML content
- Export content in multiple formats
- CMS publishing integration

### 👤 User Management
- Secure authentication system
- Per-user API key management
- Company profile management

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui
- **Backend**: Lovable Cloud (Supabase)
- **Database**: PostgreSQL with Row Level Security
- **Edge Functions**: Deno runtime
- **External APIs**: Firecrawl, OpenAI, Anthropic, Google AI, Perplexity

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- A Lovable account (for backend features)

### Local Development

```bash
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to project directory
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install

# Start development server
npm run dev
```

### Configuration

1. **Authentication**: Sign up/login through the app
2. **API Keys**: Navigate to Settings → API Configuration to add your LLM provider keys
3. **Scraper Config**: Configure your Firecrawl API key in Settings → Scraper Configuration

## Security

### Data Protection
- **Row Level Security (RLS)**: All database tables enforce owner-only access policies
- **JWT Verification**: All edge functions validate authentication tokens
- **API Key Masking**: Keys display only last 4 characters in the UI (e.g., `••••••••••••abcd`)

### Best Practices
- API keys are stored per-user and never exposed to other users
- All sensitive operations require authenticated sessions
- Server-side credential usage prevents client-side exposure

### Security Considerations
- API keys are stored in the database with RLS protection
- For production deployments, consider enabling Supabase Vault for encryption at rest
- Regular key rotation is recommended

## Project Structure

```
src/
├── components/          # React components
│   ├── settings/        # Settings page components
│   └── ui/              # shadcn/ui components
├── hooks/               # Custom React hooks
├── integrations/        # Supabase client & types
├── lib/                 # Utilities and API helpers
├── pages/               # Route pages
└── test/                # Test files

supabase/
└── functions/           # Edge functions
    ├── seo-analyze/     # SEO analysis endpoint
    ├── seo-generate/    # Content generation
    ├── seo-scrape/      # Website scraping
    ├── seo-search/      # Search functionality
    └── seo-llm-compare/ # LLM comparison
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `/seo-analyze` | Analyze website for SEO insights |
| `/seo-generate` | Generate optimized content |
| `/seo-generate-query` | Generate SEO queries |
| `/seo-scrape` | Scrape website content |
| `/seo-search` | Search functionality |
| `/seo-llm-compare` | Compare LLM responses |
| `/cms-publish` | Publish content to CMS |

## Environment Variables

The following variables are automatically configured by Lovable Cloud:
- `VITE_SUPABASE_URL` - Backend URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Public API key
- `VITE_SUPABASE_PROJECT_ID` - Project identifier

## Deployment

### Via Lovable
1. Open your project in Lovable
2. Click **Share → Publish**
3. Your app will be deployed to a `.lovable.app` subdomain

### Custom Domain
1. Navigate to Project → Settings → Domains
2. Click "Connect Domain"
3. Follow DNS configuration instructions

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private and proprietary.

---

Built with [Lovable](https://lovable.dev)
