<!-- src/routes/preview/[formId]/+page.svelte -->
<!-- Lightweight preview route used by the form builder's iframe preview.
     Receives form data via postMessage from the parent window. -->
<script lang="ts">
    import FormPreview from "$lib/components/FormPreview.svelte";
    import type { Form } from "$lib/types";
    import { onMount } from "svelte";
    import { browser } from "$app/environment";
    import { goto } from "$app/navigation";

    let formData: Form | undefined;
    let ready = false;

    onMount(() => {
        // Block direct access — only allow loading inside an iframe
        if (window.self === window.top) {
            goto("/");
            return;
        }

        // Listen for form data from the parent window (form builder)
        window.addEventListener("message", (event) => {
            if (event.data && event.data.type === "UPDATE_FORM_PREVIEW") {
                formData = event.data.data;
                ready = true;
            }
        });

        // Signal to the parent that we are ready to receive data
        if (window.parent && window.parent !== window) {
            window.parent.postMessage({ type: "PREVIEW_IFRAME_READY" }, "*");
        }
    });
</script>

<svelte:head>
    <title>Preview</title>
    <meta name="robots" content="noindex, nofollow" />
</svelte:head>

{#if formData && ready}
    <FormPreview
        questions={formData.questions || []}
        formId={formData.id}
        isClosed={formData.closed || false}
        backgroundType={formData.backgroundType || "color"}
        backgroundColor={formData.backgroundColor || "#ffffff"}
        backgroundImage={formData.backgroundImage || ""}
        globalTextColor={formData?.globalTextColor || ""}
        theme={formData.theme}
        onSubmit={() => {}}
    />
{:else}
    <div class="h-screen w-full flex items-center justify-center">
        <div
            class="w-8 h-8 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin"
        ></div>
    </div>
{/if}
