export type InputMode = 'normal' | 'prompt' | 'model-select';

export interface ToastNotification {
  id: string;
  message: string;
  type: 'error' | 'success' | 'info';
}

function createUiStore() {
  let inputMode = $state<InputMode>('normal');
  let promptBuffer = $state<string>('');
  let selectedModels = $state<string[]>([]);
  let selectedMode = $state<string>('debate');
  let sidebarCollapsed = $state<boolean>(false);
  let isStreaming = $state<boolean>(false);
  // eslint-disable-next-line prefer-const
  let notifications: ToastNotification[] = $state([]);

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

    get selectedMode() {
      return selectedMode;
    },

    setInputMode(mode: InputMode) {
      inputMode = mode;
    },

    setSelectedMode(mode: string) {
      selectedMode = mode;
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
    },

    get notifications() {
      return notifications;
    },

    addNotification(message: string, type: 'error' | 'success' | 'info' = 'info', timeout = 5000) {
      const id = crypto.randomUUID();
      notifications = [...notifications, { id, message, type }];
      setTimeout(() => {
        notifications = notifications.filter(n => n.id !== id);
      }, timeout);
    },

    removeNotification(id: string) {
      notifications = notifications.filter(n => n.id !== id);
    }
  };
}

export const uiStore = createUiStore();
