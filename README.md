# Industry 5.0 Sustainable Digitalization Index Platform

A comprehensive assessment platform for evaluating organizational digital maturity across the Industry 5.0 framework. This application enables organizations to conduct self-assessments, track progress, and benchmark against maturity levels.

## Features

### For Administrators
- **Assessment Framework Management**: Create and maintain index versions with pillars, dimensions, and questions
- **Hierarchy Management**: Organize assessment structure with drag-and-drop interface
- **Orphan Recovery**: Automatically handle data consistency issues after deletions
- **Scoring Configuration**: Define custom scoring formulas and maturity levels
- **Analytics Dashboard**: View aggregate results with filterable charts and metrics
- **Data Export**: Download results in CSV format for further analysis

### For Respondents
- **Self-Assessment Portal**: Complete structured surveys organized by assessment area
- **Progress Tracking**: Save progress and resume assessments at any time
- **Flexible Question Types**: Support for single/multi-choice, Likert scale, and text responses
- **Results Reporting**: View personalized scores, maturity levels, and detailed breakdowns
- **Downloadable Reports**: Export assessment results for documentation

## Quick Start

### Prerequisites
- Node.js 18+ 
- pnpm 10+ (or npm/yarn)
- Supabase account with PostgreSQL database
- Vercel account (for deployment, optional for local development)

### Local Development

1. **Clone and Install**
```bash
git clone <repository-url>
cd <project-directory>
pnpm install
```

2. **Configure Environment**
```bash
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
```

3. **Run Development Server**
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

Create `.env.local`:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Auth
BETTER_AUTH_SECRET=<generate with: openssl rand -base64 32>

# Database (optional, use Supabase URL above)
POSTGRES_URL=postgresql://user:pass@host:5432/db
```

See `.env.example` for complete list of variables.

## Application Structure

```
/app
  /admin                 # Admin dashboard routes
    /versions           # Index version management
    /hierarchy          # Pillar/dimension/question management
    /formulas           # Scoring formula configuration
    /orphans            # Orphan recovery center
    /results            # Analytics and results dashboard
  /api                   # API endpoints
    /admin              # Admin API routes
    /respondent         # Respondent API routes
    /auth               # Authentication routes
  /auth                  # Auth pages (login, signup)
  /respondent            # Respondent dashboard and surveys

/components
  /admin                 # Admin-specific UI components
  /respondent            # Respondent-specific UI components
  /results               # Results visualization components
  /ui                    # Shared UI components

/lib
  scoring-engine.ts      # Score calculation logic
  hierarchy-validator.ts # Data validation utilities
  orphan-handler.ts      # Orphan recovery utilities
  supabase/              # Database client configurations
```

## Key Workflows

### Creating an Assessment
1. Admin creates Index Version (e.g., "Industry 5.0 SDI v1.0")
2. Admin adds Pillars (5 main assessment areas)
3. Admin defines Dimensions under each Pillar
4. Admin creates Questions under each Dimension
5. Admin configures Scoring Formulas and Maturity Levels
6. Admin publishes Index Version

### Conducting Assessment
1. Respondent logs into portal
2. Views available surveys assigned to them
3. Starts survey, sees questions organized by pillar
4. Responds to questions (auto-saved)
5. Can resume later from progress point
6. Submits survey when complete
7. Views results and maturity level

### Analyzing Results
1. Admin navigates to Results Dashboard
2. Filters by Index Version, Company, Date Range
3. Views summary statistics and charts
4. Drills into pillar-level breakdown
5. Exports data for external analysis

## Scoring Logic

The platform uses a hierarchical scoring system:

```
Question Responses (1-5 scale or multiple choice)
    ↓ (Weighted Average)
Dimension Score
    ↓ (Weighted Average)
Pillar Score
    ↓ (Weighted Average)
Overall Assessment Score
    ↓ (Score Range Mapping)
Maturity Level (Initial, Managed, Defined, Optimized)
```

Scores range from 0-100, and custom formulas can be applied at any level.

## API Documentation

### Admin Endpoints
```
GET    /api/admin/index-versions           # List versions
POST   /api/admin/index-versions           # Create version
GET    /api/admin/index-versions/[id]      # Get version
PUT    /api/admin/index-versions/[id]      # Update version
DELETE /api/admin/index-versions/[id]      # Delete version

