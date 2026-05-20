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
export declare class DialogueSystem {
    private static instance;
    private currentState;
    private activeScenes;
    private onDialogueComplete?;
    private onChoiceMade?;
    private constructor();
    static getInstance(): DialogueSystem;
    /**
     * Register a dialogue scene
     */
    registerScene(scene: DialogueScene): void;
    /**
     * Start a dialogue scene
     */
    startScene(sceneId: string, onComplete?: () => void): void;
    /**
     * Get current dialogue line
     */
    getCurrentLine(): DialogueLine | null;
    /**
     * Advance to next line
     */
    advanceLine(): boolean;
    /**
     * Get available choices for current scene
     */
    getAvailableChoices(): DialogueOption[];
    /**
     * Make a dialogue choice
     */
    makeChoice(choiceId: string): void;
    /**
     * Apply dialogue consequences
     */
    private applyConsequences;
    /**
     * Display placards (Brechtian device)
     */
    private displayPlacards;
    /**
     * Complete current scene
     */
    private completeScene;
    /**
     * Check if a flag is set
     */
    hasFlag(flag: string): boolean;
    /**
     * Set a flag
     */
    setFlag(flag: string): void;
    /**
     * Get current scene ID
     */
    getCurrentSceneId(): string;
    /**
     * Check if scene is active
     */
    isSceneActive(): boolean;
    /**
     * Get dialogue history
     */
    getHistory(): string[];
    /**
     * Get choices made
     */
    getChoicesMade(): Record<string, string>;
    /**
     * Reset dialogue state
     */
    reset(): void;
    /**
     * Export state for saving
     */
    exportState(): string;
    /**
     * Import state from save
     */
    importState(saveData: string): void;
}
export declare const dialogueSystem: DialogueSystem;
//# sourceMappingURL=DialogueSystem.d.ts.map