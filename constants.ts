import {SpriteConfig} from './utils/helper';

/**
 * Configuration for Volt Surge platformer game.
 */
export const CONFIG = {
  // Game & System initialization values
  title: {
    value: 'La grieta - El viaje del destino',
    type: 'string',
    label: 'Game Title',
    group: 'GAME',
  },
  baseCanvasWidth: {
    value: 960,
    type: 'number',
    label: 'Base Canvas Width',
    group: 'GAME',
  },
  baseCanvasHeight: {
    value: 540,
    type: 'number',
    label: 'Base Canvas Height',
    group: 'GAME',
  },
  targetFPS: {
    value: 60,
    type: 'number',
    label: 'Target FPS',
    group: 'SYSTEM',
  },
  stepMs: {
    value: 1000 / 60,
    type: 'number',
    label: 'Step MS',
    group: 'SYSTEM',
  },
  maxSubSteps: {
    value: 5,
    type: 'number',
    label: 'Max Sub Steps',
    group: 'SYSTEM',
  },

  // Thematic UI elements
  backgroundColor: {
    value: '#090d16',
    type: 'color',
    label: 'Background Color',
    group: 'THEME',
  },
  primaryColor: {
    value: '#00f0ff',
    type: 'color',
    label: 'Primary Color',
    group: 'THEME',
  },
  fontFamily: {
    value: "'Trebuchet MS', 'Arial Black', sans-serif",
    type: 'string',
    label: 'Font Family',
    group: 'THEME',
  },

  // Audio Levels
  defaultMusicVolume: {
    value: 0.4,
    type: 'number',
    label: 'Default Music Volume',
    group: 'AUDIO',
  },
  defaultSfxVolume: {
    value: 0.6,
    type: 'number',
    label: 'Default SFX Volume',
    group: 'AUDIO',
  },

  // Movement & Physics (Platformer tuning in px/s & px/s²)
  playerSpeed: {
    value: 230,
    type: 'number',
    label: 'Movement Speed (px/s)',
    group: 'Physics',
  },
  dashSpeed: {
    value: 370,
    type: 'number',
    label: 'Dash Sprint Speed (px/s)',
    group: 'Physics',
  },
  jumpForce: {
    value: 600,
    type: 'number',
    label: 'Jump Force (px/s)',
    group: 'Physics',
  },
  doubleJumpForce: {
    value: 510,
    type: 'number',
    label: 'Double Jump Force (px/s)',
    group: 'Physics',
  },
  gravityRising: {
    value: 1500,
    type: 'number',
    label: 'Gravity Rising (px/s²)',
    group: 'Physics',
  },
  gravityFalling: {
    value: 1750,
    type: 'number',
    label: 'Gravity Falling (px/s²)',
    group: 'Physics',
  },
  gravityApex: {
    value: 700,
    type: 'number',
    label: 'Gravity Apex Hang (px/s²)',
    group: 'Physics',
  },
  apexThreshold: {
    value: 80,
    type: 'number',
    label: 'Apex Threshold (px/s)',
    group: 'Physics',
  },
  groundFriction: {
    value: 0.82,
    type: 'number',
    label: 'Ground Friction',
    group: 'Physics',
  },
  airFriction: {
    value: 0.95,
    type: 'number',
    label: 'Air Friction',
    group: 'Physics',
  },
  coyoteTimeGracePeriod: {
    value: 0.12,
    type: 'number',
    label: 'Coyote Time Window (s)',
    group: 'Physics',
  },
  jumpBufferWindow: {
    value: 0.1,
    type: 'number',
    label: 'Jump Input Buffer (s)',
    group: 'Physics',
  },

  // Rules & Gameplay Progression
  startingLives: {
    value: 15,
    type: 'number',
    label: 'Starting Lives',
    group: 'Rules',
  },
  devilStartingLives: {
    value: 5,
    type: 'number',
    label: 'Devil Mode Starting Lives',
    group: 'Rules',
  },
  timeLimit: {
    value: 300,
    type: 'number',
    label: 'Level Time Limit (s)',
    group: 'Rules',
  },
  enableDoubleJump: {
    value: true,
    type: 'boolean',
    label: 'Enable Double Jump',
    group: 'Rules',
  },
  titanDuration: {
    value: 18,
    type: 'number',
    label: 'Titan Mode Duration (s)',
    group: 'Rules',
  },
  invincibilityDuration: {
    value: 10,
    type: 'number',
    label: 'Ion Overdrive Duration (s)',
    group: 'Rules',
  },
  scorePerCrystal: {
    value: 100,
    type: 'number',
    label: 'Score per Spark Crystal',
    group: 'Rules',
  },
  scorePerEnemy: {
    value: 250,
    type: 'number',
    label: 'Score per Enemy Defeat',
    group: 'Rules',
  },

  // Asset Dimensions & Proportions from metadata
  assetBgDistantAspectRatio: {
    value: 1.79166,
    type: 'number',
    label: 'Distant Storm Bg Aspect Ratio',
    group: 'ASSETS',
  },
  assetBgMidAspectRatio: {
    value: 1.79166,
    type: 'number',
    label: 'Mid Ruins Bg Aspect Ratio',
    group: 'ASSETS',
  },
  assetBgPlainsAspectRatio: {
    value: 1.79166,
    type: 'number',
    label: 'Plains Meadows Bg Aspect Ratio',
    group: 'ASSETS',
  },
  assetBgCanyonAspectRatio: {
    value: 1.79166,
    type: 'number',
    label: 'Lightning Canyon Bg Aspect Ratio',
    group: 'ASSETS',
  },
  assetBgCrystalCavernsAspectRatio: {
    value: 1.79166,
    type: 'number',
    label: 'Crystal Caverns Bg Aspect Ratio',
    group: 'ASSETS',
  },
  assetBgResonantChasmAspectRatio: {
    value: 1.79166,
    type: 'number',
    label: 'Resonant Chasm Bg Aspect Ratio',
    group: 'ASSETS',
  },
  assetBgCrystalCitadelAspectRatio: {
    value: 1.79166,
    type: 'number',
    label: 'Crystal Citadel Bg Aspect Ratio',
    group: 'ASSETS',
  },
  assetEnemyGolemAspectRatio: {
    value: 0.88235,
    type: 'number',
    label: 'Crystal Golem Aspect Ratio',
    group: 'ASSETS',
  },
  assetEnemyVoltBatAspectRatio: {
    value: 1.3476,
    type: 'number',
    label: 'Volt Bat Aspect Ratio',
    group: 'ASSETS',
  },
  assetTileGroundAspectRatio: {
    value: 1.0,
    type: 'number',
    label: 'Ground Tile Aspect Ratio',
    group: 'ASSETS',
  },
  assetTileDynamoAspectRatio: {
    value: 1.0027,
    type: 'number',
    label: 'Dynamo Tile Aspect Ratio',
    group: 'ASSETS',
  },
  assetTileBreakableAspectRatio: {
    value: 1.0328,
    type: 'number',
    label: 'Breakable Rock Aspect Ratio',
    group: 'ASSETS',
  },
  assetEnemyCrawlerAspectRatio: {
    value: 1.7788,
    type: 'number',
    label: 'Ground Crawler Aspect Ratio',
    group: 'ASSETS',
  },
  assetEnemySkyRayAspectRatio: {
    value: 2.3186,
    type: 'number',
    label: 'Sky Ray Aspect Ratio',
    group: 'ASSETS',
  },
  assetEnemyTurretAspectRatio: {
    value: 0.5496,
    type: 'number',
    label: 'Pulse Turret Aspect Ratio',
    group: 'ASSETS',
  },
  assetCrystalAspectRatio: {
    value: 1.0333,
    type: 'number',
    label: 'Spark Crystal Aspect Ratio',
    group: 'ASSETS',
  },
  assetResonantCoreAspectRatio: {
    value: 1.1272,
    type: 'number',
    label: 'Resonant Core Aspect Ratio',
    group: 'ASSETS',
  },
  assetIonOverdriveAspectRatio: {
    value: 0.7507,
    type: 'number',
    label: 'Ion Overdrive Aspect Ratio',
    group: 'ASSETS',
  },
  assetStormNeedleAspectRatio: {
    value: 0.3346,
    type: 'number',
    label: 'Storm Needle Aspect Ratio',
    group: 'ASSETS',
  },
  assetBossChimeraAspectRatio: {
    value: 1.3912,
    type: 'number',
    label: 'Electric Chimera Boss Aspect Ratio',
    group: 'ASSETS',
  },
  assetStructurePyramidAspectRatio: {
    value: 1.3514,
    type: 'number',
    label: 'Storm Pyramid Aspect Ratio',
    group: 'ASSETS',
  },
  assetStructureWarpPortalAspectRatio: {
    value: 0.9558,
    type: 'number',
    label: 'Structure Warp Portal Aspect Ratio',
    group: 'ASSETS',
  },
  assetCelestialFragmentAspectRatio: {
    value: 0.9729,
    type: 'number',
    label: 'Celestial Fragment Aspect Ratio',
    group: 'ASSETS',
  },
  assetStructureConduitAspectRatio: {
    value: 1.0303,
    type: 'number',
    label: 'Secret Conduit Aspect Ratio',
    group: 'ASSETS',
  },
  assetBgBonusTreasuryAspectRatio: {
    value: 1.79166,
    type: 'number',
    label: 'Bonus Treasury Aspect Ratio',
    group: 'ASSETS',
  },
  assetDragonCaveGateAspectRatio: {
    value: 1.4227,
    type: 'number',
    label: 'Dragon Cave Gate Aspect Ratio',
    group: 'ASSETS',
  },
  assetBgDragonBossLairAspectRatio: {
    value: 1.79166,
    type: 'number',
    label: 'Dragon Boss Lair Bg Aspect Ratio',
    group: 'ASSETS',
  },
  assetBossDragonAspectRatio: {
    value: 1.3559,
    type: 'number',
    label: 'Volcanic Dragon Boss Aspect Ratio',
    group: 'ASSETS',
  },
  assetDragonBossFrameWidth: {
    value: 512,
    type: 'number',
    label: 'Dragon Boss Spritesheet Frame Width',
    group: 'ASSETS',
  },
  assetDragonBossFrameHeight: {
    value: 512,
    type: 'number',
    label: 'Dragon Boss Spritesheet Frame Height',
    group: 'ASSETS',
  },
  assetDragonBossTotalFrames: {
    value: 16,
    type: 'number',
    label: 'Dragon Boss Spritesheet Total Frames',
    group: 'ASSETS',
  },
  assetBgStratosphereAspectRatio: {
    value: 1.79166,
    type: 'number',
    label: 'Stratosphere Bg Aspect Ratio',
    group: 'ASSETS',
  },
  assetBgSpireShaftAspectRatio: {
    value: 1.79166,
    type: 'number',
    label: 'Spire Shaft Bg Aspect Ratio',
    group: 'ASSETS',
  },
  assetBgCelestialSanctuaryAspectRatio: {
    value: 1.79166,
    type: 'number',
    label: 'Celestial Sanctuary Bg Aspect Ratio',
    group: 'ASSETS',
  },
  assetTrapCrushingPillarAspectRatio: {
    value: 1.0,
    type: 'number',
    label: 'Crushing Pillar Aspect Ratio',
    group: 'ASSETS',
  },
  assetBgCelestialThroneAspectRatio: {
    value: 1.79166,
    type: 'number',
    label: 'Celestial Throne Bg Aspect Ratio',
    group: 'ASSETS',
  },
  assetCelestialTempleGateAspectRatio: {
    value: 0.89145,
    type: 'number',
    label: 'Celestial Temple Gate Aspect Ratio',
    group: 'ASSETS',
  },
  assetCelestialDeityFrameWidth: {
    value: 512,
    type: 'number',
    label: 'Celestial Deity Spritesheet Frame Width',
    group: 'ASSETS',
  },
  assetCelestialDeityFrameHeight: {
    value: 512,
    type: 'number',
    label: 'Celestial Deity Spritesheet Frame Height',
    group: 'ASSETS',
  },
  assetBgZone4GlacialValleyAspectRatio: {
    value: 1.79166,
    type: 'number',
    label: 'Glacial Valley Bg Aspect Ratio',
    group: 'ASSETS',
  },
  assetBgZone4AvalanchePassAspectRatio: {
    value: 1.79166,
    type: 'number',
    label: 'Avalanche Pass Bg Aspect Ratio',
    group: 'ASSETS',
  },
  assetBgZone4FrozenSummitAspectRatio: {
    value: 1.79166,
    type: 'number',
    label: 'Frozen Summit Bg Aspect Ratio',
    group: 'ASSETS',
  },
  assetTrapGlacialBoulderAspectRatio: {
    value: 1.2969,
    type: 'number',
    label: 'Glacial Boulder Aspect Ratio',
    group: 'ASSETS',
  },
  assetHazardFallingIcicleAspectRatio: {
    value: 0.65,
    type: 'number',
    label: 'Falling Icicle Aspect Ratio',
    group: 'ASSETS',
  },
  assetBgFrostEmpressThroneAspectRatio: {
    value: 1.79166,
    type: 'number',
    label: 'Frost Empress Throne Bg Aspect Ratio',
    group: 'ASSETS',
  },
  assetStructureGlacialCitadelGateAspectRatio: {
    value: 1.08838,
    type: 'number',
    label: 'Glacial Citadel Gate Aspect Ratio',
    group: 'ASSETS',
  },
  assetFrostEmpressFrameWidth: {
    value: 512,
    type: 'number',
    label: 'Frost Empress Spritesheet Frame Width',
    group: 'ASSETS',
  },
  assetFrostEmpressFrameHeight: {
    value: 512,
    type: 'number',
    label: 'Frost Empress Spritesheet Frame Height',
    group: 'ASSETS',
  },
  assetBgZone5AbyssalInfernoAspectRatio: {
    value: 1.79166,
    type: 'number',
    label: 'Zone 5 Abyssal Inferno Bg Aspect Ratio',
    group: 'ASSETS',
  },
  assetMobAbyssalShadowAspectRatio: {
    value: 1.027,
    type: 'number',
    label: 'Abyssal Shadow Mob Aspect Ratio',
    group: 'ASSETS',
  },
  assetStructureVoidThroneGateAspectRatio: {
    value: 0.9875,
    type: 'number',
    label: 'Void Throne Gate Aspect Ratio',
    group: 'ASSETS',
  },
  assetBgGhoturSanctumAspectRatio: {
    value: 1.79166,
    type: 'number',
    label: 'Ghotur Sanctum Bg Aspect Ratio',
    group: 'ASSETS',
  },
  assetBgGhoturDemonicAbyssAspectRatio: {
    value: 1.79166,
    type: 'number',
    label: 'Ghotur Demonic Abyss Bg Aspect Ratio',
    group: 'ASSETS',
  },
  assetCinematicPrologue01VillagePeaceAspectRatio: {
    value: 1.79166,
    type: 'number',
    label: 'Cinematic Prologue 01 Village Peace Aspect Ratio',
    group: 'ASSETS',
  },
  assetCinematicPrologue02SkyRiftAspectRatio: {
    value: 1.79166,
    type: 'number',
    label: 'Cinematic Prologue 02 Sky Rift Aspect Ratio',
    group: 'ASSETS',
  },
  assetCinematicPrologue03FatherStandAspectRatio: {
    value: 1.79166,
    type: 'number',
    label: 'Cinematic Prologue 03 Father Stand Aspect Ratio',
    group: 'ASSETS',
  },
  assetCinematicPrologue04CoreShatteredAspectRatio: {
    value: 1.79166,
    type: 'number',
    label: 'Cinematic Prologue 04 Core Shattered Aspect Ratio',
    group: 'ASSETS',
  },
  assetCinematicPrologue05PartingGiftAspectRatio: {
    value: 1.79166,
    type: 'number',
    label: 'Cinematic Prologue 05 Parting Gift Aspect Ratio',
    group: 'ASSETS',
  },
  assetCinematicPrologue06MoulerVowAspectRatio: {
    value: 1.79166,
    type: 'number',
    label: 'Cinematic Prologue 06 Mouler Vow Aspect Ratio',
    group: 'ASSETS',
  },

  // Tile and Level Geometry
  tileSize: {
    value: 48,
    type: 'number',
    label: 'Grid Tile Size',
    group: 'Geometry',
  },
};

// Merge customized config values if present (injected by Playground)
const {playgroundConfig} = globalThis as {
  playgroundConfig?: Record<string, unknown>;
};
if (playgroundConfig) {
  for (const [key, value] of Object.entries(playgroundConfig)) {
    if (key in CONFIG) {
      Object.assign(CONFIG[key as keyof typeof CONFIG], {value});
    }
  }
}

/**
 * Type helper for reading values in game code
 */
export type ConfigKey = keyof typeof CONFIG;

/**
 * Gets a configuration value by key.
 * @param key The configuration key.
 * @return The configuration value.
 */
export function getConfig<K extends ConfigKey>(
  key: K,
): (typeof CONFIG)[K]['value'] {
  return CONFIG[key].value;
}

/**
 * Visual styling theme
 */
export const THEME = {
  fontFamily: "'Trebuchet MS', 'Arial Black', sans-serif",
  neonCyan: '#00f0ff',
  neonAmber: '#ffaa00',
  neonPurple: '#a855f7',
  deepBlue: '#0b1329',
  hudBg: 'rgba(10, 15, 30, 0.88)',
  borderGlow: '0 0 15px rgba(0, 240, 255, 0.4)',
};
