<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { page } from "$app/stores";
    import { Html5Qrcode } from "html5-qrcode";
    import favicon from "$lib/assets/favicon.svg";

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

    let scanHistory: Array<{ name: string; time: string; duplicate: boolean }> =
        [];

    onMount(async () => {
        try {
            scanner = new Html5Qrcode("qr-reader");
            scannerReady = true;
        } catch (err) {
            console.error("Failed to initialize scanner:", err);
            errorMessage =
                "Could not initialize camera. Please ensure camera access is allowed.";
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
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                },
                onScanSuccess,
                () => {}, // Ignore scan failures (no QR in frame)
            );
            scanning = true;
        } catch (err: any) {
            console.error("Camera error:", err);
            errorMessage =
                "Could not access camera. Please allow camera permissions and try again.";
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
        if (processing) return; // Debounce
        processing = true;

        try {
            const payload = JSON.parse(decodedText);

            if (
                payload.type !== "quill-checkin" ||
                payload.formId !== data.form.id
            ) {
                lastResult = {
                    success: false,
                    attendeeName: "",
                    message: "Invalid QR code for this form.",
                };
                processing = false;
                return;
            }

            // Haptic feedback
            if (navigator.vibrate) {
                navigator.vibrate(100);
            }

            // Call the check-in API
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
                    {
                        name: result.attendeeName,
                        time: now,
                        duplicate: result.alreadyCheckedIn || false,
                    },
                    ...scanHistory,
                ];

                if (result.success && !result.alreadyCheckedIn) {
                    checkedIn += 1;
                    // Haptic for success
                    if (navigator.vibrate) {
                        navigator.vibrate([100, 50, 100]);
                    }
                }
            } else {
                lastResult = {
                    success: false,
                    attendeeName: "",
                    message: result.error || "Check-in failed.",
                };
            }
        } catch (err) {
            console.error("Scan processing error:", err);
            lastResult = {
                success: false,
                attendeeName: "",
                message: "Invalid QR code format.",
            };
        }

        // Auto-clear result after 3 seconds
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

