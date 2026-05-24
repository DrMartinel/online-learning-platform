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
  // Convert orderIndex to number
  const orderIndex = parseInt(formData.get('orderIndex') as string || '0', 10);

  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    throw new Error('Backend URL not configured');
  }

  const payload: any = { title, courseId, orderIndex };
  if (content) payload.content = content;
  if (videoUrl) payload.videoUrl = videoUrl;

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

  redirect(`/courses/${courseId}`);
}

export async function updateLessonAction(lessonId: string, courseId: string, formData: FormData) {
  const cookieStore = await cookies();
  const token = cookieStore.get('olp_session')?.value;

  if (!token) {
    throw new Error('Unauthorized');
  }

  const title = formData.get('title') as string;
  const content = formData.get('content') as string;
  const videoUrl = formData.get('videoUrl') as string;
  const orderIndex = parseInt(formData.get('orderIndex') as string || '0', 10);

  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    throw new Error('Backend URL not configured');
  }

  const payload: any = {};
  if (title) payload.title = title;
  if (content !== null) payload.content = content || '';
  if (videoUrl) payload.videoUrl = videoUrl;
  if (!isNaN(orderIndex)) payload.orderIndex = orderIndex;

  const res = await fetch(`${backendUrl}/lessons/${lessonId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to update lesson: ${err}`);
  }

  redirect(`/courses/${courseId}`);
}
