import React from 'react';
import { Layout, Typography, Space, Tag } from 'antd';
import { BulbOutlined } from '@ant-design/icons';

const { Header: AntHeader } = Layout;
const { Title } = Typography;

const Header = () => {
  return (
    <AntHeader className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-full px-4">
        <Space align="center">
          <BulbOutlined className="text-2xl text-blue-500" />
          <Title level={3} className="m-0 text-gray-800">
            AI Interview Assistant
          </Title>
        </Space>
        <Tag color="blue" className="px-3 py-1">
          Powered by OpenAI
        </Tag>
      </div>
    </AntHeader>
  );
};

export default Header;