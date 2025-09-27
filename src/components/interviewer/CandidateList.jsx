import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Table, Tag, Button, Space, Progress, Avatar } from 'antd';
import { EyeOutlined, UserOutlined } from '@ant-design/icons';
import { setSelectedCandidate } from '../../redux/slices/candidateSlice';
import moment from 'moment';

const CandidateList = ({ candidates, onCandidateSelect }) => {
  const dispatch = useDispatch();
  const { searchQuery, sortBy, sortOrder } = useSelector(state => state.candidate);

  // Filter candidates based on search query
  const filteredCandidates = candidates.filter(candidate => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      candidate.candidateInfo.name?.toLowerCase().includes(searchLower) ||
      candidate.candidateInfo.email?.toLowerCase().includes(searchLower) ||
      candidate.candidateInfo.phone?.includes(searchQuery)
    );
  });

  // Sort candidates
  const sortedCandidates = [...filteredCandidates].sort((a, b) => {
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

  const getScoreColor = (score) => {
    const percentage = (score / 12) * 100;
    if (percentage >= 80) return '#52c41a';
    if (percentage >= 60) return '#faad14';
    return '#ff4d4f';
  };

  const getPerformanceTag = (score) => {
    const percentage = (score / 12) * 100;
    if (percentage >= 80) return <Tag color="green">Excellent</Tag>;
    if (percentage >= 60) return <Tag color="orange">Good</Tag>;
    if (percentage >= 40) return <Tag color="blue">Average</Tag>;
    return <Tag color="red">Below Average</Tag>;
  };

  const handleViewDetails = (candidate) => {
    dispatch(setSelectedCandidate(candidate));
    onCandidateSelect(candidate);
  };

  const columns = [
    {
      title: 'Candidate',
      key: 'candidate',
      render: (_, record) => (
        <Space>
          <Avatar icon={<UserOutlined />} />
          <div>
            <div className="font-medium">{record.candidateInfo.name}</div>
            <div className="text-sm text-gray-500">{record.candidateInfo.email}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Contact',
      dataIndex: ['candidateInfo', 'phone'],
      key: 'phone',
    },
    {
      title: 'Score',
      key: 'score',
      sorter: true,
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Progress
            percent={(record.totalScore / 12) * 100}
            strokeColor={getScoreColor(record.totalScore)}
            size="small"
            format={() => `${record.totalScore}/12`}
          />
        </Space>
      ),
    },
    {
      title: 'Performance',
      key: 'performance',
      render: (_, record) => getPerformanceTag(record.totalScore),
    },
    {
      title: 'Completed',
      key: 'completed',
      render: (_, record) => (
        <span className="text-sm text-gray-500">
          {moment(record.completedAt || record.startedAt).fromNow()}
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetails(record)}
        >
          View Details
        </Button>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={sortedCandidates}
      rowKey="id"
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total, range) => 
          `${range[0]}-${range[1]} of ${total} candidates`,
      }}
      scroll={{ x: 'max-content' }}
    />
  );
};

export default CandidateList;