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

export class ChapterManager {
  private static instance: ChapterManager;
  private currentChapter: string | null = null;
  private currentStage = 0;
  private chapterStates: Map<string, ChapterState> = new Map();
  private companions: Map<string, CompanionState> = new Map();
  private globalTrust: Map<string, number> = new Map();
  private globalHeat = 0;
  private merchantPriceModifier = 1.0;
  private endingModifier = '';

  private constructor() {
    this.initializeDefaultCompanions();
  }

  static getInstance(): ChapterManager {
    if (!ChapterManager.instance) {
      ChapterManager.instance = new ChapterManager();
    }
    return ChapterManager.instance;
  }

  private initializeDefaultCompanions(): void {
    // Initialize core companions from story content
    const defaultCompanions = [
      { characterId: 'auntie_subharmonic', trust: 50, abilitiesUnlocked: ['radio_hints'] },
      { characterId: 'rook_null', trust: 30, abilitiesUnlocked: ['enemy_reveal'] },
      { characterId: 'murr_murrby', trust: 40, abilitiesUnlocked: ['merchant_access'] }
    ];

    for (const comp of defaultCompanions) {
      this.companions.set(comp.characterId, {
        characterId: comp.characterId,
        available: true,
        trust: comp.trust,
        currentStatus: 'active',
        abilitiesUnlocked: comp.abilitiesUnlocked
      });
    }
  }

  /**
   * Start a new chapter
   */
  startChapter(chapterId: string): void {
    this.currentChapter = chapterId;
    this.currentStage = 0;

    if (!this.chapterStates.has(chapterId)) {
      this.chapterStates.set(chapterId, {
        chapterId,
        completed: false,
        currentStage: 0,
        objectivesCompleted: [],
        sideQuestsCompleted: [],
        dialogueChoices: {},
        trustGained: {},
        heatGained: 0,
        rewards: []
      });
    }
  }

  /**
   * Get current chapter state
   */
  getCurrentChapterState(): ChapterState | undefined {
    if (!this.currentChapter) {
      return undefined;
    }
    return this.chapterStates.get(this.currentChapter);
  }

  /**
   * Complete an objective in the current chapter
   */
  completeObjective(objectiveId: string): void {
    const state = this.getCurrentChapterState();
    if (state && !state.objectivesCompleted.includes(objectiveId)) {
      state.objectivesCompleted.push(objectiveId);
    }
  }

  /**
   * Complete a side quest
   */
  completeSideQuest(questId: string, rewards: string[], trustChanges: Record<string, number>): void {
    const state = this.getCurrentChapterState();
    if (state && !state.sideQuestsCompleted.includes(questId)) {
      state.sideQuestsCompleted.push(questId);
      state.rewards.push(...rewards);

      // Apply trust changes
      for (const [characterId, amount] of Object.entries(trustChanges)) {
        state.trustGained[characterId] = (state.trustGained[characterId] || 0) + amount;
        this.modifyCompanionTrust(characterId, amount);
      }
    }
  }

  /**
   * Record a dialogue choice
   */
  makeDialogueChoice(dialogueId: string, choice: string, consequences: {
    trustShift?: number;
    heatShift?: number;
    companions?: string[];
  }): void {
    const state = this.getCurrentChapterState();
    if (state) {
      state.dialogueChoices[dialogueId] = choice;

      if (consequences.trustShift) {
        // Apply trust shift to relevant characters
        // This would need to be determined from the dialogue context
      }

      if (consequences.heatShift) {
        this.modifyHeat(consequences.heatShift);
      }

      if (consequences.companions) {
        for (const compId of consequences.companions) {
          const comp = this.companions.get(compId);
          if (comp && !comp.available) {
            comp.available = true;
          }
        }
      }
    }
  }

