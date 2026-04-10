import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AuthController } from '../../../../../backend/src/presentation';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // In Next 15 server actions/components or route handlers, cookies() must be awaited. Wait, createClient accesses cookies.
    // Our lib/supabase/server is NOT awaiting cookies() but next/headers cookies() in Next 15+ may require `await`.
    // Let's assume createClient is synchronous as defined previously.
    const supabase = await createClient(); // Depending on if it's async now, but wait, the file I viewed had it sync.
    const authController = new AuthController(supabase);

    const result = await authController.signUp({
      email: body.email,
      password: body.password,
      fullName: body.fullName,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 400 }
    );
  }
}
