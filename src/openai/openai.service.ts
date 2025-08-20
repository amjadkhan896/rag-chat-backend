import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class OpenaiService {
  private readonly logger = new Logger(OpenaiService.name);
  private readonly openai: OpenAI;

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async generateResponse(prompt: string): Promise<string> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o', // or 'gpt-3.5-turbo'
        messages: [{ role: 'user', content: prompt }],
      });
      console.log(completion, '-----');
      console.log(completion.choices[0]?.message?.content, "------")
      return completion.choices[0]?.message?.content || '';
    } catch (error: any) {
      this.logger.error(`OpenAI API error: ${error.message}`, error.stack);
      throw new Error('Failed to generate response');
    }
  }
}