import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  const supabaseAdmin = getSupabaseAdmin();

  // Add openings column if it doesn't already exist
  const { error } = await supabaseAdmin.rpc("exec_ddl", {
    sql: "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS openings integer NOT NULL DEFAULT 1;",
  });

  if (error) {
    // If rpc doesn't exist, fallback — column may already exist or needs manual addition
    return NextResponse.json({ warning: error.message, note: "If this fails, run the SQL manually in Supabase dashboard: ALTER TABLE jobs ADD COLUMN IF NOT EXISTS openings integer NOT NULL DEFAULT 1;" });
  }

  return NextResponse.json({ success: true, message: "openings column added to jobs table" });
}
