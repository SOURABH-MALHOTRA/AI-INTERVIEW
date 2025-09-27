import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Input, Select, Space, Button } from 'antd';
import { SearchOutlined, ClearOutlined } from '@ant-design/icons';
import { setSearchQuery, setSortBy, setSortOrder } from '../../redux/slices/candidateSlice';

const { Option } = Select;

const SearchFilter = () => {
  const dispatch = useDispatch();
  const { searchQuery, sortBy, sortOrder } = useSelector(state => state.candidate);

  const handleSearchChange = (e) => {
    dispatch(setSearchQuery(e.target.value));
  };

  const handleSortChange = (value) => {
    dispatch(setSortBy(value));
  };

  const handleOrderChange = (value) => {
    dispatch(setSortOrder(value));
  };

  const handleClearFilters = () => {
    dispatch(setSearchQuery(''));
    dispatch(setSortBy('score'));
    dispatch(setSortOrder('desc'));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-64">
          <Input
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={handleSearchChange}
            prefix={<SearchOutlined />}
            allowClear
            size="large"
          />
        </div>
        
        <Space>
          <Select
            value={sortBy}
            onChange={handleSortChange}
            style={{ width: 120 }}
            size="large"
          >
            <Option value="score">Score</Option>
            <Option value="name">Name</Option>
            <Option value="date">Date</Option>
          </Select>
          
          <Select
            value={sortOrder}
            onChange={handleOrderChange}
            style={{ width: 100 }}
            size="large"
          >
            <Option value="desc">Desc</Option>
            <Option value="asc">Asc</Option>
          </Select>
          
          <Button
            icon={<ClearOutlined />}
            onClick={handleClearFilters}
            size="large"
          >
            Clear
          </Button>
        </Space>
      </div>
    </div>
  );
};

export default SearchFilter;