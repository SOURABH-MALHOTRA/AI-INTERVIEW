export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number format
 */
export const isValidPhone = (phone) => {
  // Support various phone formats
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  const cleanPhone = phone.replace(/[\s\-\(\)\.]/g, '');
  return phoneRegex.test(cleanPhone) && cleanPhone.length >= 10;
};

/**
 * Validate name format
 */
export const isValidName = (name) => {
  if (!name || typeof name !== 'string') return false;
  const trimmedName = name.trim();
  return trimmedName.length >= 2 && trimmedName.length <= 100;
};

/**
 * Validate file upload
 */
export const validateFileUpload = (file, maxSizeMB = 5) => {
  const errors = [];
  
  // Check file type
  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (!allowedTypes.includes(file.type)) {
    errors.push('Only PDF and DOCX files are allowed');
  }
  
  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    errors.push(`File size must be less than ${maxSizeMB}MB`);
  }
  
  // Check if file is not empty
  if (file.size === 0) {
    errors.push('File cannot be empty');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate candidate information
 */
export const validateCandidateInfo = (candidateInfo) => {
  const errors = {};
  
  if (!isValidName(candidateInfo.name)) {
    errors.name = 'Please enter a valid name (2-100 characters)';
  }
  
  if (!isValidEmail(candidateInfo.email)) {
    errors.email = 'Please enter a valid email address';
  }
  
  if (!isValidPhone(candidateInfo.phone)) {
    errors.phone = 'Please enter a valid phone number';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Sanitize user input
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000); // Limit length
};

/**
 * Validate interview answer
 */
export const validateAnswer = (answer, minLength = 0, maxLength = 5000) => {
  if (!answer || typeof answer !== 'string') {
    return {
      isValid: minLength === 0,
      error: minLength > 0 ? 'Answer is required' : null
    };
  }
  
  const trimmedAnswer = answer.trim();
  
  if (trimmedAnswer.length < minLength) {
    return {
      isValid: false,
      error: `Answer must be at least ${minLength} characters long`
    };
  }
  
  if (trimmedAnswer.length > maxLength) {
    return {
      isValid: false,
      error: `Answer must be less than ${maxLength} characters long`
    };
  }
  
  return {
    isValid: true,
    error: null
  };
};

/**
 * Validate OpenAI API key format
 */
export const validateApiKey = (apiKey) => {
  if (!apiKey || typeof apiKey !== 'string') {
    return { isValid: false, error: 'API key is required' };
  }
  
  if (!apiKey.startsWith('sk-')) {
    return { isValid: false, error: 'Invalid API key format' };
  }
  
  if (apiKey.length < 40) {
    return { isValid: false, error: 'API key appears to be too short' };
  }
  
  return { isValid: true, error: null };
};

/**
 * Validate form data
 */
export const validateForm = (formData, rules) => {
  const errors = {};
  
  Object.keys(rules).forEach(field => {
    const rule = rules[field];
    const value = formData[field];
    
    // Required validation
    if (rule.required && (!value || value.toString().trim() === '')) {
      errors[field] = rule.message || `${field} is required`;
      return;
    }
    
    // Skip other validations if field is empty and not required
    if (!value || value.toString().trim() === '') {
      return;
    }
    
    // Min length validation
    if (rule.minLength && value.toString().length < rule.minLength) {
      errors[field] = `${field} must be at least ${rule.minLength} characters long`;
      return;
    }
    
    // Max length validation
    if (rule.maxLength && value.toString().length > rule.maxLength) {
      errors[field] = `${field} must be less than ${rule.maxLength} characters long`;
      return;
    }
    
    // Pattern validation
    if (rule.pattern && !rule.pattern.test(value)) {
      errors[field] = rule.patternMessage || `Invalid ${field} format`;
      return;
    }
    
    // Custom validation
    if (rule.validator && typeof rule.validator === 'function') {
      const customResult = rule.validator(value);
      if (customResult !== true) {
        errors[field] = customResult || `Invalid ${field}`;
        return;
      }
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validate URL format
 */
export const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate JSON string
 */
export const isValidJson = (str) => {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate password strength
 */
export const validatePasswordStrength = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasNonalphas = /\W/.test(password);
  
  const score = [
    password.length >= minLength,
    hasUpperCase,
    hasLowerCase,
    hasNumbers,
    hasNonalphas
  ].reduce((acc, curr) => acc + curr, 0);
  
  let strength = 'Very Weak';
  if (score >= 4) strength = 'Strong';
  else if (score >= 3) strength = 'Good';
  else if (score >= 2) strength = 'Fair';
  else if (score >= 1) strength = 'Weak';
  
  return {
    score,
    strength,
    isValid: score >= 3,
    requirements: {
      minLength: password.length >= minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar: hasNonalphas
    }
  };
};

/**
 * Check if value is empty
 */
export const isEmpty = (value) => {
  return value == null || 
         (typeof value === 'string' && value.trim() === '') ||
         (Array.isArray(value) && value.length === 0) ||
         (typeof value === 'object' && Object.keys(value).length === 0);
};

/**
 * Validate interview time limits
 */
export const validateTimeLimit = (timeLimit, questionType) => {
  const minTimes = { easy: 10, medium: 30, hard: 60 };
  const maxTimes = { easy: 60, medium: 180, hard: 300 };
  
  if (timeLimit < minTimes[questionType]) {
    return {
      isValid: false,
      error: `Time limit for ${questionType} questions must be at least ${minTimes[questionType]} seconds`
    };
  }
  
  if (timeLimit > maxTimes[questionType]) {
    return {
      isValid: false,
      error: `Time limit for ${questionType} questions must not exceed ${maxTimes[questionType]} seconds`
    };
  }
  
  return { isValid: true, error: null };
};

/**
 * Validate score range
 */
export const validateScore = (score, maxScore = 10) => {
  if (typeof score !== 'number' || isNaN(score)) {
    return { isValid: false, error: 'Score must be a valid number' };
  }
  
  if (score < 0) {
    return { isValid: false, error: 'Score cannot be negative' };
  }
  
  if (score > maxScore) {
    return { isValid: false, error: `Score cannot exceed ${maxScore}` };
  }
  
  return { isValid: true, error: null };
};
