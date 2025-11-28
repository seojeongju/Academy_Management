import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../config/env.js';

const genAI = new GoogleGenerativeAI(config.gemini?.apiKey || '');

export async function analyzeConsultation(content) {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

        const prompt = `
        다음은 학생 상담 내용입니다. 이 내용을 분석하여 다음 항목을 JSON 형식으로 출력해주세요.
        
        상담 내용:
        ${content}
        
        출력 형식 (JSON):
        {
            "summary": "3줄 이내 요약",
            "sentiment": "positive" | "neutral" | "negative",
            "keywords": ["키워드1", "키워드2", "키워드3"],
            "action_items": ["조치사항1", "조치사항2"]
        }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Extract JSON
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return null;

        return JSON.parse(jsonMatch[0]);
    } catch (error) {
        console.error('AI Analysis Error:', error);
        throw new Error('AI 분석에 실패했습니다.');
    }
}
