'use client';

import { useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { createLessonAction } from '@/app/actions/lessons';
import { Loader2, UploadCloud, Video } from 'lucide-react';

export default function CreateLessonForm({ courseId, token }: { courseId: string, token: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formData = new FormData(e.currentTarget);
      
      // Upload video if provided
      if (file) {
        const supabase = getSupabaseClient(token);
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        const filePath = `videos/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('course-media')
          .upload(filePath, file);

        if (uploadError) {
          throw new Error(`Upload failed: ${uploadError.message}`);
        }

        formData.set('videoUrl', filePath);
      }

      await createLessonAction(courseId, formData);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while creating the lesson.');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Tiêu đề bài học <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="title"
          id="title"
          required
          className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-gray-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          placeholder="Nhập tiêu đề bài học..."
        />
      </div>

      <div>
        <label htmlFor="orderIndex" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Thứ tự bài học <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          name="orderIndex"
          id="orderIndex"
          required
          min={0}
          defaultValue={1}
          className="w-full sm:w-1/4 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-gray-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
        />
      </div>

      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Nội dung văn bản
        </label>
        <textarea
          name="content"
          id="content"
          rows={6}
          className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-gray-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
          placeholder="Viết nội dung bài học hoặc ghi chú..."
        ></textarea>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Video bài giảng
        </label>
        <div className="flex items-center justify-center w-full">
          <label htmlFor="video" className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 dark:border-gray-700 border-dashed rounded-xl cursor-pointer bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              {file ? (
                <>
                  <Video className="w-10 h-10 text-primary mb-3" />
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{file.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </>
              ) : (
                <>
                  <UploadCloud className="w-10 h-10 text-gray-400 mb-3" />
                  <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-semibold text-primary">Nhấn để tải lên</span> hoặc kéo thả file
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">MP4, WebM hoặc OGG</p>
                </>
              )}
            </div>
            <input 
              id="video" 
              type="file" 
              accept="video/*" 
              className="hidden" 
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  setFile(e.target.files[0]);
                }
              }}
            />
          </label>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 focus:ring-4 focus:ring-primary/20 outline-none transition-all disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Đang tải lên...
            </>
          ) : (
            'Tạo bài học'
          )}
        </button>
      </div>
    </form>
  );
}
