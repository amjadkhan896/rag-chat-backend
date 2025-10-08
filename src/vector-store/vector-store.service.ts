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
    const supabaseConfig = SupabaseConfig.getInstance(this.configService);
    const supabaseClient = supabaseConfig.getClient();

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
  }

  /**
   * Add documents to the vector store
   */
  async addDocuments(documents: Document[]): Promise<void> {
    await this.vectorStore.addDocuments(documents);
    this.logger.log(`Added ${documents.length} documents to vector store`);
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
    const results = await this.vectorStore.similaritySearch(query, k);
    this.logger.log(`Found ${results.length} similar documents for query: ${query}`);
    return results;
  }

  /**
   * Perform similarity search with score threshold
   */
  async similaritySearchWithScore(
    query: string,
    k: number = 5,
    scoreThreshold: number = 0.7
  ): Promise<Array<[Document, number]>> {
    const results = await this.vectorStore.similaritySearchWithScore(query, k);
    const filteredResults = results.filter(([_, score]) => score >= scoreThreshold);
    this.logger.log(`Found ${filteredResults.length} documents above threshold ${scoreThreshold}`);
    return filteredResults;
  }

  /**
   * Delete documents by metadata filter
   */
  async deleteDocuments(filter: Record<string, any>): Promise<void> {
    // Note: This is a simplified implementation
    // In a real scenario, you might need to implement custom deletion logic
    this.logger.log(`Deleting documents with filter: ${JSON.stringify(filter)}`);
    // Implementation would depend on your specific needs
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
