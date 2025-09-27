import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Upload, Button, message, Alert, Space, Typography, Card, Spin, Row, Col, Divider } from 'antd';
import { UploadOutlined, FileTextOutlined, CheckCircleOutlined, UserOutlined, MailOutlined, PhoneOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { parseResume } from '../../services/resumeParser';
import { setCandidateInfo, setResumeData } from '../../redux/slices/interviewSlice';
import { FILE_TYPES } from '../../utils/constants';

const { Text, Title } = Typography;
const { Dragger } = Upload;

const ResumeUpload = ({ onUploadSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [parseError, setParseError] = useState(null);
  
  const dispatch = useDispatch();
  const candidateInfo = useSelector(state => state.interview.candidateInfo);

  const handleFileUpload = async (file) => {
    console.log('File upload started:', file.name, file.type);
    
    // Reset previous state
    setParseError(null);
    setExtractedData(null);

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      const errorMsg = `Unsupported file type: ${file.type}. Please upload PDF or DOCX files only.`;
      message.error(errorMsg);
      setParseError(errorMsg);
      return false;
    }

    // Validate file size (10MB limit increased)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      const errorMsg = 'File size should be less than 10MB';
      message.error(errorMsg);
      setParseError(errorMsg);
      return false;
    }

    setUploading(true);
    
    try {
      console.log('Starting resume parsing...');
      const resumeData = await parseResume(file);
      console.log('Resume parsing completed:', resumeData);
      
      // Validate parsing results
      if (!resumeData || (!resumeData.name && !resumeData.email && !resumeData.phone)) {
        throw new Error('Could not extract any information from the resume. Please ensure the file contains readable text.');
      }

      // Store the complete resume data
      dispatch(setResumeData(resumeData));
      
      // Store individual candidate information
      const candidateData = {
        name: resumeData.name || '',
        email: resumeData.email || '',
        phone: resumeData.phone || '',
        resumeText: resumeData.text || ''
      };

      // Update candidate info in store
      Object.keys(candidateData).forEach(key => {
        if (candidateData[key]) {
          dispatch(setCandidateInfo({ field: key, value: candidateData[key] }));
        }
      });

      setUploadedFile(file);
      setExtractedData(candidateData);
      
      message.success('Resume uploaded and parsed successfully!');
      
      // Auto-proceed if all required info is extracted
      const hasAllInfo = candidateData.name && candidateData.email && candidateData.phone;
      
      if (hasAllInfo) {
        message.success('All required information extracted! You can proceed to the interview.');
      } else {
        message.info('Some information is missing. You\'ll be asked to provide it before starting the interview.');
      }
      
      // Call the success callback with extracted data
      if (onUploadSuccess) {
        onUploadSuccess(candidateData);
      }
      
    } catch (error) {
      console.error('Resume parsing error:', error);
      const errorMessage = error.message || 'Failed to parse resume. Please try again or upload a different file.';
      message.error(errorMessage);
      setParseError(errorMessage);
      
      // Still store the file for manual info entry
      setUploadedFile(file);
      setExtractedData({ name: '', email: '', phone: '', resumeText: '' });
    } finally {
      setUploading(false);
    }
    
    return false; // Prevent default upload behavior
  };

  const handleContinue = () => {
    if (onUploadSuccess && extractedData) {
      onUploadSuccess(extractedData);
    }
  };

  const handleRetry = () => {
    setUploadedFile(null);
    setExtractedData(null);
    setParseError(null);
  };

  const uploadProps = {
    beforeUpload: handleFileUpload,
    showUploadList: false,
    accept: '.pdf,.docx,.doc',
    multiple: false,
    disabled: uploading
  };

  // NEW: Improved extracted info display
  const renderExtractedInfo = () => {
    if (!extractedData) return null;

    const { name, email, phone } = extractedData;
    const hasAnyInfo = name || email || phone;

    if (!hasAnyInfo && !parseError) return null;

    const infoItems = [
      {
        icon: <UserOutlined style={{ fontSize: '24px', color: name ? '#52c41a' : '#d9d9d9' }} />,
        label: 'Name',
        value: name,
        found: !!name
      },
      {
        icon: <MailOutlined style={{ fontSize: '24px', color: email ? '#52c41a' : '#d9d9d9' }} />,
        label: 'Email',
        value: email,
        found: !!email
      },
      {
        icon: <PhoneOutlined style={{ fontSize: '24px', color: phone ? '#52c41a' : '#d9d9d9' }} />,
        label: 'Phone',
        value: phone,
        found: !!phone
      }
    ];

    const foundCount = infoItems.filter(item => item.found).length;

    return (
      <Card 
        title={
          <Space>
            <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '20px' }} />
            <span style={{ color: '#52c41a', fontWeight: 'bold' }}>Information Extracted!</span>
            <span style={{ color: '#666', fontSize: '14px' }}>({foundCount}/3 found)</span>
          </Space>
        }
        className="mt-4"
        style={{ 
          borderRadius: '8px',
          border: '2px solid #52c41a20',
          backgroundColor: '#f6ffed'
        }}
      >
        <Row gutter={[16, 16]}>
          {infoItems.map((item, index) => (
            <Col xs={24} sm={8} key={index}>
              <Card 
                size="small" 
                className="text-center"
                style={{
                  height: '100px',
                  border: item.found ? '2px solid #52c41a' : '2px solid #f0f0f0',
                  backgroundColor: item.found ? '#f6ffed' : '#fafafa',
                  borderRadius: '6px'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'center' }}>
                  <div style={{ marginBottom: '8px' }}>
                    {item.icon}
                  </div>
                  <Text strong style={{ fontSize: '14px', marginBottom: '4px' }}>
                    {item.label}
                  </Text>
                  <Text 
                    style={{ 
                      fontSize: '12px',
                      color: item.found ? '#52c41a' : '#999',
                      fontWeight: item.found ? '600' : 'normal',
                      textAlign: 'center',
                      wordBreak: 'break-word'
                    }}
                  >
                    {item.value || 'Not found'}
                  </Text>
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        {foundCount < 3 && (
          <Alert
            message={`${3 - foundCount} information missing`}
            description="Don't worry! You'll be asked to provide missing information before starting the interview."
            type="warning"
            showIcon
            className="mt-4"
            style={{ borderRadius: '6px' }}
          />
        )}

        <div className="text-center mt-4">
          <Space size="middle">
            <Button size="large" onClick={handleRetry}>
              Upload Different File
            </Button>
            <Button 
              type="primary" 
              size="large"
              onClick={handleContinue}
              disabled={!extractedData}
              style={{
                backgroundColor: '#1890ff',
                borderColor: '#1890ff',
                borderRadius: '6px',
                fontWeight: 'bold'
              }}
            >
              🚀 Proceed to Interview
            </Button>
          </Space>
        </div>
      </Card>
    );
  };

  const renderUploadArea = () => {
    if (uploadedFile) {
      return (
        <Card 
          className="text-center p-4"
          style={{ 
            borderRadius: '8px', 
            border: '2px solid #52c41a', 
            backgroundColor: '#f6ffed' 
          }}
        >
          <Space direction="vertical" size="middle">
            <CheckCircleOutlined style={{ fontSize: '48px', color: '#52c41a' }} />
            <div>
              <Title level={4} style={{ color: '#52c41a', margin: 0 }}>
                ✅ File Uploaded Successfully!
              </Title>
              <Text type="secondary" style={{ fontSize: '16px' }}>📄 {uploadedFile.name}</Text>
            </div>
            
            {parseError && (
              <Alert
                message="⚠️ Parsing Issues"
                description={parseError}
                type="warning"
                showIcon
                style={{ borderRadius: '6px' }}
                action={
                  <Button size="small" onClick={handleRetry}>
                    Try Another File
                  </Button>
                }
              />
            )}
          </Space>
        </Card>
      );
    }

    return (
      <Dragger 
        {...uploadProps} 
        className="p-8"
        style={{
          borderRadius: '8px',
          border: uploading ? '2px dashed #1890ff' : '2px dashed #d9d9d9',
          backgroundColor: uploading ? '#f0f8ff' : '#fafafa'
        }}
      >
        <p className="ant-upload-drag-icon">
          {uploading ? (
            <Spin size="large" />
          ) : (
            <UploadOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
          )}
        </p>
        <p className="ant-upload-text" style={{ fontSize: '18px', fontWeight: 'bold', color: '#1890ff' }}>
          {uploading ? '⚡ Processing your resume...' : '📄 Click or drag your resume here'}
        </p>
        <p className="ant-upload-hint" style={{ fontSize: '16px' }}>
          Support PDF, DOCX, and DOC formats • Maximum file size: 10MB
        </p>
        {uploading && (
          <div style={{ marginTop: '16px' }}>
            <Text type="secondary" style={{ fontSize: '14px' }}>
              🔍 Extracting your contact information...
            </Text>
          </div>
        )}
      </Dragger>
    );
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card style={{ borderRadius: '12px' }}>
        <Space direction="vertical" size="large" className="w-full text-center">
          <div>
            <FileTextOutlined style={{ fontSize: '64px', color: '#1890ff', marginBottom: '16px' }} />
            <Title level={2} style={{ color: '#1890ff' }}>📋 Upload Your Resume</Title>
            <Text type="secondary" className="text-lg">
              Upload your resume to automatically extract contact information
            </Text>
          </div>

          {!uploadedFile && (
            <Alert
              message="🚀 What happens next?"
              description={
                <ul className="text-left mt-2 mb-0">
                  <li>📄 We'll extract your name, email, and phone number</li>
                  <li>✏️ Missing information can be entered manually</li>
                  <li>🤖 Then proceed to the AI-powered interview</li>
                </ul>
              }
              type="info"
              showIcon
              className="mb-4"
              style={{ borderRadius: '6px' }}
            />
          )}

          {renderUploadArea()}
          {renderExtractedInfo()}
        </Space>
      </Card>
    </div>
  );
};

export default ResumeUpload;