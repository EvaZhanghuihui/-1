import React, { useState, useEffect } from 'react';
import { Trash2, Calendar, ChevronRight, CheckCircle2, History, Filter, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { firebaseService } from '../services/firebaseService';
import { QuestionRecord } from '../types';
import { auth } from '../lib/firebase';
import { PDFExport } from './PDFExport';
import ReactMarkdown from 'react-markdown';

export const WorkbookView: React.FC = () => {
  const [records, setRecords] = useState<QuestionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setLoading(true);
    try {
      const data = await firebaseService.getRecords(user.uid);
      setRecords(data);
    } catch (error) {
      console.error("Fetch failed", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleAll = () => {
    if (selectedIds.size === filteredRecords.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRecords.map(r => r.id!)));
    }
  };

  const deleteSelected = async () => {
    if (!window.confirm("确定要删除所选题目吗？")) return;
    try {
      await Promise.all(Array.from(selectedIds).map(id => firebaseService.deleteRecord(id)));
      setSelectedIds(new Set());
      fetchRecords();
    } catch (error) {
       console.error("Delete failed", error);
    }
  };

  const filteredRecords = records.filter(r => 
    r.knowledgePoint.includes(search) || 
    r.subject.includes(search) || 
    r.originalQuestion.includes(search)
  );

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="relative w-full md:w-64">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
           <input 
             value={search}
             onChange={e => setSearch(e.target.value)}
             placeholder="搜索知识点、学科..." 
             className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all font-medium"
           />
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          {selectedIds.size > 0 && (
            <>
              <button 
                onClick={deleteSelected}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-all"
              >
                <Trash2 className="w-4 h-4" /> 删除 ({selectedIds.size})
              </button>
              <PDFExport 
                records={records.filter(r => selectedIds.has(r.id!))} 
                onComplete={() => setSelectedIds(new Set())}
              />
            </>
          )}
          <button 
            onClick={toggleAll}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all"
          >
            {selectedIds.size === filteredRecords.length ? '取消全选' : '全选'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-20">
          <History className="w-12 h-12 text-slate-200 animate-spin mb-4" />
          <p className="text-slate-400 italic">正在调取错题档案...</p>
        </div>
      ) : records.length === 0 ? (
        <div className="bg-white p-20 rounded-3xl border border-slate-100 text-center">
           <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <History className="w-10 h-10 text-slate-300" />
           </div>
           <h3 className="text-xl font-bold text-slate-800">暂无错题记录</h3>
           <p className="text-slate-500 mt-2">快去“拍照识别”页上传你的第一个错题吧！</p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filteredRecords.map((record) => (
              <motion.div
                key={record.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`group relative bg-white p-6 rounded-3xl border-2 transition-all cursor-pointer ${
                  selectedIds.has(record.id!) ? 'border-blue-500 shadow-lg shadow-blue-100' : 'border-transparent shadow-sm'
                }`}
                onClick={() => toggleSelection(record.id!)}
              >
                <div className="flex items-start justify-between mb-4">
                   <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded font-black">{record.subject}</span>
                        <span className="text-sm font-black text-slate-800 tracking-tight">{record.knowledgePoint}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-400 font-medium">
                        <Calendar className="w-3 h-3" />
                        {new Date(record.createdAt?.toDate()).toLocaleDateString()}
                      </div>
                   </div>
                   <div className={`w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center ${
                     selectedIds.has(record.id!) ? 'background-blue-600 border-blue-600' : 'border-slate-200'
                   }`}>
                     {selectedIds.has(record.id!) && <CheckCircle2 className="w-4 h-4 text-white fill-blue-600" />}
                   </div>
                </div>

                <div className="line-clamp-2 text-sm text-slate-600 font-medium mb-4 pr-10">
                   <ReactMarkdown>{record.originalQuestion}</ReactMarkdown>
                </div>

                <div className="flex items-center gap-4 border-t border-slate-50 pt-4">
                   <div className="flex -space-x-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-black text-slate-400">
                          {i}
                        </div>
                      ))}
                   </div>
                   <span className="text-xs font-bold text-slate-400 tracking-tight">包含 3 道智能举一反三题目</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
