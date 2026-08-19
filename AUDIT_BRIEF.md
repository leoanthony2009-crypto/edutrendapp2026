# EduTrend / Bloom — Production Readiness Audit Brief (run FIRST, before any refactor)

Audit the entire EduTrend application for production readiness. Do not modify the code yet. First perform a comprehensive evidence-based review of the repository.

Evaluate the application against:

1. **Usability and UX**: ISO 9241-11/9241-210 principles and established usability heuristics. Review navigation, information architecture, discoverability, consistency, feedback, error prevention/recovery, cognitive load, empty states, loading states, confirmation states, onboarding and primary user journeys.
2. **Accessibility**: WCAG 2.2 AA. Check semantic HTML, keyboard navigation, focus management, accessible names, headings, landmarks, forms, validation messages, contrast, touch targets, screen-reader compatibility, reduced-motion behavior and ARIA usage.
3. **EduTech-specific UX**: Review student, teacher/admin and other applicable roles separately. Evaluate course discovery, lesson/course workflows, dashboards, progress tracking, assessments, feedback, notifications, achievements and learning-state persistence. Flag unnecessary friction and ambiguous educational interactions.
4. **UI/design system**: Audit typography, spacing, layout grid, component consistency, color usage, hierarchy, icons, button variants, forms, cards, modals, tables, navigation and reusable components. Identify duplicated or one-off styling that should belong to the design system.
5. **Responsive design**: Examine phone, tablet, laptop and desktop behavior. Identify overflow, clipping, fixed-width assumptions, poor breakpoint behavior, inaccessible menus, oversized/undersized controls and layouts that fail with long content.
6. **Functional integrity**: Trace every interactive element to its implementation. Identify buttons without actions, dead links, placeholder content, incomplete routes, broken forms, missing validation, unhandled API failures, race conditions, incorrect state handling and unfinished TODO/FIXME implementations.
7. **Engineering and production readiness**: Review component architecture, state management, API boundaries, authentication/authorization, role permissions, error handling, logging, environment configuration, performance, bundle/loading behavior, test coverage, dependency risks, security-sensitive code and maintainability.

Do not report theoretical problems unless they apply to this repository. For every finding provide file path, component/page, relevant line(s) where possible, evidence, user impact and recommended correction.

Classify every issue: **P0 Critical** (blocks launch) · **P1 High** (fix before launch) · **P2 Medium** · **P3 Low**.

Then produce: executive readiness assessment; overall readiness score /100; scores /10 for UX, accessibility, visual consistency, functionality, responsiveness, performance, security and maintainability; P0/P1 launch blockers; page-by-page findings; accessibility findings; broken/incomplete functionality; design-system inconsistencies; mobile/responsive findings; security/engineering risks; missing automated tests; prioritized remediation backlog; final verdict: NOT READY / ALPHA READY / BETA READY / PRODUCTION READY.

Do not start refactoring until the audit report is complete.

**Run the project**: execute the app, its existing tests, linting and type checking rather than reviewing source code alone. Test critical journeys end-to-end: registration/login → dashboard → finding or creating learning content → completing the primary activity → progress/assessment → logout/login persistence. Each supported user role (student, teacher, leader/Champion) should have its own journey.

**Acceptance gate**: zero P0 issues, zero unresolved serious authorization/security failures, no broken primary workflows, WCAG 2.2 AA issues addressed on critical journeys, usable keyboard navigation, responsive layouts at 390/768/1280/1440, graceful error/loading/empty states, automated coverage of critical functionality, and no console/runtime errors during primary workflows.

---

**After the audit is complete and accepted**: implement the Bloom redesign per `README.md` in this folder, preserving working backend functionality, honouring the audit's remediation backlog, and following `PASTORAL_PULSE_SPEC.md` in the repo for data architecture (Synodal Marks, One Child, Champion alerts, POUI micro-moves, BSC rollups, Weekly Bridge).
