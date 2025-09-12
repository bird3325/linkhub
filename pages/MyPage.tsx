
import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import PublicProfileContent from '../components/PublicProfileContent';
import { AuthContext } from '../contexts/AuthContext';
import { LinkContext } from '../contexts/LinkContext';

const MyPage: React.FC = () => {
    const { user } = useContext(AuthContext);
    const { links } = useContext(LinkContext);

    if (!user) {
        return (
            <div className="bg-gray-100 min-h-screen">
                <Header />
                <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 64px)' }}>
                    <p>Loading user profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen">
            <Header />
            <div className="flex-1 overflow-y-auto">
                <PublicProfileContent user={user} links={links} />
                <footer className="text-center py-4">
                    <Link to="/" className="text-gray-500 font-semibold hover:text-[#4F46E5]">Powered by LinkHub</Link>
                </footer>
            </div>
        </div>
    );
};

export default MyPage;
