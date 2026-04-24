import { ai } from '../lib/gemini';
import { OCRResult, AnalogousQuestion } from '../types';
import { Type } from '@google/genai';

export const geminiService = {
  async extractFromImage(base64Image: string, mimeType: string): Promise<OCRResult> {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            {
              inlineData: {
                data: base64Image,
                mimeType: mimeType,
              },
            },
            {
              text: `Recognize the question in the image. Extract the following information in JSON format:
              - question: The full text of the question (use markdown for math formulas).
              - options: An array of options if it's a multiple choice question.
              - answer: The correct answer if visible.
              - knowledgePoint: The core knowledge point (short name, e.g., "一元二次方程").
              - subject: The subject (e.g., "数学", "物理", "英语").`,
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            answer: { type: Type.STRING },
            knowledgePoint: { type: Type.STRING },
            subject: { type: Type.STRING },
          },
          required: ["question", "knowledgePoint", "subject"],
        },
      },
    });

    return JSON.parse(response.text || "{}");
  },

  async generateAnalogous(
    knowledgePoint: string,
    originalQuestion: string,
    subject: string
  ): Promise<AnalogousQuestion[]> {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Based on the knowledge point "${knowledgePoint}" and the original question below, generate 3 analogous questions (举一反三).
      Original Question: ${originalQuestion}
      Subject: ${subject}

      Requirements:
      1. Cover the same knowledge point but from different angles or variations.
      2. Difficulty should be similar to the original.
      3. For each question, provide:
         - question: The text of the new question.
         - options: Options if applicable.
         - answer: The correct answer.
         - analysis: A detailed analysis focusing on common mistakes (易错点分析).

      Return as a JSON array of objects.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              answer: { type: Type.STRING },
              analysis: { type: Type.STRING },
            },
            required: ["question", "answer", "analysis"],
          },
        },
      },
    });

    return JSON.parse(response.text || "[]");
  },
};
