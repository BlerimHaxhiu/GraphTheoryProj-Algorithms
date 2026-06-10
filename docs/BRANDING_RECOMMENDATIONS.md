# Branding Recommendations

Date: 2026-06-09

Scope: documentation-only branding audit. No code or metadata changes were applied.

## Current Branding Issues

- `package.json` uses the generic package name `nextn`, which does not communicate the project.
- Browser metadata currently uses `Graph Algorithm Visualizer`, which is accurate but broad.
- English UI branding uses `Graph Algorithm Visualizer`.
- Albanian UI branding uses `Vizualizuesi i Algoritmeve te Grafeve`.
- The repository folder is `grafishqipp`, which suggests an Albanian identity but is not reflected consistently in the English README title.
- The old README positioned the app as a generic visualization tool and included university-style acknowledgments.
- The project has several possible identities:
  - bilingual educational tool,
  - graph algorithm visualizer,
  - automation-assisted learning platform,
  - portfolio software engineering project.
- These identities are compatible, but the repo should choose one primary brand and use the others as supporting messages.

## Recommended Positioning

Primary positioning:

> Interactive Graph Algorithm Visualization and Learning Platform

This is the clearest portfolio-facing category. It works for AI Automation Engineer, Software Engineering, Full Stack, Frontend, and Educational Technology audiences.

Supporting messages:

- Interactive graph algorithm learning
- Bilingual English/Albanian educational UX
- SVG graph editor and algorithm execution tracing
- Automation-assisted learning through chatbot commands
- Exportable graph analysis and reports

## Naming Options

### Option 1: GrafiShqip

Best for a distinctive bilingual product identity.

Strengths:

- Memorable and personal.
- Signals Albanian localization.
- Less generic than "Graph Algorithm Visualizer."
- Good for a portfolio story about accessibility and bilingual learning.

Tradeoffs:

- English-speaking recruiters may not immediately understand the product category.
- Needs a subtitle in README and metadata.

Recommended usage:

> GrafiShqip: Interactive Graph Algorithm Visualization and Learning Platform

### Option 2: GraphTheory Visualizer

Best for a straightforward technical identity.

Strengths:

- Clear subject matter.
- Easy to understand quickly.
- Good match for algorithms/software engineering roles.

Tradeoffs:

- Less distinctive.
- Sounds closer to a class assignment than a product.

Recommended usage:

> GraphTheory Visualizer: Interactive Graph Algorithm Learning Platform

### Option 3: Interactive Graph Learning Platform

Best for educational technology positioning.

Strengths:

- Strong recruiter-facing clarity.
- Communicates learning, not only simulation.
- Flexible enough to include algorithms, chatbot, localization, and reports.

Tradeoffs:

- More descriptive than brand-like.
- Less personal than GrafiShqip.

Recommended usage:

> Interactive Graph Learning Platform

## Recommended Final Brand

Use:

> GrafiShqip

With the consistent subtitle:

> Interactive Graph Algorithm Visualization and Learning Platform

Why:

- It keeps the local/bilingual identity.
- It still explains the technical category clearly.
- It is more memorable than a purely generic English name.
- It supports a strong recruiter story: technical depth plus accessible education.

## Recommended Future Changes

Do not apply these in this phase; these are recommendations for a later branding/code metadata pass.

- Change `package.json` name from `nextn` to a project-specific name such as `grafishqip` or `interactive-graph-learning-platform`.
- Align `src/app/layout.tsx` metadata title with the selected brand.
- Align `src/app/app/layout.tsx` metadata title with the selected brand.
- Consider updating English UI `header.title` and `landing.appName` to include `GrafiShqip` or a consistent English subtitle.
- Keep Albanian UI naming natural, but ensure it maps to the same product identity.
- Add a short brand statement to the README hero section once screenshots and deployment are ready.
- Add a repository description on GitHub matching the new positioning.

## Suggested GitHub Repository Description

Interactive graph algorithm visualization and learning platform with SVG graph editing, execution tracing, bilingual English/Albanian guidance, and chatbot-assisted algorithm education.

## Suggested Topics

- graph-algorithms
- algorithm-visualization
- educational-technology
- nextjs
- react
- typescript
- svg
- bilingual
- chatbot
- portfolio-project
