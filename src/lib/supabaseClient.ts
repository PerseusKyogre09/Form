import { createClient } from '@supabase/supabase-js'
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'
import { createServerClient } from '@supabase/ssr'
import { env } from '$env/dynamic/private'

// if (!PUBLIC_SUPABASE_URL || !PUBLIC_SUPABASE_ANON_KEY) {
//     throw new Error('Supabase URL and Anon Key are required in .env file')
// }

export const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY)

export function createSupabaseServerClient(cookies: any) {
	return createServerClient(PUBLIC_SUPABASE_URL, env.PRIVATE_SUPABASE_SERVICE_KEY || '', {
		cookies: {
			get: (key: string) => cookies.get(key),
			set: (key: string, value: string, options: any) => cookies.set(key, value, options),
			remove: (key: string, options: any) => cookies.delete(key, options),
		},
	})
}
