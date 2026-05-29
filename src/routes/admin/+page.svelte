<script lang="ts">
  import { onMount } from "svelte";
  import DashboardHeader from "$lib/components/DashboardHeader.svelte";
  import EmptyState from "$lib/components/ui/EmptyState.svelte";
  import PageHeader from "$lib/components/ui/PageHeader.svelte";
  import Surface from "$lib/components/ui/Surface.svelte";

  export let data;

  let users = data.users || [];
  let admins: string[] = [];
  let newUser = { name: "", email: "", password: "", username: "" };
  let loading = false;
  let message = "";
  let messageType = "success";
  let activeTab = "users";

  onMount(async () => {
    await fetchAdmins();
  });

  async function fetchAdmins() {
    try {
      const response = await fetch("/api/admin/admins");
      const result = await response.json();
      if (result.admins) admins = result.admins;
    } catch (error) {
      console.error("Error fetching admins:", error);
    }
  }

  async function refreshUsers() {
    const usersResponse = await fetch("/api/admin/users");
    users = await usersResponse.json();
  }

  async function createUser() {
    if (!newUser.name || !newUser.email || !newUser.password) {
      message = "Please fill in all required fields";
      messageType = "error";
      return;
    }

    loading = true;
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });

      const result = await response.json();
      if (response.ok) {
        message = "User created successfully.";
        messageType = "success";
        newUser = { name: "", email: "", password: "", username: "" };
        await refreshUsers();
      } else {
        message = result.error || "Failed to create user";
        messageType = "error";
      }
    } catch (error) {
      console.error("Error:", error);
      message = "Error creating user";
      messageType = "error";
    } finally {
      loading = false;
    }
  }

  async function makeAdmin(email: string) {
    try {
      const response = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add-admin", email }),
      });

      const result = await response.json();
      if (response.ok) {
        message = `${email} is now an admin`;
        messageType = "success";
        await fetchAdmins();
      } else {
        message = result.error || "Failed to make admin";
        messageType = "error";
      }
    } catch (error) {
      message = "Error updating admin status";
      messageType = "error";
    }
  }

  async function removeAdmin(email: string) {
    if (email === "kyogre.perseus09@gmail.com") {
      message = "Cannot remove the original admin";
      messageType = "error";
      return;
    }

    try {
      const response = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove-admin", email }),
      });

      const result = await response.json();
      if (response.ok) {
        message = `${email} is no longer an admin`;
        messageType = "success";
        await fetchAdmins();
      } else {
        message = result.error || "Failed to remove admin";
        messageType = "error";
      }
    } catch (error) {
      message = "Error updating admin status";
      messageType = "error";
    }
  }

  async function deleteUser(email: string) {
    if (!confirm(`Are you sure you want to delete ${email}?`)) return;

    try {
      const response = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete-user", email }),
      });

      const result = await response.json();
      if (response.ok) {
        message = `User ${email} deleted`;
        messageType = "success";
        await refreshUsers();
      } else {
        message = result.error || "Failed to delete user";
        messageType = "error";
      }
    } catch (error) {
      message = "Error deleting user";
      messageType = "error";
    }
  }
</script>

