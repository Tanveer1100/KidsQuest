# Kids Learning App — Requirements and Design

## Working agreement

- Proceed only step by step.
- The user makes all design decisions.
- Maintain this document as requirements and design evolve.
- Record suggestions separately from approved decisions.
- Do not start development or implement design decisions without the user's direction.

## Confirmed requirements

### Current MVP scope

Build a simple working mobile prototype with frontend and backend for:

- Parent sign-up.
- Parent login.
- Creating a child's profile.

AI will be added later. AI planning, assessments, child learning activities, gamification, and progress tracking are outside this MVP. The broader requirements below are retained as future product direction, not permission to implement them now.

The user has specified the authentication options, child-profile fields, and age buckets below and selected a **simple and calm** visual style. The existing agreement to proceed step by step and leave all design decisions to the user remains in force.

#### Parent authentication

Parents can choose either:

- **Email and password:** verify the email address by sending a verification code that the parent enters during sign-up.
- **Google:** use Google as the identity provider for sign-up and login.

The email verification code is for verifying email ownership; the approved email login method remains email and password, not code-only login.

#### Child-profile fields

| Field | Confirmed requirement |
| --- | --- |
| Nickname | Child's nickname. |
| Age bucket | Choose from 3–5, 6–8, and 9–12, rather than entering an exact age. The final bucket intentionally includes age 12. |
| Default language | Default language for the child profile. |
| Country of residence | Country of residence for the child profile. |

No particular language or country is assumed as a default.

#### After creating a child profile

- After a profile is saved, provide a clear navigation button to open that child's home page.
- The child home page is a welcome screen using the child's nickname and age range. It clearly indicates that learning activities are not part of the current MVP.
- The saved profile view includes a button to the child's home, and the home view has a path back to the profile.
- The child home page should show a subject tile with an icon for Math, English reading, Science, and a second language.
- Each subject tile should show the number of active learning plans for that subject. This depends on learning plans being created and tracked; do not show invented counts.
- Subject progress language should feel gentle, playful, and encouraging, not like a judgment of the child or parent. Do not invent a measured grade or progress result.
- Use gentle learning stages rather than school-style grades or percentages. While a subject has not been assessed or started, show “Ready to explore.” Once work on a subject has begun, use “Working on it” instead of “Practicing together.”

#### Parent overview ideas — not yet approved

- Consider showing the next planned learning session and a recent positive learning win, if these can be backed by real plan or activity data.
- The page's intended audience needs clarification: the current child home is child-facing, while the user wants parents to see a complete picture at a glance.

### Future product direction

| Area | Requirement |
| --- | --- |
| Platform | Mobile app. |
| Audience | Children ages 3–12 and their parents. |
| AI | A chat-based interface discusses the learning need with the parent and interactively suggests a learning plan. Other AI responsibilities are not yet decided. |
| Parent customization | The app suggests a learning plan; parents choose and adjust it as needed before agreeing to start. Planning happens through chat. |
| Starting-level assessment | Ask the parent whether they want a short child assessment. If they agree, conduct it to check the child's level; otherwise, let the parent drive the starting-level decision. |
| Child experience | Interactive, gamified learning based on the learning plan. |
| Progress | Parents can access and track learning progress. |

## Approved design decisions

- Parent-facing learning-plan creation is chat-based.
- The conversation includes suggestions and agreement with the parent on both the plan and its duration.
- After agreement, the child learns through the plan and progress is tracked along the way.
- A short starting-level assessment is optional and requires the parent's agreement. Declining it does not block planning; the parent drives the starting-level decision instead.
- The app suggests the plan elements below. Parents can accept the suggestions or adjust them before agreeing to the plan.

## Proposed plan and parent review

Each suggested learning plan includes:

| Element | What the app suggests for parent review |
| --- | --- |
| Learning goal | What the child should be able to do by the end. |
| Duration and schedule | Total duration, sessions per week, and minutes per session. |
| Learning steps | Skills to cover and their order. |
| Activity approach | How the child will learn and practice. |
| Success criteria | How progress and completion will be measured. |

