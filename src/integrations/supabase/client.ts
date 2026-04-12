import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://lpuqwwhmncowgfpmcvln.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwdXF3d2htbmNvd2dmcG1jdmxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2NjI5OTAsImV4cCI6MjA2NTIzODk5MH0.placeholder";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
