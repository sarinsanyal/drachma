import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    if (code) {
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
            {
                cookies: {
                    getAll() { return cookieStore.getAll(); },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    },
                },
            }
        );

        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
            console.error("[auth/callback] exchangeCodeForSession failed:", exchangeError.message);
            return NextResponse.redirect(new URL("/auth?error=exchange_failed", request.url));
        }

        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError) {
            console.error("[auth/callback] getUser failed:", userError.message);
        }

        if (user) {
            console.log("[auth/callback] Authenticated user:", user.id, user.email);

            const { data: profile, error: profileError } = await supabase
                .from("profiles")
                .select("id")
                .eq("id", user.id)
                .single();

            if (profileError) {
                console.log("[auth/callback] Profile lookup error (expected if new user):", profileError.message);
            }

            if (profile) {
                return NextResponse.redirect(new URL("/dashboard", request.url));
            } else {
                return NextResponse.redirect(new URL("/onboarding", request.url));
            }
        }

        console.error("[auth/callback] No user after exchange, code was:", code.slice(0, 8) + "...");
    } else {
        console.error("[auth/callback] No code param in callback URL");
    }

    return NextResponse.redirect(new URL("/auth", request.url));
}