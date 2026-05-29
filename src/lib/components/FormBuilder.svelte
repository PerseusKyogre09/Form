<!-- src/lib/components/FormBuilder.svelte -->
<script lang="ts">
  import { currentForm } from "../stores";
  import type { Question, FormElement, BlockElement, Theme, Form } from "../types";
  import { isBlockElement } from "../types";
  import QuestionEditor from "./QuestionEditor.svelte";
  import BlockEditor from "./BlockEditor.svelte";
  import { DropdownMenu } from "bits-ui";

  let form: Form;
  let draggedIndex: number | null = null;

  currentForm.subscribe((value) => {
    form = { ...value, questions: value.questions || [] };
  });

  function generateUniqueId(): string {
    // Use crypto.randomUUID() for truly unique IDs
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback: UUID v4-like format
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  function addQuestion(type: Question["type"]) {
    if (!form.questions) form.questions = [];
    const newQuestion: FormElement = {
      id: generateUniqueId(),
      type,
      title: "",
      required: false,
      exitAnimation: "slideRight",
      options:
        type === "multiple-choice" ||
        type === "dropdown" ||
        type === "checkboxes"
          ? ["Option 1", "Option 2"]
          : undefined,
      acceptedFormats: type === "image-upload" ? "image/jpeg,image/png,image/webp" : undefined,
      maxFileSize: type === "image-upload" ? 5 : undefined,
    } as FormElement;
    form.questions = [...form.questions, newQuestion];
    currentForm.set(form);
  }

  function createBlock(): BlockElement {
    return {
      id: generateUniqueId(),
      kind: "block",
      title: "Content Block",
      text: "",
      headerText: "",
      footerText: "",
      imageUrl: "",
      backgroundColor: "#ffffff",
      entryAnimation: undefined,
      exitAnimation: undefined,
      enableAutoAdvance: false,
      autoAdvanceDelay: 3,
      showCard: true, // Default to showing card; set to false for IDE theme floating style
    };
  }

  function addBlock() {
    if (!form.questions) form.questions = [];
    form.questions = [
      ...form.questions,
      createBlock() as unknown as FormElement,
    ];
    currentForm.set(form);
  }

  function updateForm() {
    currentForm.set(form);
  }

  function deleteElement(id: string) {
    if (!form.questions) return;
    form.questions = form.questions.filter((q) => q.id !== id);
    updateForm();
  }

  function getQuestionNumber(index: number) {
    if (!form.questions) return 0;
    return form.questions.slice(0, index + 1).reduce((count, item) => {
      return isBlockElement(item) ? count : count + 1;
    }, 0);
  }

  function handleDragStart(e: DragEvent, index: number) {
    draggedIndex = index;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", index.toString());
    }
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "move";
    }
  }

  function handleDrop(e: DragEvent, dropIndex: number) {
    e.preventDefault();
    e.stopPropagation();
    if (!form.questions || draggedIndex === null || draggedIndex === dropIndex) {
      draggedIndex = null;
      return;
    }
    const newQuestions = [...form.questions];
    const draggedQuestion = newQuestions[draggedIndex];

    newQuestions.splice(draggedIndex, 1);
    newQuestions.splice(dropIndex, 0, draggedQuestion);

    form.questions = newQuestions;
    updateForm();
    draggedIndex = null;
  }

  function handleDragEnd() {
    draggedIndex = null;
  }
</script>

