<script lang="ts">
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import type { Theme, ThankYouPage } from "$lib/types";
  import ThankYouPageDisplay from "$lib/components/ThankYouPageDisplay.svelte";
  import Surface from "$lib/components/ui/Surface.svelte";
  import QRCode from "qrcode";

  let theme: Theme | null = null;
  let backgroundColor = "#ffffff";
  let thankYouPageConfig: ThankYouPage | undefined;
  let loading = true;
  let enableCheckin = false;
  let formId: string | null = null;
  let submissionId: string | null = null;
  let qrDataUrl: string | null = null;

  $: if ($page.data?.theme !== undefined) {
    theme = $page.data.theme;
    backgroundColor = $page.data.backgroundColor || "#ffffff";
    thankYouPageConfig = $page.data.thankYouPage;
    enableCheckin = $page.data.enableCheckin || false;
    formId = $page.data.formId || null;
    loading = false;
  }

  onMount(async () => {
    const urlSubmissionId = $page.url.searchParams.get("submissionId");

    if (urlSubmissionId) {
      submissionId = urlSubmissionId;
      if (formId) localStorage.setItem(`form_submission_id_${formId}`, submissionId);
    } else if (formId) {
      submissionId = localStorage.getItem(`form_submission_id_${formId}`);
    }

    if (enableCheckin && submissionId) {
      try {
        const qrPayload = JSON.stringify({ type: "quill-checkin", formId, submissionId });
        qrDataUrl = await QRCode.toDataURL(qrPayload, {
          width: 280,
          margin: 2,
          color: {
            dark: theme && theme.id === "ide-dark" ? "#14b8a6" : "#1f2328",
            light: "#ffffff",
          },
          errorCorrectionLevel: "M",
        });
      } catch (err) {
        console.error("Failed to generate QR code:", err);
      }
    }
  });

  function downloadQR() {
    if (!qrDataUrl) return;
    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 540;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 400, 540);
    ctx.fillStyle = "#1f2328";
    ctx.fillRect(0, 0, 400, 60);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 22px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Entry Pass", 200, 40);

    ctx.fillStyle = "#5f6872";
    ctx.font = "14px Arial, sans-serif";
    ctx.fillText(`${$page.params.username}/${$page.params.slug}`, 200, 90);

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 60, 110, 280, 280);
      ctx.fillStyle = "#7d8690";
      ctx.font = "11px monospace";
      ctx.fillText(`ID: ${submissionId?.substring(0, 8)}...`, 200, 420);
      ctx.fillStyle = "#ece8e0";
      ctx.fillRect(0, 460, 400, 80);
      ctx.fillStyle = "#5f6872";
      ctx.font = "12px Arial, sans-serif";
      ctx.fillText("Present this QR code at the event for check-in", 200, 495);
      ctx.fillText("Powered by Quill", 200, 520);

      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "entry-pass.png";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, "image/png");
    };
    img.src = qrDataUrl;
  }
</script>

<svelte:head>
  <title>Form Submitted - Thank You</title>
  <meta name="robots" content="noindex, nofollow" />
  <meta name="description" content="Thank you for submitting the form" />
</svelte:head>

<div
  class="min-h-screen transition-colors duration-200"
  style={`background-color:${theme && theme.id === "ide-dark" ? "#1a1a1a" : backgroundColor};`}
>
  {#if loading}
    <div class="flex min-h-screen items-center justify-center">
      <div class="flex flex-col items-center gap-3">
        <div class="h-8 w-8 animate-spin rounded-full border-2 border-[color:rgba(255,255,255,0.35)] border-t-[color:rgba(255,255,255,0.9)]"></div>
        <p class="text-sm text-white/80">Preparing your confirmation…</p>
      </div>
    </div>
  {:else if thankYouPageConfig?.enabled}
    <div class="space-y-8">
      <ThankYouPageDisplay
        config={thankYouPageConfig}
        formInfo={$page.data.username && $page.data.slug ? `Form: ${$page.data.username}/${$page.data.slug}` : ""}
      />

      {#if enableCheckin && qrDataUrl}
        <div class="mx-auto max-w-sm px-4 pb-10">
          <Surface className="panel-section text-center surface-strong">
            <h3 class="section-title">Entry pass</h3>
            <p class="mt-1 text-sm muted">Present this code during check-in.</p>
            <img src={qrDataUrl} alt="Check-in QR code" class="mx-auto my-6 rounded-[10px] border bg-white p-2" />
            <button type="button" on:click={downloadQR} class="btn btn-primary w-full">
              <i class="fas fa-download text-xs"></i>
              <span>Download pass</span>
            </button>
          </Surface>
        </div>
      {/if}
    </div>
  {:else}
    <div class="flex min-h-screen items-center justify-center px-4 py-10">
      <Surface className="panel-section max-w-md text-center surface-strong">
        <div class="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full" style={`background:${theme && theme.id === "ide-dark" ? "rgba(20,184,166,0.16)" : "rgba(47,122,85,0.12)"}; color:${theme && theme.id === "ide-dark" ? "#14b8a6" : "#2f7a55"};`}>
          <i class="fas fa-check text-lg"></i>
        </div>
        <h1 class="text-[30px] font-semibold tracking-tight text-[color:var(--text)]">Thank you</h1>
        <p class="mt-2 text-base leading-7 muted">Your response has been recorded successfully.</p>

        {#if enableCheckin && qrDataUrl}
          <Surface className="panel-section surface-muted mt-6">
            <h3 class="section-title">Entry pass</h3>
            <p class="mt-1 text-sm muted">Present this code during check-in.</p>
            <img src={qrDataUrl} alt="Check-in QR code" class="mx-auto my-5 rounded-[10px] border bg-white p-2" />
            <button type="button" on:click={downloadQR} class="btn btn-primary w-full">
              <i class="fas fa-download text-xs"></i>
              <span>Download pass</span>
            </button>
          </Surface>
        {/if}

        <p class="mt-6 text-sm muted-soft">
          Form: <span class="font-mono">{$page.params.username}/{$page.params.slug}</span>
        </p>

        <div class="mt-6 flex flex-col gap-2">
          <a href="/" class="btn btn-primary">Create another form</a>
          <a href="/" class="btn btn-secondary">Back to home</a>
        </div>
      </Surface>
    </div>
  {/if}
</div>
