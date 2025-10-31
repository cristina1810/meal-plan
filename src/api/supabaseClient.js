import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
console.log("URL:", supabaseUrl);
console.log("Key:", supabaseAnonKey?.slice(0, 10) + "…");

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
