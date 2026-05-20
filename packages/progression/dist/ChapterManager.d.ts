/**
 * Chapter Manager
 * Handles chapter progression, state tracking, and story flow
 */
export interface ChapterState {
    chapterId: string;
    completed: boolean;
    currentStage: number;
    objectivesCompleted: string[];
    sideQuestsCompleted: string[];
    dialogueChoices: Record<string, string>;
    trustGained: Record<string, number>;
    heatGained: number;
    rewards: string[];
}
export interface CompanionState {
    characterId: string;
    available: boolean;
    trust: number;
    currentStatus: 'active' | 'wounded' | 'betrayed' | 'redeemed';
    abilitiesUnlocked: string[];
}
export declare class ChapterManager {
    private static instance;
    private currentChapter;
    private currentStage;
    private chapterStates;
    private companions;
    private globalTrust;
    private globalHeat;
    private merchantPriceModifier;
    private endingModifier;
    private constructor();
    static getInstance(): ChapterManager;
    private initializeDefaultCompanions;
    /**
     * Start a new chapter
     */
    startChapter(chapterId: string): void;
    /**
     * Get current chapter state
     */
    getCurrentChapterState(): ChapterState | undefined;
    /**
     * Complete an objective in the current chapter
     */
    completeObjective(objectiveId: string): void;
    /**
     * Complete a side quest
     */
    completeSideQuest(questId: string, rewards: string[], trustChanges: Record<string, number>): void;
    /**
     * Record a dialogue choice
     */
    makeDialogueChoice(dialogueId: string, choice: string, consequences: {
        trustShift?: number;
        heatShift?: number;
        companions?: string[];
    }): void;
    /**
     * Modify companion trust
     */
    modifyCompanionTrust(characterId: string, amount: number): void;
    /**
     * Get companion state
     */
    getCompanion(characterId: string): CompanionState | undefined;
    /**
     * Get all available companions for current chapter
     */
    getAvailableCompanions(): CompanionState[];
    /**
     * Modify global heat
     */
    modifyHeat(amount: number): void;
    /**
     * Update merchant prices based on heat and trust
     */
    private updateMerchantPrices;
    /**
     * Get current merchant price modifier
     */
    getMerchantPriceModifier(): number;
    /**
     * Complete current stage
     */
    completeStage(): void;
    /**
     * Complete current chapter
     */
    completeChapter(): void;
    /**
     * Set ending modifier
     */
    setEndingModifier(ending: string): void;
    /**
     * Get ending modifier
     */
    getEndingModifier(): string;
    /**
     * Reset all state (for new game)
     */
    reset(): void;
    /**
     * Save current state to JSON
     */
    saveState(): string;
    /**
     * Load state from JSON
     */
    loadState(saveData: string): void;
}
export declare const chapterManager: ChapterManager;
//# sourceMappingURL=ChapterManager.d.ts.map