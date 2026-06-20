'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function createLessonAction(courseId: string, formData: FormData) {
  const cookieStore = await cookies();
  const token = cookieStore.get('olp_session')?.value;

  if (!token) {
    throw new Error('Unauthorized');
  }

  const title = formData.get('title') as string;
  const content = formData.get('content') as string;
  const videoUrl = formData.get('videoUrl') as string;
  const chapterId = formData.get('chapterId') as string;
  // Convert orderIndex to number
  const orderIndex = parseInt(formData.get('orderIndex') as string || '0', 10);

  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    throw new Error('Backend URL not configured');
  }

  const payload: any = { title, courseId, orderIndex };
  if (content) payload.content = content;
  if (videoUrl) payload.videoUrl = videoUrl;
  if (chapterId && chapterId !== 'unassigned') payload.chapterId = chapterId;

  const res = await fetch(`${backendUrl}/lessons`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to create lesson: ${err}`);
  }

  return res.json();
}
