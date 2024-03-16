import { createClient } from '@supabase/supabase-js'
const supabaseUrl = 'https://xgmhvmztudrhaocnqfwn.supabase.co'
const supabaseKey = ''
const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase