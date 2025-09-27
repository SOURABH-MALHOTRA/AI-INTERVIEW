// ============ SRC/SERVICES/APICONFIG.JS ============
import axios from 'axios';

// API Configuration
export const API_CONFIG = {
  // OpenAI Configuration
  OPENAI: {
    BASE_URL: 'https://api.openai.com/v1',
    ENDPOINTS: {
      CHAT_COMPLETIONS: '/chat/completions',
      MODELS: '/models',
      COMPLETIONS: '/completions'
    },
    MODELS: {
      GPT_3_5_TURBO: 'gpt-3.5-turbo',
      GPT_4: 'gpt-4',
      GPT_4_TURBO: 'gpt-4-turbo-preview'
    },
    MAX_TOKENS: {
      QUESTION_GENERATION: 150,
      ANSWER_EVALUATION: 200,
      SUMMARY_GENERATION: 300
    },
    TEMPERATURE: {
      QUESTION_GENERATION: 0.7,
      ANSWER_EVALUATION: 0.3,
      SUMMARY_GENERATION: 0.4
    }
  },

  // Request timeouts (in milliseconds)
  TIMEOUTS: {
    DEFAULT: 30000, // 30 seconds
    FILE_UPLOAD: 60000, // 60 seconds
    AI_REQUEST: 45000 // 45 seconds
  },

  // Rate limiting
  RATE_LIMITS: {
    MAX_REQUESTS_PER_MINUTE: 60,
    MAX_REQUESTS_PER_HOUR: 1000,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000 // 1 second
  }
};

// Get API key from environment
const getApiKey = () => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey || apiKey === 'your-openai-api-key-here') {
    console.warn('OpenAI API key not configured. Using fallback mode.');
    return null;
  }
  return apiKey;
};

