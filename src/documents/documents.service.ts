import { Injectable, Logger } from '@nestjs/common';
import { Document } from '@langchain/core/documents';
import { VectorStoreService } from '../vector-store/vector-store.service';

export interface DocumentInput {
  content: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(private vectorStoreService: VectorStoreService) { }

  /**
   * Ingest a single document
   */
  async ingestDocument(input: DocumentInput): Promise<void> {
    try {
      const document = new Document({
        pageContent: input.content,
        metadata: {
          ...input.metadata,
          ingestedAt: new Date().toISOString(),
        },
      });

      await this.vectorStoreService.addDocuments([document]);
      this.logger.log(`Successfully ingested document with metadata: ${JSON.stringify(input.metadata)}`);
    } catch (error) {
      this.logger.error('Failed to ingest document:', error);
      throw error;
    }
  }

  /**
   * Ingest multiple documents
   */
  async ingestDocuments(inputs: DocumentInput[]): Promise<void> {
    try {
      const documents = inputs.map(input => new Document({
        pageContent: input.content,
        metadata: {
          ...input.metadata,
          ingestedAt: new Date().toISOString(),
        },
      }));

      await this.vectorStoreService.addDocuments(documents);
      this.logger.log(`Successfully ingested ${documents.length} documents`);
    } catch (error) {
      this.logger.error('Failed to ingest documents:', error);
      throw error;
    }
  }

  /**
   * Ingest text content by splitting it into chunks
   */
  async ingestTextContent(
    content: string,
    metadata: Record<string, any> = {},
    chunkSize: number = 1000,
    chunkOverlap: number = 200
  ): Promise<void> {
    try {
      // Simple text chunking - in production, you might want to use more sophisticated chunking
      const chunks = this.splitTextIntoChunks(content, chunkSize, chunkOverlap);

      const documents = chunks.map((chunk, index) => new Document({
        pageContent: chunk,
        metadata: {
          ...metadata,
          chunkIndex: index,
          totalChunks: chunks.length,
          ingestedAt: new Date().toISOString(),
        },
      }));

      await this.vectorStoreService.addDocuments(documents);
      this.logger.log(`Successfully ingested text content split into ${chunks.length} chunks`);
    } catch (error) {
      this.logger.error('Failed to ingest text content:', error);
      throw error;
    }
  }

  /**
   * Simple text chunking implementation
   */
  private splitTextIntoChunks(text: string, chunkSize: number, chunkOverlap: number): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      let chunk = text.slice(start, end);

      // Try to break at sentence boundaries
      if (end < text.length) {
        const lastSentenceEnd = chunk.lastIndexOf('.');
        const lastQuestionEnd = chunk.lastIndexOf('?');
        const lastExclamationEnd = chunk.lastIndexOf('!');
        const lastNewline = chunk.lastIndexOf('\n');

        const breakPoint = Math.max(lastSentenceEnd, lastQuestionEnd, lastExclamationEnd, lastNewline);

        if (breakPoint > chunkSize * 0.5) { // Only break if we're not losing too much content
          chunk = chunk.slice(0, breakPoint + 1);
        }
      }

      chunks.push(chunk.trim());
      start = start + chunk.length - chunkOverlap;
    }

    return chunks.filter(chunk => chunk.length > 0);
  }

  /**
   * Search for documents by content
   */
  async searchDocuments(query: string, limit: number = 10): Promise<Document[]> {
    try {
      return await this.vectorStoreService.similaritySearch(query, limit);
    } catch (error) {
      this.logger.error('Failed to search documents:', error);
      throw error;
    }
  }

  /**
   * Delete documents by metadata filter
   */
  async deleteDocuments(filter: Record<string, any>): Promise<void> {
    try {
      await this.vectorStoreService.deleteDocuments(filter);
      this.logger.log(`Successfully deleted documents with filter: ${JSON.stringify(filter)}`);
    } catch (error) {
      this.logger.error('Failed to delete documents:', error);
      throw error;
    }
  }
}
