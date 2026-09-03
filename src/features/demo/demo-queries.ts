import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function provisionDemoDataRows(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("provision_demo_data");

  if (error) {
    throw new Error(`Failed to prepare demo data: ${error.message}`);
  }
}

export async function provisionDemoStrengthRecordBaselinesRows(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc(
    "provision_demo_strength_record_baselines",
  );

  if (error) {
    throw new Error(
      `Failed to prepare demo strength record baselines: ${error.message}`,
    );
  }
}