GET    /api/admin/scoring-formulas         # List formulas
POST   /api/admin/scoring-formulas         # Create formula
PUT    /api/admin/scoring-formulas/[id]    # Update formula
DELETE /api/admin/scoring-formulas/[id]    # Delete formula

GET    /api/admin/maturity-levels          # List levels
POST   /api/admin/maturity-levels          # Create level
PUT    /api/admin/maturity-levels/[id]     # Update level
DELETE /api/admin/maturity-levels/[id]     # Delete level

GET    /api/admin/results/summary          # Results summary
GET    /api/admin/results/pillar-scores    # Pillar breakdowns

GET    /api/admin/orphans                  # List orphans
POST   /api/admin/orphans/reassign         # Reassign orphans
DELETE /api/admin/orphans/[id]             # Delete orphans
```

### Respondent Endpoints
```
GET    /api/respondent/surveys             # List assigned surveys
GET    /api/respondent/surveys/[id]        # Get survey with hierarchy
PUT    /api/respondent/surveys/[id]        # Submit survey
POST   /api/respondent/question-responses  # Save response
GET    /api/respondent/surveys/[id]/results # Get results
```

## Database Schema

### Core Tables
- **index_versions** - Assessment framework versions
- **pillars** - Top-level assessment categories
- **dimensions** - Sub-categories within pillars
- **questions** - Individual assessment questions
- **question_options** - Multiple choice options
- **scoring_formulas** - Formula configurations
- **maturity_levels** - Maturity classifications
- **survey_responses** - Survey submissions
- **survey_scores** - Calculated scores

All tables implement Row-Level Security (RLS) for data isolation.

## Deployment

### Deploy to Vercel

1. **Push to GitHub**
```bash
git add .
git commit -m "Initial deployment"
git push origin main
```

2. **Connect to Vercel**
- Visit vercel.com
- Click "New Project"
- Import Git repository
- Add environment variables
- Click "Deploy"

3. **Configure Post-Deployment**
- Update `NEXT_PUBLIC_SUPABASE_REDIRECT_URL` to Vercel domain
- Update Supabase auth redirect URLs
- Test authentication flow

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

## Development

### Available Scripts

```bash
pnpm dev      # Start development server
pnpm build    # Build for production
pnpm start    # Start production server
pnpm lint     # Run ESLint
pnpm type-check # Run TypeScript check
```

### Testing

```bash
# Run end-to-end tests
pnpm test:e2e

# Run unit tests
pnpm test
```

### Code Quality

- TypeScript for type safety
- ESLint for code quality
- Prettier for code formatting
- Tailwind CSS for styling consistency

## Troubleshooting

### Can't log in?
- Verify environment variables are set correctly
- Check Supabase auth settings
- Clear browser cookies
- Check console for error messages

### Database connection errors?
- Verify `POSTGRES_URL` or Supabase URL is correct
- Check firewall rules in Supabase
- Ensure database is running

### Surveys not showing?
- Verify surveys are published
- Check survey is assigned to your company
- Verify index version is active
- Check database for orphaned records

### Scores not calculating?
- Verify scoring formulas are configured
- Check that all question responses were saved
- Ensure maturity level score ranges are defined
- Check scoring engine logs

## Performance

- **Server-Side Rendering**: Fast initial page loads
- **Client-Side Caching**: SWR for data fetching
- **Database Optimization**: Indexed queries and connection pooling
- **Code Splitting**: Lazy-loaded routes and components
- **Auto-Scaling**: Vercel handles traffic spikes automatically

## Security

- Authentication via Better Auth with password hashing
- Row-Level Security (RLS) on all database tables
- CORS configuration for allowed origins
- SQL injection protection via parameterized queries
- Session-based authentication
- CSRF protection via framework defaults

## Support

- **Documentation**: See [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Issues**: Check GitHub issues or create a new one

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request
4. Code review and testing
5. Merge to main

## License

Proprietary - Industry 5.0 Sustainable Digitalization Index Platform

## Contact

For questions or support, contact the development team.

---

**Last Updated**: June 2026  
**Version**: 1.0  
**Status**: Production Ready
