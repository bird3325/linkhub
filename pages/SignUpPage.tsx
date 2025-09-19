import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { LogoIcon } from '../components/icons/Icons';

const SignUpPage: React.FC = () => {
  const { login, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateEmail = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('이메일 주소를 입력해주세요.');
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError('유효한 이메일 주소를 입력해주세요.');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePhone = () => {
    const phoneRegex = /^01([0|1|6|7|8|9])\d{3,4}\d{4}$/;
    if (!phone) {
      setPhoneError('휴대전화번호를 입력해주세요.');
      return false;
    }
    if (!phoneRegex.test(phone.replace(/\D/g, ''))) {
      setPhoneError('유효한 휴대전화번호 형식이 아닙니다.');
      return false;
    }
    setPhoneError('');
    return true;
  };

  // 비밀번호 해시 함수 (bcrypt 대신 브라우저 내장 함수 사용)
  const hashPassword = async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const isEmailValid = validateEmail();
    const isPhoneValid = validatePhone();

    if (!isEmailValid || !isPhoneValid || !name || !password || !confirmPassword) {
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      setLoading(false);
      return;
    }

    try {
      // 비밀번호 해시화
      const passwordHash = await hashPassword(password);

      // 클라이언트 IP 조회
      let clientIp = '';
      try {
        const ipRes = await fetch('https://api.ipify.org?format=json');
        if (ipRes.ok) {
          const ipData = await ipRes.json();
          clientIp = ipData.ip || '';
        }
      } catch (ipError) {
        console.warn('IP 조회 실패:', ipError);
      }

      // 구글 앱스 스크립트 URL
      const scriptUrl = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL;
      if (!scriptUrl) {
        throw new Error('앱스 스크립트 URL이 설정되지 않았습니다.');
      }

      // IP를 URL 파라미터로 추가
      const urlWithParams = clientIp ? `${scriptUrl}?ip=${encodeURIComponent(clientIp)}` : scriptUrl;

      console.log('요청 URL:', urlWithParams);

      // 요청 데이터 준비
      const requestData = {
        email,
        name,
        phone,
        passwordHash,
        userAgent: navigator.userAgent,
      };

      console.log('요청 데이터:', requestData);

      const response = await fetch(urlWithParams, {
        method: 'POST',
        // Apps Script 웹 앱은 CORS를 피하기 위해 이 형식을 사용하는 경우가 많습니다.
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(requestData),
      });

      console.log('응답 상태:', response.status, response.statusText);

      // 응답 상태 체크
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`서버 오류 (${response.status}): ${errorText || response.statusText}`);
      }

      // 응답 본문 체크
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
        alert('회원가입이 성공적으로 완료되었습니다.');
        login(); // 로그인 처리
      } else {
        setError(result.message || '회원가입 중 오류가 발생했습니다.');
      }
    } catch (err: any) {
      console.error('회원가입 오류:', err);
      setError(err.message || '회원가입 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (emailError) {
      setEmailError('');
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');

    if (rawValue.length > 11) return;

    let formattedValue = '';
    const len = rawValue.length;

    if (len <= 3) {
      formattedValue = rawValue;
    } else if (len <= 7) {
      formattedValue = `${rawValue.slice(0, 3)}-${rawValue.slice(3)}`;
    } else if (len <= 10) {
      formattedValue = `${rawValue.slice(0, 3)}-${rawValue.slice(3, 6)}-${rawValue.slice(6)}`;
    } else {
      formattedValue = `${rawValue.slice(0, 3)}-${rawValue.slice(3, 7)}-${rawValue.slice(7)}`;
    }

    setPhone(formattedValue);
    if (phoneError) {
      setPhoneError('');
    }
  };

  return (
    <div className="bg-indigo-50 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link to="/" className="inline-block">
            <LogoIcon className="h-12 w-auto text-[#4F46E5]" />
          </Link>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            linkitda에 가입하기
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            이미 계정이 있으신가요?{' '}
            <Link to="/login" className="font-medium text-[#4F46E5] hover:text-[#4338CA]">
              로그인
            </Link>
          </p>
        </div>

        <div className="bg-white p-8 shadow-xl rounded-2xl">
          <form className="space-y-4" onSubmit={handleSignUp}>
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
                  onChange={handleEmailChange}
                  onBlur={validateEmail}
                  className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none sm:text-sm ${
                    emailError
                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-[#4F46E5] focus:border-[#4F46E5]'
                  }`}
                  placeholder="you@example.com"
                  disabled={loading}
                />
              </div>
              {emailError && <p className="mt-1 text-sm text-red-600">{emailError}</p>}
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                이름
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#4F46E5] focus:border-[#4F46E5] sm:text-sm"
                  placeholder="홍길동"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                휴대전화번호
              </label>
              <div className="mt-1">
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  value={phone}
                  onChange={handlePhoneChange}
                  onBlur={validatePhone}
                  className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none sm:text-sm ${
                    phoneError
                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-[#4F46E5] focus:border-[#4F46E5]'
                  }`}
                  placeholder="010-1234-5678"
                  disabled={loading}
                />
              </div>
              {phoneError && <p className="mt-1 text-sm text-red-600">{phoneError}</p>}
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
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#4F46E5] focus:border-[#4F46E5] sm:text-sm"
                  placeholder="Password"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                비밀번호 확인
              </label>
              <div className="mt-1">
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#4F46E5] focus:border-[#4F46E5] sm:text-sm"
                  placeholder="Confirm Password"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-[#4F46E5] hover:bg-[#4338CA] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4F46E5] transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? '가입 중...' : '가입하기'}
              </button>
            </div>
          </form>
        </div>
        <p className="mt-6 text-center text-xs text-gray-500">
          <Link to="/" className="hover:underline">
            Powered by linkitda
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignUpPage;
