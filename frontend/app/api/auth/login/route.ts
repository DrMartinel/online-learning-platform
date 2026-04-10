import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AuthController } from '../../../../../backend/src/presentation';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const supabase = await createClient();
    const authController = new AuthController(supabase);

    const result = await authController.signIn({
      email: body.email,
      password: body.password,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 400 }
    );
  }
}
