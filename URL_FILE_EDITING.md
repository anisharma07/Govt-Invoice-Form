# URL-Based File Editing System

## Summary
Implemented a dedicated URL structure for editing specific files with proper file existence validation and user-friendly error handling.

## New URL Structure

### Routes
- `/app/files` - File explorer (main landing page)
- `/app/editor` - Editor without specific file (redirects to files)
- `/app/editor/:fileName` - Editor with specific file
- `/app/settings` - Settings page

### Examples
- `/app/editor/invoice-2024-01` - Edit file named "invoice-2024-01"
- `/app/editor/My%20Invoice` - Edit file named "My Invoice" (URL encoded)

## Implementation Details

### 1. App.tsx - Updated Routing
```tsx
<Route exact path="/app/editor/:fileName">
  <Home />
</Route>
<Route exact path="/app/editor">
  <Home />
</Route>
```

### 2. Home.tsx - File Parameter Handling
- **URL Parameter Extraction**: Uses `useParams<{ fileName?: string }>()` to get filename from URL
- **File Existence Check**: Validates if the requested file exists in local storage
- **Context Synchronization**: Updates the invoice context if URL parameter differs from selected file
- **Error State**: Shows "File Not Found" UI when file doesn't exist

### 3. FilesPage.tsx - Updated Navigation
- **File Creation**: Redirects to `/app/editor/${fileName}` after creating new files
- **URL Encoding**: Uses `encodeURIComponent()` for filenames with special characters

### 4. Files.tsx - Updated File Opening
- **File Opening**: Navigates to `/app/editor/${fileName}` when opening existing files
- **URL Encoding**: Handles filenames with spaces and special characters

## User Experience

### File Not Found State
When accessing a non-existent file via URL:
- Shows a clean error message
- Displays file icon and "File Not Found" heading
- Provides clear explanation
- Shows "Go to File Explorer" button to redirect to `/app/files`

### Navigation Flow
1. **Files Page**: User selects or creates a file
2. **URL Navigation**: App navigates to `/app/editor/{fileName}`
3. **File Loading**: Home component loads the specific file
4. **Error Handling**: If file doesn't exist, shows error with option to return to files

## Benefits

### 1. Direct File Access
- Users can bookmark specific files
- Share direct links to files
- Browser back/forward works correctly

### 2. Better Error Handling
- Clear feedback when files don't exist
- Graceful fallback to file explorer
- No confusing redirects

### 3. URL Consistency
- Predictable URL patterns
- RESTful-style resource access
- Better browser integration

### 4. File Management
- URL reflects current file being edited
- Easy to see which file is active
- Better browser history

## Technical Features

### URL Encoding
- Handles filenames with spaces: `My File` → `My%20File`
- Supports special characters safely
- Decodes properly in component

### State Management
- Synchronizes URL parameters with React context
- Updates selected file when URL changes
- Maintains consistency between URL and app state

### Error Boundaries
- Validates file existence before loading
- Provides fallback UI for missing files
- Prevents crashes from invalid file access

## Usage Examples

### Direct File Access
```
/app/editor/Invoice-Jan-2024     → Opens "Invoice-Jan-2024"
/app/editor/My%20Monthly%20Bill  → Opens "My Monthly Bill"
```

### File Creation Flow
1. User clicks template in FilesPage
2. Enters filename: "Q1 Report"
3. App creates file and navigates to `/app/editor/Q1%20Report`
4. Editor opens with new file loaded

### Error Handling
1. User visits `/app/editor/NonExistentFile`
2. Home component checks if "NonExistentFile" exists
3. File not found → Shows error UI
4. User clicks "Go to File Explorer" → Redirects to `/app/files`
