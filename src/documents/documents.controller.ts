import { Body, Controller, Delete, Get, Post, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiQuery, ApiParam } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import type { DocumentInput } from './documents.service';
import { Document } from '@langchain/core/documents';

@ApiTags('documents')
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) { }

  @Post('ingest')
  @ApiOperation({ summary: 'Ingest a single document' })
  @ApiBody({
    description: 'Document to ingest',
    schema: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'Document content' },
        metadata: { type: 'object', description: 'Document metadata' }
      },
      required: ['content']
    }
  })
  async ingestDocument(@Body() body: DocumentInput): Promise<{ message: string }> {
    await this.documentsService.ingestDocument(body);
    return { message: 'Document ingested successfully' };
  }

  @Post('ingest-multiple')
  @ApiOperation({ summary: 'Ingest multiple documents' })
  @ApiBody({
    description: 'Documents to ingest',
    schema: {
      type: 'object',
      properties: {
        documents: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              content: { type: 'string' },
              metadata: { type: 'object' }
            },
            required: ['content']
          }
        }
      },
      required: ['documents']
    }
  })
  async ingestDocuments(@Body() body: { documents: DocumentInput[] }): Promise<{ message: string }> {
    await this.documentsService.ingestDocuments(body.documents);
    return { message: `${body.documents.length} documents ingested successfully` };
  }

  @Post('ingest-text')
  @ApiOperation({ summary: 'Ingest text content with automatic chunking' })
  @ApiBody({
    description: 'Text content to ingest',
    schema: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'Text content to ingest' },
        metadata: { type: 'object', description: 'Document metadata' },
        chunkSize: { type: 'number', description: 'Chunk size in characters', default: 1000 },
        chunkOverlap: { type: 'number', description: 'Chunk overlap in characters', default: 200 }
      },
      required: ['content']
    }
  })
  async ingestTextContent(
    @Body() body: {
      content: string;
      metadata?: Record<string, any>;
      chunkSize?: number;
      chunkOverlap?: number;
    }
  ): Promise<{ message: string }> {
    await this.documentsService.ingestTextContent(
      body.content,
      body.metadata,
      body.chunkSize,
      body.chunkOverlap
    );
    return { message: 'Text content ingested successfully' };
  }

  @Get('search')
  @ApiOperation({ summary: 'Search documents by content' })
  @ApiQuery({ name: 'query', description: 'Search query', required: true })
  @ApiQuery({ name: 'limit', description: 'Maximum number of results', required: false, type: Number })
  async searchDocuments(
    @Query('query') query: string,
    @Query('limit') limit?: number
  ): Promise<Document[]> {
    return await this.documentsService.searchDocuments(query, limit || 10);
  }

  @Delete('delete')
  @ApiOperation({ summary: 'Delete documents by metadata filter' })
  @ApiBody({
    description: 'Metadata filter for documents to delete',
    schema: {
      type: 'object',
      properties: {
        filter: { type: 'object', description: 'Metadata filter' }
      },
      required: ['filter']
    }
  })
  async deleteDocuments(@Body() body: { filter: Record<string, any> }): Promise<{ message: string }> {
    await this.documentsService.deleteDocuments(body.filter);
    return { message: 'Documents deleted successfully' };
  }
}
