import { createServerClient } from '@supabase/ssr'
import { PUBLIC_SUPABASE_URL } from '$env/static/public'
import { PRIVATE_SUPABASE_SERVICE_KEY } from '$env/static/private'
import type { Cookies } from '@sveltejs/kit'

export function createSupabaseServerClient(cookies: Cookies) {
	return createServerClient(PUBLIC_SUPABASE_URL, PRIVATE_SUPABASE_SERVICE_KEY, {
		cookies: {
			get: (key: string) => cookies.get(key)?.value,
			set: (key: string, value: string, options: any) => cookies.set(key, value, options),
			remove: (key: string, options: any) => cookies.delete(key, options),
		},
	})
}