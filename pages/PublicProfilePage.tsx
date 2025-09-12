
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MOCK_USER, MOCK_LINKS } from '../constants';
import type { User, Link } from '../types';
import PublicProfileContent from '../components/PublicProfileContent';

const PublicProfilePage: React.FC = () => {
    const { username } = useParams<{ username: string }>();
    const [user, setUser] = useState<User | null>(null);
    const [links, setLinks] = useState<Link[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Simulate fetching data for the user
        setLoading(true);
        if (username === MOCK_USER.username) {
            setUser(MOCK_USER);
            setLinks(MOCK_LINKS.filter(l => l.isActive).sort((a,b) => a.order - b.order));
            setError(null);
        } else {
            setError('User not found.');
        }
        setLoading(false);
    }, [username]);

    if (loading) {
        return <div className="flex items-center justify-center h-screen">Loading...</div>;
    }

    if (error || !user) {
        return <div className="flex items-center justify-center h-screen">{error}</div>;
    }

    return (
        <div className="min-h-screen">
             <PublicProfileContent user={user} links={links} />
             <footer className="text-center py-4">
                <a href="#/" className="text-gray-500 font-semibold hover:text-[#4F46E5]">Powered by LinkHub</a>
             </footer>
        </div>
    );
};

export default PublicProfilePage;
