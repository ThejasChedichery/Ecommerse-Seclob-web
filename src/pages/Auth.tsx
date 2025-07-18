import React, { useState } from 'react';
import { Form, Input, Button, message, Card, Divider } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginSuccess, setLoading } from '../store/slices/authSlice';
import { authAPI } from '../utils/api';

const Auth: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLocalLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogin = async (values: { email: string; password: string }) => {
    setLocalLoading(true);
    dispatch(setLoading(true));
    
    try {
      const loginData = {
        email: values.email,
        password: values.password
      };
      
      const response = await authAPI.login(loginData);
      
      // Check if response is an array (as per your API format)
      if (Array.isArray(response) && response.length >= 2) {
        const messageData = response[0]; // First object contains message
        const userData = response[1]; // Second object contains user data
        
        if (userData && userData.token) {
          // Store token in localStorage
          localStorage.setItem('authToken', userData.token);
          
          dispatch(loginSuccess({
            user: {
              id: userData.id,
              userName: userData.userName, // Use the actual userName from response
              email: userData.email,
              role: userData.role // Use the actual role from response
            },
            token: userData.token
          }));
          
          message.success(messageData.message || 'Login successful!');
          navigate('/');
        } else {
          throw new Error('Invalid user data in response');
        }
      } else {
        // Handle single object response format
        if (response && response.token) {
          // Store token in localStorage
          localStorage.setItem('authToken', response.token);
          
          dispatch(loginSuccess({
            user: {
              id: response.id,
              userName: response.userName,
              email: response.email,
              role: response.role
            },
            token: response.token
          }));
          
          message.success('Login successful!');
          navigate('/');
        } else {
          throw new Error('Invalid response format');
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Login failed. Please try again.';
      message.error(errorMessage);
    } finally {
      setLocalLoading(false);
      dispatch(setLoading(false));
    }
  };

  const handleSignUp = async (values: { userName: string; email: string; password: string }) => {
    setLocalLoading(true);
    dispatch(setLoading(true));
    
    try {
      const registerData = {
        userName: values.userName,
        email: values.email,
        password: values.password,
        role: 'user'
      };
      
      await authAPI.register(registerData);
      message.success('Account created successfully! Please login.');
      setIsSignUp(false);
    } catch (error: any) {
      console.error('Signup error:', error);
      const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
      message.error(errorMessage);
    } finally {
      setLocalLoading(false);
      dispatch(setLoading(false));
    }
  };

  return (
    <div className="auth-container">
      {/* Left Side - Welcome */}
      <div className={`col-md-6 ${isSignUp ? 'auth-right' : 'auth-left'} d-flex align-items-center justify-content-center`}>
        {!isSignUp ? (
          <div className="text-center text-white p-5">
            <h1 style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '24px' }}>
              Welcome Back!
            </h1>
            <p style={{ fontSize: '18px', marginBottom: '32px', opacity: 0.9 }}>
              To keep connected with us please<br />login with your personal info
            </p>
            <Button 
              type="default"
              size="large"
              style={{ 
                background: 'transparent', 
                border: '2px solid white', 
                color: 'white',
                borderRadius: '25px',
                paddingLeft: '32px',
                paddingRight: '32px'
              }}
              onClick={() => setIsSignUp(true)}
            >
              SIGN IN
            </Button>
          </div>
        ) : (
          <div className="text-center p-5">
            <h1 style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '24px', color: '#E6A623' }}>
              Sign In to<br />Your Account
            </h1>
            <Form layout="vertical" onFinish={handleLogin}>
              <Form.Item
                name="email"
                rules={[
                  { required: true, message: 'Please enter your email!' },
                  { type: 'email', message: 'Please enter a valid email!' }
                ]}
              >
                <Input 
                  prefix={<MailOutlined />} 
                  placeholder="Email" 
                  size="large"
                  style={{ borderRadius: '8px', backgroundColor: '#F5F5F5', border: 'none' }}
                />
              </Form.Item>
              <Form.Item
                name="password"
                rules={[{ required: true, message: 'Please enter your password!' }]}
              >
                <Input.Password 
                  prefix={<LockOutlined />} 
                  placeholder="Password" 
                  size="large"
                  iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                  style={{ borderRadius: '8px', backgroundColor: '#F5F5F5', border: 'none' }}
                />
              </Form.Item>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <Button type="link" style={{ color: '#666' }}>
                  Forgot password?
                </Button>
              </div>
              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  size="large" 
                  block
                  loading={loading}
                  style={{ 
                    background: '#E6A623', 
                    border: 'none',
                    borderRadius: '25px',
                    height: '48px',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}
                >
                  SIGN UP
                </Button>
              </Form.Item>
            </Form>
          </div>
        )}
      </div>

      {/* Right Side - Form */}
      <div className={`col-md-6 ${isSignUp ? 'auth-left' : 'auth-right'} d-flex align-items-center justify-content-center`}>
        {isSignUp ? (
          <div className="text-center text-white p-5">
            <h1 style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '24px' }}>
              Hello Friend!
            </h1>
            <p style={{ fontSize: '18px', marginBottom: '32px', opacity: 0.9 }}>
              Enter your personal details and<br />start your journey with us
            </p>
            <Button 
              type="default"
              size="large"
              style={{ 
                background: 'transparent', 
                border: '2px solid white', 
                color: 'white',
                borderRadius: '25px',
                paddingLeft: '32px',
                paddingRight: '32px'
              }}
              onClick={() => setIsSignUp(false)}
            >
              SIGN IN
            </Button>
          </div>
        ) : (
          <div className="text-center p-5">
            <h1 style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '24px', color: '#E6A623' }}>
              Create Account
            </h1>
            <Form layout="vertical" onFinish={handleSignUp}>
              <Form.Item
                name="userName"
                rules={[{ required: true, message: 'Please enter your username!' }]}
              >
                <Input 
                  prefix={<UserOutlined />} 
                  placeholder="Username" 
                  size="large"
                  style={{ borderRadius: '8px', backgroundColor: '#F5F5F5', border: 'none' }}
                />
              </Form.Item>
              <Form.Item
                name="email"
                rules={[
                  { required: true, message: 'Please enter your email!' },
                  { type: 'email', message: 'Please enter a valid email!' }
                ]}
              >
                <Input 
                  prefix={<MailOutlined />} 
                  placeholder="Email" 
                  size="large"
                  style={{ borderRadius: '8px', backgroundColor: '#F5F5F5', border: 'none' }}
                />
              </Form.Item>
              <Form.Item
                name="password"
                rules={[
                  { required: true, message: 'Please enter your password!' },
                  { min: 6, message: 'Password must be at least 6 characters!' }
                ]}
              >
                <Input.Password 
                  prefix={<LockOutlined />} 
                  placeholder="Password" 
                  size="large"
                  iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                  style={{ borderRadius: '8px', backgroundColor: '#F5F5F5', border: 'none' }}
                />
              </Form.Item>
              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  size="large" 
                  block
                  loading={loading}
                  style={{ 
                    background: '#E6A623', 
                    border: 'none',
                    borderRadius: '25px',
                    height: '48px',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}
                >
                  SIGN UP
                </Button>
              </Form.Item>
            </Form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth;