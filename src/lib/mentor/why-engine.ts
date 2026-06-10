// Why engine (Phase 3).
//
// "Why BFS? / Why Dijkstra? / Why A*? ..." -> structured purpose, strengths,
// weaknesses and common use cases, drawn from the knowledge base.
import type { AlgorithmType, AppLanguage, Localized, WhyResult } from './types';
import { getKnowledge } from './algorithm-knowledge';

/** Build the structured "why" explanation for an algorithm. */
export function explainWhy(type: AlgorithmType): WhyResult {
  const k = getKnowledge(type);
  return {
    type: k.type,
    label: k.label,
    purpose: k.purpose,
    strengths: k.strengths,
    weaknesses: k.weaknesses,
    useCases: k.useCases,
  };
}

const HEADERS = {
  why: { en: 'Why', sq: 'Pse' } as Localized,
  purpose: { en: 'Purpose', sq: 'Qellimi' } as Localized,
  strengths: { en: 'Strengths', sq: 'Pikat e forta' } as Localized,
  weaknesses: { en: 'Weaknesses', sq: 'Pikat e dobeta' } as Localized,
  useCases: { en: 'Common use cases', sq: 'Raste te zakonshme perdorimi' } as Localized,
};

/** Render a "why" explanation as a chat-friendly, localized string. */
export function formatWhy(result: WhyResult, lang: AppLanguage): string {
  const lines: string[] = [];
  lines.push(`${HEADERS.why[lang]} ${result.label}?`);
  lines.push('');
  lines.push(`${HEADERS.purpose[lang]}: ${result.purpose[lang]}`);

  lines.push('');
  lines.push(`${HEADERS.strengths[lang]}:`);
  for (const s of result.strengths[lang]) lines.push(`- ${s}`);

  lines.push('');
  lines.push(`${HEADERS.weaknesses[lang]}:`);
  for (const w of result.weaknesses[lang]) lines.push(`- ${w}`);

  lines.push('');
  lines.push(`${HEADERS.useCases[lang]}:`);
  for (const u of result.useCases[lang]) lines.push(`- ${u}`);

  return lines.join('\n');
}

/** Convenience: structured + formatted in one call. */
export function explainWhyFormatted(type: AlgorithmType, lang: AppLanguage): string {
  return formatWhy(explainWhy(type), lang);
}
