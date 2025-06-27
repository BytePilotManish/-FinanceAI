import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Shield, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase/client';
import { securityService } from '../services/securityService';

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // 2FA states
  const [show2FA, setShow2FA] = useState(false);
  const [twoFACode, setTwoFACode] = useState('');
  const [verifying2FA, setVerifying2FA] = useState(false);
  const [tempUserData, setTempUserData] = useState<any>(null);
  
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        await signup(email, password, name);
        navigate('/');
      } else {
        // First, attempt login
        await login(email, password);
        
        // After successful login, check if 2FA is enabled
        try {
          const settings = await securityService.getSecuritySettings();
          console.log('2FA Status:', settings.twoFactorEnabled);
          
          if (settings.twoFactorEnabled) {
            // Store user data temporarily and show 2FA prompt
            const { data: userData } = await supabase.auth.getUser();
            setTempUserData(userData.user);
            setShow2FA(true);
            setLoading(false);
            return; // Don't navigate yet
          }
        } catch (settingsError) {
          console.error('Error checking 2FA settings:', settingsError);
          // If we can't check settings, proceed without 2FA for now
        }
        
        // If 2FA is not enabled or there was an error, proceed to dashboard
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication');
    } finally {
      if (!show2FA) {
        setLoading(false);
      }
    }
  };

  const handle2FAVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setVerifying2FA(true);

    try {
      const isValid = await securityService.verifyTwoFactorLogin(twoFACode);
      
      if (isValid) {
        // 2FA verification successful, proceed to dashboard
        navigate('/');
      } else {
        setError('Invalid verification code. Please try again.');
        setTwoFACode('');
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please try again.');
      setTwoFACode('');
    } finally {
      setVerifying2FA(false);
    }
  };

  const handleBack2FA = async () => {
    // Log out the user and return to login
    try {
      await supabase.auth.signOut();
      setShow2FA(false);
      setTwoFACode('');
      setTempUserData(null);
      setError('');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const socialIcons = [
    { name: 'google', icon: 'fa-google' },
    { name: 'facebook', icon: 'fa-facebook-f' },
    { name: 'github', icon: 'fa-github' },
    { name: 'linkedin', icon: 'fa-linkedin-in' }
  ];

  // 2FA Verification Page
  if (show2FA) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-[30px] shadow-lg w-[400px] max-w-full p-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-indigo-100 rounded-full">
                <Shield className="h-8 w-8 text-indigo-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Two-Factor Authentication</h1>
            </div>
            <p className="text-gray-600">
              Enter the 6-digit code from your authenticator app
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handle2FAVerification} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verification Code
              </label>
              <input
                type="text"
                value={twoFACode}
                onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl font-mono tracking-widest focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="000000"
                maxLength={6}
                required
                autoComplete="one-time-code"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-2 text-center">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>

            <button
              type="submit"
              disabled={verifying2FA || twoFACode.length !== 6}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {verifying2FA ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Verifying...
                </div>
              ) : (
                'Verify & Continue'
              )}
            </button>

            <button
              type="button"
              onClick={handleBack2FA}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Having trouble? Contact{' '}
              <a href="#" className="text-indigo-600 hover:text-indigo-700">
                support
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Regular Login/Signup Page
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-indigo-50 flex items-center justify-center p-4">
      <div className={`bg-white rounded-[30px] shadow-lg relative overflow-hidden w-[768px] max-w-full min-h-[480px] ${isSignUp ? 'active' : ''}`}>
        {/* Sign Up Form */}
        <div className={`absolute top-0 h-full transition-all duration-600 ease-in-out ${
          isSignUp ? 'translate-x-full opacity-100 z-5' : 'opacity-0 z-1'
        } w-1/2`}>
          <form onSubmit={handleSubmit} className="bg-white h-full flex flex-col items-center justify-center px-10">
            <h1 className="text-2xl font-bold mb-4">Create Account</h1>
            <div className="flex gap-3 my-5">
              {socialIcons.map((social) => (
                <a
                  key={social.name}
                  href="#"
                  className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
                >
                  <i className={`fa-brands ${social.icon}`}></i>
                </a>
              ))}
            </div>
            <span className="text-sm text-gray-500 mb-4">or use your email for registration</span>
            {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-100 border-none rounded-lg px-4 py-2.5 mb-2 text-sm outline-none"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-100 border-none rounded-lg px-4 py-2.5 mb-2 text-sm outline-none"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-100 border-none rounded-lg px-4 py-2.5 mb-4 text-sm outline-none"
              required
            />
            <button 
              disabled={loading}
              className="bg-indigo-600 text-white px-11 py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wide hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>
        </div>

        {/* Sign In Form */}
        <div className={`absolute top-0 h-full transition-all duration-600 ease-in-out ${
          isSignUp ? 'translate-x-full' : ''
        } w-1/2 z-2`}>
          <form onSubmit={handleSubmit} className="bg-white h-full flex flex-col items-center justify-center px-10">
            <h1 className="text-2xl font-bold mb-4">Sign In</h1>
            <div className="flex gap-3 my-5">
              {socialIcons.map((social) => (
                <a
                  key={social.name}
                  href="#"
                  className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
                >
                  <i className={`fa-brands ${social.icon}`}></i>
                </a>
              ))}
            </div>
            <span className="text-sm text-gray-500 mb-4">or use your email password</span>
            {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-100 border-none rounded-lg px-4 py-2.5 mb-2 text-sm outline-none"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-100 border-none rounded-lg px-4 py-2.5 mb-2 text-sm outline-none"
              required
            />
            <a href="#" className="text-sm text-gray-600 hover:text-gray-800 mb-4">Forgot Your Password?</a>
            <button 
              disabled={loading}
              className="bg-indigo-600 text-white px-11 py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wide hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Toggle Container */}
        <div className={`absolute top-0 left-1/2 w-1/2 h-full overflow-hidden transition-all duration-600 ease-in-out ${
          isSignUp ? '-translate-x-full rounded-r-[150px] rounded-l-[100px]' : 'rounded-l-[150px] rounded-r-[100px]'
        } z-1000`}>
          <div className={`bg-gradient-to-r from-indigo-600 to-indigo-800 text-white relative -left-full h-full w-[200%] transform ${
            isSignUp ? 'translate-x-1/2' : 'translate-x-0'
          } transition-all duration-600 ease-in-out`}>
            {/* Left Panel */}
            <div className={`absolute w-1/2 h-full flex flex-col items-center justify-center px-8 text-center ${
              isSignUp ? 'translate-x-0' : '-translate-x-[200%]'
            } transition-all duration-600 ease-in-out`}>
              <h1 className="text-2xl font-bold mb-4">Welcome Back!</h1>
              <p className="text-sm mb-6">Enter your personal details to use all of site features</p>
              <button
                onClick={() => setIsSignUp(false)}
                className="border-2 border-white bg-transparent text-white px-11 py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wide hover:bg-white/10 transition-colors"
              >
                Sign In
              </button>
            </div>

            {/* Right Panel */}
            <div className={`absolute right-0 w-1/2 h-full flex flex-col items-center justify-center px-8 text-center ${
              isSignUp ? 'translate-x-[200%]' : 'translate-x-0'
            } transition-all duration-600 ease-in-out`}>
              <h1 className="text-2xl font-bold mb-4">Hello, Friend!</h1>
              <p className="text-sm mb-6">Register with your personal details to use all of site features</p>
              <button
                onClick={() => setIsSignUp(true)}
                className="border-2 border-white bg-transparent text-white px-11 py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wide hover:bg-white/10 transition-colors"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;