# RAG Chat Backend - LangChain & Supabase Setup

This document provides instructions for setting up the RAG (Retrieval-Augmented Generation) chat application using LangChain and Supabase with pgvector.

## Overview

The application has been converted from direct OpenAI API calls to use:
- **LangChain** for RAG chain implementation
- **Supabase** with **pgvector** for vector storage and similarity search
- **OpenAI Embeddings** for document vectorization
- **Streaming responses** for real-time chat experience

## Prerequisites

1. **Supabase Account**: Create a project at [supabase.com](https://supabase.com)
2. **OpenAI API Key**: Get your API key from [OpenAI](https://platform.openai.com)
3. **Node.js**: Version 18 or higher
4. **PostgreSQL**: For local development (optional, can use Supabase)

## Setup Instructions

### 1. Supabase Configuration

#### Enable pgvector Extension
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run the following SQL to enable pgvector:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

#### Create Documents Table and Functions
Run the complete setup script from `supabase-setup.sql`:

```sql
-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create the documents table for storing embeddings
CREATE TABLE IF NOT EXISTS documents (
  id BIGSERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  embedding VECTOR(1536), -- OpenAI text-embedding-3-small produces 1536-dimensional vectors
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on the embedding column for faster similarity search
CREATE INDEX IF NOT EXISTS documents_embedding_idx ON documents 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Create a function to perform similarity search
CREATE OR REPLACE FUNCTION match_documents (
  query_embedding VECTOR(1536),
  match_count INT DEFAULT NULL,
  filter JSONB DEFAULT '{}'
)
RETURNS TABLE (
  id BIGINT,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    documents.id,
    documents.content,
    documents.metadata,
    1 - (documents.embedding <=> query_embedding) AS similarity
  FROM documents
  WHERE metadata @> filter
  ORDER BY documents.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_documents_updated_at 
  BEFORE UPDATE ON documents 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
```

### 2. Environment Configuration

Create a `.env` file in the backend root directory:

```env
# Database Configuration (for local PostgreSQL - optional)
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_DATABASE=rag_chat_backend

# Supabase Configuration (Required)
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI Configuration (Required)
OPENAI_API_KEY=your_openai_api_key

# JWT Configuration
JWT_SECRET=your_jwt_secret_key

# API Key Configuration
X_API_KEY=your_api_key

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Application Configuration
NODE_ENV=development
PORT=8080
```

### 3. Install Dependencies

```bash
cd rag-chat-backend
npm install
```

### 4. Start the Application

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

## API Endpoints

### Document Management

- `POST /api/v1/documents/ingest` - Ingest a single document
- `POST /api/v1/documents/ingest-multiple` - Ingest multiple documents
- `POST /api/v1/documents/ingest-text` - Ingest text with automatic chunking
- `GET /api/v1/documents/search?query=<query>&limit=<limit>` - Search documents
- `DELETE /api/v1/documents/delete` - Delete documents by metadata filter

### Chat Messages

- `POST /api/v1/messages/:sessionId` - Send a message (non-streaming)
- `POST /api/v1/messages/:sessionId/stream` - Send a message (streaming RAG response)
- `GET /api/v1/messages/:sessionId` - Get session messages

## Architecture

### Backend Components

1. **VectorStoreService** (`src/vector-store/vector-store.service.ts`)
   - Manages document embeddings and similarity search
   - Integrates with Supabase pgvector

2. **RagChainService** (`src/rag/rag-chain.service.ts`)
   - Implements RAG chain using LangChain
   - Handles document retrieval and response generation
   - Supports both regular and streaming responses

3. **DocumentsService** (`src/documents/documents.service.ts`)
   - Handles document ingestion and management
   - Supports text chunking for large documents

4. **MessagesService** (`src/messages/messages.service.ts`)
   - Updated to use RAG instead of direct OpenAI calls
   - Maintains conversation history

### Frontend Components

1. **DocumentManager** (`src/components/DocumentManager.tsx`)
   - UI for managing documents in the vector store
   - Supports single document, multiple documents, and text chunking

2. **Updated Chat API** (`src/services/api/chatApi.ts`)
   - Modified to work with new RAG streaming endpoints

## Usage

### 1. Ingest Documents

Use the Document Manager UI or API endpoints to add documents to your knowledge base:

```javascript
// Single document
await documentApi.ingestDocument({
  content: "Your document content here",
  metadata: { category: "example", source: "manual" }
});

// Text with automatic chunking
await documentApi.ingestTextContent(
  "Long text content that will be automatically chunked...",
  { category: "text", source: "file" },
  1000, // chunk size
  200   // chunk overlap
);
```

### 2. Chat with RAG

The chat now automatically:
1. Retrieves relevant documents based on user queries
2. Uses retrieved context to generate more accurate responses
3. Streams responses in real-time

### 3. Search Documents

```javascript
const results = await documentApi.searchDocuments("your search query", 10);
```

## Key Features

- **Vector Similarity Search**: Fast document retrieval using pgvector
- **Automatic Chunking**: Large documents are automatically split into manageable chunks
- **Streaming Responses**: Real-time chat experience with streaming RAG responses
- **Metadata Filtering**: Documents can be filtered by metadata
- **Conversation History**: Maintains chat context across sessions
- **Document Management**: Full CRUD operations for documents

## Troubleshooting

### Common Issues

1. **Supabase Connection Error**
   - Verify your `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
   - Ensure the pgvector extension is enabled

2. **OpenAI API Errors**
   - Check your `OPENAI_API_KEY` is valid
   - Verify you have sufficient API credits

3. **Vector Search Not Working**
   - Ensure the `documents` table and `match_documents` function are created
   - Check that documents have been properly ingested with embeddings

4. **Streaming Issues**
   - Verify CORS settings for streaming endpoints
   - Check browser compatibility for Server-Sent Events

### Performance Optimization

1. **Index Tuning**: Adjust the `lists` parameter in the ivfflat index based on your data size
2. **Chunk Size**: Optimize chunk size and overlap for your use case
3. **Similarity Threshold**: Use similarity scores to filter low-quality matches

## Next Steps

1. **Add More Document Types**: Support for PDFs, Word docs, etc.
2. **Advanced Chunking**: Implement semantic chunking strategies
3. **Hybrid Search**: Combine vector and keyword search
4. **User Authentication**: Add proper user management
5. **Analytics**: Track document usage and query performance

## Support

For issues and questions:
1. Check the logs in `logs/` directory
2. Verify environment configuration
3. Test individual components using the API endpoints
4. Review the LangChain and Supabase documentation
