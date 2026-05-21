---
alwaysApply: true
---

When a source file exceeds ~4000 tokens or ~300 lines, split it into logical modules with clear single responsibilities. Use a shared namespace (e.g., window.NamespaceName) or ES modules for cross-module communication. Each module should be independently readable and under the token limit for read_file/edit tools. Avoid monolithic files that cannot be comfortably edited with read_file and edit_existing_file.