import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Button, Input, Typography, message, Alert, Space, Progress } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { setCandidateInfo } from '../../redux/slices/interviewSlice';

const { Title, Text } = Typography;

const CandidateInfoForm = ({ onComplete, existingInfo = {} }) => {
  const [formData, setFormData] = useState({
    name: existingInfo.name || '',
    email: existingInfo.email || '',
    phone: existingInfo.phone || ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({});
  
  const dispatch = useDispatch();
  const candidateInfo = useSelector(state => state.interview.candidateInfo);

  // Sync form data with Redux store on mount
  useEffect(() => {
    if (candidateInfo && Object.keys(candidateInfo).length > 0) {
      setFormData({
        name: candidateInfo.name || existingInfo.name || '',
        email: candidateInfo.email || existingInfo.email || '',
        phone: candidateInfo.phone || existingInfo.phone || ''
      });
    }
  }, [candidateInfo, existingInfo]);

  // Determine which fields are missing
  const getMissingFields = () => {
    const missing = [];
    if (!formData.name.trim()) missing.push('name');
    if (!formData.email.trim()) missing.push('email');
    if (!formData.phone.trim()) missing.push('phone');
    return missing;
  };

  const getFieldsFromResume = () => {
    const fromResume = [];
    if (existingInfo.name) fromResume.push('name');
    if (existingInfo.email) fromResume.push('email');
    if (existingInfo.phone) fromResume.push('phone');
    return fromResume;
  };

  const validateField = (field, value) => {
    switch (field) {
      case 'name':
        if (!value.trim()) return 'Name is required';
        if (value.trim().length < 2) return 'Name should be at least 2 characters';
        if (value.trim().length > 50) return 'Name should not exceed 50 characters';
        if (!/^[a-zA-Z\s.'-]+$/.test(value.trim())) return 'Name should only contain letters, spaces, dots, hyphens and apostrophes';
        return null;
        
      case 'email':
        if (!value.trim()) return 'Email is required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value.trim())) return 'Please enter a valid email address';
        if (value.length > 100) return 'Email should not exceed 100 characters';
        return null;
        
      case 'phone':
        if (!value.trim()) return 'Phone number is required';
        // Remove all non-digit characters for validation
        const cleanPhone = value.replace(/[^\d]/g, '');
        if (cleanPhone.length < 10) return 'Phone number should be at least 10 digits';
        if (cleanPhone.length > 15) return 'Phone number should not exceed 15 digits';
        // Check for valid patterns (international formats)
        const phoneRegex = /^(\+?\d{1,4}[-.\s]?)?\(?[\d\s\-\(\)]{10,}$/;
        if (!phoneRegex.test(value.trim())) return 'Please enter a valid phone number';
        return null;
        
      default:
        return null;
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    Object.keys(formData).forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      message.error('Please fix all validation errors before proceeding');
      return;
    }
    
    setLoading(true);

    try {
      // Clean and format the data
      const cleanedData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim()
      };

      // Update Redux store
      Object.keys(cleanedData).forEach(field => {
        dispatch(setCandidateInfo({ field, value: cleanedData[field] }));
      });
      
      message.success('Profile information saved successfully!');
      
      // Small delay for better UX
      setTimeout(() => {
        onComplete(cleanedData);
      }, 500);
      
    } catch (error) {
      console.error('Error updating profile:', error);
      message.error('Failed to update profile information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Mark field as touched
    if (!touched[field]) {
      setTouched(prev => ({ ...prev, [field]: true }));
    }
    
    // Real-time validation
    const error = validateField(field, value);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field]);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  // Calculate completion percentage
  const completionPercentage = () => {
    const totalFields = 3;
    const completedFields = Object.values(formData).filter(value => value.trim()).length;
    return Math.round((completedFields / totalFields) * 100);
  };

  const isFormValid = () => {
    return Object.values(formData).every(value => value.trim()) && 
           Object.keys(errors).every(key => !errors[key]);
  };

  const missingFields = getMissingFields();
  const fieldsFromResume = getFieldsFromResume();
  const completion = completionPercentage();

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <div className="text-center mb-6">
          <Title level={2} className="text-blue-600 mb-2">
            Complete Your Profile
          </Title>
          <Text type="secondary" className="text-lg">
            {missingFields.length > 0 
              ? `Please provide the missing information to start your interview`
              : 'All information looks good! Ready to start your interview?'
            }
          </Text>
        </div>

        {/* Progress indicator */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <Text strong>Profile Completion</Text>
            <Text strong style={{ color: completion === 100 ? '#52c41a' : '#1890ff' }}>
              {completion}%
            </Text>
          </div>
          <Progress 
            percent={completion} 
            showInfo={false}
            strokeColor={completion === 100 ? '#52c41a' : '#1890ff'}
          />
        </div>

        {/* Information about extracted vs missing fields */}
        {(fieldsFromResume.length > 0 || missingFields.length > 0) && (
          <Alert
            message={
              <Space direction="vertical" size="small" className="w-full">
                {fieldsFromResume.length > 0 && (
                  <div>
                    <CheckCircleOutlined className="text-green-500 mr-2" />
                    <Text type="success">
                      Extracted from resume: {fieldsFromResume.map(field => 
                        field.charAt(0).toUpperCase() + field.slice(1)
                      ).join(', ')}
                    </Text>
                  </div>
                )}
                {missingFields.length > 0 && (
                  <div>
                    <ExclamationCircleOutlined className="text-orange-500 mr-2" />
                    <Text type="warning">
                      Please provide: {missingFields.map(field => 
                        field.charAt(0).toUpperCase() + field.slice(1)
                      ).join(', ')}
                    </Text>
                  </div>
                )}
              </Space>
            }
            type={missingFields.length > 0 ? "warning" : "success"}
            showIcon={false}
            className="mb-6"
          />
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <UserOutlined className="mr-2" />
              Full Name *
              {fieldsFromResume.includes('name') && (
                <CheckCircleOutlined className="ml-2 text-green-500" title="Extracted from resume" />
              )}
            </label>
            <Input
              size="large"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              onBlur={() => handleBlur('name')}
              status={touched.name && errors.name ? 'error' : ''}
              prefix={<UserOutlined />}
              maxLength={50}
            />
            {touched.name && errors.name && (
              <Text type="danger" className="text-sm mt-1 block">
                {errors.name}
              </Text>
            )}
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MailOutlined className="mr-2" />
              Email Address *
              {fieldsFromResume.includes('email') && (
                <CheckCircleOutlined className="ml-2 text-green-500" title="Extracted from resume" />
              )}
            </label>
            <Input
              size="large"
              type="email"
              placeholder="Enter your email address"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              onBlur={() => handleBlur('email')}
              status={touched.email && errors.email ? 'error' : ''}
              prefix={<MailOutlined />}
              maxLength={100}
            />
            {touched.email && errors.email && (
              <Text type="danger" className="text-sm mt-1 block">
                {errors.email}
              </Text>
            )}
          </div>

          {/* Phone Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <PhoneOutlined className="mr-2" />
              Phone Number *
              {fieldsFromResume.includes('phone') && (
                <CheckCircleOutlined className="ml-2 text-green-500" title="Extracted from resume" />
              )}
            </label>
            <Input
              size="large"
              placeholder="Enter your phone number (+91 9876543210)"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              onBlur={() => handleBlur('phone')}
              status={touched.phone && errors.phone ? 'error' : ''}
              prefix={<PhoneOutlined />}
              maxLength={20}
            />
            {touched.phone && errors.phone && (
              <Text type="danger" className="text-sm mt-1 block">
                {errors.phone}
              </Text>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              className="w-full"
              loading={loading}
              disabled={!isFormValid() || loading}
            >
              {loading ? 'Saving Information...' : 'Start Technical Interview →'}
            </Button>
          </div>

          <div className="text-center">
            <Text type="secondary" className="text-sm">
              All fields marked with * are required to proceed
            </Text>
          </div>
        </form>

        {/* Additional Info */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <Text type="secondary" className="text-sm">
            <strong>What's Next:</strong> Your interview will consist of 6 technical questions 
            (2 Easy, 2 Medium, 2 Hard) with timed responses. Good luck! 🚀
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default CandidateInfoForm;