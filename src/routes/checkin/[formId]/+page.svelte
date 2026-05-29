<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { Html5Qrcode } from "html5-qrcode";
  import DashboardHeader from "$lib/components/DashboardHeader.svelte";
  import ModalShell from "$lib/components/ui/ModalShell.svelte";
  import PageHeader from "$lib/components/ui/PageHeader.svelte";
  import Surface from "$lib/components/ui/Surface.svelte";

  export let data: any;

  let scanner: Html5Qrcode | null = null;
  let scannerReady = false;
  let scanning = false;
  let lastResult: {
    success: boolean;
    attendeeName: string;
    message: string;
    alreadyCheckedIn?: boolean;
  } | null = null;
  let errorMessage: string | null = null;
  let processing = false;

  let totalResponses = data.stats.totalResponses;
  let checkedIn = data.stats.checkedIn;
  let scanHistory: Array<{ name: string; time: string; duplicate: boolean }> = [];

  onMount(async () => {
    try {
      scanner = new Html5Qrcode("qr-reader");
      scannerReady = true;
    } catch (err) {
      console.error("Failed to initialize scanner:", err);
      errorMessage = "Could not initialize camera. Please ensure camera access is allowed.";
    }
  });

  onDestroy(() => {
    stopScanning();
  });

  async function startScanning() {
    if (!scanner) return;
    errorMessage = null;
    lastResult = null;

    try {
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        onScanSuccess,
        () => {},
      );
      scanning = true;
    } catch (err: any) {
      console.error("Camera error:", err);
      errorMessage = "Could not access camera. Please allow camera permissions and try again.";
    }
  }

  async function stopScanning() {
    if (scanner && scanning) {
      try {
        await scanner.stop();
        scanning = false;
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
  }

  async function onScanSuccess(decodedText: string) {
    if (processing) return;
    processing = true;

    try {
      const payload = JSON.parse(decodedText);

      if (payload.type !== "quill-checkin" || payload.formId !== data.form.id) {
        lastResult = { success: false, attendeeName: "", message: "Invalid QR code for this form." };
        processing = false;
        return;
      }

      if (navigator.vibrate) navigator.vibrate(100);

      const response = await fetch(`/api/checkin/${data.form.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId: payload.submissionId }),
      });

      const result = await response.json();
      if (response.ok) {
        lastResult = result;
        const now = new Date().toLocaleTimeString();
        scanHistory = [
          { name: result.attendeeName, time: now, duplicate: result.alreadyCheckedIn || false },
          ...scanHistory,
        ];

        if (result.success && !result.alreadyCheckedIn) {
          checkedIn += 1;
          if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        }
      } else {
        lastResult = { success: false, attendeeName: "", message: result.error || "Check-in failed." };
      }
    } catch (err) {
      console.error("Scan processing error:", err);
      lastResult = { success: false, attendeeName: "", message: "Invalid QR code format." };
    }

    setTimeout(() => {
      lastResult = null;
      processing = false;
    }, 3000);
  }
</script>

<svelte:head>
  <title>Check-in Scanner - {data.form.title}</title>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="app-shell">
  <DashboardHeader />

  <main class="page-container page-stack section-stack max-w-4xl">
    <PageHeader eyebrow="Check-in" title="Scanner" description={data.form.title} />

    <div class="grid gap-4 sm:grid-cols-2">
      <Surface className="panel-section text-center">
        <p class="text-3xl font-semibold tracking-tight text-[color:var(--text)]">{totalResponses}</p>
        <p class="mt-1 text-sm muted">Total registrations</p>
      </Surface>
      <Surface className="panel-section text-center">
        <p class="text-3xl font-semibold tracking-tight text-[color:var(--success)]">{checkedIn}</p>
        <p class="mt-1 text-sm muted">Checked in</p>
      </Surface>
    </div>

    <Surface className="overflow-hidden">
      <div id="qr-reader" class="relative aspect-square w-full bg-[#141414]">
        {#if !scanning}
          <div class="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/70">
            <i class="fas fa-qrcode text-4xl"></i>
            <p class="text-sm">Camera preview will appear here</p>
          </div>
        {/if}
      </div>
      <div class="panel-section">
        {#if !scanning}
          <button type="button" on:click={startScanning} disabled={!scannerReady} class="btn btn-primary w-full">
            <i class="fas fa-camera text-xs"></i>
            <span>Start scanning</span>
          </button>
        {:else}
          <button type="button" on:click={stopScanning} class="btn btn-danger w-full">
            <i class="fas fa-stop text-xs"></i>
            <span>Stop scanning</span>
          </button>
        {/if}
      </div>
    </Surface>

    {#if errorMessage}
      <div class="rounded-[10px] border px-4 py-3 text-sm" style="background: color-mix(in srgb, var(--danger) 10%, var(--surface-strong)); border-color: color-mix(in srgb, var(--danger) 20%, var(--border)); color: var(--danger);">
        {errorMessage}
      </div>
    {/if}

    {#if scanHistory.length > 0}
      <Surface className="panel-section">
        <div class="mb-4">
          <h2 class="section-title">Recent scans</h2>
          <p class="mt-1 text-sm muted">Most recent activity appears first.</p>
        </div>

        <div class="space-y-3">
          {#each scanHistory as scan}
            <div class="flex items-center justify-between gap-3 rounded-[10px] border px-4 py-3 surface-muted">
              <div class="flex min-w-0 items-center gap-3">
                <div class="flex h-9 w-9 items-center justify-center rounded-full border surface-strong">
                  <i class={`fas ${scan.duplicate ? "fa-redo" : "fa-check"} text-xs ${scan.duplicate ? "text-[color:var(--warning)]" : "text-[color:var(--success)]"}`}></i>
                </div>
                <div class="min-w-0">
                  <p class="truncate text-sm font-medium text-[color:var(--text)]">{scan.name}</p>
                  <p class="text-xs muted-soft">{scan.time}</p>
                </div>
              </div>
              {#if scan.duplicate}
                <span class="status-badge badge-muted">Duplicate</span>
              {/if}
            </div>
          {/each}
        </div>
      </Surface>
    {/if}
  </main>

  {#if lastResult}
    <ModalShell
      title={lastResult.success ? "Check-in complete" : lastResult.alreadyCheckedIn ? "Already checked in" : "Scan issue"}
      description={lastResult.success
        ? lastResult.attendeeName
        : lastResult.message}
      maxWidthClass="max-w-sm"
    >
      <div class="p-5 text-center">
        <div
          class="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
          style={`background: ${lastResult.success
            ? "color-mix(in srgb, var(--success) 14%, var(--surface-strong))"
            : lastResult.alreadyCheckedIn
              ? "color-mix(in srgb, var(--warning) 14%, var(--surface-strong))"
              : "color-mix(in srgb, var(--danger) 14%, var(--surface-strong))"}; color: ${lastResult.success ? "var(--success)" : lastResult.alreadyCheckedIn ? "var(--warning)" : "var(--danger)"};`}
        >
          <i class={`fas ${lastResult.success ? "fa-check" : lastResult.alreadyCheckedIn ? "fa-exclamation" : "fa-times"} text-lg`}></i>
        </div>
      </div>
    </ModalShell>
  {/if}
</div>
