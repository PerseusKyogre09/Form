<script>
  import { onMount } from 'svelte';

  export let data;

  let users = data.users || [];
  let admins = [];
  let newUser = { name: '', email: '', password: '', username: '' };
  let loading = false;
  let message = '';
  let messageType = 'success';
  let activeTab = 'users';

  onMount(async () => {
    await fetchAdmins();
  });

  async function fetchAdmins() {
    try {
      const response = await fetch('/api/admin/admins');
      const result = await response.json();
      if (result.admins) {
        admins = result.admins;
      }
    } catch (error) {
      console.error('Error fetching admins:', error);
    }
  }

  async function createUser() {
    if (!newUser.name || !newUser.email || !newUser.password) {
      message = 'Please fill in all required fields';
      messageType = 'error';
      return;
    }

    loading = true;
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });

      const result = await response.json();
      if (response.ok) {
        message = 'User created successfully!';
        messageType = 'success';
        newUser = { name: '', email: '', password: '', username: '' };
        // Refresh users list
        const usersResponse = await fetch('/api/admin/users');
        users = await usersResponse.json();
      } else {
        message = result.error || 'Failed to create user';
        messageType = 'error';
      }
    } catch (error) {
      message = 'Error creating user';
      messageType = 'error';
      console.error('Error:', error);
    } finally {
      loading = false;
    }
  }

  async function makeAdmin(email) {
    try {
      const response = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add-admin', email })
      });

      const result = await response.json();
      if (response.ok) {
        message = `${email} is now an admin`;
        messageType = 'success';
        await fetchAdmins();
      } else {
        message = result.error || 'Failed to make admin';
        messageType = 'error';
      }
    } catch (error) {
      message = 'Error updating admin status';
      messageType = 'error';
    }
  }

  async function removeAdmin(email) {
    if (email === 'kyogre.perseus09@gmail.com') {
      message = 'Cannot remove the original admin';
      messageType = 'error';
      return;
    }

    try {
      const response = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove-admin', email })
      });

      const result = await response.json();
      if (response.ok) {
        message = `${email} is no longer an admin`;
        messageType = 'success';
        await fetchAdmins();
      } else {
        message = result.error || 'Failed to remove admin';
        messageType = 'error';
      }
    } catch (error) {
      message = 'Error updating admin status';
      messageType = 'error';
    }
  }

  async function deleteUser(email) {
    if (!confirm(`Are you sure you want to delete ${email}?`)) return;

    try {
      const response = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete-user', email })
      });

      const result = await response.json();
      if (response.ok) {
        message = `User ${email} deleted`;
        messageType = 'success';
        const usersResponse = await fetch('/api/admin/users');
        users = await usersResponse.json();
      } else {
        message = result.error || 'Failed to delete user';
        messageType = 'error';
      }
    } catch (error) {
      message = 'Error deleting user';
      messageType = 'error';
    }
  }
</script>

