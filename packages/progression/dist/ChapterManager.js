/**
 * Chapter Manager
 * Handles chapter progression, state tracking, and story flow
 */
export class ChapterManager {
    static instance;
    currentChapter = null;
    currentStage = 0;
    chapterStates = new Map();
    companions = new Map();
    globalTrust = new Map();
    globalHeat = 0;
    merchantPriceModifier = 1.0;
    endingModifier = '';
    constructor() {
        this.initializeDefaultCompanions();
    }
    static getInstance() {
        if (!ChapterManager.instance) {
            ChapterManager.instance = new ChapterManager();
        }
        return ChapterManager.instance;
    }
    initializeDefaultCompanions() {
        // Initialize core companions from story content
        const defaultCompanions = [
            { characterId: 'auntie_subharmonic', trust: 50, abilitiesUnlocked: ['radio_hints'] },
            { characterId: 'rook_null', trust: 30, abilitiesUnlocked: ['enemy_reveal'] },
            { characterId: 'murr_murrby', trust: 40, abilitiesUnlocked: ['merchant_access'] }
        ];
        defaultCompanions.forEach(comp => {
            this.companions.set(comp.characterId, {
                characterId: comp.characterId,
                available: true,
                trust: comp.trust,
                currentStatus: 'active',
                abilitiesUnlocked: comp.abilitiesUnlocked
            });
        });
    }
    /**
     * Start a new chapter
     */
    startChapter(chapterId) {
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
    getCurrentChapterState() {
        if (!this.currentChapter) {
            return undefined;
        }
        return this.chapterStates.get(this.currentChapter);
    }
    /**
     * Complete an objective in the current chapter
     */
    completeObjective(objectiveId) {
        const state = this.getCurrentChapterState();
        if (state && !state.objectivesCompleted.includes(objectiveId)) {
            state.objectivesCompleted.push(objectiveId);
        }
    }
    /**
     * Complete a side quest
     */
    completeSideQuest(questId, rewards, trustChanges) {
        const state = this.getCurrentChapterState();
        if (state && !state.sideQuestsCompleted.includes(questId)) {
            state.sideQuestsCompleted.push(questId);
            state.rewards.push(...rewards);
            // Apply trust changes
            Object.entries(trustChanges).forEach(([characterId, amount]) => {
                state.trustGained[characterId] = (state.trustGained[characterId] || 0) + amount;
                this.modifyCompanionTrust(characterId, amount);
            });
        }
    }
    /**
     * Record a dialogue choice
     */
    makeDialogueChoice(dialogueId, choice, consequences) {
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
                consequences.companions.forEach(compId => {
                    const comp = this.companions.get(compId);
                    if (comp && !comp.available) {
                        comp.available = true;
                    }
                });
            }
        }
    }
    /**
     * Modify companion trust
     */
    modifyCompanionTrust(characterId, amount) {
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
    getCompanion(characterId) {
        return this.companions.get(characterId);
    }
    /**
     * Get all available companions for current chapter
     */
    getAvailableCompanions() {
        return Array.from(this.companions.values()).filter(comp => comp.available);
    }
    /**
     * Modify global heat
     */
    modifyHeat(amount) {
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
    updateMerchantPrices() {
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
    getMerchantPriceModifier() {
        return this.merchantPriceModifier;
    }
    /**
     * Complete current stage
     */
    completeStage() {
        const state = this.getCurrentChapterState();
        if (state) {
            state.currentStage++;
            this.currentStage = state.currentStage;
        }
    }
    /**
     * Complete current chapter
     */
    completeChapter() {
        const state = this.getCurrentChapterState();
        if (state) {
            state.completed = true;
        }
    }
    /**
     * Set ending modifier
     */
    setEndingModifier(ending) {
        this.endingModifier = ending;
    }
    /**
     * Get ending modifier
     */
    getEndingModifier() {
        return this.endingModifier;
    }
    /**
     * Reset all state (for new game)
     */
    reset() {
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
    saveState() {
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
    loadState(saveData) {
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
        }
        catch (error) {
            console.error('Failed to load save state:', error);
        }
    }
}
export const chapterManager = ChapterManager.getInstance();
//# sourceMappingURL=ChapterManager.js.map