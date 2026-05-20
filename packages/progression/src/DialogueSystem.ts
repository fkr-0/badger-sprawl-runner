/**
 * Dialogue System
 * Handles RPG-style dialogue boxes, placards, and Brechtian devices
 */

export interface DialogueOption {
  id: string;
  text: string;
  speaker?: string;
  consequences?: {
    trustShift?: number;
    heatShift?: number;
    companionUnlock?: string;
    endingModifier?: string;
    branchUnlock?: string;
  };
  requirements?: {
    minTrust?: number;
    maxTrust?: number;
    requiredCompanion?: string;
    requiredItem?: string;
  };
}

export interface Placard {
  text: string;
  style: 'brechtian' | 'protest' | 'humor' | 'philosophical';
  duration?: number;
}

export interface DialogueScene {
  sceneId: string;
  characters: string[];
  placards?: Placard[];
  dialogueLines: DialogueLine[];
  choices?: DialogueOption[];
  backgroundMusic?: string;
  ambientSound?: string;
}

export interface DialogueLine {
  speaker: string;
  text: string;
  emotion?: 'neutral' | 'happy' | 'angry' | 'sad' | 'fear' | 'disgust' | 'surprise';
  portrait?: string;
  pauseAfter?: number;
  animation?: string;
}

export interface DialogueState {
  currentScene: string;
  currentLine: number;
  history: string[];
  choicesMade: Record<string, string>;
  flags: Set<string>;
}

export class DialogueSystem {
  private static instance: DialogueSystem;
  private currentState: DialogueState;
  private activeScenes: Map<string, DialogueScene> = new Map();
  private onDialogueComplete?: () => void;
  private onChoiceMade?: (choiceId: string) => void;

  private constructor() {
    this.currentState = {
      currentScene: '',
      currentLine: 0,
      history: [],
      choicesMade: {},
      flags: new Set()
    };
  }

  static getInstance(): DialogueSystem {
    if (!DialogueSystem.instance) {
      DialogueSystem.instance = new DialogueSystem();
    }
    return DialogueSystem.instance;
  }

  /**
   * Register a dialogue scene
   */
  registerScene(scene: DialogueScene): void {
    this.activeScenes.set(scene.sceneId, scene);
  }

  /**
   * Start a dialogue scene
   */
  startScene(sceneId: string, onComplete?: () => void): void {
    const scene = this.activeScenes.get(sceneId);
    if (!scene) {
      console.error(`Scene ${sceneId} not found`);
      return;
    }

    this.currentState.currentScene = sceneId;
    this.currentState.currentLine = 0;
    this.onDialogueComplete = onComplete;

    // Display opening placards if any
    if (scene.placards && scene.placards.length > 0) {
      this.displayPlacards(scene.placards);
    }
  }

  /**
   * Get current dialogue line
   */
  getCurrentLine(): DialogueLine | null {
    const scene = this.activeScenes.get(this.currentState.currentScene);
    if (!scene || this.currentState.currentLine >= scene.dialogueLines.length) {
      return null;
    }
    return scene.dialogueLines[this.currentState.currentLine];
  }

  /**
   * Advance to next line
   */
  advanceLine(): boolean {
    const scene = this.activeScenes.get(this.currentState.currentScene);
    if (!scene) {
      return false;
    }

    this.currentState.currentLine++;

    // Check if we've reached a choice point
    if (this.currentState.currentLine >= scene.dialogueLines.length) {
      if (scene.choices && scene.choices.length > 0) {
        // We've reached choices - don't auto-complete
        return false;
      } else {
        // Scene complete
        this.completeScene();
        return false;
      }
    }

    return true;
  }

  /**
   * Get available choices for current scene
   */
  getAvailableChoices(): DialogueOption[] {
    const scene = this.activeScenes.get(this.currentState.currentScene);
    if (!scene || !scene.choices) {
      return [];
    }

    // Filter choices based on requirements
    return scene.choices.filter(choice => {
      if (!choice.requirements) {
        return true;
      }

      // Check trust requirements
      if (choice.requirements.minTrust !== undefined || choice.requirements.maxTrust !== undefined) {
        // This would need to check companion trust from chapter manager
        // For now, we'll skip this check
      }

      // Check required companions
      if (choice.requirements.requiredCompanion) {
        // Check if companion is available
        // This would integrate with chapter manager
      }

      // Check required items
      if (choice.requirements.requiredItem) {
        // Check if player has the required item
        // This would integrate with inventory system
      }

      return true;
    });
  }

