---
Task ID: 1
Agent: main
Task: Fix "Ajouter un compte" black screen + slow login

Work Log:
- Read settings-screen.tsx, auth-context.tsx, auth-service.ts, app-shell.tsx, login-screen.tsx
- Identified root cause: handleAddAccount() called logout() + hard reload + 3000ms delay
- Fixed handleAddAccount(): simple in-app navigation to login screen without destroying session
- Fixed handleSwitchAccount(): same approach — no more hard reload
- Removed duplicate fetchAllData() from auth-context.tsx (login + register)
- Made online status update non-blocking (fire-and-forget) in auth-service.ts
- Removed unused add_account URL param handler with 3000ms setTimeout
- Pushed commit e1f1790 to GitHub

Stage Summary:
- "Ajouter un compte" now shows login screen instantly (no black screen)
- "Connecter" (switch account) also works without hard reload
- Login is faster: removed ~12+ redundant network calls (double fetchAllData + blocking online update)
- 4 files modified, pushed to origin/main
