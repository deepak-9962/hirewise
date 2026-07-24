import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const { role } = await req.json();

    const demoAccounts: Record<string, { email: string; name: string }> = {
      recruiter: { email: "recruiter@hirewise.demo", name: "Sarah Jenkins (Recruiter)" },
      candidate: { email: "candidate@hirewise.demo", name: "Alex Rivera (Candidate)" },
      admin: { email: "admin@hirewise.demo", name: "System Admin" },
    };

    const account = demoAccounts[role] || demoAccounts.candidate;
    const password = "HireWise2026!";

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // 1. If service role key is available, ensure user exists with auto-confirmed email and reset password
    if (supabaseServiceKey && supabaseUrl) {
      const admin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      // Check if user already exists
      const { data: usersData } = await admin.auth.admin.listUsers();
      const existingUser = usersData?.users?.find((u) => u.email === account.email);

      let userId = existingUser?.id;

      if (existingUser) {
        // Reset password & confirm email
        await admin.auth.admin.updateUserById(existingUser.id, {
          password: password,
          email_confirm: true,
          user_metadata: { name: account.name, role: role },
        });
      } else {
        // Create user with confirmed email
        const { data: newUser, error: createErr } = await admin.auth.admin.createUser({
          email: account.email,
          password: password,
          email_confirm: true,
          user_metadata: { name: account.name, role: role },
        });
        if (createErr) {
          console.error("Admin user creation failed:", createErr);
        } else if (newUser.user) {
          userId = newUser.user.id;
        }
      }

      // Upsert profile
      if (userId) {
        await admin.from("profiles").upsert({
          id: userId,
          name: account.name,
          email: account.email,
          role: role,
        });
      }
    }

    return NextResponse.json({
      success: true,
      email: account.email,
      password: password,
      role: role,
    });
  } catch (err: any) {
    console.error("Demo login API error:", err);
    return NextResponse.json({ error: err.message || "Failed to process demo login" }, { status: 500 });
  }
}
