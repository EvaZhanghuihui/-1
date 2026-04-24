import React, { useEffect, useState } from 'react';
import { auth, signInWithGoogle } from '../lib/firebase';
import { User } from 'firebase/auth';
import { LogIn, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <p className="mt-4 text-slate-600 font-medium">正在初始化...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 text-center"
        >
          <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <LogIn className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">欢迎来到错题打印机</h1>
          <p className="text-slate-500 mb-8">请先登录以保存您的错题本</p>
          
          <button
            onClick={signInWithGoogle}
            className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-3 active:scale-95 shadow-lg shadow-blue-200"
          >
            <LogIn className="w-5 h-5" />
            使用 Google 账号登录
          </button>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
};
