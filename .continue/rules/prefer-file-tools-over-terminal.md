---
alwaysApply: true
---

Always prefer read_file, edit_existing_file, single_find_and_replace, and create_new_file for file operations. Only use run_terminal_command when absolutely necessary (e.g., checking file existence, running builds, executing tests). Never use terminal commands for file creation, deletion, or bulk text manipulation — these operations should use the integrated file tools instead.