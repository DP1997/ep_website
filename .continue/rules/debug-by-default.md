---
description: Use when a bug fix is not working after multiple attempts
alwaysApply: false
---

When a bug persists after 2+ attempted fixes, always add console.log() debug output inside the relevant code before asking the user to test again. Even better: request browser console output proactively. Never remove debug logs until the issue is confirmed fixed.