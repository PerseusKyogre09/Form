import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { user as userTable, form_collaborators } from '$lib/server/schema';
import { eq, and, or, ilike, notInArray } from 'drizzle-orm';

export const GET: RequestHandler = async ({ url, locals }) => {
  const user = locals.user;

  const query = url.searchParams.get('q')?.toLowerCase();
  const formId = url.searchParams.get('formId');

  if (!query || query.length < 2) {
    return json({ users: [] });
  }

  try {
    if (!user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Search users by email or username
    // ilike is case-insensitive like in Postgres
    let searchResults = await db.select({
      id: userTable.id,
      email: userTable.email,
      username: userTable.username
    })
      .from(userTable)
      .where(
        or(
          ilike(userTable.email, `%${query}%`),
          ilike(userTable.username, `%${query}%`)
        )
      )
      .limit(10);

    if (searchResults.length === 0) {
      console.log(`Search for "${query}" returned 0 results`);
    }

    // Filter out users who are already collaborators if formId is provided
    if (formId && searchResults.length > 0) {
      const existingCollabs = await db.select({
        user_id: form_collaborators.user_id
      })
        .from(form_collaborators)
        .where(eq(form_collaborators.form_id, formId));

      const existingIds = new Set(existingCollabs.map(c => c.user_id));
      searchResults = searchResults.filter(u => !existingIds.has(u.id));
    }

    console.log(`Search for "${query}" returned ${searchResults.length} users`);
    return json({ users: searchResults });
  } catch (error) {
    console.error('Error in user search:', error);
    return json({ users: [], error: String(error) });
  }
};
