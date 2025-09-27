import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Card, 
  Empty, 
  Row, 
  Col, 
  Statistic, 
  Tabs,
  Button,
  Space,
  Badge,
  Typography,
  Divider,
  Tooltip
} from 'antd';
import { 
  UserOutlined, 
  TrophyOutlined, 
  ClockCircleOutlined,
  StarOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  DownloadOutlined
} from '@ant-design/icons';

import CandidateList from './CandidateList';
import CandidateDetail from './CandidateDetail';
import SearchFilter from './SearchFilter';

import { 
  selectFilteredAndSortedCandidates,
  selectCandidateStats,
  selectCandidatesByRecommendation,
  setSelectedCandidate,
  calculateStats
} from '../../redux/slices/candidateSlice';
import { INTERVIEW_STATUS } from '../../utils/constants';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const Dashboard = () => {
  const dispatch = useDispatch();
  const { selectedCandidate } = useSelector(state => state.candidate);
  const filteredCandidates = useSelector(selectFilteredAndSortedCandidates);
  const stats = useSelector(selectCandidateStats);
  const recommendationGroups = useSelector(selectCandidatesByRecommendation);
  
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'detail'
  const [activeTab, setActiveTab] = useState('all');

  // Recalculate stats on component mount and when candidates change
  useEffect(() => {
    dispatch(calculateStats());
  }, [dispatch]);

  const handleCandidateSelect = (candidate) => {
    dispatch(setSelectedCandidate(candidate.id));
    setViewMode('detail');
  };

  const handleBackToList = () => {
    dispatch(setSelectedCandidate(null));
    setViewMode('list');
  };

  const handleRefresh = () => {
    dispatch(calculateStats());
  };

  const exportData = () => {
    const data = filteredCandidates.map(candidate => ({
      name: candidate.candidateInfo?.name || 'N/A',
      email: candidate.candidateInfo?.email || 'N/A',
      phone: candidate.candidateInfo?.phone || 'N/A',
      score: candidate.totalScore || 0,
      percentage: Math.round(((candidate.totalScore || 0) / 12) * 100),
      status: candidate.status,
      completedAt: candidate.completedAt || 'N/A',
      duration: candidate.duration ? `${Math.round(candidate.duration / 60)} min` : 'N/A'
    }));

    const csvContent = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interview-results-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getRecommendationColor = (count, total) => {
    if (total === 0) return '#d9d9d9';
    const percentage = (count / total) * 100;
    if (percentage >= 50) return '#52c41a';
    if (percentage >= 30) return '#faad14';
    return '#ff4d4f';
  };

  const renderDetailView = () => {
    if (!selectedCandidate) {
      return (
        <Card>
          <Empty description="Candidate not found" />
          <Button type="primary" onClick={handleBackToList}>
            Back to List
          </Button>
        </Card>
      );
    }

    return (
      <CandidateDetail 
        candidate={selectedCandidate}
        onBack={handleBackToList}
      />
    );
  };

  const renderListView = () => {
    return (
      <div className="space-y-6">
        {/* Enhanced Stats Overview */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total Candidates"
                value={stats.total}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
              <Text type="secondary" className="text-xs">
                {stats.inProgress > 0 && `${stats.inProgress} in progress`}
              </Text>
            </Card>
          </Col>
          
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Completed"
                value={stats.completed}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
              <Text type="secondary" className="text-xs">
                {stats.total > 0 && `${Math.round((stats.completed / stats.total) * 100)}% completion rate`}
              </Text>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Average Score"
                value={stats.averageScore}
                suffix=" / 12"
                prefix={<TrophyOutlined />}
                valueStyle={{ color: '#faad14' }}
                precision={1}
              />
              <Text type="secondary" className="text-xs">
                {stats.completed > 0 && `${Math.round((stats.averageScore / 12) * 100)}% average`}
              </Text>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="High Performers"
                value={recommendationGroups.highly_recommended.length}
                prefix={<StarOutlined />}
                valueStyle={{ 
                  color: getRecommendationColor(
                    recommendationGroups.highly_recommended.length,
                    stats.completed
                  )
                }}
              />
              <Text type="secondary" className="text-xs">
                80%+ score candidates
              </Text>
            </Card>
          </Col>
        </Row>

        {/* Recommendation Breakdown */}
        {stats.completed > 0 && (
          <Card title="Performance Distribution">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {recommendationGroups.highly_recommended.length}
                  </div>
                  <div className="text-sm text-gray-600">Highly Recommended</div>
                  <div className="text-xs text-gray-500">80% - 100%</div>
                </div>
              </Col>
              
              <Col xs={24} sm={8}>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {recommendationGroups.recommended.length}
                  </div>
                  <div className="text-sm text-gray-600">Recommended</div>
                  <div className="text-xs text-gray-500">60% - 79%</div>
                </div>
              </Col>
              
              <Col xs={24} sm={8}>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {recommendationGroups.not_recommended.length}
                  </div>
                  <div className="text-sm text-gray-600">Not Recommended</div>
                  <div className="text-xs text-gray-500">0% - 59%</div>
                </div>
              </Col>
            </Row>
          </Card>
        )}

        {/* Search and Filters */}
        <Card>
          <div className="flex justify-between items-center mb-4">
            <Title level={4} className="mb-0">Interview Management</Title>
            <Space>
              <Tooltip title="Refresh data">
                <Button icon={<ReloadOutlined />} onClick={handleRefresh} />
              </Tooltip>
              {filteredCandidates.length > 0 && (
                <Tooltip title="Export to CSV">
                  <Button 
                    icon={<DownloadOutlined />} 
                    onClick={exportData}
                    type="primary"
                    ghost
                  >
                    Export
                  </Button>
                </Tooltip>
              )}
            </Space>
          </div>
          <SearchFilter />
        </Card>

        {/* Candidates List with Tabs */}
        <Card>
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
            tabBarExtraContent={
              <Badge count={filteredCandidates.length} showZero>
                <Text type="secondary">Results</Text>
              </Badge>
            }
          >
            <TabPane 
              tab={
                <Space>
                  <UserOutlined />
                  All Candidates
                  <Badge count={stats.total} showZero size="small" />
                </Space>
              } 
              key="all"
            >
              {renderCandidatesList(filteredCandidates)}
            </TabPane>

            <TabPane 
              tab={
                <Space>
                  <CheckCircleOutlined />
                  Completed
                  <Badge count={stats.completed} showZero size="small" />
                </Space>
              } 
              key="completed"
            >
              {renderCandidatesList(
                filteredCandidates.filter(c => c.status === INTERVIEW_STATUS.COMPLETED)
              )}
            </TabPane>

            <TabPane 
              tab={
                <Space>
                  <ClockCircleOutlined />
                  In Progress
                  <Badge count={stats.inProgress} showZero size="small" />
                </Space>
              } 
              key="progress"
            >
              {renderCandidatesList(
                filteredCandidates.filter(c => c.status === INTERVIEW_STATUS.IN_PROGRESS)
              )}
            </TabPane>

            <TabPane 
              tab={
                <Space>
                  <StarOutlined />
                  Top Performers
                  <Badge count={recommendationGroups.highly_recommended.length} showZero size="small" />
                </Space>
              } 
              key="top"
            >
              {renderCandidatesList(recommendationGroups.highly_recommended)}
            </TabPane>
          </Tabs>
        </Card>
      </div>
    );
  };

  const renderCandidatesList = (candidates) => {
    if (candidates.length === 0) {
      return (
        <Empty
          description={
            <div className="text-center">
              <Text type="secondary">No candidates found</Text>
              <br />
              <Text type="secondary" className="text-sm">
                {activeTab === 'all' && 'No interviews have been completed yet'}
                {activeTab === 'completed' && 'No completed interviews yet'}
                {activeTab === 'progress' && 'No interviews currently in progress'}
                {activeTab === 'top' && 'No high-performing candidates yet'}
              </Text>
            </div>
          }
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      );
    }

    return (
      <CandidateList 
        candidates={candidates}
        onCandidateSelect={handleCandidateSelect}
      />
    );
  };

  // Main render
  if (viewMode === 'detail') {
    return renderDetailView();
  }

  return renderListView();
};

export default Dashboard;