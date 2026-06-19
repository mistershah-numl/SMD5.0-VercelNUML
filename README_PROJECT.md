# SDM5 Industry 5.0 Sustainable Digitalization Assessment Platform

A comprehensive assessment platform for evaluating an organization's digital sustainability maturity based on the Industry 5.0 framework.

## 🎯 Project Overview

The SDM5 platform enables organizations to:

- **Create Assessment Versions**: Build customized assessment frameworks with pillars, dimensions, and questions
- **Manage Hierarchy**: Organize assessment structure with orphan recovery capabilities
- **Configure Scoring**: Define scoring formulas and maturity level classifications
- **Distribute Surveys**: Send surveys to respondents for completion
- **Analyze Results**: Visualize and export assessment results with analytics

## 🏗️ Architecture

### Technology Stack
- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth
- **Deployment**: Vercel

### System Components

```
┌─────────────────┐
│   Admin Portal  │  Create assessments, configure scoring
└────────┬────────┘
         │
    ┌────┴─────┬──────────────┐
    │           │              │
┌───▼──┐   ┌───▼──┐      ┌───▼──┐
│ API  │   │ Auth │      │Data  │
└──────┘   └──────┘      │Store │
                         └──────┘
    │
┌───▼────────────┐
│ Respondent     │  Take surveys, submit responses
│ Portal         │
└────────────────┘
    │
    ├─► Analytics Dashboard
    ├─► Orphan Recovery
    └─► Results Export
```

## 📁 Project Structure

```
sdm5-platform/
├── app/
│   ├── admin/                 # Admin dashboard
│   ├── respondent/            # Respondent portal
│   ├── auth/                  # Authentication
│   └── api/                   # Backend APIs
├── components/
│   ├── admin/                 # Admin components
│   ├── respondent/            # Respondent components
│   └── ui/                    # Shared UI components
├── lib/
│   ├── supabase/             # Supabase client setup
│   ├── scoring-engine.ts     # Scoring calculations
│   ├── orphan-handler.ts     # Orphan management
│   └── hierarchy-validator.ts # Hierarchy validation
├── middleware.ts             # Session management
└── package.json
```

## 🚀 Getting Started

### Local Development

1. **Clone and install**
   ```bash
   git clone <repository>
   cd sdm5-platform
   pnpm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env.local
   # Add your Supabase credentials
   ```

3. **Run development server**
   ```bash
   pnpm dev
   ```

4. **Access locally**
   - Admin: http://localhost:3000/admin
   - Respondent: http://localhost:3000/respondent
   - Auth: http://localhost:3000/auth/login

### Database Setup

Database schema is automatically created in Supabase. All tables have RLS policies enabled for security.

Key tables:
- `companies` - Organization profiles
- `index_versions` - Assessment versions
- `pillars` - Assessment pillars
- `dimensions` - Dimension groupings
- `questions` - Assessment questions
- `survey_responses` - Response tracking
- `question_responses` - Individual answers
- `assessment_results` - Calculated scores
- `scoring_formulas` - Scoring rules
- `maturity_levels` - Maturity classifications

## 📊 Features

### Admin Features

#### Assessment Management
- Create/edit assessment versions
- Manage pillar structure (add, edit, delete, reorder)
- Configure dimensions within pillars
- Add questions with multiple types
- Track and recover orphaned items

#### Scoring Configuration
- Define scoring formulas (sum, avg, weighted_avg, custom)
- Set maturity level thresholds
- Configure formula operators
- Map numeric scores to maturity levels

#### Analytics
- Dashboard with summary statistics
- Pillar-level performance analysis
- Maturity level distribution
- Results export to CSV
- Response tracking and completion rates

#### Orphan Management
- View all orphaned items (pillars, dimensions, questions)
- Filter by deletion reason
- Permanent deletion of orphaned items
- Bulk reassignment capability

### Respondent Features

