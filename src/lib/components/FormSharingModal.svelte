<script lang="ts">
  import type { Form, FormCollaborator } from "$lib/types";

  let { form, isOpen = $bindable(false) } = $props();

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
    class="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4"
    onclick={closeModal}
    role="button"
    tabindex="0"
    onkeydown={(e) => e.key === "Escape" && closeModal()}
  >
    <!-- Modal Content -->
    <div
      class="bg-[color:var(--surface)] w-full max-w-lg max-h-[88dvh] sm:max-h-[90vh] flex flex-col rounded-t-[18px] sm:rounded-[16px] shadow-2xl"
      onclick={(e) => e.stopPropagation()}
      role="dialog"
    >
      <!-- Header -->
      <div class="p-5 sm:p-6 border-b border-[color:var(--border)]">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-bold text-[color:var(--text)]">
            Share Form
          </h2>
          <button
            onclick={closeModal}
            class="text-[color:var(--text-soft)] hover:text-[color:var(--text)] transition-colors"
          >
            <i class="fas fa-times text-lg"></i>
          </button>
        </div>
        <p class="text-xs text-[color:var(--text-soft)] mt-1">
          Grant access to other registered users
        </p>
      </div>

      <!-- Content -->
      <div class="overflow-y-auto flex-1 p-4 sm:p-6 space-y-6">
        <!-- Notification -->
        {#if showMessage}
          <div
            class="p-3 rounded-lg text-sm font-medium {messageType === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
              : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'}"
          >
            {message}
          </div>
        {/if}

        <!-- Search Section -->
        <div class="space-y-3">
          <label class="text-xs font-bold text-[color:var(--text-soft)] uppercase"
            >Find & Add Users</label
          >
          <div class="space-y-2">
            <div class="relative">
              <i
                class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--text-soft)] text-xs"
              ></i>
              <input
                type="text"
                placeholder="Search by username or email..."
                bind:value={searchQuery}
                oninput={searchUsers}
                class="w-full pl-9 pr-4 py-2.5 bg-[color:var(--surface-strong)] border border-[color:var(--border)] text-[color:var(--text)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:focus:bg-gray-900 focus:border-transparent transition-all"
              />
              {#if loading}
                <div
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--text-soft)]"
                >
                  <i class="fas fa-spinner animate-spin"></i>
                </div>
              {/if}
            </div>

            <!-- Role Selection -->
            <div class="flex gap-2">
              <select
                bind:value={selectedRole}
                class="flex-1 min-h-[44px] px-3 py-2 bg-[color:var(--surface-muted)] border border-[color:var(--border)] text-[color:var(--text)] rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
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
                  class="flex items-center justify-between gap-3 p-3 bg-[color:var(--surface-muted)] rounded-xl hover:bg-[color:var(--surface-strong)] transition-colors"
                >
                  <div class="flex items-center gap-3 min-w-0">
                    <div
                      class="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0"
                    >
                      {user.username?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div class="min-w-0">
                      <p
                        class="text-xs font-semibold text-[color:var(--text)] truncate"
                      >
                        {user.username}
                      </p>
                      <p class="text-[10px] text-[color:var(--text-soft)] truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <button
                    onclick={() => addCollaborator(user.id, user.username)}
                    disabled={adding}
                    class="min-h-[44px] px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-indigo-600 disabled:opacity-50 flex-shrink-0 transition-colors"
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
              <i class="fas fa-spinner animate-spin text-[color:var(--text-soft)] text-lg"></i>
              <p class="text-xs text-[color:var(--text-soft)] mt-2">Searching...</p>
            </div>
          {:else if searchQuery.length >= 2 && !loading}
            <div class="p-4 text-center">
              <p class="text-xs text-[color:var(--text-soft)]">
                No users found. Try searching by username or email.
              </p>
            </div>
          {/if}
        </div>

        <!-- Collaborators List -->
        <div
          class="space-y-3 border-t border-[color:var(--border)] pt-6"
        >
          <label class="text-xs font-bold text-[color:var(--text-soft)] uppercase"
            >Collaborators ({collaborators.length})</label
          >

          {#if collaborators.length === 0}
            <p class="text-xs text-[color:var(--text-soft)] py-4 text-center">
              No collaborators yet. Start by adding a user above.
            </p>
          {:else}
            <div class="space-y-2">
              {#each collaborators as collab (collab.id)}
                <div
                  class="flex items-center justify-between gap-3 p-3 bg-[color:var(--surface-muted)] rounded-xl"
                >
                  <div class="flex items-center gap-3 min-w-0">
                    <div
                      class="w-8 h-8 rounded-full bg-[color:var(--surface-strong)] flex items-center justify-center text-xs font-bold text-[color:var(--text)] border border-[color:var(--border)] flex-shrink-0"
                    >
                      {collab.user?.user_metadata?.username
                        ?.charAt(0)
                        .toUpperCase() ||
                        collab.user?.email?.charAt(0).toUpperCase() ||
                        "U"}
                    </div>
                    <div class="min-w-0">
                      <p
                        class="text-xs font-semibold text-[color:var(--text)] truncate"
                      >
                        {collab.user?.user_metadata?.username ||
                          collab.user?.email?.split("@")[0] ||
                          "Collaborator"}
                      </p>
                      <p class="text-[10px] text-[color:var(--text-soft)] truncate italic">
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
                      class="min-h-[40px] px-2 py-1.5 bg-[color:var(--surface-strong)] border border-[color:var(--border)] text-[color:var(--text)] rounded text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
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
                      class="h-10 w-10 p-1.5 text-[color:var(--danger)] hover:bg-[color:var(--danger)]/10 rounded-lg transition-colors flex items-center justify-center"
                      title="Remove collaborator"
                      aria-label="Remove collaborator"
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
      <div
        class="p-4 border-t border-[color:var(--border)] flex justify-end bg-[color:var(--surface)]"
      >
        <button
          onclick={closeModal}
          class="min-h-[44px] px-4 py-2 bg-[color:var(--surface-muted)] hover:bg-[color:var(--surface-strong)] text-[color:var(--text)] rounded-lg font-semibold text-sm transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  </div>
{/if}
