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

    const handleSignUp = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const isEmailValid = validateEmail();
        const isPhoneValid = validatePhone();

        if (!isEmailValid || !isPhoneValid || !name || !password || !confirmPassword) {
            return;
        }

        if (password !== confirmPassword) {
            setError('비밀번호가 일치하지 않습니다.');
            return;
        }

        // Simulate successful signup and log the user in
        console.log('New user signed up:', { email, name, phone });
        login();
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
                        LinkHub에 가입하기
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
                        {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md text-center">{error}</p>}
                        <div>
                            <label htmlFor="email-address" className="block text-sm font-medium text-gray-700">이메일 주소</label>
                            <div className="mt-1">
                                <input id="email-address" name="email" type="email" autoComplete="email" required
                                    value={email} onChange={handleEmailChange} onBlur={validateEmail}
                                    className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none sm:text-sm ${emailError ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-[#4F46E5] focus:border-[#4F46E5]'}`}
                                    placeholder="you@example.com" />
                            </div>
                            {emailError && <p className="mt-1 text-sm text-red-600">{emailError}</p>}
                        </div>

                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">이름</label>
                            <div className="mt-1">
                                <input id="name" name="name" type="text" autoComplete="name" required
                                    value={name} onChange={(e) => setName(e.target.value)}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#4F46E5] focus:border-[#4F46E5] sm:text-sm"
                                    placeholder="홍길동" />
                            </div>
                        </div>
                        
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">휴대전화번호</label>
                            <div className="mt-1">
                                <input id="phone" name="phone" type="tel" autoComplete="tel" required
                                    value={phone} onChange={handlePhoneChange} onBlur={validatePhone}
                                    className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none sm:text-sm ${phoneError ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-[#4F46E5] focus:border-[#4F46E5]'}`}
                                    placeholder="010-1234-5678" />
                            </div>
                            {phoneError && <p className="mt-1 text-sm text-red-600">{phoneError}</p>}
                        </div>

                        <div>
                            <label htmlFor="password"className="block text-sm font-medium text-gray-700">비밀번호</label>
                            <div className="mt-1">
                                <input id="password" name="password" type="password" autoComplete="new-password" required
                                    value={password} onChange={(e) => setPassword(e.target.value)}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#4F46E5] focus:border-[#4F46E5] sm:text-sm"
                                    placeholder="Password" />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="confirm-password"className="block text-sm font-medium text-gray-700">비밀번호 확인</label>
                            <div className="mt-1">
                                <input id="confirm-password" name="confirm-password" type="password" autoComplete="new-password" required
                                    value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#4F46E5] focus:border-[#4F46E5] sm:text-sm"
                                    placeholder="Confirm Password" />
                            </div>
                        </div>

                        <div>
                            <button type="submit"
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-[#4F46E5] hover:bg-[#4338CA] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4F46E5] transition-transform transform hover:scale-105">
                                가입하기
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

export default SignUpPage;