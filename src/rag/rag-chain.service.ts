import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { Document } from '@langchain/core/documents';
import { VectorStoreService } from '../vector-store/vector-store.service';

@Injectable()
export class RagChainService {
  private readonly logger = new Logger(RagChainService.name);
  private llm: ChatOpenAI;
  private ragChain: RunnableSequence<any, string>;

  constructor(
    private configService: ConfigService,
    private vectorStoreService: VectorStoreService,
  ) {
    this.initializeLLM();
    this.initializeRAGChain();
  }

  private initializeLLM() {
    this.llm = new ChatOpenAI({
      openAIApiKey: this.configService.get<string>('OPENAI_API_KEY'),
      modelName: 'gpt-4o',
      temperature: 0.7,
      streaming: true,
    });
  }

  private initializeRAGChain() {
    // Create a prompt template for RAG
    const promptTemplate = PromptTemplate.fromTemplate(`
You are a helpful AI assistant. Use the following pieces of context to answer the user's question.
If you don't know the answer based on the context, just say that you don't know, don't try to make up an answer.

Context:
{context}

Question: {question}

Answer: `);

    // Create the RAG chain
    this.ragChain = RunnableSequence.from([
      {
        context: async (input: { question: string }) => {
          // Retrieve relevant documents
          const docs = await this.vectorStoreService.similaritySearch(input.question, 5);
          return docs.map(doc => doc.pageContent).join('\n\n');
        },
        question: (input: { question: string }) => input.question,
      },
      promptTemplate,
      this.llm,
      new StringOutputParser(),
    ]);

    this.logger.log('RAG chain initialized successfully');
  }

  /**
   * Generate a response using RAG
   */
  async generateResponse(question: string): Promise<string> {
    try {
      this.logger.log(`Generating RAG response for question: ${question}`);

      // Check if vector store is available
      const docs = await this.vectorStoreService.similaritySearch(question, 5);
      if (docs.length === 0) {
        this.logger.warn('No relevant documents found. Using LLM without RAG context.');
        // Fallback to direct LLM response
        const response = await this.llm.invoke(question);
        return response.content as string;
      }

      const response = await this.ragChain.invoke({ question });
      return response;
    } catch (error) {
      this.logger.error('Failed to generate RAG response:', error);
      // Fallback to direct LLM response
      try {
        const response = await this.llm.invoke(question);
        return response.content as string;
      } catch (fallbackError) {
        this.logger.error('Fallback LLM response also failed:', fallbackError);
        throw error;
      }
    }
  }

  /**
   * Generate a streaming response using RAG
   */
  async generateStreamingResponse(
    question: string,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    try {
      this.logger.log(`Generating streaming RAG response for question: ${question}`);

      // Get context first
      const docs = await this.vectorStoreService.similaritySearch(question, 5);
      const context = docs.map(doc => doc.pageContent).join('\n\n');

      // Create prompt with context
      const prompt = `
You are a helpful AI assistant. Use the following pieces of context to answer the user's question.
If you don't know the answer based on the context, just say that you don't know, don't try to make up an answer.

Context:
${context}

Question: ${question}

Answer: `;

      // Stream the response
      const stream = await this.llm.stream(prompt);

      for await (const chunk of stream) {
        if (chunk.content) {
          onChunk(chunk.content as string);
        }
      }
    } catch (error) {
      this.logger.error('Failed to generate streaming RAG response:', error);
      throw error;
    }
  }

  /**
   * Get relevant documents for a query
   */
  async getRelevantDocuments(query: string, k: number = 5): Promise<Document[]> {
    try {
      return await this.vectorStoreService.similaritySearch(query, k);
    } catch (error) {
      this.logger.error('Failed to get relevant documents:', error);
      throw error;
    }
  }

  /**
   * Get the LLM instance for direct use
   */
  getLLM(): ChatOpenAI {
    return this.llm;
  }
}
