import { db } from '@/lib/db';
import { evaluateRelevance } from '@/lib/relevance/evaluator';
import type { RelevanceExpression } from '@/lib/relevance/types';
import type { AnswerMap } from '@/types';
import nodemailer from 'nodemailer';

export async function processRoutingRules(surveyId: string, responseId: string) {
  try {
    const rules = await db.routingRule.findMany({
      where: { surveyId, isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    if (!rules.length) return;

    const response = await db.surveyResponse.findUnique({
      where: { id: responseId },
      include: {
        answers: {
          include: { question: true }
        }
      }
    });

    if (!response) return;

    const answerMap: AnswerMap = new Map();
    for (const answer of response.answers) {
      // Prioritize text, then choices, then numeric
      let val: any = answer.textValue ?? answer.numericValue ?? answer.choiceValues;
      answerMap.set(answer.question.code, val);
    }

    for (const rule of rules) {
      const isMatch = evaluateRelevance(rule.condition as RelevanceExpression, answerMap);
      if (!isMatch) continue;

      if (rule.actionType === 'EMAIL') {
        try {
          if (!process.env.SMTP_HOST || process.env.SMTP_HOST === 'smtp.example.com') {
            console.warn(`[ROUTING] SMTP not configured in .env. Skipping email to ${rule.recipientEmail}.`);
            continue;
          }

          const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: Number(process.env.SMTP_PORT) === 465,
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            },
          });

          // Helper to interpolate {{Q1}} and {{RESPONSE_LINK}} variables in email body
          const interpolate = (str: string) => {
            return str.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
              const k = key.trim();
              if (k === 'RESPONSE_LINK') {
                const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
                return `${baseUrl}/surveys/${surveyId}/responses?responseId=${responseId}`;
              }
              const val = answerMap.get(k);
              if (Array.isArray(val)) return val.join(', ');
              return val !== undefined && val !== null ? String(val) : '';
            });
          };

          const subject = interpolate(rule.emailSubject || '');
          const body = interpolate(rule.emailBody || '');

          await transporter.sendMail({
            from: process.env.SMTP_FROM || '"LemonSurvey" <noreply@lemonsurvey.com>',
            to: rule.recipientEmail || '',
            subject: subject,
            text: body,
          });
          console.log(`[ROUTING] Email successfully sent to ${rule.recipientEmail}`);
        } catch (err) {
          console.error(`[ROUTING] Failed to send email:`, err);
        }
      } else if (rule.actionType === 'WEBHOOK' && rule.webhookUrl) {
        try {
          console.log(`[ROUTING] Triggering webhook to ${rule.webhookUrl} for rule "${rule.name}"`);
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
          };
          if (rule.webhookHeaders && typeof rule.webhookHeaders === 'object') {
            Object.assign(headers, rule.webhookHeaders);
          }

          const res = await fetch(rule.webhookUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              surveyId,
              responseId,
              ruleId: rule.id,
              timestamp: new Date().toISOString(),
              answers: Object.fromEntries(answerMap),
            }),
          });

          if (!res.ok) {
            console.error(`[ROUTING] Webhook failed with status ${res.status}`);
          }
        } catch (err) {
          console.error(`[ROUTING] Failed to send webhook:`, err);
        }
      }
    }
  } catch (error) {
    console.error('[ROUTING] Evaluator failed:', error);
  }
}
