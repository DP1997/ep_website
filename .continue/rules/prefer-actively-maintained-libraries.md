---
alwaysApply: true
---

When adding external libraries for animations or interactive features:

Prefer actively maintained sources

Recent commits within the last 1-2 years
Active issue tracking and PR responses
Clear roadmap or changelog
Modern build tooling and CI/CD
Warn before considering outdated libraries

Explain risks: security vulnerabilities, compatibility issues, lack of bug fixes
Suggest alternatives with better maintenance status
Get explicit user acknowledgment before proceeding with stale dependencies
Avoid super old or abandoned libraries

Libraries with no meaningful updates in 5+ years are rejected outright
Turn.js (last update ~2012) is explicitly blocked — use StPageFlip or modern alternatives instead
Version pinning and monitoring

Pin versions to avoid surprise breakage (page-flip@2.0.7, not latest)
Monitor maintenance status of current dependencies
Evaluate local bundling vs CDN imports for reproducibility
Current project status

Flipbook: page-flip@2.0.7 via CDN (published 2023)
Acceptable for now, but flagged for future review if bugs surface
