import { useState } from 'react';
import { AuthGuard } from './components/AuthGuard';
import { Layout } from './components/Layout';
import { RecognitionView } from './components/RecognitionView';
import { WorkbookView } from './components/WorkbookView';

export default function App() {
  const [activeTab, setActiveTab] = useState<'recognition' | 'workbook' | 'profile'>('recognition');

  return (
    <AuthGuard>
      <Layout activeTab={activeTab} onTabChange={setActiveTab}>
        {activeTab === 'recognition' && <RecognitionView />}
        {activeTab === 'workbook' && <WorkbookView />}
        {activeTab === 'profile' && (
           <div className="flex items-center justify-center h-64 text-slate-400 italic">
              个人信息已集成在侧边栏。
           </div>
        )}
      </Layout>
    </AuthGuard>
  );
}
