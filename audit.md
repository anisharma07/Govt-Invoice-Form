# Code Audit Report

This document contains a comprehensive audit of the codebase after removing all Starknet and server features. The app is now fully local-only.

## Dead Code Analysis

### 1. Empty Files

- `src/services/camera-service.ts` - **COMPLETELY EMPTY** - Can be deleted

### 2. Commented-Out Dead Code

The following commented-out imports are remnants from the blockchain/server removal:

#### SettingsPage.tsx (Line 81)

```typescript
// import { useAccount, useConnect, useDisconnect } from "@starknet-react/core";
```

#### Home.tsx (Line 51)

```typescript
// import WalletConnection from "../components/wallet/WalletConnection";
```

### 3. Duplicate Helper Functions

Helper functions are duplicated between `utils/helper.ts` and `components/Menu/Menu.tsx`:

#### Duplicated in Menu.tsx (Lines 765-780):

- `generateInvoiceFilename()` - Should use the one from `utils/helper.ts`
- `selectInputText()` - Should use the one from `utils/helper.ts`

**Recommendation**: Import from `utils/helper.ts` instead of redefining

### 4. Unused Dependencies Analysis

#### From package.json, potential unused dependencies:

- `@capacitor/camera` - May be unused since `camera-service.ts` is empty
- `@capacitor/filesystem` - Used in LocalStorage.ts, so it's needed
- `@capacitor/share` - Used in export functionality, so it's needed
- `xlsx` - Used in export services, so it's needed

## Used Code Analysis

### Export Services (All Active)

✅ **In Use**:

- `exportAsCsv.ts` - Used in Menu.tsx for CSV export
- `exportAsPdf.ts` - Used in Menu.tsx for PDF export
- `exportAllAsPdf.ts` - Used in Menu.tsx for multi-file PDF export
- `exportAllSheetsAsPdf.ts` - Used in Menu.tsx and MenuDialogs.tsx

### Storage Services (All Active)

✅ **In Use**:

- `components/Storage/LocalStorage.ts` - Used throughout the app for local file management
- `utils/offlineStorage.ts` - Used by PWADemo.tsx for offline storage demo

### Data Files (All Active)

✅ **In Use**:

- `app-data.ts` - Used by Files.tsx, FilesPage.tsx, Home.tsx, FileOptions.tsx, Menu.tsx
- `app-data-new.ts` - Purpose unclear, not found in search results - **POTENTIAL DEAD CODE**

### Helper Utilities (Mostly Used)

✅ **In Use**:

- `generateInvoiceFilename()` - Used in Menu.tsx, MenuDialogs.tsx, Home.tsx
- `selectInputText()` - Used in Menu.tsx, MenuDialogs.tsx
- `isDefaultFileEmpty()` - Used in Home.tsx

### PWA Components (All Active)

✅ **In Use**:

- `PWADemo.tsx` - Used in SettingsPage.tsx
- `PWAUpdatePrompt.tsx` - Used in App.tsx
- `OfflineIndicator.tsx` - Used in App.tsx
- `usePWA.ts` - Used in App.tsx and PWADemo.tsx

## Recommendations

### Immediate Actions:

1. **Delete** `src/services/camera-service.ts` (empty file)
2. **Remove** commented blockchain imports from SettingsPage.tsx and Home.tsx
3. **Investigate** `app-data-new.ts` - appears unused
4. **Refactor** Menu.tsx to import helper functions from `utils/helper.ts` instead of duplicating

### Code Quality Improvements:

1. Remove duplicate helper function definitions in Menu.tsx
2. Clean up commented-out wallet/blockchain references
3. Consider removing `@capacitor/camera` dependency if camera functionality is not needed

### Files That Could Be Simplified:

- SettingsPage.tsx has many commented-out blockchain sections that could be cleaned up
- PWADemo.tsx has commented-out push notification code that could be removed

## Summary

- **1 empty file** to delete ✅ **REMOVED** - `camera-service.ts` deleted
- **2 files** with commented blockchain imports to clean up
- **2 helper functions** duplicated unnecessarily
- **1 data file** potentially unused (app-data-new.ts)
- **1 dependency** potentially unused (@capacitor/camera)
- **1 server feature** ✅ **REMOVED** - "Export as PDF via Server" button and related functionality removed

## Recent Changes (August 8, 2025)

✅ **COMPLETED**: Removed "Export as PDF via Server" button and all related server functionality:

- Removed server PDF button from Menu.tsx
- Removed `doGenerateServerPDF` function
- Removed all server PDF state variables and loading states
- Cleaned up MenuDialogs.tsx to remove server PDF dialog and props
- Removed unused imports (`server` icon, `cloudUpload` for server)

Overall, the codebase is in excellent shape after the blockchain/server removal. Most services and utilities are actively used. The main cleanup needed is removing the empty camera service file and duplicate helper functions.
