export const QUESTION_TYPES = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard'
};

export const TIME_LIMITS = {
  [QUESTION_TYPES.EASY]: 20, // seconds
  [QUESTION_TYPES.MEDIUM]: 60,
  [QUESTION_TYPES.HARD]: 120
};

export const INTERVIEW_CONFIG = {
  TOTAL_QUESTIONS: 6,
  QUESTIONS_PER_LEVEL: 2,
  ROLE: 'Full Stack Developer (React/Node.js)'
};

export const INTERVIEW_STATUS = {
  NOT_STARTED: 'not_started',
  COLLECTING_INFO: 'collecting_info',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  PAUSED: 'paused'
};

export const REQUIRED_FIELDS = ['name', 'email', 'phone'];

export const FILE_TYPES = {
  PDF: 'application/pdf',
  DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
};

export const SCORING_WEIGHTS = {
  [QUESTION_TYPES.EASY]: 1,
  [QUESTION_TYPES.MEDIUM]: 2,
  [QUESTION_TYPES.HARD]: 3
};

export const MAX_SCORE = 
  (SCORING_WEIGHTS[QUESTION_TYPES.EASY] * INTERVIEW_CONFIG.QUESTIONS_PER_LEVEL) +
  (SCORING_WEIGHTS[QUESTION_TYPES.MEDIUM] * INTERVIEW_CONFIG.QUESTIONS_PER_LEVEL) +
  (SCORING_WEIGHTS[QUESTION_TYPES.HARD] * INTERVIEW_CONFIG.QUESTIONS_PER_LEVEL);

export const SAMPLE_QUESTIONS = {
  [QUESTION_TYPES.EASY]: [
    "What is the difference between var, let, and const in JavaScript?",
    "Explain what React components are and how they work.",
    "What is the purpose of package.json in a Node.js project?",
    "How do you handle events in React?",
    "What is the difference between null and undefined in JavaScript?",
    "What are React props and how do you use them?",
    "Explain the concept of state in React.",
    "What is JSX in React?",
    "How do you create a simple Express.js server?",
    "What is npm and what does it do?"
  ],
  [QUESTION_TYPES.MEDIUM]: [
    "Explain React hooks and give examples of useState and useEffect.",
    "How would you implement user authentication in a MERN stack application?",
    "What are the differences between REST and GraphQL APIs?",
    "How do you handle state management in a large React application?",
    "Explain middleware in Express.js with examples.",
    "What is the virtual DOM and why is it useful?",
    "How do you handle asynchronous operations in JavaScript?",
    "Explain the concept of closure in JavaScript.",
    "What are the different ways to style components in React?",
    "How do you implement routing in a React application?"
  ],
  [QUESTION_TYPES.HARD]: [
    "How would you optimize a React application for better performance?",
    "Design a scalable Node.js API architecture for handling millions of requests.",
    "Explain how you would implement real-time features using WebSockets.",
    "How would you handle database optimization in a Node.js application?",
    "Describe how you would implement a microservices architecture.",
    "How do you handle memory leaks in Node.js applications?",
    "Explain server-side rendering (SSR) and its benefits.",
    "How would you implement a caching strategy for a web application?",
    "Describe your approach to implementing security in a full-stack application.",
    "How would you design a system to handle high concurrent users?"
  ]
};

export const PERFORMANCE_THRESHOLDS = {
  EXCELLENT: 80,
  GOOD: 60,
  AVERAGE: 40,
  POOR: 0
};

export const API_ENDPOINTS = {
  OPENAI_CHAT: 'https://api.openai.com/v1/chat/completions',
  OPENAI_MODELS: 'https://api.openai.com/v1/models'
};

export const LOCAL_STORAGE_KEYS = {
  INTERVIEW_DATA: 'ai-interview-data',
  CANDIDATE_DATA: 'ai-candidate-data',
  APP_SETTINGS: 'ai-app-settings'
};

export const ERROR_MESSAGES = {
  FILE_TOO_LARGE: 'File size must be less than 5MB',
  INVALID_FILE_TYPE: 'Only PDF and DOCX files are allowed',
  MISSING_API_KEY: 'OpenAI API key is required',
  NETWORK_ERROR: 'Network error. Please check your connection',
  PARSING_ERROR: 'Failed to parse resume. Please try a different file',
  GENERAL_ERROR: 'Something went wrong. Please try again'
};

export const SUCCESS_MESSAGES = {
  RESUME_UPLOADED: 'Resume uploaded successfully!',
  INTERVIEW_STARTED: 'Interview started successfully!',
  ANSWER_SUBMITTED: 'Answer submitted successfully!',
  INTERVIEW_COMPLETED: 'Interview completed successfully!',
  DATA_SAVED: 'Data saved successfully!'
};