import type { AnswerMap } from '@/types';

/**
 * Replaces {{QuestionCode}} placeholders in a template string
 * with the corresponding answer values.
 */
export function interpolate(template: string, answers: AnswerMap): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, code: string) => {
    const value = answers.get(code);
    if (value === undefined || value === null) return match;
    if (Array.isArray(value)) return value.join(', ');
    return String(value);
  });
}