  /**
   * Modify companion trust
   */
  modifyCompanionTrust(characterId: string, amount: number): void {
    const companion = this.companions.get(characterId);
    if (companion) {
      companion.trust = Math.max(0, Math.min(100, companion.trust + amount));
    }

    // Also update global trust
    const currentTrust = this.globalTrust.get(characterId) || 0;
    this.globalTrust.set(characterId, Math.max(0, Math.min(100, currentTrust + amount)));
  }

  /**
   * Get companion state
   */
  getCompanion(characterId: string): CompanionState | undefined {
    return this.companions.get(characterId);
  }

  /**
   * Get all available companions for current chapter
   */
  getAvailableCompanions(): CompanionState[] {
    return Array.from(this.companions.values()).filter(comp => comp.available);
  }

  /**
   * Modify global heat
   */
  modifyHeat(amount: number): void {
    this.globalHeat = Math.max(0, Math.min(100, this.globalHeat + amount));

    const state = this.getCurrentChapterState();
    if (state) {
      state.heatGained = Math.max(0, state.heatGained + amount);
    }

    // Heat affects merchant prices
    this.updateMerchantPrices();
  }

  /**
   * Update merchant prices based on heat and trust
   */
  private updateMerchantPrices(): void {
    // Base price is 1.0
    // Heat increases prices, trust decreases prices
    const heatModifier = 1 + (this.globalHeat / 100) * 0.5; // Up to 50% increase
    const averageTrust = Array.from(this.globalTrust.values()).reduce((sum, trust) => sum + trust, 0) / Math.max(1, this.globalTrust.size);
    const trustModifier = 1 - (averageTrust / 100) * 0.3; // Up to 30% discount

    this.merchantPriceModifier = heatModifier * trustModifier;
  }

  /**
   * Get current merchant price modifier
   */
  getMerchantPriceModifier(): number {
    return this.merchantPriceModifier;
  }

  /**
   * Complete current stage
   */
  completeStage(): void {
    const state = this.getCurrentChapterState();
    if (state) {
      state.currentStage++;
      this.currentStage = state.currentStage;
    }
  }

  /**
   * Complete current chapter
   */
  completeChapter(): void {
    const state = this.getCurrentChapterState();
    if (state) {
      state.completed = true;
    }
  }

  /**
   * Set ending modifier
   */
  setEndingModifier(ending: string): void {
    this.endingModifier = ending;
  }

  /**
   * Get ending modifier
   */
  getEndingModifier(): string {
    return this.endingModifier;
  }

  /**
   * Reset all state (for new game)
   */
  reset(): void {
    this.currentChapter = null;
    this.currentStage = 0;
    this.chapterStates.clear();
    this.companions.clear();
    this.globalTrust.clear();
    this.globalHeat = 0;
    this.merchantPriceModifier = 1.0;
    this.endingModifier = '';
    this.initializeDefaultCompanions();
  }

  /**
   * Save current state to JSON
   */
  saveState(): string {
    return JSON.stringify({
      currentChapter: this.currentChapter,
      currentStage: this.currentStage,
      chapterStates: Array.from(this.chapterStates.entries()),
      companions: Array.from(this.companions.entries()),
      globalTrust: Array.from(this.globalTrust.entries()),
      globalHeat: this.globalHeat,
      merchantPriceModifier: this.merchantPriceModifier,
      endingModifier: this.endingModifier
    });
  }

  /**
   * Load state from JSON
   */
  loadState(saveData: string): void {
    try {
      const data = JSON.parse(saveData);
      this.currentChapter = data.currentChapter;
      this.currentStage = data.currentStage;
      this.chapterStates = new Map(data.chapterStates);
      this.companions = new Map(data.companions);
      this.globalTrust = new Map(data.globalTrust);
      this.globalHeat = data.globalHeat;
      this.merchantPriceModifier = data.merchantPriceModifier;
      this.endingModifier = data.endingModifier;
    } catch (error) {
      console.error('Failed to load save state:', error);
    }
  }
}

export const chapterManager = ChapterManager.getInstance();