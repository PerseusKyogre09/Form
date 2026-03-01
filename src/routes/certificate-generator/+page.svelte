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
    import { supabase } from "$lib/supabaseClient";

    // --- Import State ---
    let showImportModal = $state(false);
    let importableForms: Array<{ id: string; title: string }> = $state([]);
    let selectedImportFormId: string | null = $state(null);
    let isImporting = $state(false);
    let importFilter: "all" | "checked_in" = $state("checked_in");

    async function loadImportableForms() {
        const {
            data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
            alert("Please log in to import attendees from your forms.");
            return;
        }
        const { data, error } = await supabase
            .from("forms")
            .select("id, title")
            .eq("user_id", session.user.id)
            .order("created_at", { ascending: false });
        if (data) {
            importableForms = data;
            showImportModal = true;
        }
    }

    async function importAttendees() {
        if (!selectedImportFormId) return;
        isImporting = true;

        try {
            // Get the form's name field
            const { data: formData } = await supabase
                .from("forms")
                .select("checkin_name_field_id")
                .eq("id", selectedImportFormId)
                .single();

            let query = supabase
                .from("form_responses")
                .select("answers")
                .eq("form_id", selectedImportFormId);

            if (importFilter === "checked_in") {
                query = query.eq("checked_in", true);
            }

            const { data: responses } = await query;

            if (responses && responses.length > 0) {
                const nameFieldId = formData?.checkin_name_field_id;
                const ObjectValues = (obj: any) => Object.values(obj || {});

                const names = responses
                    .map((r: any) => {
                        // First try the configured name field
                        if (
                            nameFieldId &&
                            r.answers &&
                            r.answers[nameFieldId]
                        ) {
                            return String(r.answers[nameFieldId]);
                        }

                        // Fallback: try finding any string value in answers
                        const values = ObjectValues(r.answers);
                        const firstString = values.find(
                            (v: any) => typeof v === "string" && v.length > 0,
                        );
                        return firstString ? String(firstString) : "";
                    })
                    .filter((n: string) => n.trim() !== "");

                if (names.length > 0) {
                    // Prepend to existing or replace depending on preference. Let's replace for a cleaner slate.
                    batchNames = names.join("\n");
                    showImportModal = false;
                } else {
                    alert(
                        "No valid names could be extracted from the responses.",
                    );
                }
            } else {
                alert(
                    importFilter === "checked_in"
                        ? "No checked-in attendees found for this form yet."
                        : "No responses found for this form yet.",
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
    class="h-screen flex flex-col font-sans text-slate-900 overflow-hidden bg-gray-50"
>
    <!-- Top Global Header -->
    <header class="bg-white border-b border-gray-100 z-50 shrink-0">
        <div
            class="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between"
        >
            <div class="flex items-center gap-8">
                <!-- Logo -->
                <a href="/dashboard" class="flex items-center gap-3 group">
                    <img
                        src={favicon}
                        alt="Quill Logo"
                        class="w-8 h-8 group-hover:scale-105 transition-transform"
                    />
                    <span
                        class="text-xl font-bold text-slate-800 tracking-tight"
                        >Quill</span
                    >
                </a>

                <!-- Global App Tabs -->
                <div class="flex bg-gray-100/80 p-1 rounded-lg">
                    <a
                        href="/dashboard"
                        class="px-4 py-1.5 text-gray-500 hover:text-slate-700 text-sm font-medium transition-all"
                        >My Forms</a
                    >
                    <a
                        href="/certificate-generator"
                        class="px-4 py-1.5 bg-white rounded-md shadow-sm text-slate-800 text-sm font-medium transition-all flex items-center gap-2"
                    >
                        Certificate
                    </a>
                </div>
            </div>
        </div>
    </header>

    <div class="flex-1 flex w-full overflow-hidden">
        <!-- Left Sidebar: Controls -->
        <aside
            class="w-80 bg-white border-r border-gray-200 flex flex-col h-full z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)] relative shrink-0"
        >
            <!-- Scrollable configuration area -->
            <div class="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
                <!-- Toolbox -->
                <section class="space-y-4">
                    <h2
                        class="text-[11px] font-bold uppercase tracking-widest text-gray-400"
                    >
                        Insert Elements
                    </h2>
                    <div class="grid grid-cols-2 gap-3">
                        <button
                            onclick={addText}
                            class="group flex flex-col items-center justify-center py-5 bg-white border border-gray-200 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md hover:border-blue-300 hover:-translate-y-0.5"
                        >
                            <div
                                class="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors"
                            >
                                <Type size={20} class="text-blue-600" />
                            </div>
                            <span class="text-sm font-semibold text-gray-700"
                                >Add Text</span
                            >
                        </button>

                        <button
                            class="group flex flex-col items-center justify-center py-5 bg-white border border-gray-200 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md hover:border-indigo-300 hover:-translate-y-0.5 opacity-50 cursor-not-allowed"
                            title="Coming soon"
                        >
                            <div
                                class="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center mb-3 group-hover:bg-indigo-100 transition-colors"
                            >
                                <ImageIcon size={20} class="text-indigo-600" />
                            </div>
                            <span class="text-sm font-semibold text-gray-700"
                                >Add Image</span
                            >
                        </button>
                    </div>
                </section>

                <!-- Background Section -->
                <section class="space-y-4 pt-6 border-t border-gray-100/60">
                    <div class="flex justify-between items-end">
                        <h2
                            class="text-[11px] font-bold uppercase tracking-widest text-gray-400"
                        >
                            Template
                        </h2>
                        {#if backgroundImageUrl}
                            <button
                                class="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                                onclick={() => (backgroundImageUrl = null)}
                                >Remove</button
                            >
                        {/if}
                    </div>
                    <div class="w-full">
                        <label
                            class="flex justify-center w-full px-4 py-6 bg-gray-50/50 border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-xl cursor-pointer transition-all duration-200 group"
                        >
                            <div class="flex flex-col items-center space-y-2">
                                <div
                                    class="p-2 rounded-full bg-white shadow-sm ring-1 ring-gray-900/5 group-hover:scale-110 transition-transform duration-200"
                                >
                                    <Plus
                                        size={18}
                                        class="text-gray-500 group-hover:text-blue-500 transition-colors"
                                    />
                                </div>
                                <span
                                    class="text-sm font-medium text-gray-600 group-hover:text-blue-600 transition-colors"
                                    >Upload Design</span
                                >
                                <span class="text-[10px] text-gray-400"
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
                <section class="space-y-4 pt-6 border-t border-gray-100/60">
                    <div class="flex flex-col space-y-1.5">
                        <h2
                            class="text-[11px] font-bold uppercase tracking-widest text-gray-400"
                        >
                            Recipient Names
                        </h2>
                        <p class="text-[11px] text-gray-400 leading-relaxed">
                            Paste your list of names. Insert <span
                                class="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded-sm font-mono tracking-tight"
                                >{"{{"}NAME{"}}"}</span
                            > in a text element to bulk render.
                        </p>
                    </div>
                    <textarea
                        bind:value={batchNames}
                        class="w-full h-40 p-3.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none transition-all duration-200 font-medium"
                        placeholder="John Doe&#10;Jane Smith"
                    ></textarea>
                    <div
                        class="flex items-center justify-between text-xs text-gray-500"
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
                        class="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-semibold transition-colors"
                    >
                        <i class="fas fa-file-import"></i>
                        Import from Form
                    </button>
                </section>
            </div>
        </aside>

        <!-- Right Sidebar: Properties -->
        <aside
            class="w-72 bg-white border-l border-gray-200 flex flex-col h-full z-10 shadow-[-4px_0_24px_rgba(0,0,0,0.02)] order-last shrink-0"
        >
            <div
                class="px-6 py-5 border-b border-gray-100 bg-white/80 backdrop-blur-md"
            >
                <h2
                    class="text-[11px] font-bold uppercase tracking-widest text-gray-400"
                >
                    Properties
                </h2>
            </div>
            <div class="flex-1 overflow-y-auto p-6">
                {#if selectedElement}
                    <div
                        class="space-y-6 animate-in slide-in-from-right-4 duration-300"
                    >
                        <div class="flex items-center justify-between">
                            <span
                                class="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full uppercase tracking-wide"
                            >
                                {selectedElement.type}
                            </span>
                            <button
                                onclick={() =>
                                    deleteElement(selectedElement.id)}
                                class="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
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
                                        class="text-xs font-semibold text-gray-500"
                                        >Content</label
                                    >
                                    <input
                                        type="text"
                                        bind:value={selectedElement.content}
                                        class="w-full p-2.5 text-sm font-medium border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    />
                                </div>

                                <div class="space-y-1.5">
                                    <label
                                        class="text-xs font-semibold text-gray-500"
                                        >Font Family</label
                                    >
                                    <div class="relative">
                                        <select
                                            bind:value={
                                                selectedElement.fontFamily
                                            }
                                            class="w-full p-2.5 text-sm font-medium border border-gray-200 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
                                            class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"
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
                                            class="text-xs font-semibold text-gray-500"
                                            >Size (px)</label
                                        >
                                        <input
                                            type="number"
                                            bind:value={
                                                selectedElement.fontSize
                                            }
                                            class="w-full p-2.5 text-sm font-medium border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                        />
                                    </div>
                                    <div class="space-y-1.5">
                                        <label
                                            class="text-xs font-semibold text-gray-500"
                                            >Color</label
                                        >
                                        <div
                                            class="flex items-center space-x-2"
                                        >
                                            <input
                                                type="color"
                                                bind:value={
                                                    selectedElement.color
                                                }
                                                class="h-9 w-9 p-0.5 border border-gray-200 rounded-lg cursor-pointer"
                                            />
                                            <input
                                                type="text"
                                                bind:value={
                                                    selectedElement.color
                                                }
                                                class="w-full p-2 text-sm font-medium border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all uppercase"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div class="space-y-1.5">
                                    <label
                                        class="text-xs font-semibold text-gray-500"
                                        >Weight</label
                                    >
                                    <div
                                        class="flex bg-gray-100 p-1 rounded-lg"
                                    >
                                        {#each ["normal", "bold"] as weight}
                                            <button
                                                class="flex-1 py-1.5 text-xs font-medium rounded-md transition-all {selectedElement.fontWeight ===
                                                weight
                                                    ? 'bg-white text-gray-900 shadow-sm'
                                                    : 'text-gray-500 hover:text-gray-700'}"
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
                                    <label
                                        class="text-xs font-semibold text-gray-500"
                                        >Alignment</label
                                    >
                                    <div
                                        class="flex bg-gray-100 p-1 rounded-lg"
                                    >
                                        <button
                                            class="flex-1 flex justify-center py-1.5 rounded-md transition-all {selectedElement.textAnchor ===
                                            'start'
                                                ? 'bg-white text-blue-600 shadow-sm'
                                                : 'text-gray-500 hover:text-gray-700'}"
                                            onclick={() =>
                                                (selectedElement.textAnchor =
                                                    "start")}
                                            title="Left"
                                            ><AlignLeft size={16} /></button
                                        >
                                        <button
                                            class="flex-1 flex justify-center py-1.5 rounded-md transition-all {selectedElement.textAnchor ===
                                            'middle'
                                                ? 'bg-white text-blue-600 shadow-sm'
                                                : 'text-gray-500 hover:text-gray-700'}"
                                            onclick={() =>
                                                (selectedElement.textAnchor =
                                                    "middle")}
                                            title="Center"
                                            ><AlignCenter size={16} /></button
                                        >
                                        <button
                                            class="flex-1 flex justify-center py-1.5 rounded-md transition-all {selectedElement.textAnchor ===
                                            'end'
                                                ? 'bg-white text-blue-600 shadow-sm'
                                                : 'text-gray-500 hover:text-gray-700'}"
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
                            class="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center"
                        >
                            <Type size={28} class="text-gray-400" />
                        </div>
                        <div>
                            <p class="text-sm font-medium text-gray-600">
                                No element selected
                            </p>
                            <p class="text-xs text-gray-400 mt-1">
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
            class="flex-1 flex flex-col overflow-hidden relative bg-gray-50/80"
            onpointerdown={() => {
                selectedElementId = null;
            }}
        >
            <!-- Toolbar/Header inside canvas area -->
            <header
                class="h-16 border-b border-gray-200/80 bg-white/50 backdrop-blur-sm flex items-center px-8 justify-between shrink-0 absolute top-0 w-full z-10"
            >
                <div class="flex items-center space-x-3">
                    <span class="text-sm font-semibold text-gray-700"
                        >Preview Canvas</span
                    >
                    <span
                        class="bg-white text-gray-500 text-xs px-2.5 py-1 rounded-md border border-gray-200 font-medium shadow-sm"
                        >{CANVAS_WIDTH} × {CANVAS_HEIGHT} px</span
                    >
                </div>
                <div>
                    <button
                        onclick={generateZip}
                        disabled={isGenerating}
                        class="bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-gray-900/20 hover:shadow-xl hover:shadow-gray-900/30 transition-all flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span
                            >{isGenerating
                                ? "Generating..."
                                : "Generate ZIP"}</span
                        >
                        {#if !isGenerating}
                            <Download size={16} class="ml-1" />
                        {/if}
                    </button>
                </div>
            </header>

            <!-- Interactive Canvas Container -->
            <!-- Dot pattern background -->
            <div
                class="flex-1 overflow-auto p-8 pt-24 pb-20 flex items-center justify-center relative bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]"
            >
                <!-- Actual SVG Canvas Wrapper -->
                <div
                    class="bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] relative ring-1 ring-gray-900/5 transition-shadow duration-300"
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
            class="bg-white rounded-2xl p-6 mx-4 max-w-md w-full shadow-2xl space-y-5"
        >
            <div class="flex items-center justify-between">
                <h3 class="text-lg font-bold text-slate-900">
                    Import Attendees
                </h3>
                <button
                    onclick={() => (showImportModal = false)}
                    class="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                    aria-label="Close modal"
                >
                    <i class="fas fa-times text-slate-400"></i>
                </button>
            </div>

            <div class="space-y-4">
                <label class="block">
                    <span
                        class="text-xs font-semibold text-slate-600 block mb-1.5"
                        >Select Form</span
                    >
                    <select
                        bind:value={selectedImportFormId}
                        class="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    >
                        <option value={null}>Choose a form...</option>
                        {#each importableForms as form}
                            <option value={form.id}>{form.title}</option>
                        {/each}
                    </select>
                </label>

                <div>
                    <span
                        class="text-xs font-semibold text-slate-600 block mb-1.5"
                        >Filter</span
                    >
                    <div class="flex gap-2">
                        <button
                            onclick={() => (importFilter = "checked_in")}
                            class="flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-colors {importFilter ===
                            'checked_in'
                                ? 'bg-green-100 text-green-700 border border-green-200'
                                : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100'}"
                        >
                            <i class="fas fa-check-circle mr-1"></i>
                            Checked-in Only
                        </button>
                        <button
                            onclick={() => (importFilter = "all")}
                            class="flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-colors {importFilter ===
                            'all'
                                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100'}"
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
                    class="flex-1 py-2.5 px-4 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                    Cancel
                </button>
                <button
                    onclick={importAttendees}
                    disabled={!selectedImportFormId || isImporting}
                    class="flex-1 py-2.5 px-4 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
