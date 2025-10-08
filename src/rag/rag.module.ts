import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RagChainService } from './rag-chain.service';
import { VectorStoreModule } from '../vector-store/vector-store.module';

@Module({
  imports: [ConfigModule, VectorStoreModule],
  providers: [RagChainService],
  exports: [RagChainService],
})
export class RagModule { }
