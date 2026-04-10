import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AuthController } from '../../../../../backend/src/presentation';

export async function POST() {
  try {
    const supabase = await createClient();
    const authController = new AuthController(supabase);

    await authController.signOut();

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 400 }
    );
  }
}