<div class="min-h-screen bg-slate-50 font-sans">
    <!-- Header -->
    <header class="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div
            class="max-w-lg mx-auto px-4 h-14 flex items-center justify-between"
        >
            <div class="flex items-center gap-3">
                <a href="/dashboard" class="flex items-center gap-2">
                    <img src={favicon} alt="Quill" class="w-6 h-6" />
                    <span class="text-lg font-bold text-slate-800">Quill</span>
                </a>
            </div>
            <div class="flex items-center gap-2 text-xs">
                <span
                    class="bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-semibold"
                >
                    {checkedIn} / {totalResponses}
                </span>
            </div>
        </div>
    </header>

    <div class="max-w-lg mx-auto px-4 py-6 space-y-6">
        <!-- Form Title -->
        <div class="text-center">
            <h1 class="text-xl font-bold text-slate-900 mb-1">
                Check-in Scanner
            </h1>
            <p class="text-sm text-slate-500">{data.form.title}</p>
        </div>

        <!-- Stats Badges -->
        <div class="grid grid-cols-2 gap-3">
            <div
                class="bg-white rounded-xl p-4 text-center border border-gray-100 shadow-sm"
            >
                <div class="text-2xl font-bold text-slate-800">
                    {totalResponses}
                </div>
                <div class="text-xs text-slate-500 font-medium mt-1">
                    Total Registrations
                </div>
            </div>
            <div
                class="bg-white rounded-xl p-4 text-center border border-gray-100 shadow-sm"
            >
                <div class="text-2xl font-bold text-green-600">{checkedIn}</div>
                <div class="text-xs text-slate-500 font-medium mt-1">
                    Checked In
                </div>
            </div>
        </div>

        <!-- Scanner Container -->
        <div
            class="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm"
        >
            <div
                id="qr-reader"
                class="w-full aspect-square bg-gray-900 relative"
            >
                {#if !scanning}
                    <div
                        class="absolute inset-0 flex flex-col items-center justify-center text-white/60"
                    >
                        <i class="fas fa-qrcode text-5xl mb-4"></i>
                        <p class="text-sm">Camera preview will appear here</p>
                    </div>
                {/if}
            </div>

            <!-- Scanner Controls -->
            <div class="p-4">
                {#if !scanning}
                    <button
                        on:click={startScanning}
                        disabled={!scannerReady}
                        class="w-full py-3.5 bg-slate-900 hover:bg-black text-white rounded-xl font-semibold text-sm transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <i class="fas fa-camera"></i>
                        Start Scanning
                    </button>
                {:else}
                    <button
                        on:click={stopScanning}
                        class="w-full py-3.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold text-sm transition-colors shadow-lg flex items-center justify-center gap-2"
                    >
                        <i class="fas fa-stop"></i>
                        Stop Scanning
                    </button>
                {/if}
            </div>
        </div>

        <!-- Scan Result Overlay -->
        {#if lastResult}
            <div
                class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                role="dialog"
                aria-modal="true"
                aria-label="Scan result"
            >
                <div
                    class="bg-white rounded-2xl p-8 mx-6 max-w-sm w-full text-center shadow-2xl animate-bounce-in"
                >
                    {#if lastResult.success}
                        <div
                            class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
                        >
                            <i class="fas fa-check text-green-600 text-2xl"></i>
                        </div>
                        <h3 class="text-xl font-bold text-slate-900 mb-1">
                            {lastResult.attendeeName}
                        </h3>
                        <p class="text-sm text-green-600 font-medium">
                            Successfully checked in!
                        </p>
                    {:else if lastResult.alreadyCheckedIn}
                        <div
                            class="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4"
                        >
                            <i
                                class="fas fa-exclamation-triangle text-amber-600 text-2xl"
                            ></i>
                        </div>
                        <h3 class="text-xl font-bold text-slate-900 mb-1">
                            {lastResult.attendeeName}
                        </h3>
                        <p class="text-sm text-amber-600 font-medium">
                            Already checked in
                        </p>
                    {:else}
                        <div
                            class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"
                        >
                            <i class="fas fa-times text-red-600 text-2xl"></i>
                        </div>
                        <h3 class="text-xl font-bold text-slate-900 mb-1">
                            Invalid
                        </h3>
                        <p class="text-sm text-red-600 font-medium">
                            {lastResult.message}
                        </p>
                    {/if}
                </div>
            </div>
        {/if}

        <!-- Error Message -->
        {#if errorMessage}
            <div class="bg-red-50 border border-red-200 rounded-xl p-4">
                <p class="text-sm text-red-700">{errorMessage}</p>
            </div>
        {/if}

        <!-- Scan History -->
        {#if scanHistory.length > 0}
            <div
                class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
            >
                <div class="px-4 py-3 border-b border-gray-100">
                    <h3 class="text-sm font-bold text-slate-700">
                        Recent Scans
                    </h3>
                </div>
                <div class="divide-y divide-gray-50 max-h-64 overflow-y-auto">
                    {#each scanHistory as scan}
                        <div
                            class="px-4 py-3 flex items-center justify-between"
                        >
                            <div class="flex items-center gap-3">
                                <div
                                    class="w-8 h-8 rounded-full {scan.duplicate
                                        ? 'bg-amber-100'
                                        : 'bg-green-100'} flex items-center justify-center"
                                >
                                    <i
                                        class="fas {scan.duplicate
                                            ? 'fa-redo'
                                            : 'fa-check'} text-xs {scan.duplicate
                                            ? 'text-amber-600'
                                            : 'text-green-600'}"
                                    ></i>
                                </div>
                                <div>
                                    <div
                                        class="text-sm font-medium text-slate-800"
                                    >
                                        {scan.name}
                                    </div>
                                    <div class="text-xs text-slate-400">
                                        {scan.time}
                                    </div>
                                </div>
                            </div>
                            {#if scan.duplicate}
                                <span
                                    class="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium"
                                    >Duplicate</span
                                >
                            {/if}
                        </div>
                    {/each}
                </div>
            </div>
        {/if}
    </div>
</div>

<style>
    @keyframes bounce-in {
        0% {
            transform: scale(0.8);
            opacity: 0;
        }
        50% {
            transform: scale(1.05);
        }
        100% {
            transform: scale(1);
            opacity: 1;
        }
    }
    .animate-bounce-in {
        animation: bounce-in 0.3s ease-out;
    }
</style>
