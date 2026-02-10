<!-- src/lib/components/FormBuilder.svelte -->
<script lang="ts">
  import { currentForm } from "../stores";
  import type { Question, FormElement, BlockElement } from "../types";
  import { isBlockElement } from "../types";
  import QuestionEditor from "./QuestionEditor.svelte";
  import BlockEditor from "./BlockEditor.svelte";
  import { DropdownMenu } from "bits-ui";

  let form: {
    id: string;
    title: string;
    slug?: string;
    questions: FormElement[];
  };
  let draggedIndex: number | null = null;

  currentForm.subscribe((value) => {
    form = { ...value };
  });

  function addQuestion(type: Question["type"]) {
    const newQuestion: Question = {
      id: Date.now().toString(),
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
    };
    form.questions = [...form.questions, newQuestion];
    currentForm.set(form);
  }

  function createBlock(): BlockElement {
    return {
      id: Date.now().toString(),
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
    form.questions = [...form.questions, createBlock()];
    currentForm.set(form);
  }

  function updateForm() {
    currentForm.set(form);
  }

  function deleteElement(id: string) {
    form.questions = form.questions.filter((q) => q.id !== id);
    updateForm();
  }

  function getQuestionNumber(index: number) {
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
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      const newQuestions = [...form.questions];
      const draggedQuestion = newQuestions[draggedIndex];

      newQuestions.splice(draggedIndex, 1);
      newQuestions.splice(dropIndex, 0, draggedQuestion);

      form.questions = newQuestions;
      updateForm();
    }
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

  <div class="space-y-6 pb-20">
    <!-- Added padding bottom for floating buttons if needed, or just spacing -->
    {#each form.questions as element, idx (element.id)}
      <div
        on:dragover={handleDragOver}
        on:drop={(e) => handleDrop(e, idx)}
        class="transition-opacity duration-200 {draggedIndex === idx
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
            question={element}
            questionNumber={getQuestionNumber(idx)}
            allQuestions={form.questions.filter((q) => !('kind' in q))}
            on:update={updateForm}
            on:delete={() => deleteElement(element.id)}
            on:dragstart={(e) => handleDragStart(e.detail, idx)}
            on:dragend={handleDragEnd}
          />
        {/if}
      </div>
    {/each}

    {#if form.questions.length === 0}
      <div
        class="border-2 border-dashed border-slate-200 rounded-xl p-12 text-center bg-slate-50"
      >
        <div
          class="mb-4 bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto"
        >
          <span class="fas fa-file-circle-plus text-3xl text-slate-400"></span>
        </div>
        <h3 class="text-lg font-semibold text-slate-900 mb-1">
          Start building your form
        </h3>
        <p class="text-slate-500 mb-6">
          Add questions or content blocks to get started.
        </p>
      </div>
    {/if}

    <div class="flex flex-wrap items-center gap-4 pt-4">
      <DropdownMenu.Root>
        <DropdownMenu.Trigger
          class="flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-200 active:scale-95"
        >
          <span class="fas fa-plus"></span>
          Add Question
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            class="bg-white border border-slate-200 rounded-xl shadow-xl w-64 py-2 z-50 max-h-[80vh] overflow-y-auto"
            side="bottom"
            sideOffset={12}
            align="start"
          >
            <div
              class="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider"
            >
              Input Fields
            </div>
            <DropdownMenu.Item
              onSelect={() => addQuestion("text")}
              class="px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors flex items-center gap-3"
            >
              <span class="fas fa-align-left text-slate-400 text-xl"></span> Short
              Text
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onSelect={() => addQuestion("long-text")}
              class="px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors flex items-center gap-3"
            >
              <span class="fas fa-align-justify text-slate-400 text-xl"></span> Long
              Text
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onSelect={() => addQuestion("number")}
              class="px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors flex items-center gap-3"
            >
              <span class="fas fa-hashtag text-slate-400 text-xl"></span> Number
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onSelect={() => addQuestion("email")}
              class="px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors flex items-center gap-3"
            >
              <span class="fas fa-envelope text-slate-400 text-xl"></span> Email
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onSelect={() => addQuestion("phone")}
              class="px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors flex items-center gap-3"
            >
              <span class="fas fa-phone text-slate-400 text-xl"></span> Phone Number
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onSelect={() => addQuestion("date")}
              class="px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors flex items-center gap-3"
            >
              <span class="fas fa-calendar text-slate-400 text-xl"></span> Date
            </DropdownMenu.Item>

            <DropdownMenu.Separator class="my-2 h-px bg-slate-100" />
            <div
              class="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider"
            >
              Selection
            </div>

            <DropdownMenu.Item
              onSelect={() => addQuestion("multiple-choice")}
              class="px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors flex items-center gap-3"
            >
              <span class="fas fa-list-ul text-slate-400 text-xl"></span> Multiple
              Choice
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onSelect={() => addQuestion("dropdown")}
              class="px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors flex items-center gap-3"
            >
              <span class="fas fa-caret-square-down text-slate-400 text-xl"
              ></span> Dropdown
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onSelect={() => addQuestion("checkboxes")}
              class="px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors flex items-center gap-3"
            >
              <span class="fas fa-check-square text-slate-400 text-xl"></span> Checkboxes
            </DropdownMenu.Item>

            <DropdownMenu.Separator class="my-2 h-px bg-slate-100" />
            <div
              class="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider"
            >
              Special
            </div>

            <DropdownMenu.Item
              onSelect={() => addQuestion("yes-no")}
              class="px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors flex items-center gap-3"
            >
              <span class="fas fa-thumbs-up text-slate-400 text-xl"></span> Yes/No
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onSelect={() => addQuestion("rating")}
              class="px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors flex items-center gap-3"
            >
              <span class="fas fa-star text-slate-400 text-xl"></span> Rating
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <button
        on:click={addBlock}
        class="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-all active:scale-95"
      >
        <span class="fas fa-shapes"></span>
        Add Block
      </button>
    </div>
  </div>
</div>