<div class="app-shell">
  <DashboardHeader />

  <main class="page-container page-stack section-stack">
    <PageHeader
      eyebrow="Administration"
      title="Admin panel"
      description={`Signed in as ${data.user.email}. Manage users and elevated access without leaving the main workspace shell.`}
    />

    {#if message}
      <div
        class="rounded-[10px] border px-4 py-3 text-sm"
        style={`background: color-mix(in srgb, ${messageType === "error" ? "var(--danger)" : "var(--success)"} 10%, var(--surface-strong)); border-color: color-mix(in srgb, ${messageType === "error" ? "var(--danger)" : "var(--success)"} 20%, var(--border)); color: ${messageType === "error" ? "var(--danger)" : "var(--success)"};`}
      >
        {message}
      </div>
    {/if}

    <div class="segmented w-fit">
      <button type="button" class="segmented-item" data-state={activeTab === "users" ? "active" : "inactive"} on:click={() => (activeTab = "users")}>
        Users
      </button>
      <button type="button" class="segmented-item" data-state={activeTab === "create" ? "active" : "inactive"} on:click={() => (activeTab = "create")}>
        Create user
      </button>
      <button type="button" class="segmented-item" data-state={activeTab === "admins" ? "active" : "inactive"} on:click={() => (activeTab = "admins")}>
        Admins
      </button>
    </div>

    {#if activeTab === "users"}
      <Surface className="panel-section">
        {#if users.length === 0}
          <EmptyState icon="fa-users" title="No users yet" description="Create your first user to get started." />
        {:else}
          <div class="space-y-3">
            {#each users as user (user.id)}
              <Surface strong={true} className="panel-section">
                <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div class="min-w-0">
                    <div class="flex items-center gap-3">
                      <div class="flex h-10 w-10 items-center justify-center rounded-[10px] border surface-muted">
                        <i class="fas fa-user text-xs muted"></i>
                      </div>
                      <div class="min-w-0">
                        <p class="truncate text-sm font-semibold text-[color:var(--text)]">{user.name}</p>
                        <p class="truncate text-sm muted">{user.email}</p>
                      </div>
                    </div>
                    <div class="mt-3 flex flex-wrap items-center gap-2 text-xs">
                      <span class="status-badge badge-muted">@{user.username || "-"}</span>
                      {#if admins.includes(user.email)}
                        <span class="status-badge badge-success">Admin</span>
                      {/if}
                    </div>
                  </div>

                  <div class="flex flex-wrap gap-2">
                    {#if !admins.includes(user.email)}
                      <button type="button" class="btn btn-secondary btn-sm" on:click={() => makeAdmin(user.email)}>
                        Make admin
                      </button>
                    {/if}
                    {#if admins.includes(user.email) && user.email !== "kyogre.perseus09@gmail.com"}
                      <button type="button" class="btn btn-secondary btn-sm" on:click={() => removeAdmin(user.email)}>
                        Remove admin
                      </button>
                    {/if}
                    {#if user.email !== data.user.email && user.email !== "kyogre.perseus09@gmail.com"}
                      <button type="button" class="btn btn-danger btn-sm" on:click={() => deleteUser(user.email)}>
                        Delete
                      </button>
                    {/if}
                  </div>
                </div>
              </Surface>
            {/each}
          </div>
        {/if}
      </Surface>
    {/if}

    {#if activeTab === "create"}
      <Surface className="panel-section max-w-2xl">
        <div class="mb-6">
          <h2 class="section-title">Create user</h2>
          <p class="mt-1 text-sm muted">Provision a new account directly from the admin workspace.</p>
        </div>

        <form on:submit|preventDefault={createUser} class="space-y-5">
          <div>
            <label for="name" class="label">Full name</label>
            <input id="name" bind:value={newUser.name} type="text" required class="field" placeholder="John Doe" />
          </div>
          <div>
            <label for="email" class="label">Email</label>
            <input id="email" bind:value={newUser.email} type="email" required class="field" placeholder="john@example.com" />
          </div>
          <div>
            <label for="username" class="label">Username</label>
            <input id="username" bind:value={newUser.username} type="text" class="field" placeholder="johndoe" />
          </div>
          <div>
            <label for="password" class="label">Password</label>
            <input id="password" bind:value={newUser.password} type="password" required class="field" placeholder="Enter a secure password" />
          </div>
          <button type="submit" disabled={loading} class="btn btn-primary">
            {#if loading}
              <i class="fas fa-spinner fa-spin text-xs"></i>
              <span>Creating…</span>
            {:else}
              <span>Create user</span>
            {/if}
          </button>
        </form>
      </Surface>
    {/if}

    {#if activeTab === "admins"}
      <Surface className="panel-section">
        {#if admins.length === 0}
          <EmptyState icon="fa-shield-alt" title="No admins found" description="Promote a user from the users tab." />
        {:else}
          <div class="space-y-3">
            {#each admins as admin (admin)}
              <Surface strong={true} className="panel-section">
                <div class="flex items-center justify-between gap-4">
                  <div class="flex min-w-0 items-center gap-3">
                    <div class="flex h-10 w-10 items-center justify-center rounded-[10px] border surface-muted">
                      <i class="fas fa-shield-alt text-xs muted"></i>
                    </div>
                    <div class="min-w-0">
                      <p class="truncate text-sm font-semibold text-[color:var(--text)]">{admin}</p>
                      <p class="text-xs muted-soft">
                        {admin === "kyogre.perseus09@gmail.com" ? "Original admin" : "Elevated access"}
                      </p>
                    </div>
                  </div>
                  {#if admin !== "kyogre.perseus09@gmail.com" && admin !== data.user.email}
                    <button type="button" class="btn btn-danger btn-sm" on:click={() => removeAdmin(admin)}>
                      Remove
                    </button>
                  {/if}
                </div>
              </Surface>
            {/each}
          </div>
        {/if}
      </Surface>
    {/if}
  </main>
</div>
