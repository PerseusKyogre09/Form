<!-- src/routes/form/[username]/[slug]/success/+page.svelte -->
<script lang="ts">
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import { supabase } from "$lib/supabaseClient";
  import type { Theme, ThankYouPage } from "$lib/types";
  import ThankYouPageDisplay from "$lib/components/ThankYouPageDisplay.svelte";
  import QRCode from "qrcode";

  let theme: Theme | null = null;
  let backgroundColor = "#ffffff";
  let thankYouPageConfig: ThankYouPage | undefined;
  let loading = true;
  let enableCheckin = false;
  let formId: string | null = null;
  let submissionId: string | null = null;
  let qrDataUrl: string | null = null;

  // Check if data was passed from server
  $: if ($page.data?.theme !== undefined) {
    theme = $page.data.theme;
    backgroundColor = $page.data.backgroundColor || "#ffffff";
    thankYouPageConfig = $page.data.thankYouPage;
    enableCheckin = $page.data.enableCheckin || false;
    formId = $page.data.formId || null;
    loading = false;
  }

  onMount(async () => {
    // Only fetch if not already loaded from server
    if (loading) {
      try {
        const username = $page.params.username as string;
        const slug = $page.params.slug as string;

        // First, get the user ID from the username
        const { data: profileData } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", username)
          .single();

        if (profileData) {
          // Then get the form by user_id and slug
          const { data: formData } = await supabase
            .from("forms")
            .select(
              "id, background_color, theme, thank_you_page, enable_checkin",
            )
            .eq("user_id", profileData.id)
            .eq("slug", slug)
            .single();

          if (formData) {
            theme = formData.theme || null;
            backgroundColor = formData.background_color || "#ffffff";
            thankYouPageConfig = formData.thank_you_page;
            enableCheckin = formData.enable_checkin || false;
            formId = formData.id;
            console.log("Thank you page loaded:", thankYouPageConfig);
          }
        }
      } catch (error) {
        console.error("Error loading thank you page:", error);
      } finally {
        loading = false;
      }
    }

    // Retrieve submission ID from URL or localStorage
    const urlSubmissionId = $page.url.searchParams.get("submissionId");

    if (urlSubmissionId) {
      submissionId = urlSubmissionId;
      // Re-save to localStorage just in case they cleared it
      if (formId)
        localStorage.setItem(`form_submission_id_${formId}`, submissionId);
    } else if (formId) {
      submissionId = localStorage.getItem(`form_submission_id_${formId}`);
    }

    // Generate QR code if check-in is enabled and we have a submission ID
    if (enableCheckin && submissionId) {
      try {
        const qrPayload = JSON.stringify({
          type: "quill-checkin",
          formId,
          submissionId,
        });
        qrDataUrl = await QRCode.toDataURL(qrPayload, {
          width: 280,
          margin: 2,
          color: {
            dark: theme && theme.id === "ide-dark" ? "#14b8a6" : "#1e293b",
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
    // Create a nicer "Entry Pass" canvas
    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 540;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 400, 540);

    // Header bar
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, 0, 400, 60);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 22px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Entry Pass", 200, 40);

    // Form info
    ctx.fillStyle = "#64748b";
    ctx.font = "14px Arial, sans-serif";
    const formLabel = `${$page.params.username}/${$page.params.slug}`;
    ctx.fillText(formLabel, 200, 90);

    // QR Code
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 60, 110, 280, 280);

      // Submission ID
      ctx.fillStyle = "#94a3b8";
      ctx.font = "11px monospace";
      ctx.fillText(`ID: ${submissionId?.substring(0, 8)}...`, 200, 420);

      // Footer
      ctx.fillStyle = "#e2e8f0";
      ctx.fillRect(0, 460, 400, 80);
      ctx.fillStyle = "#64748b";
      ctx.font = "12px Arial, sans-serif";
      ctx.fillText("Present this QR code at the event for check-in", 200, 495);
      ctx.fillText("Powered by Quill", 200, 520);

      // Download
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
  <meta property="og:title" content="Thank You - Form Submitted" />
  <meta property="og:description" content="Your response has been received" />
</svelte:head>

<div
  class="min-h-screen flex items-center justify-center transition-colors duration-200"
  style="background-color: {theme && theme.id === 'ide-dark'
    ? '#1a1a1a'
    : backgroundColor};"
>
  {#if loading}
    <div class="flex flex-row gap-2">
      <div class="w-4 h-4 rounded-full bg-blue-700 animate-bounce"></div>
      <div
        class="w-4 h-4 rounded-full bg-blue-700 animate-bounce [animation-delay:-.3s]"
      ></div>
      <div
        class="w-4 h-4 rounded-full bg-blue-700 animate-bounce [animation-delay:-.5s]"
      ></div>
    </div>
  {:else if thankYouPageConfig?.enabled}
    <div class="flex flex-col items-center gap-8">
      <ThankYouPageDisplay
        config={thankYouPageConfig}
        formInfo={$page.data.username && $page.data.slug
          ? `Form: ${$page.data.username}/${$page.data.slug}`
          : ""}
      />

      <!-- QR Check-in Section (shown below ThankYouPageDisplay) -->
      {#if enableCheckin && qrDataUrl}
        <div class="text-center max-w-sm mx-auto px-6 pb-12">
          <div
            class="bg-white rounded-2xl shadow-xl p-8 border border-gray-100"
          >
            <h3 class="text-lg font-bold text-slate-800 mb-2">
              Your Entry Pass
            </h3>
            <p class="text-sm text-slate-500 mb-6">
              Present this QR code at the event for check-in
            </p>
            <img
              src={qrDataUrl}
              alt="Check-in QR Code"
              class="mx-auto mb-6 rounded-lg"
            />
            <button
              on:click={downloadQR}
              class="w-full flex items-center justify-center gap-2 px-5 py-3 bg-slate-900 hover:bg-black text-white text-sm font-semibold rounded-xl transition-colors shadow-lg"
            >
              <i class="fas fa-download"></i>
              Download Entry Pass
            </button>
          </div>
        </div>
      {/if}
    </div>
  {:else}
    <!-- Fallback to default design -->
    <div class="text-center max-w-md px-6">
      <div class="mb-6">
        <div
          class="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
          style="background-color: {theme && theme.id === 'ide-dark'
            ? 'rgba(20,184,166,0.2)'
            : 'rgba(34,197,94,0.2)'};"
        >
          <svg
            class="w-8 h-8"
            fill="currentColor"
            viewBox="0 0 20 20"
            style="color: {theme && theme.id === 'ide-dark'
              ? '#14b8a6'
              : '#22c55e'};"
          >
            <path
              fill-rule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
        <h1
          class="text-4xl font-bold mb-2"
          style="color: {theme && theme.id === 'ide-dark'
            ? '#e0e0e0'
            : '#000000'};"
        >
          Thank You!
        </h1>
        <p
          class="text-lg mb-6"
          style="color: {theme && theme.id === 'ide-dark'
            ? '#a0a0a0'
            : '#4b5563'};"
        >
          Your response has been recorded successfully.
        </p>
      </div>

      <!-- QR Check-in Section (shown below default thank you) -->
      {#if enableCheckin && qrDataUrl}
        <div
          class="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 mb-8"
        >
          <h3 class="text-lg font-bold text-slate-800 mb-2">Your Entry Pass</h3>
          <p class="text-sm text-slate-500 mb-6">
            Present this QR code at the event for check-in
          </p>
          <img
            src={qrDataUrl}
            alt="Check-in QR Code"
            class="mx-auto mb-6 rounded-lg"
          />
          <button
            on:click={downloadQR}
            class="w-full flex items-center justify-center gap-2 px-5 py-3 bg-slate-900 hover:bg-black text-white text-sm font-semibold rounded-xl transition-colors shadow-lg"
          >
            <i class="fas fa-download"></i>
            Download Entry Pass
          </button>
        </div>
      {/if}

      <div class="space-y-4">
        <p
          class="text-sm mb-6"
          style="color: {theme && theme.id === 'ide-dark'
            ? '#808080'
            : '#6b7280'};"
        >
          Form: <span
            class="font-mono"
            style="color: {theme && theme.id === 'ide-dark'
              ? '#b0b0b0'
              : '#374151'};">{$page.params.username}/{$page.params.slug}</span
          >
        </p>

        <a
          href="/"
          class="block px-6 py-3 rounded-md font-medium transition-colors text-white"
          style="background-color: {theme && theme.id === 'ide-dark'
            ? '#14b8a6'
            : '#000000'};"
        >
          Create Another Form
        </a>

        <a
          href="/"
          class="block px-6 py-3 rounded-md font-medium transition-colors"
          style="background-color: {theme && theme.id === 'ide-dark'
            ? 'rgba(20,184,166,0.1)'
            : '#f3f4f6'}; color: {theme && theme.id === 'ide-dark'
            ? '#e0e0e0'
            : '#000000'};"
        >
          Back to Home
        </a>
      </div>
    </div>
  {/if}
</div>
