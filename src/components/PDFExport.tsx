import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Printer, Loader2, Download } from 'lucide-react';
import { QuestionRecord } from '../types';
import ReactMarkdown from 'react-markdown';

interface PDFExportProps {
  records: QuestionRecord[];
  onComplete: () => void;
}

export const PDFExport: React.FC<PDFExportProps> = ({ records, onComplete }) => {
  const [loading, setLoading] = useState(false);
  const printRef = React.useRef<HTMLDivElement>(null);

  const generatePDF = async () => {
    if (!printRef.current) return;
    setLoading(true);
    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      let heightLeft = pdfHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();
      
      while (heightLeft >= 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();
      }
      
      pdf.save(`错题本_${new Date().toLocaleDateString()}.pdf`);
    } catch (error) {
      console.error("PDF generation failed", error);
    } finally {
      setLoading(false);
      onComplete();
    }
  };

  return (
    <>
      <button 
        onClick={generatePDF}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md shadow-blue-100"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
        生成 PDF 并打印
      </button>

      {/* Hidden container for rendering */}
      <div className="fixed -left-[9999px] top-0 w-[210mm] bg-white p-12 text-slate-900" ref={printRef}>
        <h1 className="text-3xl font-black text-center mb-12 border-b-4 border-slate-900 pb-4 uppercase tracking-widest">
          错题回顾与变式练习
        </h1>
        {records.map((record, rIdx) => (
          <div key={record.id} className="mb-16 page-break-inside-avoid">
            <div className="flex items-center gap-4 mb-6">
               <span className="bg-slate-900 text-white px-3 py-1 text-sm font-black rounded tracking-tighter">题目 {rIdx + 1}</span>
               <span className="text-sm font-bold text-slate-500 italic">[{record.subject}] {record.knowledgePoint}</span>
            </div>
            
            <div className="mb-8 border-l-4 border-slate-200 pl-6 py-2">
               <h3 className="text-lg font-bold mb-4">原题回顾</h3>
               <div className="prose prose-slate max-w-none">
                  <ReactMarkdown>{record.originalQuestion}</ReactMarkdown>
               </div>
               {record.originalAnswer && (
                 <div className="mt-4 p-4 bg-slate-50 rounded-lg text-sm italic">
                    <span className="font-black mr-2">【参考答案】</span> {record.originalAnswer}
                 </div>
               )}
            </div>

            <div className="space-y-12">
               {record.analogousQuestions.map((analog, aIdx) => (
                 <div key={aIdx} className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                       <div className="w-6 h-6 rounded-full border-2 border-slate-900 flex items-center justify-center text-xs font-black">
                          {aIdx + 1}
                       </div>
                       <h4 className="font-black text-sm uppercase tracking-wide">举一反三变式练习</h4>
                    </div>
                    <div className="prose prose-slate max-w-none ml-8">
                       <ReactMarkdown>{analog.question}</ReactMarkdown>
                    </div>
                    <div className="mt-6 ml-8 grid grid-cols-2 gap-4">
                        <div className="border border-slate-100 p-4 rounded-lg bg-slate-50">
                           <p className="text-[10px] font-black text-slate-400 mb-2 uppercase italic">答案及解析区</p>
                           <p className="text-sm font-bold mb-1">答案：{analog.answer}</p>
                           <p className="text-xs text-slate-600 font-medium">解析：{analog.analysis}</p>
                        </div>
                        <div className="border border-dashed border-slate-200 p-4 rounded-lg">
                           <p className="text-[10px] font-black text-slate-300 uppercase italic">学生作答区</p>
                        </div>
                    </div>
                 </div>
               ))}
            </div>
            {rIdx < records.length - 1 && <hr className="my-12 border-slate-100" />}
          </div>
        ))}
        <footer className="mt-12 text-center text-xs text-slate-400 font-mono italic">
          Generated via AI 错题打印机 | {new Date().toLocaleDateString()}
        </footer>
      </div>
    </>
  );
};
