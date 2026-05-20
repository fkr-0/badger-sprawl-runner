/**
 * Story Content System
 * Loads and provides access to story content from story-flavour.yml
 */

export interface Character {
  id: string;
  name: string;
  role: string;
  voice: string;
  visualPrompt: string;
  sampleLines: string[];
}

export interface Chapter {
  chapterId: string;
  stageIndex: number;
  act: string;
  world: string;
  stageTitle: string;
  levelCodename: string;
  primaryVerb: string;
  heistPayload: string;
  dramaticQuestion: string;
  placard: string;
  scenicDescription: string;
  worldBuilding: string[];
  areas: Area[];
  characters: Character[];
  dialogues: Record<string, DialogueLine[]>;
  actionsWhenUserIdles: IdleAction[];
  sideQuests: SideQuest[];
  minigames: Minigame[];
  allies: string[];
  enemies: Enemy[];
  boss?: Boss;
  soundEffectVibes: string;
  musicalTheme: MusicalTheme;
  spriteTextureGenerationPrompts: SpritePrompt[];
}

export interface Area {
  name: string;
  gameplay: string;
  textures: string[];
}

export interface DialogueLine {
  speaker: string;
  text: string;
}

export interface IdleAction {
  seconds: number;
  animation: string;
  line: string;
}

export interface SideQuest {
  id: string;
  title: string;
  giver: string;
  objective: string;
  reward: string;
  dialogue: DialogueLine[];
}

export interface Minigame {
  id: string;
  name: string;
  type: string;
  rules: string;
  reward: string;
}

export interface Enemy {
  id: string;
  name: string;
  modelName: string;
  behavior: string;
  callouts: string[];
  spritePrompt: string;
  soundVibe: string;
}

export interface Boss {
  name: string;
  modelName: string;
  phases: string[];
  defeatLine: string;
  spritePrompt: string;
}

export interface MusicalTheme {
  name: string;
  bpm: number;
  palette: string;
}

export interface SpritePrompt {
  assetId: string;
  prompt: string;
}

export interface StoryContent {
  schemaVersion: string;
  sourceBasis: string;
  genre: string;
  creativeDirection: {
    coreTone: string[];
    flavourSourcesAsBroadAtmosphere: string[];
    styleRule: string;
  };
  universe: {
    name: string;
    planet: string;
    planetDescription: string;
    orbitalShell: string;
    asteroid: string;
    rebelNetwork: string;
    corporatePower: string;
    majorLedgers: Record<string, string>;
  };
  gearAndSystems: Array<{
    id: string;
    name: string;
    function: string;
    prompt: string;
  }>;
  worldIndex: Array<{
    world: string;
    chapters: string[];
    aesthetic: string;
  }>;
  globalIdleActions: IdleAction[];
  reusableBarks: {
    merchant: string[];
    enemyLowHealth: string[];
    playerParry: string[];
  };
  chapters: Chapter[];
}

/**
 * Story content loader - in production this would parse the YAML file
 * For now, we'll provide a typed interface for future implementation
 */
export class StoryContentLoader {
  private static instance: StoryContentLoader;
  private content: StoryContent | null = null;

  private constructor() {}

  static getInstance(): StoryContentLoader {
    if (!StoryContentLoader.instance) {
      StoryContentLoader.instance = new StoryContentLoader();
    }
    return StoryContentLoader.instance;
  }

  /**
   * Load story content from the YAML file
   * TODO: Implement actual YAML parsing
   */
  async loadContent(): Promise<StoryContent> {
    if (this.content) {
      return this.content;
    }

    // For now, return a minimal stub
    // In production, this would fetch and parse story-flavour.yml
    this.content = {
      schemaVersion: "1.0.0",
      sourceBasis: "Uploaded Story Bible for Badger Sprawl Runner",
      genre: "2D adventure platformer hack-and-slash with heist, rhythm, and coding-gate systems",
      creativeDirection: {
        coreTone: [
          "cyber-noir street pressure",
          "dub colony warmth",
          "orbital class satire",
          "Brechtian placards",
          "hardboiled humor",
          "mathematical logic as gameplay texture"
        ],
        flavourSourcesAsBroadAtmosphere: [
          "noir and hardboiled detective mood",
          "classic cyberpunk sprawl density",
          "dub and early hip-hop sound-system culture",
          "graffiti/trainwriting craft",
          "jazz-club intimacy",
          "political philosophy about class, discipline, absurdity, and authority",
          "hacker jargon and public cryptography"
        ],
        styleRule: "Use references as broad inspiration only. Keep all dialogue, lore, character voices, and lyrics original."
      },
      universe: {
        name: "The Rent-Locked Sky",
        planet: "Brackwater",
        planetDescription: "A wet industrial planet of canal cities, marsh tunnels, factories, rain markets, and sprawl towers.",
        orbitalShell: "The Nacre Ring",
        asteroid: "Speakerstone-9",
        rebelNetwork: "The Choir of Static",
        corporatePower: "Vane Directorate",
        majorLedgers: {
          street_ledger: "meters routes, bridges, water, clinics, and neighborhood gates",
          lift_ledger: "classifies cargo and people for orbital movement",
          sky_lock: "leases air, transit, sunlight, and broadcast rights",
          choirband: "pirate radio mesh for mutual aid and rebel coordination"
        }
      },
      gearAndSystems: [],
      worldIndex: [],
      globalIdleActions: [],
      reusableBarks: {
        merchant: [],
        enemyLowHealth: [],
        playerParry: []
      },
      chapters: []
    };

    return this.content;
  }

  /**
   * Get a specific chapter by ID
   */
  getChapter(chapterId: string): Chapter | undefined {
    if (!this.content) {
      return undefined;
    }
    return this.content.chapters.find(ch => ch.chapterId === chapterId);
  }

  /**
   * Get all chapters for a world
   */
  getChaptersForWorld(worldName: string): Chapter[] {
    if (!this.content) {
      return [];
    }
    return this.content.chapters.filter(ch => ch.world === worldName);
  }

  /**
   * Get character by ID
   */
  getCharacter(characterId: string): Character | undefined {
    if (!this.content) {
      return undefined;
    }
    for (const chapter of this.content.chapters) {
      const char = chapter.characters.find(c => c.id === characterId);
      if (char) {
        return char;
      }
    }
    return undefined;
  }

  /**
   * Get global idle actions
   */
  getGlobalIdleActions(): IdleAction[] {
    if (!this.content) {
      return [];
    }
    return this.content.globalIdleActions;
  }

  /**
   * Get reusable barks
   */
  getReusableBarks() {
    if (!this.content) {
      return {
        merchant: [],
        enemyLowHealth: [],
        playerParry: []
      };
    }
    return this.content.reusableBarks;
  }
}

// Export singleton instance
export const storyContent = StoryContentLoader.getInstance();