// Create axios instance for OpenAI API
export const createOpenAIClient = () => {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    // Return mock client for fallback mode
    return createMockClient();
  }

  const client = axios.create({
    baseURL: API_CONFIG.OPENAI.BASE_URL,
    timeout: API_CONFIG.TIMEOUTS.AI_REQUEST,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'AI-Interview-Assistant/1.0'
    }
  });

  // Request interceptor for logging and rate limiting
  client.interceptors.request.use(
    (config) => {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
      
      // Add timestamp for rate limiting
      config.metadata = { startTime: new Date() };
      
      return config;
    },
    (error) => {
      console.error('❌ API Request Error:', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor for error handling and logging
  client.interceptors.response.use(
    (response) => {
      const duration = new Date() - response.config.metadata.startTime;
      console.log(`✅ API Response: ${response.status} (${duration}ms)`);
      return response;
    },
    async (error) => {
      console.error('❌ API Response Error:', error.response?.data || error.message);
      
      // Handle different types of errors
      if (error.response?.status === 429) {
        // Rate limit exceeded
        console.warn('⚠️ Rate limit exceeded. Implementing retry logic...');
        return handleRateLimitError(error);
      }
      
      if (error.response?.status === 401) {
        // Invalid API key
        console.error('🔑 Invalid API key. Please check your OpenAI API key.');
        throw new Error('Invalid API key. Please check your OpenAI configuration.');
      }
      
      if (error.response?.status >= 500) {
        // Server error
        console.error('🔥 Server error. OpenAI service might be down.');
        throw new Error('OpenAI service temporarily unavailable. Using fallback mode.');
      }
      
      return Promise.reject(error);
    }
  );

  return client;
};

// Create mock client for fallback mode
const createMockClient = () => {
  console.log('🔄 Creating mock API client (fallback mode)');
  
  return {
    post: async (url, data) => {
      console.log('🤖 Mock API call:', url, data);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Return mock response based on the request
      if (url.includes('chat/completions')) {
        return {
          data: {
            choices: [{
              message: {
                content: 'Mock response - API key not configured'
              }
            }]
          }
        };
      }
      
      throw new Error('API key not configured');
    },
    
    get: async (url) => {
      console.log('🤖 Mock API GET call:', url);
      await new Promise(resolve => setTimeout(resolve, 500));
      throw new Error('API key not configured');
    }
  };
};

// Handle rate limit errors with exponential backoff
const handleRateLimitError = async (error) => {
  const maxRetries = API_CONFIG.RATE_LIMITS.RETRY_ATTEMPTS;
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    const delay = API_CONFIG.RATE_LIMITS.RETRY_DELAY * Math.pow(2, retryCount);
    console.log(`⏳ Retrying in ${delay}ms... (Attempt ${retryCount + 1}/${maxRetries})`);
    
    await new Promise(resolve => setTimeout(resolve, delay));
    
    try {
      // Retry the original request
      const response = await axios.request(error.config);
      console.log('✅ Retry successful');
      return response;
    } catch (retryError) {
      retryCount++;
      if (retryCount >= maxRetries) {
        console.error('❌ Max retries exceeded');
        throw new Error('Rate limit exceeded. Please try again later.');
      }
    }
  }
};

// Validate API configuration
export const validateApiConfig = () => {
  const apiKey = getApiKey();
  
  const validation = {
    isValid: false,
    errors: [],
    warnings: []
  };

  // Check API key
  if (!apiKey) {
    validation.warnings.push('OpenAI API key not configured. Fallback mode will be used.');
  } else {
    // Validate API key format
    if (!apiKey.startsWith('sk-')) {
      validation.errors.push('Invalid OpenAI API key format. It should start with "sk-"');
    } else if (apiKey.length < 40) {
      validation.errors.push('OpenAI API key appears to be too short');
    } else {
      validation.isValid = true;
    }
  }

  // Check environment variables
  const requiredEnvVars = ['VITE_OPENAI_API_KEY'];
  const missingEnvVars = requiredEnvVars.filter(envVar => !import.meta.env[envVar]);
  
  if (missingEnvVars.length > 0) {
    validation.warnings.push(`Missing environment variables: ${missingEnvVars.join(', ')}`);
  }

  return validation;
};

// Test API connection
export const testApiConnection = async () => {
  try {
    const client = createOpenAIClient();
    const apiKey = getApiKey();
    
    if (!apiKey) {
      return {
        success: false,
        message: 'API key not configured. Application will run in fallback mode.',
        fallbackMode: true
      };
    }

    console.log('🔍 Testing OpenAI API connection...');
    
    const response = await client.post(API_CONFIG.OPENAI.ENDPOINTS.CHAT_COMPLETIONS, {
      model: API_CONFIG.OPENAI.MODELS.GPT_3_5_TURBO,
      messages: [
        {
          role: 'user',
          content: 'Test connection'
        }
      ],
      max_tokens: 5
    });

    console.log('✅ API connection successful');
    
    return {
      success: true,
      message: 'OpenAI API connection successful',
      model: response.data.model,
      fallbackMode: false
    };
  } catch (error) {
    console.error('❌ API connection failed:', error.message);
    
    return {
      success: false,
      message: `API connection failed: ${error.message}`,
      error: error.response?.data || error.message,
      fallbackMode: true
    };
  }
};

// Get available models
export const getAvailableModels = async () => {
  try {
    const client = createOpenAIClient();
    const response = await client.get(API_CONFIG.OPENAI.ENDPOINTS.MODELS);
    
    return {
      success: true,
      models: response.data.data
    };
  } catch (error) {
    console.error('Failed to fetch models:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Request builder helper
export const buildOpenAIRequest = (type, options = {}) => {
  const baseRequest = {
    model: API_CONFIG.OPENAI.MODELS.GPT_3_5_TURBO,
    max_tokens: API_CONFIG.OPENAI.MAX_TOKENS.DEFAULT,
    temperature: API_CONFIG.OPENAI.TEMPERATURE.DEFAULT,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    ...options
  };

  switch (type) {
    case 'question_generation':
      return {
        ...baseRequest,
        max_tokens: API_CONFIG.OPENAI.MAX_TOKENS.QUESTION_GENERATION,
        temperature: API_CONFIG.OPENAI.TEMPERATURE.QUESTION_GENERATION,
        frequency_penalty: 0.5,
        presence_penalty: 0.3
      };
      
    case 'answer_evaluation':
      return {
        ...baseRequest,
        max_tokens: API_CONFIG.OPENAI.MAX_TOKENS.ANSWER_EVALUATION,
        temperature: API_CONFIG.OPENAI.TEMPERATURE.ANSWER_EVALUATION
      };
      
    case 'summary_generation':
      return {
        ...baseRequest,
        max_tokens: API_CONFIG.OPENAI.MAX_TOKENS.SUMMARY_GENERATION,
        temperature: API_CONFIG.OPENAI.TEMPERATURE.SUMMARY_GENERATION
      };
      
    default:
      return baseRequest;
  }
};

// Export the configured client
export const openAIClient = createOpenAIClient();

// Rate limiter utility
class RateLimiter {
  constructor() {
    this.requests = [];
  }
  
  async checkRateLimit() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    // Remove requests older than 1 minute
    this.requests = this.requests.filter(timestamp => timestamp > oneMinuteAgo);
    
    // Check if we've exceeded the rate limit
    if (this.requests.length >= API_CONFIG.RATE_LIMITS.MAX_REQUESTS_PER_MINUTE) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = 60000 - (now - oldestRequest);
      
      console.warn(`⚠️ Rate limit reached. Waiting ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    // Add current request
    this.requests.push(now);
  }
}

export const rateLimiter = new RateLimiter();

// Default export
export default {
  API_CONFIG,
  createOpenAIClient,
  validateApiConfig,
  testApiConnection,
  getAvailableModels,
  buildOpenAIRequest,
  openAIClient,
  rateLimiter
};