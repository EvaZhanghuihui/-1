import React from 'react';
import { Camera, BookOpen, User, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, signOut } from '../lib/firebase';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'recognition' | 'workbook' | 'profile';
  onTabChange: (tab: 'recognition' | 'workbook' | 'profile') => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange }) => {
  const user = auth.currentUser;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-bottom border-slate-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
          <span className="bg-blue-600 text-white w-8 h-8 rounded-lg flex items-center justify-center">错</span>
          题打印机
        </h1>
        <div className="flex items-center gap-3">
          {user?.photoURL && (
            <img src={user.photoURL} alt="User" className="w-8 h-8 rounded-full border border-slate-200" />
          )}
          <button 
            onClick={() => onTabChange('profile')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <User className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 pt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-around">
        <NavButton 
          active={activeTab === 'recognition'} 
          onClick={() => onTabChange('recognition')}
          icon={<Camera className="w-6 h-6" />}
          label="拍照识别"
        />
        <NavButton 
          active={activeTab === 'workbook'} 
          onClick={() => onTabChange('workbook')}
          icon={<BookOpen className="w-6 h-6" />}
          label="错题本"
        />
      </nav>

      {/* Profile Sidebar (Optional simple modal-like view) */}
      {activeTab === 'profile' && (
        <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex justify-end">
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            className="w-72 bg-white h-full shadow-2xl p-8"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold">个人信息</h2>
              <button onClick={() => onTabChange('recognition')} className="p-2 hover:bg-slate-100 rounded-full">
                <LogOut className="w-5 h-5" onClick={signOut} />
              </button>
            </div>
            
            <div className="flex flex-col items-center mb-8">
               <img src={user?.photoURL || ''} className="w-20 h-20 rounded-full mb-4 border-4 border-slate-100" />
               <p className="font-bold text-lg">{user?.displayName}</p>
               <p className="text-slate-500 text-sm">{user?.email}</p>
            </div>

            <button 
              onClick={signOut}
              className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-bold flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              退出登录
            </button>
          </motion.div>
          <div className="flex-1" onClick={() => onTabChange('recognition')}></div>
        </div>
      )}
    </div>
  );
};

const NavButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1 transition-colors ${active ? 'text-blue-600' : 'text-slate-400'}`}
  >
    <div className={`p-2 rounded-xl transition-colors ${active ? 'bg-blue-50' : 'bg-transparent'}`}>
      {icon}
    </div>
    <span className="text-xs font-bold">{label}</span>
  </button>
);