<div>
  <!-- Form Title Section -->
  <!-- We don't need a separate title section here if it's handled in the header, 
       but usually form builders have a title input on the canvas too. 
       The design shows "CSE Recruitment Form" in the header, 
       but let's keep a title input here just in case, or maybe rely on the one in the header? 
       The design shows a "Content Block" at the top which seems to be a welcome message. 
       Let's keep the title input but make it look like part of the form flow or hidden if redundant.
        actually, let's keep it simple and clean. -->

  <div class="space-y-5 pb-20">
    <!-- Added padding bottom for floating buttons if needed, or just spacing -->
    {#each form.questions || [] as element, idx (element.id)}
      <div
        role="button"
        tabindex="0"
        on:dragover={handleDragOver}
        on:drop={(e) => handleDrop(e, idx)}
        class="transition-opacity duration-200 cursor-default {draggedIndex ===
        idx
          ? 'opacity-50'
          : ''}"
      >
        {#if isBlockElement(element)}
          <BlockEditor
            block={element}
            on:update={updateForm}
            on:delete={() => deleteElement(element.id)}
            on:dragstart={(e) => handleDragStart(e.detail, idx)}
            on:dragend={handleDragEnd}
          />
        {:else}
          <QuestionEditor
            question={element as Question}
            questionNumber={getQuestionNumber(idx)}
            allQuestions={(form.questions || []).filter(
              (q) => !isBlockElement(q),
            ) as Question[]}
            on:update={updateForm}
            on:delete={() => deleteElement(element.id)}
            on:dragstart={(e) => handleDragStart(e.detail, idx)}
            on:dragend={handleDragEnd}
          />
        {/if}
      </div>
    {/each}

    {#if !form.questions || form.questions.length === 0}
      <div class="empty-state p-12">
        <div class="mb-4 flex h-14 w-14 items-center justify-center rounded-full border surface-strong">
          <span
            class="fas fa-file-circle-plus text-2xl muted"
          ></span>
        </div>
        <h3 class="text-lg font-semibold text-[color:var(--text)] mb-1">
          Start building your form
        </h3>
        <p class="mb-6 text-sm leading-6 muted">
          Add questions or content blocks to get started.
        </p>
      </div>
    {/if}

    <div class="flex flex-wrap items-center gap-4 pt-4">
      <DropdownMenu.Root>
        <DropdownMenu.Trigger
          class="btn btn-primary"
        >
          <span class="fas fa-plus"></span>
          Add Question
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            class="surface surface-strong w-64 max-h-[80vh] overflow-y-auto py-2 z-50"
            side="bottom"
            sideOffset={12}
            align="start"
          >
            <div
              class="px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] muted-soft"
            >
              Input Fields
            </div>
            <DropdownMenu.Item
              onSelect={() => addQuestion("text")}
              class="flex cursor-pointer items-center gap-3 px-4 py-3 text-sm text-[color:var(--text)] transition-colors hover:bg-[color:var(--surface-muted)]"
            >
              <span
                class="fas fa-align-left text-xl muted"
              ></span> Short Text
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onSelect={() => addQuestion("long-text")}
              class="flex cursor-pointer items-center gap-3 px-4 py-3 text-sm text-[color:var(--text)] transition-colors hover:bg-[color:var(--surface-muted)]"
            >
              <span
                class="fas fa-align-justify text-xl muted"
              ></span> Long Text
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onSelect={() => addQuestion("number")}
              class="flex cursor-pointer items-center gap-3 px-4 py-3 text-sm text-[color:var(--text)] transition-colors hover:bg-[color:var(--surface-muted)]"
            >
              <span class="fas fa-hashtag text-xl muted"></span> Number
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onSelect={() => addQuestion("email")}
              class="flex cursor-pointer items-center gap-3 px-4 py-3 text-sm text-[color:var(--text)] transition-colors hover:bg-[color:var(--surface-muted)]"
            >
              <span class="fas fa-envelope text-xl muted"></span> Email
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onSelect={() => addQuestion("phone")}
              class="flex cursor-pointer items-center gap-3 px-4 py-3 text-sm text-[color:var(--text)] transition-colors hover:bg-[color:var(--surface-muted)]"
            >
              <span class="fas fa-phone text-xl muted"></span> Phone Number
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onSelect={() => addQuestion("date")}
              class="flex cursor-pointer items-center gap-3 px-4 py-3 text-sm text-[color:var(--text)] transition-colors hover:bg-[color:var(--surface-muted)]"
            >
              <span class="fas fa-calendar text-xl muted"></span> Date
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onSelect={() => addQuestion("image-upload")}
              class="flex cursor-pointer items-center gap-3 px-4 py-3 text-sm text-[color:var(--text)] transition-colors hover:bg-[color:var(--surface-muted)]"
            >
              <span class="fas fa-image text-xl muted"></span> Image Upload
            </DropdownMenu.Item>

            <DropdownMenu.Separator
              class="my-2 h-px bg-[color:var(--border)]"
            />
            <div
              class="px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] muted-soft"
            >
              Selection
            </div>

            <DropdownMenu.Item
              onSelect={() => addQuestion("multiple-choice")}
              class="flex cursor-pointer items-center gap-3 px-4 py-3 text-sm text-[color:var(--text)] transition-colors hover:bg-[color:var(--surface-muted)]"
            >
              <span class="fas fa-list-ul text-xl muted"></span> Multiple Choice
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onSelect={() => addQuestion("dropdown")}
              class="flex cursor-pointer items-center gap-3 px-4 py-3 text-sm text-[color:var(--text)] transition-colors hover:bg-[color:var(--surface-muted)]"
            >
              <span class="fas fa-caret-square-down text-xl muted"></span> Dropdown
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onSelect={() => addQuestion("checkboxes")}
              class="flex cursor-pointer items-center gap-3 px-4 py-3 text-sm text-[color:var(--text)] transition-colors hover:bg-[color:var(--surface-muted)]"
            >
              <span class="fas fa-check-square text-xl muted"></span> Checkboxes
            </DropdownMenu.Item>

            <DropdownMenu.Separator
              class="my-2 h-px bg-[color:var(--border)]"
            />
            <div
              class="px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] muted-soft"
            >
              Special
            </div>

            <DropdownMenu.Item
              onSelect={() => addQuestion("yes-no")}
              class="flex cursor-pointer items-center gap-3 px-4 py-3 text-sm text-[color:var(--text)] transition-colors hover:bg-[color:var(--surface-muted)]"
            >
              <span class="fas fa-thumbs-up text-xl muted"></span> Yes/No
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onSelect={() => addQuestion("rating")}
              class="flex cursor-pointer items-center gap-3 px-4 py-3 text-sm text-[color:var(--text)] transition-colors hover:bg-[color:var(--surface-muted)]"
            >
              <span class="fas fa-star text-xl muted"></span> Rating
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <button
        on:click={addBlock}
        class="btn btn-secondary"
      >
        <span class="fas fa-shapes"></span>
        Add Block
      </button>
    </div>
  </div>
</div>
