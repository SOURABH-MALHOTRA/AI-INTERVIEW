import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Card, Steps, message, Spin, Alert, Button, Modal, Progress, Space, Typography } from 'antd';
import { ExclamationCircleOutlined, ReloadOutlined, PlayCircleOutlined } from '@ant-design/icons';

import ResumeUpload from './ResumeUpload';
import Question from './Question';
import InterviewComplete from './InterviewComplete';
import CandidateInfoForm from './CandidateInfoForm';

import { 
  startInterview, 
  generateNextQuestion,
  setCandidateInfo,
  initializeSession,
  restoreSession,
  clearError,
  clearCurrentInterview
} from '../../redux/slices/interviewSlice';
import { addCandidate } from '../../redux/slices/candidateSlice';
import { INTERVIEW_STATUS, REQUIRED_FIELDS, INTERVIEW_CONFIG } from '../../utils/constants';

const { Title, Text } = Typography;
const { confirm } = Modal;

const ChatInterface = () => {
  const dispatch = useDispatch();
  const { 
    currentInterview, 
    isInterviewActive, 
    isLoading, 
    error,
    sessionId 
  } = useSelector(state => state.interview);

  const [step, setStep] = useState(0);
  const [hasError, setHasError] = useState(false);

  // 🔥 MAIN FIX: Helper functions for localStorage management
  const getWelcomeBackKey = () => `welcomeBack_${sessionId}`;
  
  const hasShownWelcomeBack = () => {
    if (!sessionId) return false;
    return localStorage.getItem(getWelcomeBackKey()) === 'true';
  };
  
  const markWelcomeBackShown = () => {
    if (sessionId) {
      localStorage.setItem(getWelcomeBackKey(), 'true');
    }
  };
  
  const clearWelcomeBackFlag = () => {
    if (sessionId) {
      localStorage.removeItem(getWelcomeBackKey());
    }
  };

  // Initialize session on component mount
  useEffect(() => {
    if (!sessionId) {
      dispatch(initializeSession());
    }
  }, [dispatch, sessionId]);

  // Handle session restoration and step calculation
  useEffect(() => {
    if (currentInterview) {
      const calculatedStep = calculateCurrentStep(currentInterview);
      setStep(calculatedStep);

      // 🔥 MAIN FIX: Show welcome back modal only if NOT shown before for this session
      if (currentInterview.status === INTERVIEW_STATUS.IN_PROGRESS && 
          !hasShownWelcomeBack() && 
          currentInterview.questions.length > 0) {
        showWelcomeBackModal();
        markWelcomeBackShown(); // Mark as shown immediately
      }

      // Add completed interviews to candidate list
      if (currentInterview.status === INTERVIEW_STATUS.COMPLETED) {
        dispatch(addCandidate(currentInterview));
      }
    }
  }, [currentInterview, sessionId, dispatch]);

  // Handle errors
  useEffect(() => {
    if (error) {
      setHasError(true);
      message.error(error);
    } else {
      setHasError(false);
    }
  }, [error]);

  const calculateCurrentStep = (interview) => {
    if (!interview) return 0;

    switch (interview.status) {
      case INTERVIEW_STATUS.COMPLETED:
        return 3;
      case INTERVIEW_STATUS.IN_PROGRESS:
        return 2;
      case INTERVIEW_STATUS.COLLECTING_INFO:
        return 1;
      default:
        return 0;
    }
  };

  const showWelcomeBackModal = () => {
    const questionProgress = currentInterview.questions.length;
    const totalQuestions = INTERVIEW_CONFIG.TOTAL_QUESTIONS;
    const progress = Math.round((questionProgress / totalQuestions) * 100);

    Modal.info({
      title: 'Welcome Back!',
      icon: <PlayCircleOutlined style={{ color: '#52c41a' }} />,
      content: (
        <div>
          <p>Your interview session has been restored.</p>
          <div className="mt-3">
            <Text strong>Progress: </Text>
            <Text>{questionProgress} of {totalQuestions} questions completed</Text>
            <Progress 
              percent={progress} 
              size="small" 
              className="mt-2"
              strokeColor="#52c41a"
            />
          </div>
          <p className="mt-3 text-gray-600">You can continue from where you left off.</p>
        </div>
      ),
      okText: 'Continue Interview',
      onOk: () => {
        message.success('Interview resumed! Good luck! 🚀');
      }
    });
  };

  const handleResumeUpload = useCallback((resumeData) => {
    try {
      if (hasMissingInfo(resumeData)) {
        // Store partial info and move to manual entry
        Object.keys(resumeData).forEach(field => {
          if (resumeData[field]) {
            dispatch(setCandidateInfo({ field, value: resumeData[field] }));
          }
        });
        setStep(1);
        message.info('Please complete the missing information to continue.');
      } else {
        // All info available, start interview
        handleStartInterview(resumeData);
      }
    } catch (error) {
      console.error('Resume upload error:', error);
      message.error('Error processing resume. Please try again.');
    }
  }, [dispatch]);

  const hasMissingInfo = (info) => {
    return REQUIRED_FIELDS.some(field => !info[field] || info[field].trim() === '');
  };

  const handleInfoComplete = useCallback(async (candidateInfo) => {
    try {
      await handleStartInterview(candidateInfo);
    } catch (error) {
      console.error('Info completion error:', error);
      message.error('Failed to start interview. Please try again.');
    }
  }, []);

  const handleStartInterview = async (candidateInfo) => {
    try {
      setHasError(false);
      
      // Validate candidate info
      const missingFields = REQUIRED_FIELDS.filter(field => 
        !candidateInfo[field] || candidateInfo[field].trim() === ''
      );
      
      if (missingFields.length > 0) {
        message.error(`Missing required information: ${missingFields.join(', ')}`);
        setStep(1);
        return;
      }

      // 🔥 CLEAR welcome back flag when starting new interview
      clearWelcomeBackFlag();

      // Start the interview
      dispatch(startInterview({ candidateInfo }));
      
      // Generate first question
      const result = await dispatch(generateNextQuestion(candidateInfo));
      
      if (generateNextQuestion.rejected.match(result)) {
        throw new Error(result.payload || 'Failed to generate first question');
      }

      setStep(2);
      message.success(`Welcome ${candidateInfo.name}! Your interview has started. Good luck! 🚀`);
      
    } catch (error) {
      console.error('Start interview error:', error);
      setHasError(true);
      message.error('Failed to start interview. Please check your connection and try again.');
    }
  };

  const handleRetry = () => {
    dispatch(clearError());
    setHasError(false);
    
    if (currentInterview && currentInterview.status === INTERVIEW_STATUS.IN_PROGRESS) {
      // Try to generate question again
      dispatch(generateNextQuestion(currentInterview.candidateInfo))
        .then(() => {
          message.success('Resumed successfully!');
        })
        .catch(() => {
          message.error('Still having issues. Please refresh the page.');
        });
    }
  };

  const handleStartOver = () => {
    confirm({
      title: 'Start Over?',
      icon: <ExclamationCircleOutlined />,
      content: 'This will clear your current progress and start a new interview. Are you sure?',
      okText: 'Yes, Start Over',
      cancelText: 'Cancel',
      onOk: () => {
        // 🔥 CLEAR welcome back flag when starting over
        clearWelcomeBackFlag();
        dispatch(clearCurrentInterview());
        setStep(0);
        setHasError(false);
        message.info('Starting fresh interview...');
      }
    });
  };

  const steps = [
    {
      title: 'Upload Resume',
      description: 'Upload your PDF or DOCX resume',
    },
    {
      title: 'Complete Profile', 
      description: 'Provide missing information',
    },
    {
      title: 'Technical Interview',
      description: `Answer ${INTERVIEW_CONFIG.TOTAL_QUESTIONS} technical questions`,
    },
    {
      title: 'Results',
      description: 'Review your performance',
    },
  ];

  const renderErrorState = () => (
    <div className="text-center py-12">
      <Alert
        message="Something went wrong"
        description={error || "There was an error during your interview. Please try again."}
        type="error"
        showIcon
        action={
          <Space direction="vertical" size="small">
            <Button type="primary" icon={<ReloadOutlined />} onClick={handleRetry}>
              Retry
            </Button>
            <Button type="default" onClick={handleStartOver}>
              Start Over
            </Button>
          </Space>
        }
        className="max-w-md mx-auto"
      />
    </div>
  );

  const renderLoadingState = () => (
    <div className="text-center py-12">
      <Spin size="large" />
      <div className="mt-4">
        <Title level={4} className="text-gray-600 mb-2">
          {step === 2 ? 'Generating your question...' : 'Loading...'}
        </Title>
        <Text type="secondary">
          {step === 2 ? 'Our AI is creating a personalized question for you' : 'Please wait'}
        </Text>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    // Show error state if there's an error
    if (hasError) {
      return renderErrorState();
    }

    // Show loading state when generating questions
    if (isLoading && step === 2) {
      return renderLoadingState();
    }

    switch (step) {
      case 0:
        return (
          <ResumeUpload 
            onUploadSuccess={handleResumeUpload}
            key="resume-upload" // Force remount on restart
          />
        );
      
      case 1:
        return (
          <CandidateInfoForm 
            onComplete={handleInfoComplete}
            existingInfo={currentInterview?.candidateInfo || {}}
            key="candidate-form"
          />
        );
      
      case 2:
        return currentInterview ? (
          <Question key={`question-${currentInterview.currentQuestionIndex}`} />
        ) : (
          <div className="text-center py-12">
            <Alert
              message="Interview data not found"
              description="Please start over to begin a new interview."
              type="warning"
              showIcon
              action={
                <Button type="primary" onClick={handleStartOver}>
                  Start New Interview
                </Button>
              }
            />
          </div>
        );
      
      case 3:
        return currentInterview ? (
          <InterviewComplete key="interview-complete" />
        ) : (
          <div className="text-center py-12">
            <Alert
              message="Interview results not found"
              description="Please start a new interview."
              type="info"
              showIcon
              action={
                <Button type="primary" onClick={handleStartOver}>
                  Start New Interview
                </Button>
              }
            />
          </div>
        );
      
      default:
        return <ResumeUpload onUploadSuccess={handleResumeUpload} />;
    }
  };

  const getStepStatus = (stepIndex) => {
    if (stepIndex < step) return 'finish';
    if (stepIndex === step) return hasError ? 'error' : 'process';
    return 'wait';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Steps */}
      <Card>
        <div className="mb-4">
          <Title level={3} className="text-center mb-4">
            AI Technical Interview Assistant
          </Title>
          <Steps 
            current={step}
            items={steps.map((stepItem, index) => ({
              ...stepItem,
              status: getStepStatus(index)
            }))}
            size="small"
          />
        </div>
        
        {/* Interview Progress for active interviews */}
        {currentInterview && step === 2 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <Text strong>Interview Progress</Text>
              <Text strong>
                Question {(currentInterview.currentQuestionIndex || 0) + 1} of {INTERVIEW_CONFIG.TOTAL_QUESTIONS}
              </Text>
            </div>
            <Progress
              percent={Math.round(((currentInterview.currentQuestionIndex || 0) / INTERVIEW_CONFIG.TOTAL_QUESTIONS) * 100)}
              strokeColor="#1890ff"
              trailColor="#f0f0f0"
            />
          </div>
        )}
      </Card>

      {/* Main Content */}
      <div className="min-h-96">
        {renderCurrentStep()}
      </div>

      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && currentInterview && (
        <Card title="Debug Info" size="small" className="mt-4">
          <Text code>
            Step: {step} | Status: {currentInterview.status} | 
            Question Index: {currentInterview.currentQuestionIndex} | 
            Total Questions: {currentInterview.questions?.length || 0} |
            Session ID: {sessionId} |
            Welcome Back Shown: {hasShownWelcomeBack()}
          </Text>
        </Card>
      )}
    </div>
  );
};

export default ChatInterface;