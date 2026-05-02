import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NlSqlService {
  constructor(private readonly config: ConfigService) {}

  async questionToSelectSql(
    question: string,
    schemaHint?: string,
  ): Promise<string> {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'OPENAI_API_KEY is not configured; provide sql explicitly or set the key',
      );
    }

    const system = [
      'You translate business questions into a single PostgreSQL SELECT query.',
      'Output ONLY the SQL. No markdown fences, no explanation.',
      'Use standard PostgreSQL. Prefer explicit column lists when reasonable.',
      'The query must be read-only (SELECT only).',
    ].join(' ');

    const userContent = [
      schemaHint ? `Schema / context:\n${schemaHint}\n` : '',
      `Question:\n${question}`,
    ].join('\n');

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userContent },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new ServiceUnavailableException(
        `OpenAI request failed (${res.status}): ${body.slice(0, 500)}`,
      );
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = json.choices?.[0]?.message?.content?.trim() ?? '';
    const sql = raw
      .replace(/^```(?:sql)?/i, '')
      .replace(/```$/i, '')
      .trim();

    if (!sql) {
      throw new ServiceUnavailableException('Model returned empty SQL');
    }

    return sql;
  }
}
