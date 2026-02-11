import { createClient } from '@supabase/supabase-js'
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'
import { PRIVATE_SUPABASE_SERVICE_KEY } from '$env/static/private'
import { createServerClient } from '@supabase/ssr'
import type { Cookies } from '@sveltejs/kit'

// if (!PUBLIC_SUPABASE_URL || !PUBLIC_SUPABASE_ANON_KEY) {
//     throw new Error('Supabase URL and Anon Key are required in .env file')
// }

export const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY)

export function createSupabaseServerClient(cookies: Cookies) {
	return createServerClient(PUBLIC_SUPABASE_URL, PRIVATE_SUPABASE_SERVICE_KEY, {
		cookies: {
			get: (key: string) => cookies.get(key)?.value,
			set: (key: string, value: string, options: any) => cookies.set(key, value, options),
			remove: (key: string, options: any) => cookies.delete(key, options),
		},
	})
}
