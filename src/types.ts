export interface AnalogousQuestion {
  question: string;
  options?: string[];
  answer: string;
  analysis: string;
}

export interface QuestionRecord {
  id?: string;
  userId: string;
  originalQuestion: string;
  originalOptions?: string[];
  originalAnswer?: string;
  knowledgePoint: string;
  subject: string;
  analogousQuestions: AnalogousQuestion[];
  createdAt: any; // Firestore Timestamp
}

export interface OCRResult {
  question: string;
  options?: string[];
  answer?: string;
  knowledgePoint: string;
  subject: string;
}
