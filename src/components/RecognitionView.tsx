import React, { useState, useRef } from 'react';
import { Camera, Upload, RotateCw, CheckCircle2, Wand2, Save, Trash2, X } from 'lucide-react';
import { motion } from 'motion/react';
import { geminiService } from '../services/geminiService';
import { firebaseService } from '../services/firebaseService';
import { OCRResult, AnalogousQuestion } from '../types';
import { auth } from '../lib/firebase';
import ReactMarkdown from 'react-markdown';

export const RecognitionView: React.FC = () => {
  const [step, setStep] = useState<'upload' | 'ocr' | 'edit' | 'generate' | 'done'>('upload');
  const [image, setImage] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [analogous, setAnalogous] = useState<AnalogousQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setStep('ocr');
        runOCR(reader.result as string, file.type);
      };
      reader.readAsDataURL(file);
    }
  };

  const runOCR = async (base64: string, mimeType: string) => {
    setLoading(true);
    try {
      const base64Data = base64.split(',')[1];
      const result = await geminiService.extractFromImage(base64Data, mimeType);
      setOcrResult(result);
      setStep('edit');
    } catch (error) {
      console.error("OCR failed", error);
      alert("识别失败，请重试或手动输入。");
    } finally {
       setLoading(false);
    }
  };

  const generateAnalogous = async () => {
    if (!ocrResult) return;
    setLoading(true);
    try {
      const results = await geminiService.generateAnalogous(
        ocrResult.knowledgePoint,
        ocrResult.question,
        ocrResult.subject
      );
      setAnalogous(results);
      setStep('generate');
    } catch (error) {
      console.error("Generation failed", error);
      alert("生成举一反三失败，请重试。");
    } finally {
      setLoading(false);
    }
  };

  const saveToWorkbook = async () => {
    const user = auth.currentUser;
    if (!user || !ocrResult) return;

    setLoading(true);
    try {
      await firebaseService.saveRecord({
        userId: user.uid,
        originalQuestion: ocrResult.question,
        originalAnswer: ocrResult.answer,
        knowledgePoint: ocrResult.knowledgePoint,
        subject: ocrResult.subject,
        analogousQuestions: analogous,
      });
      setStep('done');
    } catch (error) {
      console.error("Save failed", error);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setImage(null);
    setOcrResult(null);
    setAnalogous([]);
    setStep('upload');
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      {step === 'upload' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center p-12 border-4 border-dashed border-slate-200 rounded-3xl bg-white hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer group"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Camera className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">拍摄错题</h2>
          <p className="text-slate-500 mb-6 text-center max-w-xs">打印或上传相册中的错题图片，我们将自动为您识别并生成变式练习。</p>
          <div className="flex gap-4">
            <button className="py-2 px-6 bg-blue-600 text-white rounded-full font-bold flex items-center gap-2 shadow-lg shadow-blue-200">
              <Upload className="w-4 h-4" /> 选择图片
            </button>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageChange} 
            className="hidden" 
            accept="image/*" 
            capture="environment"
          />
        </motion.div>
      )}

      {/* Loading OCR */}
      {loading && step === 'ocr' && (
        <div className="bg-white p-12 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
          <RotateCw className="w-12 h-12 text-blue-600 animate-spin mb-6" />
          <h3 className="text-xl font-bold">正在 OCR 识别中...</h3>
          <p className="text-slate-500 mt-2">正在分析题目、选项及知识点，请稍候</p>
        </div>
      )}

      {/* Edit OCR Result */}
      {step === 'edit' && ocrResult && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden"
        >
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold">识别结果确认</h3>
            <button onClick={reset} className="p-2 hover:bg-slate-200 rounded-full">
              <Trash2 className="w-4 h-4 text-slate-500" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            <div className="relative group">
               {image && <img src={image} className="w-full max-h-48 object-contain rounded-xl bg-slate-50 mb-4" />}
               <button onClick={reset} className="absolute top-2 right-2 p-1 bg-white/80 rounded-full shadow-sm hover:bg-white">
                  <X className="w-4 h-4" />
               </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-400 uppercase">学科</label>
                <input 
                  value={ocrResult.subject} 
                  onChange={e => setOcrResult({...ocrResult, subject: e.target.value})}
                  className="w-full p-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-400 uppercase">核心知识点</label>
                <input 
                  value={ocrResult.knowledgePoint} 
                  onChange={e => setOcrResult({...ocrResult, knowledgePoint: e.target.value})}
                   className="w-full p-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black text-slate-400 uppercase">题目内容</label>
              <textarea 
                rows={4}
                value={ocrResult.question} 
                onChange={e => setOcrResult({...ocrResult, question: e.target.value})}
                className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 font-medium resize-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black text-slate-400 uppercase">标准答案</label>
              <textarea 
                rows={2}
                value={ocrResult.answer || ''} 
                onChange={e => setOcrResult({...ocrResult, answer: e.target.value})}
                className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 font-medium resize-none"
                placeholder="若未识别到，可在此补充..."
              />
            </div>

            <button 
              onClick={generateAnalogous}
              disabled={loading}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-200 transition-all disabled:opacity-50"
            >
              {loading ? <RotateCw className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
              智能生成举一反三题目
            </button>
          </div>
        </motion.div>
      )}

      {/* Generate Step */}
      {loading && step === 'generate' && (
         <div className="bg-white p-12 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
            <Wand2 className="w-12 h-12 text-blue-600 animate-pulse mb-6" />
            <h3 className="text-xl font-bold">正在生成变式练习...</h3>
            <p className="text-slate-500 mt-2">AI 正在根据知识点构建 3 道相似题目</p>
         </div>
      )}

      {step === 'generate' && analogous.length > 0 && (
        <motion.div 
           initial={{ opacity: 0 }} animate={{ opacity: 1 }}
           className="space-y-6 pb-6"
        >
          <div className="bg-white p-6 rounded-3xl border border-blue-100 shadow-sm">
             <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-50 rounded-lg">
                   <Wand2 className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-black text-lg">举一反三生成的题目</h3>
             </div>
             
             <div className="space-y-6">
                {analogous.map((item, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2 mb-3">
                       <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded font-black">变式 {idx+1}</span>
                    </div>
                    <div className="prose prose-sm prose-slate max-w-none mb-4">
                       <ReactMarkdown>{item.question}</ReactMarkdown>
                    </div>
                    <details className="group border-t border-slate-200 pt-3">
                       <summary className="text-xs font-bold text-blue-600 cursor-pointer list-none flex items-center gap-2">
                          查看答案及分析
                       </summary>
                       <div className="mt-3 text-sm space-y-2">
                          <p className="font-bold">答案：{item.answer}</p>
                          <div className="p-3 bg-amber-50 text-amber-800 rounded-xl border border-amber-100">
                             <p className="text-xs font-black mb-1">易错点分析</p>
                             <p className="text-xs">{item.analysis}</p>
                          </div>
                       </div>
                    </details>
                  </div>
                ))}
             </div>

             <div className="mt-8 flex gap-4">
                <button 
                  onClick={generateAnalogous}
                  className="flex-1 py-4 bg-white border-2 border-blue-600 text-blue-600 rounded-2xl font-bold flex items-center justify-center gap-2"
                >
                   <RotateCw className="w-5 h-5" /> 重新生成
                </button>
                <button 
                   onClick={saveToWorkbook}
                   className="flex-[2] py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-200 transition-all"
                >
                   <Save className="w-5 h-5" /> 保存到错题本
                </button>
             </div>
          </div>
        </motion.div>
      )}

      {/* Done Step */}
      {step === 'done' && (
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-12 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center text-center"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold">已成功入库</h3>
          <p className="text-slate-500 mt-2 mb-8">该错题及变式题目已保存至您的历史错题本。</p>
          <button 
            onClick={reset}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold transition-all active:scale-95"
          >
            继续录入
          </button>
        </motion.div>
      )}
    </div>
  );
};
