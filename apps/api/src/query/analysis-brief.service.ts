import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type AskAnalysisBrief = {
  answer: string;
  sqlExplanation: string;
  drivers: { headline: string; detail: string }[];
  recommendedNextStep: string;
  caveats: string[];
  confidence: 'low' | 'medium' | 'high';
};

@Injectable()
export class AnalysisBriefService {
  private readonly logger = new Logger(AnalysisBriefService.name);

  constructor(private readonly config: ConfigService) {}

  async summarize(input: {
    question: string;
    sql: string;
    rows: Record<string, unknown>[];
    truncated: boolean;
  }): Promise<AskAnalysisBrief | null> {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      return null;
    }

    const rowSample = input.rows.slice(0, 40);
    let rowsJson: string;
    try {
      rowsJson = JSON.stringify(rowSample);
    } catch {
      rowsJson = '[unserializable rows]';
    }
    const maxLen = 14_000;
    if (rowsJson.length > maxLen) {
      rowsJson = `${rowsJson.slice(0, maxLen)}…`;
    }

    const system = [
      'You interpret SQL query results for non-technical business users.',
      'Be precise; do not invent numbers not present in the sample.',
      'If the sample is empty or too small to support conclusions, say so and list caveats.',
      'Return ONLY valid JSON matching this shape (no markdown):',
      '{"answer":"string","sqlExplanation":"string","drivers":[{"headline":"string","detail":"string"}],"recommendedNextStep":"string","caveats":["string"],"confidence":"low"|"medium"|"high"}',
      'sqlExplanation: 2-3 plain sentences describing what the SQL does (no jargon).',
      'drivers: at most 3 items, ordered by strength of evidence in the data.',
      'confidence: use "low" when sample is tiny, truncated, or ambiguous.',
    ].join(' ');

    const userContent = [
      `Business question:\n${input.question}`,
      `SQL executed:\n${input.sql}`,
      `Result truncated by row cap: ${input.truncated}`,
      `Sample rows (JSON array, up to 40):\n${rowsJson}`,
    ].join('\n\n');

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          temperature: 0.2,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: userContent },
          ],
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        this.logger.warn(
          `Analysis brief OpenAI failed (${res.status}): ${body.slice(0, 300)}`,
        );
        return null;
      }

      const json = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const raw = json.choices?.[0]?.message?.content?.trim() ?? '';
      if (!raw) return null;

      const parsed = JSON.parse(raw) as Partial<AskAnalysisBrief> & {
        drivers?: unknown[];
      };

      const answer =
        typeof parsed.answer === 'string' ? parsed.answer.trim() : '';
      if (!answer) return null;

      const driversRaw = Array.isArray(parsed.drivers) ? parsed.drivers : [];
      const drivers = driversRaw
        .slice(0, 3)
        .map((d) => {
          if (d && typeof d === 'object') {
            const o = d as Record<string, unknown>;
            const headline =
              typeof o.headline === 'string' ? o.headline.trim() : '';
            const detail =
              typeof o.detail === 'string' ? o.detail.trim() : '';
            if (headline || detail) {
              return { headline: headline || 'Driver', detail };
            }
          }
          return null;
        })
        .filter((x): x is { headline: string; detail: string } => x !== null);

      const recommendedNextStep =
        typeof parsed.recommendedNextStep === 'string'
          ? parsed.recommendedNextStep.trim()
          : '';

      const caveatsRaw = Array.isArray(parsed.caveats)
        ? parsed.caveats
        : [];
      const caveats = caveatsRaw
        .filter((c): c is string => typeof c === 'string' && c.trim().length > 0)
        .map((c) => c.trim())
        .slice(0, 5);

      const sqlExplanation =
        typeof parsed.sqlExplanation === 'string'
          ? parsed.sqlExplanation.trim()
          : '';

      let confidence: AskAnalysisBrief['confidence'] = 'low';
      if (parsed.confidence === 'high') confidence = 'high';
      else if (parsed.confidence === 'medium') confidence = 'medium';

      if (
        !input.truncated &&
        input.rows.length >= 10 &&
        confidence !== 'low'
      ) {
        confidence = 'high';
      } else if (
        !input.truncated &&
        input.rows.length >= 10 &&
        confidence === 'low'
      ) {
        confidence = 'medium';
      }

      return {
        answer,
        sqlExplanation:
          sqlExplanation ||
          'This query reads from your connected data and summarizes it for your question.',
        drivers,
        recommendedNextStep:
          recommendedNextStep || 'Review the query results with your team.',
        caveats,
        confidence,
      };
    } catch (err) {
      this.logger.warn(`Analysis brief parse/call failed: ${err}`);
      return null;
    }
  }
}
