# RozMitra

India-focused, multilingual gig worker companion for PromptWars.

## Current step

Application source is written. Installation, typecheck, tests, build, live API verification and deployment are left for the user to run manually as requested. No runtime success is claimed before those checks pass. Read SETUP.md for exact instructions.

## Stack

- Next.js and TypeScript: frontend and server-side API routes in one application.
- Native CSS: responsive, accessible interface without an extra styling toolchain.
- Render or Vercel: deploy the application and API routes together, or use the separate server/ backend entry point.
- Supabase Postgres and Auth: persistent user data and authentication, with row-level security.
- Gemini API: real server-side model calls; credentials stored in environment variables.
- Zod: validate inputs and model responses.
- Vitest and Playwright: meaningful unit and end-to-end checks.

No separate Render backend is needed for the initial scope.

## Required workflows

1. Earnings: enter and save income, expenses, unpaid amounts and working time; edit/delete entries and calculate totals in code. Monthly summaries cover all entries, with paginated history.
2. Support: use live Gemini Google Search grounding for welfare, rights, safety, and document questions; show the returned web sources. No admin source setup is needed for this workflow.
3. Grievances: collect missing facts, generate an editable complaint, save it, and download it.

## Login and admin

- User login: /login. Admin login: /admin/login. Source editor: /admin.
- Signup signs the worker in immediately when Confirm Email is disabled in Supabase Auth. Email ownership is not verified in this mode.
- Admin membership is checked server-side and enforced in database policies.
- A restricted source editor can add/edit only their own draft sources. The project owner approves publication manually in Supabase.
- Optional actual test credentials are displayed on the admin login page after the owner creates that dedicated account and configures the environment.
- Database schema and field names stay English. User-entered notes stay in their original language; no translated record copies are created.
- Gemini is used for live search-grounded guidance and complaint drafting. No key is embedded in frontend code.

## Acceptance rules

- Never invent earnings, scheme eligibility, citations, or complaint facts.
- Never replace a failed model call with a canned answer; show an error and retry option.
- Verify authentication and ownership for user data access.
- Keep model keys on the server; never commit secrets.
- Default to English with a visible English/Hindi/Punjabi selector. Translate interface labels, validation errors, and new AI answers; persist the language preference.
- Keep answers short and actionable, with optional expanded detail, large controls, and clear labels for older and less technical users.
- Start every account with an honest empty state. Never seed production dashboards with sample earnings, complaints, users, or activity.
- Save actual user inputs in the database; verify that they survive refresh and sign-in.
- Every visible action must work end-to-end. Omit unfinished features from the submitted interface.
- Test calculations, persistence, access isolation, and the full judge journey.

## Evaluation priorities

- High impact: code quality and problem statement alignment. Use small readable functions and connect every feature to a gig worker need.
- Medium impact: security and efficiency. Validate inputs, enforce ownership, keep secrets server-side, limit requests, and avoid redundant AI calls.
- Low impact: testing and accessibility. Include meaningful tests, semantic controls, keyboard support, readable contrast, responsive layouts, and both supported languages.
- All six parameters contribute to the score.

## Submission requirements from supplied organizer slides

- [ ] Submit the GitHub repository URL on the platform.
- [ ] Make the submitted repository public; exclude secrets and personal user data.
- [ ] Submit the deployed application URL.
- [ ] Provide a brief project description.
- [ ] State which GenAI services are actually used and where they are used.
- [ ] Provide a working project demo video URL.
- [ ] If authentication is enabled, provide evaluator test credentials through the submission channel. This is a real restricted test account, not seeded fake application output.
- [ ] Run every submitted workflow against the deployed application using fresh inputs, including honest API failure handling.

Synthetic fixtures may be used in automated tests only; they must never appear as real application data or be used as substitute AI responses in the submitted application.

## Remaining checklist

- [x] Create project folder and record the recommended stack.
- [x] Finalize a small three-workflow scope.
- [x] Write Next.js application, separate backend entry point, SQL migrations and manual setup guide.
- [x] Write meaningful currency, date, validation and source-domain tests.
- [ ] User configures environment variables and runs the three SQL migrations in order.
- [ ] User runs typecheck, tests and production build; fix any reported failures.
- [ ] Verify real Gemini and Supabase connections.
- [ ] Verify each workflow using fresh inputs.
- [ ] Review source accuracy, security, efficiency, and accessibility.
- [ ] Deploy and test the submission using fresh inputs.