<div class="min-h-screen bg-white dark:bg-gray-900">
  <!-- Header -->
  <header class="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-40">
    <div class="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-slate-800 dark:text-white">Admin Panel</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Logged in as: <span class="font-semibold text-slate-600 dark:text-gray-300">{data.user.email}</span>
          </p>
        </div>
      </div>
    </div>
  </header>

  <main class="max-w-[1600px] mx-auto px-4 sm:px-6 py-8">
    {#if message}
      <div class="mb-6 p-4 rounded-lg border flex items-center justify-between {messageType === 'error' 
        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200' 
        : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'}">
        <span>{message}</span>
        <button on:click={() => (message = '')} class="text-lg opacity-60 hover:opacity-100">✕</button>
      </div>
    {/if}

    <!-- Tabs -->
    <div class="flex gap-2 mb-8 border-b border-gray-100 dark:border-gray-800">
      <button 
        class="px-4 py-3 font-semibold text-sm transition-all border-b-2 {activeTab === 'users' 
          ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' 
          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-300'}"
        on:click={() => (activeTab = 'users')}
      >
        <i class="fas fa-users mr-2"></i> Users ({users.length})
      </button>
      <button 
        class="px-4 py-3 font-semibold text-sm transition-all border-b-2 {activeTab === 'create' 
          ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' 
          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-300'}"
        on:click={() => (activeTab = 'create')}
      >
        <i class="fas fa-user-plus mr-2"></i> Create User
      </button>
      <button 
        class="px-4 py-3 font-semibold text-sm transition-all border-b-2 {activeTab === 'admins' 
          ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' 
          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-300'}"
        on:click={() => (activeTab = 'admins')}
      >
        <i class="fas fa-shield-alt mr-2"></i> Admins ({admins.length})
      </button>
    </div>

    <!-- Users Tab -->
    {#if activeTab === 'users'}
      <section>
        {#if users.length === 0}
          <div class="text-center py-12">
            <div class="mb-4">
              <i class="fas fa-users text-5xl text-gray-200 dark:text-gray-700"></i>
            </div>
            <h3 class="text-xl font-bold text-slate-800 dark:text-gray-200 mb-2">No users yet</h3>
            <p class="text-slate-400 dark:text-gray-500">Create your first user to get started</p>
          </div>
        {:else}
          <div class="space-y-3">
            {#each users as user (user.id)}
              <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md dark:hover:shadow-lg/20 transition-all">
                <div class="flex items-center justify-between">
                  <div class="flex-1">
                    <div class="flex items-center gap-3 mb-2">
                      <div class="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                        <i class="fas fa-user text-indigo-600 dark:text-indigo-400"></i>
                      </div>
                      <div>
                        <p class="font-semibold text-slate-800 dark:text-gray-100">{user.name}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                      </div>
                    </div>
                    <div class="flex items-center gap-3 ml-13 text-xs">
                      <span class="text-gray-500 dark:text-gray-400">
                        <i class="fas fa-at mr-1"></i> {user.username || '-'}
                      </span>
                      {#if admins.includes(user.email)}
                        <span class="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-md text-xs font-semibold">
                          <i class="fas fa-shield-alt"></i> Admin
                        </span>
                      {/if}
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    {#if !admins.includes(user.email)}
                      <button 
                        on:click={() => makeAdmin(user.email)}
                        class="px-3 py-2 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                      >
                        <i class="fas fa-crown mr-1"></i> Make Admin
                      </button>
                    {/if}
                    {#if admins.includes(user.email) && user.email !== 'kyogre.perseus09@gmail.com'}
                      <button 
                        on:click={() => removeAdmin(user.email)}
                        class="px-3 py-2 text-xs font-semibold rounded-lg bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-500 hover:bg-yellow-100 dark:hover:bg-yellow-900/40 transition-colors"
                      >
                        <i class="fas fa-times mr-1"></i> Remove
                      </button>
                    {/if}
                    {#if user.email !== data.user.email && user.email !== 'kyogre.perseus09@gmail.com'}
                      <button 
                        on:click={() => deleteUser(user.email)}
                        class="px-3 py-2 text-xs font-semibold rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                      >
                        <i class="fas fa-trash mr-1"></i> Delete
                      </button>
                    {/if}
                  </div>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </section>
    {/if}

    <!-- Create User Tab -->
    {#if activeTab === 'create'}
      <section>
        <div class="max-w-2xl">
          <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-8">
            <h2 class="text-2xl font-bold text-slate-800 dark:text-white mb-6">Create New User</h2>
            <form on:submit|preventDefault={createUser} class="space-y-6">
              <div>
                <label for="name" class="block text-sm font-semibold text-slate-700 dark:text-gray-200 mb-2">
                  Full Name <span class="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  id="name" 
                  bind:value={newUser.name} 
                  placeholder="John Doe"
                  required 
                  class="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-slate-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label for="email" class="block text-sm font-semibold text-slate-700 dark:text-gray-200 mb-2">
                  Email <span class="text-red-500">*</span>
                </label>
                <input 
                  type="email" 
                  id="email" 
                  bind:value={newUser.email} 
                  placeholder="john@example.com"
                  required 
                  class="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-slate-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label for="username" class="block text-sm font-semibold text-slate-700 dark:text-gray-200 mb-2">
                  Username
                </label>
                <input 
                  type="text" 
                  id="username" 
                  bind:value={newUser.username} 
                  placeholder="johndoe (optional)"
                  class="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-slate-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label for="password" class="block text-sm font-semibold text-slate-700 dark:text-gray-200 mb-2">
                  Password <span class="text-red-500">*</span>
                </label>
                <input 
                  type="password" 
                  id="password" 
                  bind:value={newUser.password} 
                  placeholder="Enter a secure password"
                  required 
                  class="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-slate-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {#if loading}
                  <i class="fas fa-spinner fa-spin"></i> Creating...
                {:else}
                  <i class="fas fa-user-plus"></i> Create User
                {/if}
              </button>
            </form>
          </div>
        </div>
      </section>
    {/if}

    <!-- Admins Tab -->
    {#if activeTab === 'admins'}
      <section>
        {#if admins.length === 0}
          <div class="text-center py-12">
            <div class="mb-4">
              <i class="fas fa-shield-alt text-5xl text-gray-200 dark:text-gray-700"></i>
            </div>
            <h3 class="text-xl font-bold text-slate-800 dark:text-gray-200 mb-2">No admins</h3>
            <p class="text-slate-400 dark:text-gray-500">Promote users to admin status from the Users tab</p>
          </div>
        {:else}
          <div class="space-y-3">
            {#each admins as admin (admin)}
              <div class="bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-900/50 rounded-lg p-4 hover:shadow-md dark:hover:shadow-lg/20 transition-all">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                      <i class="fas fa-shield-alt text-indigo-600 dark:text-indigo-400"></i>
                    </div>
                    <div>
                      <p class="font-semibold text-slate-800 dark:text-gray-100">{admin}</p>
                      {#if admin === 'kyogre.perseus09@gmail.com'}
                        <p class="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                          <i class="fas fa-star mr-1"></i> Original Admin
                        </p>
                      {/if}
                    </div>
                  </div>
                  {#if admin !== 'kyogre.perseus09@gmail.com' && admin !== data.user.email}
                    <button 
                      on:click={() => removeAdmin(admin)}
                      class="px-3 py-2 text-xs font-semibold rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                    >
                      <i class="fas fa-trash mr-1"></i> Remove
                    </button>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </section>
    {/if}
  </main>
</div>