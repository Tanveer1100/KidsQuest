# Kids Learning App — Requirements and Design

## Working agreement

- Proceed only step by step.
- The user makes all design decisions.
- Maintain this document as requirements and design evolve.
- Record suggestions separately from approved decisions.
- Do not start development or implement design decisions without the user's direction.

## Confirmed requirements

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

The assistant previously suggested the following. These are not requirements or approved decisions:

- Math, reading, science, and logic as the initial subjects.
- Guided AI-generated activities instead of an open-ended child chatbot.
- Age-adjusted activities and a specific reward approach.

## Open questions

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

- No mobile app screens or features have been built.
- AI access was enabled before development was paused.
- Enabling AI access does not constitute approval of an AI provider or product design.

## Decision record

| Decision | Status |
| --- | --- |
| Support ages 3–12. | Confirmed by user. |
| Work step by step, maintain this document, and leave all design decisions to the user. | Confirmed by user. |
| Create plans through an interactive parent chat, agree on the plan and duration, then execute it and track progress. | Confirmed by user's reference use case. |
| Offer a short child assessment only with parent agreement; if declined, let the parent drive the starting-level decision. | Confirmed by user. |
| Suggest plan goals, duration and schedule, learning steps, activity approach, and success criteria; let the parent choose and adjust before agreeing. | Confirmed by user. |
