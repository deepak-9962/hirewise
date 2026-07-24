import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET() {
  try {
    const supabase = await createClient();
    // Simple lightweight query to wake up / keep the Postgres database active
    const { data, error } = await supabase.from("jobs").select("id").limit(1);

    if (error) {
      console.error("[keep-alive] Supabase query error:", error);
      return NextResponse.json({ status: "error", error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      status: "ok",
      message: "Supabase database pinged successfully",
      timestamp: new Date().toISOString(),
      recordCount: data?.length ?? 0,
    });
  } catch (err: any) {
    console.error("[keep-alive] Error pinging Supabase:", err);
    return NextResponse.json({ status: "error", error: err.message }, { status: 500 });
  }
}
