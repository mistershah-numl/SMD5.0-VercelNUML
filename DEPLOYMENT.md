# SDM5 Assessment Platform - Deployment Guide

## Overview

The SDM5 Industry 5.0 Sustainable Digitalization Assessment Platform is a comprehensive Next.js application with Supabase backend. This guide covers deployment, setup, and configuration.

## Prerequisites

Before deploying, ensure you have:

- Vercel account (vercel.com)
- Supabase project (supabase.com)
- GitHub account for version control
- Node.js 18+ locally (for development)

## Setup Steps

### 1. Database Setup (Supabase)

The database schema is already created with the following tables:

- **companies**: Organization profiles
- **index_versions**: Assessment versions
- **pillars**: Assessment pillars
- **dimensions**: Dimensions within pillars
- **questions**: Assessment questions
- **question_options**: Answer options for questions
- **scoring_formulas**: Scoring rules
- **maturity_levels**: Maturity classifications
- **survey_responses**: Survey response tracking
- **question_responses**: Individual question answers
- **assessment_results**: Calculated assessment scores
- **audit_logs**: System audit trail

All tables have RLS (Row Level Security) policies enforced at the project level.

### 2. Environment Variables

Create a `.env.local` file with these variables:

```
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your-supabase-publishable-key>
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/auth/callback
```

For Vercel deployment, add these to your project settings:
- Settings > Environment Variables

### 3. Deployment to Vercel

#### Option A: Using GitHub (Recommended)

1. Push code to GitHub repository
2. Go to vercel.com and sign in
3. Click "New Project" > "Import Git Repository"
4. Select your repository
5. Configure environment variables
6. Click "Deploy"

#### Option B: CLI Deployment

```bash
npm install -g vercel
vercel login
vercel
```

### 4. Post-Deployment Configuration

After deploying to Vercel:

1. Update `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` in environment variables:
   ```
   https://your-domain.vercel.app/auth/callback
   ```

2. Update Supabase authentication settings:
   - Go to Authentication > URL Configuration
   - Add your Vercel domain to Redirect URLs

3. Verify RLS policies in Supabase:
   - All tables should have RLS enabled
   - Policies should restrict access to user's own data

## Project Structure

```
/app
  /admin                    # Admin portal
    /versions              # Assessment version management
    /formulas              # Scoring formula configuration
    /orphans               # Orphan recovery center
    /results               # Analytics dashboard
  /api
    /admin                 # Admin API routes
    /respondent            # Respondent API routes
  /auth                     # Authentication pages
  /respondent              # Respondent portal

/components
  /admin                   # Admin UI components
  /respondent              # Respondent UI components
  /ui                      # Shared UI components

/lib
  supabase/               # Supabase client/server configs
  orphan-handler.ts       # Orphan management utilities
  hierarchy-validator.ts  # Hierarchy validation
  scoring-engine.ts       # Scoring calculation engine
```

## Key Features

### Admin Features
- Create and manage assessment versions
- Define pillars, dimensions, and questions
- Configure scoring formulas
- Set maturity levels
- View orphaned items and recovery options
- Analytics and results dashboard
- Export results as CSV

### Respondent Features
- View available surveys
- Complete surveys with progress tracking
- Multiple question types (single-choice, multi-choice, scale, text)
- Auto-save responses
- View completion status

## API Endpoints

### Admin APIs
- `GET/POST /api/admin/companies` - Company management
- `GET/POST/PUT/DELETE /api/admin/index-versions/[id]` - Assessment versions
- `GET/POST/PUT/DELETE /api/admin/pillars/[id]` - Pillars
- `GET/POST/PUT/DELETE /api/admin/dimensions/[id]` - Dimensions
- `GET/POST/PUT/DELETE /api/admin/questions/[id]` - Questions
- `GET/POST/PUT/DELETE /api/admin/scoring-formulas/[id]` - Scoring formulas
- `GET/POST/PUT/DELETE /api/admin/maturity-levels/[id]` - Maturity levels
- `GET /api/admin/orphans` - Orphaned items
- `POST /api/admin/orphans/reassign` - Reassign orphans
- `DELETE /api/admin/orphans/[id]` - Delete orphans
- `GET /api/admin/results/summary` - Results summary
- `GET /api/admin/results/pillar-scores` - Pillar analytics

### Respondent APIs
- `GET/POST /api/respondent/surveys` - Survey management
- `GET/PUT /api/respondent/surveys/[id]` - Survey responses
- `POST /api/respondent/question-responses` - Save question response

## Scoring Engine

The scoring engine calculates assessments using:

1. **Dimension Scores**: Weighted average of question responses
2. **Pillar Scores**: Weighted average of dimension scores
3. **Overall Score**: Weighted average of pillar scores
4. **Maturity Levels**: Mapped from numeric scores to classifications

Supported operators:
- `sum` - Sum of all scores
- `avg` - Average of scores
- `weighted_avg` - Weighted average (default)
- `min` - Minimum score
- `max` - Maximum score
- `custom` - Custom expression evaluation

## Security

- All data isolated by user via RLS policies
- Supabase Auth for user management
- API routes validate user authentication
- Questions and surveys scoped to company/version
- Audit logs track all modifications

## Troubleshooting

### Build Issues
- Clear `.next` folder
- Reinstall dependencies: `pnpm install`
- Check Node version: `node --version`

### Database Issues
- Verify RLS policies are enabled
- Check Supabase connection in .env
- Verify API keys have correct permissions

### Auth Issues
- Verify redirect URL matches deployment domain
- Check Supabase authentication settings
- Clear browser cookies and try again

## Support

For issues or questions:
1. Check Supabase documentation: supabase.com/docs
2. Review Next.js docs: nextjs.org/docs
3. Contact Vercel support: vercel.com/help

## License

This project is proprietary software for the SDM5 Assessment Platform.
