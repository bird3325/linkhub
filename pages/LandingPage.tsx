
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { KakaoIcon, LogoIcon } from '../components/icons/Icons';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="py-4 px-6 md:px-12">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <LogoIcon className="h-8 w-8 text-[#4F46E5]" />
            <span className="font-bold text-2xl text-gray-800">LinkHub</span>
          </div>
          <button onClick={() => navigate('/login')} className="bg-white text-gray-700 font-semibold py-2 px-4 rounded-lg flex items-center space-x-2 hover:bg-gray-100 transition border border-gray-300">
            <span>로그인</span>
          </button>
        </div>
      </header>

      <main className="container mx-auto px-6 md:px-12 py-16 md:py-24 text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight">
          모든 링크를 하나로, <br className="hidden md:block" />
          <span className="text-[#4F46E5]">간단하게</span> 관리하세요
        </h1>
        <p className="mt-6 text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
          LinkHub는 여러 SNS와 웹사이트 링크를 하나의 페이지에서 보여주는 가장 쉬운 방법입니다. 지금 바로 시작해보세요!
        </p>
        <button onClick={() => navigate('/login')} className="mt-8 bg-[#4F46E5] text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-[#4338CA] transition transform hover:scale-105">
          3분만에 시작하기
        </button>

        <div className="mt-16 md:mt-24 flex justify-center">
          <div className="bg-white p-4 rounded-3xl shadow-2xl w-full max-w-sm">
            <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-6 text-white text-center">
              <img src="https://picsum.photos/id/237/100/100" alt="Profile" className="w-24 h-24 rounded-full mx-auto border-4 border-white shadow-lg" />
              <h2 className="mt-4 text-xl font-bold">@username</h2>
              <p className="mt-2 text-sm opacity-90">
                🙋‍♀️ 안녕하세요! 크리에이터 김링크입니다
              </p>
              <div className="mt-6 space-y-4">
                <div className="bg-white/20 hover:bg-white/30 text-white font-semibold py-3 px-5 rounded-lg transition">📸 인스타그램</div>
                <div className="bg-white/20 hover:bg-white/30 text-white font-semibold py-3 px-5 rounded-lg transition">📹 유튜브 채널</div>
                <div className="bg-white/20 hover:bg-white/30 text-white font-semibold py-3 px-5 rounded-lg transition">📝 네이버 블로그</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-8 text-center text-gray-500">
        Powered by LinkHub
      </footer>
    </div>
  );
};

export default LandingPage;