# Frontend Refactor Notes

## Step 01
- Goal: split admin-only UI away from `/supervisor` without changing the visual language.
- Rollback snapshots:
  - `.codex-refactor-backups/step-01/frontend/src/app/page.tsx`
  - `.codex-refactor-backups/step-01/frontend/src/app/supervisor/page.tsx`
  - `.codex-refactor-backups/step-01/frontend/src/app/supervisor/requests/page.tsx`
- Implemented:
  - Added `/admin`, `/admin/supervisor-requests`, `/admin/doctor-requests`, and `/admin/users`.
  - Added shared admin config and shared admin shell under `src/features/admin/`.
  - Redirected legacy `/supervisor/requests` to `/admin/supervisor-requests`.
  - Updated login routing so the admin account lands on `/admin`.
  - Removed the visible approvals entry point from `/supervisor` while keeping the supervisor UI style intact.
- Verification:
  - `node .\\node_modules\\typescript\\bin\\tsc --noEmit` passed in `frontend/`.

## Current Backend Contracts
- Admin-only endpoints require headers:
  - `x-actor-username`
  - `x-actor-password`
- Supervisor/admin approval endpoints:
  - `GET /supervisor/requests`
  - `POST /supervisor/requests/:id/decision`
  - `GET /supervisor/doctor-requests`
  - `POST /supervisor/doctor-requests/:id/decision`
  - `GET /supervisor/users`
  - `POST /supervisor/users/:id/block`
  - `POST /supervisor/users/:id/delete`
  - `POST /supervisor/users/:id/reapprove`
  - `POST /supervisor/users/:id/reapprove-doctor`
- Profile/chat routes used by regular dashboards:
  - `GET /auth/profile?identifier=...`
  - `POST /auth/change-password`
  - `POST /auth/update-profile`
  - `GET /chat/conversations?identifier=...`
  - `GET /chat/unread-count?identifier=...`
  - `GET /chat/search?q=...`
  - `POST /chat/start`
  - `GET /chat/:id/messages?identifier=...`
  - `PATCH /chat/:id/read`
  - `POST /chat/:id/messages`

## Route Direction
- `/supervisor`: supervisor-facing dashboard only
- `/admin`: admin landing page
- `/admin/supervisor-requests`: supervisor approval requests
- `/admin/doctor-requests`: doctor approval requests
- `/admin/users`: account management

## Important Notes
- Keep the amber/brown UI style unchanged for now.
- Prefer route separation first, deeper component extraction second.
- Avoid changing backend payload shapes during frontend cleanup.

## Step 02
- Goal: standardize internal frontend naming without changing routes or behavior.
- Rollback snapshots:
  - `.codex-refactor-backups/step-02/frontend/src/features/admin/AdminShell.tsx`
  - `.codex-refactor-backups/step-02/frontend/src/features/admin/admin-config.ts`
  - `.codex-refactor-backups/step-02/frontend/src/features/admin/types.ts`
- Naming convention:
  - Keep `src/app/**/page.tsx` and `src/app/layout.tsx` for Next.js route entry points.
  - Use feature folders under `src/features/<feature>/`.
  - Use `components/`, `lib/`, and `types/` subfolders inside each feature.
  - Use kebab-case filenames for internal files.
  - Keep React component export names in PascalCase.
- Implemented:
  - Moved `AdminShell.tsx` to `src/features/admin/components/admin-shell.tsx`.
  - Moved `admin-config.ts` to `src/features/admin/lib/admin-config.ts`.
  - Moved `types.ts` to `src/features/admin/types/admin.ts`.
  - Updated all admin-related imports.
- Verification:
  - `node .\\node_modules\\typescript\\bin\\tsc --noEmit` passed in `frontend/`.

## Step 03
- Goal: introduce the new ivory + brass + deep teal visual system and apply it across the main frontend shells.
- Rollback snapshots:
  - `.codex-refactor-backups/step-03/frontend/src/app/globals.css`
  - `.codex-refactor-backups/step-03/frontend/src/app/page.tsx`
  - `.codex-refactor-backups/step-03/frontend/src/app/doctor.page.tsx.bak`
  - `.codex-refactor-backups/step-03/frontend/src/app/patient.page.tsx.bak`
  - `.codex-refactor-backups/step-03/frontend/src/app/supervisor.page.tsx.bak`
  - `.codex-refactor-backups/step-03/frontend/src/features/admin/components/admin-shell.tsx`