#### Survey Portal
- List of assigned surveys
- Survey progress tracking
- Question navigation (next/previous)
- Multiple question types:
  - Single-choice (radio buttons)
  - Multiple-choice (checkboxes)
  - Scale (1-5 Likert scale)
  - Text response

#### Response Management
- Auto-save responses as you answer
- Resume incomplete surveys
- View completion status
- Submit final responses

## 🔐 Security

### Authentication
- Email/password authentication via Supabase
- Session management with middleware
- Automatic redirects for unauthorized access
- Token refresh handling

### Data Protection
- Row Level Security (RLS) policies on all tables
- User data scoped to authenticated user
- Survey responses linked to user ID
- API validation and authentication checks

### Privacy
- No user data shared across organizations
- Company isolation at RLS level
- Audit logs for compliance tracking

## 📈 Scoring Algorithm

The scoring engine uses weighted averages at each hierarchy level:

```
Question Responses → Dimension Score
Dimension Scores → Pillar Score
Pillar Scores → Overall Score
Overall Score → Maturity Level
```

Each component supports weight configuration for customized scoring.

## 🛠️ API Routes

### Admin
- `GET /api/admin/companies` - List companies
- `POST /api/admin/companies` - Create company
- `GET /api/admin/index-versions` - List versions
- `POST /api/admin/index-versions` - Create version
- `GET /api/admin/pillars` - List pillars
- `POST /api/admin/pillars` - Create pillar
- `GET /api/admin/dimensions` - List dimensions
- `POST /api/admin/dimensions` - Create dimension
- `GET /api/admin/questions` - List questions
- `POST /api/admin/questions` - Create question
- `GET /api/admin/scoring-formulas` - List formulas
- `POST /api/admin/scoring-formulas` - Create formula
- `GET /api/admin/maturity-levels` - List levels
- `POST /api/admin/maturity-levels` - Create level
- `GET /api/admin/orphans` - List orphaned items
- `GET /api/admin/results/summary` - Results summary
- `GET /api/admin/results/pillar-scores` - Pillar analytics

### Respondent
- `GET /api/respondent/surveys` - List surveys
- `POST /api/respondent/surveys` - Start survey
- `GET /api/respondent/surveys/[id]` - Get survey details
- `POST /api/respondent/question-responses` - Save answer

## 🔄 Orphan Handling

When a parent item is deleted, children become orphaned:

- **Pillar deleted** → Dimensions orphaned
- **Dimension deleted** → Questions orphaned
- **Version deleted** → All pillars orphaned

The Orphan Recovery Center allows:
- View all orphaned items
- Filter by type and deletion reason
- Reassign to new parents
- Permanently delete

## 📦 Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables
4. Deploy

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

## 🧪 Testing

### Manual Testing Checklist
- [ ] Admin can create assessment version
- [ ] Admin can add pillars/dimensions/questions
- [ ] Admin can configure scoring formulas
- [ ] Admin can view results dashboard
- [ ] Respondent can view surveys
- [ ] Respondent can complete survey
- [ ] Responses are saved automatically
- [ ] Results calculate correctly
- [ ] Orphan recovery works

### Browser Testing
- Chrome/Chromium
- Firefox
- Safari
- Mobile browsers

## 📝 Documentation

- [Deployment Guide](./DEPLOYMENT.md) - Production deployment
- [API Reference](./API.md) - Endpoint documentation
- [Scoring Guide](./SCORING.md) - Scoring configuration
- [User Guide](./USERGUIDE.md) - End-user documentation

## 🤝 Contributing

For internal development:

1. Create feature branch
2. Make changes
3. Test locally
4. Create pull request
5. Deploy to staging
6. Merge to production

## 📞 Support

- **Supabase Issues**: supabase.com/docs
- **Next.js Help**: nextjs.org/docs
- **Vercel Support**: vercel.com/help

## 📄 License

Proprietary - All rights reserved
