import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../utils/logger.js';

// Initialize Gemini API only if key is provided
let genAI = null;
// Try multiple initialization strategies to handle library/version/auth differences:
// 1) If GEMINI_API_KEY is provided, try passing it as an object { apiKey } (some versions expect an options object)
// 2) Fall back to passing the raw key string (legacy usage)
// 3) If no API key provided, rely on ADC via GOOGLE_APPLICATION_CREDENTIALS
if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your-gemini-api-key-here') {
  try {
    try {
      genAI = new GoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });
      logger.info('Initialized Gemini client with apiKey using options object');
    } catch (e1) {
      // try legacy constructor
      try {
        genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        logger.info('Initialized Gemini client with apiKey using legacy constructor');
      } catch (e2) {
        logger.warn('Failed to initialize Gemini client with provided GEMINI_API_KEY (both styles):', e2.message || e2);
        genAI = null;
      }
    }
  } catch (error) {
    logger.warn('Failed to initialize Gemini API with GEMINI_API_KEY:', error && error.message ? error.message : error);
    genAI = null;
  }
} else {
  logger.info('No GEMINI_API_KEY provided; attempting to use Application Default Credentials (GOOGLE_APPLICATION_CREDENTIALS) if available');
  try {
    // Attempt to initialize without an API key so the client uses ADC
    genAI = new GoogleGenerativeAI();
    logger.info('Initialized Gemini client using Application Default Credentials (ADC)');
  } catch (adcError) {
    logger.warn('Failed to initialize Gemini client via ADC:', adcError && adcError.message ? adcError.message : adcError);
    genAI = null;
  }
}

const PDF_TO_MCQ_SYSTEM_PROMPT = `You are an exam-authoring assistant. Given the text delimited by triple backticks, extract clear multiple-choice questions with 4 choices each (unless fewer are warranted). Output only valid JSON array of objects: [{"id":"","stem":"","choices":["","","",""],"correct_index":0,"marks":1,"difficulty":"easy|medium|hard","explanation":""}]. Use neutral language, avoid opinionated content, ensure no PII in questions.`;

const AI_FEEDBACK_PROMPT = `You are an AI tutor. Given the student's attempt data and answer correctness per question, produce a short summary of strengths, top 3 weak areas with actionable tips, and recommended study resources. Output JSON: {"summary":"","weak_topics":[{"topic":"","advice":""}],"recommended_actions":""}.`;

