import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export class SupabaseConfig {
  private static instance: SupabaseConfig;
  private supabaseClient: SupabaseClient;

  private constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      console.warn('Supabase URL and Service Role Key are not configured. RAG features will be disabled.');
      // Create a mock client for now
      this.supabaseClient = null as any;
      return;
    }

    this.supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  public static getInstance(configService: ConfigService): SupabaseConfig {
    if (!SupabaseConfig.instance) {
      SupabaseConfig.instance = new SupabaseConfig(configService);
    }
    return SupabaseConfig.instance;
  }

  public getClient(): SupabaseClient {
    return this.supabaseClient;
  }
}
