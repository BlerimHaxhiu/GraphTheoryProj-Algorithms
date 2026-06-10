# Documentation Index

This index links the main documentation files for the Interactive Graph Algorithm Visualization and Learning Platform.

## Core Audit And Positioning

- [FINAL_REPOSITORY_AUDIT.md](FINAL_REPOSITORY_AUDIT.md): evidence-based final audit — features, algorithms, mentor/chatbot, A\*, playback, Floyd-Warshall/MST, tests, docs, deployment, risks, and cleanup actions.
- [CURRENT_STATE_AUDIT.md](CURRENT_STATE_AUDIT.md): documents what the app currently does, supported algorithms, main modules, flows, bugs, portfolio weaknesses, and improvement opportunities.
- [README_AUDIT.md](README_AUDIT.md): explains the old README weaknesses, what was improved, and why those changes make the project more portfolio-ready.
- [PROJECT_POSITIONING.md](PROJECT_POSITIONING.md): compares the project to a typical university graph visualizer and explains its relevance for software engineering, frontend, educational technology, and AI automation roles.
- [BRANDING_RECOMMENDATIONS.md](BRANDING_RECOMMENDATIONS.md): documents current branding inconsistencies and recommends a clearer project identity.
- [PORTFOLIO_VALUE.md](PORTFOLIO_VALUE.md): scores the project across portfolio categories and identifies strengths, weaknesses, and highest-ROI future improvements.

## Architecture And Implementation Documentation

- [ARCHITECTURE_OVERVIEW.md](ARCHITECTURE_OVERVIEW.md): explains high-level architecture, application structure, data flow, execution flow, strengths, and limitations.
- [ALGORITHM_ENGINE.md](ALGORITHM_ENGINE.md): documents each supported algorithm, engine inputs/outputs, constraints, visualization strategy, complexity, and known limitations.
- [ASTAR_IMPLEMENTATION_REVIEW.md](ASTAR_IMPLEMENTATION_REVIEW.md): audits the previous zero-heuristic A* implementation and why it behaved like Dijkstra.
- [ASTAR_EDUCATIONAL_GUIDE.md](ASTAR_EDUCATIONAL_GUIDE.md): explains Dijkstra, A*, heuristics, and `g(n)`, `h(n)`, `f(n)` for students.
- [PLAYBACK_CONTROLS_IMPLEMENTATION.md](PLAYBACK_CONTROLS_IMPLEMENTATION.md): documents manual algorithm playback controls, state model, edge cases, tests, and manual verification.
- [FLOYD_WARSHALL_MST_VISUALIZATION.md](FLOYD_WARSHALL_MST_VISUALIZATION.md): documents the working Floyd-Warshall distance matrix and final MST visualization improvements for Kruskal and Prim.
- [CHATBOT_ARCHITECTURE.md](CHATBOT_ARCHITECTURE.md): explains chatbot purpose, parser, intent detection, supported commands, bilingual support, action execution, the Algorithm Mentor layer, safety boundaries, and future AI opportunities.
- [ALGORITHM_MENTOR_DISCOVERY.md](ALGORITHM_MENTOR_DISCOVERY.md): Phase 1 audit of the existing chatbot (intents, limitations, parser routing, integration seam) before building the Algorithm Mentor.
- [ALGORITHM_MENTOR_ARCHITECTURE.md](ALGORITHM_MENTOR_ARCHITECTURE.md): the deterministic Algorithm Mentor — module map, intent system, recommendation/why/comparison/graph/step engines, educational philosophy, localization, tests, and future AI opportunities.
- [TESTING_STRATEGY.md](TESTING_STRATEGY.md): documents current tests, what they protect, how to run them, expected output, coverage gaps, and future Playwright priorities.

## Audience-Focused Documentation

- [EDUCATIONAL_VALUE.md](EDUCATIONAL_VALUE.md): explains the project value for educators and academic reviewers.
- [RECRUITER_STORY.md](RECRUITER_STORY.md): provides a short plain-English story about the project problem, value, engineering challenges, and developer signal.
- [PORTFOLIO_DEMO_GUIDE.md](PORTFOLIO_DEMO_GUIDE.md): 3-minute recruiter and 5-minute technical demo paths, what each screenshot proves, interview talking points, and AI-automation positioning.

## Portfolio Readiness, Screenshots & Operations

- [SCREENSHOT_CAPTURE_GUIDE.md](SCREENSHOT_CAPTURE_GUIDE.md): how the Playwright capture system works and how to run `npm run demo:screenshots`.
- [SCREENSHOT_CAPTURE_REPORT.md](SCREENSHOT_CAPTURE_REPORT.md): the result of the latest capture run (12/12 verified) with per-screenshot content notes.
- [CLEANUP_REPORT.md](CLEANUP_REPORT.md): what was removed/kept during repository cleanup, reasons, and rollback notes.
- [FINAL_READY_CHECKLIST.md](FINAL_READY_CHECKLIST.md): test results, build status, screenshots status, known limitations, and GitHub/Netlify readiness verdicts.
- [NETLIFY_DEPLOYMENT_REPORT.md](NETLIFY_DEPLOYMENT_REPORT.md): build command, publish directory, deploy method/result, live URL, and manual fallback steps.
- [FINAL_PORTFOLIO_REPORT.md](FINAL_PORTFOLIO_REPORT.md): final status, CV bullet points, interview explanation, and suggested next project.

## Existing Planning Document

- [blueprint.md](blueprint.md): original app blueprint and early feature/style notes.
