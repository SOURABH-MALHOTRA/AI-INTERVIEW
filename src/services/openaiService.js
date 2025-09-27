import axios from 'axios';
import { QUESTION_TYPES, SAMPLE_QUESTIONS, SCORING_WEIGHTS } from '../utils/constants';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

const openaiClient = axios.create({
  baseURL: OPENAI_API_URL,
  timeout: 30000,
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
  },
});

// ----------------------- QUESTION GENERATION -----------------------
export const generateQuestion = async (level, previousQuestions = []) => {
  console.log(`🔄 Generating ${level} question...`);
  
  try {
    if (!API_KEY || API_KEY === 'your-openai-api-key-here') {
      console.log('⚠️ Using sample question (No API Key)');
      return getSampleQuestion(level, previousQuestions);
    }

    const prompt = `
You are a technical interviewer for Full Stack Developer (React/Node.js) position.

Generate a ${level} level technical interview question with these guidelines:
- Focus on practical, real-world scenarios
- Test specific React/Node.js concepts appropriate for ${level} level
- Make it clear and concise
- Ensure it can be answered in 2-3 minutes

Difficulty focus:
- EASY: Basic concepts, syntax, fundamentals
- MEDIUM: Application, problem-solving, best practices  
- HARD: Complex scenarios, system design, optimization

Return ONLY the question text without any numbering, labels, or explanations.

Example formats:
- "Explain how React hooks work and when to use useState vs useEffect"
- "How would you optimize a slow React component?"
- "Describe your approach to building a REST API in Node.js"

Generate a ${level} question:`;

    const response = await openaiClient.post('', {
      model: 'gpt-3.5-turbo',
      messages: [
        { 
          role: 'system', 
          content: 'You are an experienced technical interviewer. Generate clear, practical interview questions. Return only the question text.' 
        },
        { role: 'user', content: prompt }
      ],
      max_tokens: 150,
      temperature: 0.7,
    });

    const question = response?.data?.choices?.[0]?.message?.content?.trim();
    
    if (!question) {
      throw new Error('Empty response from OpenAI');
    }

    console.log(`✅ Generated ${level} question:`, question.substring(0, 100) + '...');
    return question;

  } catch (error) {
    console.error('❌ Question generation error:', error?.response?.data || error.message);
    console.log('🔄 Using fallback sample question');
    return getSampleQuestion(level, previousQuestions);
  }
};

