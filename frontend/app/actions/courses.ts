'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function createCourseAction(formData: FormData) {
  const cookieStore = await cookies();
  const token = cookieStore.get('olp_session')?.value;

  if (!token) {
    throw new Error('Unauthorized');
  }

  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const thumbnailUrl = formData.get('thumbnailUrl') as string;

  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    throw new Error('Backend URL not configured');
  }

  const payload: any = { title };
  if (description) payload.description = description;
  if (thumbnailUrl) payload.thumbnailUrl = thumbnailUrl;

  const res = await fetch(`${backendUrl}/courses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to create course: ${err}`);
  }

  const course = await res.json();
  redirect(`/courses/${course.id}`);
}

export async function updateCourseAction(courseId: string, formData: FormData) {
  const cookieStore = await cookies();
  const token = cookieStore.get('olp_session')?.value;

  if (!token) {
    throw new Error('Unauthorized');
  }

  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const thumbnailUrl = formData.get('thumbnailUrl') as string;

  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    throw new Error('Backend URL not configured');
  }

  const payload: any = {};
  if (title) payload.title = title;
  if (description !== null) payload.description = description || '';
  if (thumbnailUrl) payload.thumbnailUrl = thumbnailUrl;

  const res = await fetch(`${backendUrl}/courses/${courseId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to update course: ${err}`);
  }

  redirect(`/courses/${courseId}`);
}