  /**
   * Make a dialogue choice
   */
  makeChoice(choiceId: string): void {
    const scene = this.activeScenes.get(this.currentState.currentScene);
    if (!scene || !scene.choices) {
      return;
    }

    const choice = scene.choices.find(c => c.id === choiceId);
    if (!choice) {
      return;
    }

    // Record the choice
    this.currentState.choicesMade[`${this.currentState.currentScene}_${choiceId}`] = choiceId;

    // Apply consequences
    if (choice.consequences) {
      this.applyConsequences(choice.consequences);
    }

    // Trigger callback
    if (this.onChoiceMade) {
      this.onChoiceMade(choiceId);
    }

    // Complete the scene after choice
    this.completeScene();
  }

  /**
   * Apply dialogue consequences
   */
  private applyConsequences(consequences: NonNullable<DialogueOption['consequences']>): void {
    // This would integrate with chapter manager
    if (consequences.trustShift) {
      // Apply trust shift
    }

    if (consequences.heatShift) {
      // Apply heat shift
    }

    if (consequences.companionUnlock) {
      // Unlock companion
    }

    if (consequences.endingModifier) {
      // Set ending modifier
    }

    if (consequences.branchUnlock) {
      // Unlock story branch
      this.currentState.flags.add(consequences.branchUnlock);
    }
  }

  /**
   * Display placards (Brechtian device)
   */
  private displayPlacards(placards: Placard[]): void {
    // This would integrate with the rendering system
    // For now, we'll log them
    console.log('PLACARDS:', placards.map(p => p.text).join(' | '));
  }

  /**
   * Complete current scene
   */
  private completeScene(): void {
    this.currentState.history.push(this.currentState.currentScene);

    if (this.onDialogueComplete) {
      this.onDialogueComplete();
      this.onDialogueComplete = undefined;
    }
  }

  /**
   * Check if a flag is set
   */
  hasFlag(flag: string): boolean {
    return this.currentState.flags.has(flag);
  }

  /**
   * Set a flag
   */
  setFlag(flag: string): void {
    this.currentState.flags.add(flag);
  }

  /**
   * Get current scene ID
   */
  getCurrentSceneId(): string {
    return this.currentState.currentScene;
  }

  /**
   * Check if scene is active
   */
  isSceneActive(): boolean {
    return this.currentState.currentScene !== '';
  }

  /**
   * Get dialogue history
   */
  getHistory(): string[] {
    return [...this.currentState.history];
  }

  /**
   * Get choices made
   */
  getChoicesMade(): Record<string, string> {
    return { ...this.currentState.choicesMade };
  }

  /**
   * Reset dialogue state
   */
  reset(): void {
    this.currentState = {
      currentScene: '',
      currentLine: 0,
      history: [],
      choicesMade: {},
      flags: new Set()
    };
    this.onDialogueComplete = undefined;
    this.onChoiceMade = undefined;
  }

  /**
   * Export state for saving
   */
  exportState(): string {
    return JSON.stringify({
      currentScene: this.currentState.currentScene,
      currentLine: this.currentState.currentLine,
      history: this.currentState.history,
      choicesMade: this.currentState.choicesMade,
      flags: Array.from(this.currentState.flags)
    });
  }

  /**
   * Import state from save
   */
  importState(saveData: string): void {
    try {
      const data = JSON.parse(saveData);
      this.currentState = {
        currentScene: data.currentScene || '',
        currentLine: data.currentLine || 0,
        history: data.history || [],
        choicesMade: data.choicesMade || {},
        flags: new Set(data.flags || [])
      };
    } catch (error) {
      console.error('Failed to import dialogue state:', error);
    }
  }
}

export const dialogueSystem = DialogueSystem.getInstance();