import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import { INTERVIEW_STATUS, QUESTION_TYPES, TIME_LIMITS, INTERVIEW_CONFIG } from '../../utils/constants';
import { generateQuestion, evaluateAnswer, generateFinalSummary } from '../../services/openaiService';

// Async thunks - PEHLE HI EXPORT KARDO
export const generateNextQuestion = createAsyncThunk(
  'interview/generateNextQuestion',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { currentInterview } = getState().interview;
      const questionLevel = getQuestionLevel(currentInterview.currentQuestionIndex);
      
      console.log(`Generating ${questionLevel} question #${currentInterview.currentQuestionIndex + 1}`);
      const question = await generateQuestion(questionLevel);
      
      return { 
        question, 
        level: questionLevel,
        questionIndex: currentInterview.currentQuestionIndex 
      };
    } catch (error) {
      console.error('Failed to generate question:', error);
      return rejectWithValue(error.message || 'Failed to generate question');
    }
  }
);

export const evaluateCurrentAnswer = createAsyncThunk(
  'interview/evaluateCurrentAnswer',
  async ({ answer, timeSpent }, { getState, rejectWithValue }) => {
    try {
      const { currentInterview } = getState().interview;
      const currentQuestion = currentInterview.questions[currentInterview.currentQuestionIndex];
      
      if (!currentQuestion) {
        throw new Error('No current question found');
      }

      console.log(`Evaluating ${currentQuestion.level} answer for question ${currentInterview.currentQuestionIndex + 1}`);
      
      const evaluation = await evaluateAnswer(
        currentQuestion.question, 
        answer, 
        currentQuestion.level
      );
      
      return {
        score: evaluation.score,
        feedback: evaluation.feedback,
        questionIndex: currentInterview.currentQuestionIndex,
        timeSpent,
        evaluatedBy: evaluation.evaluatedBy
      };
    } catch (error) {
      console.error('Failed to evaluate answer:', error);
      return rejectWithValue(error.message || 'Failed to evaluate answer');
    }
  }
);

export const generateInterviewSummary = createAsyncThunk(
  'interview/generateInterviewSummary',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { currentInterview } = getState().interview;
      
      if (!currentInterview || !currentInterview.questions.length) {
        throw new Error('No interview data found');
      }

      console.log('Generating final summary for:', currentInterview.candidateInfo.name);
      
      const summary = await generateFinalSummary(
        currentInterview.candidateInfo.name,
        currentInterview.questions.map(q => ({
          score: q.score,
          feedback: q.feedback
        })),
        currentInterview.questions
      );
      
      return summary;
    } catch (error) {
      console.error('Failed to generate summary:', error);
      return rejectWithValue(error.message || 'Failed to generate interview summary');
    }
  }
);

// Helper functions
const getQuestionLevel = (questionIndex) => {
  if (questionIndex < 2) return QUESTION_TYPES.EASY;
  if (questionIndex < 4) return QUESTION_TYPES.MEDIUM;
  return QUESTION_TYPES.HARD;
};

const calculateProgress = (currentIndex, totalQuestions) => {
  return Math.round(((currentIndex) / totalQuestions) * 100);
};

