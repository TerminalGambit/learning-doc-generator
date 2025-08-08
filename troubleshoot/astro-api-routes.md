# Troubleshooting: Astro API Routes Configuration

## Problem
When setting up API routes in Astro, encountered the following issues:

1. **API Route Warning**: "POST requests are not available in static endpoints"
2. **Config Error**: "output: Did not match union. Expected 'static' | 'server', received 'hybrid'"

## Solution

### Issue 1: API Routes Not Working
**Problem**: API routes return warnings about not being available in static endpoints.

**Solution**: 
1. Set `output: 'server'` in `astro.config.mjs`
2. Add `export const prerender = false;` to API route files

```js
// astro.config.mjs
export default defineConfig({
  output: 'server', // Enable server-side rendering
  vite: {
    plugins: [tailwindcss()]
  }
});
```

```js
// src/pages/api/generate-document.ts
export const prerender = false; // Disable prerendering for this endpoint
export const POST: APIRoute = async ({ request }) => {
  // API logic here
};
```

### Issue 2: Invalid Output Mode
**Problem**: Using `hybrid` mode throws configuration error.

**Solution**: Use `server` mode instead of `hybrid` for this version of Astro.

## Key Learnings
- Astro API routes require server-side rendering to be enabled
- Not all Astro versions support `hybrid` output mode
- Each API route file needs `prerender = false` when using mixed rendering modes
- Development warnings about missing adapters are normal for dev mode

## Files Modified
- `astro.config.mjs` - Added server output mode
- `src/pages/api/generate-document.ts` - Added prerender disable
