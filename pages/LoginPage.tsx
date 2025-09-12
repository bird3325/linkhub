
import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { LogoIcon } from '../components/icons/Icons';

const LoginPage: React.FC = () => {
  const { login, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const [saveId, setSaveId] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login();
  };

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="bg-indigo-50 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        
        <div className="text-center">
            <Link to="/" className="inline-block">
                <LogoIcon className="h-12 w-auto text-[#4F46E5]" />
            </Link>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                LinkHub에 로그인
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
                계정이 없으신가요?{' '}
                <Link to="/signup" className="font-medium text-[#4F46E5] hover:text-[#4338CA]">
                    가입하기
                </Link>
            </p>
        </div>

        <div className="bg-white p-8 shadow-xl rounded-2xl">
            <form className="space-y-6" onSubmit={handleLogin}>
                <div>
                    <label htmlFor="email-address" className="block text-sm font-medium text-gray-700">
                        이메일 주소
                    </label>
                    <div className="mt-1">
                        <input 
                          id="email-address" 
                          name="email" 
                          type="email" 
                          autoComplete="email" 
                          required 
                          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#4F46E5] focus:border-[#4F46E5] sm:text-sm" 
                          placeholder="you@example.com" 
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="password"className="block text-sm font-medium text-gray-700">
                        비밀번호
                    </label>
                    <div className="mt-1">
                        <input 
                          id="password" 
                          name="password" 
                          type="password" 
                          autoComplete="current-password" 
                          required 
                          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#4F46E5] focus:border-[#4F46E5] sm:text-sm" 
                          placeholder="Password" 
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                            <input
                                id="save-id"
                                name="save-id"
                                type="checkbox"
                                checked={saveId}
                                onChange={(e) => setSaveId(e.target.checked)}
                                className="h-4 w-4 text-[#4F46E5] focus:ring-[#4F46E5] border-gray-300 rounded"
                            />
                            <label htmlFor="save-id" className="ml-2 block text-sm text-gray-900">
                                아이디 저장
                            </label>
                        </div>
                        <div className="flex items-center">
                            <input
                                id="remember-me"
                                name="remember-me"
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="h-4 w-4 text-[#4F46E5] focus:ring-[#4F46E5] border-gray-300 rounded"
                            />
                            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                                로그인 유지하기
                            </label>
                        </div>
                    </div>
                    <div className="text-sm">
                        <a href="#" className="font-medium text-[#4F46E5] hover:text-[#4338CA]">
                            비밀번호를 잊으셨나요?
                        </a>
                    </div>
                </div>

                <div>
                    <button 
                      type="submit" 
                      className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-[#4F46E5] hover:bg-[#4338CA] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4F46E5] transition-transform transform hover:scale-105"
                    >
                        로그인
                    </button>
                </div>
            </form>
        </div>
         <p className="mt-6 text-center text-xs text-gray-500">
            <Link to="/" className="hover:underline">Powered by LinkHub</Link>
         </p>
      </div>
    </div>
  );
};

export default LoginPage;
