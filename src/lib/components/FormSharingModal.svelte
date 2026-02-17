<script lang="ts">
  import type { Form, FormCollaborator } from "$lib/types";
  import { supabase } from "$lib/supabaseClient";

  let { form, isOpen = false } = $props();

  let searchQuery = $state("");
  let searchResults = $state<any[]>([]);
  let collaborators = $state<FormCollaborator[]>([]);
  let loading = $state(false);
  let adding = $state(false);
  let selectedRole = $state<"viewer" | "editor">("editor");
  let message = $state("");
  let messageType = $state<"success" | "error">("success");
  let showMessage = $state(false);

  $effect(() => {
    if (isOpen && form) {
      loadCollaborators();
    }
  });

  async function searchUsers() {
    if (!searchQuery || searchQuery.length < 2 || !form) {
      searchResults = [];
      return;
    }

    try {
      loading = true;
      const response = await fetch(
        `/api/users/search?q=${encodeURIComponent(searchQuery)}&formId=${form.id}`,
      );
      const data = await response.json();

      if (data.error) {
        showNotification(`Search error: ${data.error}`, "error");
        searchResults = [];
        return;
      }

      searchResults = data.users || [];
    } catch (error) {
      console.error("Error searching users:", error);
      searchResults = [];
    } finally {
      loading = false;
    }
  }

  async function loadCollaborators() {
    if (!form) return;

    try {
      const response = await fetch(`/api/forms/${form.id}/collaborators`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.warn(`Failed to load collaborators: ${response.status}`);
        collaborators = [];
        return;
      }

      const data = await response.json();
      collaborators = data.collaborators || [];
    } catch (error) {
      console.error("Error loading collaborators:", error);
      collaborators = [];
    }
  }

  async function addCollaborator(userId: string, username: string) {
    if (!form) return;

    try {
      adding = true;
      const response = await fetch(`/api/forms/${form.id}/collaborators`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add",
          formId: form.id,
          userId,
          role: selectedRole,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        showNotification(error.error, "error");
        return;
      }

      showNotification(`${username} added as ${selectedRole}`, "success");
      searchQuery = "";
      searchResults = [];
      await loadCollaborators();
    } catch (error) {
      console.error("Error adding collaborator:", error);
      showNotification("Failed to add collaborator", "error");
    } finally {
      adding = false;
    }
  }

  async function removeCollaborator(userId: string, username: string) {
    if (!form) return;

    if (!confirm(`Remove ${username} from this form?`)) return;

    try {
      const response = await fetch(`/api/forms/${form.id}/collaborators`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "remove",
          formId: form.id,
          userId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        showNotification(error.error, "error");
        return;
      }

      showNotification(`${username} removed`, "success");
      await loadCollaborators();
    } catch (error) {
      console.error("Error removing collaborator:", error);
      showNotification("Failed to remove collaborator", "error");
    }
  }

  async function updateRole(userId: string, newRole: "viewer" | "editor") {
    if (!form) return;

    try {
      const response = await fetch(`/api/forms/${form.id}/collaborators`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-role",
          formId: form.id,
          userId,
          role: newRole,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        showNotification(error.error, "error");
        return;
      }

      showNotification("Role updated successfully", "success");
      await loadCollaborators();
    } catch (error) {
      console.error("Error updating role:", error);
      showNotification("Failed to update role", "error");
    }
  }

  function showNotification(msg: string, type: "success" | "error") {
    message = msg;
    messageType = type;
    showMessage = true;
    setTimeout(() => {
      showMessage = false;
    }, 3000);
  }

  function closeModal() {
    isOpen = false;
    searchQuery = "";
    searchResults = [];
  }
</script>