// ----------------------- ENHANCED ANSWER EVALUATION -----------------------
export const evaluateAnswer = async (question, answer = '', level) => {
  console.log('🔍 Evaluating Answer:', { 
    question: question.substring(0, 100), 
    answer: answer.substring(0, 200), 
    level 
  });

  // Handle empty or very short answers
  if (!answer || answer.trim().length < 5) {
    return {
      score: 0,
      feedback: "Answer is too short or empty. Please provide a more detailed technical explanation.",
      evaluatedBy: 'System'
    };
  }

  try {
    const maxScore = SCORING_WEIGHTS[level] || 3;

    // Enhanced prompt for better evaluation
    const prompt = `
You are a technical interviewer evaluating a candidate's answer for a Full Stack Developer (React/Node.js) position.

QUESTION (${level} level): "${question}"
CANDIDATE'S ANSWER: "${answer}"

Evaluate this answer based on:
1. Technical accuracy and correctness (0-${maxScore} points)
2. Completeness and depth of explanation (0-${maxScore} points) 
3. Clarity and structure (0-${maxScore} points)
4. Relevance to the question asked (0-${maxScore} points)

Scoring Guidelines:
- 0: No answer/Completely incorrect
- 1: Basic understanding with major gaps
- 2: Good understanding with minor issues  
- 3: Excellent, comprehensive answer

For ${level} level questions, expect:
- EASY: Basic concepts should be correct
- MEDIUM: Practical application understanding
- HARD: Advanced concepts and problem-solving

Provide a score from 0 to ${maxScore} and constructive technical feedback.

IMPORTANT: Return ONLY valid JSON in this exact format:
{
  "score": ${maxScore},
  "feedback": "Your specific technical feedback here"
}

Do not add any extra text, explanations, or markdown formatting. Only JSON.`;

    const response = await openaiClient.post('', {
      model: 'gpt-3.5-turbo',
      messages: [
        { 
          role: 'system', 
          content: 'You are a strict but fair technical interviewer. Always return valid JSON without any additional text. Be specific in your technical feedback.' 
        },
        { role: 'user', content: prompt }
      ],
      max_tokens: 350,
      temperature: 0.3,
    });

    const rawResponse = response?.data?.choices?.[0]?.message?.content?.trim();
    console.log('📨 Raw OpenAI Response:', rawResponse);

    if (!rawResponse) {
      throw new Error('Empty response from OpenAI');
    }

    // Clean the response - remove markdown code blocks
    let cleanedResponse = rawResponse.replace(/```json\n?|\n?```/g, '').trim();
    
    let parsedResult;
    try {
      parsedResult = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('❌ JSON Parse Error:', parseError);
      // Try to extract JSON using regex as fallback
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Invalid JSON format from OpenAI');
      }
    }

    // Validate and normalize score
    let score = Number(parsedResult.score);
    if (isNaN(score) || score < 0) {
      console.warn('⚠️ Invalid score, setting to 0');
      score = 0;
    } else if (score > maxScore) {
      console.warn(`⚠️ Score ${score} exceeds max ${maxScore}, normalizing`);
      score = maxScore;
    }

    // Round to 1 decimal place
    score = Math.round(score * 10) / 10;

    const feedback = parsedResult.feedback || "No specific feedback provided. The answer was evaluated but no detailed feedback was generated.";

    console.log('✅ Evaluation Result:', { score, feedback, maxScore });

    return {
      score,
      feedback,
      evaluatedBy: 'OpenAI GPT-3.5'
    };

  } catch (error) {
    console.error('❌ OpenAI Evaluation Error:', error?.response?.data || error.message || error);
    console.log('🔄 Using intelligent fallback evaluation');
    return getIntelligentFallbackEvaluation(answer, level, question);
  }
};

