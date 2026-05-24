"use client";

import { useState, useTransition } from 'react';
import { MoreVertical, Loader2, BrainCircuit } from 'lucide-react';

interface Props {
  lessonId: string;
}

export default function LessonActionMenu({ lessonId }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const ingestLesson = () => {
    setIsOpen(false);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/rag/ingest/lesson/${lessonId}`, {
          method: 'POST',
        });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to ingest lesson to AI');
        }
        alert('Ingestion started successfully! The AI knowledge base is being updated with this lesson.');
      } catch (err) {
        alert(err instanceof Error ? err.message : 'An error occurred');
      }
    });
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
      >
        {isPending ? <Loader2 size={16} className="animate-spin text-gray-500" /> : <MoreVertical size={16} className="text-gray-500" />}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl z-20 py-1 overflow-hidden">
            <button 
              onClick={ingestLesson}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2"
            >
              <BrainCircuit size={14} className="text-primary shrink-0" /> 
              <span>Sync Lesson to AI</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