The parent chooses whether to accept the suggested plan or adjust these elements. The app must not treat a suggestion as the parent's agreement. The child begins the plan after the parent agrees.

The exact presentation and adjustment controls have not been decided.

## Reference use case

The parent of a six-year-old says their child is weak in double-digit math addition and wants to create a learning plan.

1. The parent describes the learning need in chat.
2. The AI asks whether the parent wants the child to take a short assessment to check their level.
3. If the parent agrees, the child takes the assessment to establish their starting level. If the parent declines, the parent drives that decision and planning continues without an assessment.
4. The AI discusses the need with the parent and offers suggestions interactively.
5. The app suggests a plan covering the goal, duration and schedule, learning steps, activity approach, and success criteria. The parent chooses and adjusts it as needed, then agrees to the plan.
6. The app executes the agreed plan through the child's interactive, gamified learning experience.
7. Progress is tracked as the child works through the plan and is accessible to the parent.

This example illustrates the workflow; it does not restrict the app to six-year-olds or addition. No specific duration, daily schedule, activity format, assessment method, or success criteria have been decided.

## Unapproved suggestions

### AI learning-plan creation SOP — draft for review

The user requires an SOP for how AI builds a learning plan. The procedure below is an assistant proposal, not an approved design. This work is deferred beyond the current non-AI MVP.

1. **Gather the learning brief.** Ask conversationally about age, the specific difficulty, examples of what the child can and cannot do, the parent's desired outcome, available time, and relevant learning preferences or constraints. Do not repeatedly ask for information already provided.
2. **Establish the starting level.** Offer the optional short assessment. With parent agreement, use its results; if declined, let the parent drive the starting-level decision. Distinguish parent reports, assessment observations, and unverified assumptions. Do not invent assessment results.
3. **Map the required skills.** Break the target into prerequisites and a teachable sequence. Proposed grounding: a reviewed skill map and teaching guidelines, with AI personalizing rather than inventing the educational sequence. The source, curriculum alignment, and review process remain undecided.
4. **Set measurable goals.** Propose observable outcomes and completion checks for each skill, including whether the child succeeds independently or with hints. Exact thresholds require definition and parent agreement.
5. **Build a feasible schedule.** Fit the sequence to the parent's available time. Suggest total duration, session frequency and length, practice, review, and checkpoints. Treat duration as an estimate, not a guarantee. Explain conflicts between scope and available time rather than promising an unrealistic result.
6. **Produce the draft plan.** Include the approved plan elements: goal, duration and schedule, learning steps, activity approach, and success criteria. Explain why the plan fits the information supplied and flag assumptions. Detailed lesson mechanics remain undecided.
7. **Check the draft.** Check prerequisite order, age suitability, schedule feasibility, measurable goals, consistency, and alignment with the parent's request. Flag unsupported skills or missing educational guidance instead of inventing certainty. This is a proposed validation procedure, not a claim that AI self-review guarantees educational quality.
8. **Review and agree with the parent.** Present the suggestion, invite choices and adjustments, explain effects of changes, and repeat as needed. Save the explicitly agreed plan as the active version before execution. No unilateral replacement of an approved plan is proposed.

**Illustrative skill sequence, not a fixed curriculum:** for double-digit addition, check tens and ones and relevant single-digit addition, then consider addition without regrouping, regrouping if included in the agreed goal, and mixed practice. The sequence depends on the child's starting level and the parent's chosen scope.

**Still to decide:** educational reference sources, required intake fields, assessment method, mastery thresholds, validation rules, and policies for changes after learning begins.

### Earlier product suggestions

The assistant previously suggested the following. These are not requirements or approved decisions:

- Math, reading, science, and logic as the initial subjects.
- Guided AI-generated activities instead of an open-ended child chatbot.
- Age-adjusted activities and a specific reward approach.

## Open questions

### MVP decisions

- No additional MVP design decisions are currently blocking the agreed build. Changes beyond this scope require the user's direction.

### Future learning features

