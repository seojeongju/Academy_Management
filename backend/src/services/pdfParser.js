import { GoogleGenerativeAI } from '@google/generative-ai';
import pdf from 'pdf-parse';
import fs from 'fs/promises';
import config from '../config/env.js';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(config.gemini?.apiKey || 'YOUR_GEMINI_API_KEY');

// Parse PDF and extract text
export async function parsePDF(filePath) {
    try {
        const dataBuffer = await fs.readFile(filePath);
        const data = await pdf(dataBuffer);
        return data.text;
    } catch (error) {
        console.error('PDF parsing error:', error);
        throw new Error('PDF 파일을 읽는데 실패했습니다.');
    }
}

// Parse questions using AI
export async function parseQuestionsWithAI(pdfText) {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

        const prompt = `
다음은 시험 문제지 내용입니다. 이 내용을 분석하여 각 문제를 JSON 배열로 변환해주세요.

문제지 내용:
${pdfText}

출력 형식 (JSON 배열):
[
  {
    "type": "multiple_choice" | "multiple_answer" | "short_answer" | "essay" | "true_false",
    "difficulty": "easy" | "medium" | "hard",
    "question_text": "문제 지문",
    "options": ["1번 선택지", "2번 선택지", "3번 선택지", "4번 선택지"],
    "correct_answer": "정답 (객관식의 경우 1, 2, 3, 4 중 하나, 주관식의 경우 정답 텍스트)",
    "explanation": "해설 (있는 경우)",
    "score_weight": 5,
    "ncs_unit_code": null
  }
]

규칙:
1. 각 문제를 독립적인 객체로 분리
2. 객관식/복수선택 문제는 options 배열에 선택지 포함
3. 정답이 명시되어 있으면 correct_answer에 포함
4. 해설이 있으면 explanation에 포함
5. 배점이 명시되어 있으면 score_weight에 포함 (기본값: 5)
6. 난이도를 추론할 수 있으면 difficulty 설정 (기본값: medium)
7. type은 문제 유형에 따라 적절히 설정

JSON 배열만 출력해주세요. 다른 설명은 불필요합니다.
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Extract JSON from response
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            throw new Error('AI 응답에서 JSON을 추출할 수 없습니다.');
        }

        const questions = JSON.parse(jsonMatch[0]);
        return questions;

    } catch (error) {
        console.error('AI parsing error:', error);
        throw new Error('AI를 사용한 문제 파싱에 실패했습니다: ' + error.message);
    }
}

// Main function to process PDF and extract questions
export async function processPDFQuestions(filePath) {
    try {
        // Step 1: Extract text from PDF
        console.log('📄 PDF 텍스트 추출 중...');
        const pdfText = await parsePDF(filePath);

        if (!pdfText || pdfText.trim().length === 0) {
            throw new Error('PDF에서 텍스트를 추출할 수 없습니다. 이미지 기반 PDF일 수 있습니다.');
        }

        console.log('✅ PDF 텍스트 추출 완료');
        console.log('📝 추출된 텍스트 길이:', pdfText.length);

        // Step 2: Parse questions using AI
        console.log('🤖 AI를 사용하여 문제 파싱 중...');
        const questions = await parseQuestionsWithAI(pdfText);

        console.log('✅ 문제 파싱 완료:', questions.length, '개');

        // Clean up uploaded file
        await fs.unlink(filePath);

        return {
            success: true,
            questions,
            totalQuestions: questions.length
        };

    } catch (error) {
        // Clean up file on error
        try {
            await fs.unlink(filePath);
        } catch (unlinkError) {
            console.error('파일 삭제 실패:', unlinkError);
        }

        throw error;
    }
}