const interviewSlice = createSlice({
  name: 'interview',
  initialState: {
    currentInterview: null,
    isInterviewActive: false,
    isLoading: false,
    error: null,
    timer: {
      timeLeft: 0,
      isRunning: false,
      totalTime: 0,
      questionStartTime: null
    },
    resumeData: null,
    sessionId: null,
    // ✅ NEW FIELDS FOR RESULTS DISPLAY
    interviewResults: null,
    performanceFeedback: null,
    scores: null
  },
  reducers: {
    initializeSession: (state) => {
      state.sessionId = uuidv4();
      state.error = null;
      // ✅ Clear previous results
      state.interviewResults = null;
      state.performanceFeedback = null;
      state.scores = null;
      console.log('Interview session initialized:', state.sessionId);
    },

    setResumeData: (state, action) => {
      state.resumeData = action.payload;
      console.log('Resume data stored');
    },

    startInterview: (state, action) => {
      const { candidateInfo } = action.payload;
      
      if (!candidateInfo.name || !candidateInfo.email || !candidateInfo.phone) {
        state.error = 'Missing required candidate information';
        return;
      }

      state.currentInterview = {
        id: uuidv4(),
        sessionId: state.sessionId,
        candidateInfo: {
          ...candidateInfo,
          joinedAt: new Date().toISOString()
        },
        questions: [],
        currentQuestionIndex: 0,
        status: INTERVIEW_STATUS.IN_PROGRESS,
        startedAt: new Date().toISOString(),
        isCompleted: false,
        totalScore: 0,
        maxPossibleScore: 12,
        summary: null,
        progress: 0,
        resumeData: state.resumeData
      };
      
      state.isInterviewActive = true;
      state.error = null;
      // ✅ Clear any previous results
      state.interviewResults = null;
      state.performanceFeedback = null;
      state.scores = null;
      
      console.log('Interview started for:', candidateInfo.name);
    },

    setCandidateInfo: (state, action) => {
      const { field, value } = action.payload;
      
      if (!state.currentInterview) {
        state.currentInterview = {
          id: uuidv4(),
          candidateInfo: {},
          status: INTERVIEW_STATUS.COLLECTING_INFO,
          questions: [],
          currentQuestionIndex: 0,
          isCompleted: false,
          progress: 0
        };
      }
      
      state.currentInterview.candidateInfo[field] = value;
      console.log(`Updated candidate ${field}:`, value);
    },

    addQuestion: (state, action) => {
      const { question, level, questionIndex } = action.payload;
      const timeLimit = TIME_LIMITS[level];
      
      const questionData = {
        id: uuidv4(),
        question,
        level,
        timeLimit,
        answer: '',
        score: 0,
        feedback: '',
        answeredAt: null,
        timeSpent: 0,
        index: questionIndex,
        generatedAt: new Date().toISOString(),
        evaluatedBy: 'Pending'
      };
      
      if (state.currentInterview.questions.length === questionIndex) {
        state.currentInterview.questions.push(questionData);
      } else {
        state.currentInterview.questions[questionIndex] = questionData;
      }
      
      state.currentInterview.progress = calculateProgress(
        state.currentInterview.currentQuestionIndex + 1, 
        INTERVIEW_CONFIG.TOTAL_QUESTIONS
      );

      console.log(`Added ${level} question #${questionIndex + 1}:`, question.substring(0, 50) + '...');
    },

    submitAnswer: (state, action) => {
      const { answer, timeSpent } = action.payload;
      const currentQuestionIndex = state.currentInterview.currentQuestionIndex;
      const currentQuestion = state.currentInterview.questions[currentQuestionIndex];
      
      if (currentQuestion) {
        currentQuestion.answer = answer.trim();
        currentQuestion.timeSpent = timeSpent || 0;
        currentQuestion.answeredAt = new Date().toISOString();
        
        console.log(`Answer submitted for question #${currentQuestionIndex + 1}, time: ${timeSpent}s`);
      }
    },

    setQuestionScore: (state, action) => {
      const { score, feedback, questionIndex, timeSpent, evaluatedBy } = action.payload;
      const question = state.currentInterview.questions[questionIndex];
      
      if (question) {
        question.score = score;
        question.feedback = feedback;
        question.evaluatedBy = evaluatedBy || 'OpenAI';
        
        if (timeSpent !== undefined) {
          question.timeSpent = timeSpent;
        }
        
        state.currentInterview.totalScore = state.currentInterview.questions
          .filter(q => q.score)
          .reduce((sum, q) => sum + (q.score || 0), 0);
          
        console.log(`Question #${questionIndex + 1} scored: ${score} by ${question.evaluatedBy}, Total: ${state.currentInterview.totalScore}`);
      }
    },

    nextQuestion: (state) => {
      const nextIndex = state.currentInterview.currentQuestionIndex + 1;
      
      if (nextIndex >= INTERVIEW_CONFIG.TOTAL_QUESTIONS) {
        state.currentInterview.status = INTERVIEW_STATUS.COMPLETED;
        state.currentInterview.isCompleted = true;
        state.currentInterview.completedAt = new Date().toISOString();
        state.currentInterview.progress = 100;
        state.isInterviewActive = false;
        
        const totalScore = state.currentInterview.questions.reduce((sum, q) => sum + (q.score || 0), 0);
        state.currentInterview.totalScore = totalScore;
        
        const startTime = new Date(state.currentInterview.startedAt);
        const endTime = new Date();
        state.currentInterview.duration = Math.round((endTime - startTime) / 1000);
        
        console.log('Interview completed. Final score:', totalScore);
      } else {
        state.currentInterview.currentQuestionIndex = nextIndex;
        state.currentInterview.progress = calculateProgress(nextIndex, INTERVIEW_CONFIG.TOTAL_QUESTIONS);
        
        console.log(`Moving to question #${nextIndex + 1}`);
      }
    },

    pauseInterview: (state) => {
      if (state.currentInterview) {
        state.currentInterview.status = INTERVIEW_STATUS.PAUSED;
        state.currentInterview.pausedAt = new Date().toISOString();
      }
      state.isInterviewActive = false;
      state.timer.isRunning = false;
      
      console.log('Interview paused');
    },

    resumeInterview: (state) => {
      if (state.currentInterview) {
        state.currentInterview.status = INTERVIEW_STATUS.IN_PROGRESS;
        state.currentInterview.resumedAt = new Date().toISOString();
      }
      state.isInterviewActive = true;
      
      console.log('Interview resumed');
    },

    startTimer: (state, action) => {
      const timeLimit = action.payload;
      state.timer.timeLeft = timeLimit;
      state.timer.totalTime = timeLimit;
      state.timer.isRunning = true;
      state.timer.questionStartTime = Date.now();
      
      console.log(`Timer started: ${timeLimit}s`);
    },

    tickTimer: (state) => {
      if (state.timer.isRunning && state.timer.timeLeft > 0) {
        state.timer.timeLeft -= 1;
      }
      if (state.timer.timeLeft <= 0) {
        state.timer.isRunning = false;
      }
    },

    stopTimer: (state) => {
      const timeSpent = state.timer.questionStartTime 
        ? Math.round((Date.now() - state.timer.questionStartTime) / 1000)
        : state.timer.totalTime - state.timer.timeLeft;
        
      state.timer.isRunning = false;
      state.timer.timeLeft = 0;
      state.timer.questionStartTime = null;
      
      const currentQuestion = state.currentInterview?.questions[state.currentInterview?.currentQuestionIndex];
      if (currentQuestion && !currentQuestion.timeSpent) {
        currentQuestion.timeSpent = timeSpent;
      }
      
      console.log(`Timer stopped. Time spent: ${timeSpent}s`);
    },

    autoSubmitAnswer: (state) => {
      const currentQuestionIndex = state.currentInterview?.currentQuestionIndex;
      const currentQuestion = state.currentInterview?.questions[currentQuestionIndex];
      
      if (currentQuestion && !currentQuestion.answeredAt) {
        const timeSpent = state.timer.totalTime;
        currentQuestion.answer = currentQuestion.answer || '';
        currentQuestion.timeSpent = timeSpent;
        currentQuestion.answeredAt = new Date().toISOString();
        currentQuestion.autoSubmitted = true;
        
        console.log(`Auto-submitted question #${currentQuestionIndex + 1} due to timeout`);
      }
      
      state.timer.isRunning = false;
      state.timer.timeLeft = 0;
    },

    setInterviewSummary: (state, action) => {
      if (state.currentInterview) {
        state.currentInterview.summary = action.payload;
        console.log('Interview summary generated');
      }
    },

    // ✅ NEW ACTION: Set results for interviewee display
    setInterviewResults: (state, action) => {
      const summary = action.payload;
      
      // Store in multiple formats for compatibility
      state.interviewResults = summary;
      state.performanceFeedback = summary.overallAssessment || summary.feedback;
      state.scores = {
        overall: summary.finalScore || 0,
        percentage: summary.percentage || 0
      };
      
      // Also store in currentInterview for backup
      if (state.currentInterview) {
        state.currentInterview.summary = summary;
      }
      
      console.log('✅ Interview results set for interviewee display');
    },

    clearCurrentInterview: (state) => {
      state.currentInterview = null;
      state.isInterviewActive = false;
      state.timer = { 
        timeLeft: 0, 
        isRunning: false, 
        totalTime: 0, 
        questionStartTime: null 
      };
      // ✅ Clear results
      state.interviewResults = null;
      state.performanceFeedback = null;
      state.scores = null;
      console.log('Interview session cleared');
    },

    setError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
      console.error('Interview error:', action.payload);
    },

    clearError: (state) => {
      state.error = null;
    },

    restoreSession: (state, action) => {
      const { interview, timer } = action.payload;
      state.currentInterview = interview;
      state.isInterviewActive = interview.status === INTERVIEW_STATUS.IN_PROGRESS;
      if (timer) {
        state.timer = timer;
      }
      console.log('Session restored for:', interview.candidateInfo.name);
    }
  },
  
  extraReducers: (builder) => {
    builder
      .addCase(generateNextQuestion.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(generateNextQuestion.fulfilled, (state, action) => {
        state.isLoading = false;
        const { question, level, questionIndex } = action.payload;
        interviewSlice.caseReducers.addQuestion(state, { 
          payload: { question, level, questionIndex } 
        });
      })
      .addCase(generateNextQuestion.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to generate question';
      })
      
      .addCase(evaluateCurrentAnswer.pending, (state) => {
        state.isLoading = true;
        const currentQuestion = state.currentInterview.questions[state.currentInterview.currentQuestionIndex];
        if (currentQuestion) {
          currentQuestion.isEvaluating = true;
        }
      })
      .addCase(evaluateCurrentAnswer.fulfilled, (state, action) => {
        state.isLoading = false;
        const { score, feedback, questionIndex, timeSpent, evaluatedBy } = action.payload;
        
        const question = state.currentInterview.questions[questionIndex];
        if (question) {
          question.isEvaluating = false;
        }
        
        interviewSlice.caseReducers.setQuestionScore(state, { 
          payload: { score, feedback, questionIndex, timeSpent, evaluatedBy } 
        });
      })
      .addCase(evaluateCurrentAnswer.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to evaluate answer';
        
        const currentQuestion = state.currentInterview.questions[state.currentInterview.currentQuestionIndex];
        if (currentQuestion) {
          currentQuestion.isEvaluating = false;
          currentQuestion.evaluatedBy = 'Error';
        }
      })
      
      .addCase(generateInterviewSummary.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(generateInterviewSummary.fulfilled, (state, action) => {
        state.isLoading = false;
        const summary = action.payload;
        
        // ✅ MAIN FIX: Store results in both places
        state.currentInterview.summary = summary;
        
        // Store for interviewee display
        state.interviewResults = summary;
        state.performanceFeedback = summary.overallAssessment || summary.feedback;
        state.scores = {
          overall: summary.finalScore || 0,
          percentage: summary.percentage || 0
        };
        
        console.log('✅ Final summary generated by OpenAI and stored for interviewee');
      })
      .addCase(generateInterviewSummary.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to generate summary';
      });
  }
});

// ✅ ADD NEW ACTION TO EXPORTS
export const {
  initializeSession,
  setResumeData,
  startInterview,
  setCandidateInfo,
  addQuestion,
  submitAnswer,
  setQuestionScore,
  nextQuestion,
  pauseInterview,
  resumeInterview,
  startTimer,
  tickTimer,
  stopTimer,
  autoSubmitAnswer,
  setInterviewSummary,
  setInterviewResults, // ✅ NEW EXPORT
  clearCurrentInterview,
  setError,
  clearError,
  restoreSession
} = interviewSlice.actions;

export default interviewSlice.reducer;