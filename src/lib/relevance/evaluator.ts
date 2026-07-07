import type { Condition, ConditionGroup, RelevanceExpression } from './types';
import type { AnswerMap } from '@/types';

function evaluateCondition(condition: Condition, answers: AnswerMap): boolean {
  const rawValue = answers.get(condition.questionCode);
  const answerStr = Array.isArray(rawValue) ? rawValue.join(',') : (rawValue ?? '');
  const answerArr = Array.isArray(rawValue) ? rawValue : [rawValue ?? ''];
  const answerNum = parseFloat(answerStr);

  switch (condition.op) {
    case 'eq':
      return answerStr === String(condition.value);
    case 'neq':
      return answerStr !== String(condition.value);
    case 'gt':
      return !isNaN(answerNum) && answerNum > Number(condition.value);
    case 'lt':
      return !isNaN(answerNum) && answerNum < Number(condition.value);
    case 'gte':
      return !isNaN(answerNum) && answerNum >= Number(condition.value);
    case 'lte':
      return !isNaN(answerNum) && answerNum <= Number(condition.value);
    case 'contains':
      return answerStr.includes(String(condition.value));
    case 'in': {
      const allowed = Array.isArray(condition.value)
        ? condition.value
        : [String(condition.value)];
      return answerArr.some((a) => allowed.includes(a));
    }
    case 'empty':
      return answerStr === '' || rawValue === undefined;
    case 'notEmpty':
      return answerStr !== '' && rawValue !== undefined;
    default:
      return true;
  }
}

function evaluateGroup(group: ConditionGroup, answers: AnswerMap): boolean {
  const results = group.conditions.map((item) => {
    if ('operator' in item) {
      return evaluateGroup(item as ConditionGroup, answers);
    }
    return evaluateCondition(item as Condition, answers);
  });

  if (group.operator === 'AND') {
    return results.every(Boolean);
  }
  return results.some(Boolean);
}

export function evaluateRelevance(
  expression: RelevanceExpression,
  answers: AnswerMap
): boolean {
  if (!expression) return true;
  return evaluateGroup(expression, answers);
}
