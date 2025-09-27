import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Layout, Tabs, message } from 'antd';
import { UserOutlined, DashboardOutlined } from '@ant-design/icons';
import Header from './components/common/Header';
import WelcomeBackModal from './components/common/WelcomeBackModal';
import ChatInterface from './components/interviewee/ChatInterface';
import Dashboard from './components/interviewer/Dashboard';
import { resumeInterview } from './redux/slices/interviewSlice';
import './App.css';

const { Content } = Layout;

function App() {
  const [activeTab, setActiveTab] = useState('1');
  const [showWelcomeBack, setShowWelcomeBack] = useState(false);
  const hasShownWelcomeBack = useRef(false); // 🔥 MAIN FIX: Track if modal already shown
  const dispatch = useDispatch();
  const { currentInterview, isInterviewActive } = useSelector(state => state.interview);

  useEffect(() => {
    // 🔥 MAIN FIX: Show welcome back modal ONLY on app initialization
    // NOT on every state update during active interview
    if (currentInterview && 
        !currentInterview.isCompleted && 
        isInterviewActive &&
        !hasShownWelcomeBack.current && // Only if not shown before
        currentInterview.questions && 
        currentInterview.questions.length > 0) { // Only if there are existing questions (resuming)
      
      console.log('🔄 Showing welcome back modal for:', currentInterview.candidateInfo?.name);
      setShowWelcomeBack(true);
      hasShownWelcomeBack.current = true; // Mark as shown
    }
    
    // 🔥 RESET flag when interview is completed or cleared
    if (!currentInterview || currentInterview.isCompleted) {
      hasShownWelcomeBack.current = false;
    }
  }, [currentInterview?.id, isInterviewActive]); // 🔥 CHANGED: Only depend on interview ID, not the whole object

  const handleResumeInterview = () => {
    dispatch(resumeInterview());
    setShowWelcomeBack(false);
    setActiveTab('1'); // Switch to interviewee tab
    message.success('Interview resumed successfully!');
  };

  const handleCancelWelcomeBack = () => {
    setShowWelcomeBack(false);
    hasShownWelcomeBack.current = true; // Mark as handled even if cancelled
  };

  const tabItems = [
    {
      key: '1',
      label: (
        <span>
          <UserOutlined />
          Interviewee
        </span>
      ),
      children: <ChatInterface />,
    },
    {
      key: '2',
      label: (
        <span>
          <DashboardOutlined />
          Interviewer Dashboard
        </span>
      ),
      children: <Dashboard />,
    },
  ];

  return (
    <Layout className="min-h-screen">
      <Header />
      <Content className="p-4">
        <div className="max-w-7xl mx-auto">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            size="large"
            className="custom-tabs"
          />
        </div>
      </Content>
      
      <WelcomeBackModal
        visible={showWelcomeBack}
        onResume={handleResumeInterview}
        onCancel={handleCancelWelcomeBack}
        candidateName={currentInterview?.candidateInfo?.name}
      />
    </Layout>
  );
}

export default App;