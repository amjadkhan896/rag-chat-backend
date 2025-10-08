import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { OpenAIEmbeddings } from '@langchain/openai';
import { Document } from '@langchain/core/documents';
import { SupabaseConfig } from '../config/supabase.config';

@Injectable()
export class VectorStoreService {
  private readonly logger = new Logger(VectorStoreService.name);
  private vectorStore: SupabaseVectorStore;
  private embeddings: OpenAIEmbeddings;

  constructor(private configService: ConfigService) {
    this.initializeVectorStore();
  }

  private async initializeVectorStore() {
    try {
      const supabaseConfig = SupabaseConfig.getInstance(this.configService);
      const supabaseClient = supabaseConfig.getClient();

      if (!supabaseClient) {
        this.logger.warn('Supabase client not available. Vector store features will be disabled.');
        return;
      }

      this.embeddings = new OpenAIEmbeddings({
        openAIApiKey: this.configService.get<string>('OPENAI_API_KEY'),
        modelName: 'text-embedding-3-small', // More cost-effective embedding model
      });

      this.vectorStore = new SupabaseVectorStore(this.embeddings, {
        client: supabaseClient,
        tableName: 'documents',
        queryName: 'match_documents',
      });

      this.logger.log('Vector store initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize vector store:', error);
      this.logger.warn('Vector store features will be disabled.');
    }
  }

  /**
   * Add documents to the vector store
   */
  async addDocuments(documents: Document[]): Promise<void> {
    if (!this.vectorStore) {
      this.logger.warn('Vector store not available. Cannot add documents.');
      return;
    }
    try {
      await this.vectorStore.addDocuments(documents);
      this.logger.log(`Added ${documents.length} documents to vector store`);
    } catch (error) {
      this.logger.error('Failed to add documents to vector store:', error);
      throw error;
    }
  }

  /**
   * Add a single document to the vector store
   */
  async addDocument(content: string, metadata: Record<string, any> = {}): Promise<void> {
    const document = new Document({
      pageContent: content,
      metadata,
    });
    await this.addDocuments([document]);
  }

  /**
   * Perform similarity search to find relevant documents
   */
  async similaritySearch(query: string, k: number = 5): Promise<Document[]> {
    if (!this.vectorStore) {
      this.logger.warn('Vector store not available. Returning empty results.');
      return [];
    }
    try {
      const results = await this.vectorStore.similaritySearch(query, k);
      this.logger.log(`Found ${results.length} similar documents for query: ${query}`);
      return results;
    } catch (error) {
      this.logger.error('Failed to perform similarity search:', error);
      throw error;
    }
  }

  /**
   * Perform similarity search with score threshold
   */
  async similaritySearchWithScore(
    query: string,
    k: number = 5,
    scoreThreshold: number = 0.7
  ): Promise<Array<[Document, number]>> {
    try {
      const results = await this.vectorStore.similaritySearchWithScore(query, k);
      const filteredResults = results.filter(([_, score]) => score >= scoreThreshold);
      this.logger.log(`Found ${filteredResults.length} documents above threshold ${scoreThreshold}`);
      return filteredResults;
    } catch (error) {
      this.logger.error('Failed to perform similarity search with score:', error);
      throw error;
    }
  }

  /**
   * Delete documents by metadata filter
   */
  async deleteDocuments(filter: Record<string, any>): Promise<void> {
    try {
      // Note: This is a simplified implementation
      // In a real scenario, you might need to implement custom deletion logic
      this.logger.log(`Deleting documents with filter: ${JSON.stringify(filter)}`);
      // Implementation would depend on your specific needs
    } catch (error) {
      this.logger.error('Failed to delete documents:', error);
      throw error;
    }
  }

  /**
   * Get the embeddings instance for direct use
   */
  getEmbeddings(): OpenAIEmbeddings {
    return this.embeddings;
  }

  /**
   * Get the vector store instance for direct use
   */
  getVectorStore(): SupabaseVectorStore {
    return this.vectorStore;
  }
}
