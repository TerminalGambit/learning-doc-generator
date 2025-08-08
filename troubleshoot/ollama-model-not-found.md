# Troubleshooting: Ollama Model Not Found

## Problem
When integrating with Ollama API, receiving "model 'modelname' not found" errors even though the model appears in `ollama list`.

## Root Cause
The Ollama API server and the CLI interface may have different model registries or the API server may not see models that were only downloaded via CLI.

## Solution Steps

### 1. Check API Available Models
Use the Ollama API to see which models are actually available:

```bash
curl -s http://localhost:11434/api/tags | jq '.models[].name'
```

### 2. Compare with CLI Models
Compare with what `ollama list` shows:

```bash
ollama list
```

### 3. Use API-Available Models
Update your configuration to use models that appear in the API response, not just CLI list.

**Example Fix:**
```typescript
// Instead of using models from ollama list
model: 'llama3.2:1b'  // Might not work with API

// Use models available via API
model: 'mistral:7b'   // Works with API
```

### 4. Test Model Availability
Before using in application, test directly:

```bash
curl -X POST http://localhost:11434/api/generate -H "Content-Type: application/json" -d '{"model":"mistral:7b","prompt":"Test","stream":false}' --max-time 30
```

### 5. Model Loading
If model exists but API says it's not found, try loading it first:

```bash
ollama run mistral:7b "Hello"
```

This ensures the model is loaded and available to the API server.

## Key Learnings
- `ollama list` and API `/tags` may show different models
- Always verify model availability via API before using in application
- Ollama CLI and API server may have separate model registries
- Use models that appear in the API tags response for reliable operation

## Resolution
Updated `src/config.ts` to use `mistral:7b` instead of `llama3.2:1b` as it's confirmed available via the Ollama API.

## Prevention
Always check model availability via API endpoint when setting up new models for programmatic use.
