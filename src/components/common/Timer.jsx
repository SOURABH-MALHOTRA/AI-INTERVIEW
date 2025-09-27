import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Progress, Typography, Space } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import { tickTimer } from '../../redux/slices/interviewSlice';

const { Text } = Typography;

const Timer = ({ onTimeUp, totalTime }) => {
  const dispatch = useDispatch();
  const { timeLeft, isRunning } = useSelector(state => state.interview.timer);

  useEffect(() => {
    let interval;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        dispatch(tickTimer());
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      onTimeUp();
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, dispatch, onTimeUp]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressColor = () => {
    const percentage = (timeLeft / totalTime) * 100;
    if (percentage > 50) return '#52c41a';
    if (percentage > 25) return '#faad14';
    return '#ff4d4f';
  };

  const progressPercent = totalTime > 0 ? (timeLeft / totalTime) * 100 : 0;

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border mb-4">
      <Space direction="vertical" className="w-full">
        <Space align="center">
          <ClockCircleOutlined className="text-lg" />
          <Text strong>Time Remaining</Text>
        </Space>
        
        <Progress
          percent={progressPercent}
          strokeColor={getProgressColor()}
          showInfo={false}
          strokeWidth={8}
        />
        
        <div className="text-center">
          <Text 
            className={`text-2xl font-mono ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : ''}`}
            strong
          >
            {formatTime(timeLeft)}
          </Text>
        </div>
      </Space>
    </div>
  );
};

export default Timer;