- Which subjects and learning goals should be supported?
- How should learning differ across ages 3–12?
- What information should the chat gather before suggesting a plan?
- What format and length should the optional short assessment have?
- How should the suggested plan be presented, adjusted, and explicitly agreed to within the chat-based flow?
- How should existing plans be updated, and who approves changes?
- What kinds of interactive activities and gamification should be used?
- What progress information should parents see?
- What privacy, parental-access, and child-safety requirements should apply?
- What name, visual direction, and navigation should the app use?

## Current implementation status

- Built the agreed mobile MVP with public welcome, parent sign-up, email-code verification, login, Google authentication integration, logout, child-profile creation, and a saved-profile list/detail view.
- Profiles are stored in the backend database, linked to the signed-in parent. Profile fields match the approved requirements and no age bucket, language, or country is preselected.
- Each child's home page now shows icon tiles for Math, English reading, Science, and Second language. Since no learning checks exist yet, all four use the gentle status “Ready to explore” rather than an invented score.
- The implementation uses the approved simple and calm direction. "Kids Learning" is a descriptive working title, not a separately approved permanent brand.
- AI access was previously enabled, but the MVP contains no AI features or AI calls.
- Verification: workspace type checks, Expo dependency checks, and iOS/Android JavaScript exports passed. The backend health endpoint responds and signed-out profile reads/creates are rejected.
- The user confirmed Google sign-in works in Expo Go. Full email/password sign-up and code delivery, signed-in profile creation, and other device behavior have not been verified end to end. JavaScript exports are not proof of device behavior or App Store readiness.
- Google sign-in investigation: the user reported “403 - you don't have access” in browser preview. A signed-out browser check reached Google's sign-in page successfully when opened as a standalone page; it stopped before entering Google credentials. The reported 403 and its source have not yet been reproduced. Embedded-preview behavior and the post-authorization callback remain unverified. No speculative authentication changes were made.
- Native and browser results are tracked separately: the Expo Go confirmation does not resolve the browser-preview 403.
- A read-only development database check confirmed a saved child profile with the approved fields and a nonempty parent-account link. This confirms database persistence, not full two-account access-isolation testing. Personal profile values are not copied into this document.

## Decision record

| Decision | Status |
| --- | --- |
| Support ages 3–12. | Confirmed by user. |
| Work step by step, maintain this document, and leave all design decisions to the user. | Confirmed by user. |
| Create plans through an interactive parent chat, agree on the plan and duration, then execute it and track progress. | Confirmed by user's reference use case. |
| Offer a short child assessment only with parent agreement; if declined, let the parent drive the starting-level decision. | Confirmed by user. |
| Suggest plan goals, duration and schedule, learning steps, activity approach, and success criteria; let the parent choose and adjust before agreeing. | Confirmed by user. |
| Define an SOP for how AI builds a learning plan before proceeding to the child's lesson design. | Requested by user; SOP contents await approval. |
| First build a simple mobile frontend and backend for parent sign-up, login, and child-profile creation; add AI later. | Confirmed by user; supersedes the immediate focus on the AI planning SOP. |
| Child profiles contain nickname, age bucket, default language, and country of residence. Age buckets are 3–5, 6–8, and 9–12. | Confirmed by user. |
| After creating a child profile, provide a navigation button to that child's home page. | Confirmed by user and implemented. |
| Build the destination as a child welcome page, using the child's nickname and age range and no learning activities yet. | Confirmed by user selection and implemented. |
| Show Math, English reading, Science, and Second Language on the child home page with icons. | Confirmed by user and implemented. |
| Show the active learning-plan count on each subject tile. | Confirmed by user; requires learning-plan data and is not yet implemented. |
| Use gentle learning stages: “Ready to explore” before starting and “Working on it” once a subject is underway. | Confirmed by user; the current app shows “Ready to explore” until learning activity is added. |
| Offer email/password with email verification by a sent code, or Google as the identity provider. | Confirmed by user. |
| Use a simple and calm visual style for the MVP. | Confirmed by user. |
