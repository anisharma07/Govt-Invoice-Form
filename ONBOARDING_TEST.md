# User Onboarding Flow Test

This document explains how to test the new user onboarding functionality.

## How It Works

### First Time User (New User)

1. Visit the app for the first time
2. The landing page will be shown automatically
3. Click "Start Creating Invoices" or "Access Invoice Editor" button
4. User is redirected to `/app/editor`
5. The `isNewUser` flag is set to `false` in localStorage

### Returning User (Existing User)

1. Visit the app after completing onboarding
2. User is automatically redirected to `/app/editor`
3. Landing page is skipped

### Testing the Reset Functionality

1. Go to Settings page (`/app/settings`)
2. In the "Preferences" section, click "Reset Onboarding"
3. A success toast will appear: "Onboarding reset! Landing page will show on next visit."
4. Navigate to the home page (`/`) or refresh
5. Landing page will be shown again

## Technical Implementation

### Files Modified:

1. `src/utils/helper.ts` - Added localStorage utility functions
2. `src/App.tsx` - Added conditional rendering logic
3. `src/pages/LandingPage.tsx` - Updated button handler to mark user as existing
4. `src/pages/SettingsPage.tsx` - Added reset onboarding option

### LocalStorage Key:

- Key: `invoiceApp_isNewUser`
- Values:
  - `null` or `"true"` = New user (show landing page)
  - `"false"` = Existing user (skip to editor)

### API Functions:

- `isNewUser()` - Returns boolean indicating if user is new
- `markUserAsExisting()` - Sets user as existing (called on button click)
- `resetUserOnboarding()` - Resets user to new status (for testing/reset)

## User Flow:

```
First Visit -> Landing Page -> Click Button -> Set isNewUser=false -> Redirect to /app/editor
Next Visit -> Check isNewUser -> false -> Direct to /app/editor (skip landing)
Reset Option -> Click "Reset Onboarding" -> Set isNewUser=true -> Next visit shows landing
```
