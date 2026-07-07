// Relevance Engine Types
export type ComparisonOp =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'lt'
  | 'gte'
  | 'lte'
  | 'contains'
  | 'in'
  | 'empty'
  | 'notEmpty';

export interface Condition {
  questionCode: string;
  op: ComparisonOp;
  value: string | number | string[];
}

export interface ConditionGroup {
  operator: 'AND' | 'OR';
  conditions: (Condition | ConditionGroup)[];
}

export type RelevanceExpression = ConditionGroup | null;

// Question Types
export type QuestionType =
  | 'SINGLE_CHOICE'
  | 'MULTIPLE_CHOICE'
  | 'DROPDOWN'
  | 'TEXT_SHORT'
  | 'TEXT_LONG'
  | 'RATING'
  | 'FILE_UPLOAD'
  | 'EQUATION'
  | 'PRESENTATION';

export interface AttachedAsset {
  type: 'image' | 'file' | 'html';
  url: string;
  caption?: string;
  showWhen: 'selected' | 'always';
}

// Status Enums
export type SurveyStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'ARCHIVED';
export type ParticipantStatus = 'PENDING' | 'INVITED' | 'STARTED' | 'COMPLETED' | 'EXPIRED';
export type RoutingAction = 'EMAIL' | 'WEBHOOK';
export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'USER';

export interface RoutingRule {
  id: string;
  surveyId: string;
  name: string;
  actionType: RoutingAction;
  isActive: boolean;
  condition: RelevanceExpression;
  
  // Email Action Fields
  recipientEmail?: string;
  emailSubject?: string;
  emailBody?: string;
  
  // Webhook Action Fields
  webhookUrl?: string;
  
  createdAt: string;
  updatedAt: string;
}

export type RoutingRulePayload = Omit<RoutingRule, 'id' | 'surveyId' | 'createdAt' | 'updatedAt'>;

// API Response Wrapper
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// Survey Answer Map (used by Relevance Engine & Piping)
export type AnswerMap = Map<string, string | string[]>;
