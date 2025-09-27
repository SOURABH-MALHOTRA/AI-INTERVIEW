import React from 'react';
import { useSelector } from 'react-redux';
import { Card, Typography, Tag, List, Divider, Space, Progress } from 'antd';
import { ArrowLeftOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

const CandidateDetail = () => {
  const { selectedCandidate } = useSelector(state => state.candidate);
  
  if (!selectedCandidate) {
    return (
      <div className="text-center py-12">
        <Text>Select a candidate to view details</Text>
      </div>
    );
  }

  const summary = selectedCandidate.summary || {};

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Candidate Header */}
      <Card>
        <div className="flex justify-between items-start">
          <div>
            <Title level={2}>{selectedCandidate.candidateInfo?.name}</Title>
            <Space direction="vertical">
              <Text>Email: {selectedCandidate.candidateInfo?.email}</Text>
              <Text>Phone: {selectedCandidate.candidateInfo?.phone}</Text>
              <Text>Applied: {new Date(selectedCandidate.startedAt).toLocaleDateString()}</Text>
            </Space>
          </div>
          
          <div className="text-right">
            <Progress 
              type="circle" 
              percent={summary.percentage || 0} 
              size={80}
              strokeColor={{
                '0%': '#ff4d4f',
                '100%': '#52c41a',
              }}
            />
            <div className="mt-2">
              <Tag color={getRecommendationColor(summary.recommendation)}>
                {summary.recommendation || 'No recommendation'}
              </Tag>
            </div>
          </div>
        </div>
      </Card>

      {/* Overall Summary */}
      <Card title="AI Evaluation Summary">
        <Space direction="vertical" className="w-full" size="large">
          <div>
            <Text strong>Final Score: </Text>
            <Text>{summary.finalScore || 0}/{summary.maxPossibleScore || 12}</Text>
          </div>
          
          <div>
            <Text strong>Overall Assessment: </Text>
            <Paragraph>{summary.overallAssessment || 'No assessment available'}</Paragraph>
          </div>
          
          <div>
            <Text strong>Detailed Summary: </Text>
            <Paragraph>{summary.detailedSummary || 'No detailed summary available'}</Paragraph>
          </div>
        </Space>
      </Card>

      {/* Strengths and Improvements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        <Card title="Strengths">
          <List
            dataSource={summary.strengths || []}
            renderItem={(item, index) => (
              <List.Item>
                <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                <Text>{item}</Text>
              </List.Item>
            )}
            locale={{ emptyText: 'No strengths identified' }}
          />
        </Card>

        {/* Improvements */}
        <Card title="Areas for Improvement">
          <List
            dataSource={summary.improvements || []}
            renderItem={(item, index) => (
              <List.Item>
                <ClockCircleOutlined style={{ color: '#faad14', marginRight: 8 }} />
                <Text>{item}</Text>
              </List.Item>
            )}
            locale={{ emptyText: 'No improvements suggested' }}
          />
        </Card>
      </div>

      {/* Questions and Answers */}
      <Card title="Interview Questions & Answers">
        {selectedCandidate.questions?.map((question, index) => (
          <div key={question.id || index} className="mb-6 p-4 border rounded-lg">
            <Space direction="vertical" className="w-full" size="middle">
              {/* Question */}
              <div>
                <Text strong>Q{index + 1}: </Text>
                <Text>{question.question}</Text>
                <Tag color={getDifficultyColor(question.level)} className="ml-2 capitalize">
                  {question.level}
                </Tag>
              </div>

              {/* Answer */}
              <div>
                <Text strong>Candidate's Answer: </Text>
                <Paragraph className="bg-gray-50 p-3 rounded mt-1">
                  {question.answer || 'No answer provided'}
                </Paragraph>
              </div>

              {/* Evaluation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Text strong>Score: </Text>
                  <Tag color={getScoreColor(question.score)}>
                    {question.score || 0}/3
                  </Tag>
                </div>
                <div>
                  <Text strong>Time Spent: </Text>
                  <Text>{question.timeSpent || 0}s</Text>
                </div>
              </div>

              {/* Feedback */}
              <div>
                <Text strong>AI Feedback: </Text>
                <Text>{question.feedback || 'No feedback available'}</Text>
              </div>

              {index < selectedCandidate.questions.length - 1 && <Divider />}
            </Space>
          </div>
        ))}
      </Card>

      {/* Metadata */}
      <Card size="small">
        <Space direction="vertical">
          <Text type="secondary">
            Interview Date: {new Date(selectedCandidate.startedAt).toLocaleString()}
          </Text>
          <Text type="secondary">
            Duration: {Math.round(selectedCandidate.duration / 60)} minutes
          </Text>
          <Text type="secondary">
            Evaluated by: {summary.generatedBy || 'System'}
          </Text>
        </Space>
      </Card>
    </div>
  );
};

// Helper functions
const getRecommendationColor = (recommendation) => {
  if (!recommendation) return 'gray';
  
  switch (recommendation.toLowerCase()) {
    case 'strong yes': return 'green';
    case 'yes': return 'blue';
    case 'no': return 'orange';
    case 'strong no': return 'red';
    default: return 'gray';
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

const getScoreColor = (score) => {
  if (score >= 2.5) return 'green';
  if (score >= 1.5) return 'orange';
  return 'red';
};

export default CandidateDetail;