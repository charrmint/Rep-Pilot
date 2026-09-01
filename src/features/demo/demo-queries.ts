import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function provisionDemoDataRows(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("provision_demo_data");

  if (error) {
    throw new Error(`Failed to prepare demo data: ${error.message}`);
  }
}
