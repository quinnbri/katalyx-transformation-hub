
# KATALYX – Full Platform MVP

## 1. Brand & Design System
- Apply custom brand colors: Primary Teal (#0d9488) and Accent Coral (#ff6b6b) throughout the Tailwind config
- Clean, professional typography matching the existing katalyx.io aesthetic
- Light theme with subtle teal accents on cards and interactive elements

## 2. Landing Page (Public)
Recreate the existing katalyx.io landing page with these sections:
- **Header**: KATALYX logo + nav with "Login" and "Start Assessment" CTA (coral button)
- **Hero**: "80% of Digital Transformations Fail. Here's Why Yours Won't." with teal accent text, CTA button, trust badges (No credit card • 30 minutes • Instant results)
- **Stats bar**: 50+ Enterprise Implementations, $100M+ Pipeline, 15 Years, 5 Domains
- **How It Works**: 3-step process (Take Assessment → Get Roadmap → Start Transforming)
- **What You Get**: 4 feature cards (Enterprise Maturity Assessment, AI-Powered Roadmap, Team DevOps Assessments, Implementation Playbooks)
- **Why Most Transformations Fail**: Value proposition section
- **Creator section**: Brian Quinn credentials
- **Final CTA**: "Ready to Transform with Confidence?"
- **Footer**: Copyright + contact email

## 3. Authentication
- Email/password signup and login pages using Supabase Auth
- User profiles table to store name, company, and role
- Protected routes for the assessment dashboard
- Redirect to dashboard after login

## 4. User Dashboard
- Overview of available assessments (3 frameworks)
- List of past/in-progress assessments with status and scores
- Quick-start buttons to begin a new assessment

## 5. Assessment Framework: AI Readiness
- Multi-step questionnaire covering AI strategy, data readiness, talent, infrastructure, and governance
- Progress indicator showing completion percentage
- Save progress so users can resume later
- Questions stored in the database for easy editing

## 6. Assessment Framework: DevOps Team Assessment
- DORA metrics-based questionnaire
- Questions covering deployment frequency, lead time, change failure rate, and recovery time
- Benchmarking context against industry standards

## 7. Assessment Framework: Enterprise Operating Model
- Comprehensive assessment across 5 domains: Strategy, Organization, Platform, Operations, Governance
- Capability-level scoring within each domain

## 8. AI-Powered Results & Roadmap
- After completing an assessment, responses are sent to an AI model (via Lovable AI gateway)
- AI generates a maturity score breakdown by domain/category
- AI produces a prioritized transformation roadmap with specific actions, effort estimates, and impact ratings
- Results are saved and viewable anytime from the dashboard

## 9. Results Dashboard
- Visual maturity scores with radar/bar charts (using Recharts)
- Domain-by-domain breakdown with strengths and gaps highlighted
- Downloadable/viewable AI-generated roadmap with prioritized action items
- Ability to compare results over time if the assessment is retaken

## 10. Backend (Supabase + Lovable Cloud)
- **Database tables**: profiles, assessments, assessment_questions, assessment_responses, assessment_results
- **Edge functions**: AI roadmap generation endpoint
- **RLS policies**: Users can only access their own data
- **Storage**: For any exported reports (future)
