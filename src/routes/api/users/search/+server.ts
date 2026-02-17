import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSupabaseServerClient } from '$lib/supabaseServer';

export const GET: RequestHandler = async ({ url, cookies }) => {
  const supabase = createSupabaseServerClient(cookies);

  const query = url.searchParams.get('q')?.toLowerCase();
  const formId = url.searchParams.get('formId');

  if (!query || query.length < 2) {
    return json({ users: [] });
  }

  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Call the RPC function to search users
    const { data: users, error } = await supabase.rpc('search_v3', {
      search_query: query
    });

    if (error) {
      console.error('Error searching users:', error);
      return json({ users: [], error: error.message });
    }

    // Since we now return jsonb, ensure it's an array
    const searchResults = (Array.isArray(users) ? users : []) as Array<{ id: string, email: string, username: string }>;

    if (searchResults.length === 0) {
      console.log(`Search for "${query}" returned 0 results`);
    }

    // Filter out users who are already collaborators if formId is provided
    let finalResults = searchResults;

    if (formId && finalResults.length > 0) {
      try {
        const { data: existingCollaborators } = await supabase
          .from('form_collaborators')
          .select('user_id')
          .eq('form_id', formId);

        const existingIds = new Set(existingCollaborators?.map(c => c.user_id) || []);
        finalResults = finalResults.filter((u: { id: string }) => !existingIds.has(u.id));
      } catch (collabError) {
        console.warn('Could not filter existing collaborators:', collabError);
      }
    }

    console.log(`Search for "${query}" returned ${finalResults.length} users`);
    return json({ users: finalResults });
  } catch (error) {
    console.error('Error in user search:', error);
    return json({ users: [], error: String(error) });
  }
};
