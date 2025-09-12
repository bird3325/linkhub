import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

const AccountEditPage: React.FC = () => {
    const { user, setUser } = useContext(AuthContext);
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [phoneError, setPhoneError] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        if (user) {
            setName(user.name);
            setPhone(user.phone);
        }
    }, [user]);

    const validatePhone = () => {
        if (!phone) { // Allow empty phone number
            setPhoneError('');
            return true;
        }
        const phoneRegex = /^01([0|1|6|7|8|9])\d{3,4}\d{4}$/;
        if (!phoneRegex.test(phone.replace(/\D/g, ''))) {
            setPhoneError('유효한 휴대전화번호 형식이 아닙니다.');
            return false;
        }
        setPhoneError('');
        return true;
    };

    const handleInfoSave = () => {
        if (!user || !setUser) return;

        if (!validatePhone()) {
            return;
        }
        
        setUser({ ...user, name, phone });

        alert('회원 정보가 성공적으로 업데이트되었습니다.');
    };

    const handlePasswordChange = (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            alert('새 비밀번호가 일치하지 않습니다.');
            return;
        }
        if (newPassword.length < 6) {
            alert('비밀번호는 6자 이상이어야 합니다.');
            return;
        }
        // In a real app, you'd make an API call here.
        alert('비밀번호가 성공적으로 변경되었습니다.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
    };
    
    if (!user) {
        return <div>사용자 정보를 불러오는 중입니다...</div>;
    }
    
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
        <div className="bg-gray-100 min-h-screen">
            <div className="bg-white shadow-sm sticky top-0 z-20">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <h1 className="text-xl font-bold text-gray-800">회원정보 수정</h1>
                        <div>
                            <button onClick={() => navigate('/dashboard')} className="text-sm font-medium text-gray-600 hover:text-gray-900">돌아가기</button>
                        </div>
                    </div>
                </div>
            </div>
            <main className="container mx-auto p-4 sm:p-6 lg:px-8 py-8">
                 <div className="max-w-3xl mx-auto space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow">
                         <div className="flex justify-between items-center border-b pb-4 mb-4">
                            <h3 className="text-lg font-bold text-gray-900">기본 정보</h3>
                            <button onClick={handleInfoSave} className="bg-[#4F46E5] text-white font-semibold py-2 px-4 rounded-lg text-sm hover:bg-[#4338CA]">정보 저장</button>
                         </div>
                         <div className="space-y-6">
                            <div>
                                <label htmlFor="email" className="text-base font-bold text-gray-800">이메일 주소</label>
                                <input id="email" type="email" value={user.email} readOnly className="mt-2 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100 text-gray-500 sm:text-sm"/>
                                <p className="mt-1 text-xs text-gray-500">이메일 주소는 변경할 수 없습니다.</p>
                            </div>
                            <div>
                                <label htmlFor="name" className="text-base font-bold text-gray-800">이름</label>
                                <input id="name" type="text" value={name} onChange={e => setName(e.target.value)} className="mt-2 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#4F46E5] focus:border-[#4F46E5] sm:text-sm"/>
                            </div>
                            <div>
                                <label htmlFor="phone" className="text-base font-bold text-gray-800">휴대전화번호</label>
                                <input id="phone" type="tel" value={phone} onChange={handlePhoneChange} onBlur={validatePhone} className={`mt-2 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none sm:text-sm ${phoneError ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-[#4F46E5] focus:border-[#4F46E5]'}`}/>
                                {phoneError && <p className="mt-1 text-sm text-red-600">{phoneError}</p>}
                            </div>
                        </div>
                    </div>
                     <div className="bg-white p-6 rounded-lg shadow">
                        <form onSubmit={handlePasswordChange}>
                             <div className="flex justify-between items-center border-b pb-4 mb-4">
                                <h3 className="text-lg font-bold text-gray-900">비밀번호 변경</h3>
                                <button type="submit" className="bg-gray-800 text-white font-semibold py-2 px-4 rounded-lg text-sm hover:bg-gray-700">비밀번호 변경</button>
                             </div>
                             <div className="space-y-4">
                                <div>
                                    <label htmlFor="current-password"className="block text-sm font-medium text-gray-700">현재 비밀번호</label>
                                    <input id="current-password" name="current-password" type="password" required value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#4F46E5] focus:border-[#4F46E5] sm:text-sm" />
                                </div>
                                <div>
                                    <label htmlFor="new-password"className="block text-sm font-medium text-gray-700">새 비밀번호</label>
                                    <input id="new-password" name="new-password" type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)} className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#4F46E5] focus:border-[#4F46E5] sm:text-sm" />
                                </div>
                                <div>
                                    <label htmlFor="confirm-password"className="block text-sm font-medium text-gray-700">새 비밀번호 확인</label>
                                    <input id="confirm-password" name="confirm-password" type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#4F46E5] focus:border-[#4F46E5] sm:text-sm" />
                                </div>
                             </div>
                         </form>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AccountEditPage;