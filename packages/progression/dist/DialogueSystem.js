/**
 * Dialogue System
 * Handles RPG-style dialogue boxes, placards, and Brechtian devices
 */
export class DialogueSystem {
    static instance;
    currentState;
    activeScenes = new Map();
    onDialogueComplete;
    onChoiceMade;
    constructor() {
        this.currentState = {
            currentScene: '',
            currentLine: 0,
            history: [],
            choicesMade: {},
            flags: new Set()
        };
    }
    static getInstance() {
        if (!DialogueSystem.instance) {
            DialogueSystem.instance = new DialogueSystem();
        }
        return DialogueSystem.instance;
    }
    /**
     * Register a dialogue scene
     */
    registerScene(scene) {
        this.activeScenes.set(scene.sceneId, scene);
    }
    /**
     * Start a dialogue scene
     */
    startScene(sceneId, onComplete) {
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
    getCurrentLine() {
        const scene = this.activeScenes.get(this.currentState.currentScene);
        if (!scene || this.currentState.currentLine >= scene.dialogueLines.length) {
            return null;
        }
        return scene.dialogueLines[this.currentState.currentLine] ?? null;
    }
    /**
     * Advance to next line
     */
    advanceLine() {
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
            }
            else {
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
    getAvailableChoices() {
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
    makeChoice(choiceId) {
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
    applyConsequences(consequences) {
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
    displayPlacards(placards) {
        // This would integrate with the rendering system
        // For now, we'll log them
        console.log('PLACARDS:', placards.map(p => p.text).join(' | '));
    }
    /**
     * Complete current scene
     */
    completeScene() {
        this.currentState.history.push(this.currentState.currentScene);
        if (this.onDialogueComplete) {
            this.onDialogueComplete();
            this.onDialogueComplete = undefined;
        }
    }
    /**
     * Check if a flag is set
     */
    hasFlag(flag) {
        return this.currentState.flags.has(flag);
    }
    /**
     * Set a flag
     */
    setFlag(flag) {
        this.currentState.flags.add(flag);
    }
    /**
     * Get current scene ID
     */
    getCurrentSceneId() {
        return this.currentState.currentScene;
    }
    /**
     * Check if scene is active
     */
    isSceneActive() {
        return this.currentState.currentScene !== '';
    }
    /**
     * Get dialogue history
     */
    getHistory() {
        return [...this.currentState.history];
    }
    /**
     * Get choices made
     */
    getChoicesMade() {
        return { ...this.currentState.choicesMade };
    }
    /**
     * Reset dialogue state
     */
    reset() {
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
    exportState() {
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
    importState(saveData) {
        try {
            const data = JSON.parse(saveData);
            this.currentState = {
                currentScene: data.currentScene || '',
                currentLine: data.currentLine || 0,
                history: data.history || [],
                choicesMade: data.choicesMade || {},
                flags: new Set(data.flags || [])
            };
        }
        catch (error) {
            console.error('Failed to import dialogue state:', error);
        }
    }
}
export const dialogueSystem = DialogueSystem.getInstance();
//# sourceMappingURL=DialogueSystem.js.map