export class GeminiService {
  constructor() {
    this.isAvailable = false;
    if (!genAI) {
      logger.warn('Gemini API not initialized - GEMINI_API_KEY is missing or invalid');
      return;
    }

    // Use gemini-pro or gemini-1.5-pro as gemini-2.5-pro might not be available yet
    const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-pro';
    try {
      this.model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 0.0,
          maxOutputTokens: 2000,
          responseMimeType: 'application/json',
        },
      });
      this.isAvailable = true;
    } catch (error) {
      logger.warn('Failed to create Gemini model:', error.message);
      try {
        // Fallback to gemini-pro if 1.5-pro fails
        this.model = genAI.getGenerativeModel({
          model: 'gemini-pro',
          generationConfig: {
            temperature: 0.0,
            maxOutputTokens: 2000,
          },
        });
        this.isAvailable = true;
      } catch (fallbackError) {
        logger.error('Failed to initialize Gemini with fallback model:', fallbackError.message);
        this.isAvailable = false;
      }
    }
  }

  async generateMCQsFromText(text, maxQuestions = 10) {
    if (!this.isAvailable || !this.model) {
      throw new Error('Gemini API is not configured. Please set GEMINI_API_KEY in backend/.env file. Visit https://makersuite.google.com/app/apikey to get your API key.');
    }

    try {
      const userPrompt = `${PDF_TO_MCQ_SYSTEM_PROMPT}\n\nText:\n\`\`\`${text.substring(0, 30000)}\`\`\`\n\nGenerate ${maxQuestions} questions.`;

      const result = await this.model.generateContent(userPrompt);
      const response = await result.response;
      
      // Handle JSON response
      let jsonText;
      try {
        if (response.responseMimeType === 'application/json') {
          jsonText = response.text();
        } else {
          // Try to extract JSON from markdown or plain text
          const rawText = response.text();
          const jsonMatch = rawText.match(/\[[\s\S]*\]/);
          jsonText = jsonMatch ? jsonMatch[0] : rawText;
        }
      } catch (e) {
        jsonText = response.text();
      }

      let questions = [];
      try {
        questions = JSON.parse(jsonText);
        if (!Array.isArray(questions)) {
          questions = [questions];
        }
      } catch (parseError) {
        logger.error('Failed to parse Gemini response:', parseError);
        logger.error('Raw response:', jsonText);
        throw new Error('Invalid JSON response from AI');
      }

      // Post-processing: sanitize and normalize
      questions = questions.map((q, idx) => ({
        id: q.id || `q_${idx}`,
        stem: this.sanitizeText(q.stem || ''),
        choices: (q.choices || []).slice(0, 6).map((c) => ({
          text: this.sanitizeText(typeof c === 'string' ? c : c.text || ''),
          meta: typeof c === 'object' ? c.meta || '' : '',
        })),
        correctIndex: Math.max(0, Math.min(q.correct_index || 0, (q.choices || []).length - 1)),
        marks: q.marks || 1,
        difficulty: ['easy', 'medium', 'hard'].includes(q.difficulty) ? q.difficulty : 'medium',
        explanation: this.sanitizeText(q.explanation || ''),
      }));

      // Filter out invalid questions
      questions = questions.filter(
        (q) => q.stem && q.choices.length >= 2 && q.correctIndex >= 0 && q.correctIndex < q.choices.length
      );

      return questions;
    } catch (error) {
      // Log full error for debugging (stack and any nested response data)
      logger.error('Gemini MCQ generation error:', error && error.stack ? error.stack : error);
      if (error && error.response) {
        try {
          logger.error('Gemini response body:', JSON.stringify(error.response, null, 2));
        } catch (e) {
          logger.error('Failed to stringify Gemini response object', e);
        }
      }

      // Provide more helpful error messages
      const message = (error && error.message) ? error.message : String(error);
      if (message.includes('API key') || message.includes('API_KEY_INVALID') || message.includes('permission')) {
        throw new Error('Gemini API key or permissions error. Please check GEMINI_API_KEY and project permissions. See https://makersuite.google.com/app/apikey');
      }

      throw new Error(`Failed to generate MCQs: ${message}`);
    }
  }

  async generateFeedback(attemptData, questions) {
    if (!this.isAvailable || !this.model) {
      // Return default feedback if Gemini is not available
      return {
        summary: 'Your quiz attempt has been completed. Review your answers to improve your performance.',
        weak_topics: [],
        improvement_tips: 'Focus on areas where you lost points. Practice more questions on those topics.',
        recommended_actions: 'Continue studying and attempt more quizzes.',
      };
    }

    try {
      // Use answerResults if available, otherwise calculate from answers
      const answerResults = attemptData.answerResults || attemptData.answers.map((answer) => {
        const question = questions.find((q) => q._id.toString() === answer.questionId.toString());
        return {
          questionId: answer.questionId.toString(),
          isCorrect: question && answer.selectedIndex === question.correctIndex,
        };
      });

      const answerSummary = answerResults.map((result) => {
        const question = questions.find((q) => q._id.toString() === result.questionId);
        return {
          question: question?.stem || 'Unknown',
          answer: question?.choices[result.isCorrect ? question.correctIndex : 0]?.text || 'Not answered',
          correct: result.isCorrect,
          topic: question?.topic_tags?.[0] || 'General',
        };
      });

      const correctCount = answerSummary.filter((a) => a.correct).length;
      const totalCount = answerSummary.length;

      const userPrompt = `${AI_FEEDBACK_PROMPT}\n\nAttempt Summary:\n- Total Questions: ${totalCount}\n- Correct: ${correctCount}\n- Score: ${attemptData.score}/${attemptData.maxScore}\n\nAnswer Details:\n${JSON.stringify(answerSummary, null, 2)}\n\nGenerate personalized feedback.`;

      const result = await this.model.generateContent(userPrompt);
      const response = await result.response;
      
      // Handle JSON response
      let jsonText;
      try {
        if (response.responseMimeType === 'application/json') {
          jsonText = response.text();
        } else {
          // Try to extract JSON from markdown or plain text
          const rawText = response.text();
          const jsonMatch = rawText.match(/\{[\s\S]*\}/);
          jsonText = jsonMatch ? jsonMatch[0] : rawText;
        }
      } catch (e) {
        jsonText = response.text();
      }

      let feedback = {};
      try {
        feedback = JSON.parse(jsonText);
      } catch (parseError) {
        logger.error('Failed to parse Gemini feedback response:', parseError);
        logger.error('Raw response:', jsonText);
        feedback = {
          summary: 'Feedback generation completed.',
          weak_topics: [],
          recommended_actions: 'Review your answers and practice more.',
        };
      }

      return {
        summary: feedback.summary || 'Keep practicing!',
        weak_topics: feedback.weak_topics || [],
        improvement_tips: feedback.improvement_tips || feedback.recommended_actions || 'Focus on weak areas.',
        recommended_actions: feedback.recommended_actions || 'Continue studying.',
      };
    } catch (error) {
      logger.error('Gemini feedback generation error:', error);
      
      // Return default feedback if API fails
      if (error.message.includes('API key') || error.message.includes('API_KEY_INVALID')) {
        logger.warn('Gemini API key invalid, using default feedback');
        return {
          summary: 'Your quiz attempt has been completed. Review your answers to improve your performance.',
          weak_topics: [],
          improvement_tips: 'Focus on areas where you lost points. Practice more questions on those topics.',
          recommended_actions: 'Continue studying and attempt more quizzes.',
        };
      }
      
      throw new Error(`Failed to generate feedback: ${error.message}`);
    }
  }

  sanitizeText(text) {
    if (typeof text !== 'string') return '';
    // Remove HTML tags, markdown, and excessive whitespace
    return text
      .replace(/<[^>]*>/g, '')
      .replace(/[*_#`]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 1000);
  }
}

export default new GeminiService();

