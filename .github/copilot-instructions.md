# GitHub Copilot Instructions for Lovv

## Project Overview

This is a Chrome extension (Manifest V3) called "Leigos Academy" that provides unlimited prompts for Lovable.dev without consuming credits. The extension interacts with the Lovable platform by capturing authentication tokens and project IDs, then managing chat interactions.

## Tech Stack

- **Chrome Extension API**: Manifest V3
- **Language**: Vanilla JavaScript (ES6+)
- **External Libraries**: 
  - jszip.min.js (for ZIP file handling)
  - sweetalert2.min.js (for UI alerts)
- **APIs**: Supabase integration for backend functionality
- **Permissions**: storage, tabs, scripting, webRequest, sidePanel

## Project Structure

```
/
├── manifest.json           # Chrome extension manifest (V3)
├── background.js           # Service worker for background tasks
├── content.js              # Content script injected into lovable.dev pages
├── popup.js                # Main popup UI logic
├── popup.html              # Popup UI structure
├── popup_simple.js         # Simplified popup variant
├── permission.js           # Permission handling
├── security.js             # Security utilities
├── shield-inject.js        # Script for injection into web pages
├── supabase-config.js      # Supabase configuration
├── license.js              # License management (legacy)
├── license_modified.js     # Modified license logic
└── footer.js               # Footer component logic
```

## Code Conventions

### JavaScript Style
- Use ES6+ syntax (arrow functions, async/await, const/let)
- Use single quotes for strings
- Include descriptive console.log statements with prefixes like `[LeigosAcademy][component]`
- Use strict mode: `'use strict'`
- Prefer destructuring and modern array methods

### Naming Conventions
- **Functions**: camelCase (e.g., `handleSendMessage`, `extractProjectIdFromUrl`)
- **Constants**: UPPER_SNAKE_CASE for true constants
- **Variables**: camelCase
- **DOM Elements**: Suffix with element type when stored (e.g., `sendBtn`, `messageInput`)

### Error Handling
- Always wrap Chrome API calls in try-catch blocks
- Check if extension context is alive before making Chrome API calls
- Use `isExtensionAlive()` pattern to prevent "Extension context invalidated" errors
- Log errors to console but don't expose sensitive information

### Async Patterns
- Use async/await for asynchronous operations
- Prefer `catch()` or try-catch for error handling
- Use `Promise.all()` for parallel operations when appropriate

## Key Security Considerations

1. **Token Management**: Authentication tokens are stored in chrome.storage.local
2. **CORS Handling**: Be mindful of content security policy with Lovable.dev
3. **Extension Context**: Always verify extension context is alive before API calls
4. **No Secrets in Code**: Configuration should reference environment/storage, not hardcode
5. **Input Sanitization**: Validate user inputs before processing
6. **Permissions**: Request only necessary permissions in manifest.json

## Development Workflow

### Testing
- Load extension in Chrome via `chrome://extensions/` in developer mode
- Test on actual lovable.dev pages to verify token capture
- Verify popup functionality in side panel
- Check background service worker logs
- Test permission flows

### Validation Checklist
1. Check for console errors in all contexts (popup, content, background)
2. Verify chrome.storage operations complete successfully
3. Test with extension reload to ensure no "context invalidated" errors
4. Validate manifest.json structure with Chrome extension validator
5. Test all user-facing features in the popup

### Common Commands
```bash
# No build step required - direct load into Chrome
# Reload extension after changes via chrome://extensions/

# Check for basic syntax errors
node -c <filename.js>

# View extension logs
# Open Chrome DevTools for popup, content script, and background service worker
```

## Chrome Extension Best Practices

1. **Manifest V3 Compliance**: Use service workers instead of background pages
2. **Message Passing**: Use chrome.runtime.sendMessage for communication between contexts
3. **Storage**: Use chrome.storage.local/sync, not localStorage
4. **Content Scripts**: Inject at appropriate timing (document_start, document_end, document_idle)
5. **Permissions**: Follow principle of least privilege
6. **Web Accessible Resources**: Declare all resources that need to be accessible from web pages

## File Modification Guidelines

### When editing JavaScript files:
- Maintain existing code structure and patterns
- Keep console.log statements for debugging
- Preserve error handling patterns
- Don't remove try-catch blocks around Chrome API calls
- Test in actual Chrome extension environment after changes

### When editing manifest.json:
- Validate JSON syntax
- Ensure version increments if publishing
- Test all declared permissions are necessary
- Verify host_permissions match actual usage

### When editing HTML/CSS:
- Maintain mobile-friendly responsive design
- Keep existing class names for JavaScript references
- Test popup UI at various sizes (extension popup is typically 400px wide)

## Testing Strategy

Since this is a Chrome extension without a traditional test suite:

1. **Manual Testing Required**: Load extension and test functionality
2. **Console Validation**: Check for errors in all contexts
3. **Integration Testing**: Test on actual lovable.dev pages
4. **Permission Testing**: Verify permission prompts work correctly
5. **Storage Testing**: Validate data persistence across sessions

## Common Issues to Avoid

1. **Context Invalidation**: Always check if extension context is alive
2. **Async Timing**: Ensure async operations complete before accessing results
3. **DOM Manipulation**: Wait for DOMContentLoaded before accessing elements
4. **Storage Race Conditions**: Don't assume chrome.storage operations are instant
5. **Content Script Isolation**: Remember content scripts have limited access to page variables

## Resources

- [Chrome Extension Manifest V3 Docs](https://developer.chrome.com/docs/extensions/mv3/)
- [Chrome Extension API Reference](https://developer.chrome.com/docs/extensions/reference/)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/)
