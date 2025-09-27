import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Card, Button, Input, Space, Typography, Progress, Tag, message } from 'antd';
import { SendOutlined, ClockCircleOutlined } from '@ant-design/icons';
import Timer from '../common/Timer';
import {
  submitAnswer,
  nextQuestion,
  startTimer,
  stopTimer
} from '../../redux/slices/interviewSlice';
import { evaluateCurrentAnswer, generateNextQuestion, generateInterviewSummary } from '../../redux/slices/interviewSlice'; // ✅ ADDED generateInterviewSummary
import { addCandidate } from '../../redux/slices/candidateSlice';
import { TIME_LIMITS, INTERVIEW_CONFIG } from '../../utils/constants';

const { TextArea } = Input;
const { Title, Text } = Typography;

const Question = () => {
  const dispatch = useDispatch();
  const { currentInterview, timer } = useSelector(state => state.interview);
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQuestion = currentInterview?.questions[currentInterview.currentQuestionIndex];
  const questionNumber = (currentInterview?.currentQuestionIndex || 0) + 1;
  const totalQuestions = INTERVIEW_CONFIG.TOTAL_QUESTIONS;
  
  useEffect(() => {
    if (currentQuestion && !timer.isRunning) {
      const timeLimit = TIME_LIMITS[currentQuestion.level];
      dispatch(startTimer(timeLimit));
    }
  }, [currentQuestion, dispatch, timer.isRunning]);

  const handleTimeUp = async () => {
    if (currentQuestion && !isSubmitting) {
      await handleSubmitAnswer(true);
    }
  };

  const handleSubmitAnswer = async (isTimeUp = false) => {
    if (!currentQuestion || isSubmitting) return;

    setIsSubmitting(true);
    dispatch(stopTimer());

    try {
      const timeSpent = TIME_LIMITS[currentQuestion.level] - timer.timeLeft;
      
      // Submit the answer
      dispatch(submitAnswer({ 
        answer: answer || 'No answer provided', 
        timeSpent 
      }));

      // Evaluate the answer
      const result = await dispatch(evaluateCurrentAnswer({ 
        answer: answer || 'No answer provided', 
        timeSpent 
      }));

      if (result.error) {
        throw new Error(result.error);
      }

      if (isTimeUp) {
        message.warning('Time is up! Moving to next question.');
      } else {
        message.success('Answer submitted successfully!');
      }

      // Move to next question or complete interview
      setTimeout(async () => {
        dispatch(nextQuestion());
        
        if (currentInterview.currentQuestionIndex + 1 < INTERVIEW_CONFIG.TOTAL_QUESTIONS) {
          // Generate next question
          await dispatch(generateNextQuestion());
          setAnswer('');
        } else {
          // ✅ MAIN FIX: Interview completed - generate summary first
          console.log('🔄 Interview completed! Generating summary...');
          message.loading('Generating your interview results...', 2);
          
          try {
            // Generate final summary using OpenAI
            const summaryResult = await dispatch(generateInterviewSummary());
            
            if (generateInterviewSummary.fulfilled.match(summaryResult)) {
              console.log('✅ Summary generated successfully');
              
              // Add to candidates list with summary
              const updatedInterview = {
                ...currentInterview,
                summary: summaryResult.payload,
                status: 'completed',
                completedAt: new Date().toISOString()
              };
              
              dispatch(addCandidate(updatedInterview));
              message.success('Interview completed! Results are ready! 🎉');
            } else {
              throw new Error('Failed to generate summary');
            }
          } catch (error) {
            console.error('Summary generation failed:', error);
            message.error('Interview completed but results processing failed. You can still view basic results.');
            
            // Add to candidates even if summary fails
            dispatch(addCandidate(currentInterview));
          }
        }
        
        setIsSubmitting(false);
      }, 1500);
      
    } catch (error) {
      console.error('Submit error:', error);
      message.error('Failed to submit answer. Please try again.');
      setIsSubmitting(false);
    }
  };

  const getDifficultyColor = (level) => {
    switch (level) {
      case 'easy': return 'green';
      case 'medium': return 'orange';
      case 'hard': return 'red';
      default: return 'blue';
    }
  };

  if (!currentQuestion) {
    return (
      <div className="text-center py-12">
        <Text>Loading question...</Text>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Question Header */}
      <Card>
        <div className="flex justify-between items-start mb-4">
          <div>
            <Space align="center">
              <Title level={4} className="m-0">
                Question {questionNumber} of {totalQuestions}
              </Title>
              <Tag color={getDifficultyColor(currentQuestion.level)} className="capitalize">
                {currentQuestion.level}
              </Tag>
            </Space>
          </div>
          
          <Progress
            type="circle"
            percent={(questionNumber / totalQuestions) * 100}
            width={60}
            strokeColor="#1890ff"
          />
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <Text className="text-lg leading-relaxed">
            {currentQuestion.question}
          </Text>
        </div>
      </Card>

      {/* Timer */}
      <Timer 
        onTimeUp={handleTimeUp}
        totalTime={TIME_LIMITS[currentQuestion.level]}
      />

      {/* Answer Input */}
      <Card title="Your Answer">
        <Space direction="vertical" className="w-full" size="large">
          <TextArea
            placeholder="Type your answer here..."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={8}
            disabled={isSubmitting || timer.timeLeft === 0}
            className="text-base"
          />
          
          <div className="flex justify-between items-center">
            <Text type="secondary">
              {answer.length} characters
            </Text>
            
            <Button
              type="primary"
              size="large"
              icon={<SendOutlined />}
              onClick={() => handleSubmitAnswer(false)}
              loading={isSubmitting}
              disabled={timer.timeLeft === 0 || isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Answer'}
            </Button>
          </div>
        </Space>
      </Card>

      {/* Help Text */}
      <Card size="small">
        <Text type="secondary" className="text-sm">
          💡 <strong>Tips:</strong> Be specific and provide examples where possible. 
          You can submit your answer anytime before the timer runs out.
        </Text>
      </Card>
    </div>
  );
};

export default Question;