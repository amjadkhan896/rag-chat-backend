# Running in Mock Mode (Without OpenAI API Key)

If you don't have a valid OpenAI API key or want to test the application without making API calls, you can run it in mock mode.

## Quick Setup

1. **Add to your `.env` file:**
   ```env
   USE_MOCK_MODE=true
   ```

2. **Or simply remove/comment out the OpenAI API key:**
   ```env
   # OPENAI_API_KEY=your-key-here
   ```

3. **Restart the backend server:**
   ```bash
   npm run start:dev
   ```

## What Mock Mode Does

- ✅ **No OpenAI API calls** - Saves you money and API quota
- ✅ **Mock responses** - Provides realistic test responses
- ✅ **Streaming simulation** - Simulates real-time streaming
- ✅ **Document management** - All document features work (without vector search)
- ✅ **Full UI functionality** - Complete chat interface experience

## Mock Responses

The mock service provides intelligent responses based on common questions:

- "hi" / "hello" → Friendly greeting
- "what is ai" → AI explanation
- "how are you" → Status response
- "test" → Test confirmation
- Any other question → Custom response with your question included

## Perfect For

- 🧪 **Development and testing**
- 💰 **Saving API costs during development**
- 🚀 **Demo purposes**
- 🔧 **Local development without internet**

## Switching Back to Real Mode

When you get a valid OpenAI API key:

1. **Add your API key to `.env`:**
   ```env
   OPENAI_API_KEY=sk-your-valid-key-here
   USE_MOCK_MODE=false
   ```

2. **Restart the server** - It will automatically detect the valid key and switch to real mode

## Note

Mock mode still requires:
- ✅ Database connection (for storing messages)
- ✅ All other environment variables
- ❌ No OpenAI API key needed
- ❌ No Supabase setup needed (vector features will be disabled)