// ----------------------- COMPREHENSIVE FINAL SUMMARY -----------------------
export const generateFinalSummary = async (candidateName, allEvaluations, questions) => {
  console.log('📊 Generating final summary for:', candidateName);
  
  try {
    if (!API_KEY || API_KEY === 'your-openai-api-key-here') {
      console.log('⚠️ Using sample summary (No API Key)');
      return getEnhancedSampleSummary(candidateName, allEvaluations);
    }

    // Prepare evaluation data for OpenAI
    const evaluationData = allEvaluations.map((evalItem, index) => {
      const question = questions[index]?.question || `Question ${index + 1}`;
      const level = questions[index]?.level || 'Unknown';
      return {
        questionNumber: index + 1,
        level,
        question: question.substring(0, 200), // Limit length
        score: evalItem.score,
        feedback: evalItem.feedback
      };
    });

    const totalScore = allEvaluations.reduce((sum, evalItem) => sum + evalItem.score, 0);
    const maxPossibleScore = allEvaluations.length * 3;
    const percentage = Math.round((totalScore / maxPossibleScore) * 100);

    const prompt = `
You are a senior technical hiring manager creating a final interview summary.

CANDIDATE: ${candidateName}
INTERVIEW RESULTS:
${JSON.stringify(evaluationData, null, 2)}

Overall Performance: ${totalScore}/${maxPossibleScore} (${percentage}%)

Please provide a comprehensive evaluation with:

STRENGTHS: Identify 3-4 key technical strengths based on their answers
IMPROVEMENTS: Suggest 3-4 specific areas for technical improvement
RECOMMENDATION: One of: "Strong Yes", "Yes", "No", "Strong No"
DETAILED_SUMMARY: A paragraph summarizing overall performance and potential

Be specific and reference their actual answers where possible.

Return ONLY JSON in this exact format:
{
  "finalScore": ${totalScore},
  "overallAssessment": "Brief overall assessment",
  "strengths": ["strength1", "strength2", "strength3"],
  "improvements": ["improvement1", "improvement2", "improvement3"],
  "recommendation": "Strong Yes/Yes/No/Strong No",
  "detailedSummary": "Comprehensive summary paragraph here"
}`;

    const response = await openaiClient.post('', {
      model: 'gpt-3.5-turbo',
      messages: [
        { 
          role: 'system', 
          content: 'You are an experienced technical hiring manager. Provide honest, constructive, and specific feedback. Always return valid JSON.' 
        },
        { role: 'user', content: prompt }
      ],
      max_tokens: 600,
      temperature: 0.5,
    });

    const rawSummary = response?.data?.choices?.[0]?.message?.content?.trim();
    console.log('📨 Raw Summary Response:', rawSummary);
    
    if (!rawSummary) {
      throw new Error('Empty summary response');
    }

    try {
      // Clean and parse JSON
      const cleanedSummary = rawSummary.replace(/```json\n?|\n?```/g, '').trim();
      const summaryData = JSON.parse(cleanedSummary);
      
      // Validate required fields
      if (!summaryData.strengths || !summaryData.improvements) {
        throw new Error('Invalid summary format');
      }

      console.log('✅ Final summary generated successfully');
      
      return {
        ...summaryData,
        maxPossibleScore,
        percentage,
        generatedBy: 'OpenAI GPT-3.5',
        generatedAt: new Date().toISOString()
      };
    } catch (parseError) {
      console.error('❌ Summary JSON parse error:', parseError);
      throw new Error('Failed to parse summary response');
    }

  } catch (error) {
    console.error('❌ Final summary error:', error?.response?.data || error.message || error);
    console.log('🔄 Using enhanced sample summary');
    return getEnhancedSampleSummary(candidateName, allEvaluations);
  }
};

// ----------------------- INTELLIGENT FALLBACK FUNCTIONS -----------------------
const getSampleQuestion = (level, previousQuestions = []) => {
  const availableQuestions = SAMPLE_QUESTIONS[level]?.filter(q => !previousQuestions.includes(q)) || [];
  
  if (availableQuestions.length === 0) {
    // If all sample questions used, return a random one
    return SAMPLE_QUESTIONS[level]?.[0] || 'Tell me about your experience with React and Node.js.';
  }
  
  const randomQuestion = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
  console.log(`📝 Using sample ${level} question:`, randomQuestion.substring(0, 80) + '...');
  return randomQuestion;
};

