---
alwaysApply: true
---

When working with third-party library events/callbacks: NEVER assume parameter signatures. ALWAYS inspect the library source (even minified) to confirm exactly what arguments the event passes. Run grep/Select-String for `trigger(` or `emit(` calls for that event name to see the argument array. Match your callback signature to the exact arguments the library provides. If the library doesn't pass what you need, derive it from available state (e.g., compare old/new values stored in closure variables).