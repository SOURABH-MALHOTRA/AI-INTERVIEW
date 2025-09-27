import { QUESTION_TYPES, SCORING_WEIGHTS, MAX_SCORE, PERFORMANCE_THRESHOLDS } from './constants';
import moment from 'moment';

/**
 * Calculate percentage score from total score
 */
export const calculatePercentage = (score, maxScore = MAX_SCORE) => {
  return Math.round((score / maxScore) * 100);
};

/**
 * Get performance level based on percentage
 */
export const getPerformanceLevel = (percentage) => {
  if (percentage >= PERFORMANCE_THRESHOLDS.EXCELLENT) {
    return { text: 'Excellent', color: '#52c41a', icon: '🌟' };
  }
  if (percentage >= PERFORMANCE_THRESHOLDS.GOOD) {
    return { text: 'Good', color: '#faad14', icon: '👍' };
  }
  if (percentage >= PERFORMANCE_THRESHOLDS.AVERAGE) {
    return { text: 'Average', color: '#1890ff', icon: '👌' };
  }
  return { text: 'Needs Improvement', color: '#ff4d4f', icon: '📚' };
};

/**
 * Get difficulty color for UI components
 */
export const getDifficultyColor = (level) => {
  switch (level) {
    case QUESTION_TYPES.EASY: return 'green';
    case QUESTION_TYPES.MEDIUM: return 'orange';
    case QUESTION_TYPES.HARD: return 'red';
    default: return 'blue';
  }
};

/**
 * Format time in seconds to MM:SS format
 */
export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Format duration for display
 */
export const formatDuration = (startTime, endTime) => {
  const start = moment(startTime);
  const end = moment(endTime);
  const duration = moment.duration(end.diff(start));
  
  if (duration.asHours() >= 1) {
    return `${Math.floor(duration.asHours())}h ${duration.minutes()}m`;
  }
  return `${duration.minutes()}m ${duration.seconds()}s`;
};

/**
 * Generate a random ID
 */
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * Debounce function for search inputs
 */
export const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

/**
 * Truncate text to specified length
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Get file size in human readable format
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Validate file type
 */
export const isValidFileType = (file, allowedTypes) => {
  return allowedTypes.includes(file.type);
};

/**
 * Get initials from name
 */
export const getInitials = (name) => {
  if (!name) return '??';
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

/**
 * Calculate interview statistics
 */
export const calculateInterviewStats = (candidates) => {
  if (!candidates.length) {
    return {
      totalCandidates: 0,
      averageScore: 0,
      highPerformers: 0,
      averageDuration: 0,
      passRate: 0
    };
  }

  const completedCandidates = candidates.filter(c => c.isCompleted);
  const totalScore = completedCandidates.reduce((sum, c) => sum + c.totalScore, 0);
  const highPerformers = completedCandidates.filter(c => 
    calculatePercentage(c.totalScore) >= PERFORMANCE_THRESHOLDS.EXCELLENT
  ).length;
  const passedCandidates = completedCandidates.filter(c => 
    calculatePercentage(c.totalScore) >= PERFORMANCE_THRESHOLDS.GOOD
  ).length;

  return {
    totalCandidates: completedCandidates.length,
    averageScore: completedCandidates.length > 0 ? 
      (totalScore / completedCandidates.length).toFixed(1) : 0,
    highPerformers,
    passRate: completedCandidates.length > 0 ? 
      Math.round((passedCandidates / completedCandidates.length) * 100) : 0,
    averageDuration: calculateAverageDuration(completedCandidates)
  };
};

/**
 * Calculate average interview duration
 */
export const calculateAverageDuration = (candidates) => {
  if (!candidates.length) return '0m';
  
  const totalDuration = candidates.reduce((sum, candidate) => {
    if (candidate.startedAt && candidate.completedAt) {
      const duration = moment(candidate.completedAt).diff(moment(candidate.startedAt), 'minutes');
      return sum + duration;
    }
    return sum;
  }, 0);

  const avgMinutes = Math.round(totalDuration / candidates.length);
  return `${avgMinutes}m`;
};

/**
 * Sort candidates by various criteria
 */
export const sortCandidates = (candidates, sortBy, sortOrder) => {
  return [...candidates].sort((a, b) => {
    let aValue, bValue;

    switch (sortBy) {
      case 'name':
        aValue = a.candidateInfo.name?.toLowerCase() || '';
        bValue = b.candidateInfo.name?.toLowerCase() || '';
        break;
      case 'score':
        aValue = a.totalScore;
        bValue = b.totalScore;
        break;
      case 'date':
        aValue = new Date(a.completedAt || a.startedAt);
        bValue = new Date(b.completedAt || b.startedAt);
        break;
      case 'email':
        aValue = a.candidateInfo.email?.toLowerCase() || '';
        bValue = b.candidateInfo.email?.toLowerCase() || '';
        break;
      default:
        aValue = a.totalScore;
        bValue = b.totalScore;
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });
};

/**
 * Filter candidates based on search query
 */
export const filterCandidates = (candidates, searchQuery) => {
  if (!searchQuery) return candidates;
  
  const searchLower = searchQuery.toLowerCase();
  return candidates.filter(candidate => {
    const { name = '', email = '', phone = '' } = candidate.candidateInfo;
    return (
      name.toLowerCase().includes(searchLower) ||
      email.toLowerCase().includes(searchLower) ||
      phone.includes(searchQuery)
    );
  });
};

/**
 * Export candidate data to CSV
 */
export const exportToCsv = (candidates) => {
  const headers = ['Name', 'Email', 'Phone', 'Score', 'Percentage', 'Performance', 'Date'];
  const csvContent = [
    headers.join(','),
    ...candidates.map(candidate => {
      const percentage = calculatePercentage(candidate.totalScore);
      const performance = getPerformanceLevel(percentage).text;
      const date = moment(candidate.completedAt || candidate.startedAt).format('YYYY-MM-DD HH:mm');
      
      return [
        `"${candidate.candidateInfo.name || ''}"`,
        `"${candidate.candidateInfo.email || ''}"`,
        `"${candidate.candidateInfo.phone || ''}"`,
        candidate.totalScore,
        `${percentage}%`,
        performance,
        date
      ].join(',');
    })
  ].join('\n');

  return csvContent;
};

/**
 * Download CSV file
 */
export const downloadCsv = (csvContent, filename = 'interview_results.csv') => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

/**
 * Generate random color for avatars
 */
export const generateAvatarColor = (name) => {
  const colors = ['#f56a00', '#7265e6', '#ffbf00', '#00a2ae', '#87d068', '#ff6b96'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

/**
 * Format relative time
 */
export const formatRelativeTime = (timestamp) => {
  return moment(timestamp).fromNow();
};

/**
 * Check if device is mobile
 */
export const isMobileDevice = () => {
  return window.innerWidth <= 768;
};

/**
 * Scroll to element
 */
export const scrollToElement = (elementId) => {
  const element = document.getElementById(elementId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
  }
};

/**
 * Copy text to clipboard
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy text: ', err);
    return false;
  }
};