{#if isOpen}
  <!-- Modal Backdrop -->
  <div
    class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
    onclick={closeModal}
    role="button"
    tabindex="0"
    onkeydown={(e) => e.key === "Escape" && closeModal()}
  >
    <!-- Modal Content -->
    <div
      class="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] flex flex-col"
      onclick={(e) => e.stopPropagation()}
      role="dialog"
    >
      <!-- Header -->
      <div class="p-6 border-b border-slate-100">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-bold text-slate-900">Share Form</h2>
          <button
            onclick={closeModal}
            class="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <i class="fas fa-times text-lg"></i>
          </button>
        </div>
        <p class="text-xs text-slate-500 mt-1">
          Grant access to other registered users
        </p>
      </div>

      <!-- Content -->
      <div class="overflow-y-auto flex-1 p-6 space-y-6">
        <!-- Notification -->
        {#if showMessage}
          <div
            class="p-3 rounded-lg text-sm font-medium {messageType === 'success'
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-red-50 text-red-700'}"
          >
            {message}
          </div>
        {/if}

        <!-- Search Section -->
        <div class="space-y-3">
          <label class="text-xs font-bold text-slate-600 uppercase"
            >Find & Add Users</label
          >
          <div class="space-y-2">
            <div class="relative">
              <i
                class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"
              ></i>
              <input
                type="text"
                placeholder="Search by username or email..."
                bind:value={searchQuery}
                oninput={searchUsers}
                class="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              {#if loading}
                <div
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  <i class="fas fa-spinner animate-spin"></i>
                </div>
              {/if}
            </div>

            <!-- Role Selection -->
            <div class="flex gap-2">
              <select
                bind:value={selectedRole}
                class="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="viewer">Viewer (Read-only)</option>
                <option value="editor">Editor (Can edit)</option>
              </select>
            </div>
          </div>

          <!-- Search Results -->
          {#if searchResults.length > 0}
            <div class="space-y-2">
              {#each searchResults as user (user.id)}
                <div
                  class="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div class="flex items-center gap-3 min-w-0">
                    <div
                      class="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0"
                    >
                      {user.username?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div class="min-w-0">
                      <p class="text-xs font-semibold text-slate-900 truncate">
                        {user.username}
                      </p>
                      <p class="text-[10px] text-slate-500 truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <button
                    onclick={() => addCollaborator(user.id, user.username)}
                    disabled={adding}
                    class="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-indigo-600 disabled:opacity-50 flex-shrink-0 transition-colors"
                  >
                    {#if adding}
                      <i class="fas fa-spinner animate-spin"></i>
                    {:else}
                      Add
                    {/if}
                  </button>
                </div>
              {/each}
            </div>
          {:else if searchQuery.length >= 2 && loading}
            <div class="p-4 text-center">
              <i class="fas fa-spinner animate-spin text-slate-400 text-lg"></i>
              <p class="text-xs text-slate-500 mt-2">Searching...</p>
            </div>
          {:else if searchQuery.length >= 2 && !loading}
            <div class="p-4 text-center">
              <p class="text-xs text-slate-500">
                No users found. Try searching by username or email.
              </p>
            </div>
          {/if}
        </div>

        <!-- Collaborators List -->
        <div class="space-y-3 border-t border-slate-100 pt-6">
          <label class="text-xs font-bold text-slate-600 uppercase"
            >Collaborators ({collaborators.length})</label
          >

          {#if collaborators.length === 0}
            <p class="text-xs text-slate-500 py-4 text-center">
              No collaborators yet. Start by adding a user above.
            </p>
          {:else}
            <div class="space-y-2">
              {#each collaborators as collab (collab.id)}
                <div
                  class="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <div class="flex items-center gap-3 min-w-0">
                    <div
                      class="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    >
                      {collab.user?.username?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div class="min-w-0">
                      <p class="text-xs font-semibold text-slate-900 truncate">
                        {collab.user?.username || "Collaborator"}
                      </p>
                      <p class="text-[10px] text-slate-500 truncate italic">
                        Access: {collab.role}
                      </p>
                    </div>
                  </div>
                  <div class="flex items-center gap-2 flex-shrink-0">
                    <select
                      value={collab.role}
                      onchange={(e) =>
                        updateRole(
                          collab.user_id,
                          e.currentTarget.value as "viewer" | "editor",
                        )}
                      class="px-2 py-1.5 bg-white border border-slate-200 rounded text-[10px] font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="editor">Editor</option>
                    </select>
                    <button
                      onclick={() =>
                        removeCollaborator(
                          collab.user_id,
                          collab.user?.user_metadata?.username ||
                            collab.user?.email?.split("@")[0] ||
                            "User",
                        )}
                      class="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                      title="Remove collaborator"
                    >
                      <i class="fas fa-trash-alt text-xs"></i>
                    </button>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </div>

      <!-- Footer -->
      <div class="p-4 border-t border-slate-100 flex justify-end">
        <button
          onclick={closeModal}
          class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-semibold text-sm transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  </div>
{/if}
