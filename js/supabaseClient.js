// Requiere que el HTML haya cargado, en este orden:
// 1. https://unpkg.com/@supabase/supabase-js@2/dist/umd/supabase.js
// 2. js/config.js
// Esto crea un objeto global `db` que se usa en el resto de los scripts.
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
