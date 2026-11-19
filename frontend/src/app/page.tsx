'use client';

import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { Search, Terminal, Users, BookOpen, AlertCircle, Loader2, GitBranch } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface GitHubProfile {
  username: string;
  name: string;
  avatar_url: string;
  bio: string;
  public_repos: number;
  followers: number;
  following: number;
}

interface LanguageData {
  name: string;
  value: number;
}

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

export default function Home() {
  const [username, setUsername] = useState('');
  const [profile, setProfile] = useState<GitHubProfile | null>(null);
  const [languages, setLanguages] = useState<LanguageData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [wsMessage, setWsMessage] = useState<string>('');
  
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (profile) {
      if (wsRef.current) {
        wsRef.current.close();
      }

      const wsBaseUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://127.0.0.1:8000/ws';
      const wsUrl = `${wsBaseUrl}/github/${profile.username}/`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        ws.send(JSON.stringify({ message: 'Hello from client!' }));
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'ping') {
          setWsMessage(data.message);
        }
        
        if (data.type === 'update' && data.data) {
          setProfile(prev => prev ? { ...prev, ...data.data } : null);
          setWsMessage('Real-time update received!');
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket Error:', error);
      };

      wsRef.current = ws;

      return () => {
        ws.close();
      };
    }
  }, [profile?.username]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setLoading(true);
    setError('');
    setProfile(null);
    setLanguages([]);
    setWsMessage('');

    try {
      const [profileRes, languagesRes] = await Promise.all([
        api.get(`/github/${username}/`),
        api.get(`/github/${username}/languages/`)
      ]);
      
      if (profileRes.data.error) {
        setError(profileRes.data.error);
      } else {
        setProfile(profileRes.data);
        setLanguages(languagesRes.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch GitHub profile. Check network or rate limits.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-6 md:p-12 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        <header className="mb-12 text-center mt-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white flex items-center justify-center gap-4 tracking-tight">
            <Terminal className="w-10 h-10 text-blue-500" />
            Dev Analytics Dashboard
          </h1>
          <p className="text-slate-400 mt-4 text-lg max-w-xl mx-auto">
            Search any public GitHub profile and visualize their statistics in real-time.
          </p>
        </header>

        <form onSubmit={handleSearch} className="mb-12 flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter GitHub username (e.g., torvalds)"
              className="w-full pl-12 pr-4 py-4 rounded-xl bg-slate-900/50 border border-slate-800 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-sm backdrop-blur-sm"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Analyze'}
          </button>
        </form>

        {error && (
          <div className="bg-red-500/10 text-red-400 p-4 rounded-xl flex items-center gap-3 mb-8 border border-red-500/20 max-w-2xl mx-auto">
            <AlertCircle className="w-6 h-6 shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {profile && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            <div className="lg:col-span-1 bg-slate-900/80 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col">
              <div className="p-8 flex flex-col items-center text-center border-b border-slate-800">
                <img
                  src={profile.avatar_url}
                  alt={profile.username}
                  className="w-32 h-32 rounded-full border-4 border-slate-800 shadow-xl ring-2 ring-blue-500/20 mb-4"
                />
                <h2 className="text-2xl font-bold text-white">{profile.name || profile.username}</h2>
                <p className="text-blue-400 font-medium tracking-wide">@{profile.username}</p>
                {profile.bio && <p className="text-slate-400 mt-4 text-sm leading-relaxed">{profile.bio}</p>}
              </div>

              <div className="grid grid-cols-3 divide-x divide-slate-800 bg-slate-900/40 mt-auto">
                <a 
                  href={`https://github.com/${profile.username}?tab=repositories`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-4 flex flex-col items-center group hover:bg-slate-800/50 transition-colors cursor-pointer"
                >
                  <GitBranch className="w-5 h-5 text-slate-500 mb-1 group-hover:text-blue-400 transition-colors" />
                  <span className="text-xl font-bold text-white group-hover:underline">{profile.public_repos}</span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Repos</span>
                </a>
                <a 
                  href={`https://github.com/${profile.username}?tab=followers`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-4 flex flex-col items-center group hover:bg-slate-800/50 transition-colors cursor-pointer"
                >
                  <Users className="w-5 h-5 text-slate-500 mb-1 group-hover:text-blue-400 transition-colors" />
                  <span className="text-xl font-bold text-white group-hover:underline">{profile.followers}</span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Followers</span>
                </a>
                <a 
                  href={`https://github.com/${profile.username}?tab=following`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-4 flex flex-col items-center group hover:bg-slate-800/50 transition-colors cursor-pointer"
                >
                  <Users className="w-5 h-5 text-slate-500 mb-1 group-hover:text-blue-400 transition-colors" />
                  <span className="text-xl font-bold text-white group-hover:underline">{profile.following}</span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Following</span>
                </a>
              </div>

              <div className="p-3 bg-black/40 border-t border-slate-800 font-mono text-[10px] flex items-center justify-center gap-2">
                <div className={`w-2 h-2 rounded-full ${wsMessage ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
                <span className={wsMessage ? 'text-green-400' : 'text-yellow-400'}>
                  {wsMessage ? wsMessage : 'Connecting...'}
                </span>
              </div>
            </div>

            <div className="lg:col-span-2 bg-slate-900/80 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-800 p-8 flex flex-col">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-500" />
                Top Languages
              </h3>
              
              {languages.length > 0 ? (
                <div className="flex-1 min-h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={languages}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {languages.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-500">
                  No language data available for this user.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
