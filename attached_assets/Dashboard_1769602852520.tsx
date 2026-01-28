
import React from 'react';
import { Language } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

interface DashboardProps {
  languages: Language[];
  onLanguageSelect: (lang: Language) => void;
}

const DATA = [
  { name: 'Mon', hours: 1.5 },
  { name: 'Tue', hours: 2.1 },
  { name: 'Wed', hours: 0.8 },
  { name: 'Thu', hours: 3.2 },
  { name: 'Fri', hours: 1.2 },
  { name: 'Sat', hours: 4.5 },
  { name: 'Sun', hours: 2.8 },
];

const Dashboard: React.FC<DashboardProps> = ({ languages, onLanguageSelect }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 md:col-span-2 glass rounded-3xl p-8 shadow-sm">
          <h3 className="text-xl font-bold mb-6 text-slate-800">Learning Activity</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={DATA}>
                <defs>
                  <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Area type="monotone" dataKey="hours" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorHours)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-3xl p-8 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2 text-slate-800">Streak</h3>
            <p className="text-slate-500 mb-6">You're on fire!</p>
            <div className="flex items-center justify-center py-4">
              <div className="relative">
                <div className="text-6xl font-black text-orange-500">14</div>
                <div className="text-sm font-bold uppercase tracking-widest text-orange-400 absolute -bottom-4 left-1/2 -translate-x-1/2">Days</div>
              </div>
            </div>
          </div>
          <div className="mt-8 space-y-4">
            <div className="flex justify-between items-center text-sm font-medium">
              <span className="text-slate-500">Next milestone</span>
              <span className="text-indigo-600">20 days</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full">
              <div className="h-full bg-orange-400 rounded-full" style={{ width: '70%' }}></div>
            </div>
          </div>
        </div>
      </div>

      <section>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-slate-800">My Languages</h3>
          <button className="text-indigo-600 font-semibold text-sm hover:underline">
            <i className="fas fa-plus mr-1"></i> Add New
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {languages.map((lang) => (
            <div 
              key={lang.code}
              onClick={() => onLanguageSelect(lang)}
              className="group glass rounded-3xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer border-transparent hover:border-indigo-100"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-sm group-hover:scale-110 transition-transform">
                  {lang.flag}
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase tracking-tight ${
                  lang.level === 'Native' ? 'bg-green-100 text-green-700' : 'bg-indigo-100 text-indigo-700'
                }`}>
                  {lang.level}
                </span>
              </div>
              <h4 className="font-bold text-lg text-slate-800">{lang.name}</h4>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Mastery</span>
                  <span className="font-bold text-slate-700">{lang.progress}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 rounded-full transition-all duration-1000" 
                    style={{ width: `${lang.progress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass rounded-3xl p-8">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <i className="fas fa-trophy text-yellow-500"></i>
            Top Polyglots
          </h3>
          <div className="space-y-4">
            {[
              { name: 'Jin-woo K.', points: 15420, img: 'https://picsum.photos/id/10/40/40' },
              { name: 'Sarah Miller', points: 14200, img: 'https://picsum.photos/id/20/40/40' },
              { name: 'Leo Martinez', points: 12900, img: 'https://picsum.photos/id/30/40/40' },
            ].map((u, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-colors">
                <span className="font-bold text-slate-400 w-4">{i + 1}</span>
                <img src={u.img} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" alt="" />
                <div className="flex-1">
                  <p className="font-bold text-slate-800">{u.name}</p>
                  <p className="text-xs text-slate-500">{u.points.toLocaleString()} points</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-2xl font-bold mb-4">Daily Tip</h3>
            <p className="text-slate-400 leading-relaxed italic">
              "To learn a new language, focus first on the most frequent 1,000 words. They cover about 75% of daily conversation."
            </p>
            <button className="mt-6 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-full font-bold transition-colors">
              Read More
            </button>
          </div>
          <i className="fas fa-quote-right absolute top-4 right-4 text-8xl text-white/5"></i>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
