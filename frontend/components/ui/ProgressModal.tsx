'use client';

import { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, XCircle, BrainCircuit } from 'lucide-react';

interface ProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  title: string;
  description?: string;
  streamUrl: string;
  requestBody?: any;
}

export default function ProgressModal({
  isOpen,
  onClose,
  onSuccess,
  title,
  description,
  streamUrl,
  requestBody,
}: ProgressModalProps) {
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('Đang khởi tạo...');
  const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen && status === 'idle') {
      startStream();
    }
    if (!isOpen) {
      // Reset state on close
      setProgress(0);
      setMessage('Đang khởi tạo...');
      setStatus('idle');
      setErrorMsg('');
    }
  }, [isOpen]);

  const startStream = async () => {
    setStatus('running');
    setProgress(0);
    setMessage('Đang kết nối đến server...');

    try {
      const response = await fetch(streamUrl, {
        method: 'POST',
        headers: requestBody ? { 'Content-Type': 'application/json' } : undefined,
        body: requestBody ? JSON.stringify(requestBody) : undefined,
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      if (!response.body) {
        throw new Error('ReadableStream not yet supported in this browser.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunkValue = decoder.decode(value, { stream: true });
          // SSE format: data: {...}\n\n
          const lines = chunkValue.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.substring(6));
                if (data.error) {
                  throw new Error(data.error);
                }
                if (data.progress !== undefined) {
                  setProgress(data.progress);
                }
                if (data.message) {
                  setMessage(data.message);
                }
                if (data.complete) {
                  setStatus('success');
                }
              } catch (e) {
                console.warn('Failed to parse SSE data:', line);
              }
            }
          }
        }
      }
      
      // If stream ends and status wasn't set to success by event
      if (status !== 'success' && status !== 'error') {
        setStatus('success');
        setProgress(100);
        setMessage('Đã hoàn thành!');
      }

    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.message || 'Mất kết nối hoặc có lỗi xảy ra.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl">
            <BrainCircuit size={20} className="text-primary" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-gray-900 dark:text-white">
              {title}
            </h2>
            {description && (
              <p className="text-[11px] text-gray-500 mt-0.5">{description}</p>
            )}
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Status Icon */}
          <div className="flex justify-center">
            {status === 'running' || status === 'idle' ? (
              <div className="relative flex items-center justify-center">
                <Loader2 size={48} className="text-primary animate-spin" />
                <span className="absolute text-xs font-bold text-gray-700 dark:text-gray-200">{Math.round(progress)}%</span>
              </div>
            ) : status === 'success' ? (
              <CheckCircle2 size={56} className="text-emerald-500 animate-in zoom-in" />
            ) : (
              <XCircle size={56} className="text-red-500 animate-in zoom-in" />
            )}
          </div>

          {/* Progress Bar Container */}
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Tiến độ đồng bộ
              </span>
              <span className="text-xs font-bold text-primary">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="h-2.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ease-out rounded-full ${
                  status === 'error' ? 'bg-red-500' : 
                  status === 'success' ? 'bg-emerald-500' : 'bg-primary'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
            
            <p className={`text-[11px] text-center font-medium mt-3 ${
              status === 'error' ? 'text-red-500' : 
              status === 'success' ? 'text-emerald-500' : 'text-gray-500 dark:text-gray-400'
            }`}>
              {status === 'error' ? errorMsg : message}
            </p>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-850 border-t border-gray-100 dark:border-gray-800 flex justify-end">
          {status === 'running' || status === 'idle' ? (
            <button
              type="button"
              disabled
              className="px-5 py-2 text-xs font-bold bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-xl cursor-not-allowed flex items-center gap-2"
            >
              <Loader2 size={12} className="animate-spin" />
              Đang xử lý...
            </button>
          ) : (
            <button
              onClick={() => {
                onClose();
                if (status === 'success' && onSuccess) onSuccess();
              }}
              className="px-5 py-2 text-xs font-bold bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors shadow-md shadow-primary/20 cursor-pointer"
            >
              Đóng
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