- Implemented:
  - Replaced the old amber-heavy base styling with shared luxury-clinic tokens and component classes in `src/app/globals.css`.
  - Redesigned the auth screen shell in `src/app/page.tsx` around the new brand direction.
  - Rebuilt the admin shell and refreshed all admin route surfaces.
  - Restyled the doctor, patient, and supervisor shells and sidebars to use the same design system.
  - Added a reusable `ComingSoonModal` for unfinished sections so empty buttons now have intentional placeholders.
  - Added visible placeholder cues for still-in-progress areas such as game, leaderboard, settings, and some coordination views.
- Verification:
  - `node .\\node_modules\\typescript\\bin\\tsc --noEmit` passed in `frontend/`.

## Step 04
- Goal: stabilize frontend startup after Tailwind/Next resolution issues on Windows.
- Rollback snapshots:
  - `.codex-refactor-backups/step-04/frontend/package.json.before-next-webpack.json`
  - `.codex-refactor-backups/step-04/frontend/postcss.config.js`
  - `.codex-refactor-backups/step-04/frontend/.npmrc`
- Implemented:
  - Changed frontend dev scripts from `cross-env NEXT_DISABLE_TURBOPACK=1 next dev` to `next dev --webpack`.
  - Removed duplicate `postcss.config.js` and kept a single `postcss.config.mjs`.
  - Removed the empty `frontend/.npmrc` `script-shell=` override.
- Why:
  - The Tailwind v4 `@import "tailwindcss";` flow depends on one clean PostCSS configuration.
  - Next 16 already supports `--webpack`, so `cross-env` is unnecessary for this case and only makes Windows script resolution noisier.
  - An empty `script-shell=` is an invalid Windows script setting and can interfere with package-script execution.
- Verification:
  - `node .\\node_modules\\typescript\\bin\\tsc --noEmit` passed in `frontend/`.

## Step 05
- Goal: remove broken repo-level `script-shell` overrides that interfere with Windows package scripts.
- Rollback snapshots:
  - `.codex-refactor-backups/step-05/.npmrc`
  - `.codex-refactor-backups/step-05/backend/.npmrc`
- Implemented:
  - Deleted the root `.npmrc` empty `script-shell=` override.
  - Deleted the backend `.npmrc` empty `script-shell=` override.
- Notes:
  - The machine still has a global `%USERPROFILE%\\.npmrc` with `script-shell=C:\\Windows\\System32\\cmd.exe`.
  - That global setting is what makes `pnpm run dev` open an interactive `cmd` prompt instead of running the script.
  - `pnpm exec next ...` works because it bypasses the broken package-script shell setup.

## Step 06
- Goal: replace the previous brass/amber redesign with the new Frozen Lake direction and stabilize the first responsive shell pass across the frontend.
- Rollback snapshots:
  - `.codex-refactor-backups/step-06/frontend/src/app/globals.css`
  - `.codex-refactor-backups/step-06/frontend/src/app/page.tsx`
  - `.codex-refactor-backups/step-06/frontend/src/app/admin.page.tsx.bak`
  - `.codex-refactor-backups/step-06/frontend/src/features/admin/components/admin-shell.tsx`
  - `.codex-refactor-backups/step-06/frontend/src/features/ui/components/coming-soon-modal.tsx`
  - `.codex-refactor-backups/step-06/dashboard-shells/frontend/src/app/doctor/page.tsx`
  - `.codex-refactor-backups/step-06/dashboard-shells/frontend/src/app/patient/page.tsx`
  - `.codex-refactor-backups/step-06/dashboard-shells/frontend/src/app/supervisor/page.tsx`
- Implemented:
  - Replaced the shared visual system in `src/app/globals.css` with a Frozen Lake palette, softer motion, and updated shell/sidebar/modal primitives.
  - Rebuilt the auth screen in `src/app/page.tsx` into a responsive two-column landing and access flow while preserving existing login/register behavior.
  - Reworked the admin shell and admin landing surfaces to match the new direction.
  - Converted doctor, patient, and supervisor dashboard shells away from the old amber/orange palette and moved them onto the same atmospheric background system.
  - Removed the old inline floating-emoji background animations from patient and supervisor and aligned the shell wrappers across all three dashboards.
  - Added `src/features/ui/components/dashboard-icon.tsx` and swapped the dashboard sidebars from emoji icons to shared SVG icons.
- Verification:
  - `node .\\node_modules\\typescript\\bin\\tsc --noEmit` passed in `frontend/`.

## Auth Layout Variants
- `Style One`: split auth layout with the showcase on the left and the access portal in a separate panel on the right.
- `Style Two`: single stacked auth shell with the wide showcase first and the access portal section beneath it inside the same overall container.
- `Style Three`: panel-free auth layout where the hero, slideshow, and access portal components sit directly on the shared page background.
- `Style Four`: cinematic auth portal where the slideshow becomes the full-page background and the hero plus access form float above it.
