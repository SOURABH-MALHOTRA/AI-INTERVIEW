import React from 'react';
import { Modal, Button, Space, Typography, Alert } from 'antd';
import { PlayCircleOutlined, StopOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const WelcomeBackModal = ({ visible, onResume, onCancel, candidateName }) => {
  return (
    <Modal
      title={
        <Space>
          <PlayCircleOutlined className="text-blue-500" />
          <span>Welcome Back!</span>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      width={500}
      footer={[
        <Button key="cancel" onClick={onCancel} icon={<StopOutlined />}>
          Start New Interview
        </Button>,
        <Button 
          key="resume" 
          type="primary" 
          onClick={onResume}
          icon={<PlayCircleOutlined />}
        >
          Resume Interview
        </Button>,
      ]}
      maskClosable={false}
    >
      <Space direction="vertical" className="w-full" size="large">
        <Alert
          message="Unfinished Interview Detected"
          description="You have an interview in progress that can be resumed."
          type="info"
          showIcon
        />
        
        <div>
          <Text strong>Candidate: </Text>
          <Text>{candidateName || 'Unknown Candidate'}</Text>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <Text type="secondary">
            Would you like to resume the previous interview or start a new one? 
            Starting a new interview will discard the current progress.
          </Text>
        </div>
      </Space>
    </Modal>
  );
};

export default WelcomeBackModal;