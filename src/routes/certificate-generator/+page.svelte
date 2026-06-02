<script lang="ts">
    import { onMount } from "svelte";
    import {
        Type,
        Image as ImageIcon,
        Download,
        Plus,
        Trash2,
        AlignLeft,
        AlignCenter,
        AlignRight,
    } from "lucide-svelte";
    import JSZip from "jszip";
    import favicon from "$lib/assets/favicon.svg";
    import { authClient } from "$lib/authClient";
    import DashboardHeader from "$lib/components/DashboardHeader.svelte";

    // --- Mobile State ---
    let activeMobilePanel = $state<"canvas" | "insert" | "properties">(
        "canvas",
    );

    // --- Import State ---
    let showImportModal = $state(false);
    let importableForms: Array<{ id: string; title: string }> = $state([]);
    let selectedImportFormId: string | null = $state(null);
    let isImporting = $state(false);
    let importFilter: "all" | "checked_in" = $state("checked_in");

    async function loadImportableForms() {
        const { data: session } = await authClient.getSession();
        if (!session?.user) {
            alert("Please log in to import attendees from your forms.");
            return;
        }

        try {
            const res = await fetch("/api/forms");
            if (!res.ok) throw new Error("Failed to load forms");
            const data = await res.json();

            if (data.forms) {
                importableForms = data.forms.map((f: any) => ({
                    id: f.id,
                    title: f.title,
                }));
                showImportModal = true;
            }
        } catch (err) {
            console.error("Error loading forms:", err);
            alert("Failed to load your forms.");
        }
    }

    async function importAttendees() {
        if (!selectedImportFormId) return;
        isImporting = true;

        try {
            const params = new URLSearchParams({
                formId: selectedImportFormId,
                filter: importFilter,
            });
            const res = await fetch(`/api/certificates/attendees?${params}`);

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || "Failed to fetch attendees");
            }

            const { names } = await res.json();

            if (names && names.length > 0) {
                batchNames = names.join("\n");
                showImportModal = false;
            } else {
                alert(
                    importFilter === "checked_in"
                        ? "No checked-in attendees found for this form yet."
                        : "No valid names could be extracted from the responses.",
                );
            }
        } catch (err) {
            console.error("Import error:", err);
            alert("Failed to import attendees.");
        } finally {
            isImporting = false;
        }
    }

    // --- State Definitions ---
    type ElementType = "text" | "image";

    interface BaseElement {
        id: string;
        type: ElementType;
        x: number;
        y: number;
    }

    interface TextElement extends BaseElement {
        type: "text";
        content: string;
        fontSize: number;
        color: string;
        fontFamily: string;
        fontWeight: string;
        textAnchor: "start" | "middle" | "end";
    }

    interface ImageElement extends BaseElement {
        type: "image";
        src: string;
        width: number;
        height: number;
    }

    type CanvasElement = TextElement | ImageElement;

    // --- App State ---
    let elements: CanvasElement[] = $state([]);
    let selectedElementId: string | null = $state(null);
    let backgroundImageUrl: string | null = $state(null);
    let batchNames: string = $state("John Doe\nJane Smith\nAlice Johnson");

    // Canvas Dimensions (A4 landscape ratio)
    const CANVAS_WIDTH = 1123;
    const CANVAS_HEIGHT = 794;

    let dragInfo = $state<{
        isDragging: boolean;
        elementId: string | null;
        startX: number;
        startY: number;
        initialElementX: number;
        initialElementY: number;
    }>({
        isDragging: false,
        elementId: null,
        startX: 0,
        startY: 0,
        initialElementX: 0,
        initialElementY: 0,
    });

    let svgRef: SVGSVGElement;

    // --- Actions ---

    function addText() {
        const newText: TextElement = {
            id: crypto.randomUUID(),
            type: "text",
            x: CANVAS_WIDTH / 2,
            y: CANVAS_HEIGHT / 2,
            content: "{{NAME}}",
            fontSize: 64,
            color: "#000000",
            fontFamily: "Arial",
            fontWeight: "bold",
            textAnchor: "middle",
        };
        elements = [...elements, newText];
        selectedElementId = newText.id;
    }

    function handleBgUpload(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                backgroundImageUrl = e.target?.result as string;
            };
            reader.readAsDataURL(input.files[0]);
        }
    }

    function deleteElement(id: string) {
        elements = elements.filter((e) => e.id !== id);
        if (selectedElementId === id) {
            selectedElementId = null;
        }
    }

    // --- Pointer Events for Canvas ---

    function getMouseCoords(event: PointerEvent) {
        if (!svgRef) return { x: 0, y: 0 };
        const CTM = svgRef.getScreenCTM();
        if (!CTM) return { x: 0, y: 0 };
        return {
            x: (event.clientX - CTM.e) / CTM.a,
            y: (event.clientY - CTM.f) / CTM.d,
        };
    }

    function onPointerDown(event: PointerEvent, elementId: string | null) {
        event.stopPropagation();
        event.preventDefault(); // prevent text selection
        // Select the element
        selectedElementId = elementId;
        if (!elementId) return;

        const el = elements.find((e) => e.id === elementId);
        if (!el) return;

        const coords = getMouseCoords(event);
        dragInfo = {
            isDragging: true,
            elementId,
            startX: coords.x,
            startY: coords.y,
            initialElementX: el.x,
            initialElementY: el.y,
        };
    }

    function onPointerMove(event: PointerEvent) {
        if (!dragInfo.isDragging || !dragInfo.elementId) return;
        const coords = getMouseCoords(event);
        const dx = coords.x - dragInfo.startX;
        const dy = coords.y - dragInfo.startY;

        elements = elements.map((el) => {
            if (el.id === dragInfo.elementId) {
                return {
                    ...el,
                    x: dragInfo.initialElementX + dx,
                    y: dragInfo.initialElementY + dy,
                };
            }
            return el;
        });
    }

    function onPointerUp(event: PointerEvent) {
        dragInfo.isDragging = false;
        dragInfo.elementId = null;
    }

    // --- Generation Logic ---
    let isGenerating = $state(false);

    async function generateZip() {
        if (!svgRef) return;

        // Parse names
        const names = batchNames
            .split("\n")
            .map((n) => n.trim())
            .filter((n) => n !== "");
        if (names.length === 0) {
            alert("Please enter at least one name.");
            return;
        }

        isGenerating = true;
        selectedElementId = null; // Clear selection UI

        // Wait for Svelte to remove selection rings from DOM
        await new Promise((r) => setTimeout(r, 50));

        const zip = new JSZip();
        const serializer = new XMLSerializer();

        const processCertificate = (name: string): Promise<void> => {
            return new Promise((resolve, reject) => {
                try {
                    let svgString = serializer.serializeToString(svgRef);
                    svgString = svgString.replace(/\{\{NAME\}\}/g, name);

                    const canvas = document.createElement("canvas");
                    canvas.width = CANVAS_WIDTH;
                    canvas.height = CANVAS_HEIGHT;
                    const ctx = canvas.getContext("2d");

                    if (!ctx) return reject(new Error("No 2D context"));

                    const img = new Image();
                    const svgBlob = new Blob([svgString], {
                        type: "image/svg+xml;charset=utf-8",
                    });
                    const url = URL.createObjectURL(svgBlob);

                    img.onload = () => {
                        ctx.drawImage(img, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
                        canvas.toBlob((blob) => {
                            if (blob) {
                                const safeName = name
                                    .replace(/[^a-z0-9]/gi, "_")
                                    .toLowerCase();
                                zip.file(`certificate_${safeName}.png`, blob);
                            }
                            URL.revokeObjectURL(url);
                            resolve();
                        }, "image/png");
                    };

                    img.onerror = (err) => {
                        URL.revokeObjectURL(url);
                        reject(err);
                    };

                    img.src = url;
                } catch (e) {
                    reject(e);
                }
            });
        };

        for (const name of names) {
            await processCertificate(name);
        }

        const zipBlob = await zip.generateAsync({ type: "blob" });
        const downloadUrl = URL.createObjectURL(zipBlob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = "certificates.zip";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);

        isGenerating = false;
    }

    // Helper
    let selectedElement = $derived(
        elements.find((e) => e.id === selectedElementId) as
            | TextElement
            | ImageElement
            | undefined,
    );
</script>

<svelte:window on:pointerup={onPointerUp} on:pointermove={onPointerMove} />

<div
    class="h-[100dvh] flex flex-col font-sans text-[color:var(--text)] overflow-hidden bg-[color:var(--bg-canvas)] transition-colors"
>
    <DashboardHeader />

    <div class="flex-1 flex w-full overflow-hidden relative pb-[72px] md:pb-0">
        <!-- Left Sidebar: Controls -->
        <aside
            class="fixed inset-x-0 top-16 bottom-0 md:relative md:top-0 w-full md:w-80 bg-[color:var(--surface)] border-r border-[color:var(--border)] flex flex-col md:h-full z-20 md:z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-transform duration-300 {activeMobilePanel ===
            'insert'
                ? 'translate-x-0'
                : '-translate-x-full md:translate-x-0'} shrink-0"
        >
            <!-- Scrollable configuration area -->
            <div
                class="flex-1 overflow-y-auto min-h-0 p-6 pb-32 md:pb-6 space-y-8"
            >
                <!-- Toolbox -->
                <section class="space-y-4">
                    <h2
                        class="text-[11px] font-bold uppercase tracking-widest text-[color:var(--text-soft)]"
                    >
                        Insert Elements
                    </h2>
                    <div class="grid grid-cols-2 gap-3">
                        <button
                            onclick={addText}
                            class="group flex flex-col items-center justify-center py-5 bg-[color:var(--surface-strong)] border border-[color:var(--border)] rounded-xl transition-all duration-200 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500 hover:-translate-y-0.5"
                        >
                            <div
                                class="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-3 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors"
                            >
                                <Type
                                    size={20}
                                    class="text-blue-600 dark:text-blue-400"
                                />
                            </div>
                            <span
                                class="text-sm font-semibold text-[color:var(--text)]"
                                >Add Text</span
                            >
                        </button>

                        <button
                            class="group flex flex-col items-center justify-center py-5 bg-[color:var(--surface-strong)] border border-[color:var(--border)] rounded-xl transition-all duration-200 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-500 hover:-translate-y-0.5 opacity-50 cursor-not-allowed"
                            title="Coming soon"
                        >
                            <div
                                class="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center mb-3 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-colors"
                            >
                                <ImageIcon
                                    size={20}
                                    class="text-indigo-600 dark:text-indigo-400"
                                />
                            </div>
                            <span
                                class="text-sm font-semibold text-[color:var(--text-soft)]"
                                >Add Image</span
                            >
                        </button>
                    </div>
                </section>

                <!-- Background Section -->
                <section
                    class="space-y-4 pt-6 border-t border-[color:var(--border)]"
                >
                    <div class="flex justify-between items-end">
                        <h2
                            class="text-[11px] font-bold uppercase tracking-widest text-[color:var(--text-soft)]"
                        >
                            Template
                        </h2>
                        {#if backgroundImageUrl}
                            <button
                                class="text-xs text-[color:var(--danger)] hover:opacity-85 font-medium transition-colors"
                                onclick={() => (backgroundImageUrl = null)}
                                >Remove</button
                            >
                        {/if}
                    </div>
                    <div class="w-full">
                        <label
                            class="flex justify-center w-full px-4 py-6 bg-[color:var(--surface-muted)] border-2 border-dashed border-[color:var(--border)] hover:border-primary rounded-xl cursor-pointer transition-all duration-200 group"
                        >
                            <div class="flex flex-col items-center space-y-2">
                                <div
                                    class="p-2 rounded-full bg-[color:var(--surface-strong)] border border-[color:var(--border)] shadow-sm group-hover:scale-110 transition-transform duration-200"
                                >
                                    <Plus
                                        size={18}
                                        class="text-[color:var(--text-soft)] group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors"
                                    />
                                </div>
                                <span
                                    class="text-sm font-medium text-[color:var(--text)] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
                                    >Upload Design</span
                                >
                                <span
                                    class="text-[10px] text-[color:var(--text-soft)]"
                                    >PNG, JPG or SVG</span
                                >
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                class="hidden"
                                onchange={handleBgUpload}
                            />
                        </label>
                    </div>
                </section>

                <!-- Batch Names -->
                <section
                    class="space-y-4 pt-6 border-t border-[color:var(--border)]"
                >
                    <div class="flex flex-col space-y-1.5">
                        <h2
                            class="text-[11px] font-bold uppercase tracking-widest text-[color:var(--text-soft)]"
                        >
                            Recipient Names
                        </h2>
                        <p
                            class="text-[11px] text-[color:var(--text-soft)] leading-relaxed"
                        >
                            Paste your list of names. Insert <span
                                class="bg-[color:var(--surface-muted)] text-[color:var(--text)] px-1.5 py-0.5 rounded-sm font-mono tracking-tight"
                                >{"{{"}NAME{"}}"}</span
                            > in a text element to bulk render.
                        </p>
                    </div>
                    <textarea
                        bind:value={batchNames}
                        class="w-full h-40 p-3.5 text-sm bg-[color:var(--surface-muted)] border border-[color:var(--border)] rounded-xl focus:bg-[color:var(--surface-strong)] focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none transition-all duration-200 font-medium text-[color:var(--text)]"
                        placeholder="John Doe&#10;Jane Smith"
                    ></textarea>
                    <div
                        class="flex items-center justify-between text-xs text-[color:var(--text-soft)]"
                    >
                        <span
                            >{batchNames
                                .split("\n")
                                .filter((n) => n.trim() !== "").length} certificates
                            queued</span
                        >
                    </div>

                    <!-- Import Attendees Button -->
                    <button
                        onclick={loadImportableForms}
                        class="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-400 rounded-xl text-xs font-semibold transition-colors"
                    >
                        <i class="fas fa-file-import"></i>
                        Import from Form
                    </button>
                </section>
            </div>
        </aside>

        <!-- Right Sidebar: Properties -->
        <aside
            class="fixed inset-x-0 top-16 bottom-0 md:relative md:top-0 w-full md:w-72 bg-[color:var(--surface)] border-l border-[color:var(--border)] flex flex-col md:h-full z-20 md:z-10 shadow-[-4px_0_24px_rgba(0,0,0,0.02)] order-last transition-transform duration-300 {activeMobilePanel ===
            'properties'
                ? 'translate-x-0'
                : 'translate-x-full md:translate-x-0'} shrink-0"
        >
            <div
                class="px-6 py-5 border-b border-[color:var(--border)] bg-[color:var(--surface)]/80 backdrop-blur-md"
            >
                <h2
                    class="text-[11px] font-bold uppercase tracking-widest text-[color:var(--text-soft)]"
                >
                    Properties
                </h2>
            </div>
            <div class="flex-1 overflow-y-auto min-h-0 p-6 pb-32 md:pb-6">
                {#if selectedElement}
                    <div
                        class="space-y-6 animate-in slide-in-from-right-4 duration-300"
                    >
                        <div class="flex items-center justify-between">
                            <span
                                class="px-2.5 py-1 bg-[color:var(--accent)]/10 text-[color:var(--accent)] text-xs font-bold rounded-full uppercase tracking-wide"
                            >
                                {selectedElement?.type || "unknown"}
                            </span>
                            <button
                                onclick={() =>
                                    deleteElement(selectedElement.id)}
                                class="p-1.5 text-[color:var(--danger)] hover:bg-[color:var(--danger)]/10 rounded-md transition-colors"
                                title="Delete Element"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>

                        {#if selectedElement.type === "text"}
                            <!-- Text Specific Properties -->
                            <div class="space-y-4">
                                <div class="space-y-1.5">
                                    <label
                                        for="text-content"
                                        class="text-xs font-semibold text-[color:var(--text-soft)]"
                                        >Content</label
                                    >
                                    <input
                                        id="text-content"
                                        type="text"
                                        bind:value={selectedElement.content}
                                        class="w-full p-2.5 text-sm font-medium border border-[color:var(--border)] rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-[color:var(--surface-strong)] text-[color:var(--text)] transition-all"
                                    />
                                </div>

                                <div class="space-y-1.5">
                                    <label
                                        for="font-family"
                                        class="text-xs font-semibold text-[color:var(--text-soft)]"
                                        >Font Family</label
                                    >
                                    <div class="relative">
                                        <select
                                            id="font-family"
                                            bind:value={
                                                selectedElement.fontFamily
                                            }
                                            class="w-full p-2.5 text-sm font-medium border border-[color:var(--border)] rounded-lg appearance-none bg-none bg-[color:var(--surface-strong)] text-[color:var(--text)] focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                                        >
                                            <option value="Arial">Arial</option>
                                            <option value="Times New Roman"
                                                >Times New Roman</option
                                            >
                                            <option value="Courier New"
                                                >Courier New</option
                                            >
                                            <option value="Georgia"
                                                >Georgia</option
                                            >
                                            <option value="Verdana"
                                                >Verdana</option
                                            >
                                            <option value="Impact"
                                                >Impact</option
                                            >
                                            <option
                                                value="'Brush Script MT', cursive"
                                                >Brush Script MT</option
                                            >
                                        </select>
                                        <div
                                            class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[color:var(--text-soft)]"
                                        >
                                            <svg
                                                class="h-4 w-4"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                                ><path
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    stroke-width="2"
                                                    d="M19 9l-7 7-7-7"
                                                ></path></svg
                                            >
                                        </div>
                                    </div>
                                </div>

                                <div class="grid grid-cols-2 gap-3">
                                    <div class="space-y-1.5">
                                        <label
                                            for="font-size"
                                            class="text-xs font-semibold text-[color:var(--text-soft)]"
                                            >Size (px)</label
                                        >
                                        <input
                                            id="font-size"
                                            type="number"
                                            bind:value={
                                                selectedElement.fontSize
                                            }
                                            class="w-full p-2.5 text-sm font-medium border border-[color:var(--border)] rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-[color:var(--surface-strong)] text-[color:var(--text)] transition-all"
                                        />
                                    </div>
                                    <div class="space-y-1.5">
                                        <label
                                            for="text-color-picker"
                                            class="text-xs font-semibold text-[color:var(--text-soft)]"
                                            >Color</label
                                        >
                                        <div
                                            class="flex items-center space-x-2"
                                        >
                                            <input
                                                id="text-color-picker"
                                                type="color"
                                                bind:value={
                                                    selectedElement.color
                                                }
                                                class="h-9 w-9 p-0.5 border border-[color:var(--border)] rounded-lg cursor-pointer bg-[color:var(--surface-strong)]"
                                            />
                                            <input
                                                type="text"
                                                bind:value={
                                                    selectedElement.color
                                                }
                                                class="w-full p-2 text-sm font-medium border border-[color:var(--border)] rounded-lg focus:ring-2 focus:ring-primary bg-[color:var(--surface-strong)] text-[color:var(--text)] transition-all uppercase"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div class="space-y-1.5">
                                    <span
                                        class="text-xs font-semibold text-[color:var(--text-soft)]"
                                        >Weight</span
                                    >
                                    <div
                                        class="flex bg-[color:var(--surface-muted)] p-1 rounded-lg"
                                    >
                                        {#each ["normal", "bold"] as weight}
                                            <button
                                                class="flex-1 py-1.5 text-xs font-medium rounded-md transition-all {selectedElement.fontWeight ===
                                                weight
                                                    ? 'bg-[color:var(--surface-strong)] text-[color:var(--text)] shadow-sm'
                                                    : 'text-[color:var(--text-soft)] hover:text-[color:var(--text)]'}"
                                                onclick={() =>
                                                    (selectedElement.fontWeight =
                                                        weight)}
                                            >
                                                {weight
                                                    .charAt(0)
                                                    .toUpperCase() +
                                                    weight.slice(1)}
                                            </button>
                                        {/each}
                                    </div>
                                </div>

                                <div class="space-y-1.5">
                                    <span
                                        class="text-xs font-semibold text-[color:var(--text-soft)]"
                                        >Alignment</span
                                    >
                                    <div
                                        class="flex bg-[color:var(--surface-muted)] p-1 rounded-lg"
                                    >
                                        <button
                                            class="flex-1 flex justify-center py-1.5 rounded-md transition-all {selectedElement.textAnchor ===
                                            'start'
                                                ? 'bg-[color:var(--surface-strong)] text-blue-600 dark:text-blue-400 shadow-sm'
                                                : 'text-[color:var(--text-soft)] hover:text-[color:var(--text)]'}"
                                            onclick={() =>
                                                (selectedElement.textAnchor =
                                                    "start")}
                                            title="Left"
                                            ><AlignLeft size={16} /></button
                                        >
                                        <button
                                            class="flex-1 flex justify-center py-1.5 rounded-md transition-all {selectedElement.textAnchor ===
                                            'middle'
                                                ? 'bg-[color:var(--surface-strong)] text-blue-600 dark:text-blue-400 shadow-sm'
                                                : 'text-[color:var(--text-soft)] hover:text-[color:var(--text)]'}"
                                            onclick={() =>
                                                (selectedElement.textAnchor =
                                                    "middle")}
                                            title="Center"
                                            ><AlignCenter size={16} /></button
                                        >
                                        <button
                                            class="flex-1 flex justify-center py-1.5 rounded-md transition-all {selectedElement.textAnchor ===
                                            'end'
                                                ? 'bg-[color:var(--surface-strong)] text-blue-600 dark:text-blue-400 shadow-sm'
                                                : 'text-[color:var(--text-soft)] hover:text-[color:var(--text)]'}"
                                            onclick={() =>
                                                (selectedElement.textAnchor =
                                                    "end")}
                                            title="Right"
                                            ><AlignRight size={16} /></button
                                        >
                                    </div>
                                </div>
                            </div>
                        {/if}
                    </div>
                {:else}
                    <div
                        class="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-70"
                    >
                        <div
                            class="w-16 h-16 rounded-full bg-[color:var(--surface-muted)] flex items-center justify-center"
                        >
                            <Type
                                size={28}
                                class="text-[color:var(--text-soft)]"
                            />
                        </div>
                        <div>
                            <p
                                class="text-sm font-medium text-[color:var(--text)]"
                            >
                                No element selected
                            </p>
                            <p
                                class="text-xs text-[color:var(--text-soft)] mt-1"
                            >
                                Click on an element in the canvas to edit its
                                properties here.
                            </p>
                        </div>
                    </div>
                {/if}
            </div>
        </aside>

        <!-- Main View: Canvas Area -->
        <main
            class="flex-1 flex flex-col overflow-hidden relative bg-[color:var(--bg-canvas)]/80 {activeMobilePanel ===
            'canvas'
                ? 'flex'
                : 'hidden md:flex'}"
            onpointerdown={() => {
                selectedElementId = null;
            }}
        >
            <!-- Toolbar/Header inside canvas area -->
            <header
                class="h-16 border-b border-[color:var(--border)] bg-[color:var(--surface)]/50 backdrop-blur-sm flex items-center px-4 sm:px-8 justify-between shrink-0 absolute top-0 w-full z-10"
            >
                <div class="flex items-center space-x-2 sm:space-x-3">
                    <span
                        class="text-xs sm:text-sm font-semibold text-[color:var(--text)] whitespace-nowrap"
                        >Canvas</span
                    >
                    <span
                        class="bg-[color:var(--surface-strong)] text-[color:var(--text-soft)] text-[10px] sm:text-xs px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md border border-[color:var(--border)] font-medium shadow-sm whitespace-nowrap"
                        >{CANVAS_WIDTH} × {CANVAS_HEIGHT} px</span
                    >
                </div>
                <div>
                    <button
                        onclick={generateZip}
                        disabled={isGenerating}
                        class="bg-[color:var(--text)] hover:opacity-90 text-[color:var(--surface)] px-3 py-2 sm:px-5 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold shadow-lg transition-all flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span class="hidden xs:inline"
                            >{isGenerating
                                ? "Generating..."
                                : "Generate ZIP"}</span
                        >
                        {#if !isGenerating}
                            <Download size={14} class="sm:ml-1" />
                        {:else}
                            <i class="fas fa-spinner fa-spin text-xs"></i>
                        {/if}
                    </button>
                </div>
            </header>

            <!-- Interactive Canvas Container -->
            <!-- Dot pattern background -->
            <div
                class="flex-1 overflow-auto p-4 sm:p-8 pt-24 pb-28 flex items-center justify-center relative bg-[radial-gradient(var(--border)_1px,transparent_1px)] [background-size:16px_16px]"
            >
                <!-- Actual SVG Canvas Wrapper -->
                <div
                    class="bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] relative border border-[color:var(--border)] transition-shadow duration-300"
                    style="width: 100%; max-width: {CANVAS_WIDTH}px; aspect-ratio: {CANVAS_WIDTH}/{CANVAS_HEIGHT};"
                >
                    <svg
                        bind:this={svgRef}
                        viewBox="0 0 {CANVAS_WIDTH} {CANVAS_HEIGHT}"
                        class="w-full h-full overflow-hidden"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <!-- Background Image Layer -->
                        <!-- We add a fallback white rect so the PNG has a white background if no image is uploaded -->
                        <rect width="100%" height="100%" fill="white" />

                        {#if backgroundImageUrl}
                            <image
                                href={backgroundImageUrl}
                                x="0"
                                y="0"
                                width={CANVAS_WIDTH}
                                height={CANVAS_HEIGHT}
                                preserveAspectRatio="none"
                            />
                        {/if}

                        <!-- Render Elements -->
                        {#each elements as el}
                            {#if el.type === "text"}
                                <!-- Interactive Text Element -->
                                <text
                                    x={el.x}
                                    y={el.y}
                                    font-size={el.fontSize}
                                    fill={el.color}
                                    font-family={el.fontFamily}
                                    font-weight={el.fontWeight}
                                    text-anchor={el.textAnchor}
                                    dominant-baseline="middle"
                                    class="cursor-move select-none"
                                    style="user-select: none;"
                                    role="button"
                                    tabindex="0"
                                    aria-label="Text element: {el.content}"
                                    onpointerdown={(e) =>
                                        onPointerDown(e, el.id)}
                                >
                                    {el.content}
                                </text>

                                <!-- Selection Box outline for currently selected element (rendered after to be on top) -->
                                {#if selectedElementId === el.id}
                                    <!-- We roughly estimate bounding box for UI feedback. In SVG, a rect can't easily map to dynamic text width natively using Svelte templating directly without computeTextLength, but we can do a simple box anchor to center or draw crosshairs for the origin point. -->
                                    <circle
                                        cx={el.x}
                                        cy={el.y}
                                        r="4"
                                        fill="#3b82f6"
                                        class="pointer-events-none"
                                    />
                                    <!-- Subtle indicator line -->
                                    <line
                                        x1={el.x - 50}
                                        y1={el.y}
                                        x2={el.x + 50}
                                        y2={el.y}
                                        stroke="#3b82f6"
                                        stroke-width="1"
                                        stroke-dasharray="2 2"
                                        stroke-opacity="0.3"
                                        class="pointer-events-none"
                                    />
                                  {/if}
                            {/if}
                        {/each}
                    </svg>
                </div>
            </div>
        </main>

        <!-- Mobile Bottom Navigation -->
        <nav
            class="md:hidden fixed bottom-0 left-0 right-0 h-[72px] bg-[color:var(--surface)] border-t border-[color:var(--border)] flex items-center justify-around px-6 z-30 shadow-[0_-4px_24px_rgba(0,0,0,0.04)]"
        >
            <button
                onclick={() => (activeMobilePanel = "insert")}
                class="flex flex-col items-center gap-1 {activeMobilePanel ===
                'insert'
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-[color:var(--text-soft)]'}"
            >
                <div
                    class="w-10 h-10 rounded-xl flex items-center justify-center {activeMobilePanel ===
                    'insert'
                        ? 'bg-blue-50 dark:bg-blue-900/30'
                        : 'bg-transparent'} transition-colors"
                >
                    <Plus size={20} />
                </div>
                <span class="text-[10px] font-bold uppercase tracking-wider"
                    >Insert</span
                >
            </button>
            <button
                onclick={() => (activeMobilePanel = "canvas")}
                class="flex flex-col items-center gap-1 {activeMobilePanel ===
                'canvas'
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-[color:var(--text-soft)]'}"
            >
                <div
                    class="w-10 h-10 rounded-xl flex items-center justify-center {activeMobilePanel ===
                    'canvas'
                        ? 'bg-blue-50 dark:bg-blue-900/30'
                        : 'bg-transparent'} transition-colors"
                >
                    <ImageIcon size={20} />
                </div>
                <span class="text-[10px] font-bold uppercase tracking-wider"
                    >Canvas</span
                >
            </button>
            <button
                onclick={() => (activeMobilePanel = "properties")}
                class="flex flex-col items-center gap-1 {activeMobilePanel ===
                'properties'
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-[color:var(--text-soft)]'}"
            >
                <div
                    class="w-10 h-10 rounded-xl flex items-center justify-center {activeMobilePanel ===
                    'properties'
                        ? 'bg-blue-50 dark:bg-blue-900/30'
                        : 'bg-transparent'} transition-colors"
                >
                    <AlignLeft size={20} />
                </div>
                <span class="text-[10px] font-bold uppercase tracking-wider"
                    >Design</span
                >
            </button>
        </nav>
    </div>
</div>

<!-- Import Attendees Modal -->
{#if showImportModal}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-label="Import attendees from form"
    >
        <div
            class="bg-[color:var(--surface)] rounded-2xl p-6 mx-4 max-w-md w-full shadow-2xl space-y-5 border border-[color:var(--border)]"
        >
            <div class="flex items-center justify-between">
                <h3 class="text-lg font-bold text-[color:var(--text)]">
                    Import Attendees
                </h3>
                <button
                    onclick={() => (showImportModal = false)}
                    class="p-1 hover:bg-[color:var(--surface-muted)] rounded-lg transition-colors"
                    aria-label="Close modal"
                >
                    <i class="fas fa-times text-[color:var(--text-soft)]"
                    ></i>
                </button>
            </div>

            <div class="space-y-4">
                <label class="block">
                    <span
                        class="text-xs font-semibold text-[color:var(--text-soft)] block mb-1.5"
                        >Select Form</span
                    >
                    <select
                        bind:value={selectedImportFormId}
                        class="w-full text-sm bg-[color:var(--surface-muted)] border border-[color:var(--border)] rounded-xl py-2.5 px-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-[color:var(--text)]"
                    >
                        <option value={null}>Choose a form...</option>
                        {#each importableForms as form}
                            <option value={form.id}>{form.title}</option>
                        {/each}
                    </select>
                </label>

                <div>
                    <span
                        class="text-xs font-semibold text-[color:var(--text-soft)] block mb-1.5"
                        >Filter</span
                    >
                    <div class="flex gap-2">
                        <button
                            onclick={() => (importFilter = "checked_in")}
                            class="flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-colors {importFilter ===
                            'checked_in'
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/50'
                                : 'bg-[color:var(--surface-muted)] text-[color:var(--text-soft)] border border-[color:var(--border)] hover:bg-[color:var(--surface-strong)]'}"
                        >
                            <i class="fas fa-check-circle mr-1"></i>
                            Checked-in Only
                        </button>
                        <button
                            onclick={() => (importFilter = "all")}
                            class="flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-colors {importFilter ===
                            'all'
                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50'
                                : 'bg-[color:var(--surface-muted)] text-[color:var(--text-soft)] border border-[color:var(--border)] hover:bg-[color:var(--surface-strong)]'}"
                        >
                            <i class="fas fa-users mr-1"></i>
                            All Responses
                        </button>
                    </div>
                </div>
            </div>

            <div class="flex gap-2">
                <button
                    onclick={() => (showImportModal = false)}
                    class="flex-1 py-2.5 px-4 border border-[color:var(--border)] rounded-xl text-sm font-semibold text-[color:var(--text-soft)] hover:bg-[color:var(--surface-strong)] transition-colors"
                >
                    Cancel
                </button>
                <button
                    onclick={importAttendees}
                    disabled={!selectedImportFormId || isImporting}
                    class="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {#if isImporting}
                        <i class="fas fa-spinner fa-spin mr-1"></i>
                        Importing...
                    {:else}
                        Import Names
                    {/if}
                </button>
            </div>
        </div>
    </div>
{/if}
