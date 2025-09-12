import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { LogoIcon } from '../components/icons/Icons';

const LoginPage: React.FC = () => {
  const { login, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [saveId, setSaveId] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // 비밀번호 해시 함수 (회원가입시와 동일한 방식)
  const hashPassword = async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  };

  const validateEmail = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('이메일과 비밀번호를 모두 입력해주세요.');
      setLoading(false);
      return;
    }

    if (!validateEmail()) {
      setError('유효한 이메일 주소를 입력해주세요.');
      setLoading(false);
      return;
    }

    try {
      // 비밀번호 해시화
      const passwordHash = await hashPassword(password);

      // 구글 앱스 스크립트 URL
      const scriptUrl = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL;
      if (!scriptUrl) {
        throw new Error('로그인 서비스 URL이 설정되지 않았습니다.');
      }

      // 로그인 요청 데이터
      const loginData = {
        email,
        passwordHash,
        action: 'login'
      };

      console.log('로그인 요청:', loginData);

      const response = await fetch(scriptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(loginData),
      });

      console.log('응답 상태:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`서버 오류 (${response.status}): ${errorText || response.statusText}`);
      }

      const responseText = await response.text();
      console.log('응답 내용:', responseText);

      if (!responseText) {
        throw new Error('서버에서 빈 응답을 받았습니다.');
      }

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error(`응답 파싱 오류: ${responseText}`);
      }

      if (result.success) {
        // 로그인 성공
        if (saveId) {
          localStorage.setItem('savedEmail', email);
        } else {
          localStorage.removeItem('savedEmail');
        }

        // 사용자 정보를 로컬 스토리지에 저장 (필요한 경우)
        if (result.user) {
          localStorage.setItem('userInfo', JSON.stringify(result.user));
        }

        login(); // AuthContext의 로그인 함수 호출
      } else {
        setError(result.message || '로그인에 실패했습니다.');
      }
    } catch (err: any) {
      console.error('로그인 오류:', err);
      setError(err.message || '로그인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 저장된 이메일 불러오기
  useEffect(() => {
    const savedEmail = localStorage.getItem('savedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setSaveId(true);
    }
  }, []);

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
            {error && (
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md text-center">{error}</p>
            )}
            
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#4F46E5] focus:border-[#4F46E5] sm:text-sm"
                  placeholder="you@example.com"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                비밀번호
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#4F46E5] focus:border-[#4F46E5] sm:text-sm"
                  placeholder="Password"
                  disabled={loading}
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
                    disabled={loading}
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
                    disabled={loading}
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
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-[#4F46E5] hover:bg-[#4338CA] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4F46E5] transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? '로그인 중...' : '로그인'}
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
