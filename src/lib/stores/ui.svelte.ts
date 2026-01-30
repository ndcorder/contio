export type InputMode = 'normal' | 'prompt' | 'model-select';

function createUiStore() {
  let inputMode = $state<InputMode>('normal');
  let promptBuffer = $state<string>('');
  let selectedModels = $state<string[]>([]);
  let sidebarCollapsed = $state<boolean>(false);
  let isStreaming = $state<boolean>(false);

  return {
    get inputMode() {
      return inputMode;
    },

    get promptBuffer() {
      return promptBuffer;
    },

    get selectedModels() {
      return selectedModels;
    },

    get sidebarCollapsed() {
      return sidebarCollapsed;
    },

    get isStreaming() {
      return isStreaming;
    },

    setInputMode(mode: InputMode) {
      inputMode = mode;
    },

    setPromptBuffer(value: string) {
      promptBuffer = value;
    },

    clearPrompt() {
      promptBuffer = '';
    },

    toggleModel(modelId: string) {
      if (selectedModels.includes(modelId)) {
        selectedModels = selectedModels.filter(m => m !== modelId);
      } else {
        selectedModels = [...selectedModels, modelId];
      }
    },

    setSelectedModels(models: string[]) {
      selectedModels = [...models];
    },

    clearSelectedModels() {
      selectedModels = [];
    },

    toggleSidebar() {
      sidebarCollapsed = !sidebarCollapsed;
    },

    setStreaming(value: boolean) {
      isStreaming = value;
    }
  };
}

export const uiStore = createUiStore();