const getIntelligentFallbackEvaluation = (answer, level, question) => {
  console.log('🔄 Using intelligent fallback evaluation');
  
  const maxScore = SCORING_WEIGHTS[level] || 3;
  const answerLength = answer.trim().length;
  const lowerAnswer = answer.toLowerCase();

  // Technical keywords for different levels
  const reactKeywords = ['react', 'component', 'hook', 'state', 'props', 'jsx', 'virtual dom'];
  const nodeKeywords = ['node', 'express', 'api', 'rest', 'middleware', 'database', 'async'];
  const generalKeywords = ['javascript', 'function', 'object', 'array', 'promise', 'async'];
  
  // Count keyword matches
  const allKeywords = [...reactKeywords, ...nodeKeywords, ...generalKeywords];
  const keywordMatches = allKeywords.filter(keyword => lowerAnswer.includes(keyword)).length;
  
  // Calculate base score based on answer length and keywords
  let baseScore = 0;
  
  if (answerLength < 20) {
    baseScore = 0.5;
  } else if (answerLength < 80) {
    baseScore = 1 + (keywordMatches * 0.2);
  } else if (answerLength < 200) {
    baseScore = 1.5 + (keywordMatches * 0.3);
  } else {
    baseScore = 2 + (keywordMatches * 0.2);
  }
  
  // Adjust for question level
  let levelMultiplier = 1;
  if (level === QUESTION_TYPES.HARD) levelMultiplier = 0.8; // Harder to score high on hard questions
  if (level === QUESTION_TYPES.EASY) levelMultiplier = 1.2; // Easier to score high on easy questions
  
  let finalScore = Math.min(baseScore * levelMultiplier, maxScore);
  finalScore = Math.round(finalScore * 10) / 10; // Round to 1 decimal

  // Generate intelligent feedback
  let feedback = '';
  if (finalScore < 1) {
    feedback = "Answer is very brief. Try to provide more technical details and examples.";
  } else if (finalScore < 2) {
    feedback = "Basic understanding shown. Consider expanding with specific examples and technical depth.";
  } else {
    feedback = "Good response with relevant technical concepts. Well structured and informative.";
  }

  // Add specific suggestions based on keywords
  if (keywordMatches < 2) {
    feedback += " Include more specific technical terms related to React/Node.js.";
  }

  return {
    score: finalScore,
    feedback: feedback + " [Fallback Evaluation]",
    evaluatedBy: 'Intelligent Fallback System'
  };
};

const getEnhancedSampleSummary = (candidateName, evaluations) => {
  console.log('📝 Using enhanced sample summary');
  
  const totalScore = evaluations.reduce((sum, evalItem) => sum + evalItem.score, 0);
  const maxScore = evaluations.length * 3;
  const percentage = Math.round((totalScore / maxScore) * 100);

  // Analyze performance patterns
  const highScores = evaluations.filter(e => e.score >= 2).length;
  const lowScores = evaluations.filter(e => e.score < 1).length;
  
  let strengths = [];
  let improvements = [];
  
  if (highScores >= evaluations.length * 0.6) { // 60%+ high scores
    strengths = ["Strong technical foundation", "Good problem-solving skills", "Clear communication"];
    improvements = ["Continue deepening advanced concepts", "Practice system design questions"];
  } else if (highScores >= evaluations.length * 0.3) { // 30%+ high scores
    strengths = ["Basic concepts understood", "Some practical knowledge demonstrated"];
    improvements = ["Need more depth in technical explanations", "Practice implementation details"];
  } else {
    strengths = ["Willingness to attempt answers"];
    improvements = ["Fundamental concepts need work", "More practical experience required", "Technical communication skills"];
  }

  let recommendation = "Yes";
  if (percentage >= 80) recommendation = "Strong Yes";
  else if (percentage >= 60) recommendation = "Yes";
  else if (percentage >= 40) recommendation = "No";
  else recommendation = "Strong No";

  return {
    finalScore: totalScore,
    overallAssessment: `${candidateName} scored ${percentage}% overall, demonstrating ${highScores}/${evaluations.length} strong answers.`,
    strengths,
    improvements,
    recommendation,
    detailedSummary: `The candidate showed ${percentage}% proficiency across ${evaluations.length} technical questions. ${highScores} answers were strong, while ${lowScores} need significant improvement.`,
    maxPossibleScore: maxScore,
    percentage,
    generatedBy: 'Enhanced Sample System',
    generatedAt: new Date().toISOString()
  };
};

// ----------------------- HELPER FUNCTIONS -----------------------
export const checkAPIKey = () => {
  return API_KEY && API_KEY !== 'your-openai-api-key-here';
};

export const getAPIStatus = async () => {
  try {
    if (!checkAPIKey()) {
      return { valid: false, reason: 'No API key configured' };
    }
    
    // Simple test request to check API connectivity
    const response = await openaiClient.post('', {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Say "OK"' }],
      max_tokens: 5,
    });
    
    return { valid: true, model: response.data.model };
  } catch (error) {
    return { valid: false, reason: error.message };
  }
};