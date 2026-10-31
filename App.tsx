// tslint:disable
/* eslint-disable */
import {
  Activity,
  ArrowRight,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Compass,
  FastForward,
  Heart,
  HelpCircle,
  Layers,
  Lock,
  Maximize,
  Menu,
  Play,
  RotateCw,
  Settings,
  Shield,
  Sparkles,
  Star,
  Trophy,
  Unlock,
  Volume2,
  VolumeX,
  X,
  Zap,
} from 'lucide-react';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {getConfig, THEME} from './constants';
import {
  Language,
  TRANSLATIONS,
  STORY_PANELS_LOCALIZED,
  ARCADE_TIPS_LOCALIZED,
  LEVEL_LOCALIZED_INFO,
} from './translations';
import {
  SpriteActionConfig,
  SpriteAnimationState,
  SpriteRenderer,
} from './SpriteRenderer';
import ZoneMusicSynthesizer from './ZoneMusicSynthesizer';
import {
  clamp,
  createFixedStepper,
  drawAsset,
  drawBackground,
  formatTime,
  gameAudio,
  GameState,
  MenuOverlay,
  Overlay,
  prepareCanvas,
  useAssets,
  useAutoFocus,
  useInput,
  useIsMobile,
} from './utils/helper';
import {
  usePlayground,
  usePlaygroundGameLifecycle,
  useRpc,
} from './utils/usePlayground';

// Toggle flag for debug test button in stage select (kept in code for developers, disabled for production)
const SHOW_DEBUG_TEST_BUTTON = false;

if (
  typeof CanvasRenderingContext2D !== 'undefined' &&
  !CanvasRenderingContext2D.prototype.roundRect
) {
  CanvasRenderingContext2D.prototype.roundRect = function (
    this: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
  ) {
    this.rect(x, y, w, h);
    return this;
  };
}

const GamepadIcon = ({
  size = 16,
  className = '',
}: {
  size?: number;
  className?: string;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}>
    <line x1="6" x2="10" y1="12" y2="12" />
    <line x1="8" x2="8" y1="10" y2="14" />
    <line x1="15" x2="15.01" y1="13" y2="13" />
    <line x1="18" x2="18.01" y1="11" y2="11" />
    <rect width="20" height="12" x="2" y="6" rx="2" />
  </svg>
);

const BACKGROUND_MUSIC_URL = 'assets/audio/bgm_storm_ruins.mp3';

const ASSETS_MANIFEST: Record<string, string> = {
  bg_distant_storm: 'assets/images/bg_distant_storm.png',
  bg_mid_ruins: 'assets/images/bg_mid_ruins.png',
  bg_plains_meadows: 'assets/images/bg_plains_meadows.png',
  bg_lightning_canyon: 'assets/images/bg_lightning_canyon.png',
  tile_ground_ruins: 'assets/images/tile_ground_ruins.png',
  tile_energy_dynamo: 'assets/images/tile_energy_dynamo.png',
  tile_breakable_rock: 'assets/images/tile_breakable_rock.png',
  enemy_ground_crawler: 'assets/images/enemy_ground_crawler.png',
  enemy_sky_ray: 'assets/images/enemy_sky_ray.png',
  enemy_energy_turret: 'assets/images/enemy_energy_turret.png',
  item_spark_crystal: 'assets/images/item_spark_crystal.png',
  item_resonant_core: 'assets/images/item_resonant_core.png',
  item_ion_overdrive: 'assets/images/item_ion_overdrive.png',
  item_storm_needle: 'assets/images/item_storm_needle.png',
  item_celestial_fragment: 'assets/images/item_celestial_fragment.png',
  boss_electric_chimera: 'assets/images/boss_electric_chimera.png',
  structure_storm_pyramid: 'assets/images/structure_storm_pyramid.png',
  structure_warp_portal: 'assets/images/structure_warp_portal.png',
  structure_secret_conduit: 'assets/images/structure_secret_conduit.png',
  bg_bonus_treasury: 'assets/images/bg_bonus_treasury.png',
  bg_crystal_caverns: 'assets/images/bg_crystal_caverns.png',
  bg_resonant_chasm: 'assets/images/bg_resonant_chasm.png',
  bg_crystal_citadel: 'assets/images/bg_crystal_citadel.png',
  enemy_crystal_golem: 'assets/images/enemy_crystal_golem.png',
  enemy_volt_bat: 'assets/images/enemy_volt_bat.png',
  structure_dragon_cave_gate: 'assets/images/structure_dragon_cave_gate.png',
  bg_dragon_boss_lair: 'assets/images/bg_dragon_boss_lair.png',
  boss_volcanic_dragon: 'assets/images/boss_volcanic_dragon.png',
  dragon_boss_spritesheet_avian_idle: 'assets/images/dragon_boss_spritesheet_avian_idle.png',
  dragon_boss_spritesheet_bird_fly: 'assets/images/dragon_boss_spritesheet_bird_fly.png',
  dragon_boss_spritesheet_bird_dive: 'assets/images/dragon_boss_spritesheet_bird_dive.png',
  dragon_boss_spritesheet_bird_take_off: 'assets/images/dragon_boss_spritesheet_bird_take_off.png',
  bg_zone3_stratosphere: 'assets/images/bg_zone3_stratosphere.png',
  bg_zone3_spire_shaft: 'assets/images/bg_zone3_spire_shaft.png',
  bg_zone3_celestial_sanctuary: 'assets/images/bg_zone3_celestial_sanctuary.png',
  trap_crushing_pillar: 'assets/images/trap_crushing_pillar.png',
  bg_celestial_throne: 'assets/images/bg_celestial_throne.png',
  structure_celestial_temple_gate: 'assets/images/structure_celestial_temple_gate.png',
  boss_celestial_deity_spritesheet_idle: 'assets/images/boss_celestial_deity_spritesheet_idle.png',
  boss_celestial_deity_spritesheet_attack: 'assets/images/boss_celestial_deity_spritesheet_attack.png',
  boss_celestial_deity_spritesheet_shoot: 'assets/images/boss_celestial_deity_spritesheet_shoot.png',
  boss_celestial_deity_spritesheet_sword_attack: 'assets/images/boss_celestial_deity_spritesheet_sword_attack.png',
  boss_celestial_deity_spritesheet_jump: 'assets/images/boss_celestial_deity_spritesheet_jump.png',
  boss_celestial_deity_spritesheet_walk: 'assets/images/boss_celestial_deity_spritesheet_walk.png',
  boss_celestial_deity_spritesheet_hurt: 'assets/images/boss_celestial_deity_spritesheet_hurt.png',
  boss_celestial_deity_spritesheet_death: 'assets/images/boss_celestial_deity_spritesheet_death.png',
  bg_zone4_glacial_valley: 'assets/images/bg_zone4_glacial_valley.png',
  bg_zone4_avalanche_pass: 'assets/images/bg_zone4_avalanche_pass.png',
  bg_zone4_frozen_summit: 'assets/images/bg_zone4_frozen_summit.png',
  bg_frost_empress_throne: 'assets/images/bg_frost_empress_throne.png',
  structure_glacial_citadel_gate: 'assets/images/structure_glacial_citadel_gate.png',
  boss_frost_empress_spritesheet_idle: 'assets/images/boss_frost_empress_spritesheet_idle.png',
  boss_frost_empress_spritesheet_walk: 'assets/images/boss_frost_empress_spritesheet_walk.png',
  boss_frost_empress_spritesheet_run: 'assets/images/boss_frost_empress_spritesheet_run.png',
  boss_frost_empress_spritesheet_attack: 'assets/images/boss_frost_empress_spritesheet_attack.png',
  boss_frost_empress_spritesheet_sword_attack: 'assets/images/boss_frost_empress_spritesheet_sword_attack.png',
  boss_frost_empress_spritesheet_shoot: 'assets/images/boss_frost_empress_spritesheet_shoot.png',
  boss_frost_empress_spritesheet_jump: 'assets/images/boss_frost_empress_spritesheet_jump.png',
  boss_frost_empress_spritesheet_hurt: 'assets/images/boss_frost_empress_spritesheet_hurt.png',
  boss_frost_empress_spritesheet_death: 'assets/images/boss_frost_empress_spritesheet_death.png',
  trap_glacial_boulder: 'assets/images/trap_glacial_boulder.png',
  hazard_falling_icicle: 'assets/images/hazard_falling_icicle.png',
  bg_zone5_abyssal_inferno: 'assets/images/bg_zone5_abyssal_inferno.png',
  mob_abyssal_shadow: 'assets/images/mob_abyssal_shadow.png',
  structure_void_throne_gate: 'assets/images/structure_void_throne_gate.png',
  bg_ghotur_sanctum_chamber: 'assets/images/bg_ghotur_sanctum_chamber.png',
  bg_ghotur_demonic_abyss: 'assets/images/bg_ghotur_demonic_abyss.png',
  boss_ghotur_humanoid_spritesheet_idle: 'assets/images/boss_ghotur_humanoid_spritesheet_idle.png',
  boss_ghotur_humanoid_spritesheet_walk: 'assets/images/boss_ghotur_humanoid_spritesheet_walk.png',
  boss_ghotur_humanoid_spritesheet_run: 'assets/images/boss_ghotur_humanoid_spritesheet_run.png',
  boss_ghotur_humanoid_spritesheet_attack: 'assets/images/boss_ghotur_humanoid_spritesheet_attack.png',
  boss_ghotur_humanoid_spritesheet_sword_attack: 'assets/images/boss_ghotur_humanoid_spritesheet_sword_attack.png',
  boss_ghotur_humanoid_spritesheet_shoot: 'assets/images/boss_ghotur_humanoid_spritesheet_shoot.png',
  boss_ghotur_humanoid_spritesheet_jump: 'assets/images/boss_ghotur_humanoid_spritesheet_jump.png',
  boss_ghotur_humanoid_spritesheet_climb_wall: 'assets/images/boss_ghotur_humanoid_spritesheet_climb_wall.png',
  boss_ghotur_humanoid_spritesheet_hurt: 'assets/images/boss_ghotur_humanoid_spritesheet_hurt.png',
  boss_ghotur_humanoid_spritesheet_death: 'assets/images/boss_ghotur_humanoid_spritesheet_death.png',
  boss_ghotur_demonic_spritesheet_idle: 'assets/images/boss_ghotur_demonic_spritesheet_idle.png',
  boss_ghotur_demonic_spritesheet_walk: 'assets/images/boss_ghotur_demonic_spritesheet_walk.png',
  boss_ghotur_demonic_spritesheet_run: 'assets/images/boss_ghotur_demonic_spritesheet_run.png',
  boss_ghotur_demonic_spritesheet_attack: 'assets/images/boss_ghotur_demonic_spritesheet_attack.png',
  boss_ghotur_demonic_spritesheet_sword_attack: 'assets/images/boss_ghotur_demonic_spritesheet_sword_attack.png',
  boss_ghotur_demonic_spritesheet_shoot: 'assets/images/boss_ghotur_demonic_spritesheet_shoot.png',
  boss_ghotur_demonic_spritesheet_jump: 'assets/images/boss_ghotur_demonic_spritesheet_jump.png',
  boss_ghotur_demonic_spritesheet_climb_wall: 'assets/images/boss_ghotur_demonic_spritesheet_climb_wall.png',
  boss_ghotur_demonic_spritesheet_hurt: 'assets/images/boss_ghotur_demonic_spritesheet_hurt.png',
  boss_ghotur_demonic_spritesheet_death: 'assets/images/boss_ghotur_demonic_spritesheet_death.png',
  cinematic_epilogue_01_ghotur_fallen: 'assets/images/cinematic_epilogue_01_ghotur_fallen.png',
  cinematic_epilogue_02_reconstructing_core: 'assets/images/cinematic_epilogue_02_reconstructing_core.png',
  cinematic_epilogue_03_world_restored: 'assets/images/cinematic_epilogue_03_world_restored.png',
  cinematic_prologue_01_village_peace: 'assets/images/cinematic_prologue_01_village_peace.png',
  cinematic_prologue_01_village_peace_copy_copy_copy: 'assets/images/cinematic_prologue_01_village_peace_copy_copy_copy.png',
  cinematic_prologue_01_village_peace_copy_copy: 'assets/images/cinematic_prologue_01_village_peace_copy_copy.png',
  cinematic_prologue_01_village_peace_copy_copy_copy_copy: 'assets/images/cinematic_prologue_01_village_peace_copy_copy_copy_copy.png',
  cinematic_prologue_01_village_peace_copy_copy_copy_copy_copy: 'assets/images/cinematic_prologue_01_village_peace_copy_copy_copy_copy_copy.png',
  cinematic_prologue_01_village_peace_copy_copy_copy_copy_copy_copy: 'assets/images/cinematic_prologue_01_village_peace_copy_copy_copy_copy_copy_copy.png',
  titan_voltlynx_sprite_idle: 'assets/images/titan_voltlynx_sprite_idle.png',
  titan_voltlynx_sprite_walk: 'assets/images/titan_voltlynx_sprite_walk.png',
  titan_voltlynx_sprite_run: 'assets/images/titan_voltlynx_sprite_run.png',
  titan_voltlynx_sprite_jump: 'assets/images/titan_voltlynx_sprite_jump.png',
  titan_voltlynx_sprite_attack: 'assets/images/titan_voltlynx_sprite_attack.png',
  titan_voltlynx_sprite_hurt: 'assets/images/titan_voltlynx_sprite_hurt.png',
};

const ZONE_BACKGROUND_MAP: Record<number, string> = {
  1: ASSETS_MANIFEST.bg_plains_meadows,
  2: ASSETS_MANIFEST.bg_crystal_citadel,
  3: ASSETS_MANIFEST.bg_zone3_stratosphere,
  4: ASSETS_MANIFEST.bg_zone4_glacial_valley,
  5: ASSETS_MANIFEST.bg_zone5_abyssal_inferno,
};

const PROLOGUE_VOICE_FILES: string[] = [
  'assets/audio/prologue_vignette_01_armonia_orgriniana.wav',
  'assets/audio/prologue_vignette_02_la_grieta_del_firmamento.wav',
  'assets/audio/prologue_vignette_03_la_caida_del_caudillo.wav',
  'assets/audio/prologue_vignette_04_la_fractura_del_nucleo.wav',
  'assets/audio/prologue_vignette_05_la_perla_del_destino.wav',
  'assets/audio/prologue_vignette_06_el_juramento_de_mouler.wav',
];

const PLAYER_SPRITE_CONFIGS: Record<string, SpriteActionConfig> = {
  IDLE: {
    imageUrl: 'titan_voltlynx_sprite_idle',
    totalFrames: 4,
    frameWidth: 512,
    frameHeight: 512,
    fps: 6,
    loop: true,
  },
  WALK: {
    imageUrl: 'titan_voltlynx_sprite_walk',
    totalFrames: 16,
    frameWidth: 512,
    frameHeight: 512,
    fps: 12,
    loop: true,
  },
  RUN: {
    imageUrl: 'titan_voltlynx_sprite_run',
    totalFrames: 16,
    frameWidth: 512,
    frameHeight: 512,
    fps: 16,
    loop: true,
  },
  JUMP: {
    imageUrl: 'titan_voltlynx_sprite_jump',
    totalFrames: 16,
    frameWidth: 512,
    frameHeight: 512,
    fps: 16,
    loop: false,
  },
  ATTACK: {
    imageUrl: 'titan_voltlynx_sprite_attack',
    totalFrames: 16,
    frameWidth: 512,
    frameHeight: 512,
    fps: 20,
    loop: false,
  },
  HURT: {
    imageUrl: 'titan_voltlynx_sprite_hurt',
    totalFrames: 16,
    frameWidth: 512,
    frameHeight: 512,
    fps: 12,
    loop: false,
  },
};

interface DragonActionConfig {
  assetKey: string;
  totalFrames: number;
  frameWidth: number;
  frameHeight: number;
  fps: number;
}

const DRAGON_BOSS_ACTIONS: Record<'idle' | 'fly' | 'dive' | 'take_off', DragonActionConfig> = {
  idle: {
    assetKey: 'dragon_boss_spritesheet_avian_idle',
    totalFrames: 16,
    frameWidth: 512,
    frameHeight: 512,
    fps: 8,
  },
  fly: {
    assetKey: 'dragon_boss_spritesheet_bird_fly',
    totalFrames: 16,
    frameWidth: 512,
    frameHeight: 512,
    fps: 8,
  },
  dive: {
    assetKey: 'dragon_boss_spritesheet_bird_dive',
    totalFrames: 16,
    frameWidth: 512,
    frameHeight: 512,
    fps: 16,
  },
  take_off: {
    assetKey: 'dragon_boss_spritesheet_bird_take_off',
    totalFrames: 16,
    frameWidth: 512,
    frameHeight: 512,
    fps: 8,
  },
};

function getDragonAction(b: BossEntity): 'idle' | 'fly' | 'dive' | 'take_off' {
  if (
    b.state === 'DRAGON_DIVE' ||
    b.state === 'DRAGON_DIVE_PREP' ||
    b.state === 'PLATFORM_SWOOP_DASH' ||
    b.state === 'DRAGON_AERIAL_SWOOP' ||
    b.state === 'DRAGON_DIVEBOMB'
  ) {
    return 'dive';
  }
  if (
    b.state === 'FLAME_BREATH_INHALE' ||
    b.state === 'FLAME_BREATH_SWEEP' ||
    b.state === 'INTRO_ROAR' ||
    b.state === 'TARGETED_FIREBALL_PREP' ||
    b.state === 'TARGETED_FIREBALL_SHOOT' ||
    b.state === 'STALACTITE_RAIN' ||
    b.state === 'BLACK_METEOR_CASCADE'
  ) {
    return 'take_off';
  }
  if (
    b.state === 'VAULT_ASCENT' ||
    b.state === 'FIREBALL_BOMBARD' ||
    b.state === 'FLYING_RETURN' ||
    b.state === 'PLATFORM_SWOOP_ASCENT' ||
    b.state === 'PLATFORM_SWOOP_HOLD' ||
    b.state === 'AERIAL_PATROL' ||
    b.state === 'AERIAL_FLAME_CURTAIN'
  ) {
    return 'fly';
  }
  return 'idle';
}

// Platforms & Level geometry
interface PlatformBlock {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'ground' | 'dynamo' | 'breakable' | 'hazard' | 'barrier';
  hit?: boolean;
  broken?: boolean;
  moving?: boolean;
  moveAxis?: 'x' | 'y';
  moveMin?: number;
  moveMax?: number;
  moveSpeed?: number;
  moveDir?: number;
  isIce?: boolean;
  isVoid?: boolean;
  isOneWay?: boolean;
}

interface JumpGeyser {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  cooldown: number;
}

interface GlacialBoulder {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  rotation: number;
  active: boolean;
  triggerX: number;
  stopX: number;
  shattered: boolean;
  soundCooldown?: number;
}

interface FallingIcicle {
  id: number;
  x: number;
  y: number;
  startY: number;
  platY: number;
  width: number;
  height: number;
  state: 'ATTACHED' | 'SHAKING' | 'FALLING' | 'SHATTERED';
  shakeTimer: number;
  vy: number;
  hp: number;
  isAmbientDrop?: boolean;
  ambientTimer?: number;
}

interface MountainCheckpoint {
  id: number;
  name: string;
  x: number;
  y: number;
  width: number;
  beaconX: number;
  beaconY: number;
  activated: boolean;
  beaconLit: boolean;
}

interface ItemEntity {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  type:
    | 'crystal'
    | 'resonant_core'
    | 'storm_needle'
    | 'ion_overdrive'
    | 'heart_1up'
    | 'heart_hp';
  collected?: boolean;
}

interface BonusConduit {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  isExit?: boolean;
  isBonusRoomExit?: boolean;
  returnX?: number;
  returnY?: number;
}

interface VoidFirePuddle {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  life: number;
  maxLife: number;
}

interface EnemyEntity {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'crawler' | 'sky_ray' | 'turret' | 'golem' | 'volt_bat' | 'abyssal_shadow';
  vx: number;
  vy: number;
  initialY: number;
  facingRight: boolean;
  minX?: number;
  maxX?: number;
  alive: boolean;
  hp?: number;
  maxHp?: number;
  hurtTimer?: number;
  shootTimer?: number;
  chargeTimer?: number;
  poundTimer?: number;
  isSwooping?: boolean;
  swoopTimer?: number;
  isFrostVariant?: boolean;
  isCorrupted?: boolean;
  voidTrailTimer?: number;
  beamChargeTimer?: number;
  shadowVariant?: 'LURKER' | 'SPECTER' | 'MINI' | 'WRAITH';
  emerged?: boolean;
  emergeTimer?: number;
  slumberX?: number;
  slumberY?: number;
  teleportTimer?: number;
  animTime?: number;
  isMiniCommander?: boolean;
  miniCommanderType?: 'SCARAB' | 'DRAGON' | 'ASURA' | 'KRYONA';
}

interface FootstepSpark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

interface Shockwave {
  id: number;
  x: number;
  y: number;
  vx: number;
  width: number;
  height: number;
  life: number;
  maxLife: number;
  color: string;
  isFrostWave?: boolean;
  isVoidSpike?: boolean;
}

interface CrushingPillarTrap {
  id: number;
  x: number;
  y: number;
  startY: number;
  floorY: number;
  width: number;
  height: number;
  state: 'IDLE' | 'SLAM' | 'WAIT' | 'RISE';
  timer: number;
  slamSpeed: number;
  riseSpeed: number;
  idleDuration: number;
  waitDuration: number;
  proximityTrigger?: number;
  isVoidTeeth?: boolean;
}

interface CinematicCutsceneState {
  active: boolean;
  phase: 'FADE_OUT_LEVEL' | 'VOID_WALK' | 'FADE_OUT_VOID' | 'FADE_IN_LEVEL';
  phaseTimer: number;
  totalVoidDuration: number;
  targetLevel: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19;
  targetLevelName: string;
  targetLevelSubtitle: string;
  voltlynxX: number;
  footstepTimer: number;
  footstepSparks: FootstepSpark[];
  animState: SpriteAnimationState;
}

// Boss AI & Sub-Boss Structure
interface BossLightningPillar {
  x: number;
  timer: number;
  struck: boolean;
  width: number;
}

interface BossStalactite {
  x: number;
  y: number;
  vy: number;
  timer: number;
  struck: boolean;
  width: number;
  height: number;
  warningX: number;
}

interface CascadeOrbInfo {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  delay: number;
  launched: boolean;
}

interface BossEntity {
  type: 'CHIMERA' | 'DRAGON' | 'CELESTIAL_DEITY' | 'FROST_EMPRESS' | 'GHOTUR_HUMANOID' | 'GHOTUR_DEMON';
  name: string;
  subtitle: string;
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  phase: number;
  state: string;
  stateTimer: number;
  facingRight: boolean;
  hurtTimer: number;
  telegraphGlow: number;
  wingFlap: number;
  arenaLeft: number;
  arenaRight: number;
  groundY: number;
  displayedHp: number;
  isDefeated?: boolean;
  // Dynamic Pattern State
  trackTargetX: number;
  trackTimer: number;
  cascadeOrbs: CascadeOrbInfo[];
  cascadeTimer: number;
  chargeDidLeap: boolean;
  pinballBouncesLeft: number;
  lightningPillars: BossLightningPillar[];
  stalactites: BossStalactite[];
  punishedInStun: boolean;
  lastAttackType: string;
  comboStep: number;
  comboLength: number;
  breathTimer?: number;
  breathAngle?: number;
  // Anti-camper and dynamic boss states
  platformCampingTimer?: number;
  platformHeatTimerLeft?: number;
  platformHeatTimerRight?: number;
  swoopY?: number;
  flySineOffset?: number;
  flyBaseY?: number;
  mirageTimer?: number;
  teleportTargetIndex?: number;
  // Celestial Deity States
  shieldActive?: boolean;
  shieldReflectTimer?: number;
  karateCount?: number;
  javelinCount?: number;
  // Ghotur States
  desperationTimer?: number;
  collapseTimer?: number;
  combinedPowerStep?: number;
  summonTimer?: number;
  miniCommanderIndex?: number;
  // Dynamic Animation State
  deathDuration?: number;
  squash?: number;
  stretch?: number;
  walkTimer?: number;
  animTimer?: number;
  animTime?: number;
}

interface Projectile {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  isPlayer: boolean;
  life: number;
  color: string;
  isBouncing?: boolean;
  bouncesLeft?: number;
  isBomb?: boolean;
  pierceCount?: number;
  damage?: number;
  isIcePrism?: boolean;
  isFlame?: boolean;
  isFrostBolt?: boolean;
  isVoidBurst?: boolean;
  isVoidBeam?: boolean;
  beamLength?: number;
  beamAngle?: number;
  isStoneBoulder?: boolean;
  rockRotation?: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  gravity?: number;
}

interface WeatherParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  sway?: number;
  swaySpeed?: number;
}

interface StageBannerData {
  title: string;
  name: string;
  subtitle: string;
  accentColor: string;
}

// Story Prologue Panels Spec (6 Capítulos Ilustrados)
interface StoryPanel {
  id: number;
  title: string;
  speaker: string;
  badgeColor: string;
  paragraphs: string[];
  imageKey: string;
}

export interface ChapterLevelInfo {
  number: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19;
  code: string;
  name: string;
  subtitle: string;
  bgAsset: string;
  isBoss?: boolean;
  bossName?: string;
  zoneId: number;
}

export interface ChapterZoneInfo {
  id: number;
  code: string;
  name: string;
  theme: string;
  badgeColor: string;
  borderColor: string;
  glowColor: string;
  levels: ChapterLevelInfo[];
}

export const CHAPTER_ZONES: ChapterZoneInfo[] = [
  {
    id: 1,
    code: 'ZONA 1',
    name: 'Valle Devastado y Ruinas',
    theme: 'Escombros de la aldea orgriniana arrasada, cañones de alta tensión y pirámides ancestrales.',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-400',
    borderColor: 'border-cyan-500',
    glowColor: '#00f0ff',
    levels: [
      {
        number: 1,
        code: '1-1',
        name: 'El Valle de los Escombros',
        subtitle: 'Mouler emprende el viaje sobre la tierra quemada de su aldea',
        bgAsset: 'bg_plains_meadows',
        zoneId: 1,
      },
      {
        number: 2,
        code: '1-2',
        name: 'Cañón de los Relámpagos',
        subtitle: 'Garganta de arenisca y conductos custodiados por esbirros',
        bgAsset: 'bg_lightning_canyon',
        zoneId: 1,
      },
      {
        number: 3,
        code: '1-3',
        name: 'Ruinas de la Tormenta',
        subtitle: 'Ascenso fúnebre hacia la Gran Pirámide',
        bgAsset: 'bg_distant_storm',
        zoneId: 1,
      },
      {
        number: 4,
        code: '1-B',
        name: 'El Salón del Guardián',
        subtitle: 'Comandante 1: Escarabajo Quimérico Titánico (Fragmento 1/5)',
        bgAsset: 'bg_mid_ruins',
        isBoss: true,
        bossName: 'Escarabajo Quimérico Titánico',
        zoneId: 1,
      },
    ],
  },
  {
    id: 2,
    code: 'ZONA 2',
    name: 'Catacumbas de Cristal Oscuro',
    theme: 'Grutas amatistas subterráneas, cascadas luminosas y el eco de un mundo sepultado.',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-400',
    borderColor: 'border-purple-500',
    glowColor: '#c084fc',
    levels: [
      {
        number: 5,
        code: '2-1',
        name: 'Entrada a las Catacumbas',
        subtitle: 'Grutas amatista y primeros gólems corrompidos',
        bgAsset: 'bg_crystal_caverns',
        zoneId: 2,
      },
      {
        number: 6,
        code: '2-2',
        name: 'El Abismo Resonante',
        subtitle: 'Cascadas subterráneas y plataformas móviles sobre el vacío',
        bgAsset: 'bg_resonant_chasm',
        zoneId: 2,
      },
      {
        number: 7,
        code: '2-3',
        name: 'La Ciudadela Subterránea',
        subtitle: 'Aguja de cristal hacia la cueva ancestral de magma',
        bgAsset: 'bg_crystal_citadel',
        zoneId: 2,
      },
      {
        number: 8,
        code: '2-B',
        name: 'La Guarida del Dragón',
        subtitle: 'Comandante 2: Colosal Dragón Umbrío de Obsidiana (Fragmento 2/5)',
        bgAsset: 'bg_dragon_boss_lair',
        isBoss: true,
        bossName: 'Colosal Dragón Umbrío de Obsidiana',
        zoneId: 2,
      },
    ],
  },
  {
    id: 3,
    code: 'ZONA 3',
    name: 'Templo Celestial Profanado',
    theme: 'Estratosfera cósmica y deidad corrompida por la oscuridad.',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-400',
    borderColor: 'border-indigo-500',
    glowColor: '#818cf8',
    levels: [
      {
        number: 9,
        code: '3-1',
        name: 'Fortaleza de la Estratosfera',
        subtitle: 'Islas flotantes de basalto y pilares trituradores Thwomp',
        bgAsset: 'bg_zone3_stratosphere',
        zoneId: 3,
      },
      {
        number: 10,
        code: '3-2',
        name: 'La Aguja del Trueno',
        subtitle: 'Ascenso vertical entre engranajes gigantescos y elevadores',
        bgAsset: 'bg_zone3_spire_shaft',
        zoneId: 3,
      },
      {
        number: 11,
        code: '3-3',
        name: 'El Santuario Celestial',
        subtitle: 'La cumbre sobre el mar de nubes y la Gran Puerta Celestial',
        bgAsset: 'bg_zone3_celestial_sanctuary',
        zoneId: 3,
      },
      {
        number: 12,
        code: '3-B',
        name: 'El Trono Celestial',
        subtitle: 'Comandante 3: Dios Cósmico Asura de múltiples brazos (Fragmento 3/5)',
        bgAsset: 'bg_celestial_throne',
        isBoss: true,
        bossName: 'Dios Cósmico Asura',
        zoneId: 3,
      },
    ],
  },
  {
    id: 4,
    code: 'ZONA 4',
    name: 'Cumbre Glacial Solitaria',
    theme: 'Permafrost desolado, carrera contra la avalancha y el palacio gélido del dolor.',
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-400',
    borderColor: 'border-sky-500',
    glowColor: '#38bdf8',
    levels: [
      {
        number: 13,
        code: '4-1',
        name: 'El Valle Glacial',
        subtitle: 'Grietas polares, escarcha resbaladiza y escarabajos de hielo',
        bgAsset: 'bg_zone4_glacial_valley',
        zoneId: 4,
      },
      {
        number: 14,
        code: '4-2',
        name: 'El Paso de la Avalancha',
        subtitle: 'Descenso vertiginoso perseguido por la colosal roca glacial',
        bgAsset: 'bg_zone4_avalanche_pass',
        zoneId: 4,
      },
      {
        number: 15,
        code: '4-3',
        name: 'La Cumbre Helada',
        subtitle: 'Escala la torre vertical entre témpanos y ventiscas solitarias',
        bgAsset: 'bg_zone4_frozen_summit',
        zoneId: 4,
      },
      {
        number: 16,
        code: '4-B',
        name: 'El Trono de Kryona',
        subtitle: 'Comandante 4: Reina de Hielo Kryona — Consorte de Ghotur (Fragmento 4/5)',
        bgAsset: 'bg_frost_empress_throne',
        isBoss: true,
        bossName: 'Reina de Hielo Kryona',
        zoneId: 4,
      },
    ],
  },
  {
    id: 5,
    code: 'ZONA 5',
    name: 'El Infierno Abisal de Ghotur',
    theme: 'El Ocaso del Vacío, la catedral de obsidiana y la venganza final.',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500',
    borderColor: 'border-rose-500',
    glowColor: '#f43f5e',
    levels: [
      {
        number: 17,
        code: '5-1',
        name: 'El Infierno Abisal',
        subtitle: 'El Ocaso del Vacío y las temibles Sombras del Abismo',
        bgAsset: 'bg_zone5_abyssal_inferno',
        zoneId: 5,
      },
      {
        number: 18,
        code: '5-B',
        name: 'El Trono del Caos',
        subtitle: 'Catedral de obsidiana contra el Tirano Ghotur en su porte noble',
        bgAsset: 'bg_ghotur_sanctum_chamber',
        isBoss: true,
        bossName: 'Ghotur (Noble Demonio)',
        zoneId: 5,
      },
      {
        number: 19,
        code: '5-FINAL',
        name: 'El Núcleo Colapsado',
        subtitle: 'Choque definitivo contra el Titán Demoníaco Ghotur (Fragmento Mayor 5/5)',
        bgAsset: 'bg_ghotur_demonic_abyss',
        isBoss: true,
        bossName: 'Ghotur (Titán Demoníaco Descomunal)',
        zoneId: 5,
      },
    ],
  },
];

export const ARCADE_TIPS = [
  'Mouler puede pulsar [S] o Flecha Abajo para agacharse y esquivar proyectiles enemigos.',
  'El Dash Sprint [Shift/J] te otorga impulso veloz y rompe obstáculos frágiles en Modo Titán.',
  'Sobre los conductos rúnicos, pulsa ABAJO para entrar a las Bóvedas Secretas de Cristales.',
  'Cada 100 Cristales de Chispa otorgan una Vida Extra automática a Mouler (hasta 20 vidas máximo).',
  'Con el Fragmento 2 (Dragón), pulsa [E] o [X] para disparar la Llamarada Volcánica que incinera balas.',
  'Con el Fragmento 4 (Kryona), pulsa [Q] o Arriba+Dash para realizar el Flash-Step espectral.',
  'Con la Perla de Energía asimilada, Mouler puede apuntar su Rayo hacia arriba pulsando [W].',
  'Tras los ataques pesados de un Jefe, aprovecha su ventana de cansancio para asestar golpes críticos.',
  'Recupera los 5 Fragmentos del Núcleo Celestial para vengar la caída de tu padre y de tu pueblo.',
];

export type Difficulty = 'TOURIST' | 'DEVIL';

export interface SavedArcadeData {
  maxUnlockedLevel: number;
  lastPlayedLevel: number;
  score: number;
  lives: number;
  fragments: number;
  difficulty?: Difficulty;
}

const ARCADE_SAVE_KEY = 'la_grieta_arcade_save_v1';

export function loadArcadeSave(): SavedArcadeData | null {
  try {
    const raw = localStorage.getItem(ARCADE_SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.lastPlayedLevel === 'number') {
      return {
        maxUnlockedLevel: Math.max(1, Math.min(19, Number(parsed.maxUnlockedLevel) || 1)),
        lastPlayedLevel: Math.max(1, Math.min(19, Number(parsed.lastPlayedLevel) || 1)),
        score: Math.max(0, Number(parsed.score) || 0),
        lives: Math.max(1, Math.min(20, Number(parsed.lives) || 15)),
        fragments: Math.max(0, Math.min(5, Number(parsed.fragments) || 0)),
        difficulty: parsed.difficulty === 'DEVIL' ? 'DEVIL' : 'TOURIST',
      };
    }
  } catch (e) {
    console.warn('Failed to parse arcade save', e);
  }
  return null;
}

export function saveArcadeData(data: Partial<SavedArcadeData>): SavedArcadeData {
  const current = loadArcadeSave() || {
    maxUnlockedLevel: 1,
    lastPlayedLevel: 1,
    score: 0,
    lives: 15,
    fragments: 0,
    difficulty: 'TOURIST',
  };
  const updated: SavedArcadeData = {
    maxUnlockedLevel: Math.max(current.maxUnlockedLevel, data.maxUnlockedLevel ?? current.maxUnlockedLevel),
    lastPlayedLevel: data.lastPlayedLevel ?? current.lastPlayedLevel,
    score: data.score !== undefined ? data.score : current.score,
    lives: data.lives !== undefined ? data.lives : current.lives,
    fragments: data.fragments !== undefined ? data.fragments : current.fragments,
    difficulty: data.difficulty ?? current.difficulty,
  };
  try {
    localStorage.setItem(ARCADE_SAVE_KEY, JSON.stringify(updated));
    localStorage.setItem('la_grieta_recovered_fragments', String(updated.fragments));
  } catch (e) {
    console.warn('Failed to write arcade save', e);
  }
  return updated;
}

const STORY_PANELS: StoryPanel[] = [
  {
    id: 1,
    title: 'LA ARMONÍA ORGRINIANA',
    speaker: 'ALDEA ORGRINIANA • AETHERIA',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-400',
    paragraphs: [
      'La aldea de los orgrinianos florecía en paz y esplendor bajo el manto sagrado del Núcleo Celestial, el mayor tesoro del planeta que alimentaba de vida y energía a todas las criaturas y valles.',
      'Allí creció Mouler, un joven y noble guerrero orgriniano educado con valentía y rectitud por su venerado padre, el gran jefe de la tribu. La armonía reinaba bajo la luz cósmica del Núcleo.',
    ],
    imageKey: 'cinematic_prologue_01_village_peace',
  },
  {
    id: 2,
    title: 'LA GRIETA DEL FIRMAMENTO',
    speaker: 'INVASIÓN DEL VACÍO • GHOTUR',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-400',
    paragraphs: [
      'Sin previo aviso, el firmamento se desgarró con un rugido ensordecedor. De la gigantesca grieta dimensional descendió el tirano Ghotur escoltado por sus comandantes sombríos.',
      'Desataron un torrente implacable de magia destructiva que envolvió las chozas orgrinianas en fuego y ruina. La aldea fue arrasada sin piedad en cuestión de instantes.',
    ],
    imageKey: 'cinematic_prologue_01_village_peace_copy_copy_copy',
  },
  {
    id: 3,
    title: 'LA CAÍDA DEL CAUDILLO',
    speaker: 'ÚLTIMA RESISTENCIA • EL SACRIFICIO',
    badgeColor: 'bg-red-500/20 text-red-300 border-red-400',
    paragraphs: [
      'Mouler combatió con ferocidad heroica junto a los suyos, pero el poder abisal de las huestes invasoras era demoledor.',
      'El padre de Mouler, enfrentándose él solo al tirano para proteger a su pueblo, luchó hasta la última gota de su aliento antes de caer mortalmente herido en el fragor de la masacre.',
    ],
    imageKey: 'cinematic_prologue_01_village_peace_copy_copy',
  },
  {
    id: 4,
    title: 'LA FRACTURA DEL NÚCLEO',
    speaker: 'PODER CORRUPTO • 5 FRAGMENTOS',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-400',
    paragraphs: [
      'Ghotur profanó el altar sagrado y arrancó el Núcleo Celestial, quebrándolo con violencia inaudita en 5 fragmentos.',
      'Conservó el fragmento mayor para sí, mutando en un titán demoníaco descomunal, mientras entregaba los 4 fragmentos restantes a sus comandantes, convirtiéndolos en bestias colosales que se dispersaron para dominar cada rincón del mundo.',
    ],
    imageKey: 'cinematic_prologue_01_village_peace_copy_copy_copy_copy',
  },
  {
    id: 5,
    title: 'LA PERLA DEL DESTINO',
    speaker: 'LEGADO SAGRADO • EL PADRE DE MOULER',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-400',
    paragraphs: [
      'Entre el humo y las cenizas ardientes, Mouler se arrastró desesperado hasta su padre agonizante. Con su último aliento, el caudillo supremo le entregó la Perla de Energía:',
      '«Hijo mío... ahora el destino está en tus manos. Asimílala con tu espíritu orgriniano y restaura el equilibrio...». Su padre cerró los ojos en sus brazos para siempre.',
    ],
    imageKey: 'cinematic_prologue_01_village_peace_copy_copy_copy_copy_copy',
  },
  {
    id: 6,
    title: 'EL JURAMENTO DE MOULER',
    speaker: 'JURAMENTO DE VENGANZA • MOULER',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-400',
    paragraphs: [
      'Con la Perla de Energía asimilada en su espíritu y las cenizas de su aldea bajo sus pies, Mouler alzó su mirada hacia la grieta del firmamento.',
      'Pronunció una promesa solemne: ¡recorrerá cada rincón de Aetheria, derrotará a los comandantes de Ghotur, recuperará los 5 fragmentos del Núcleo y vengará a su padre y a su pueblo!',
    ],
    imageKey: 'cinematic_prologue_01_village_peace_copy_copy_copy_copy_copy_copy',
  },
];

// ---------------------------------------------------------------------------
// ADVANCED PIXEL-ART ARCADE BOSS ANIMATION RENDERERS
// Inspired by Capcom / Neo-Geo / Metal Slug / Mega Man X boss animation craft
// ---------------------------------------------------------------------------

function drawAnimatedVolcanicDragon(
  ctx: CanvasRenderingContext2D,
  b: BossEntity,
  assets: Record<string, HTMLImageElement | null>,
  bossCenterX: number,
  bossCenterY: number,
) {
  const time = b.animTime ?? b.animTimer ?? 0;
  const isEnraged = b.phase === 2;
  const isHurt = b.hurtTimer > 0;

  // Determine current action and select animated spritesheet
  let actionFps = 8;
  let sheetKey = 'dragon_boss_spritesheet_avian_idle';

  if (
    (b as any).action === 'dive' ||
    b.state === 'dive' ||
    b.state === 'DRAGON_DIVE' ||
    b.state === 'DRAGON_DIVE_PREP' ||
    b.state === 'PLATFORM_SWOOP_DASH' ||
    b.state === 'DRAGON_AERIAL_SWOOP' ||
    b.state === 'DRAGON_DIVEBOMB'
  ) {
    actionFps = 16;
    sheetKey = 'dragon_boss_spritesheet_bird_dive';
  } else if (
    (b as any).action === 'take_off' ||
    b.state === 'take_off' ||
    b.state === 'roar' ||
    b.state === 'breathe' ||
    b.state === 'FLAME_BREATH_INHALE' ||
    b.state === 'FLAME_BREATH_SWEEP' ||
    b.state === 'INTRO_ROAR' ||
    b.state === 'TARGETED_FIREBALL_PREP' ||
    b.state === 'TARGETED_FIREBALL_SHOOT' ||
    b.state === 'STALACTITE_RAIN' ||
    b.state === 'BLACK_METEOR_CASCADE'
  ) {
    actionFps = 8;
    sheetKey = 'dragon_boss_spritesheet_bird_take_off';
  } else if (
    (b as any).action === 'fly' ||
    b.state === 'fly' ||
    b.y < 350 ||
    (b as any).isFlying ||
    b.state === 'VAULT_ASCENT' ||
    b.state === 'FIREBALL_BOMBARD' ||
    b.state === 'FLYING_RETURN' ||
    b.state === 'PLATFORM_SWOOP_ASCENT' ||
    b.state === 'PLATFORM_SWOOP_HOLD' ||
    b.state === 'AERIAL_PATROL' ||
    b.state === 'AERIAL_FLAME_CURTAIN'
  ) {
    actionFps = 8;
    sheetKey = 'dragon_boss_spritesheet_bird_fly';
  } else {
    actionFps = 8;
    sheetKey = 'dragon_boss_spritesheet_avian_idle';
  }

  const sheet =
    assets[sheetKey] ||
    assets['dragon_boss_spritesheet_avian_idle'] ||
    assets['dragon_boss_spritesheet_bird_fly'];

  const targetW = 190;
  const targetH = 150;

  ctx.save();
  ctx.translate(bossCenterX, bossCenterY);

  // Horizontal flip: Spritesheet frames face RIGHT by default.
  // If boss is facing left, flip horizontally with scale(-1, 1).
  const isFacingLeft =
    (b as any).facing !== undefined ? (b as any).facing === -1 : !b.facingRight;
  if (isFacingLeft) {
    ctx.scale(-1, 1);
  }

  const isDyingOrDead = b.state === 'DYING' || b.state === 'DEAD';
  if (isDyingOrDead) {
    ctx.rotate(0.22);
    ctx.translate(0, 14);
  }

  ctx.imageSmoothingEnabled = false;

  if (sheet && sheet.complete && sheet.naturalWidth > 0) {
    const totalFrames = 16;
    const frameWidth = 512;
    const frameHeight = 512;
    const currentFrame = Math.floor(time * actionFps) % totalFrames;
    const sx = currentFrame * frameWidth;

    if (isHurt) {
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 18;
    } else if (isEnraged) {
      ctx.shadowColor = 'rgba(249, 115, 22, 0.9)';
      ctx.shadowBlur = 14;
    }

    ctx.drawImage(
      sheet,
      sx,
      0,
      frameWidth,
      frameHeight,
      -targetW / 2,
      -targetH / 2,
      targetW,
      targetH,
    );
  } else {
    // Clean pixel art fallback
    const fallbackImg = assets['boss_volcanic_dragon'];
    if (fallbackImg && fallbackImg.complete && fallbackImg.naturalWidth > 0) {
      if (isHurt) {
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 14;
      }
      ctx.drawImage(fallbackImg, -targetW / 2, -targetH / 2, targetW, targetH);
    }
  }

  ctx.restore();
}

function drawAnimatedCelestialDeity(
  ctx: CanvasRenderingContext2D,
  b: BossEntity,
  assets: Record<string, HTMLImageElement | null>,
  bossCenterX: number,
  bossCenterY: number,
) {
  const time = b.animTime ?? b.animTimer ?? 0;
  const isEnraged = b.phase === 2;
  const isHurt = b.hurtTimer > 0;

  // Determine current action and select animated spritesheet
  let actionFps = 8;
  let totalFrames = 16;
  let sheetKey = 'boss_celestial_deity_spritesheet_idle';

  if (b.state === 'DYING' || b.state === 'DEAD') {
    actionFps = 8;
    totalFrames = 16;
    sheetKey = 'boss_celestial_deity_spritesheet_death';
  } else if (isHurt) {
    actionFps = 12;
    totalFrames = 16;
    sheetKey = 'boss_celestial_deity_spritesheet_hurt';
  } else if (b.phase === 1) {
    if (
      b.state === 'DEITY_SHOOT' ||
      b.state === 'DEITY_SHOOT_PREP' ||
      b.state === 'PSYCHIC_ORB_FAN' ||
      b.state === 'PSYCHIC_ORB_PREP'
    ) {
      actionFps = 16;
      totalFrames = 16;
      sheetKey = 'boss_celestial_deity_spritesheet_shoot';
    } else if (
      b.state === 'DEITY_KARATE_ATTACK' ||
      b.state === 'DEITY_KARATE_DASH'
    ) {
      actionFps = 16;
      totalFrames = 16;
      sheetKey = 'boss_celestial_deity_spritesheet_attack';
    } else if (b.state === 'ASURA_TELEPORT_OUT' || b.state === 'ASURA_TELEPORT_IN') {
      actionFps = 16;
      totalFrames = 16;
      sheetKey = 'boss_celestial_deity_spritesheet_jump';
    } else {
      actionFps = 6;
      totalFrames = 4;
      sheetKey = 'boss_celestial_deity_spritesheet_idle';
    }
  } else {
    // Phase 2 (Standing Trident Combat)
    if (
      b.state === 'DEITY_TRIDENT_THRUST' ||
      b.state === 'DEITY_TRIDENT_PREP' ||
      b.state === 'SACRED_SHOCKWAVES' ||
      b.state === 'SACRED_SHOCKWAVES_PREP'
    ) {
      actionFps = 16;
      totalFrames = 16;
      sheetKey = 'boss_celestial_deity_spritesheet_sword_attack';
    } else if (
      b.state === 'DEITY_PLUNGE_JUMP' ||
      b.state === 'DEITY_PLUNGE_DIVE' ||
      b.state === 'ASURA_TELEPORT_OUT' ||
      b.state === 'ASURA_TELEPORT_IN'
    ) {
      actionFps = 16;
      totalFrames = 16;
      sheetKey = 'boss_celestial_deity_spritesheet_jump';
    } else if (b.state === 'PSYCHIC_ORB_FAN' || b.state === 'PSYCHIC_ORB_PREP') {
      actionFps = 16;
      totalFrames = 16;
      sheetKey = 'boss_celestial_deity_spritesheet_shoot';
    } else if (b.state === 'DEITY_WALK') {
      actionFps = 10;
      totalFrames = 16;
      sheetKey = 'boss_celestial_deity_spritesheet_walk';
    } else {
      actionFps = 6;
      totalFrames = 16;
      sheetKey = 'boss_celestial_deity_spritesheet_walk';
    }
  }

  const candidateKeys = [
    sheetKey,
    'boss_celestial_deity_spritesheet_idle',
    'boss_celestial_deity_spritesheet_walk',
    'boss_celestial_deity_spritesheet_attack',
    'boss_celestial_deity_spritesheet_sword_attack',
    'boss_celestial_deity_spritesheet_shoot',
    'boss_celestial_deity_spritesheet_jump',
    'boss_celestial_deity_spritesheet_hurt',
    'boss_celestial_deity_spritesheet_death',
  ];
  let sheet: HTMLImageElement | null = null;
  let activeKey = sheetKey;
  for (const k of candidateKeys) {
    const candidate = assets[k];
    if (candidate && candidate.complete && candidate.naturalWidth > 0) {
      sheet = candidate;
      activeKey = k;
      break;
    }
  }

  if (activeKey === 'boss_celestial_deity_spritesheet_idle') {
    totalFrames = 4;
  } else if (activeKey !== sheetKey) {
    totalFrames = 16;
  }

  const targetW = 150;
  const targetH = 160;

  ctx.save();
  ctx.translate(bossCenterX, bossCenterY);

  // Spritesheet facing orientation: faces RIGHT by default.
  // When facing left, apply horizontal flip scale(-1, 1).
  const isFacingLeft = !b.facingRight;
  if (isFacingLeft) {
    ctx.scale(-1, 1);
  }

  ctx.imageSmoothingEnabled = false;

  // Render Sprite Frame
  if (sheet && sheet.complete && sheet.naturalWidth > 0) {
    const frameWidth = 512;
    const frameHeight = 512;
    let currentFrame = Math.floor(time * actionFps) % totalFrames;
    if (b.state === 'DYING') {
      const dur = b.deathDuration || 2.2;
      const prog = clamp(1 - (b.stateTimer || 0) / dur, 0, 1);
      currentFrame = Math.min(totalFrames - 1, Math.floor(prog * totalFrames));
    } else if (b.state === 'DEAD') {
      currentFrame = totalFrames - 1;
    }
    const sx = currentFrame * frameWidth;

    if (isHurt) {
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 18;
    } else if (isEnraged) {
      ctx.shadowColor = 'rgba(251, 191, 36, 0.9)';
      ctx.shadowBlur = 14;
    }

    ctx.drawImage(
      sheet,
      sx,
      0,
      frameWidth,
      frameHeight,
      -targetW / 2,
      -targetH / 2,
      targetW,
      targetH,
    );
  }

  ctx.restore();

  // Alpha fade during astral teleport sequence
  if (b.state === 'ASURA_TELEPORT_OUT') {
    const fade = clamp(b.stateTimer / 0.3, 0, 1);
    ctx.globalAlpha = fade;
  } else if (b.state === 'ASURA_TELEPORT_IN') {
    const fade = clamp(1 - b.stateTimer / 0.3, 0, 1);
    ctx.globalAlpha = fade;
  }

  // Draw Spherical Protective Shield (Whenever shieldActive is true)
  if (b.shieldActive && b.state !== 'DYING' && b.state !== 'DEAD') {
    ctx.save();
    const shieldRadius = 82;
    const pulse = Math.sin(time * 4) * 3;
    const r = shieldRadius + pulse;

    // Glowing translucent celestial spherical dome
    const shieldGrad = ctx.createRadialGradient(
      bossCenterX,
      bossCenterY,
      10,
      bossCenterX,
      bossCenterY,
      r,
    );
    shieldGrad.addColorStop(0, 'rgba(129, 140, 248, 0.08)');
    shieldGrad.addColorStop(0.65, 'rgba(56, 189, 248, 0.22)');
    shieldGrad.addColorStop(0.9, 'rgba(250, 204, 21, 0.35)');
    shieldGrad.addColorStop(1, 'rgba(250, 204, 21, 0.7)');

    ctx.fillStyle = shieldGrad;
    ctx.beginPath();
    ctx.arc(bossCenterX, bossCenterY, r, 0, Math.PI * 2);
    ctx.fill();

    // Runic golden outer ring
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#facc15';
    ctx.shadowBlur = 14;
    ctx.stroke();

    // Orbiting astral sparks along the shield sphere
    for (let s = 0; s < 6; s++) {
      const ang = time * 2.2 + (s * Math.PI * 2) / 6;
      const sx = bossCenterX + Math.cos(ang) * r;
      const sy = bossCenterY + Math.sin(ang) * r;
      ctx.fillStyle = s % 2 === 0 ? '#fde047' : '#38bdf8';
      ctx.fillRect(sx - 2, sy - 2, 4, 4);
    }

    ctx.restore();
  }
}

function drawAnimatedFrostEmpress(
  ctx: CanvasRenderingContext2D,
  b: BossEntity,
  assets: Record<string, HTMLImageElement | null>,
  bossCenterX: number,
  bossCenterY: number,
) {
  const time = b.animTime ?? b.animTimer ?? 0;
  const isEnraged = b.phase === 2;
  const isHurt = b.hurtTimer > 0;

  // Determine current action and select animated spritesheet from the 9 available
  let actionFps = 8;
  let totalFrames = 16;
  let sheetKey = 'boss_frost_empress_spritesheet_idle';

  if (b.state === 'DYING' || b.state === 'DEAD') {
    actionFps = 8;
    totalFrames = 16;
    sheetKey = 'boss_frost_empress_spritesheet_death';
  } else if (isHurt) {
    actionFps = 10;
    totalFrames = 16;
    sheetKey = 'boss_frost_empress_spritesheet_hurt';
  } else if (b.state === 'TELEPORT_OUT' || b.state === 'TELEPORT_WAIT') {
    actionFps = 16;
    totalFrames = 16;
    sheetKey = 'boss_frost_empress_spritesheet_jump';
  } else if (
    b.state === 'ICE_PRISMS_PREP' ||
    b.state === 'ICE_PRISMS_SHOOT' ||
    b.state === 'TRIPLE_JAVELINS_SHOOT' ||
    b.state === 'TRIPLE_JAVELINS_PREP'
  ) {
    actionFps = 16;
    totalFrames = 16;
    sheetKey = 'boss_frost_empress_spritesheet_shoot';
  } else if (
    b.state === 'TELEPORT_IN' ||
    b.state === 'SWORD_THRUST' ||
    b.state === 'SCEPTER_THRUST'
  ) {
    actionFps = 16;
    totalFrames = 16;
    sheetKey = 'boss_frost_empress_spritesheet_sword_attack';
  } else if (
    b.state === 'FROST_WAVE_PREP' ||
    b.state === 'FROST_WAVE' ||
    b.state === 'SCEPTER_COMBO' ||
    b.state === 'ICICLE_RAIN_CAST' ||
    b.state === 'EXPANDING_FROST_RINGS'
  ) {
    actionFps = 16;
    totalFrames = 16;
    sheetKey = 'boss_frost_empress_spritesheet_attack';
  } else if (
    b.state === 'GLACIAL_DASH' ||
    b.state === 'GLACIAL_GLIDE' ||
    b.state === 'RUN' ||
    Math.abs(b.vx) > 100
  ) {
    actionFps = 16;
    totalFrames = 16;
    sheetKey = 'boss_frost_empress_spritesheet_run';
  } else if (b.state === 'WALK' || (Math.abs(b.vx) > 15)) {
    actionFps = 8;
    totalFrames = 16;
    sheetKey = 'boss_frost_empress_spritesheet_walk';
  } else {
    actionFps = 8;
    totalFrames = 4;
    sheetKey = 'boss_frost_empress_spritesheet_idle';
  }

  const candidateKeys = [
    sheetKey,
    'boss_frost_empress_spritesheet_idle',
    'boss_frost_empress_spritesheet_walk',
    'boss_frost_empress_spritesheet_run',
    'boss_frost_empress_spritesheet_attack',
    'boss_frost_empress_spritesheet_sword_attack',
    'boss_frost_empress_spritesheet_shoot',
    'boss_frost_empress_spritesheet_jump',
    'boss_frost_empress_spritesheet_hurt',
    'boss_frost_empress_spritesheet_death',
  ];
  let sheet: HTMLImageElement | null = null;
  let activeKey = sheetKey;
  for (const k of candidateKeys) {
    const candidate = assets[k];
    if (candidate && candidate.complete && candidate.naturalWidth > 0) {
      sheet = candidate;
      activeKey = k;
      break;
    }
  }

  if (activeKey === 'boss_frost_empress_spritesheet_idle') {
    totalFrames = 4;
  } else if (activeKey !== sheetKey) {
    totalFrames = 16;
  }

  const targetW = 140;
  const targetH = 160;

  ctx.save();
  ctx.translate(bossCenterX, bossCenterY);

  // Kryona's natural spritesheet frames face RIGHT.
  // When Voltlynx is to her left (!b.facingRight), flip horizontally scale(-1, 1) so her face,
  // scepter, and front gown always point TOWARDS Voltlynx, never facing away or showing her back.
  if (!b.facingRight) {
    ctx.scale(-1, 1);
  }

  // Alpha fade during teleport sequence
  if (b.state === 'TELEPORT_OUT') {
    const fade = clamp(b.stateTimer / 0.35, 0, 1);
    ctx.globalAlpha = fade;
  } else if (b.state === 'TELEPORT_WAIT') {
    ctx.globalAlpha = 0;
  } else if (b.state === 'TELEPORT_IN') {
    const fade = clamp(1 - b.stateTimer / 0.35, 0, 1);
    ctx.globalAlpha = fade;
  }

  ctx.imageSmoothingEnabled = false;

  if (sheet && sheet.complete && sheet.naturalWidth > 0) {
    const frameWidth = 512;
    const frameHeight = 512;
    const currentFrame = Math.floor(time * actionFps) % totalFrames;
    const sx = currentFrame * frameWidth;

    if (isHurt) {
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 18;
    } else if (isEnraged) {
      ctx.shadowColor = 'rgba(56, 189, 248, 0.95)';
      ctx.shadowBlur = 14;
    }

    ctx.drawImage(
      sheet,
      sx,
      0,
      frameWidth,
      frameHeight,
      -targetW / 2,
      -targetH / 2,
      targetW,
      targetH,
    );

    // Frost Illusions / Mirages (Ilusiones de hielo temporales)
    if (b.mirageTimer && b.mirageTimer > 0) {
      const mirageAlpha = Math.min(0.5, b.mirageTimer / 2.0);
      ctx.save();
      ctx.globalAlpha = mirageAlpha;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 20;

      // Left frost mirror clone
      ctx.drawImage(
        sheet,
        sx,
        0,
        frameWidth,
        frameHeight,
        -targetW / 2 - 55,
        -targetH / 2 - 8,
        targetW,
        targetH,
      );

      // Right frost mirror clone
      ctx.drawImage(
        sheet,
        sx,
        0,
        frameWidth,
        frameHeight,
        -targetW / 2 + 55,
        -targetH / 2 + 8,
        targetW,
        targetH,
      );
      ctx.restore();
    }
  }

  ctx.restore();
}

function drawAnimatedElectricChimera(
  ctx: CanvasRenderingContext2D,
  b: BossEntity,
  assets: Record<string, HTMLImageElement | null>,
  bossCenterX: number,
  bossCenterY: number,
) {
  const isEnraged = b.phase === 2;
  const isHurt = b.hurtTimer > 0;
  const targetW = b.width;
  const targetH = b.height;

  ctx.save();
  ctx.translate(bossCenterX, bossCenterY);

  if (b.facingRight) {
    ctx.scale(-1, 1);
  }

  const isDyingOrDead = b.state === 'DYING' || b.state === 'DEAD';
  if (isDyingOrDead) {
    ctx.rotate(0.3);
    ctx.translate(0, 14);
  }

  ctx.imageSmoothingEnabled = false;

  const img = assets['boss_electric_chimera'];
  if (isHurt) {
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 18;
  } else if (isEnraged) {
    ctx.shadowColor = 'rgba(168, 85, 247, 0.85)';
    ctx.shadowBlur = 14;
  }

  if (img && img.complete && img.naturalWidth > 0) {
    ctx.drawImage(img, -targetW / 2, -targetH / 2, targetW, targetH);
  }
  ctx.restore();
}

function drawAnimatedGhoturHumanoid(
  ctx: CanvasRenderingContext2D,
  b: BossEntity,
  assets: Record<string, HTMLImageElement | null>,
  bossCenterX: number,
  bossCenterY: number,
) {
  const time = b.animTime ?? b.animTimer ?? 0;
  const isEnraged = b.phase === 2;
  const isHurt = b.hurtTimer > 0;

  let actionFps = 8;
  let totalFrames = 16;
  let sheetKey = 'boss_ghotur_humanoid_spritesheet_idle';

  if (b.state === 'DESPERATION' || b.state === 'DYING' || b.state === 'DEAD') {
    actionFps = 8;
    sheetKey = 'boss_ghotur_humanoid_spritesheet_death';
  } else if (isHurt) {
    actionFps = 10;
    sheetKey = 'boss_ghotur_humanoid_spritesheet_hurt';
  } else if (b.state === 'LEVITATE' || b.state === 'SUPREME_POWER' || b.state === 'COMBINED_BURST') {
    actionFps = 8;
    sheetKey = 'boss_ghotur_humanoid_spritesheet_climb_wall';
  } else if (
    b.state === 'TELEPORT_OUT' ||
    b.state === 'TELEPORT_IN' ||
    b.state === 'JUMP' ||
    b.state === 'DESCENDING_THRUST_JUMP'
  ) {
    actionFps = 16;
    sheetKey = 'boss_ghotur_humanoid_spritesheet_jump';
  } else if (b.state === 'DUAL_ELEMENT_PREP' || b.state === 'DUAL_ELEMENT_SHOOT') {
    actionFps = 16;
    sheetKey = 'boss_ghotur_humanoid_spritesheet_shoot';
  } else if (
    b.state === 'ELEGANT_SLASH' ||
    b.state === 'SWORD_COMBO' ||
    b.state === 'LIGHTNING_THRUST'
  ) {
    actionFps = 16;
    sheetKey = 'boss_ghotur_humanoid_spritesheet_sword_attack';
  } else if (
    b.state === 'ATTACK' ||
    b.state === 'SORCERY_STRIKE' ||
    b.state === 'DESCENDING_THRUST_SLAM'
  ) {
    actionFps = 16;
    sheetKey = 'boss_ghotur_humanoid_spritesheet_attack';
  } else if (
    b.state === 'RUN' ||
    b.state === 'SHADOW_DASH' ||
    b.state === 'SPECTRAL_SLIDE' ||
    (Math.abs(b.vx) > 120)
  ) {
    actionFps = 16;
    sheetKey = 'boss_ghotur_humanoid_spritesheet_run';
  } else if (b.state === 'WALK' || (Math.abs(b.vx) > 15)) {
    actionFps = 8;
    sheetKey = 'boss_ghotur_humanoid_spritesheet_walk';
  } else {
    actionFps = 8;
    sheetKey = 'boss_ghotur_humanoid_spritesheet_idle';
  }

  const candidateKeys = [
    sheetKey,
    'boss_ghotur_humanoid_spritesheet_idle',
    'boss_ghotur_humanoid_spritesheet_walk',
    'boss_ghotur_humanoid_spritesheet_run',
    'boss_ghotur_humanoid_spritesheet_attack',
    'boss_ghotur_humanoid_spritesheet_sword_attack',
    'boss_ghotur_humanoid_spritesheet_shoot',
    'boss_ghotur_humanoid_spritesheet_jump',
    'boss_ghotur_humanoid_spritesheet_climb_wall',
    'boss_ghotur_humanoid_spritesheet_hurt',
    'boss_ghotur_humanoid_spritesheet_death',
  ];
  let sheet: HTMLImageElement | null = null;
  let activeKey = sheetKey;
  for (const k of candidateKeys) {
    const candidate = assets[k];
    if (candidate && candidate.complete && candidate.naturalWidth > 0) {
      sheet = candidate;
      activeKey = k;
      break;
    }
  }

  if (!sheet) return;

  if (activeKey === 'boss_ghotur_humanoid_spritesheet_idle') {
    totalFrames = 4;
  } else if (activeKey !== sheetKey) {
    totalFrames = 16;
  }

  const targetW = 144;
  const targetH = 160;

  ctx.save();
  ctx.translate(bossCenterX, bossCenterY);

  // Spritesheet faces right by default. When looking left, scale(-1, 1).
  if (!b.facingRight) {
    ctx.scale(-1, 1);
  }

  // Flash-step / teleport alpha fade
  if (b.state === 'TELEPORT_OUT') {
    ctx.globalAlpha = clamp(b.stateTimer / 0.3, 0, 1);
  } else if (b.state === 'TELEPORT_IN') {
    ctx.globalAlpha = clamp(1 - b.stateTimer / 0.3, 0, 1);
  }

  ctx.imageSmoothingEnabled = false;

  const frameWidth = 512;
  const frameHeight = 512;
  const currentFrame = Math.floor(time * actionFps) % totalFrames;
  const sx = currentFrame * frameWidth;

  if (isHurt) {
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 18;
  } else if (isEnraged) {
    ctx.shadowColor = 'rgba(234, 88, 12, 0.95)';
    ctx.shadowBlur = 16;
  } else {
    ctx.shadowColor = 'rgba(168, 85, 247, 0.6)';
    ctx.shadowBlur = 12;
  }

  ctx.drawImage(
    sheet,
    sx,
    0,
    frameWidth,
    frameHeight,
    -targetW / 2,
    -targetH / 2,
    targetW,
    targetH,
  );

  ctx.restore();
}

function drawAnimatedGhoturDemon(
  ctx: CanvasRenderingContext2D,
  b: BossEntity,
  assets: Record<string, HTMLImageElement | null>,
  bossCenterX: number,
  bossCenterY: number,
) {
  const time = b.animTime ?? b.animTimer ?? 0;
  const isEnraged = b.phase === 2;
  const isHurt = b.hurtTimer > 0;

  let actionFps = 8;
  let totalFrames = 16;
  const frameWidth = 512;
  const frameHeight = 512;
  let sheetKey = 'boss_ghotur_demonic_spritesheet_idle';

  if (b.state === 'DYING' || b.state === 'DEAD') {
    actionFps = 8;
    totalFrames = 16;
    sheetKey = 'boss_ghotur_demonic_spritesheet_death';
  } else if (isHurt || b.state === 'VULNERABLE_STUN') {
    actionFps = 8;
    totalFrames = 16;
    sheetKey = 'boss_ghotur_demonic_spritesheet_hurt';
  } else if (
    b.state === 'TRIDENT_SLAM_JUMP' ||
    b.state === 'BEHEMOTH_STOMP_JUMP' ||
    b.state === 'JUMP'
  ) {
    actionFps = 16;
    totalFrames = 16;
    sheetKey = 'boss_ghotur_demonic_spritesheet_jump';
  } else if (
    b.state === 'TRIDENT_THRUST' ||
    b.state === 'TRIDENT_COMBO' ||
    b.state === 'TRIDENT_THRUST_PREP' ||
    b.state === 'SWORD_ATTACK'
  ) {
    actionFps = 16;
    totalFrames = 16;
    sheetKey = 'boss_ghotur_demonic_spritesheet_sword_attack';
  } else if (
    b.state === 'TRIDENT_SPEARS' ||
    b.state === 'TRIDENT_LIGHTNING' ||
    b.state === 'TRIDENT_LIGHTNING_PREP' ||
    b.state === 'TRIDENT_MAGIC' ||
    b.state === 'TRIDENT_MAGIC_PREP' ||
    b.state === 'MAGMA_METEORS' ||
    b.state === 'FROST_BLADES' ||
    b.state === 'VACUUM_BURST' ||
    b.state === 'SHOOT'
  ) {
    actionFps = 16;
    totalFrames = 16;
    sheetKey = 'boss_ghotur_demonic_spritesheet_shoot';
  } else if (
    b.state === 'TRIDENT_SLAM_DIVE' ||
    b.state === 'TRIDENT_SWEEP' ||
    b.state === 'TRIDENT_SWEEP_PREP' ||
    b.state === 'TRIDENT_SLAM_LANDING' ||
    b.state === 'ROAR' ||
    b.state === 'CLAW_SWIPE' ||
    b.state === 'ATTACK'
  ) {
    actionFps = 16;
    totalFrames = 16;
    sheetKey = 'boss_ghotur_demonic_spritesheet_attack';
  } else if (
    b.state === 'TRIDENT_LEVITATE' ||
    b.state === 'CLIMB_WALL'
  ) {
    actionFps = 8;
    totalFrames = 16;
    sheetKey = 'boss_ghotur_demonic_spritesheet_climb_wall';
  } else if (
    b.state === 'CHARGING_RUSH' ||
    b.state === 'TRIDENT_CHARGE_RUSH' ||
    b.state === 'TRIDENT_CHARGE_PREP' ||
    b.state === 'RUN' ||
    Math.abs(b.vx) > 130
  ) {
    actionFps = 16;
    totalFrames = 16;
    sheetKey = 'boss_ghotur_demonic_spritesheet_run';
  } else if (
    b.state === 'WALK' ||
    b.state === 'TRIDENT_MARCH' ||
    Math.abs(b.vx) > 15
  ) {
    actionFps = 8;
    totalFrames = 16;
    sheetKey = 'boss_ghotur_demonic_spritesheet_walk';
  } else {
    // IDLE is strictly 4 frames (2048x512)
    actionFps = 6;
    totalFrames = 4;
    sheetKey = 'boss_ghotur_demonic_spritesheet_idle';
  }

  // Pure single-source sprite lookup: fallback exclusively to demonic idle texture
  const sheet = assets[sheetKey] || assets['boss_ghotur_demonic_spritesheet_idle'];
  // Colossal Crimson Arch-Fiend proportions: 220px by 220px to prevent any clipping of obsidian horns, bat wings, or glowing demon trident
  const targetW = 220;
  const targetH = 220;

  ctx.save();
  ctx.translate(bossCenterX, bossCenterY);

  if (!b.facingRight) {
    ctx.scale(-1, 1);
  }

  // Dramatic death dissolve into starlight embers
  if (b.state === 'DYING') {
    const dissolveAlpha = clamp(b.stateTimer / 2.2, 0, 1);
    ctx.globalAlpha = dissolveAlpha;
    const auraGlow = ctx.createRadialGradient(0, 0, 15, 0, 0, 130);
    auraGlow.addColorStop(0, 'rgba(250, 204, 21, 0.5)');
    auraGlow.addColorStop(0.5, 'rgba(239, 68, 68, 0.3)');
    auraGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = auraGlow;
    ctx.beginPath();
    ctx.arc(0, 0, 130, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.imageSmoothingEnabled = false;

  if (sheet && sheet.complete && sheet.naturalWidth > 0) {
    const currentFrame =
      b.state === 'DYING' || b.state === 'DEAD'
        ? Math.min(totalFrames - 1, Math.floor(time * actionFps))
        : Math.floor(time * actionFps) % totalFrames;
    const sx = currentFrame * frameWidth;

    if (isHurt) {
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 24;
    } else if (isEnraged) {
      ctx.shadowColor = 'rgba(239, 68, 68, 0.95)';
      ctx.shadowBlur = 22;
    } else {
      ctx.shadowColor = 'rgba(147, 51, 234, 0.75)';
      ctx.shadowBlur = 18;
    }

    ctx.drawImage(
      sheet,
      sx,
      0,
      frameWidth,
      frameHeight,
      -targetW / 2,
      -targetH / 2,
      targetW,
      targetH,
    );

    // Flowing sweeping crimson energy slash trail on Trident thrusts and sweeps
    if (
      b.state === 'TRIDENT_THRUST' ||
      b.state === 'TRIDENT_SWEEP' ||
      b.state === 'TRIDENT_COMBO' ||
      b.state === 'SWORD_ATTACK' ||
      b.state === 'ATTACK'
    ) {
      const swingProg = clamp(1 - (b.stateTimer || 0) / 0.5, 0, 1);
      ctx.save();
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 20;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(28, -8, 95, -Math.PI * 0.45 + swingProg * 0.85, Math.PI * 0.35 + swingProg * 0.85);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(254, 240, 138, 0.9)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(28, -8, 95, -Math.PI * 0.35 + swingProg * 0.85, Math.PI * 0.25 + swingProg * 0.85);
      ctx.stroke();
      ctx.restore();
    }

    // Majestic crackling lightning and fire spewing from the 3 trident prongs when raised aloft (SHOOT)
    if (
      b.state === 'TRIDENT_SPEARS' ||
      b.state === 'TRIDENT_LIGHTNING' ||
      b.state === 'SHOOT'
    ) {
      ctx.save();
      const tridentTipX = 36;
      const tridentTipY = -68;

      // 3 prongs radiant aura
      ctx.strokeStyle = '#facc15';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 18;
      ctx.lineWidth = 2;

      // Spark filaments arcing between the 3 prongs
      const tSeed = Math.floor(Date.now() / 60);
      for (let prong = -1; prong <= 1; prong++) {
        const px = tridentTipX + prong * 16;
        const py = tridentTipY + (prong === 0 ? -10 : 0);
        ctx.fillStyle = prong === 0 ? '#ffffff' : '#fde047';
        ctx.fillRect(px - 2, py - 2, 4, 4);

        // Crackling lightning spark ascending from prong
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + ((tSeed % 3) - 1) * 6, py - 14);
        ctx.lineTo(px + (((tSeed + prong) % 3) - 1) * 8, py - 28);
        ctx.stroke();
      }
      ctx.restore();
    }
  } else {
    // Pure geometric fallback silhouette (Crimson demon with colossal horns and wings)
    ctx.fillStyle = '#7c2d12';
    ctx.fillRect(-targetW / 2, -targetH / 2, targetW, targetH);
  }

  ctx.restore();
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stepperRef = useRef<ReturnType<typeof createFixedStepper>>();
  const isMobile = useIsMobile();
  const [hasTouch, setHasTouch] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onTouch = () => setHasTouch(true);
    window.addEventListener('touchstart', onTouch, {once: true, passive: true});
    return () => window.removeEventListener('touchstart', onTouch);
  }, []);

  useEffect(() => {
    const handleFsChange = () => {
      const isFs = Boolean(
        document.fullscreenElement || (document as any).webkitFullscreenElement,
      );
      setIsFullscreen(isFs);
    };
    const handleResize = () => {
      const isFs = Boolean(
        document.fullscreenElement || (document as any).webkitFullscreenElement,
      );
      setIsFullscreen(isFs);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  const toggleFullscreen = useCallback(async () => {
    gameAudio.playCrispClick();
    try {
      const doc = document as any;
      const docEl = document.documentElement as any;
      if (!doc.fullscreenElement && !doc.webkitFullscreenElement) {
        if (docEl.requestFullscreen) {
          await docEl.requestFullscreen();
        } else if (docEl.webkitRequestFullscreen) {
          await docEl.webkitRequestFullscreen();
        }
        try {
          if (screen.orientation && (screen.orientation as any).lock) {
            await (screen.orientation as any).lock('landscape').catch(() => {});
          }
        } catch {}
      } else {
        if (doc.exitFullscreen) {
          await doc.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
        }
      }
    } catch (err) {
      console.warn('Fullscreen toggle failed:', err);
    }
  }, []);

  // Multi-touch active tracking state for button glow visuals
  const [touchButtons, setTouchButtons] = useState({
    up: false,
    down: false,
    left: false,
    right: false,
    jump: false,
    dash: false,
    thunder: false,
    flame: false,
    flashStep: false,
  });

  // Comprehensive reset of all virtual touch controls to prevent stuck D-pad / buttons
  const clearTouchInputs = useCallback(() => {
    mobileInputRef.current = {
      left: false,
      right: false,
      up: false,
      down: false,
      jump: false,
      dash: false,
      thunder: false,
      flame: false,
      flashStep: false,
    };
    setTouchButtons({
      up: false,
      down: false,
      left: false,
      right: false,
      jump: false,
      dash: false,
      thunder: false,
      flame: false,
      flashStep: false,
    });
  }, []);

  // Global listeners to sanitize virtual touch buttons on window blur, visibility, and pointer cleanup
  useEffect(() => {
    const handleGlobalTouchReset = () => {
      clearTouchInputs();
    };

    window.addEventListener('blur', handleGlobalTouchReset);
    window.addEventListener('pointercancel', handleGlobalTouchReset);
    window.addEventListener('touchcancel', handleGlobalTouchReset);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        clearTouchInputs();
      }
    });

    return () => {
      window.removeEventListener('blur', handleGlobalTouchReset);
      window.removeEventListener('pointercancel', handleGlobalTouchReset);
      window.removeEventListener('touchcancel', handleGlobalTouchReset);
    };
  }, [clearTouchInputs]);

  const handleTouchDown = useCallback(
    (
      btn:
        | 'up'
        | 'down'
        | 'left'
        | 'right'
        | 'jump'
        | 'dash'
        | 'thunder'
        | 'flame'
        | 'flashStep',
      e: React.PointerEvent<HTMLButtonElement>,
    ) => {
      e.preventDefault();
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {}
      if (btn === 'left') mobileInputRef.current.left = true;
      if (btn === 'right') mobileInputRef.current.right = true;
      if (btn === 'down') mobileInputRef.current.down = true;
      if (btn === 'up') {
        mobileInputRef.current.up = true;
      }
      if (btn === 'jump') mobileInputRef.current.jump = true;
      if (btn === 'dash') mobileInputRef.current.dash = true;
      if (btn === 'thunder') mobileInputRef.current.thunder = true;
      if (btn === 'flame') mobileInputRef.current.flame = true;
      if (btn === 'flashStep') mobileInputRef.current.flashStep = true;
      setTouchButtons((prev) => ({...prev, [btn]: true}));
    },
    [],
  );

  const handleTouchUp = useCallback(
    (
      btn:
        | 'up'
        | 'down'
        | 'left'
        | 'right'
        | 'jump'
        | 'dash'
        | 'thunder'
        | 'flame'
        | 'flashStep',
      e: React.PointerEvent<HTMLButtonElement>,
    ) => {
      e.preventDefault();
      try {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      } catch {}
      if (btn === 'left') mobileInputRef.current.left = false;
      if (btn === 'right') mobileInputRef.current.right = false;
      if (btn === 'down') mobileInputRef.current.down = false;
      if (btn === 'up') {
        mobileInputRef.current.up = false;
      }
      if (btn === 'jump') mobileInputRef.current.jump = false;
      if (btn === 'dash') mobileInputRef.current.dash = false;
      if (btn === 'thunder') mobileInputRef.current.thunder = false;
      if (btn === 'flame') mobileInputRef.current.flame = false;
      if (btn === 'flashStep') mobileInputRef.current.flashStep = false;
      setTouchButtons((prev) => ({...prev, [btn]: false}));
    },
    [],
  );

  const showTouchControls = isMobile || hasTouch;

  // SDK & Lifecycle
  const {sdk} = usePlayground();
  const [exitChat] = useRpc<Record<string, unknown>, void>('ExitChat');

  const {assets, isReady: assetsReady} = useAssets(ASSETS_MANIFEST);

  const canvasWidth = getConfig('baseCanvasWidth') as number;
  const canvasHeight = getConfig('baseCanvasHeight') as number;

  if (!stepperRef.current) {
    const stepMs = getConfig('stepMs');
    const maxSubSteps = getConfig('maxSubSteps');
    stepperRef.current = createFixedStepper(stepMs, maxSubSteps);
  }

  const [gameState, setGameState] = useState<GameState>({
    status: 'START',
    score: 0,
    level: 1,
    lives: (getConfig('startingLives') as number) || 15,
    timer: getConfig('timeLimit') as number,
  });

  // Dedicated 90s Konami / CPS-2 Arcade Scene State Machine
  const [currentScene, setCurrentScene] = useState<
    | 'SCENE_TITLE'
    | 'SCENE_DIFFICULTY_SELECT'
    | 'SCENE_STAGE_SELECT'
    | 'SCENE_CONTROLS'
    | 'SCENE_OPTIONS'
    | 'SCENE_STORY'
    | 'SCENE_PROLOGUE'
    | 'SCENE_LOADING'
    | 'SCENE_GAMEPLAY'
    | 'SCENE_VICTORY_TALLY'
    | 'SCENE_BOSS_DEFEATED'
    | 'SCENE_EPILOGUE'
  >('SCENE_TITLE');

  // Bilingual System: Default English ('en'), toggleable to Spanish ('es')
  const [language, setLanguage] = useState<Language>(() => {
    try {
      return (localStorage.getItem('la_grieta_lang') as Language) || 'en';
    } catch {
      return 'en';
    }
  });

  const setLanguageAndPersist = useCallback((lang: Language) => {
    setLanguage(lang);
    try {
      localStorage.setItem('la_grieta_lang', lang);
    } catch {}
    gameAudio.playCrispClick();
  }, []);

  const t = TRANSLATIONS[language];

  // Dual Difficulty System: Tourist Mode (Easy) vs. Devil Mode (Hard)
  const [difficulty, setDifficulty] = useState<Difficulty>(() => {
    try {
      return (localStorage.getItem('la_grieta_diff') as Difficulty) || 'TOURIST';
    } catch {
      return 'TOURIST';
    }
  });
  const difficultyRef = useRef<Difficulty>('TOURIST');
  difficultyRef.current = difficulty;

  const setDifficultyAndPersist = useCallback((diff: Difficulty) => {
    setDifficulty(diff);
    difficultyRef.current = diff;
    try {
      localStorage.setItem('la_grieta_diff', diff);
    } catch {}
    gameAudio.playConfirmSelect();
  }, []);

  // First run: automatically play the cinematic prologue if prologueSeen not in localStorage
  useEffect(() => {
    try {
      const seen = localStorage.getItem('la_grieta_prologue_seen');
      if (!seen) {
        setCurrentScene('SCENE_PROLOGUE');
      }
    } catch {}
  }, []);

  const [bossDefeatedData, setBossDefeatedData] = useState<{
    bossName: string;
    bossSubtitle: string;
    bossType: string;
    fragmentNumber: number;
    fragmentTitle: string;
    fragmentPower: string;
    bgAsset: string;
    nextLevel: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19;
    timer: number;
  } | null>(null);

  const [epilogueSlide, setEpilogueSlide] = useState(0);

  // Dedicated Victory Tally Full-Screen Scene State (Zero Web Modals)
  const [victoryTally, setVictoryTally] = useState<{
    stageCode: string;
    stageName: string;
    isBoss: boolean;
    bossName?: string;
    bossAsset?: string;
    fragmentUnlocked?: number;
    powerUpText: string;
    stageScore: number;
    totalScore: number;
    crystals: number;
    timeBonus: number;
    nextLevel: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19;
    isCampaignComplete?: boolean;
  } | null>(null);

  const [tallyProgress, setTallyProgress] = useState(0);
  const [tallyCountdown, setTallyCountdown] = useState(5);

  // In-Game Arcade Pause Menu Index (Zero scrollbars, 4 vertical options)
  const [pauseMenuIndex, setPauseMenuIndex] = useState(0);

  // Smooth cinematic black fade transition between menu scenes (0.28s)
  const [fadeOpacity, setFadeOpacity] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const [crystalsCount, setCrystalsCount] = useState(0);
  const [energyMana, setEnergyMana] = useState(100);
  const activeFormState = useState<'NORMAL' | 'TITAN'>('NORMAL');
  const [activeForm, setActiveForm] = activeFormState;
  const [currentLevelNumber, setCurrentLevelNumber] = useState<
    1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19
  >(1);
  const currentLevelRef = useRef<
    1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19
  >(1);
  currentLevelRef.current = currentLevelNumber;
  const [hasThunderShot, setHasThunderShot] = useState(false);
  const [isDivineAvatar, setIsDivineAvatar] = useState(false);
  const [flashStepCooldownDisplay, setFlashStepCooldownDisplay] = useState(0);

  // Celestial Core Fragments System (0 to 5)
  const [recoveredFragments, setRecoveredFragments] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('la_grieta_recovered_fragments');
      return saved ? Math.min(5, Math.max(0, parseInt(saved, 10))) : 0;
    } catch {
      return 0;
    }
  });

  const recoveredFragmentsRef = useRef(recoveredFragments);
  recoveredFragmentsRef.current = recoveredFragments;

  // Maximum mana dynamically scaled by recovered fragments: 100 base, +20 per fragment (up to 200)
  const maxManaCapacity = 100 + recoveredFragments * 20;

  // Dedicated Level Transition Cutscene State
  const [isCinematicActive, setIsCinematicActive] = useState(false);

  // Story Visual Novel Prologue State
  const [isStoryPrologueOpen, setIsStoryPrologueOpen] = useState(false);
  const [storyPanelIndex, setStoryPanelIndex] = useState(0);
  const [typewriterIndex, setTypewriterIndex] = useState(0);
  const [isTextFullyTyped, setIsTextFullyTyped] = useState(false);
  const [panelFading, setPanelFading] = useState(false);
  const [isNarrationPlaying, setIsNarrationPlaying] = useState(false);
  const [narrationMuted, setNarrationMuted] = useState(false);
  const [narrationProgress, setNarrationProgress] = useState(0);
  const prologueAudioRef = useRef<HTMLAudioElement | null>(null);
  const nextStoryPanelRef = useRef<() => void>(() => {});
  const prevStoryPanelRef = useRef<() => void>(() => {});

  // Overlays state
  const [isGameMenuOpen, setIsGameMenuOpen] = useState(false);
  const [selectedZoneId, setSelectedZoneId] = useState(1);
  const [debugUnlockAll, setDebugUnlockAll] = useState(false);
  const [sfxMuted, setSfxMuted] = useState(false);
  const [musicMuted, setMusicMuted] = useState(false);
  const [targetFps, setTargetFps] = useState<30 | 60>(60);
  const targetFpsRef = useRef<30 | 60>(60);
  targetFpsRef.current = targetFps;

  // 90s Arcade Persistent Save State (localStorage)
  const [savedData, setSavedData] = useState<SavedArcadeData | null>(() => loadArcadeSave());

  // CRT Scanlines Effect Toggle (persisted)
  const [crtScanlines, setCrtScanlines] = useState<boolean>(() => {
    try {
      return localStorage.getItem('la_grieta_crt') !== 'false';
    } catch {
      return true;
    }
  });

  const toggleCrtScanlines = useCallback(() => {
    gameAudio.playCrispClick();
    setCrtScanlines((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('la_grieta_crt', String(next));
      } catch {}
      return next;
    });
  }, []);

  const handleResetProgress = useCallback(() => {
    gameAudio.playErrorBuzz();
    try {
      localStorage.removeItem('la_grieta_arcade_save_v1');
      localStorage.removeItem('la_grieta_recovered_fragments');
    } catch {}
    setSavedData(null);
    setRecoveredFragments(0);
    recoveredFragmentsRef.current = 0;
    setCurrentLevelNumber(1);
    currentLevelRef.current = 1;
  }, []);

  const transitionToScene = useCallback(
    (
      targetScene:
        | 'SCENE_TITLE'
        | 'SCENE_DIFFICULTY_SELECT'
        | 'SCENE_STAGE_SELECT'
        | 'SCENE_CONTROLS'
        | 'SCENE_OPTIONS'
        | 'SCENE_STORY'
        | 'SCENE_PROLOGUE'
        | 'SCENE_LOADING'
        | 'SCENE_GAMEPLAY'
        | 'SCENE_VICTORY_TALLY'
        | 'SCENE_BOSS_DEFEATED'
        | 'SCENE_EPILOGUE',
      onMidpoint?: () => void,
    ) => {
      if (isTransitioning) return;
      setIsTransitioning(true);
      gameAudio.playCrispClick();

      const fadeDuration = 280; // 0.28s smooth black fade
      const start = performance.now();

      const stepFadeOut = (now: number) => {
        const elapsed = now - start;
        const progress = Math.min(1, elapsed / fadeDuration);
        setFadeOpacity(progress);
        if (progress < 1) {
          requestAnimationFrame(stepFadeOut);
        } else {
          // Midpoint reached: scene state switch
          setCurrentScene(targetScene);
          if (onMidpoint) onMidpoint();

          const inStart = performance.now();
          const stepFadeIn = (nowIn: number) => {
            const inElapsed = nowIn - inStart;
            const inProgress = Math.min(1, inElapsed / fadeDuration);
            setFadeOpacity(1 - inProgress);
            if (inProgress < 1) {
              requestAnimationFrame(stepFadeIn);
            } else {
              setFadeOpacity(0);
              setIsTransitioning(false);
            }
          };
          requestAnimationFrame(stepFadeIn);
        }
      };
      requestAnimationFrame(stepFadeOut);
    },
    [isTransitioning],
  );

  // In-Game Pause Menu Actions Handler (Zero scrollbars, 4 vertical options)
  const handlePauseMenuAction = useCallback(
    (index: number) => {
      if (index === 0) {
        // REANUDAR (RESUME)
        gameAudio.playCrispClick();
        setIsGameMenuOpen(false);
      } else if (index === 1) {
        // REINICIAR NIVEL (RESTART LEVEL)
        gameAudio.playPowerupChime();
        setIsGameMenuOpen(false);
        initGame(currentLevelRef.current);
      } else if (index === 2) {
        // SONIDO Y CRT (SOUND & CRT OPTIONS)
        toggleCrtScanlines();
      } else if (index === 3) {
        // SALIR AL MENÚ PRINCIPAL (QUIT TO TITLE)
        gameAudio.playCrispClick();
        setIsGameMenuOpen(false);
        transitionToScene('SCENE_TITLE', () => {
          setGameState((s) => ({ ...s, status: 'START' }));
        });
      }
    },
    [toggleCrtScanlines, transitionToScene],
  );

  // Global [ESC] and [P] listener for arcade navigation and clean pause menu
  useEffect(() => {
    const handleArcadeKeys = (e: KeyboardEvent) => {
      if (currentScene === 'SCENE_STORY' || currentScene === 'SCENE_PROLOGUE') {
        if (e.code === 'Escape') {
          e.preventDefault();
          gameAudio.playCrispClick();
          triggerArcadeLoading(1, 0, 0);
          return;
        } else if (
          e.code === 'Space' ||
          e.code === 'Enter' ||
          e.code === 'KeyK' ||
          e.code === 'KeyZ' ||
          e.code === 'ArrowRight' ||
          e.code === 'KeyD'
        ) {
          e.preventDefault();
          nextStoryPanelRef.current();
          return;
        } else if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
          e.preventDefault();
          prevStoryPanelRef.current();
          return;
        }
      }

      if (e.code === 'Escape') {
        if (
          currentScene === 'SCENE_DIFFICULTY_SELECT' ||
          currentScene === 'SCENE_STAGE_SELECT' ||
          currentScene === 'SCENE_CONTROLS' ||
          currentScene === 'SCENE_OPTIONS'
        ) {
          e.preventDefault();
          transitionToScene('SCENE_TITLE');
          return;
        } else if (currentScene === 'SCENE_GAMEPLAY') {
          e.preventDefault();
          // Pressing ESC immediately resumes if paused, or opens pause menu
          setIsGameMenuOpen((prev) => {
            gameAudio.playCrispClick();
            if (!prev) setPauseMenuIndex(0);
            return !prev;
          });
          return;
        }
      } else if (e.code === 'KeyP') {
        if (currentScene === 'SCENE_GAMEPLAY') {
          e.preventDefault();
          setIsGameMenuOpen((prev) => {
            gameAudio.playCrispClick();
            if (!prev) setPauseMenuIndex(0);
            return !prev;
          });
          return;
        }
      }

      // Vertical navigation inside in-game pause menu
      if (isGameMenuOpen && currentScene === 'SCENE_GAMEPLAY') {
        if (e.code === 'ArrowUp' || e.code === 'KeyW') {
          e.preventDefault();
          gameAudio.playHoverMicroTone();
          setPauseMenuIndex((prev) => (prev - 1 + 4) % 4);
        } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
          e.preventDefault();
          gameAudio.playHoverMicroTone();
          setPauseMenuIndex((prev) => (prev + 1) % 4);
        } else if (
          e.code === 'Enter' ||
          e.code === 'Space' ||
          e.code === 'KeyK' ||
          e.code === 'KeyZ'
        ) {
          e.preventDefault();
          handlePauseMenuAction(pauseMenuIndex);
        }
      }
    };
    window.addEventListener('keydown', handleArcadeKeys);
    return () => window.removeEventListener('keydown', handleArcadeKeys);
  }, [currentScene, isGameMenuOpen, pauseMenuIndex, transitionToScene, handlePauseMenuAction]);

  // 90s Arcade Sector Loading Transition State
  const [arcadeLoading, setArcadeLoading] = useState<{
    active: boolean;
    level: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19;
    score: number;
    customFragments?: number;
    progress: number;
    tip: string;
  }>({
    active: false,
    level: 1,
    score: 0,
    progress: 0,
    tip: '',
  });

  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  // Boss state hook for UI
  const [bossHpData, setBossHpData] = useState<{
    active: boolean;
    name: string;
    subtitle: string;
    hp: number;
    maxHp: number;
    displayedHp: number;
    phase: number;
    isIntro: boolean;
    isHurt: boolean;
  }>({
    active: false,
    name: 'QUIMERA ELÉCTRICA',
    subtitle: 'Centinela Autómata de las Ruinas de la Tormenta',
    hp: 800,
    maxHp: 800,
    displayedHp: 800,
    phase: 1,
    isIntro: false,
    isHurt: false,
  });

  useEffect(() => {
    (window as any).canHandleBackKey = gameState.status !== 'START';
  }, [gameState.status]);

  usePlaygroundGameLifecycle(gameState, sdk);

  const inputRef = useInput(canvasRef, true, {
    width: canvasWidth,
    height: canvasHeight,
  });

  // Mobile virtual touch buttons state
  const mobileInputRef = useRef({
    left: false,
    right: false,
    up: false,
    down: false,
    jump: false,
    dash: false,
    thunder: false,
    flame: false,
    flashStep: false,
  });

  // Dedicated keyboard input state tracking
  const keyboardRef = useRef({
    left: false,
    right: false,
    up: false,
    down: false,
    jump: false,
    dash: false,
    shoot: false,
    flame: false,
    flashStep: false,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const code = e.code;
      const key = e.key.toLowerCase();
      if (['ArrowLeft', 'KeyA'].includes(code) || key === 'a')
        keyboardRef.current.left = true;
      if (['ArrowRight', 'KeyD'].includes(code) || key === 'd')
        keyboardRef.current.right = true;
      if (['ArrowDown', 'KeyS'].includes(code) || key === 's')
        keyboardRef.current.down = true;
      if (['ArrowUp', 'KeyW'].includes(code) || key === 'w' || key === 'arrowup') {
        keyboardRef.current.up = true;
      }
      if (
        ['Space', 'KeyK', 'KeyZ'].includes(code) ||
        key === 'k' ||
        key === 'z'
      ) {
        keyboardRef.current.jump = true;
      }
      if (
        ['ShiftLeft', 'ShiftRight', 'KeyJ'].includes(code) ||
        key === 'j'
      ) {
        keyboardRef.current.dash = true;
      }
      if (
        ['KeyL', 'KeyU', 'KeyC'].includes(code) ||
        key === 'l' ||
        key === 'u' ||
        key === 'c'
      ) {
        keyboardRef.current.shoot = true;
      }
      if (
        ['KeyE', 'KeyO', 'KeyX'].includes(code) ||
        key === 'e' ||
        key === 'o' ||
        key === 'x'
      ) {
        keyboardRef.current.flame = true;
      }
      if (['KeyQ'].includes(code) || key === 'q') {
        keyboardRef.current.flashStep = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const code = e.code;
      const key = e.key.toLowerCase();
      if (['ArrowLeft', 'KeyA'].includes(code) || key === 'a')
        keyboardRef.current.left = false;
      if (['ArrowRight', 'KeyD'].includes(code) || key === 'd')
        keyboardRef.current.right = false;
      if (['ArrowDown', 'KeyS'].includes(code) || key === 's')
        keyboardRef.current.down = false;
      if (['ArrowUp', 'KeyW'].includes(code) || key === 'w' || key === 'arrowup') {
        keyboardRef.current.up = false;
      }
      if (
        ['Space', 'KeyK', 'KeyZ'].includes(code) ||
        key === 'k' ||
        key === 'z'
      ) {
        keyboardRef.current.jump = false;
      }
      if (
        ['ShiftLeft', 'ShiftRight', 'KeyV', 'KeyB'].includes(code) ||
        key === 'v' ||
        key === 'b' ||
        key === 'shift'
      ) {
        keyboardRef.current.dash = false;
      }
      if (
        ['KeyL', 'KeyJ', 'KeyU', 'KeyX', 'KeyF', 'KeyC'].includes(code) ||
        key === 'l' ||
        key === 'j' ||
        key === 'u' ||
        key === 'x' ||
        key === 'f' ||
        key === 'c'
      ) {
        keyboardRef.current.shoot = false;
      }
      if (
        ['KeyE', 'KeyO', 'KeyR'].includes(code) ||
        key === 'e' ||
        key === 'o' ||
        key === 'r'
      ) {
        keyboardRef.current.flame = false;
      }
      if (['KeyQ'].includes(code) || key === 'q') {
        keyboardRef.current.flashStep = false;
      }
    };

    const handleBlur = () => {
      keyboardRef.current = {
        left: false,
        right: false,
        up: false,
        down: false,
        jump: false,
        dash: false,
        shoot: false,
        flame: false,
        flashStep: false,
      };
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  // Sprite Renderer
  const playerSpriteRendererRef = useRef<SpriteRenderer>(
    new SpriteRenderer(PLAYER_SPRITE_CONFIGS),
  );
  const playerAnimStateRef = useRef<SpriteAnimationState>({
    currentAction: 'IDLE',
    currentFrame: 0,
    timer: 0,
  });

  // Audio status effects
  useEffect(() => {
    if (gameState.status === 'GAME_OVER') {
      gameAudio.playDefeatMotif();
    } else if (gameState.status === 'VICTORY') {
      gameAudio.playVictoryFanfare();
    }
  }, [gameState.status]);

  // World Simulation Reference State
  const worldRef = useRef({
    cameraX: 0,
    cameraY: 0,
    levelWidth: 4200,
    levelHeight: 720,
    checkpointX: 100,
    checkpointY: 420,
    safeRespawnX: 100,
    safeRespawnY: 420,
    beaconX: 3950,
    beaconY: 340,
    shake: 0,
    hitStop: 0,
    bossArenaActive: false,
    bossDoorLocked: false,
    bossRightDoorLocked: false,
    bossIntroBannerTimer: 0,
    bossFightBannerTimer: 0,
    shockwaves: [] as Shockwave[],
    boss: null as BossEntity | null,
    pyramid: null as {
      x: number;
      y: number;
      width: number;
      height: number;
      doorX: number;
      doorY: number;
      doorW: number;
      doorH: number;
    } | null,
    dragonGate: null as {
      x: number;
      y: number;
      width: number;
      height: number;
      doorX: number;
      doorY: number;
      doorW: number;
      doorH: number;
    } | null,
    celestialTempleGate: null as {
      x: number;
      y: number;
      width: number;
      height: number;
      doorX: number;
      doorY: number;
      doorW: number;
      doorH: number;
    } | null,
    glacialCitadelGate: null as {
      x: number;
      y: number;
      width: number;
      height: number;
      doorX: number;
      doorY: number;
      doorW: number;
      doorH: number;
    } | null,
    voidThroneGate: null as {
      x: number;
      y: number;
      width: number;
      height: number;
      doorX: number;
      doorY: number;
      doorW: number;
      doorH: number;
    } | null,
    voidFirePuddles: [] as VoidFirePuddle[],
    bleedingLightningFlash: 0,
    bleedingLightningTimer: 4.5,
    boulders: [] as GlacialBoulder[],
    icicles: [] as FallingIcicle[],
    mountainCheckpoints: [] as MountainCheckpoint[],
    lastCheckpoint43: 0,
    checkpoint43: { x: 480, y: 3480 },
    isRespawning: false,
    respawnLockTimer: 0,
    lives: 15,
    verticalAutoscroll: {
      active: false,
      speed: 65,
      triggered: false,
      summitReached: false,
      pauseTimer: 0,
      resumeBannerTimer: 0,
    },
    celestialFragment: null as {
      x: number;
      y: number;
      collected: boolean;
      bobTimer: number;
    } | null,
    player: {
      x: 100,
      y: 434,
      vx: 0,
      vy: 0,
      width: 32,
      height: 46,
      isGrounded: false,
      isCrouching: false,
      facingRight: true,
      coyoteTimer: 0,
      jumpBufferTimer: 0,
      jumpCount: 0,
      isDashing: false,
      dashTimer: 0,
      attackTimer: 0,
      shootCooldown: 0,
      flameCooldown: 0,
      flashStepCooldown: 0,
      titanTimer: 0,
      ionTimer: 0,
      needleTimer: 0,
      invulnerableTimer: 0,
      squash: 1,
      stretch: 1,
      slowTimer: 0,
      divineResurrectionUsed: false,
      isDivineAvatar: false,
      dropDownTimer: 0,
      isDying: false,
    },
    platforms: [] as PlatformBlock[],
    crushingPillars: [] as CrushingPillarTrap[],
    geysers: [] as JumpGeyser[],
    items: [] as ItemEntity[],
    enemies: [] as EnemyEntity[],
    projectiles: [] as Projectile[],
    particles: [] as Particle[],
    weatherParticles: [] as WeatherParticle[],
    lightningFlash: 0,
    lightningTimer: 4.5,
    stageBannerTimer: 0,
    stageBanner: null as StageBannerData | null,
    inGameCelebrationBanner: null as {
      title: string;
      subtitle: string;
      timer: number;
      isBoss: boolean;
    } | null,
    celebrationPhase: 'NONE' as 'NONE' | 'BANNER' | 'FADING',
    bonusConduits: [] as BonusConduit[],
    isBonusRoom: false,
    bonusReturnState: null as {
      level: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19;
      x: number;
      y: number;
    } | null,
    pipeSequence: {
      active: false,
      phase: 'NONE' as 'NONE' | 'ENTERING' | 'FADE_OUT' | 'EXITING',
      timer: 0,
      duration: 0.6,
      startX: 0,
      startY: 0,
      targetY: 0,
      targetLevel: 1 as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19,
      returnX: 0,
      returnY: 0,
      conduitX: 0,
      conduitY: 0,
    },
    portalSparks: [] as Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      life: number;
      maxLife: number;
    }>,
    cinematic: {
      active: false,
      phase: 'FADE_OUT_LEVEL',
      phaseTimer: 0,
      totalVoidDuration: 2.8,
      targetLevel: 2 as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17,
      targetLevelName: '',
      targetLevelSubtitle: '',
      voltlynxX: 0,
      footstepTimer: 0,
      footstepSparks: [] as FootstepSpark[],
      animState: {
        currentAction: 'WALK',
        currentFrame: 0,
        timer: 0,
      },
    } as CinematicCutsceneState,
  });

  // Edge-detection refs for single-shot inputs
  const prevJumpPressedRef = useRef(false);
  const prevAttackPressedRef = useRef(false);
  const prevShootPressedRef = useRef(false);
  const prevFlamePressedRef = useRef(false);
  const prevFlashStepPressedRef = useRef(false);

  // Typewriter effect ticker & Voice Narration Synchronization for Visual Novel Prologue
  useEffect(() => {
    if (currentScene !== 'SCENE_STORY' && currentScene !== 'SCENE_PROLOGUE') {
      if (prologueAudioRef.current) {
        prologueAudioRef.current.pause();
        prologueAudioRef.current.currentTime = 0;
        prologueAudioRef.current = null;
      }
      setIsNarrationPlaying(false);
      setNarrationProgress(0);
      return;
    }

    const currentStoryPanels = STORY_PANELS_LOCALIZED[language];
    const fullText = (currentStoryPanels[storyPanelIndex] || currentStoryPanels[0]).paragraphs.join(' ');
    setTypewriterIndex(Math.min(fullText.length, 6)); // Never blank out the text completely
    setIsTextFullyTyped(false);
    setNarrationProgress(0);

    // Pause previously playing prologue audio without destroying the blessed audio instance
    if (prologueAudioRef.current) {
      prologueAudioRef.current.pause();
      prologueAudioRef.current.currentTime = 0;
    }

    const voiceFile = PROLOGUE_VOICE_FILES[storyPanelIndex];
    let fallbackInterval: any = null;

    function startFallbackTypewriter(startIdx = 6) {
      if (fallbackInterval) clearInterval(fallbackInterval);
      let charIdx = startIdx;
      fallbackInterval = setInterval(() => {
        charIdx += 2;
        if (charIdx >= fullText.length) {
          setTypewriterIndex(fullText.length);
          setIsTextFullyTyped(true);
          clearInterval(fallbackInterval);
        } else {
          setTypewriterIndex(charIdx);
          if (charIdx % 10 === 0) {
            gameAudio.playCrispClick();
          }
        }
      }, 26);
    }

    // Always start typewriter immediately so text is active and never disappears/waits on network
    startFallbackTypewriter(6);

    if (voiceFile && !narrationMuted && !sfxMuted) {
      let audio = prologueAudioRef.current;
      if (!audio) {
        audio = new Audio();
        prologueAudioRef.current = audio;
      }
      audio.pause();
      audio.src = voiceFile;
      audio.currentTime = 0;
      audio.volume = 1.0;

      audio.onplay = () => {
        setIsNarrationPlaying(true);
        // Clear fallback since audio is driving
        if (fallbackInterval) clearInterval(fallbackInterval);
      };

      audio.onpause = () => {
        setIsNarrationPlaying(false);
      };

      audio.ontimeupdate = () => {
        if (!audio || !audio.duration || isNaN(audio.duration)) return;
        const progress = Math.min(1, audio.currentTime / audio.duration);
        setNarrationProgress(progress * 100);
        const targetChar = Math.min(fullText.length, Math.floor(progress * (fullText.length + 8)));
        setTypewriterIndex((prev) => Math.max(prev, targetChar));
        if (progress >= 0.98) {
          setIsTextFullyTyped(true);
          setTypewriterIndex(fullText.length);
        }
      };

      audio.onended = () => {
        setIsNarrationPlaying(false);
        setIsTextFullyTyped(true);
        setTypewriterIndex(fullText.length);
        setNarrationProgress(100);
      };

      audio.onerror = () => {
        setIsNarrationPlaying(false);
        startFallbackTypewriter(typewriterIndex || 6);
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          setIsNarrationPlaying(false);
          startFallbackTypewriter(typewriterIndex || 6);
        });
      }
    }

    return () => {
      if (fallbackInterval) clearInterval(fallbackInterval);
      const narrationAudio = prologueAudioRef.current;
      if (narrationAudio) {
        narrationAudio.pause();
        narrationAudio.currentTime = 0;
      }
    };
  }, [currentScene, storyPanelIndex, language, narrationMuted, sfxMuted]);

  // Generate Stage Environment (Zone 1: 1-1, 1-2, 1-3, 1-B | Zone 2: 2-1, 2-2, 2-3, 2-B | Zone 3: 3-1, 3-2, 3-3, 3-B | Zone 4: 4-1, 4-2, 4-3, 4-B | Zone 5: 5-1, 5-B, 5-FINAL)
  const buildLevel = useCallback((lvl: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 = 1) => {
    const platforms: PlatformBlock[] = [];
    const crushingPillars: CrushingPillarTrap[] = [];
    const geysers: JumpGeyser[] = [];
    const items: ItemEntity[] = [];
    const enemies: EnemyEntity[] = [];
    const bonusConduits: BonusConduit[] = [];
    const boulders: GlacialBoulder[] = [];
    const icicles: FallingIcicle[] = [];

    let itemId = 1;
    let enemyId = 1;
    let geyserId = 1;
    let conduitId = 1;
    let pillarId = 1;
    let boulderId = 1;
    let icicleId = 1;

    // Helper for ground segments
    const addGround = (
      x: number,
      y: number,
      w: number,
      h = 48,
      isIce = false,
      isVoid = false,
      isOneWay = false,
    ) => {
      platforms.push({x, y, width: w, height: h, type: 'ground', isIce, isVoid, isOneWay});
    };

    worldRef.current.boss = null;
    worldRef.current.pyramid = null;
    worldRef.current.dragonGate = null;
    worldRef.current.celestialTempleGate = null;
    worldRef.current.glacialCitadelGate = null;
    worldRef.current.voidThroneGate = null;
    worldRef.current.voidFirePuddles = [];
    worldRef.current.bleedingLightningFlash = 0;
    worldRef.current.bleedingLightningTimer = 4.0;
    worldRef.current.bossArenaActive = false;
    worldRef.current.bossDoorLocked = false;
    worldRef.current.bossRightDoorLocked = false;
    worldRef.current.bossIntroBannerTimer = 0;
    worldRef.current.bossFightBannerTimer = 0;
    worldRef.current.shockwaves = [];
    worldRef.current.celestialFragment = null;
    worldRef.current.isBonusRoom = false;
    worldRef.current.boulders = [];
    worldRef.current.icicles = [];
    worldRef.current.mountainCheckpoints = [];
    worldRef.current.verticalAutoscroll = {
      active: lvl === 15,
      speed: 22,
      triggered: false,
      summitReached: false,
      pauseTimer: lvl === 15 ? 3.5 : 0,
      resumeBannerTimer: 0,
    };

    // Initialize authentic pixel-art spark particles for portal archway
    const portalSparks: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      life: number;
      maxLife: number;
    }> = [];
    const sparkPalette = ['#00f0ff', '#38bdf8', '#facc15', '#ffffff', '#c084fc'];
    for (let i = 0; i < 28; i++) {
      portalSparks.push({
        x: (Math.random() - 0.5) * 64,
        y: (Math.random() - 0.5) * 76,
        vx: (Math.random() - 0.5) * 22,
        vy: -14 - Math.random() * 26,
        size: Math.random() > 0.4 ? 2 : 3,
        color: sparkPalette[Math.floor(Math.random() * sparkPalette.length)],
        life: 0.2 + Math.random() * 0.8,
        maxLife: 1.0,
      });
    }
    worldRef.current.portalSparks = portalSparks;

    if (lvl === 1) {
      // =======================================================================
      // NIVEL 1-1: PRADERAS DE AETHERIA (Aetheria Meadows)
      // =======================================================================
      worldRef.current.levelWidth = 3200;
      worldRef.current.levelHeight = 650;
      worldRef.current.checkpointX = 100;
      worldRef.current.checkpointY = 432;
      worldRef.current.beaconX = 3020;
      worldRef.current.beaconY = 372;

      // 1. Safe tutorial flat ground (0 to 750)
      addGround(0, 480, 750);
      platforms.push({x: 380, y: 340, width: 44, height: 44, type: 'dynamo'});
      platforms.push({x: 450, y: 340, width: 44, height: 44, type: 'dynamo'});

      [180, 220, 260, 300, 520, 560].forEach((cx) => {
        items.push({id: itemId++, x: cx, y: 430, vx: 0, vy: 0, type: 'crystal'});
      });

      items.push({
        id: itemId++,
        x: 392,
        y: 290,
        vx: 0,
        vy: 0,
        type: 'storm_needle',
      });

      // Extra-Life Heart & Health Pack
      items.push({id: itemId++, x: 450, y: 290, vx: 0, vy: 0, type: 'heart_hp'});
      items.push({id: itemId++, x: 1740, y: 280, vx: 0, vy: 0, type: 'heart_1up'});

      enemies.push({
        id: enemyId++,
        x: 650,
        y: 430,
        width: 58,
        height: 38,
        type: 'crawler',
        vx: 75,
        vy: 0,
        initialY: 430,
        facingRight: false,
        minX: 580,
        maxX: 720,
        alive: true,
        hp: 1,
        maxHp: 1,
      });

      // 2. Stepping Terrace with forgiving lower safety ground (750 to 1350)
      addGround(720, 540, 240);
      addGround(800, 460, 540);
      addGround(900, 360, 160, 32);
      addGround(1120, 280, 180, 32);
      platforms.push({x: 960, y: 220, width: 44, height: 44, type: 'dynamo'});

      [840, 880, 930, 970, 1160, 1200, 1240].forEach((cx) => {
        items.push({id: itemId++, x: cx, y: 410, vx: 0, vy: 0, type: 'crystal'});
      });

      enemies.push({
        id: enemyId++,
        x: 1040,
        y: 410,
        width: 58,
        height: 38,
        type: 'crawler',
        vx: 80,
        vy: 0,
        initialY: 410,
        facingRight: true,
        minX: 980,
        maxX: 1260,
        alive: true,
      });

      addGround(1300, 540, 200);

      // 3. CHECKPOINT 1 AREA: 100% Safe, flat ground (1400 to 1920)
      addGround(1400, 460, 540);
      platforms.push({x: 1560, y: 320, width: 44, height: 44, type: 'dynamo'});
      items.push({
        id: itemId++,
        x: 1570,
        y: 270,
        vx: 0,
        vy: 0,
        type: 'resonant_core',
      });

      platforms.push({x: 1740, y: 396, width: 48, height: 64, type: 'breakable'});
      platforms.push({x: 1740, y: 332, width: 48, height: 64, type: 'breakable'});
      items.push({id: itemId++, x: 1820, y: 410, vx: 0, vy: 0, type: 'crystal'});
      items.push({id: itemId++, x: 1860, y: 410, vx: 0, vy: 0, type: 'crystal'});

      // 4. Mid Terrace: Introducing Sky Ray
      addGround(1940, 460, 440);
      addGround(2040, 340, 160, 32);

      enemies.push({
        id: enemyId++,
        x: 2100,
        y: 210,
        width: 72,
        height: 38,
        type: 'sky_ray',
        vx: -85,
        vy: 0,
        initialY: 210,
        facingRight: false,
        alive: true,
      });

      enemies.push({
        id: enemyId++,
        x: 2240,
        y: 410,
        width: 58,
        height: 38,
        type: 'crawler',
        vx: 85,
        vy: 0,
        initialY: 410,
        facingRight: true,
        minX: 2160,
        maxX: 2340,
        alive: true,
      });

      // 5. CHECKPOINT 2 AREA: Peaceful plateau (2380 to 2760)
      addGround(2380, 460, 420);
      platforms.push({x: 2500, y: 330, width: 44, height: 44, type: 'dynamo'});
      items.push({id: itemId++, x: 2510, y: 280, vx: 0, vy: 0, type: 'storm_needle'});
      items.push({id: itemId++, x: 2580, y: 410, vx: 0, vy: 0, type: 'crystal'});
      items.push({id: itemId++, x: 2620, y: 410, vx: 0, vy: 0, type: 'crystal'});

      // 6. Final Approach: Elevated Turret and Ancient Meadow Beacon
      addGround(2800, 460, 420);
      enemies.push({
        id: enemyId++,
        x: 2880,
        y: 374,
        width: 46,
        height: 86,
        type: 'turret',
        vx: 0,
        vy: 0,
        initialY: 374,
        facingRight: false,
        alive: true,
        hp: 3,
        maxHp: 3,
        shootTimer: 2.8,
        chargeTimer: 0,
      });

      [2940, 2980].forEach((cx) => {
        items.push({id: itemId++, x: cx, y: 410, vx: 0, vy: 0, type: 'crystal'});
      });
    } else if (lvl === 2) {
      // =======================================================================
      // NIVEL 1-2: CAÑÓN DE LOS RELÁMPAGOS (Lightning Canyon)
      // =======================================================================
      worldRef.current.levelWidth = 3800;
      worldRef.current.levelHeight = 700;
      worldRef.current.checkpointX = 100;
      worldRef.current.checkpointY = 432;
      worldRef.current.beaconX = 3580;
      worldRef.current.beaconY = 352;

      // 1. Canyon Entrance Plateau (0 to 600)
      addGround(0, 480, 600);
      platforms.push({x: 340, y: 340, width: 44, height: 44, type: 'dynamo'});
      items.push({id: itemId++, x: 350, y: 290, vx: 0, vy: 0, type: 'storm_needle'});
      [180, 240, 420, 480].forEach((cx) => {
        items.push({id: itemId++, x: cx, y: 430, vx: 0, vy: 0, type: 'crystal'});
      });

      geysers.push({
        id: geyserId++,
        x: 620,
        y: 490,
        width: 44,
        height: 20,
        cooldown: 0,
      });
      platforms.push({x: 600, y: 550, width: 90, height: 40, type: 'hazard'});

      // 2. High Tier Conduit Terraces (700 to 1400)
      addGround(700, 440, 350);
      addGround(800, 310, 180, 28);
      addGround(1040, 220, 180, 28);
      platforms.push({x: 880, y: 170, width: 44, height: 44, type: 'dynamo'});
      items.push({id: itemId++, x: 890, y: 120, vx: 0, vy: 0, type: 'resonant_core'});

      enemies.push({
        id: enemyId++,
        x: 820,
        y: 390,
        width: 58,
        height: 38,
        type: 'crawler',
        vx: 85,
        vy: 0,
        initialY: 390,
        facingRight: true,
        minX: 740,
        maxX: 1000,
        alive: true,
      });

      enemies.push({
        id: enemyId++,
        x: 1100,
        y: 140,
        width: 72,
        height: 38,
        type: 'sky_ray',
        vx: -95,
        vy: 0,
        initialY: 140,
        facingRight: false,
        alive: true,
      });

      platforms.push({x: 1060, y: 550, width: 140, height: 40, type: 'hazard'});
      geysers.push({
        id: geyserId++,
        x: 1100,
        y: 500,
        width: 44,
        height: 20,
        cooldown: 0,
      });

      // 3. CHECKPOINT 1 AREA: Plateau at x: 1220 to 1750
      addGround(1220, 440, 520);
      platforms.push({x: 1450, y: 376, width: 48, height: 64, type: 'breakable'});
      platforms.push({x: 1450, y: 312, width: 48, height: 64, type: 'breakable'});
      platforms.push({x: 1498, y: 376, width: 48, height: 64, type: 'breakable'});
      [1560, 1600, 1640].forEach((cx) => {
        items.push({id: itemId++, x: cx, y: 390, vx: 0, vy: 0, type: 'crystal'});
      });

      // Secret Bonus Conduit Entrance in Level 1-2 at x = 1620
      platforms.push({x: 1620, y: 382, width: 68, height: 58, type: 'ground'});
      bonusConduits.push({
        id: conduitId++,
        x: 1620,
        y: 382,
        width: 68,
        height: 68,
        returnX: 2540,
        returnY: 382,
      });

      // 4. Layered Thunder Ridge (1780 to 2400)
      platforms.push({x: 1750, y: 550, width: 100, height: 40, type: 'hazard'});
      addGround(1860, 420, 520);
      addGround(1960, 300, 160, 28);
      addGround(2180, 200, 180, 28);

      enemies.push({
        id: enemyId++,
        x: 2050,
        y: 370,
        width: 58,
        height: 38,
        type: 'crawler',
        vx: 90,
        vy: 0,
        initialY: 370,
        facingRight: false,
        minX: 1900,
        maxX: 2200,
        alive: true,
      });

      enemies.push({
        id: enemyId++,
        x: 2240,
        y: 120,
        width: 72,
        height: 38,
        type: 'sky_ray',
        vx: 100,
        vy: 0,
        initialY: 120,
        facingRight: true,
        alive: true,
      });

      geysers.push({
        id: geyserId++,
        x: 2360,
        y: 400,
        width: 44,
        height: 20,
        cooldown: 0,
      });
      items.push({id: itemId++, x: 2220, y: 90, vx: 0, vy: 0, type: 'heart_hp'});

      // 5. CHECKPOINT 2 AREA: Peaceful ledge (2450 to 2850)
      addGround(2450, 440, 400);

      // Secret Bonus Conduit Exit in Level 1-2 at x = 2540 (skips hazard chasm!)
      platforms.push({x: 2540, y: 382, width: 68, height: 58, type: 'ground'});
      bonusConduits.push({
        id: conduitId++,
        x: 2540,
        y: 382,
        width: 68,
        height: 68,
        isExit: true,
      });

      platforms.push({x: 2640, y: 330, width: 44, height: 44, type: 'dynamo'});
      items.push({id: itemId++, x: 2650, y: 280, vx: 0, vy: 0, type: 'storm_needle'});
      [2680, 2730, 2780].forEach((cx) => {
        items.push({id: itemId++, x: cx, y: 390, vx: 0, vy: 0, type: 'crystal'});
      });

      // 6. Canyon Descent & Final Stretch to Beacon (2880 to 3800)
      platforms.push({x: 2860, y: 550, width: 120, height: 40, type: 'hazard'});
      addGround(2990, 440, 420);
      addGround(3120, 320, 160, 28);
      addGround(3420, 440, 380);

      enemies.push({
        id: enemyId++,
        x: 3240,
        y: 354,
        width: 46,
        height: 86,
        type: 'turret',
        vx: 0,
        vy: 0,
        initialY: 354,
        facingRight: false,
        alive: true,
        hp: 3,
        maxHp: 3,
        shootTimer: 2.2,
      });

      [3460, 3510].forEach((cx) => {
        items.push({id: itemId++, x: cx, y: 390, vx: 0, vy: 0, type: 'crystal'});
      });
    } else if (lvl === 3) {
      // =======================================================================
      // NIVEL 1-3: RUINAS DE LA TORMENTA (Etapa de Plataformas Completa)
      // Termina majestuosamente en la PIRÁMIDE ANCESTRAL (structure_storm_pyramid)!
      // Total Width: 3800px. No boss in this stage.
      // =======================================================================
      worldRef.current.levelWidth = 3800;
      worldRef.current.levelHeight = 720;
      worldRef.current.checkpointX = 100;
      worldRef.current.checkpointY = 420;
      worldRef.current.beaconX = 39999; // Landmark pyramid doorway is the goal!
      worldRef.current.beaconY = 340;

      // 1. Ancient Ruins Gauntlet (0 to 1400)
      addGround(0, 480, 650);
      platforms.push({x: 650, y: 560, width: 100, height: 40, type: 'hazard'});
      addGround(750, 460, 580);
      addGround(850, 360, 150, 32);
      addGround(1060, 290, 160, 32);
      platforms.push({x: 930, y: 220, width: 44, height: 44, type: 'dynamo'});
      items.push({id: itemId++, x: 940, y: 170, vx: 0, vy: 0, type: 'storm_needle'});

      enemies.push({
        id: enemyId++,
        x: 980,
        y: 410,
        width: 58,
        height: 38,
        type: 'crawler',
        vx: 85,
        vy: 0,
        initialY: 410,
        facingRight: true,
        minX: 800,
        maxX: 1200,
        alive: true,
      });

      // 2. High Bridge & Sanctuary Terrace (1400 to 2400)
      platforms.push({x: 1340, y: 560, width: 110, height: 40, type: 'hazard'});
      addGround(1450, 460, 680);
      addGround(1600, 270, 340, 32);

      platforms.push({x: 1840, y: 396, width: 48, height: 64, type: 'breakable'});
      platforms.push({x: 1840, y: 332, width: 48, height: 64, type: 'breakable'});
      items.push({id: itemId++, x: 1910, y: 410, vx: 0, vy: 0, type: 'resonant_core'});

      enemies.push({
        id: enemyId++,
        x: 1750,
        y: 180,
        width: 72,
        height: 38,
        type: 'sky_ray',
        vx: -95,
        vy: 0,
        initialY: 180,
        facingRight: false,
        alive: true,
      });

      // 3. Pre-Pyramid Ridge & Gauntlet (2130 to 2950)
      platforms.push({x: 2130, y: 560, width: 120, height: 40, type: 'hazard'});
      addGround(2250, 440, 600);
      addGround(2450, 320, 200, 32);
      platforms.push({x: 2540, y: 190, width: 44, height: 44, type: 'dynamo'});
      items.push({id: itemId++, x: 2550, y: 140, vx: 0, vy: 0, type: 'heart_1up'});

      enemies.push({
        id: enemyId++,
        x: 2700,
        y: 354,
        width: 46,
        height: 86,
        type: 'turret',
        vx: 0,
        vy: 0,
        initialY: 354,
        facingRight: false,
        alive: true,
        hp: 4,
        maxHp: 4,
        shootTimer: 2.0,
      });

      // 4. THE GRAND PYRAMID COURTYARD (2950 to 3800)
      // Solid grand obsidian flagstones leading to the monumental step pyramid
      addGround(2950, 460, 850, 60);

      [3000, 3050, 3100, 3150, 3200].forEach((cx) => {
        items.push({id: itemId++, x: cx, y: 410, vx: 0, vy: 0, type: 'crystal'});
      });

      // Elevated ceremonial braziers flanking the courtyard
      addGround(3080, 350, 80, 24);
      items.push({id: itemId++, x: 3110, y: 300, vx: 0, vy: 0, type: 'resonant_core'});
      items.push({id: itemId++, x: 1600, y: 220, vx: 0, vy: 0, type: 'heart_hp'});
      items.push({id: itemId++, x: 3080, y: 300, vx: 0, vy: 0, type: 'heart_1up'});

      // MONUMENTAL ENIGMATIC ANCIENT PYRAMID (structure_storm_pyramid)
      // Sits on the plateau from x: 3220 to 3700. Ground at y: 460.
      worldRef.current.pyramid = {
        x: 3220,
        y: 120,
        width: 460,
        height: 340,
        doorX: 3415,
        doorY: 370,
        doorW: 70,
        doorH: 90,
      };
    } else if (lvl === 4) {
      // =======================================================================
      // NIVEL 1-B: CÁMARA DE LA PIRÁMIDE • EL SALÓN DEL GUARDIÁN (STAGE JEFE DEDICADO)
      // Pure flat arena. Floor at y = 440, completely safe. Clean obsidian/slate pixel tiles.
      // Single-screen 960x540 arena. Camera fixed at (0, 0).
      // =======================================================================
      worldRef.current.levelWidth = 960;
      worldRef.current.levelHeight = 540;
      worldRef.current.checkpointX = 120;
      worldRef.current.checkpointY = 392;
      worldRef.current.beaconX = 99999;
      worldRef.current.beaconY = 340;
      worldRef.current.cameraX = 0;
      worldRef.current.cameraY = 0;
      worldRef.current.bossArenaActive = true;
      worldRef.current.bossDoorLocked = true;

      // 100% Solid, flat, safe ground across the entire boss room (floor at y = 440)
      addGround(0, 440, 960, 100);

      // Arena boundary walls constructed from obsidian rock tiles
      platforms.push({x: 0, y: 0, width: 32, height: 440, type: 'ground'});
      platforms.push({x: 928, y: 0, width: 32, height: 440, type: 'ground'});

      // Instanciación del Jefe: Spawns in-screen at x = 700, y = 348, facing left, fully visible
      worldRef.current.boss = {
        type: 'CHIMERA',
        name: 'ESCARABAJO QUIMÉRICO TITÁNICO',
        subtitle: 'Primer Comandante Sombrío de Ghotur (Fragmento 1/5)',
        x: 700,
        y: 348,
        width: 120,
        height: 92,
        vx: 0,
        vy: 0,
        hp: 800,
        maxHp: 800,
        phase: 1,
        state: 'IDLE',
        stateTimer: 0.6,
        facingRight: false,
        hurtTimer: 0,
        telegraphGlow: 0,
        wingFlap: 0,
        arenaLeft: 40,
        arenaRight: 920,
        groundY: 348, // 440 - 92 = 348 (rests flush on y = 440 floor)
        displayedHp: 800,
        trackTargetX: 700,
        trackTimer: 0,
        cascadeOrbs: [],
        cascadeTimer: 0,
        chargeDidLeap: false,
        pinballBouncesLeft: 0,
        lightningPillars: [],
        stalactites: [],
        punishedInStun: false,
        lastAttackType: '',
        comboStep: 0,
        comboLength: 2,
        squash: 1,
        stretch: 1,
        walkTimer: 0,
        animTimer: 0,
      };
    } else if (lvl === 5) {
      // =======================================================================
      // NIVEL 2-1: ENTRADA A LAS CAVERNAS (Las Cavernas de Cristal Resonante)
      // Biome: Subterranean amethyst cavern with cyan mineral veins (bg_crystal_caverns).
      // Extended layout (~4200px), introduces Volt Bats and Crystal Golems!
      // Includes Secret Conduit Pipe (Bonus Vault) at x: 1850!
      // =======================================================================
      worldRef.current.levelWidth = 4200;
      worldRef.current.levelHeight = 720;
      worldRef.current.checkpointX = 100;
      worldRef.current.checkpointY = 432;
      worldRef.current.beaconX = 4050;
      worldRef.current.beaconY = 360;

      // 1. Cavern Entrance Plateau (0 to 750)
      addGround(0, 480, 750);
      platforms.push({x: 360, y: 340, width: 44, height: 44, type: 'dynamo'});
      platforms.push({x: 430, y: 340, width: 44, height: 44, type: 'dynamo'});

      [180, 220, 260, 300, 520, 580].forEach((cx) => {
        items.push({id: itemId++, x: cx, y: 430, vx: 0, vy: 0, type: 'crystal'});
      });

      items.push({
        id: itemId++,
        x: 372,
        y: 290,
        vx: 0,
        vy: 0,
        type: 'storm_needle',
      });

      // Introduce Murciélago Voltaico Cristalino (Volt Bat)
      enemies.push({
        id: enemyId++,
        x: 560,
        y: 180,
        width: 64,
        height: 48,
        type: 'volt_bat',
        vx: -90,
        vy: 0,
        initialY: 180,
        facingRight: false,
        alive: true,
        hp: 40,
        maxHp: 40,
      });

      items.push({id: itemId++, x: 920, y: 320, vx: 0, vy: 0, type: 'heart_hp'});
      items.push({id: itemId++, x: 2700, y: 180, vx: 0, vy: 0, type: 'heart_1up'});

      // 2. Stepped Crystal Terraces & First Crystal Golem (750 to 1400)
      addGround(750, 480, 260);
      addGround(900, 380, 180, 32);
      addGround(1120, 300, 190, 32);
      addGround(1180, 480, 340);

      [820, 860, 940, 980, 1160, 1200].forEach((cx) => {
        items.push({id: itemId++, x: cx, y: 430, vx: 0, vy: 0, type: 'crystal'});
      });

      // First Gólem de Cristal Acorazado (120 HP, heavy ground shockwave)
      enemies.push({
        id: enemyId++,
        x: 1280,
        y: 400,
        width: 72,
        height: 80,
        type: 'golem',
        vx: -45,
        vy: 0,
        initialY: 400,
        facingRight: false,
        minX: 1200,
        maxX: 1480,
        alive: true,
        hp: 120,
        maxHp: 120,
        poundTimer: 2.8,
      });

      // 3. CHECKPOINT 1 AREA & SECRET BONUS CONDUIT (1400 to 2200)
      addGround(1480, 460, 680);
      platforms.push({x: 1650, y: 320, width: 44, height: 44, type: 'dynamo'});
      items.push({id: itemId++, x: 1660, y: 270, vx: 0, vy: 0, type: 'resonant_core'});

      // Secret Conduit Pipe Entrance at x = 1850!
      platforms.push({x: 1850, y: 402, width: 68, height: 58, type: 'ground'});
      bonusConduits.push({
        id: conduitId++,
        x: 1850,
        y: 402,
        width: 68,
        height: 68,
        returnX: 2600,
        returnY: 402,
      });

      platforms.push({x: 1980, y: 396, width: 48, height: 64, type: 'breakable'});
      platforms.push({x: 1980, y: 332, width: 48, height: 64, type: 'breakable'});
      items.push({id: itemId++, x: 2060, y: 410, vx: 0, vy: 0, type: 'crystal'});

      enemies.push({
        id: enemyId++,
        x: 1720,
        y: 170,
        width: 64,
        height: 48,
        type: 'volt_bat',
        vx: 95,
        vy: 0,
        initialY: 170,
        facingRight: true,
        alive: true,
        hp: 40,
        maxHp: 40,
      });

      // 4. Crystal Cavern Chasm & Geysers (2200 to 3100)
      platforms.push({x: 2160, y: 560, width: 120, height: 40, type: 'hazard'});
      addGround(2280, 460, 480);
      addGround(2460, 340, 180, 32);
      addGround(2700, 240, 180, 32);

      // Secret Conduit Exit Pipe at advanced landmark in Level 2-1 (x: 2600, past the hazard chasm!)
      platforms.push({x: 2600, y: 402, width: 68, height: 58, type: 'ground'});
      bonusConduits.push({
        id: conduitId++,
        x: 2600,
        y: 402,
        width: 68,
        height: 68,
        isExit: true,
      });

      geysers.push({
        id: geyserId++,
        x: 2320,
        y: 470,
        width: 44,
        height: 20,
        cooldown: 0,
      });

      enemies.push({
        id: enemyId++,
        x: 2540,
        y: 380,
        width: 72,
        height: 80,
        type: 'golem',
        vx: 45,
        vy: 0,
        initialY: 380,
        facingRight: true,
        minX: 2420,
        maxX: 2720,
        alive: true,
        hp: 120,
        maxHp: 120,
        poundTimer: 2.5,
      });

      enemies.push({
        id: enemyId++,
        x: 2880,
        y: 150,
        width: 64,
        height: 48,
        type: 'volt_bat',
        vx: -105,
        vy: 0,
        initialY: 150,
        facingRight: false,
        alive: true,
        hp: 40,
        maxHp: 40,
      });

      // 5. CHECKPOINT 2 AREA (3100 to 4200)
      platforms.push({x: 3040, y: 560, width: 120, height: 40, type: 'hazard'});
      addGround(3160, 460, 420);
      addGround(3300, 320, 160, 28);
      platforms.push({x: 3360, y: 190, width: 44, height: 44, type: 'dynamo'});
      items.push({id: itemId++, x: 3370, y: 140, vx: 0, vy: 0, type: 'heart_hp'});

      addGround(3620, 460, 580);

      enemies.push({
        id: enemyId++,
        x: 3740,
        y: 354,
        width: 46,
        height: 86,
        type: 'turret',
        vx: 0,
        vy: 0,
        initialY: 354,
        facingRight: false,
        alive: true,
        hp: 4,
        maxHp: 4,
        shootTimer: 2.2,
      });

      enemies.push({
        id: enemyId++,
        x: 3900,
        y: 380,
        width: 72,
        height: 80,
        type: 'golem',
        vx: -40,
        vy: 0,
        initialY: 380,
        facingRight: false,
        minX: 3820,
        maxX: 4000,
        alive: true,
        hp: 120,
        maxHp: 120,
        poundTimer: 3.0,
      });

      [3680, 3720, 3960, 4000].forEach((cx) => {
        items.push({id: itemId++, x: cx, y: 410, vx: 0, vy: 0, type: 'crystal'});
      });
    } else if (lvl === 6) {
      // =======================================================================
      // NIVEL 2-2: EL ABISMO RESONANTE
      // Precision platforming: moving platforms over deep chasms, vertical descents,
      // and secret conduit pipe at x: 2200! Length: ~4800px.
      // =======================================================================
      worldRef.current.levelWidth = 4800;
      worldRef.current.levelHeight = 750;
      worldRef.current.checkpointX = 100;
      worldRef.current.checkpointY = 432;
      worldRef.current.beaconX = 4650;
      worldRef.current.beaconY = 360;

      // 1. Starting Terrace (0 to 650)
      addGround(0, 480, 650);
      platforms.push({x: 340, y: 340, width: 44, height: 44, type: 'dynamo'});
      items.push({id: itemId++, x: 350, y: 290, vx: 0, vy: 0, type: 'storm_needle'});
      items.push({id: itemId++, x: 1040, y: 210, vx: 0, vy: 0, type: 'heart_hp'});
      items.push({id: itemId++, x: 3260, y: 280, vx: 0, vy: 0, type: 'heart_1up'});
      [180, 240, 420, 480].forEach((cx) => {
        items.push({id: itemId++, x: cx, y: 430, vx: 0, vy: 0, type: 'crystal'});
      });

      // 2. The First Deep Resonant Chasm with MOVING PLATFORMS (650 to 1500)
      platforms.push({x: 650, y: 580, width: 750, height: 40, type: 'hazard'});

      // Moving platform 1: Horizontal oscillation
      platforms.push({
        x: 720,
        y: 440,
        width: 120,
        height: 32,
        type: 'ground',
        moving: true,
        moveAxis: 'x',
        moveMin: 680,
        moveMax: 940,
        moveSpeed: 80,
        moveDir: 1,
      });

      // Moving platform 2: Vertical elevator oscillation
      platforms.push({
        x: 1040,
        y: 380,
        width: 110,
        height: 32,
        type: 'ground',
        moving: true,
        moveAxis: 'y',
        moveMin: 260,
        moveMax: 440,
        moveSpeed: 70,
        moveDir: 1,
      });

      // Aerial Volt Bat circling the chasm
      enemies.push({
        id: enemyId++,
        x: 950,
        y: 200,
        width: 64,
        height: 48,
        type: 'volt_bat',
        vx: 90,
        vy: 0,
        initialY: 200,
        facingRight: true,
        alive: true,
        hp: 40,
        maxHp: 40,
      });

      [780, 840, 1080, 1140].forEach((cx) => {
        items.push({id: itemId++, x: cx, y: 300, vx: 0, vy: 0, type: 'crystal'});
      });

      // 3. CHECKPOINT 1 AREA & SECRET CONDUIT PIPE (1400 to 2400)
      addGround(1400, 460, 680);
      platforms.push({x: 1600, y: 330, width: 44, height: 44, type: 'dynamo'});
      items.push({id: itemId++, x: 1610, y: 280, vx: 0, vy: 0, type: 'resonant_core'});

      enemies.push({
        id: enemyId++,
        x: 1750,
        y: 380,
        width: 72,
        height: 80,
        type: 'golem',
        vx: 45,
        vy: 0,
        initialY: 380,
        facingRight: true,
        minX: 1650,
        maxX: 1950,
        alive: true,
        hp: 120,
        maxHp: 120,
        poundTimer: 2.6,
      });

      // Secret Conduit Pipe at x = 1800 (Sala de Bonus)
      platforms.push({x: 1800, y: 402, width: 68, height: 58, type: 'ground'});
      bonusConduits.push({
        id: conduitId++,
        x: 1800,
        y: 402,
        width: 68,
        height: 68,
        returnX: 3100,
        returnY: 402,
      });

      // 4. The Great Resonant Chasm: Synchronized Moving Platforms (2200 to 3400)
      platforms.push({x: 2200, y: 580, width: 800, height: 40, type: 'hazard'});

      platforms.push({
        x: 2280,
        y: 420,
        width: 110,
        height: 32,
        type: 'ground',
        moving: true,
        moveAxis: 'x',
        moveMin: 2240,
        moveMax: 2480,
        moveSpeed: 85,
        moveDir: 1,
      });

      platforms.push({
        x: 2560,
        y: 340,
        width: 100,
        height: 32,
        type: 'ground',
        moving: true,
        moveAxis: 'y',
        moveMin: 220,
        moveMax: 420,
        moveSpeed: 75,
        moveDir: -1,
      });

      platforms.push({
        x: 2780,
        y: 420,
        width: 110,
        height: 32,
        type: 'ground',
        moving: true,
        moveAxis: 'x',
        moveMin: 2740,
        moveMax: 2980,
        moveSpeed: 90,
        moveDir: -1,
      });

      geysers.push({
        id: geyserId++,
        x: 2600,
        y: 480,
        width: 44,
        height: 20,
        cooldown: 0,
      });

      enemies.push({
        id: enemyId++,
        x: 2450,
        y: 180,
        width: 64,
        height: 48,
        type: 'volt_bat',
        vx: -95,
        vy: 0,
        initialY: 180,
        facingRight: false,
        alive: true,
        hp: 40,
        maxHp: 40,
      });

      // 5. CHECKPOINT 2 & Final Approach (3400 to 4800)
      addGround(3050, 460, 550);

      // Secret Conduit Exit Pipe at advanced landmark in Level 2-2 (x: 3100, safe past the chasm!)
      platforms.push({x: 3100, y: 402, width: 68, height: 58, type: 'ground'});
      bonusConduits.push({
        id: conduitId++,
        x: 3100,
        y: 402,
        width: 68,
        height: 68,
        isExit: true,
      });

      platforms.push({x: 3200, y: 396, width: 48, height: 64, type: 'breakable'});
      platforms.push({x: 3200, y: 332, width: 48, height: 64, type: 'breakable'});
      items.push({id: itemId++, x: 3260, y: 410, vx: 0, vy: 0, type: 'heart_hp'});

      enemies.push({
        id: enemyId++,
        x: 3350,
        y: 380,
        width: 72,
        height: 80,
        type: 'golem',
        vx: -40,
        vy: 0,
        initialY: 380,
        facingRight: false,
        minX: 3250,
        maxX: 3500,
        alive: true,
        hp: 120,
        maxHp: 120,
        poundTimer: 2.8,
      });

      platforms.push({x: 3600, y: 580, width: 200, height: 40, type: 'hazard'});
      addGround(3800, 460, 1000);

      enemies.push({
        id: enemyId++,
        x: 4100,
        y: 354,
        width: 46,
        height: 86,
        type: 'turret',
        vx: 0,
        vy: 0,
        initialY: 354,
        facingRight: false,
        alive: true,
        hp: 4,
        maxHp: 4,
        shootTimer: 2.0,
      });

      enemies.push({
        id: enemyId++,
        x: 4350,
        y: 380,
        width: 72,
        height: 80,
        type: 'golem',
        vx: 45,
        vy: 0,
        initialY: 380,
        facingRight: true,
        minX: 4250,
        maxX: 4550,
        alive: true,
        hp: 120,
        maxHp: 120,
        poundTimer: 2.4,
      });

      [4450, 4500, 4550, 4600].forEach((cx) => {
        items.push({id: itemId++, x: cx, y: 410, vx: 0, vy: 0, type: 'crystal'});
      });
    } else if (lvl === 7) {
      // =======================================================================
      // NIVEL 2-3: LA CIUDADELA SUBTERRÁNEA & LA AGUJA DE CRISTAL
      // Advanced gauntlet (~5200px) combining aerial bats, heavy golems, pulse turrets,
      // and breakable crystal barricades leading to the Grand Warp Portal!
      // =======================================================================
      worldRef.current.levelWidth = 5200;
      worldRef.current.levelHeight = 760;
      worldRef.current.checkpointX = 100;
      worldRef.current.checkpointY = 432;
      worldRef.current.beaconX = 5020;
      worldRef.current.beaconY = 350;

      // 1. Citadel Gates (0 to 900)
      addGround(0, 480, 750);
      platforms.push({x: 350, y: 340, width: 44, height: 44, type: 'dynamo'});
      items.push({id: itemId++, x: 360, y: 290, vx: 0, vy: 0, type: 'storm_needle'});
      items.push({id: itemId++, x: 1250, y: 160, vx: 0, vy: 0, type: 'heart_hp'});
      items.push({id: itemId++, x: 3300, y: 260, vx: 0, vy: 0, type: 'heart_1up'});

      enemies.push({
        id: enemyId++,
        x: 520,
        y: 170,
        width: 64,
        height: 48,
        type: 'volt_bat',
        vx: -95,
        vy: 0,
        initialY: 170,
        facingRight: false,
        alive: true,
        hp: 40,
        maxHp: 40,
      });

      enemies.push({
        id: enemyId++,
        x: 650,
        y: 400,
        width: 72,
        height: 80,
        type: 'golem',
        vx: 45,
        vy: 0,
        initialY: 400,
        facingRight: true,
        minX: 580,
        maxX: 720,
        alive: true,
        hp: 120,
        maxHp: 120,
        poundTimer: 2.7,
      });

      // 2. Floating Crystal Pillars & Chasms (900 to 1800)
      platforms.push({x: 750, y: 580, width: 200, height: 40, type: 'hazard'});
      addGround(950, 460, 450);
      addGround(1050, 320, 180, 32);
      addGround(1250, 220, 180, 32);
      platforms.push({x: 1100, y: 160, width: 44, height: 44, type: 'dynamo'});
      items.push({id: itemId++, x: 1110, y: 110, vx: 0, vy: 0, type: 'resonant_core'});

      enemies.push({
        id: enemyId++,
        x: 1300,
        y: 130,
        width: 72,
        height: 38,
        type: 'sky_ray',
        vx: -90,
        vy: 0,
        initialY: 130,
        facingRight: false,
        alive: true,
      });

      // 3. CHECKPOINT 1 AREA (1600 to 2600)
      addGround(1550, 460, 750);
      platforms.push({x: 1800, y: 396, width: 48, height: 64, type: 'breakable'});
      platforms.push({x: 1800, y: 332, width: 48, height: 64, type: 'breakable'});
      items.push({id: itemId++, x: 1880, y: 410, vx: 0, vy: 0, type: 'crystal'});

      enemies.push({
        id: enemyId++,
        x: 1950,
        y: 380,
        width: 72,
        height: 80,
        type: 'golem',
        vx: 45,
        vy: 0,
        initialY: 380,
        facingRight: true,
        minX: 1880,
        maxX: 2150,
        alive: true,
        hp: 120,
        maxHp: 120,
        poundTimer: 2.5,
      });

      enemies.push({
        id: enemyId++,
        x: 2100,
        y: 180,
        width: 64,
        height: 48,
        type: 'volt_bat',
        vx: 100,
        vy: 0,
        initialY: 180,
        facingRight: true,
        alive: true,
        hp: 40,
        maxHp: 40,
      });

      // 4. Moving Spire Bridges (2400 to 3500)
      platforms.push({x: 2300, y: 580, width: 650, height: 40, type: 'hazard'});

      platforms.push({
        x: 2400,
        y: 420,
        width: 120,
        height: 32,
        type: 'ground',
        moving: true,
        moveAxis: 'x',
        moveMin: 2350,
        moveMax: 2600,
        moveSpeed: 80,
        moveDir: 1,
      });

      platforms.push({
        x: 2700,
        y: 350,
        width: 110,
        height: 32,
        type: 'ground',
        moving: true,
        moveAxis: 'y',
        moveMin: 240,
        moveMax: 430,
        moveSpeed: 70,
        moveDir: -1,
      });

      geysers.push({
        id: geyserId++,
        x: 2850,
        y: 480,
        width: 44,
        height: 20,
        cooldown: 0,
      });

      // 5. CHECKPOINT 2 AREA (3300 to 4400)
      addGround(3100, 460, 650);
      platforms.push({x: 3300, y: 330, width: 44, height: 44, type: 'dynamo'});
      items.push({id: itemId++, x: 3310, y: 280, vx: 0, vy: 0, type: 'heart_1up'});

      enemies.push({
        id: enemyId++,
        x: 3450,
        y: 354,
        width: 46,
        height: 86,
        type: 'turret',
        vx: 0,
        vy: 0,
        initialY: 354,
        facingRight: false,
        alive: true,
        hp: 5,
        maxHp: 5,
        shootTimer: 1.8,
      });

      enemies.push({
        id: enemyId++,
        x: 3600,
        y: 380,
        width: 72,
        height: 80,
        type: 'golem',
        vx: -45,
        vy: 0,
        initialY: 380,
        facingRight: false,
        minX: 3500,
        maxX: 3700,
        alive: true,
        hp: 120,
        maxHp: 120,
        poundTimer: 2.3,
      });

      // 6. The Crystal Needle Summit & Grand Portal Sanctuary (4200 to 5200)
      platforms.push({x: 3850, y: 580, width: 250, height: 40, type: 'hazard'});
      // Precision narrow crystal stepping block bridging the 400px bottom floor chasm (midpoint x: 3950)
      addGround(3926, 460, 48);
      items.push({id: itemId++, x: 3940, y: 410, vx: 0, vy: 0, type: 'crystal'});
      addGround(4150, 460, 1050);

      enemies.push({
        id: enemyId++,
        x: 4300,
        y: 170,
        width: 64,
        height: 48,
        type: 'volt_bat',
        vx: -110,
        vy: 0,
        initialY: 170,
        facingRight: false,
        alive: true,
        hp: 40,
        maxHp: 40,
      });

      enemies.push({
        id: enemyId++,
        x: 4500,
        y: 380,
        width: 72,
        height: 80,
        type: 'golem',
        vx: 45,
        vy: 0,
        initialY: 380,
        facingRight: true,
        minX: 4400,
        maxX: 4680,
        alive: true,
        hp: 120,
        maxHp: 120,
        poundTimer: 2.2,
      });

      enemies.push({
        id: enemyId++,
        x: 4750,
        y: 354,
        width: 46,
        height: 86,
        type: 'turret',
        vx: 0,
        vy: 0,
        initialY: 354,
        facingRight: false,
        alive: true,
        hp: 4,
        maxHp: 4,
        shootTimer: 2.0,
      });

      [4800, 4850, 4900, 4950].forEach((cx) => {
        items.push({id: itemId++, x: cx, y: 410, vx: 0, vy: 0, type: 'crystal'});
      });

      // CUEVA ANCESTRAL HACIA LA GUARIDA DEL DRAGÓN (structure_dragon_cave_gate)
      worldRef.current.beaconX = 99999;
      worldRef.current.dragonGate = {
        x: 4700,
        y: 165,
        width: 420,
        height: 295,
        doorX: 4860,
        doorY: 340,
        doorW: 90,
        doorH: 120,
      };
    } else if (lvl === 8) {
      // =======================================================================
      // NIVEL 2-B: LA GUARIDA DEL DRAGÓN (STAGE JEFE DEDICADO DE ZONA 2)
      // Caverna volcánica subterránea colosal (bg_dragon_boss_lair).
      // Arena simétrica 960x540. Suelo de roca obsidiana limpia a y = 440 (100% seguro).
      // Muros perimetrales de roca a los lados. Cámara fija en (0, 0).
      // =======================================================================
      worldRef.current.levelWidth = 960;
      worldRef.current.levelHeight = 540;
      worldRef.current.checkpointX = 120;
      worldRef.current.checkpointY = 392;
      worldRef.current.beaconX = 99999;
      worldRef.current.beaconY = 340;
      worldRef.current.cameraX = 0;
      worldRef.current.cameraY = 0;
      worldRef.current.bossArenaActive = true;
      worldRef.current.bossDoorLocked = true;

      // Suelo 100% sólido y seguro en toda la arena (a y = 440)
      addGround(0, 440, 960, 100);

      // Muros perimetrales de basalto/obsidiana
      platforms.push({x: 0, y: 0, width: 32, height: 440, type: 'ground'});
      platforms.push({x: 928, y: 0, width: 32, height: 440, type: 'ground'});

      // Plataformas elevadas simétricas para esquivar la llamarada barredora
      platforms.push({x: 90, y: 310, width: 120, height: 26, type: 'ground'});
      platforms.push({x: 750, y: 310, width: 120, height: 26, type: 'ground'});

      // Instanciación del Jefe: Ignisvorm - Dragón Volcánico Colosal
      worldRef.current.boss = {
        type: 'DRAGON',
        name: 'IGNISVORM - COLOSAL DRAGÓN UMBRÍO DE OBSIDIANA',
        subtitle: 'Segundo Comandante Sombrío de Ghotur (Fragmento 2/5)',
        x: 670,
        y: 290,
        width: 190,
        height: 150,
        vx: 0,
        vy: 0,
        hp: 1200,
        maxHp: 1200,
        phase: 1,
        state: 'IDLE',
        stateTimer: 0.8,
        facingRight: false,
        hurtTimer: 0,
        telegraphGlow: 0,
        wingFlap: 0,
        arenaLeft: 36,
        arenaRight: 924,
        groundY: 290,
        displayedHp: 1200,
        trackTargetX: 670,
        trackTimer: 0,
        cascadeOrbs: [],
        cascadeTimer: 0,
        chargeDidLeap: false,
        pinballBouncesLeft: 0,
        lightningPillars: [],
        stalactites: [],
        punishedInStun: false,
        lastAttackType: '',
        comboStep: 0,
        comboLength: 2,
        breathTimer: 0,
        breathAngle: 0,
        squash: 1,
        stretch: 1,
        walkTimer: 0,
        animTimer: 0,
        animTime: 0,
      };
    } else if (lvl === 9) {
      // =======================================================================
      // NIVEL 3-1: LA FORTALEZA DE LA ESTRATOSFERA (~5400px)
      // Background: bg_zone3_stratosphere (islas de basalto flotantes, nubes de tormenta)
      // Focus: Plataformeo vertical, islas flotantes, caídas mortales (y > 560 = muerte),
      // y trampas aplastantes tipo Thwomp (trap_crushing_pillar) en arcos de entrada estrechos!
      // =======================================================================
      worldRef.current.levelWidth = 5400;
      worldRef.current.levelHeight = 720;
      worldRef.current.checkpointX = 100;
      worldRef.current.checkpointY = 412;
      worldRef.current.beaconX = 5220;
      worldRef.current.beaconY = 340;

      // 1. Bastión de entrada en la estratosfera (0 a 650)
      addGround(0, 460, 650);
      platforms.push({x: 320, y: 320, width: 44, height: 44, type: 'dynamo'});
      items.push({id: itemId++, x: 330, y: 270, vx: 0, vy: 0, type: 'storm_needle'});
      items.push({id: itemId++, x: 1420, y: 200, vx: 0, vy: 0, type: 'heart_hp'});
      items.push({id: itemId++, x: 3800, y: 220, vx: 0, vy: 0, type: 'heart_1up'});
      [180, 240, 420, 480].forEach((cx) => {
        items.push({id: itemId++, x: cx, y: 410, vx: 0, vy: 0, type: 'crystal'});
      });

      // Primer abismo mortal hacia islas flotantes (650 a 1050)
      // Isla flotante 1
      addGround(750, 420, 160, 32);
      items.push({id: itemId++, x: 820, y: 370, vx: 0, vy: 0, type: 'crystal'});

      // Arco de Entrada Estrecho con el Primer Bloque Aplastante (x = 1080)
      // Plataforma bajo la trampa (y = 440) y techo del arco (y = 160)
      addGround(1000, 440, 280, 40);
      platforms.push({x: 1040, y: 140, width: 180, height: 28, type: 'ground'}); // Techo del arco
      crushingPillars.push({
        id: pillarId++,
        x: 1100,
        y: 168,
        startY: 168,
        floorY: 364,
        width: 64,
        height: 76,
        state: 'IDLE',
        timer: 1.2,
        slamSpeed: 750,
        riseSpeed: 85,
        idleDuration: 1.2,
        waitDuration: 0.8,
        proximityTrigger: 180,
      });

      enemies.push({
        id: enemyId++,
        x: 920,
        y: 190,
        width: 72,
        height: 38,
        type: 'sky_ray',
        vx: -90,
        vy: 0,
        initialY: 190,
        facingRight: false,
        alive: true,
      });

      // 2. Islas de Basalto Escalonadas & Géiser de Impulso Aéreo (1350 a 2000)
      addGround(1350, 400, 180, 32);
      platforms.push({x: 1420, y: 260, width: 44, height: 44, type: 'dynamo'});
      items.push({id: itemId++, x: 1430, y: 210, vx: 0, vy: 0, type: 'resonant_core'});

      // Plataforma flotante móvil horizontal sobre el abismo (1580 a 1800)
      platforms.push({
        x: 1600,
        y: 380,
        width: 120,
        height: 28,
        type: 'ground',
        moving: true,
        moveAxis: 'x',
        moveMin: 1560,
        moveMax: 1820,
        moveSpeed: 80,
        moveDir: 1,
      });

      // CHECKPOINT 1: Bastión Intermedio de la Fortaleza (x = 1900 a 2400)
      addGround(1900, 440, 520);
      enemies.push({
        id: enemyId++,
        x: 2060,
        y: 390,
        width: 58,
        height: 38,
        type: 'crawler',
        vx: 80,
        vy: 0,
        initialY: 390,
        facingRight: true,
        minX: 1950,
        maxX: 2200,
        alive: true,
      });

      // Segundo Bloque Aplastante en el Pórtico Central (x = 2300)
      platforms.push({x: 2240, y: 140, width: 160, height: 28, type: 'ground'}); // Techo del arco
      crushingPillars.push({
        id: pillarId++,
        x: 2280,
        y: 168,
        startY: 168,
        floorY: 364,
        width: 64,
        height: 76,
        state: 'IDLE',
        timer: 1.0,
        slamSpeed: 800,
        riseSpeed: 90,
        idleDuration: 1.1,
        waitDuration: 0.8,
        proximityTrigger: 170,
      });

      // 3. Ascenso Precario entre Agujas Flotantes (2500 a 3500)
      // Saltos escalonados sobre el abismo (y > 560 = muerte)
      addGround(2520, 420, 140, 32);
      addGround(2740, 340, 140, 32);
      addGround(2960, 260, 140, 32);

      enemies.push({
        id: enemyId++,
        x: 2850,
        y: 150,
        width: 64,
        height: 48,
        type: 'volt_bat',
        vx: -95,
        vy: 0,
        initialY: 150,
        facingRight: false,
        alive: true,
        hp: 40,
        maxHp: 40,
      });

      // Géiser de super impulso sobre el abismo (x = 3160)
      addGround(3140, 460, 80, 28);
      geysers.push({
        id: geyserId++,
        x: 3160,
        y: 450,
        width: 44,
        height: 20,
        cooldown: 0,
      });

      // Tercer Bloque Aplastante Rítmico en la cornisa superior (x = 3300)
      addGround(3280, 320, 220, 32);
      platforms.push({x: 3300, y: 120, width: 180, height: 28, type: 'ground'});
      crushingPillars.push({
        id: pillarId++,
        x: 3350,
        y: 148,
        startY: 148,
        floorY: 244,
        width: 64,
        height: 76,
        state: 'IDLE',
        timer: 1.4,
        slamSpeed: 850,
        riseSpeed: 80,
        idleDuration: 1.3,
        waitDuration: 0.8,
      });

      // CHECKPOINT 2: Terraza del Observatorio Celeste (x = 3600 a 4200)
      addGround(3600, 420, 600);
      platforms.push({x: 3800, y: 280, width: 44, height: 44, type: 'dynamo'});
      items.push({id: itemId++, x: 3810, y: 230, vx: 0, vy: 0, type: 'heart_hp'});

      enemies.push({
        id: enemyId++,
        x: 3950,
        y: 314,
        width: 46,
        height: 86,
        type: 'turret',
        vx: 0,
        vy: 0,
        initialY: 314,
        facingRight: false,
        alive: true,
        hp: 4,
        maxHp: 4,
        shootTimer: 2.0,
      });

      // 4. Doble Desafío de Bloques Aplastantes antes del Portal (4300 a 5400)
      addGround(4280, 440, 480);
      platforms.push({x: 4360, y: 150, width: 340, height: 28, type: 'ground'}); // Techo continuo de arquería
      // Bloque Aplastante 4
      crushingPillars.push({
        id: pillarId++,
        x: 4420,
        y: 178,
        startY: 178,
        floorY: 364,
        width: 64,
        height: 76,
        state: 'IDLE',
        timer: 0.6,
        slamSpeed: 800,
        riseSpeed: 90,
        idleDuration: 1.2,
        waitDuration: 0.8,
      });
      // Bloque Aplastante 5 (Rítmicamente desfasado)
      crushingPillars.push({
        id: pillarId++,
        x: 4580,
        y: 178,
        startY: 178,
        floorY: 364,
        width: 64,
        height: 76,
        state: 'IDLE',
        timer: 1.5,
        slamSpeed: 800,
        riseSpeed: 90,
        idleDuration: 1.2,
        waitDuration: 0.8,
      });

      // Plataforma móvil final sobre el abismo hacia el portal
      platforms.push({
        x: 4860,
        y: 420,
        width: 120,
        height: 28,
        type: 'ground',
        moving: true,
        moveAxis: 'x',
        moveMin: 4820,
        moveMax: 5040,
        moveSpeed: 85,
        moveDir: 1,
      });

      // Bastión de llegada y portal dimensional (5120 a 5400)
      addGround(5120, 440, 280);
      [5160, 5200, 5280].forEach((cx) => {
        items.push({id: itemId++, x: cx, y: 390, vx: 0, vy: 0, type: 'crystal'});
      });
    } else if (lvl === 10) {
      // =======================================================================
      // NIVEL 3-2: LA AGUJA DEL TRUENO (~5800px)
      // Background: bg_zone3_spire_shaft (interior de torre vertical, engranajes colosales)
      // Focus: Ascenso vertical, plataformas móviles mecánicas, pozos de vacío (y > 560 = pit death),
      // y gauntlets de pilares aplastantes sincronizados entre conductos de alta tensión!
      // =======================================================================
      worldRef.current.levelWidth = 5800;
      worldRef.current.levelHeight = 720;
      worldRef.current.checkpointX = 100;
      worldRef.current.checkpointY = 412;
      worldRef.current.beaconX = 5620;
      worldRef.current.beaconY = 330;

      // 1. Base del eje de la torre (0 a 600)
      addGround(0, 460, 600);
      platforms.push({x: 300, y: 320, width: 44, height: 44, type: 'dynamo'});
      items.push({id: itemId++, x: 310, y: 270, vx: 0, vy: 0, type: 'storm_needle'});
      items.push({id: itemId++, x: 1820, y: 130, vx: 0, vy: 0, type: 'heart_hp'});
      items.push({id: itemId++, x: 2940, y: 100, vx: 0, vy: 0, type: 'heart_1up'});
      [180, 240, 400, 460].forEach((cx) => {
        items.push({id: itemId++, x: cx, y: 410, vx: 0, vy: 0, type: 'crystal'});
      });

      // Ascensor Mecánico Vertical 1 sobre el abismo (650 a 850)
      platforms.push({
        x: 680,
        y: 380,
        width: 110,
        height: 28,
        type: 'ground',
        moving: true,
        moveAxis: 'y',
        moveMin: 220,
        moveMax: 440,
        moveSpeed: 75,
        moveDir: -1,
      });

      // Eje de la torre: Plataforma alta (860 a 1100)
      addGround(860, 260, 240, 32);
      items.push({id: itemId++, x: 920, y: 210, vx: 0, vy: 0, type: 'resonant_core'});

      // Bloque Aplastante 1 en el túnel de engranajes (x = 1180)
      addGround(1140, 420, 240, 32);
      platforms.push({x: 1160, y: 130, width: 160, height: 28, type: 'ground'});
      crushingPillars.push({
        id: pillarId++,
        x: 1210,
        y: 158,
        startY: 158,
        floorY: 344,
        width: 64,
        height: 76,
        state: 'IDLE',
        timer: 1.1,
        slamSpeed: 820,
        riseSpeed: 90,
        idleDuration: 1.2,
        waitDuration: 0.8,
        proximityTrigger: 175,
      });

      enemies.push({
        id: enemyId++,
        x: 1300,
        y: 180,
        width: 48,
        height: 36,
        type: 'volt_bat',
        vx: 100,
        vy: 0,
        initialY: 180,
        facingRight: true,
        alive: true,
        hp: 40,
        maxHp: 40,
      });

      // 2. Sección de Ascenso por Plataformas Escalonadas y Géiser (1450 a 2000)
      addGround(1440, 440, 140, 32);
      geysers.push({
        id: geyserId++,
        x: 1490,
        y: 430,
        width: 44,
        height: 20,
        cooldown: 0,
      });

      // Plataformas flotantes en alturas escalonadas: y = 280, y = 180
      addGround(1620, 280, 130, 28);
      addGround(1820, 180, 140, 28);
      items.push({id: itemId++, x: 1880, y: 130, vx: 0, vy: 0, type: 'heart_1up'});

      // CHECKPOINT 1: Sala de Engranajes Intermedia (x = 1950 a 2500)
      addGround(1950, 440, 550);
      enemies.push({
        id: enemyId++,
        x: 2150,
        y: 400,
        width: 44,
        height: 28,
        type: 'crawler',
        vx: 85,
        vy: 0,
        initialY: 400,
        facingRight: true,
        minX: 2000,
        maxX: 2280,
        alive: true,
      });

      // Gauntlet Sincronizado de Bloques Aplastantes (x = 2320 y x = 2460)
      platforms.push({x: 2280, y: 150, width: 280, height: 28, type: 'ground'});
      crushingPillars.push({
        id: pillarId++,
        x: 2330,
        y: 178,
        startY: 178,
        floorY: 364,
        width: 64,
        height: 76,
        state: 'IDLE',
        timer: 0.5,
        slamSpeed: 850,
        riseSpeed: 95,
        idleDuration: 1.1,
        waitDuration: 0.8,
      });
      crushingPillars.push({
        id: pillarId++,
        x: 2470,
        y: 178,
        startY: 178,
        floorY: 364,
        width: 64,
        height: 76,
        state: 'IDLE',
        timer: 1.3,
        slamSpeed: 850,
        riseSpeed: 95,
        idleDuration: 1.1,
        waitDuration: 0.8,
      });

      // 3. El Eje Abisal: Doble Ascensor Móvil Sincronizado (2600 a 3700)
      // Ascensor Vertical 2
      platforms.push({
        x: 2680,
        y: 400,
        width: 110,
        height: 28,
        type: 'ground',
        moving: true,
        moveAxis: 'y',
        moveMin: 200,
        moveMax: 440,
        moveSpeed: 85,
        moveDir: 1,
      });

      // Cornisa suspendida central (2900)
      addGround(2880, 260, 160, 28);
      platforms.push({x: 2940, y: 160, width: 44, height: 44, type: 'dynamo'});
      items.push({id: itemId++, x: 2950, y: 110, vx: 0, vy: 0, type: 'storm_needle'});

      // Ascensor Horizontal 3 cruzando el abismo
      platforms.push({
        x: 3150,
        y: 300,
        width: 120,
        height: 28,
        type: 'ground',
        moving: true,
        moveAxis: 'x',
        moveMin: 3100,
        moveMax: 3380,
        moveSpeed: 90,
        moveDir: 1,
      });

      // Bloque Aplastante 4 sobre cornisa estrecha (x = 3450)
      addGround(3420, 420, 220, 32);
      platforms.push({x: 3440, y: 140, width: 160, height: 28, type: 'ground'});
      crushingPillars.push({
        id: pillarId++,
        x: 3490,
        y: 168,
        startY: 168,
        floorY: 344,
        width: 64,
        height: 76,
        state: 'IDLE',
        timer: 1.2,
        slamSpeed: 800,
        riseSpeed: 85,
        idleDuration: 1.2,
        waitDuration: 0.8,
        proximityTrigger: 170,
      });

      // CHECKPOINT 2: Terraza de Conducción Eléctrica (x = 3800 a 4400)
      addGround(3800, 420, 600);
      enemies.push({
        id: enemyId++,
        x: 3980,
        y: 335,
        width: 34,
        height: 65,
        type: 'turret',
        vx: 0,
        vy: 0,
        initialY: 335,
        facingRight: false,
        alive: true,
        hp: 4,
        maxHp: 4,
        shootTimer: 1.8,
      });

      enemies.push({
        id: enemyId++,
        x: 4180,
        y: 160,
        width: 54,
        height: 28,
        type: 'sky_ray',
        vx: -95,
        vy: 0,
        initialY: 160,
        facingRight: false,
        alive: true,
      });

      // 4. Gran Corredor Final de Pilares Aplastantes hacia la Cima (4500 a 5800)
      addGround(4500, 440, 520);
      platforms.push({x: 4560, y: 150, width: 380, height: 28, type: 'ground'});
      // Pilar 5
      crushingPillars.push({
        id: pillarId++,
        x: 4620,
        y: 178,
        startY: 178,
        floorY: 364,
        width: 64,
        height: 76,
        state: 'IDLE',
        timer: 0.4,
        slamSpeed: 860,
        riseSpeed: 95,
        idleDuration: 1.1,
        waitDuration: 0.8,
      });
      // Pilar 6
      crushingPillars.push({
        id: pillarId++,
        x: 4800,
        y: 178,
        startY: 178,
        floorY: 364,
        width: 64,
        height: 76,
        state: 'IDLE',
        timer: 1.2,
        slamSpeed: 860,
        riseSpeed: 95,
        idleDuration: 1.1,
        waitDuration: 0.8,
      });

      // Último salto por plataforma móvil sobre el vacío
      platforms.push({
        x: 5120,
        y: 400,
        width: 120,
        height: 28,
        type: 'ground',
        moving: true,
        moveAxis: 'x',
        moveMin: 5080,
        moveMax: 5320,
        moveSpeed: 80,
        moveDir: 1,
      });

      // Bastión de llegada y portal hacia el Santuario Celestial (5450 a 5800)
      addGround(5450, 430, 350);
      [5500, 5540, 5580].forEach((cx) => {
        items.push({id: itemId++, x: cx, y: 380, vx: 0, vy: 0, type: 'crystal'});
      });
    } else if (lvl === 11) {
      // =======================================================================
      // NIVEL 3-3: EL SANTUARIO CELESTIAL (~6400px)
      // Background: bg_zone3_celestial_sanctuary (santuario sobre nubes, estrellas, runas)
      // Focus: Plataformeo acrobático equilibrado y 100% físicamente posible:
      // - Distancias de salto nunca superan los 80px - 120px horizontales.
      // - Diferencias verticales escalonadas nunca superan los 40px - 70px.
      // - Plataformas de loto de mármol flotante, cornisas de nubes y géiseres celestiales.
      // - Suficiente espacio seguro antes y después de cada trampa de pilar aplastante.
      // - NO contiene jefe: concluye en la Gran Puerta Celestial hacia la sala aislada 3-B!
      // =======================================================================
      worldRef.current.levelWidth = 6400;
      worldRef.current.levelHeight = 720;
      worldRef.current.checkpointX = 100;
      worldRef.current.checkpointY = 412;
      worldRef.current.beaconX = 99999;
      worldRef.current.beaconY = 330;

      // 1. Terraza de Entrada del Santuario (x: 0 a 680, y = 460)
      addGround(0, 460, 680);
      platforms.push({x: 320, y: 320, width: 44, height: 44, type: 'dynamo'});
      items.push({id: itemId++, x: 330, y: 270, vx: 0, vy: 0, type: 'storm_needle'});
      [160, 240, 420, 500].forEach((cx) => {
        items.push({id: itemId++, x: cx, y: 410, vx: 0, vy: 0, type: 'crystal'});
      });

      // 2. El Desfiladero de las Nubes (x: 680 a 1480)
      // Salto 1: 680 -> 790 (Brecha de solo 110px, dy: 40px)
      addGround(790, 420, 140, 32);
      items.push({id: itemId++, x: 860, y: 370, vx: 0, vy: 0, type: 'crystal'});

      // Salto 2: 930 -> 1040 (Brecha de solo 110px, dy: 50px)
      addGround(1040, 370, 140, 32);
      items.push({id: itemId++, x: 1110, y: 320, vx: 0, vy: 0, type: 'crystal'});

      // Centinela Sky Ray en patrulla aérea
      enemies.push({
        id: enemyId++,
        x: 1140,
        y: 180,
        width: 54,
        height: 28,
        type: 'sky_ray',
        vx: -95,
        vy: 0,
        initialY: 180,
        facingRight: false,
        alive: true,
      });

      // Salto 3: 1180 -> 1270 (Brecha de 90px hacia plataforma con géiser celestial)
      addGround(1270, 440, 110, 32);
      geysers.push({
        id: geyserId++,
        x: 1300,
        y: 430,
        width: 44,
        height: 20,
        cooldown: 0,
      });

      // Salto 4: 1380 -> 1480 (Brecha de 100px hacia pórtico con Bloque Aplastante 1)
      // Superficie generosa de 260px (x: 1480 a 1740) con espacio seguro antes y después
      addGround(1480, 440, 260, 32);
      platforms.push({x: 1520, y: 150, width: 180, height: 28, type: 'ground'}); // Techo del arco
      crushingPillars.push({
        id: pillarId++,
        x: 1570,
        y: 178,
        startY: 178,
        floorY: 364,
        width: 64,
        height: 76,
        state: 'IDLE',
        timer: 1.1,
        slamSpeed: 800,
        riseSpeed: 85,
        idleDuration: 1.2,
        waitDuration: 0.8,
        proximityTrigger: 175,
      });
      // Tesoro secreto alcanzable subiéndose a la parte superior del pilar
      items.push({id: itemId++, x: 1600, y: 90, vx: 0, vy: 0, type: 'resonant_core'});

      // 3. Las Terrazas Móviles de Loto (x: 1740 a 2500)
      // Plataforma móvil 1 (x: 1830 a 1980, oscilación suave de 70px/s)
      // Brecha desde 1740 hasta su extremo izquierdo (1830) es de solo 90px!
      platforms.push({
        x: 1860,
        y: 410,
        width: 120,
        height: 28,
        type: 'ground',
        moving: true,
        moveAxis: 'x',
        moveMin: 1830,
        moveMax: 1980,
        moveSpeed: 70,
        moveDir: 1,
      });

      // Cornisa escalonada intermedia de descanso en x = 2080 (Brecha máxima de 100px)
      addGround(2080, 370, 130, 28);
      items.push({id: itemId++, x: 2140, y: 320, vx: 0, vy: 0, type: 'crystal'});

      // Cornisa con géiser de impulso celestial en x = 2290 (Brecha de 80px)
      addGround(2290, 430, 130, 28);
      geysers.push({
        id: geyserId++,
        x: 2330,
        y: 420,
        width: 44,
        height: 20,
        cooldown: 0,
      });

      // 4. CHECKPOINT 1: Baluarte del Santuario (x = 2500 a 3050, 550px de suelo seguro)
      // Brecha desde 2420 hasta 2500 es de solo 80px!
      addGround(2500, 440, 550);
      enemies.push({
        id: enemyId++,
        x: 2650,
        y: 380,
        width: 54,
        height: 60,
        type: 'golem',
        vx: 40,
        vy: 0,
        initialY: 380,
        facingRight: true,
        minX: 2540,
        maxX: 2840,
        alive: true,
        hp: 120,
        maxHp: 120,
        poundTimer: 2.8,
      });

      // Bloque Aplastante 2 al final del Baluarte
      platforms.push({x: 2860, y: 150, width: 180, height: 28, type: 'ground'});
      crushingPillars.push({
        id: pillarId++,
        x: 2920,
        y: 178,
        startY: 178,
        floorY: 364,
        width: 64,
        height: 76,
        state: 'IDLE',
        timer: 1.0,
        slamSpeed: 820,
        riseSpeed: 90,
        idleDuration: 1.1,
        waitDuration: 0.8,
      });

      // 5. El Paso de las Columnas Gemelas (x: 3050 a 4100)
      // Plataforma de loto 1: 3050 -> 3160 (Brecha de 110px)
      addGround(3160, 400, 130, 32);
      items.push({id: itemId++, x: 3220, y: 350, vx: 0, vy: 0, type: 'crystal'});

      // Plataforma de nube 2: 3290 -> 3370 (Brecha de solo 80px)
      addGround(3370, 360, 130, 32);
      items.push({id: itemId++, x: 3430, y: 310, vx: 0, vy: 0, type: 'crystal'});

      // Gran Cámara de Pilares Gemelos Alternados (x = 3580 a 4100, 520px de suelo continuo)
      // Brecha desde 3500 hasta 3580 es de solo 80px!
      addGround(3580, 440, 520);
      platforms.push({x: 3660, y: 150, width: 360, height: 28, type: 'ground'});

      // Pilares gemelos que aplastan rítmicamente en contrapunto con 116px de zona segura entre ellos
      crushingPillars.push({
        id: pillarId++,
        x: 3730,
        y: 178,
        startY: 178,
        floorY: 364,
        width: 64,
        height: 76,
        state: 'IDLE',
        timer: 0.3,
        slamSpeed: 840,
        riseSpeed: 90,
        idleDuration: 1.2,
        waitDuration: 0.8,
      });
      crushingPillars.push({
        id: pillarId++,
        x: 3910,
        y: 178,
        startY: 178,
        floorY: 364,
        width: 64,
        height: 76,
        state: 'IDLE',
        timer: 1.4,
        slamSpeed: 840,
        riseSpeed: 90,
        idleDuration: 1.2,
        waitDuration: 0.8,
      });

      // Recompensa arriba de los pilares gemelos
      platforms.push({x: 3820, y: 90, width: 44, height: 44, type: 'dynamo'});
      items.push({id: itemId++, x: 3830, y: 40, vx: 0, vy: 0, type: 'heart_hp'});

      enemies.push({
        id: enemyId++,
        x: 3960,
        y: 160,
        width: 48,
        height: 36,
        type: 'volt_bat',
        vx: -100,
        vy: 0,
        initialY: 160,
        facingRight: false,
        alive: true,
        hp: 40,
        maxHp: 40,
      });

      // 6. El Puente Suspendido y Transición sin abismos imposibles (x: 4100 a 4840)
      // Plataforma de loto 1: 4100 -> 4220 (Brecha de 120px)
      addGround(4220, 400, 130, 32);
      items.push({id: itemId++, x: 4280, y: 350, vx: 0, vy: 0, type: 'crystal'});

      // Plataforma de nube 2: 4350 -> 4430 (Brecha de solo 80px)
      addGround(4430, 370, 130, 32);
      items.push({id: itemId++, x: 4490, y: 320, vx: 0, vy: 0, type: 'crystal'});

      // Plataforma con géiser celestial: 4560 -> 4640 (Brecha de solo 80px)
      addGround(4640, 440, 120, 32);
      geysers.push({
        id: geyserId++,
        x: 4680,
        y: 430,
        width: 44,
        height: 20,
        cooldown: 0,
      });

      // 7. CHECKPOINT 2: Gran Puente Celestial Suspendido (x: 4840 a 5360, 520px de suelo)
      // Brecha desde 4760 hasta 4840 es de solo 80px!
      addGround(4840, 420, 520);
      enemies.push({
        id: enemyId++,
        x: 4960,
        y: 360,
        width: 54,
        height: 60,
        type: 'golem',
        vx: -40,
        vy: 0,
        initialY: 360,
        facingRight: false,
        minX: 4860,
        maxX: 5120,
        alive: true,
        hp: 120,
        maxHp: 120,
        poundTimer: 2.6,
      });

      enemies.push({
        id: enemyId++,
        x: 5220,
        y: 335,
        width: 34,
        height: 65,
        type: 'turret',
        vx: 0,
        vy: 0,
        initialY: 335,
        facingRight: false,
        alive: true,
        hp: 4,
        maxHp: 4,
        shootTimer: 1.8,
      });

      // 8. El Desfiladero del Templo & Gran Puerta Celestial (x: 5360 a 6400)
      // Plataforma móvil 2 sobre el abismo celestial (x: 5440 a 5600, speed: 75)
      // Brecha desde 5360 hasta 5440 es de solo 80px!
      platforms.push({
        x: 5460,
        y: 400,
        width: 120,
        height: 28,
        type: 'ground',
        moving: true,
        moveAxis: 'x',
        moveMin: 5440,
        moveMax: 5600,
        moveSpeed: 75,
        moveDir: 1,
      });

      // Cornisa escalonada intermedia de loto (x: 5690 a 5820)
      addGround(5690, 410, 130, 28);
      items.push({id: itemId++, x: 5750, y: 360, vx: 0, vy: 0, type: 'crystal'});

      // Altar de la Gran Puerta Celestial (x: 5880 a 6320, 440px de suelo ceremonial)
      // Brecha desde 5820 hasta 5880 es de solo 60px!
      addGround(5880, 420, 440);
      [5920, 5970, 6020, 6070, 6120].forEach((cx) => {
        items.push({id: itemId++, x: cx, y: 370, vx: 0, vy: 0, type: 'crystal'});
      });

      // MONUMENTAL PUERTA CELESTIAL AL FINAL DE 3-3 (structure_celestial_temple_gate)
      worldRef.current.celestialTempleGate = {
        x: 5940,
        y: 110,
        width: 320,
        height: 350,
        doorX: 6040,
        doorY: 280,
        doorW: 120,
        doorH: 140,
      };
    } else if (lvl === 12) {
      // =======================================================================
      // NIVEL 3-B: EL TRONO CELESTIAL (STAGE DEDICADO Y AISLADO DEL GRAN JEFE)
      // Cámara completamente independiente, aislada y cerrada (960x540).
      // - Cámara estrictamente fijada en camera.x = 0, camera.y = 0 (sin desplazamiento).
      // - Muro izquierdo: x = 0..32, Muro derecho: x = 928..960 (bloques sólidos).
      // - Suelo ceremonial seguro y plano a y = 440, SIN abismos ni trampas sorpresa.
      // - Spawn de Voltlynx a la izquierda: x = 120, y = 392.
      // - Spawn de Asura Celestial a la derecha: x = 720, y = 320, 1800 HP.
      // - Pedestales flotantes de flor de loto de mármol para evasión táctica:
      //   x: 90, y: 310, w: 130, h: 26; y x: 740, y: 310, w: 130, h: 26.
      // =======================================================================
      worldRef.current.levelWidth = 960;
      worldRef.current.levelHeight = 540;
      worldRef.current.checkpointX = 120;
      worldRef.current.checkpointY = 392;
      worldRef.current.beaconX = 99999;
      worldRef.current.beaconY = 340;
      worldRef.current.cameraX = 0;
      worldRef.current.cameraY = 0;
      worldRef.current.bossArenaActive = true;
      worldRef.current.bossDoorLocked = true;

      // Suelo 100% sólido y seguro en toda la arena (a y = 440)
      addGround(0, 440, 960, 100);

      // Muros perimetrales celestiales de obsidiana/mármol
      platforms.push({x: 0, y: 0, width: 32, height: 440, type: 'ground'});
      platforms.push({x: 928, y: 0, width: 32, height: 440, type: 'ground'});

      // Pedestales flotantes de flor de loto de mármol para evasión táctica
      platforms.push({x: 90, y: 310, width: 130, height: 26, type: 'ground'});
      platforms.push({x: 740, y: 310, width: 130, height: 26, type: 'ground'});

      // Instanciación del Gran Jefe de Zona 3: Asura Celestial (1800 HP)
      // Spawns a la derecha en x = 720, y = 320 mirando hacia la izquierda
      worldRef.current.boss = {
        type: 'CELESTIAL_DEITY',
        name: 'ASURA CELESTIAL - DIOS CÓSMICO DE MÚLTIPLES BRAZOS',
        subtitle: 'Tercer Comandante Sombrío de Ghotur (Fragmento 3/5)',
        x: 720,
        y: 320,
        width: 150,
        height: 160,
        vx: 0,
        vy: 0,
        hp: 1800,
        maxHp: 1800,
        phase: 1,
        state: 'IDLE',
        stateTimer: 0.8,
        facingRight: false,
        hurtTimer: 0,
        telegraphGlow: 0,
        wingFlap: 0,
        arenaLeft: 36,
        arenaRight: 924,
        groundY: 280, // Suelo en 440 - 160 = 280
        displayedHp: 1800,
        trackTargetX: 720,
        trackTimer: 0,
        cascadeOrbs: [],
        cascadeTimer: 0,
        chargeDidLeap: false,
        pinballBouncesLeft: 0,
        lightningPillars: [],
        stalactites: [],
        punishedInStun: false,
        lastAttackType: '',
        comboStep: 0,
        comboLength: 2,
        shieldActive: true,
        karateCount: 0,
        javelinCount: 0,
        squash: 1,
        stretch: 1,
        walkTimer: 0,
        animTimer: 0,
        animTime: 0,
      };
    } else if (lvl === 13) {
      // =======================================================================
      // NIVEL 4-1: EL VALLE GLACIAL (~5400px) - SALTOS 100% CALIBRADOS Y FLUIDOS
      // Background: bg_zone4_glacial_valley (valle glacial, témpanos y aurora boreal)
      // Auditoría completa de saltos:
      // - Distancias horizontales estrictamente reducidas a 60-90px (nunca más de 100px).
      // - Diferencias verticales escalonadas suaves de 30-50px (nunca abismos inaccesibles).
      // - Plataformas de hielo intermedias agregadas en las simas que antes tenían 380px de vacío.
      // =======================================================================
      worldRef.current.levelWidth = 5400;
      worldRef.current.levelHeight = 720;
      worldRef.current.checkpointX = 100;
      worldRef.current.checkpointY = 432;
      worldRef.current.beaconX = 5180;
      worldRef.current.beaconY = 352;

      // 1. Terraza de Entrada Glacial (0 a 800)
      addGround(0, 480, 800, 48, true);
      platforms.push({x: 360, y: 340, width: 44, height: 44, type: 'dynamo'});
      platforms.push({x: 430, y: 340, width: 44, height: 44, type: 'dynamo'});
      items.push({id: itemId++, x: 372, y: 290, vx: 0, vy: 0, type: 'storm_needle'});

      [180, 240, 300, 520, 580].forEach((cx) => {
        items.push({id: itemId++, x: cx, y: 430, vx: 0, vy: 0, type: 'crystal'});
      });

      // Primer Escarabajo Glacial
      enemies.push({
        id: enemyId++,
        x: 640,
        y: 424,
        width: 68,
        height: 46,
        type: 'crawler',
        vx: 100,
        vy: 0,
        initialY: 424,
        facingRight: false,
        minX: 520,
        maxX: 760,
        alive: true,
        hp: 45,
        maxHp: 45,
        isFrostVariant: true,
      });

      // Murciélago de Escarcha Aéreo
      enemies.push({
        id: enemyId++,
        x: 750,
        y: 190,
        width: 76,
        height: 58,
        type: 'volt_bat',
        vx: -110,
        vy: 0,
        initialY: 190,
        facingRight: false,
        alive: true,
        hp: 50,
        maxHp: 50,
        isFrostVariant: true,
      });

      // 2. Terrazas Escalonadas Suaves (800 a 1750) - Huecos de solo 70-80px
      // 800 -> 870 (Hueco de 70px)
      addGround(870, 460, 260, 48, true);
      // Cornisa alta accesible: dy: 60px
      addGround(980, 400, 160, 32, true);
      addGround(1190, 350, 180, 32, true);

      // Bloques de hielo rompibles
      platforms.push({x: 930, y: 396, width: 48, height: 64, type: 'breakable'});
      items.push({id: itemId++, x: 890, y: 410, vx: 0, vy: 0, type: 'resonant_core'});

      // Suelo inferior continuo conectado: 1180 -> 1640
      addGround(1180, 460, 460, 48, true);

      // Torreta de Hielo
      enemies.push({
        id: enemyId++,
        x: 1280,
        y: 252,
        width: 56,
        height: 98,
        type: 'turret',
        vx: 0,
        vy: 0,
        initialY: 252,
        facingRight: false,
        alive: true,
        hp: 5,
        maxHp: 5,
        shootTimer: 2.4,
        isFrostVariant: true,
      });

      // Gólem de Hielo Primordial en la base
      enemies.push({
        id: enemyId++,
        x: 1480,
        y: 384,
        width: 86,
        height: 96,
        type: 'golem',
        vx: -50,
        vy: 0,
        initialY: 384,
        facingRight: false,
        minX: 1360,
        maxX: 1620,
        alive: true,
        hp: 160,
        maxHp: 160,
        poundTimer: 2.6,
        isFrostVariant: true,
      });

      // Plataforma de paso intermedia: 1640 -> 1700 (Hueco de 60px)
      addGround(1700, 460, 100, 48, true);

      // 3. CHECKPOINT 1: Baluarte Glacial & Sima con Plataformas Seguras (1780 a 2800)
      // 1800 -> 2430: Suelo sólido del baluarte
      addGround(1850, 460, 580, 48, true);
      platforms.push({x: 2000, y: 320, width: 44, height: 44, type: 'dynamo'});
      items.push({id: itemId++, x: 2010, y: 270, vx: 0, vy: 0, type: 'heart_hp'});

      // Sima helada con plataforma fija y plataforma móvil (2430 a 2900)
      platforms.push({x: 2460, y: 560, width: 420, height: 40, type: 'hazard'});

      // Plataforma fija de apoyo sobre la sima (2430 -> 2510 = 80px)
      addGround(2510, 430, 110, 32, true);

      // Plataforma móvil suave (2660 a 2800, oscila a 70px/s)
      platforms.push({
        x: 2660,
        y: 420,
        width: 120,
        height: 32,
        type: 'ground',
        isIce: true,
        moving: true,
        moveAxis: 'x',
        moveMin: 2660,
        moveMax: 2800,
        moveSpeed: 70,
        moveDir: 1,
      });

      // Plataforma fija de llegada de la sima (2800 -> 2880 = 80px)
      addGround(2880, 430, 100, 32, true);

      // Centinela Rayo de Escarcha patrullando
      enemies.push({
        id: enemyId++,
        x: 2650,
        y: 190,
        width: 86,
        height: 46,
        type: 'sky_ray',
        vx: -95,
        vy: 0,
        initialY: 190,
        facingRight: false,
        alive: true,
        isFrostVariant: true,
      });

      // 4. Crestas de Escarcha & Géiser Polar (2980 a 3800)
      // 2980 -> 3040 (Hueco de 60px): Plataforma con géiser
      addGround(3040, 440, 340, 48, true);
      geysers.push({
        id: geyserId++,
        x: 3120,
        y: 430,
        width: 44,
        height: 20,
        cooldown: 0,
      });

      // Cornisa alta accesible con géiser o salto normal
      addGround(3200, 310, 180, 32, true);
      items.push({id: itemId++, x: 3280, y: 260, vx: 0, vy: 0, type: 'crystal'});

      // Stepping platforms cerrando la antigua brecha de 380px:
      // 3380 -> 3450 (Hueco de 70px)
      addGround(3450, 430, 120, 32, true);
      // 3570 -> 3640 (Hueco de 70px)
      addGround(3640, 440, 120, 32, true);

      enemies.push({
        id: enemyId++,
        x: 3240,
        y: 364,
        width: 86,
        height: 96,
        type: 'golem',
        vx: 45,
        vy: 0,
        initialY: 364,
        facingRight: true,
        minX: 3080,
        maxX: 3340,
        alive: true,
        hp: 160,
        maxHp: 160,
        poundTimer: 2.4,
        isFrostVariant: true,
      });

      // 5. CHECKPOINT 2: El Desfiladero del Viento Polar (3800 a 4450)
      // 3760 -> 3820 (Hueco de 60px): Suelo amplio y continuo
      addGround(3820, 440, 620, 48, true);

      enemies.push({
        id: enemyId++,
        x: 4050,
        y: 180,
        width: 76,
        height: 58,
        type: 'volt_bat',
        vx: 110,
        vy: 0,
        initialY: 180,
        facingRight: true,
        alive: true,
        hp: 50,
        maxHp: 50,
        isFrostVariant: true,
      });

      enemies.push({
        id: enemyId++,
        x: 4260,
        y: 342,
        width: 56,
        height: 98,
        type: 'turret',
        vx: 0,
        vy: 0,
        initialY: 342,
        facingRight: false,
        alive: true,
        hp: 5,
        maxHp: 5,
        shootTimer: 2.0,
        isFrostVariant: true,
      });

      // 6. Sima final puenteada con plataformas escalonadas (4440 a 4800)
      platforms.push({x: 4460, y: 560, width: 340, height: 40, type: 'hazard'});
      // Stepping ledge 1 (4440 -> 4510 = 70px)
      addGround(4510, 420, 110, 32, true);
      // Stepping ledge 2 (4620 -> 4690 = 70px)
      addGround(4690, 430, 110, 32, true);

      // 7. Meseta Final del Portal (4860 a 5400)
      // 4800 -> 4870 = 70px gap
      addGround(4870, 440, 520, 48, true);

      enemies.push({
        id: enemyId++,
        x: 4980,
        y: 394,
        width: 68,
        height: 46,
        type: 'crawler',
        vx: -95,
        vy: 0,
        initialY: 394,
        facingRight: false,
        minX: 4890,
        maxX: 5120,
        alive: true,
        hp: 40,
        maxHp: 40,
        isFrostVariant: true,
      });

      [5040, 5090, 5140].forEach((cx) => {
        items.push({id: itemId++, x: cx, y: 390, vx: 0, vy: 0, type: 'crystal'});
      });
    } else if (lvl === 14) {
      // =======================================================================
      // NIVEL 4-2: EL PASO DE LA AVALANCHA (Secuencia de Persecución con Roca Glacial)
      // Background: bg_zone4_avalanche_pass (desfiladero alpino, laderas heladas y ventisca)
      // Lógica de pendientes de montaña: laderas escalonadas descendentes reales (cascadas de 24px)
      // donde la roca rueda colina abajo acelerando por gravedad.
      // Mesetas de descanso llanas donde la roca impacta contra barreras de hielo.
      // =======================================================================
      worldRef.current.levelWidth = 5600;
      worldRef.current.levelHeight = 750;
      worldRef.current.checkpointX = 100;
      worldRef.current.checkpointY = 390;
      worldRef.current.safeRespawnX = 100;
      worldRef.current.safeRespawnY = 390;
      worldRef.current.cameraX = 0;
      worldRef.current.cameraY = 0;
      worldRef.current.beaconX = 5320;
      worldRef.current.beaconY = 352;

      // -----------------------------------------------------------------------
      // SEGMENTO 1: PRIMERA LADERA DESCENDENTE DE LA AVALANCHA (0 a 1780)
      // -----------------------------------------------------------------------
      // Wide, solid starting platform at x: 0, y: 440, width: 800, height: 100
      addGround(0, 440, 800, 100, true);

      platforms.push({x: 340, y: 340, width: 44, height: 44, type: 'dynamo'});
      items.push({id: itemId++, x: 350, y: 290, vx: 0, vy: 0, type: 'storm_needle'});
      items.push({id: itemId++, x: 220, y: 390, vx: 0, vy: 0, type: 'crystal'});
      items.push({id: itemId++, x: 280, y: 390, vx: 0, vy: 0, type: 'crystal'});
      items.push({id: itemId++, x: 440, y: 390, vx: 0, vy: 0, type: 'crystal'});

      // Cascada de pendiente escalonada descendente tras la meseta inicial (x: 800+)
      addGround(800, 464, 120, 48, true);
      addGround(910, 488, 120, 48, true);
      addGround(1020, 512, 120, 48, true);
      addGround(1130, 536, 120, 48, true);
      addGround(1240, 560, 140, 48, true);

      // Cornisas altas de refugio sobre la ladera 1 (para saltar y esquivar la roca)
      addGround(880, 370, 240, 28, true);
      items.push({id: itemId++, x: 940, y: 320, vx: 0, vy: 0, type: 'crystal'});
      items.push({id: itemId++, x: 1000, y: 320, vx: 0, vy: 0, type: 'crystal'});

      addGround(1120, 420, 260, 28, true);
      items.push({id: itemId++, x: 1180, y: 370, vx: 0, vy: 0, type: 'storm_needle'});
      items.push({id: itemId++, x: 1240, y: 370, vx: 0, vy: 0, type: 'crystal'});
      items.push({id: itemId++, x: 1300, y: 370, vx: 0, vy: 0, type: 'crystal'});

      // ROCA GLACIAL 1: Despierta al cruzar x = 650 rodando colina abajo por la pendiente
      boulders.push({
        id: boulderId++,
        x: -40,
        y: 394,
        vx: 260,
        vy: 0,
        radius: 46,
        rotation: 0,
        active: false,
        triggerX: 650,
        stopX: 1680,
        shattered: false,
      });

      // Enemigos en la ladera 1
      enemies.push({
        id: enemyId++,
        x: 960,
        y: 380,
        width: 68,
        height: 46,
        type: 'crawler',
        vx: -80,
        vy: 0,
        initialY: 380,
        facingRight: false,
        minX: 900,
        maxX: 1100,
        alive: true,
        hp: 40,
        maxHp: 40,
        isFrostVariant: true,
      });

      enemies.push({
        id: enemyId++,
        x: 1250,
        y: 230,
        width: 76,
        height: 58,
        type: 'volt_bat',
        vx: -100,
        vy: 0,
        initialY: 230,
        facingRight: false,
        alive: true,
        hp: 50,
        maxHp: 50,
        isFrostVariant: true,
      });

      // Cuenca horizontal donde la roca 1 impacta contra la barrera
      addGround(1460, 524, 380, 48, true);
      platforms.push({x: 1680, y: 360, width: 44, height: 180, type: 'ground', isIce: true});

      // CHECKPOINT 1: Meseta segura tras la barrera (1740 a 2040)
      addGround(1720, 524, 340, 48, true);
      platforms.push({x: 1860, y: 390, width: 44, height: 44, type: 'dynamo'});
      items.push({id: itemId++, x: 1870, y: 340, vx: 0, vy: 0, type: 'heart_1up'});

      // -----------------------------------------------------------------------
      // SEGMENTO 2: SEGUNDA LADERA DESCENDENTE DE LA AVALANCHA (2040 a 3580)
      // -----------------------------------------------------------------------
      // Rampa de ascenso escalonada hacia la segunda cresta
      addGround(2040, 460, 110, 48, true);
      addGround(2140, 400, 110, 48, true);
      addGround(2240, 340, 240, 48, true); // Cresta alta en y = 340

      // Pendiente escalonada descendente 2 (drops 24px per step from 340 down to 532)
      addGround(2460, 364, 120, 48, true);
      addGround(2570, 388, 120, 48, true);
      addGround(2680, 412, 120, 48, true);
      addGround(2790, 436, 120, 48, true);
      addGround(2900, 460, 120, 48, true);
      addGround(3010, 484, 120, 48, true);
      addGround(3120, 508, 130, 48, true);
      addGround(3240, 532, 140, 48, true);

      // Cornisa alta de refugio 2
      addGround(2700, 290, 260, 28, true);
      items.push({id: itemId++, x: 2800, y: 240, vx: 0, vy: 0, type: 'resonant_core'});

      // ROCA GLACIAL 2: Despierta al cruzar x = 2360
      boulders.push({
        id: boulderId++,
        x: 2180,
        y: 288,
        vx: 275,
        vy: 0,
        radius: 52,
        rotation: 0,
        active: false,
        triggerX: 2360,
        stopX: 3460,
        shattered: false,
      });

      enemies.push({
        id: enemyId++,
        x: 2820,
        y: 385,
        width: 68,
        height: 46,
        type: 'crawler',
        vx: -90,
        vy: 0,
        initialY: 385,
        facingRight: false,
        minX: 2700,
        maxX: 2950,
        alive: true,
        hp: 40,
        maxHp: 40,
        isFrostVariant: true,
      });

      enemies.push({
        id: enemyId++,
        x: 3080,
        y: 420,
        width: 86,
        height: 96,
        type: 'golem',
        vx: 45,
        vy: 0,
        initialY: 420,
        facingRight: true,
        minX: 2980,
        maxX: 3200,
        alive: true,
        hp: 160,
        maxHp: 160,
        poundTimer: 2.3,
        isFrostVariant: true,
      });

      // Cuenca horizontal donde la roca 2 se estrella
      addGround(3360, 532, 360, 48, true);
      platforms.push({x: 3460, y: 370, width: 44, height: 180, type: 'ground', isIce: true});

      // CHECKPOINT 2: Meseta de preparación tras barrera 2 (3500 a 3760)
      addGround(3500, 532, 280, 48, true);
      platforms.push({x: 3620, y: 400, width: 44, height: 44, type: 'dynamo'});

      // -----------------------------------------------------------------------
      // SEGMENTO 3: TERCERA Y COLOSAL CARRERA DE AVALANCHA (3760 a 5100)
      // -----------------------------------------------------------------------
      // Rampa de ascenso hacia la cresta final
      addGround(3760, 470, 110, 48, true);
      addGround(3860, 410, 110, 48, true);
      addGround(3960, 350, 240, 48, true); // Cresta alta final en y = 350

      // Pendiente de bajada extrema colosal (drops 24px per step from 350 to 566)
      addGround(4180, 374, 110, 48, true);
      addGround(4280, 398, 110, 48, true);
      addGround(4380, 422, 110, 48, true);
      addGround(4480, 446, 110, 48, true);
      addGround(4580, 470, 110, 48, true);
      addGround(4680, 494, 110, 48, true);
      addGround(4780, 518, 110, 48, true);
      addGround(4880, 542, 120, 48, true);
      addGround(4990, 566, 140, 48, true);

      // ROCA GLACIAL 3: Colosal (radio 56), despierta al cruzar x = 4080
      boulders.push({
        id: boulderId++,
        x: 3900,
        y: 294,
        vx: 295,
        vy: 0,
        radius: 56,
        rotation: 0,
        active: false,
        triggerX: 4080,
        stopX: 5120,
        shattered: false,
      });

      // Bloques de hielo rompibles en la ladera
      platforms.push({x: 4320, y: 334, width: 48, height: 64, type: 'breakable'});
      platforms.push({x: 4620, y: 406, width: 48, height: 64, type: 'breakable'});

      // Cornisa alta de refugio 3
      addGround(4460, 320, 240, 28, true);
      items.push({id: itemId++, x: 4520, y: 270, vx: 0, vy: 0, type: 'crystal'});
      items.push({id: itemId++, x: 4580, y: 270, vx: 0, vy: 0, type: 'crystal'});

      // Muro de contención terminal donde la roca colosal 3 se pulveriza
      addGround(5110, 566, 120, 48, true);
      platforms.push({x: 5120, y: 400, width: 44, height: 180, type: 'ground', isIce: true});

      // -----------------------------------------------------------------------
      // MESETA FINAL LIMPIA Y ELEVADA CON EL PORTAL ON TOP (5160 a 5580 a y = 440)
      // -----------------------------------------------------------------------
      addGround(5160, 500, 80, 48, true); // Escalar al plateau
      addGround(5230, 440, 350, 48, true); // Meseta llana elevada
      [5260, 5300, 5400].forEach((cx) => {
        items.push({id: itemId++, x: cx, y: 390, vx: 0, vy: 0, type: 'crystal'});
      });
    } else if (lvl === 15) {
      // =======================================================================
      // NIVEL 4-3: LA CUMBRE HELADA (Semi-Solid One-Way Mountain Tower & 110px+ Gaps)
      // - 100% ONE-WAY JUMP-THROUGH PLATFORMS on all floating ledges & stepping stones
      // - At least 110px of clear horizontal space between platforms (no scissors overlapping)
      // - Spaced enemy placement with safe landing zones away from crawlers
      // - 3 Camp Checkpoints: Base (y: 3480), Refugio Glacial (y: 2400), Meseta Alta (y: 1275)
      // - Cumbre Helada (y: 290) with the Glacial Citadel Gate
      // =======================================================================
      worldRef.current.levelWidth = 960;
      worldRef.current.levelHeight = 3600;
      worldRef.current.checkpointX = 480;
      worldRef.current.checkpointY = 3480;
      worldRef.current.safeRespawnX = 480;
      worldRef.current.safeRespawnY = 3480;
      worldRef.current.checkpoint43 = { x: 480, y: 3480 };
      worldRef.current.cameraX = 0;
      worldRef.current.cameraY = 3060;
      worldRef.current.beaconX = 99999;
      worldRef.current.beaconY = 240;

      // 3 Clearly Marked Safe Mountain Checkpoints with Rest Sanctuaries
      worldRef.current.lastCheckpoint43 = 0;
      worldRef.current.mountainCheckpoints = [
        {
          id: 1,
          name: 'Campamento Base',
          x: 28,
          y: 3480,
          width: 904,
          beaconX: 480,
          beaconY: 3480,
          activated: true,
          beaconLit: true,
        },
        {
          id: 2,
          name: 'Refugio Glacial Intermedio',
          x: 80,
          y: 2400,
          width: 260,
          beaconX: 480,
          beaconY: 2400,
          activated: false,
          beaconLit: false,
        },
        {
          id: 3,
          name: 'Meseta Alta de Viento',
          x: 620,
          y: 1275,
          width: 260,
          beaconX: 480,
          beaconY: 1275,
          activated: false,
          beaconLit: false,
        },
      ];

      // Muros perimetrales verticales de hielo de montaña
      platforms.push({x: 0, y: 0, width: 28, height: 3600, type: 'ground', isIce: true});
      platforms.push({x: 932, y: 0, width: 28, height: 3600, type: 'ground', isIce: true});

      // 1. CAMPAMENTO BASE (y = 3480) - Suelo firme y seguro de 904px
      addGround(28, 3480, 904, 120, true, false, false);
      platforms.push({x: 458, y: 3350, width: 44, height: 44, type: 'dynamo'});
      items.push({id: itemId++, x: 470, y: 3290, vx: 0, vy: 0, type: 'storm_needle'});
      items.push({id: itemId++, x: 260, y: 3440, vx: 0, vy: 0, type: 'crystal'});
      items.push({id: itemId++, x: 700, y: 3440, vx: 0, vy: 0, type: 'crystal'});
      items.push({id: itemId++, x: 200, y: 2340, vx: 0, vy: 0, type: 'heart_1up'});
      items.push({id: itemId++, x: 755, y: 1215, vx: 0, vy: 0, type: 'heart_1up'});

      // -----------------------------------------------------------------------
      // TRAMO 1: Ascenso Panorámico desde Base (y = 3480) a Refugio Glacial (y = 2400)
      // Generous 110px+ horizontal gaps, 100% one-way jump-through platforms
      // -----------------------------------------------------------------------
      // Ledge 1: Centro-Derecha (x: 620..750)
      addGround(620, 3380, 130, 26, true, false, true);
      items.push({id: itemId++, x: 685, y: 3335, vx: 0, vy: 0, type: 'crystal'});

      // Ledge 2: Risco Derecho (x: 770..890) -> Gap from center: 770 - 640 = 130px
      addGround(770, 3280, 120, 28, true, false, true);
      items.push({id: itemId++, x: 830, y: 3235, vx: 0, vy: 0, type: 'crystal'});
      icicles.push({
        id: icicleId++,
        x: 810,
        y: 3308,
        startY: 3308,
        platY: 3308,
        width: 22,
        height: 38,
        state: 'ATTACHED',
        shakeTimer: 0,
        vy: 0,
        hp: 20,
        isAmbientDrop: true,
        ambientTimer: 8.0,
      });

      // Stepping Stone 1: Centro-Derecha (x: 580..660) -> Gap to Far Right (770) = 110px!
      addGround(580, 3190, 80, 22, true, false, true);
      items.push({id: itemId++, x: 620, y: 3145, vx: 0, vy: 0, type: 'crystal'});

      // Ledge 3: Centro-Izquierda (x: 330..470) -> Gap to Stepping Stone 1 (580) = 110px!
      addGround(330, 3100, 140, 26, true, false, true);
      items.push({id: itemId++, x: 440, y: 3055, vx: 0, vy: 0, type: 'crystal'});
      // Crawler placed on the far left side, patrolling 330..395, leaving 395..470 wide-open for safe landing!
      enemies.push({
        id: enemyId++,
        x: 345,
        y: 3055,
        width: 58,
        height: 38,
        type: 'crawler',
        vx: 55,
        vy: 0,
        initialY: 3055,
        facingRight: false,
        minX: 330,
        maxX: 395,
        alive: true,
        hp: 35,
        maxHp: 35,
        isFrostVariant: true,
      });

      // Stepping Stone 2: Izquierda (x: 140..220) -> Gap to Ledge 3 (330) = 110px!
      addGround(140, 3010, 80, 22, true, false, true);
      items.push({id: itemId++, x: 180, y: 2965, vx: 0, vy: 0, type: 'crystal'});

      // Ledge 4: Risco Izquierdo (x: 40..170)
      addGround(40, 2920, 130, 28, true, false, true);
      items.push({id: itemId++, x: 105, y: 2875, vx: 0, vy: 0, type: 'crystal'});
      icicles.push({
        id: icicleId++,
        x: 95,
        y: 2948,
        startY: 2948,
        platY: 2948,
        width: 22,
        height: 38,
        state: 'ATTACHED',
        shakeTimer: 0,
        vy: 0,
        hp: 20,
        isAmbientDrop: true,
        ambientTimer: 6.5,
      });

      // Stepping Stone 3: Centro-Izquierda (x: 290..370) -> Gap to Ledge 4 (170) = 120px!
      addGround(290, 2830, 80, 22, true, false, true);
      items.push({id: itemId++, x: 330, y: 2785, vx: 0, vy: 0, type: 'crystal'});

      // Ledge 5: Plataforma Centro con Géiser Propulsor (x: 480..600) -> Gap to Stone 3 (370) = 110px!
      addGround(480, 2740, 120, 26, true, false, true);
      geysers.push({
        id: geyserId++,
        x: 520,
        y: 2730,
        width: 44,
        height: 20,
        cooldown: 0,
      });

      // Stepping Stone 4: Centro-Derecha (x: 710..790) -> Gap to Ledge 5 (600) = 110px!
      addGround(710, 2630, 80, 22, true, false, true);
      items.push({id: itemId++, x: 750, y: 2585, vx: 0, vy: 0, type: 'crystal'});

      // Ledge 6: Risco Derecho (x: 770..900)
      addGround(770, 2530, 130, 28, true, false, true);
      enemies.push({
        id: enemyId++,
        x: 780,
        y: 2450,
        width: 60,
        height: 44,
        type: 'volt_bat',
        vx: -65,
        vy: 0,
        initialY: 2450,
        facingRight: false,
        alive: true,
        hp: 40,
        maxHp: 40,
        isFrostVariant: true,
      });
      icicles.push({
        id: icicleId++,
        x: 820,
        y: 2558,
        startY: 2558,
        platY: 2558,
        width: 22,
        height: 38,
        state: 'ATTACHED',
        shakeTimer: 0,
        vy: 0,
        hp: 20,
        isAmbientDrop: true,
        ambientTimer: 7.0,
      });

      // Stepping Stone 5: Centro-Derecha (x: 580..660) -> Gap to Ledge 6 (770) = 110px!
      addGround(580, 2460, 80, 20, true, false, true);
      items.push({id: itemId++, x: 620, y: 2415, vx: 0, vy: 0, type: 'crystal'});

      // Stepping Stone 6: Centro-Izquierda (x: 390..470) -> Gap to Stone 5 (580) = 110px!
      addGround(390, 2430, 80, 20, true, false, true);

      // -----------------------------------------------------------------------
      // CHECKPOINT 2: REFUGIO GLACIAL INTERMEDIO (y = 2400)
      // Santuarios amplios de descanso con faroles y bloque Dynamo
      // -----------------------------------------------------------------------
      addGround(80, 2400, 260, 28, true, false, true);
      addGround(380, 2400, 220, 28, true, false, true);
      addGround(640, 2400, 240, 28, true, false, true);
      platforms.push({x: 458, y: 2310, width: 44, height: 44, type: 'dynamo'});
      items.push({id: itemId++, x: 470, y: 2250, vx: 0, vy: 0, type: 'storm_needle'});
      items.push({id: itemId++, x: 750, y: 2350, vx: 0, vy: 0, type: 'heart_hp'});

      // -----------------------------------------------------------------------
      // TRAMO 2: La Garganta de la Ventisca (y: 2400 a 1275)
      // Generous 110px+ horizontal gaps, 100% one-way jump-through platforms
      // -----------------------------------------------------------------------
      // Ledge 7: Risco Derecho (x: 770..890)
      addGround(770, 2300, 120, 28, true, false, true);
      items.push({id: itemId++, x: 830, y: 2255, vx: 0, vy: 0, type: 'crystal'});

      // Stepping Stone 7: Centro-Derecha (x: 580..660) -> Gap to Ledge 7 (770) = 110px!
      addGround(580, 2210, 80, 22, true, false, true);
      items.push({id: itemId++, x: 620, y: 2165, vx: 0, vy: 0, type: 'crystal'});

      // Ledge 8: Centro (x: 350..470) -> Gap to Stone 7 (580) = 110px!
      addGround(350, 2120, 120, 26, true, false, true);
      enemies.push({
        id: enemyId++,
        x: 410,
        y: 2045,
        width: 58,
        height: 42,
        type: 'volt_bat',
        vx: -70,
        vy: 0,
        initialY: 2045,
        facingRight: false,
        alive: true,
        hp: 40,
        maxHp: 40,
        isFrostVariant: true,
      });

      // Stepping Stone 8: Izquierda (x: 160..240) -> Gap to Ledge 8 (350) = 110px!
      addGround(160, 2030, 80, 22, true, false, true);
      items.push({id: itemId++, x: 200, y: 1985, vx: 0, vy: 0, type: 'crystal'});

      // Ledge 9: Risco Izquierdo (x: 40..160)
      addGround(40, 1940, 120, 28, true, false, true);
      items.push({id: itemId++, x: 100, y: 1895, vx: 0, vy: 0, type: 'crystal'});
      icicles.push({
        id: icicleId++,
        x: 90,
        y: 1968,
        startY: 1968,
        platY: 1968,
        width: 22,
        height: 38,
        state: 'ATTACHED',
        shakeTimer: 0,
        vy: 0,
        hp: 20,
        isAmbientDrop: true,
        ambientTimer: 5.5,
      });

      // Stepping Stone 9: Centro-Izquierda (x: 280..360) -> Gap to Ledge 9 (160) = 120px!
      addGround(280, 1850, 80, 22, true, false, true);
      items.push({id: itemId++, x: 320, y: 1805, vx: 0, vy: 0, type: 'crystal'});

      // Ledge 10: Centro con Géiser Propulsor (x: 470..590) -> Gap to Stone 9 (360) = 110px!
      addGround(470, 1750, 120, 26, true, false, true);
      geysers.push({
        id: geyserId++,
        x: 510,
        y: 1740,
        width: 44,
        height: 20,
        cooldown: 0,
      });

      // Stepping Stone 10: Centro-Derecha (x: 710..790) -> Gap to Ledge 10 (590) = 120px!
      addGround(710, 1630, 80, 22, true, false, true);
      items.push({id: itemId++, x: 750, y: 1585, vx: 0, vy: 0, type: 'crystal'});

      // Ledge 11: Risco Derecho (x: 780..900)
      addGround(780, 1520, 120, 28, true, false, true);
      items.push({id: itemId++, x: 840, y: 1475, vx: 0, vy: 0, type: 'crystal'});
      icicles.push({
        id: icicleId++,
        x: 820,
        y: 1548,
        startY: 1548,
        platY: 1548,
        width: 22,
        height: 38,
        state: 'ATTACHED',
        shakeTimer: 0,
        vy: 0,
        hp: 20,
        isAmbientDrop: true,
        ambientTimer: 6.0,
      });

      // Stepping Stone 11: Centro-Derecha (x: 590..670) -> Gap to Ledge 11 (780) = 110px!
      addGround(590, 1430, 80, 22, true, false, true);
      items.push({id: itemId++, x: 630, y: 1385, vx: 0, vy: 0, type: 'crystal'});

      // Ledge 12: Centro-Izquierda (x: 340..480) -> Gap to Stone 11 (590) = 110px!
      addGround(340, 1360, 140, 26, true, false, true);
      // Crawler placed on the far left side, patrolling 340..405, leaving 405..480 open for landing!
      enemies.push({
        id: enemyId++,
        x: 355,
        y: 1320,
        width: 58,
        height: 38,
        type: 'crawler',
        vx: 60,
        vy: 0,
        initialY: 1320,
        facingRight: false,
        minX: 340,
        maxX: 405,
        alive: true,
        hp: 35,
        maxHp: 35,
        isFrostVariant: true,
      });

      // Stepping Stone 12: Centro (x: 530..610)
      addGround(530, 1310, 80, 20, true, false, true);

      // -----------------------------------------------------------------------
      // CHECKPOINT 3: MESETA ALTA DE VIENTO (y = 1275)
      // Santuarios amplios de descanso con faroles y bloque Dynamo
      // -----------------------------------------------------------------------
      addGround(80, 1275, 260, 28, true, false, true);
      addGround(380, 1275, 220, 28, true, false, true);
      addGround(640, 1275, 240, 28, true, false, true);
      platforms.push({x: 458, y: 1185, width: 44, height: 44, type: 'dynamo'});
      items.push({id: itemId++, x: 470, y: 1125, vx: 0, vy: 0, type: 'heart_hp'});

      // -----------------------------------------------------------------------
      // TRAMO 3: Las Agujas del Pináculo Helado (y: 1275 a 290)
      // El ascenso final hacia la Gran Cumbre con 110px+ gaps y open chutes
      // -----------------------------------------------------------------------
      // Ledge 13: Risco Izquierdo (x: 50..180)
      addGround(50, 1180, 130, 28, true, false, true);
      items.push({id: itemId++, x: 115, y: 1135, vx: 0, vy: 0, type: 'crystal'});
      icicles.push({
        id: icicleId++,
        x: 100,
        y: 1208,
        startY: 1208,
        platY: 1208,
        width: 22,
        height: 38,
        state: 'ATTACHED',
        shakeTimer: 0,
        vy: 0,
        hp: 20,
        isAmbientDrop: true,
        ambientTimer: 5.5,
      });

      // Stepping Stone 13: Centro-Izquierda (x: 290..370) -> Gap to Ledge 13 (180) = 110px!
      addGround(290, 1080, 80, 22, true, false, true);
      items.push({id: itemId++, x: 330, y: 1035, vx: 0, vy: 0, type: 'crystal'});

      // Ledge 14: Centro (x: 480..600) -> Gap to Stone 13 (370) = 110px!
      addGround(480, 980, 120, 26, true, false, true);
      enemies.push({
        id: enemyId++,
        x: 510,
        y: 910,
        width: 58,
        height: 42,
        type: 'volt_bat',
        vx: 75,
        vy: 0,
        initialY: 910,
        facingRight: true,
        alive: true,
        hp: 40,
        maxHp: 40,
        isFrostVariant: true,
      });

      // Stepping Stone 14: Centro-Derecha (x: 710..790) -> Gap to Ledge 14 (600) = 110px!
      addGround(710, 880, 80, 22, true, false, true);
      items.push({id: itemId++, x: 750, y: 835, vx: 0, vy: 0, type: 'crystal'});

      // Ledge 15: Risco Derecho (x: 780..900)
      addGround(780, 780, 120, 28, true, false, true);
      items.push({id: itemId++, x: 840, y: 735, vx: 0, vy: 0, type: 'crystal'});

      // Ledge Central con Géiser Propulsor a y: 680
      addGround(420, 680, 120, 26, true, false, true);
      geysers.push({
        id: geyserId++,
        x: 460,
        y: 670,
        width: 44,
        height: 20,
        cooldown: 0,
      });

      // Flancos intermedios de descanso a y: 570
      addGround(160, 570, 130, 26, true, false, true);
      items.push({id: itemId++, x: 220, y: 525, vx: 0, vy: 0, type: 'crystal'});

      addGround(670, 570, 130, 26, true, false, true);
      items.push({id: itemId++, x: 730, y: 525, vx: 0, vy: 0, type: 'crystal'});

      // Escalones naturales laterales (Stepping stones a los flancos izquierdo y derecho a y: 440)
      // Permiten saltar por aire completamente libre directamente a la meseta superior
      addGround(100, 440, 140, 26, true, false, true);
      items.push({id: itemId++, x: 170, y: 395, vx: 0, vy: 0, type: 'crystal'});

      addGround(720, 440, 140, 26, true, false, true);
      items.push({id: itemId++, x: 790, y: 395, vx: 0, vy: 0, type: 'crystal'});

      // -----------------------------------------------------------------------
      // 5. GRAN MESETA DE LA CUMBRE HELADA (y = 290)
      // FÍSICAMENTE RECORTADA A 400px (x: 280..680) CENTRADA BAJO LA PUERTA (x: 340..620)!
      // Los flancos izquierdo (x: 28..280) y derecho (x: 680..932) quedan TOTALMENTE
      // ABIERTOS EN AIRE LIMPIO para que el jugador suba sin ningún techo que bloquee.
      // -----------------------------------------------------------------------
      addGround(280, 290, 400, 36, true, false, true);
      [310, 370, 590, 650].forEach((cx) => {
        items.push({id: itemId++, x: cx, y: 240, vx: 0, vy: 0, type: 'crystal'});
      });

      // Ensure 100% of floating ledges and the summit gate floor in Level 4-3 are semi-solid one-way jump-through
      platforms.forEach((plat) => {
        if (plat.type === 'ground' && plat.y < 3480 && plat.y >= 290 && plat.width < 900) {
          plat.isOneWay = true;
        }
      });

      // GRAN PUERTA DE LA CIUDADELA GLACIAL EN LA CUMBRE (Descansa sobre y = 290)
      worldRef.current.glacialCitadelGate = {
        x: 340,
        y: 70,
        width: 280,
        height: 220,
        doorX: 430,
        doorY: 150,
        doorW: 100,
        doorH: 140,
      };
    } else if (lvl === 16) {
      // =======================================================================
      // NIVEL 4-B: EL TRONO DE LA EMPERATRIZ DE HIELO (STAGE DEDICADO DEL JEFE DE CLÍMAX)
      // Cámara completamente independiente, aislada y cerrada (960x540).
      // - Background: bg_frost_empress_throne (catedral gótica helada, lámparas de cristal)
      // - Animación constante de nieve cayendo en toda la pantalla
      // - Suelo permafrost plano a y = 440, 100% seguro sin trampas
      // - Kryona: 2000 HP, 9 spritesheets de animación
      // =======================================================================
      worldRef.current.levelWidth = 960;
      worldRef.current.levelHeight = 540;
      worldRef.current.checkpointX = 120;
      worldRef.current.checkpointY = 392;
      worldRef.current.beaconX = 99999;
      worldRef.current.beaconY = 340;
      worldRef.current.cameraX = 0;
      worldRef.current.cameraY = 0;
      worldRef.current.bossArenaActive = true;
      worldRef.current.bossDoorLocked = true;

      // Suelo 100% sólido y seguro en toda la arena (a y = 440)
      addGround(0, 440, 960, 100, true);

      // Muros perimetrales glaciales de permafrost y basalto
      platforms.push({x: 0, y: 0, width: 32, height: 440, type: 'ground', isIce: true});
      platforms.push({x: 928, y: 0, width: 32, height: 440, type: 'ground', isIce: true});

      // Pedestales de cristal de hielo simétricos para maniobras tácticas
      platforms.push({x: 90, y: 310, width: 120, height: 26, type: 'ground', isIce: true});
      platforms.push({x: 750, y: 310, width: 120, height: 26, type: 'ground', isIce: true});

      // Instanciación del Gran Jefe de Zona 4: Kryona (2000 HP)
      worldRef.current.boss = {
        type: 'FROST_EMPRESS',
        name: 'KRYONA - REINA DEL HIELO ETERNO',
        subtitle: 'Cuarta Comandante Sombría y Consorte de Ghotur (Fragmento 4/5)',
        x: 700,
        y: 280,
        width: 140,
        height: 160,
        vx: 0,
        vy: 0,
        hp: 2000,
        maxHp: 2000,
        phase: 1,
        state: 'IDLE',
        stateTimer: 0.8,
        facingRight: false,
        hurtTimer: 0,
        telegraphGlow: 0,
        wingFlap: 0,
        arenaLeft: 36,
        arenaRight: 924,
        groundY: 280, // Suelo en 440, 440 - 160 = 280
        displayedHp: 2000,
        trackTargetX: 700,
        trackTimer: 0,
        cascadeOrbs: [],
        cascadeTimer: 0,
        chargeDidLeap: false,
        pinballBouncesLeft: 0,
        lightningPillars: [],
        stalactites: [],
        punishedInStun: false,
        lastAttackType: '',
        comboStep: 0,
        comboLength: 2,
        squash: 1,
        stretch: 1,
        walkTimer: 0,
        animTimer: 0,
        animTime: 0,
      };
    } else if (lvl === 17) {
      // =======================================================================
      // NIVEL 5-1: EL INFIERNO ABISAL / EL OCASO DEL VACÍO (~8200px)
      // Un único nivel colosal, caótico, siniestro y expansivo antes de Ghotur.
      // - Background: bg_zone5_abyssal_inferno
      // - Nuevo Enemigo: Las Sombras del Abismo (mob_abyssal_shadow) con escalas procedurales
      // - Evolución Corrupta de Mobs: Escarabajos con fuego de vacío, Murciélagos con copias sombras,
      //   Gólems con picos oscuros, y Void Rays con rayos láser perforadores.
      // - Clímax a x ~ 8000: structure_void_throne_gate (portal cósmico de obsidiana y ojo escarlata).
      // =======================================================================
      worldRef.current.levelWidth = 8200;
      worldRef.current.levelHeight = 750;
      worldRef.current.checkpointX = 100;
      worldRef.current.checkpointY = 432;
      worldRef.current.safeRespawnX = 100;
      worldRef.current.safeRespawnY = 432;
      worldRef.current.beaconX = 99999;
      worldRef.current.beaconY = 340;
      worldRef.current.bleedingLightningFlash = 0;
      worldRef.current.bleedingLightningTimer = 3.5;

      // -----------------------------------------------------------------------
      // SEGMENTO 1: LAS PUERTAS DE LA DESOLACIÓN (0 a 2200px)
      // -----------------------------------------------------------------------
      addGround(0, 480, 800, 48, false, true);
      platforms.push({x: 360, y: 340, width: 44, height: 44, type: 'dynamo'});
      platforms.push({x: 430, y: 340, width: 44, height: 44, type: 'dynamo'});
      items.push({id: itemId++, x: 372, y: 290, vx: 0, vy: 0, type: 'storm_needle'});
      items.push({id: itemId++, x: 442, y: 290, vx: 0, vy: 0, type: 'resonant_core'});

      [180, 240, 300, 520, 580].forEach((cx) => {
        items.push({id: itemId++, x: cx, y: 430, vx: 0, vy: 0, type: 'crystal'});
      });

      // Primer Escarabajo Corrupto del Abismo (deja estela de fuego de vacío)
      enemies.push({
        id: enemyId++,
        x: 640,
        y: 424,
        width: 68,
        height: 46,
        type: 'crawler',
        vx: 110,
        vy: 0,
        initialY: 424,
        facingRight: false,
        minX: 500,
        maxX: 760,
        alive: true,
        hp: 55,
        maxHp: 55,
        isCorrupted: true,
        voidTrailTimer: 0.4,
      });

      // Primer Murciélago Abisal Aéreo (divide copias sombras en picado)
      enemies.push({
        id: enemyId++,
        x: 750,
        y: 190,
        width: 76,
        height: 58,
        type: 'volt_bat',
        vx: -120,
        vy: 0,
        initialY: 190,
        facingRight: false,
        alive: true,
        hp: 55,
        maxHp: 55,
        isCorrupted: true,
      });

      // Puentes de obsidiana quebrados y géiser de plasma de vacío
      addGround(880, 460, 280, 48, false, true);
      addGround(1000, 360, 160, 32, false, true);
      addGround(1240, 460, 360, 48, false, true);
      geysers.push({
        id: geyserId++,
        x: 1280,
        y: 450,
        width: 44,
        height: 20,
        cooldown: 0,
      });

      // PRIMERA SOMBRA DEL ABISMO: LURKER AMORFO ANCHO (scaleX: 1.6, scaleY: 0.8)
      enemies.push({
        id: enemyId++,
        x: 1450,
        y: 418,
        width: 94,
        height: 62,
        type: 'abyssal_shadow',
        vx: 0,
        vy: 0,
        initialY: 418,
        facingRight: false,
        alive: true,
        hp: 60,
        maxHp: 60,
        shadowVariant: 'LURKER',
        emerged: false,
        emergeTimer: 0,
        slumberX: 1450,
        slumberY: 418,
        teleportTimer: 3.5,
        shootTimer: 1.2,
      });

      // Primer Puerta de Dientes Trituradores de Obsidiana
      addGround(1680, 460, 260, 48, false, true);
      platforms.push({x: 1720, y: 140, width: 180, height: 28, type: 'ground', isVoid: true});
      crushingPillars.push({
        id: pillarId++,
        x: 1760,
        y: 168,
        startY: 168,
        floorY: 364,
        width: 64,
        height: 76,
        state: 'IDLE',
        timer: 1.2,
        slamSpeed: 820,
        riseSpeed: 85,
        idleDuration: 1.2,
        waitDuration: 0.8,
        proximityTrigger: 180,
        isVoidTeeth: true,
      });

      // -----------------------------------------------------------------------
      // CHECKPOINT 1: BALUARTE DE LAS RUINAS QUEBRADAS (x = 2050 a 2450)
      // -----------------------------------------------------------------------
      addGround(2000, 460, 450, 48, false, true);
      platforms.push({x: 2160, y: 320, width: 44, height: 44, type: 'dynamo'});
      items.push({id: itemId++, x: 2170, y: 270, vx: 0, vy: 0, type: 'heart_hp'});

      // -----------------------------------------------------------------------
      // SEGMENTO 2: EL DESFILADERO DEL OCASO Y ESPECTROS SLENDER (2450 a 4300px)
      // -----------------------------------------------------------------------
      platforms.push({x: 2450, y: 580, width: 450, height: 40, type: 'hazard'});
      addGround(2520, 400, 160, 32, false, true);
      addGround(2760, 340, 160, 32, false, true);

      // Primer Gólem Corrupto del Abismo (envía ondas de púas oscuras sísmicas)
      addGround(3000, 460, 440, 48, false, true);
      enemies.push({
        id: enemyId++,
        x: 3200,
        y: 375,
        width: 86,
        height: 96,
        type: 'golem',
        vx: 45,
        vy: 0,
        initialY: 375,
        facingRight: true,
        minX: 3050,
        maxX: 3380,
        alive: true,
        hp: 180,
        maxHp: 180,
        poundTimer: 2.2,
        isCorrupted: true,
      });

      // SEGUNDA SOMBRA: ESPECTRO ALTO Y ESBELTO (SPECTER: scaleX: 0.7, scaleY: 1.8)
      enemies.push({
        id: enemyId++,
        x: 2800,
        y: 250,
        width: 56,
        height: 112,
        type: 'abyssal_shadow',
        vx: 0,
        vy: 0,
        initialY: 250,
        facingRight: false,
        alive: true,
        hp: 60,
        maxHp: 60,
        shadowVariant: 'SPECTER',
        emerged: false,
        emergeTimer: 0,
        slumberX: 2800,
        slumberY: 250,
        teleportTimer: 3.0,
        shootTimer: 1.0,
      });

      // Rayo del Vacío (Void Ray: dispara rayo láser perforante en lugar de dardos)
      enemies.push({
        id: enemyId++,
        x: 3450,
        y: 180,
        width: 86,
        height: 46,
        type: 'sky_ray',
        vx: -110,
        vy: 0,
        initialY: 180,
        facingRight: false,
        alive: true,
        isCorrupted: true,
        shootTimer: 2.5,
        beamChargeTimer: 0,
      });

      // Doble Puerta de Dientes Trituradores de Obsidiana (x = 3580 y 3740)
      addGround(3520, 440, 420, 48, false, true);
      platforms.push({x: 3560, y: 140, width: 340, height: 28, type: 'ground', isVoid: true});
      crushingPillars.push({
        id: pillarId++,
        x: 3620,
        y: 168,
        startY: 168,
        floorY: 344,
        width: 64,
        height: 76,
        state: 'IDLE',
        timer: 0.4,
        slamSpeed: 860,
        riseSpeed: 95,
        idleDuration: 1.1,
        waitDuration: 0.8,
        isVoidTeeth: true,
      });
      crushingPillars.push({
        id: pillarId++,
        x: 3780,
        y: 168,
        startY: 168,
        floorY: 344,
        width: 64,
        height: 76,
        state: 'IDLE',
        timer: 1.2,
        slamSpeed: 860,
        riseSpeed: 95,
        idleDuration: 1.1,
        waitDuration: 0.8,
        isVoidTeeth: true,
      });

      // TERCERA SOMBRA: MINI SOMBRA VELOZ (MINI: scale 0.7x)
      enemies.push({
        id: enemyId++,
        x: 3960,
        y: 420,
        width: 48,
        height: 50,
        type: 'abyssal_shadow',
        vx: 120,
        vy: 0,
        initialY: 420,
        facingRight: true,
        alive: true,
        hp: 45,
        maxHp: 45,
        shadowVariant: 'MINI',
        emerged: false,
        emergeTimer: 0,
        slumberX: 3960,
        slumberY: 420,
        teleportTimer: 2.5,
        shootTimer: 0.8,
      });

      // -----------------------------------------------------------------------
      // CHECKPOINT 2: EL GRAN DESFILADERO DEL OCASO (x = 4150 a 4550)
      // -----------------------------------------------------------------------
      addGround(4100, 460, 450, 48, false, true);
      platforms.push({x: 4260, y: 320, width: 44, height: 44, type: 'dynamo'});
      items.push({id: itemId++, x: 4270, y: 270, vx: 0, vy: 0, type: 'heart_hp'});
      items.push({id: itemId++, x: 4340, y: 410, vx: 0, vy: 0, type: 'heart_1up'});

      // -----------------------------------------------------------------------
      // SEGMENTO 3: LA TERRAZA DE LOS ESPECTROS Y WRAITHS GIGANTES (4550 a 6400px)
      // -----------------------------------------------------------------------
      platforms.push({x: 4550, y: 580, width: 600, height: 40, type: 'hazard'});

      // Plataformas de obsidiana móviles sobre el abismo de fuego de vacío
      platforms.push({
        x: 4620,
        y: 420,
        width: 120,
        height: 32,
        type: 'ground',
        isVoid: true,
        moving: true,
        moveAxis: 'x',
        moveMin: 4580,
        moveMax: 4800,
        moveSpeed: 80,
        moveDir: 1,
      });

      addGround(4880, 360, 140, 32, false, true);
      geysers.push({
        id: geyserId++,
        x: 4930,
        y: 350,
        width: 44,
        height: 20,
        cooldown: 0,
      });

      // CUARTA SOMBRA: WRAITH GIGANTE COLOSAL (WRAITH: scale 1.5x)
      addGround(5120, 460, 520, 48, false, true);
      enemies.push({
        id: enemyId++,
        x: 5320,
        y: 370,
        width: 106,
        height: 110,
        type: 'abyssal_shadow',
        vx: 0,
        vy: 0,
        initialY: 370,
        facingRight: false,
        alive: true,
        hp: 90,
        maxHp: 90,
        shadowVariant: 'WRAITH',
        emerged: false,
        emergeTimer: 0,
        slumberX: 5320,
        slumberY: 370,
        teleportTimer: 3.8,
        shootTimer: 1.0,
      });

      // Escarabajo Corrupto patrullando con fuego de vacío
      enemies.push({
        id: enemyId++,
        x: 5480,
        y: 424,
        width: 68,
        height: 46,
        type: 'crawler',
        vx: -105,
        vy: 0,
        initialY: 424,
        facingRight: false,
        minX: 5180,
        maxX: 5580,
        alive: true,
        hp: 55,
        maxHp: 55,
        isCorrupted: true,
        voidTrailTimer: 0.4,
      });

      // Murciélago Abisal con enjambre sombra
      enemies.push({
        id: enemyId++,
        x: 5650,
        y: 200,
        width: 76,
        height: 58,
        type: 'volt_bat',
        vx: -115,
        vy: 0,
        initialY: 200,
        facingRight: false,
        alive: true,
        hp: 55,
        maxHp: 55,
        isCorrupted: true,
      });

      // Arcos de obsidiana con bloques trituradores de dientes
      addGround(5740, 440, 450, 48, false, true);
      platforms.push({x: 5800, y: 140, width: 220, height: 28, type: 'ground', isVoid: true});
      crushingPillars.push({
        id: pillarId++,
        x: 5860,
        y: 168,
        startY: 168,
        floorY: 344,
        width: 64,
        height: 76,
        state: 'IDLE',
        timer: 0.9,
        slamSpeed: 880,
        riseSpeed: 95,
        idleDuration: 1.1,
        waitDuration: 0.8,
        isVoidTeeth: true,
      });

      // QUINTA SOMBRA: SPECTER DE FONDO (scaleX: 0.7, scaleY: 1.8)
      enemies.push({
        id: enemyId++,
        x: 6060,
        y: 360,
        width: 56,
        height: 112,
        type: 'abyssal_shadow',
        vx: 0,
        vy: 0,
        initialY: 360,
        facingRight: false,
        alive: true,
        hp: 60,
        maxHp: 60,
        shadowVariant: 'SPECTER',
        emerged: false,
        emergeTimer: 0,
        slumberX: 6060,
        slumberY: 360,
        teleportTimer: 3.2,
        shootTimer: 1.2,
      });

      // -----------------------------------------------------------------------
      // CHECKPOINT 3: LA TERRAZA DE LOS ESPECTROS (x = 6250 a 6650)
      // -----------------------------------------------------------------------
      addGround(6200, 460, 450, 48, false, true);
      platforms.push({x: 6360, y: 320, width: 44, height: 44, type: 'dynamo'});
      items.push({id: itemId++, x: 6370, y: 270, vx: 0, vy: 0, type: 'resonant_core'});

      // -----------------------------------------------------------------------
      // SEGMENTO 4: EL CAMINO AL TRONO DEL VACÍO & CLÍMAX (6650 a 8200px)
      // -----------------------------------------------------------------------
      platforms.push({x: 6650, y: 580, width: 450, height: 40, type: 'hazard'});
      addGround(6720, 420, 160, 32, false, true);
      addGround(6960, 440, 450, 48, false, true);

      // Dúo Élite: Gólem Corrupto + Void Ray Láser
      enemies.push({
        id: enemyId++,
        x: 7120,
        y: 355,
        width: 86,
        height: 96,
        type: 'golem',
        vx: -45,
        vy: 0,
        initialY: 355,
        facingRight: false,
        minX: 7000,
        maxX: 7300,
        alive: true,
        hp: 180,
        maxHp: 180,
        poundTimer: 2.0,
        isCorrupted: true,
      });

      enemies.push({
        id: enemyId++,
        x: 7260,
        y: 180,
        width: 86,
        height: 46,
        type: 'sky_ray',
        vx: 110,
        vy: 0,
        initialY: 180,
        facingRight: true,
        alive: true,
        isCorrupted: true,
        shootTimer: 2.2,
        beamChargeTimer: 0,
      });

      // SEXTA SOMBRA: WRAITH GUARDANDO EL PORTAL FINAL
      enemies.push({
        id: enemyId++,
        x: 7480,
        y: 370,
        width: 106,
        height: 110,
        type: 'abyssal_shadow',
        vx: 0,
        vy: 0,
        initialY: 370,
        facingRight: false,
        alive: true,
        hp: 90,
        maxHp: 90,
        shadowVariant: 'WRAITH',
        emerged: false,
        emergeTimer: 0,
        slumberX: 7480,
        slumberY: 370,
        teleportTimer: 3.5,
        shootTimer: 0.9,
      });

      // MESETA FINAL DEL TRONO DEL VACÍO (7650 a 8200 a y = 440)
      addGround(7580, 440, 620, 60, false, true);

      // Cristales de recompensa en arco triunfal
      [7640, 7700, 7760, 7820, 7880, 7940, 8000].forEach((cx) => {
        items.push({id: itemId++, x: cx, y: 390, vx: 0, vy: 0, type: 'crystal'});
      });

      // MONUMENTAL PUERTA DEL TRONO DEL VACÍO (structure_void_throne_gate)
      worldRef.current.voidThroneGate = {
        x: 7750,
        y: 90,
        width: 380,
        height: 360,
        doorX: 7890,
        doorY: 240,
        doorW: 100,
        doorH: 200,
      };
    } else if (lvl === 18) {
      // =======================================================================
      // NIVEL 5-B: EL TRONO DEL CAOS (SALA FINAL 1: GHOTUR NOBLE DEMONIO)
      // Cámara fija (960x540), catedral gótica de obsidiana, ventanales al vórtice violeta
      // Suelo de mármol pulido seguro a y = 440 (100% sólido).
      // Ghotur Humanoide: HP 2200, faja señorial, cuernos de carnero, magia dual fuego/hielo,
      // teletransporte flash-step sombrío, y levitación con poder supremo combinado.
      // =======================================================================
      worldRef.current.levelWidth = 960;
      worldRef.current.levelHeight = 540;
      worldRef.current.checkpointX = 120;
      worldRef.current.checkpointY = 392;
      worldRef.current.beaconX = 99999;
      worldRef.current.beaconY = 340;
      worldRef.current.cameraX = 0;
      worldRef.current.cameraY = 0;
      worldRef.current.bossArenaActive = true;
      worldRef.current.bossDoorLocked = true;

      // Suelo 100% sólido de mármol pulido
      addGround(0, 440, 960, 100, false, false);

      // Muros perimetrales góticos de obsidiana
      platforms.push({x: 0, y: 0, width: 32, height: 440, type: 'ground', isVoid: true});
      platforms.push({x: 928, y: 0, width: 32, height: 440, type: 'ground', isVoid: true});

      // Pedestales de mármol pulido elevados simétricos para maniobras tácticas
      platforms.push({x: 90, y: 310, width: 130, height: 26, type: 'ground'});
      platforms.push({x: 740, y: 310, width: 130, height: 26, type: 'ground'});

      // Instanciación de Ghotur Forma 1 (Humanoide / Noble Demonio - 2200 HP)
      worldRef.current.boss = {
        type: 'GHOTUR_HUMANOID',
        name: 'GHOTUR — TIRANO DIMENSIONAL',
        subtitle: 'Soberano del Caos (Forma Noble)',
        x: 700,
        y: 280,
        width: 144,
        height: 160,
        vx: 0,
        vy: 0,
        hp: 2200,
        maxHp: 2200,
        phase: 1,
        state: 'IDLE',
        stateTimer: 0.8,
        facingRight: false,
        hurtTimer: 0,
        telegraphGlow: 0,
        wingFlap: 0,
        arenaLeft: 36,
        arenaRight: 924,
        groundY: 280, // 440 - 160 = 280
        displayedHp: 2200,
        trackTargetX: 700,
        trackTimer: 0,
        cascadeOrbs: [],
        cascadeTimer: 0,
        chargeDidLeap: false,
        pinballBouncesLeft: 0,
        lightningPillars: [],
        stalactites: [],
        punishedInStun: false,
        lastAttackType: '',
        comboStep: 0,
        comboLength: 2,
        combinedPowerStep: 0,
        desperationTimer: 0,
        collapseTimer: 0,
        squash: 1,
        stretch: 1,
        walkTimer: 0,
        animTimer: 0,
        animTime: 0,
      };
    } else if (lvl === 19) {
      // =======================================================================
      // NIVEL 5-FINAL: EL NÚCLEO DEL ABISMO COLAPSADO (SALA FINAL 2: TITÁN DEMONÍACO)
      // Cámara fija (960x540), núcleo dimensional desgarrado, magma hirviente, monolitos
      // Ghotur Forma 2 Colosal: HP 2500, empuñando el Tridente Demoníaco del Vacío
      // =======================================================================
      worldRef.current.levelWidth = 960;
      worldRef.current.levelHeight = 540;
      worldRef.current.checkpointX = 120;
      worldRef.current.checkpointY = 392;
      worldRef.current.beaconX = 99999;
      worldRef.current.beaconY = 340;
      worldRef.current.cameraX = 0;
      worldRef.current.cameraY = 0;
      worldRef.current.bossArenaActive = true;
      worldRef.current.bossDoorLocked = true;

      // Suelo 100% sólido de basalto y monolitos del abismo (a y = 440)
      addGround(0, 440, 960, 100, false, true);

      // Muros colapsados del abismo
      platforms.push({x: 0, y: 0, width: 32, height: 440, type: 'ground', isVoid: true});
      platforms.push({x: 928, y: 0, width: 32, height: 440, type: 'ground', isVoid: true});

      // Monolitos flotantes que tiemblan con la furia del coloso
      platforms.push({x: 90, y: 310, width: 130, height: 26, type: 'ground', isVoid: true});
      platforms.push({x: 740, y: 310, width: 130, height: 26, type: 'ground', isVoid: true});

      // Instanciación de Ghotur Forma 2 (Colosal / Titán Demoníaco Descomunal - 2500 HP)
      // Wields EXCLUSIVELY the colossal Demon Trident (Trishula del Vacío)
      worldRef.current.boss = {
        type: 'GHOTUR_DEMON',
        name: 'GHOTUR — TITÁN DEMONÍACO DESCOMUNAL',
        subtitle: 'El Tirano del Núcleo Fragmentado (Fragmento Mayor 5/5)',
        x: 640,
        y: 230,
        width: 220,
        height: 210,
        vx: 0,
        vy: 0,
        hp: 2500,
        maxHp: 2500,
        phase: 1,
        state: 'IDLE',
        stateTimer: 0.8,
        facingRight: false,
        hurtTimer: 0,
        telegraphGlow: 0,
        wingFlap: 0,
        arenaLeft: 36,
        arenaRight: 924,
        groundY: 230, // 440 - 210 = 230
        displayedHp: 2500,
        trackTargetX: 640,
        trackTimer: 0,
        cascadeOrbs: [],
        cascadeTimer: 0,
        chargeDidLeap: false,
        pinballBouncesLeft: 0,
        lightningPillars: [],
        stalactites: [],
        punishedInStun: false,
        lastAttackType: '',
        comboStep: 0,
        comboLength: 2,
        squash: 1,
        stretch: 1,
        walkTimer: 0,
        animTimer: 0,
        animTime: 0,
      };
    }

    // Apply Devil Mode (Difícil) Multipliers if active
    if (difficultyRef.current === 'DEVIL') {
      // 1. Health pickups are ultra-rare: convert most hearts into crystals
      items.forEach((it) => {
        if (it.type === 'heart_hp' || it.type === 'heart_1up') {
          if (Math.random() < 0.8) {
            it.type = 'crystal';
          }
        }
      });

      // 2. Extra Nuisance Mobs for Zone 1: Heterogeneous mix (beetles & flyers desynchronized)
      if (lvl === 2 || lvl === 3) {
        for (let k = 0; k < 5; k++) {
          const mType: 'crawler' | 'sky_ray' = k % 2 === 0 ? 'crawler' : 'sky_ray';
          enemies.push({
            id: enemyId++,
            x: 750 + k * 480 + (Math.random() - 0.5) * 60,
            y: mType === 'crawler' ? 410 : 180 + (k % 3) * 30,
            width: mType === 'crawler' ? 58 : 72,
            height: 38,
            type: mType,
            vx: (Math.random() > 0.5 ? 1 : -1) * (100 + Math.random() * 35),
            vy: 0,
            initialY: mType === 'crawler' ? 410 : 180 + (k % 3) * 30,
            facingRight: Math.random() > 0.5,
            alive: true,
            hp: 40,
            maxHp: 40,
            shootTimer: 1.0 + Math.random() * 2.0,
          });
        }
      }

      // 3. Cumbre Helada (4-3): Swarm of aerial frost bats with staggered spawn altitudes
      if (lvl === 15) {
        for (let bIdx = 0; bIdx < 6; bIdx++) {
          enemies.push({
            id: enemyId++,
            x: 160 + (bIdx % 4) * 180 + (Math.random() - 0.5) * 40,
            y: 3100 - bIdx * 380,
            width: 60,
            height: 44,
            type: 'volt_bat',
            vx: (bIdx % 2 === 0 ? 1 : -1) * (110 + Math.random() * 30),
            vy: 0,
            initialY: 3100 - bIdx * 380,
            facingRight: bIdx % 2 === 0,
            alive: true,
            hp: 60,
            maxHp: 60,
            isFrostVariant: true,
            shootTimer: 1.2 + Math.random() * 1.5,
          });
        }
      }

      // 4. LORE COMPLIANCE: Sombras Espectrales DO NOT spawn in Zone 3 or Zone 4!
      // In Zone 3 & 4 (lvl 9 to 16), spawn heterogeneous native elite reinforcements:
      if (lvl >= 9 && lvl <= 16) {
        const eliteCount = lvl === 12 || lvl === 16 ? 2 : 3;
        for (let eIdx = 0; eIdx < eliteCount; eIdx++) {
          const eX = 900 + eIdx * 1100 + (Math.random() - 0.5) * 80;
          const isZone4 = lvl >= 13;
          const archetypes: Array<'golem' | 'volt_bat' | 'turret' | 'crawler'> = [
            'golem',
            'volt_bat',
            'turret',
            'crawler',
          ];
          const chosenArch = archetypes[(eIdx + lvl) % archetypes.length];
          enemies.push({
            id: enemyId++,
            x: eX,
            y: chosenArch === 'volt_bat' ? 200 : 380,
            width: chosenArch === 'golem' ? 76 : chosenArch === 'volt_bat' ? 64 : 58,
            height: chosenArch === 'golem' ? 82 : chosenArch === 'volt_bat' ? 48 : 38,
            type: chosenArch,
            vx: (Math.random() > 0.5 ? 1 : -1) * (chosenArch === 'golem' ? 50 : 100),
            vy: 0,
            initialY: chosenArch === 'volt_bat' ? 200 : 380,
            facingRight: Math.random() > 0.5,
            alive: true,
            hp: chosenArch === 'golem' ? 150 : 60,
            maxHp: chosenArch === 'golem' ? 150 : 60,
            isFrostVariant: isZone4,
            shootTimer: 1.0 + Math.random() * 1.8,
            poundTimer: 2.2 + Math.random(),
          });
        }
      }

      // 5. ZONE 5 (EL INFIERNO ABISAL) EXCLUSIVE: Massive Sombras Espectrales Invasions!
      // Procedural morphology variations (WRAITH, SPECTER, MINI, LURKER)
      if (lvl === 17) {
        const shadowVariants: Array<'WRAITH' | 'SPECTER' | 'MINI' | 'LURKER'> = [
          'WRAITH',
          'SPECTER',
          'MINI',
          'LURKER',
        ];
        for (let sIdx = 0; sIdx < 5; sIdx++) {
          const sX = 1100 + sIdx * 1350 + (Math.random() - 0.5) * 120;
          const variant = shadowVariants[sIdx % shadowVariants.length];
          const sW = variant === 'WRAITH' ? 110 : variant === 'SPECTER' ? 56 : variant === 'MINI' ? 44 : 96;
          const sH = variant === 'WRAITH' ? 115 : variant === 'SPECTER' ? 116 : variant === 'MINI' ? 46 : 64;
          const sHp = variant === 'WRAITH' ? 180 : variant === 'LURKER' ? 150 : variant === 'SPECTER' ? 120 : 90;

          enemies.push({
            id: enemyId++,
            x: sX,
            y: variant === 'MINI' ? 240 : variant === 'SPECTER' ? 260 : 380,
            width: sW,
            height: sH,
            type: 'abyssal_shadow',
            vx: (Math.random() > 0.5 ? 1 : -1) * (variant === 'MINI' ? 120 : 60),
            vy: 0,
            initialY: variant === 'MINI' ? 240 : variant === 'SPECTER' ? 260 : 380,
            facingRight: Math.random() > 0.5,
            alive: true,
            hp: sHp,
            maxHp: sHp,
            shadowVariant: variant,
            emerged: true,
            teleportTimer: 2.0 + Math.random() * 1.5,
            shootTimer: 0.8 + Math.random() * 1.2,
          });
        }
      }

      // 6. HETEROGENEOUS REINFORCEMENTS (NO CLONES IN A ROW):
      // Each enemy gets paired with a DIFFERENT archetype, staggered X (+80px/+140px),
      // opposite initial patrol direction, and desynchronized attack timers.
      const variedReinforcements: EnemyEntity[] = [];
      enemies.forEach((orig) => {
        // Boost original
        orig.hp = Math.round((orig.hp || 30) * 1.6);
        orig.maxHp = Math.round((orig.maxHp || 30) * 1.6);
        orig.vx *= 1.35;
        orig.shootTimer = 1.2 + Math.random() * 1.5;

        // Skip adding clones to shadows
        if (orig.type === 'abyssal_shadow') return;

        // Pick an opposing archetype for variety
        let complementaryType: 'crawler' | 'sky_ray' | 'turret' | 'golem' | 'volt_bat' = 'volt_bat';
        if (orig.type === 'crawler') {
          complementaryType = Math.random() > 0.5 ? 'sky_ray' : 'turret';
        } else if (orig.type === 'sky_ray') {
          complementaryType = Math.random() > 0.5 ? 'crawler' : 'golem';
        } else if (orig.type === 'golem') {
          complementaryType = 'volt_bat';
        } else if (orig.type === 'volt_bat') {
          complementaryType = Math.random() > 0.5 ? 'crawler' : 'golem';
        } else if (orig.type === 'turret') {
          complementaryType = 'golem';
        }

        const compW = complementaryType === 'golem' ? 72 : complementaryType === 'sky_ray' ? 72 : 58;
        const compH = complementaryType === 'golem' ? 80 : complementaryType === 'turret' ? 86 : 38;
        const compY = complementaryType === 'sky_ray' || complementaryType === 'volt_bat' ? orig.initialY - 80 : orig.initialY;

        variedReinforcements.push({
          id: enemyId++,
          x: Math.max(60, orig.x + (Math.random() > 0.5 ? 90 : -90) + (Math.random() - 0.5) * 40),
          y: compY,
          width: compW,
          height: compH,
          type: complementaryType,
          vx: (Math.random() > 0.5 ? 1 : -1) * (85 + Math.random() * 40),
          vy: 0,
          initialY: compY,
          facingRight: Math.random() > 0.5,
          alive: true,
          hp: Math.round((orig.hp || 30) * 1.2),
          maxHp: Math.round((orig.maxHp || 30) * 1.2),
          isFrostVariant: orig.isFrostVariant,
          isCorrupted: orig.isCorrupted,
          shootTimer: 0.8 + Math.random() * 2.2,
          poundTimer: 2.0 + Math.random(),
        });
      });
      enemies.push(...variedReinforcements);

      // 7. Boss 2x HP in Devil Mode & Aggressive Cadence
      if (worldRef.current.boss) {
        const b = worldRef.current.boss;
        b.maxHp = Math.round(b.maxHp * 1.8);
        b.hp = b.maxHp;
        b.displayedHp = b.maxHp;

        // Ghotur Phase 1 (Devil Mode): Immediately starts with abyssal shadow cohort
        if (b.type === 'GHOTUR_HUMANOID') {
          const variants: Array<'SPECTER' | 'MINI' | 'LURKER'> = ['SPECTER', 'MINI', 'LURKER'];
          for (let sp = 0; sp < 3; sp++) {
            const v = variants[sp % variants.length];
            enemies.push({
              id: enemyId++,
              x: 180 + sp * 260,
              y: v === 'MINI' ? 220 : 370,
              width: v === 'SPECTER' ? 56 : v === 'MINI' ? 44 : 96,
              height: v === 'SPECTER' ? 116 : v === 'MINI' ? 46 : 64,
              type: 'abyssal_shadow',
              vx: (Math.random() > 0.5 ? 1 : -1) * (v === 'MINI' ? 120 : 60),
              vy: 0,
              initialY: v === 'MINI' ? 220 : 370,
              facingRight: false,
              alive: true,
              hp: 120,
              maxHp: 120,
              shadowVariant: v,
              emerged: true,
              teleportTimer: 1.8 + sp * 0.8,
              shootTimer: 0.8 + sp * 0.4,
            });
          }
        }
      }
    }

    worldRef.current.platforms = platforms;
    worldRef.current.crushingPillars = crushingPillars;
    worldRef.current.geysers = geysers;
    worldRef.current.items = items;
    worldRef.current.enemies = enemies;
    worldRef.current.bonusConduits = bonusConduits;
    worldRef.current.boulders = boulders;
    worldRef.current.icicles = icicles;
    worldRef.current.projectiles = [];
    worldRef.current.particles = [];

    if (lvl === 1) {
      worldRef.current.stageBanner = {
        title: 'NIVEL 1-1',
        name: 'EL VALLE DE LOS ESCOMBROS',
        subtitle: 'Mouler emprende el viaje sobre la aldea orgriniana arrasada',
        accentColor: '#38bdf8',
      };
      worldRef.current.stageBannerTimer = 3.5;
    } else if (lvl === 2) {
      worldRef.current.stageBanner = {
        title: 'NIVEL 1-2',
        name: 'CAÑÓN DE LOS RELÁMPAGOS',
        subtitle: 'Territorio de corrientes extremas',
        accentColor: '#f97316',
      };
      worldRef.current.stageBannerTimer = 3.5;
    } else if (lvl === 3) {
      worldRef.current.stageBanner = {
        title: 'NIVEL 1-3',
        name: 'RUINAS DE LA TORMENTA',
        subtitle: 'Hacia la entrada de la Pirámide Ancestral',
        accentColor: '#38bdf8',
      };
      worldRef.current.stageBannerTimer = 3.5;
    } else if (lvl === 4) {
      worldRef.current.stageBanner = {
        title: 'NIVEL 1-B • JEFE DE ZONA 1',
        name: 'EL SALÓN DEL GUARDIÁN',
        subtitle: 'Comandante 1: Escarabajo Quimérico Titánico (Fragmento 1/5)',
        accentColor: '#c084fc',
      };
      worldRef.current.stageBannerTimer = 3.5;
    } else if (lvl === 5) {
      worldRef.current.stageBanner = {
        title: 'NIVEL 2-1 • ZONA 2',
        name: 'ENTRADA A LAS CATACUMBAS',
        subtitle: 'Las Catacumbas de Cristal Oscuro',
        accentColor: '#c084fc',
      };
      worldRef.current.stageBannerTimer = 3.5;
    } else if (lvl === 6) {
      worldRef.current.stageBanner = {
        title: 'NIVEL 2-2 • ZONA 2',
        name: 'EL ABISMO RESONANTE',
        subtitle: 'Cascadas subterráneas y plataformas móviles',
        accentColor: '#22d3ee',
      };
      worldRef.current.stageBannerTimer = 3.5;
    } else if (lvl === 7) {
      worldRef.current.stageBanner = {
        title: 'NIVEL 2-3 • ZONA 2',
        name: 'LA CIUDADELA SUBTERRÁNEA',
        subtitle: 'La Aguja de Cristal hacia la Cueva Ancestral',
        accentColor: '#e879f9',
      };
      worldRef.current.stageBannerTimer = 3.5;
    } else if (lvl === 8) {
      worldRef.current.stageBanner = {
        title: 'NIVEL 2-B • JEFE DE ZONA 2',
        name: 'LA GUARIDA DEL DRAGÓN',
        subtitle: 'Comandante 2: Colosal Dragón Umbrío de Obsidiana (Fragmento 2/5)',
        accentColor: '#f97316',
      };
      worldRef.current.stageBannerTimer = 3.5;
    } else if (lvl === 9) {
      worldRef.current.stageBanner = {
        title: 'NIVEL 3-1 • ZONA 3',
        name: 'LA FORTALEZA DE LA ESTRATOSFERA',
        subtitle: 'Plataformas flotantes y guardianes aplastantes',
        accentColor: '#38bdf8',
      };
      worldRef.current.stageBannerTimer = 3.5;
    } else if (lvl === 10) {
      worldRef.current.stageBanner = {
        title: 'NIVEL 3-2 • ZONA 3',
        name: 'LA AGUJA DEL TRUENO',
        subtitle: 'Ascenso vertical entre engranajes y conductos',
        accentColor: '#facc15',
      };
      worldRef.current.stageBannerTimer = 3.5;
    } else if (lvl === 11) {
      worldRef.current.stageBanner = {
        title: 'NIVEL 3-3 • ZONA 3',
        name: 'EL SANTUARIO CELESTIAL',
        subtitle: 'La cumbre sobre las nubes hacia la Puerta Celestial',
        accentColor: '#818cf8',
      };
      worldRef.current.stageBannerTimer = 3.5;
    } else if (lvl === 12) {
      worldRef.current.stageBanner = {
        title: 'NIVEL 3-B • GRAN JEFE DE ZONA 3',
        name: 'EL TRONO CELESTIAL',
        subtitle: 'Comandante 3: Dios Cósmico Asura de múltiples brazos (Fragmento 3/5)',
        accentColor: '#fbbf24',
      };
      worldRef.current.stageBannerTimer = 3.5;
    } else if (lvl === 13) {
      worldRef.current.stageBanner = {
        title: 'NIVEL 4-1 • ZONA 4',
        name: 'EL VALLE GLACIAL',
        subtitle: 'Permafrost resbaladizo, grietas polares y especies heladas',
        accentColor: '#38bdf8',
      };
      worldRef.current.stageBannerTimer = 3.5;
    } else if (lvl === 14) {
      worldRef.current.stageBanner = {
        title: 'NIVEL 4-2 • ZONA 4',
        name: 'EL PASO DE LA AVALANCHA',
        subtitle: 'Persecución vertiginosa con la roca glacial pendiente abajo',
        accentColor: '#06b6d4',
      };
      worldRef.current.stageBannerTimer = 3.5;
    } else if (lvl === 15) {
      worldRef.current.stageBanner = {
        title: 'NIVEL 4-3 • ZONA 4',
        name: 'LA CUMBRE HELADA',
        subtitle: 'Ascenso vertical continuo hacia la Ciudadela Glacial',
        accentColor: '#a5f3fc',
      };
      worldRef.current.stageBannerTimer = 3.5;
    } else if (lvl === 16) {
      worldRef.current.stageBanner = {
        title: 'NIVEL 4-B • GRAN JEFA DE ZONA 4',
        name: 'EL TRONO DE LA REINA DE HIELO',
        subtitle: 'Comandante 4: Reina de Hielo Kryona — Consorte de Ghotur (Fragmento 4/5)',
        accentColor: '#38bdf8',
      };
      worldRef.current.stageBannerTimer = 3.5;
    } else if (lvl === 17) {
      worldRef.current.stageBanner = {
        title: 'NIVEL 5-1 • ZONA 5',
        name: 'EL INFIERNO ABISAL',
        subtitle: 'El Ocaso del Vacío — El Último Bastión antes de Ghotur',
        accentColor: '#e11d48',
      };
      worldRef.current.stageBannerTimer = 3.8;
    } else if (lvl === 18) {
      worldRef.current.stageBanner = {
        title: 'FASE 5-B • CLÍMAX FINAL',
        name: 'EL TRONO DEL CAOS',
        subtitle: 'Ghotur — Tirano Dimensional (Forma Noble)',
        accentColor: '#c084fc',
      };
      worldRef.current.stageBannerTimer = 3.8;
    } else {
      worldRef.current.stageBanner = {
        title: 'FASE 5-FINAL • BATALLA DEFINITIVA',
        name: 'EL NÚCLEO COLAPSADO',
        subtitle: 'Ghotur — Titán Demoníaco Descomunal (Fragmento Mayor 5/5)',
        accentColor: '#ef4444',
      };
      worldRef.current.stageBannerTimer = 4.0;
    }

    const weatherParticles: WeatherParticle[] = [];
    const count = lvl === 19 ? 55 : lvl === 18 ? 40 : lvl === 17 ? 50 : lvl >= 13 ? 38 : lvl === 12 ? 35 : lvl >= 9 ? 35 : 30;
    for (let i = 0; i < count; i++) {
      if (lvl === 19) {
        // Sala Final 2: Swirling abyss magma embers, cosmic void shards, and meteor dust
        weatherParticles.push({
          x: Math.random() * canvasWidth,
          y: Math.random() * canvasHeight,
          vx: -50 - Math.random() * 80,
          vy: 30 + Math.random() * 60,
          size: 1.8 + Math.random() * 3.4,
          color: Math.random() > 0.4 ? '#ef4444' : Math.random() > 0.5 ? '#f97316' : '#a855f7',
          alpha: 0.45 + Math.random() * 0.45,
          sway: Math.random() * Math.PI * 2,
          swaySpeed: 3.0 + Math.random() * 2.5,
        });
      } else if (lvl === 18) {
        // Sala Final 1: Floating purple and silver chaos stardust in the sanctum cathedral
        weatherParticles.push({
          x: Math.random() * canvasWidth,
          y: Math.random() * canvasHeight,
          vx: (Math.random() - 0.5) * 30,
          vy: -(15 + Math.random() * 30),
          size: 1.6 + Math.random() * 3.0,
          color: Math.random() > 0.4 ? '#c084fc' : Math.random() > 0.5 ? '#e2e8f0' : '#818cf8',
          alpha: 0.4 + Math.random() * 0.45,
          sway: Math.random() * Math.PI * 2,
          swaySpeed: 2.2 + Math.random() * 2,
        });
      } else if (lvl === 17) {
        weatherParticles.push({
          x: Math.random() * (canvasWidth + 200),
          y: Math.random() * canvasHeight,
          vx: -40 - Math.random() * 60,
          vy: 20 + Math.random() * 40,
          size: 1.8 + Math.random() * 3.0,
          color: Math.random() > 0.4 ? '#e11d48' : Math.random() > 0.5 ? '#a855f7' : '#f43f5e',
          alpha: 0.45 + Math.random() * 0.45,
          sway: Math.random() * Math.PI * 2,
          swaySpeed: 2.5 + Math.random() * 2.5,
        });
      } else if (lvl === 16) {
        // Nivel 4-B: Rich atmospheric snowfall with gentle sine drift across the entire screen
        weatherParticles.push({
          x: Math.random() * canvasWidth,
          y: Math.random() * canvasHeight,
          vx: (Math.random() - 0.5) * 20,
          vy: 65 + Math.random() * 35,
          size: 1.6 + Math.random() * 2.8,
          color: Math.random() > 0.35 ? '#ffffff' : '#a5f3fc',
          alpha: 0.4 + Math.random() * 0.45,
          sway: Math.random() * Math.PI * 2,
          swaySpeed: 1.6 + Math.random() * 1.8,
        });
      } else if (lvl >= 13) {
        // Zona 4: Ventisca glacial y nieve aullante con motes de aurora boreal
        weatherParticles.push({
          x: Math.random() * (canvasWidth + 200),
          y: Math.random() * canvasHeight,
          vx: lvl === 15 ? (Math.random() - 0.5) * 60 : -100 - Math.random() * 80,
          vy: lvl === 15 ? -(35 + Math.random() * 65) : 130 + Math.random() * 90,
          size: 1.8 + Math.random() * 2.8,
          color: Math.random() > 0.4 ? '#ffffff' : Math.random() > 0.5 ? '#a5f3fc' : '#38bdf8',
          alpha: 0.4 + Math.random() * 0.45,
          sway: Math.random() * Math.PI * 2,
          swaySpeed: 2.2 + Math.random() * 2,
        });
      } else if (lvl === 12) {
        // Nivel 3-B: El Trono Celestial (Cosmic stardust, divine golden & violet astral motes)
        weatherParticles.push({
          x: Math.random() * canvasWidth,
          y: Math.random() * canvasHeight,
          vx: (Math.random() - 0.5) * 26,
          vy: -(16 + Math.random() * 32),
          size: 1.8 + Math.random() * 3.2,
          color: Math.random() > 0.4 ? '#facc15' : Math.random() > 0.5 ? '#818cf8' : '#38bdf8',
          alpha: 0.4 + Math.random() * 0.45,
          sway: Math.random() * Math.PI * 2,
          swaySpeed: 2.0 + Math.random() * 2,
        });
      } else if (lvl === 9) {
        // Nivel 3-1: Estratosfera (vientos de alta altitud, motes eléctricos cian y niebla)
        weatherParticles.push({
          x: Math.random() * (canvasWidth + 200),
          y: Math.random() * canvasHeight,
          vx: 45 + Math.random() * 55,
          vy: (Math.random() - 0.5) * 20,
          size: 1.5 + Math.random() * 2.5,
          color: Math.random() > 0.4 ? '#38bdf8' : '#e0f2fe',
          alpha: 0.35 + Math.random() * 0.45,
          sway: Math.random() * Math.PI * 2,
          swaySpeed: 2.4 + Math.random() * 2,
        });
      } else if (lvl === 10) {
        // Nivel 3-2: La Aguja del Trueno (ascenso de corrientes de chispas doradas/ámbar)
        weatherParticles.push({
          x: Math.random() * (canvasWidth + 200),
          y: Math.random() * canvasHeight,
          vx: (Math.random() - 0.5) * 30,
          vy: -(30 + Math.random() * 55),
          size: 1.6 + Math.random() * 2.8,
          color: Math.random() > 0.4 ? '#facc15' : '#f59e0b',
          alpha: 0.4 + Math.random() * 0.45,
          sway: Math.random() * Math.PI * 2,
          swaySpeed: 2.8 + Math.random() * 2,
        });
      } else if (lvl === 11) {
        // Nivel 3-3: Santuario Celestial (polvo estelar de nebulosa y chispas de runa cósmica)
        weatherParticles.push({
          x: Math.random() * (canvasWidth + 200),
          y: Math.random() * canvasHeight,
          vx: (Math.random() - 0.5) * 24,
          vy: -(12 + Math.random() * 24),
          size: 1.8 + Math.random() * 3.0,
          color: Math.random() > 0.5 ? '#818cf8' : Math.random() > 0.5 ? '#c084fc' : '#fde047',
          alpha: 0.45 + Math.random() * 0.45,
          sway: Math.random() * Math.PI * 2,
          swaySpeed: 1.8 + Math.random() * 2,
        });
      } else if (lvl === 8) {
        // Nivel 2-B: La Guarida del Dragón (Glowing fiery embers, magma motes, and soot)
        weatherParticles.push({
          x: Math.random() * canvasWidth,
          y: Math.random() * canvasHeight,
          vx: (Math.random() - 0.5) * 36,
          vy: -(22 + Math.random() * 45),
          size: 1.5 + Math.random() * 2.8,
          color: Math.random() > 0.4 ? '#f97316' : Math.random() > 0.5 ? '#f59e0b' : '#ef4444',
          alpha: 0.35 + Math.random() * 0.45,
          sway: Math.random() * Math.PI * 2,
          swaySpeed: 2.2 + Math.random() * 2,
        });
      } else if (lvl === 5) {
        // Nivel 2-1: Cavernas de Cristal (Amethyst spores and violet mineral dust)
        weatherParticles.push({
          x: Math.random() * (canvasWidth + 200),
          y: Math.random() * canvasHeight,
          vx: (Math.random() - 0.5) * 22,
          vy: -(8 + Math.random() * 16),
          size: 1.5 + Math.random() * 2.5,
          color: Math.random() > 0.4 ? '#c084fc' : '#a855f7',
          alpha: 0.35 + Math.random() * 0.45,
          sway: Math.random() * Math.PI * 2,
          swaySpeed: 1.5 + Math.random() * 2,
        });
      } else if (lvl === 6) {
        // Nivel 2-2: El Abismo Resonante (Deep turquoise abyss mist & cyan bioluminescent motes)
        weatherParticles.push({
          x: Math.random() * (canvasWidth + 200),
          y: Math.random() * canvasHeight,
          vx: (Math.random() - 0.5) * 32,
          vy: -(10 + Math.random() * 20),
          size: 1.8 + Math.random() * 2.8,
          color: Math.random() > 0.5 ? '#22d3ee' : '#38bdf8',
          alpha: 0.4 + Math.random() * 0.4,
          sway: Math.random() * Math.PI * 2,
          swaySpeed: 2 + Math.random() * 2,
        });
      } else if (lvl === 7) {
        // Nivel 2-3: La Ciudadela Subterránea (Obsidian temple energy sparks & fuchsia/violet conduits)
        weatherParticles.push({
          x: Math.random() * (canvasWidth + 200),
          y: Math.random() * canvasHeight,
          vx: (Math.random() - 0.5) * 28,
          vy: -(14 + Math.random() * 24),
          size: 1.6 + Math.random() * 2.6,
          color: Math.random() > 0.4 ? '#e879f9' : '#f472b6',
          alpha: 0.35 + Math.random() * 0.5,
          sway: Math.random() * Math.PI * 2,
          swaySpeed: 2.2 + Math.random() * 2.2,
        });
      } else if (lvl === 1) {
        weatherParticles.push({
          x: Math.random() * (canvasWidth + 200),
          y: Math.random() * canvasHeight,
          vx: 15 + Math.random() * 20,
          vy: 8 + Math.random() * 12,
          size: 1.5 + Math.random() * 2,
          color: Math.random() > 0.4 ? '#fef08a' : '#fde047',
          alpha: 0.35 + Math.random() * 0.45,
          sway: Math.random() * Math.PI * 2,
          swaySpeed: 1.5 + Math.random() * 2,
        });
      } else if (lvl === 2) {
        weatherParticles.push({
          x: Math.random() * (canvasWidth + 200),
          y: Math.random() * canvasHeight,
          vx: 25 + Math.random() * 30,
          vy: -(10 + Math.random() * 25),
          size: 1.5 + Math.random() * 2.5,
          color: Math.random() > 0.5 ? '#fbbf24' : '#f97316',
          alpha: 0.3 + Math.random() * 0.5,
          sway: Math.random() * Math.PI * 2,
          swaySpeed: 2 + Math.random() * 2.5,
        });
      } else if (lvl === 3) {
        weatherParticles.push({
          x: Math.random() * (canvasWidth + 200),
          y: Math.random() * canvasHeight,
          vx: -120 - Math.random() * 60,
          vy: 550 + Math.random() * 200,
          size: 2,
          color: 'rgba(56, 189, 248, 0.65)',
          alpha: 0.4 + Math.random() * 0.4,
        });
      } else {
        // Level 1-B: Indoor Temple Atmospheric Sparks & Embers
        weatherParticles.push({
          x: Math.random() * canvasWidth,
          y: Math.random() * canvasHeight,
          vx: (Math.random() - 0.5) * 22,
          vy: -(14 + Math.random() * 22),
          size: 1.5 + Math.random() * 2.5,
          color: Math.random() > 0.5 ? '#a855f7' : '#00f0ff',
          alpha: 0.35 + Math.random() * 0.45,
          sway: Math.random() * Math.PI * 2,
          swaySpeed: 1.8 + Math.random() * 2,
        });
      }
    }
    worldRef.current.weatherParticles = weatherParticles;
  }, [canvasWidth, canvasHeight]);

  // Subterranean Secret Bonus Vault (Bóveda de Cristal Secreta tipo Tubería de Mario)
  const buildBonusRoom = useCallback(
    (
      fromLvl: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19,
      returnX: number,
      returnY: number,
    ) => {
      const platforms: PlatformBlock[] = [];
      const items: ItemEntity[] = [];
      const bonusConduits: BonusConduit[] = [];

      let itemId = 5000;
      let conduitId = 100;

      worldRef.current.levelWidth = 960;
      worldRef.current.levelHeight = 540;
      worldRef.current.checkpointX = 120;
      worldRef.current.checkpointY = 382;
      worldRef.current.beaconX = 99999;
      worldRef.current.beaconY = 340;
      worldRef.current.cameraX = 0;
      worldRef.current.cameraY = 0;
      worldRef.current.isBonusRoom = true;
      worldRef.current.bonusReturnState = {level: fromLvl, x: returnX, y: returnY};

      // 1. Solid floor across chamber
      platforms.push({
        x: 0,
        y: 440,
        width: 960,
        height: 100,
        type: 'ground',
      });

      // Ceiling boundary
      platforms.push({x: 0, y: 0, width: 960, height: 36, type: 'ground'});

      // Entrance conduit on left (where Voltlynx emerges from the ceiling/floor pipe)
      platforms.push({x: 80, y: 382, width: 68, height: 58, type: 'ground'});
      bonusConduits.push({
        id: conduitId++,
        x: 80,
        y: 382,
        width: 68,
        height: 68,
        isExit: true,
      });

      // Exit conduit on right (Warp back to the main stage landmark!)
      platforms.push({x: 812, y: 382, width: 68, height: 58, type: 'ground'});
      bonusConduits.push({
        id: conduitId++,
        x: 812,
        y: 382,
        width: 68,
        height: 68,
        isBonusRoomExit: true,
        returnX,
        returnY,
      });

      // Symmetrical stepped ancient stone altars
      platforms.push({x: 200, y: 350, width: 140, height: 28, type: 'ground'});
      platforms.push({x: 620, y: 350, width: 140, height: 28, type: 'ground'});
      platforms.push({x: 370, y: 260, width: 220, height: 28, type: 'ground'});

      // Energy Dynamo mystery blocks
      platforms.push({x: 458, y: 140, width: 44, height: 44, type: 'dynamo'});
      platforms.push({x: 248, y: 220, width: 44, height: 44, type: 'dynamo'});
      platforms.push({x: 668, y: 220, width: 44, height: 44, type: 'dynamo'});

      // Guaranteed Power-Up Core (Titan form) on the central dais
      items.push({
        id: itemId++,
        x: 462,
        y: 216,
        vx: 0,
        vy: 0,
        type: 'resonant_core',
      });

      // Heart HP pickup beneath the dais
      items.push({
        id: itemId++,
        x: 462,
        y: 396,
        vx: 0,
        vy: 0,
        type: 'heart_hp',
      });

      // Extra-Life and Healing in treasury
      items.push({
        id: itemId++,
        x: 248,
        y: 170,
        vx: 0,
        vy: 0,
        type: 'heart_1up',
      });
      items.push({
        id: itemId++,
        x: 668,
        y: 170,
        vx: 0,
        vy: 0,
        type: 'heart_hp',
      });

      // Dazzling array of 36 Spark Crystals arranged in rewarding geometric arcs
      const crystalPositions = [
        // Left Arch (8 crystals)
        {x: 160, y: 390},
        {x: 180, y: 320},
        {x: 210, y: 270},
        {x: 250, y: 240},
        {x: 290, y: 270},
        {x: 320, y: 320},
        {x: 230, y: 310},
        {x: 270, y: 310},
        // Central Diamond Constellation above dais (12 crystals)
        {x: 410, y: 210},
        {x: 440, y: 180},
        {x: 480, y: 180},
        {x: 510, y: 210},
        {x: 430, y: 140},
        {x: 460, y: 90},
        {x: 490, y: 140},
        {x: 390, y: 170},
        {x: 530, y: 170},
        {x: 410, y: 100},
        {x: 460, y: 60},
        {x: 510, y: 100},
        // Right Arch (8 crystals)
        {x: 640, y: 270},
        {x: 670, y: 240},
        {x: 710, y: 270},
        {x: 740, y: 320},
        {x: 760, y: 390},
        {x: 650, y: 310},
        {x: 690, y: 310},
        {x: 600, y: 320},
        // Floor Treasure Trail (8 crystals)
        {x: 160, y: 410},
        {x: 200, y: 410},
        {x: 350, y: 410},
        {x: 390, y: 410},
        {x: 530, y: 410},
        {x: 570, y: 410},
        {x: 720, y: 410},
        {x: 760, y: 410},
      ];

      crystalPositions.forEach((pos) => {
        items.push({
          id: itemId++,
          x: pos.x,
          y: pos.y,
          vx: 0,
          vy: 0,
          type: 'crystal',
        });
      });

      worldRef.current.platforms = platforms;
      worldRef.current.items = items;
      worldRef.current.enemies = [];
      worldRef.current.geysers = [];
      worldRef.current.bonusConduits = bonusConduits;
      worldRef.current.projectiles = [];
      worldRef.current.particles = [];

      worldRef.current.stageBanner = {
        title: 'BÓVEDA SECRETA',
        name: 'CÁMARA DEL TESORO ANCESTRAL',
        subtitle: '¡Recolecta todos los cristales y sal por el conducto derecho!',
        accentColor: '#fbbf24',
      };
      worldRef.current.stageBannerTimer = 3.5;

      // Golden sparkling particles in the treasury
      const weatherParticles: WeatherParticle[] = [];
      for (let i = 0; i < 45; i++) {
        weatherParticles.push({
          x: Math.random() * 960,
          y: Math.random() * 540,
          vx: (Math.random() - 0.5) * 24,
          vy: -(10 + Math.random() * 20),
          size: 2 + Math.random() * 3,
          color: Math.random() > 0.4 ? '#fde047' : '#fbbf24',
          alpha: 0.35 + Math.random() * 0.45,
          sway: Math.random() * Math.PI * 2,
          swaySpeed: 1.8 + Math.random() * 2,
        });
      }
      worldRef.current.weatherParticles = weatherParticles;
    },
    [],
  );

  // Initialize Game Run
  const initGame = useCallback(
    (
      lvlToStart:
        | 1
        | 2
        | 3
        | 4
        | 5
        | 6
        | 7
        | 8
        | 9
        | 10
        | 11
        | 12
        | 13
        | 14
        | 15
        | 16
        | 17
        | 18
        | 19 = currentLevelNumber,
      carryOverScore = 0,
      customFragments?: number,
    ) => {
      // Auto-equip appropriate fragments tier if starting directly from level select
      if (customFragments !== undefined) {
        setRecoveredFragments(customFragments);
        recoveredFragmentsRef.current = customFragments;
      } else {
        // Pre-equip corresponding fragments already unlocked for that progression stage
        const minFragsForStage =
          lvlToStart >= 17 ? 4 : lvlToStart >= 13 ? 3 : lvlToStart >= 9 ? 2 : lvlToStart >= 5 ? 1 : 0;
        if (recoveredFragmentsRef.current < minFragsForStage) {
          setRecoveredFragments(minFragsForStage);
          recoveredFragmentsRef.current = minFragsForStage;
        }
      }

      setCurrentLevelNumber(lvlToStart);
      currentLevelRef.current = lvlToStart;
      setCurrentScene('SCENE_GAMEPLAY');
      buildLevel(lvlToStart);

      const startX =
        lvlToStart === 4 || lvlToStart === 8 || lvlToStart === 12 || lvlToStart === 16 || lvlToStart === 18 || lvlToStart === 19
          ? 120
          : lvlToStart === 15
          ? 480
          : 100;
      const startY =
        lvlToStart === 4 || lvlToStart === 8 || lvlToStart === 12 || lvlToStart === 16 || lvlToStart === 18 || lvlToStart === 19
          ? 392
          : lvlToStart === 15
          ? 3432
          : lvlToStart === 14
          ? 390
          : lvlToStart === 1 || lvlToStart === 2
          ? 432
          : lvlToStart >= 9 && lvlToStart <= 11
          ? 412
          : lvlToStart >= 5 && lvlToStart <= 7
          ? 432
          : lvlToStart === 13
          ? 432
          : 420;

      worldRef.current.isRespawning = false;
      worldRef.current.respawnLockTimer = 0;
      worldRef.current.lastCheckpoint43 = 0;
      worldRef.current.checkpoint43 = { x: 480, y: 3480 };
      const defaultLives = difficultyRef.current === 'DEVIL' ? 5 : 15;
      const initialLives = carryOverScore === 0 ? defaultLives : Math.max(1, gameStateRef.current.lives ?? defaultLives);
      worldRef.current.lives = initialLives;

      worldRef.current.player = {
        x: startX,
        y: startY,
        vx: 0,
        vy: 0,
        width: 58,
        height: 60,
        isGrounded: true,
        isCrouching: false,
        facingRight: true,
        coyoteTimer: 0,
        jumpBufferTimer: 0,
        jumpCount: 0,
        isDashing: false,
        dashTimer: 0,
        attackTimer: 0,
        shootCooldown: 0,
        flameCooldown: 0,
        flashStepCooldown: 0,
        titanTimer: 0,
        ionTimer: 0,
        needleTimer: 0,
        invulnerableTimer:
          lvlToStart === 4 || lvlToStart === 8 || lvlToStart === 12 || lvlToStart === 16 || lvlToStart === 18 || lvlToStart === 19 ? 1.0 : 2.5,
        squash: 1,
        stretch: 1,
        slowTimer: 0,
        divineResurrectionUsed: false,
        isDivineAvatar: false,
        dropDownTimer: 0,
        isDying: false,
      };

      setIsDivineAvatar(false);
      setFlashStepCooldownDisplay(0);

      worldRef.current.cameraX = 0;
      worldRef.current.cameraY = lvlToStart === 15 ? 3060 : 0;
      worldRef.current.checkpointX = startX;
      worldRef.current.checkpointY = startY;
      worldRef.current.safeRespawnX = startX;
      worldRef.current.safeRespawnY = startY;
      worldRef.current.isBonusRoom = false;
      if (lvlToStart === 15) {
        worldRef.current.verticalAutoscroll.active = true;
        worldRef.current.verticalAutoscroll.triggered = false;
        worldRef.current.verticalAutoscroll.pauseTimer = 4.0;
        worldRef.current.verticalAutoscroll.resumeBannerTimer = 0;
      }
      worldRef.current.pipeSequence = {
        active: false,
        phase: 'NONE',
        timer: 0,
        duration: 0.6,
        startX: 0,
        startY: 0,
        targetY: 0,
        targetLevel: lvlToStart,
        returnX: 0,
        returnY: 0,
        conduitX: 0,
        conduitY: 0,
      };

      if (carryOverScore === 0) {
        setCrystalsCount(0);
        setGameState((prev) => ({
          ...prev,
          status: 'PLAYING',
          score: 0,
          level: lvlToStart,
          lives: defaultLives,
          timer: getConfig('timeLimit') as number,
        }));
      } else {
        setGameState((prev) => ({
          ...prev,
          status: 'PLAYING',
          score: carryOverScore,
          level: lvlToStart,
          lives: Math.max(1, prev.lives ?? defaultLives),
          timer: getConfig('timeLimit') as number,
        }));
      }

      const maxMana = 100 + (recoveredFragmentsRef.current || 0) * 25;
      setEnergyMana(maxMana);
      setActiveForm('NORMAL');
      setHasThunderShot(false);
      worldRef.current.inGameCelebrationBanner = null;
      worldRef.current.celebrationPhase = 'NONE';
      setVictoryTally(null);
      setIsCinematicActive(false);
      worldRef.current.cinematic.active = false;

      // Persist progress to localStorage
      const updatedSave = saveArcadeData({
        maxUnlockedLevel: Math.max(savedData?.maxUnlockedLevel || 1, lvlToStart),
        lastPlayedLevel: lvlToStart,
        score: carryOverScore,
        lives: carryOverScore === 0 ? 15 : Math.max(1, gameStateRef.current.lives ?? 15),
        fragments: recoveredFragmentsRef.current,
      });
      setSavedData(updatedSave);

      if (sdk) {
        sdk.startGame();
      }
    },
    [buildLevel, currentLevelNumber, sdk, savedData],
  );

  // 90s Arcade Sector Loading Transition Sequence
  const triggerArcadeLoading = useCallback(
    (
      lvlToStart:
        | 1
        | 2
        | 3
        | 4
        | 5
        | 6
        | 7
        | 8
        | 9
        | 10
        | 11
        | 12
        | 13
        | 14
        | 15
        | 16
        | 17
        | 18
        | 19 = currentLevelNumber,
      carryOverScore = 0,
      customFragments?: number,
    ) => {
      gameAudio.playCoinPickup();
      const tipsList = ARCADE_TIPS_LOCALIZED[language];
      const randomTip = tipsList[Math.floor(Math.random() * tipsList.length)];
      setArcadeLoading({
        active: true,
        level: lvlToStart,
        score: carryOverScore,
        customFragments,
        progress: 0,
        tip: randomTip,
      });
      setIsGameMenuOpen(false);
      setIsStoryPrologueOpen(false);

      transitionToScene('SCENE_LOADING', () => {
        let pCount = 0;
        const interval = setInterval(() => {
          pCount += 15;
          setArcadeLoading((prev) => ({
            ...prev,
            progress: Math.min(100, pCount),
          }));
          if (pCount >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              transitionToScene('SCENE_GAMEPLAY', () => {
                setArcadeLoading((prev) => ({...prev, active: false}));
                initGame(lvlToStart, carryOverScore, customFragments);
              });
            }, 180);
          }
        }, 75);
      });
    },
    [initGame, currentLevelNumber, transitionToScene, language],
  );

      // Autoplay trigger
      const hasAutoplayed = useRef(false);
      useEffect(() => {
        if (
          !hasAutoplayed.current &&
          new URLSearchParams(window.location.search).has('autoplay')
        ) {
          hasAutoplayed.current = true;
          initGame(1);
        }
      }, [initGame]);

  const changeStoryPanel = useCallback(
    (idx: number) => {
      const currentStoryPanels = STORY_PANELS_LOCALIZED[language];
      if (idx === storyPanelIndex || idx < 0 || idx >= currentStoryPanels.length) return;
      gameAudio.playCrispClick();
      if (prologueAudioRef.current) {
        prologueAudioRef.current.pause();
        prologueAudioRef.current.currentTime = 0;
      }
      setIsNarrationPlaying(false);
      setNarrationProgress(0);
      setStoryPanelIndex(idx);
    },
    [storyPanelIndex, language],
  );

  const handleNextStoryPanel = useCallback(
    (forceAdvance = false) => {
      const currentStoryPanels = STORY_PANELS_LOCALIZED[language];
      const full = (currentStoryPanels[storyPanelIndex] || currentStoryPanels[0]).paragraphs.join(' ');
      if (!forceAdvance && !isTextFullyTyped) {
        setTypewriterIndex(full.length);
        setIsTextFullyTyped(true);
        return;
      }
      if (storyPanelIndex < currentStoryPanels.length - 1) {
        changeStoryPanel(storyPanelIndex + 1);
      } else {
        gameAudio.playConfirmSelect();
        try {
          localStorage.setItem('la_grieta_prologue_seen', 'true');
        } catch {}
        transitionToScene('SCENE_DIFFICULTY_SELECT');
      }
    },
    [
      storyPanelIndex,
      isTextFullyTyped,
      changeStoryPanel,
      transitionToScene,
      language,
    ],
  );

  const handlePrevStoryPanel = useCallback(() => {
    if (storyPanelIndex <= 0) return;
    changeStoryPanel(storyPanelIndex - 1);
  }, [storyPanelIndex, changeStoryPanel]);

  useEffect(() => {
    nextStoryPanelRef.current = () => handleNextStoryPanel(true);
    prevStoryPanelRef.current = handlePrevStoryPanel;
  }, [handleNextStoryPanel, handlePrevStoryPanel]);

  // Start automatic walking transition between regular levels (2.8s auto-advance, zero manual interaction)
  const startWalkingTransition = useCallback(
    (
      targetLevel: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19,
      overrideName?: string,
      overrideSubtitle?: string,
    ) => {
      const w = worldRef.current;
      const localizedLevel = LEVEL_LOCALIZED_INFO[language]?.[targetLevel];
      const allLevels = CHAPTER_ZONES.flatMap((z) => z.levels);
      const targetInfo = allLevels.find((l) => l.number === targetLevel);
      const name =
        overrideName ||
        (localizedLevel
          ? `Sector ${targetInfo?.code || targetLevel}: ${localizedLevel.name}`
          : targetInfo
          ? `Sector ${targetInfo.code}: ${targetInfo.name}`
          : `Nivel ${targetLevel}`);
      const subtitle =
        overrideSubtitle ||
        (localizedLevel?.subtitle || targetInfo?.subtitle || 'Avanzando hacia el siguiente sector...');

      gameAudio.playLevelUpStinger();
      w.player.vx = 0;
      w.player.vy = 0;
      w.player.invulnerableTimer = 999;
      w.celebrationPhase = 'NONE';
      w.inGameCelebrationBanner = null;

      // Score bonus for completing regular stage (3x in Devil Mode)
      const scoreMult = difficultyRef.current === 'DEVIL' ? 3 : 1;
      const stageScore = 1500 * scoreMult;
      const timeBonus = Math.round((gameStateRef.current.timer ?? 0) * 10) * scoreMult;
      const totalScore =
        (gameStateRef.current.score ?? 0) + stageScore + timeBonus;

      setGameState((prev) => ({
        ...prev,
        score: totalScore,
      }));

      saveArcadeData({
        maxUnlockedLevel: Math.max(
          savedData?.maxUnlockedLevel || 1,
          targetLevel,
        ),
        lastPlayedLevel: targetLevel,
        score: totalScore,
        lives: Math.max(1, gameStateRef.current.lives ?? 15),
        fragments: recoveredFragmentsRef.current,
      });

      w.cinematic = {
        active: true,
        phase: 'FADE_OUT_LEVEL',
        phaseTimer: 0.25,
        totalVoidDuration: 2.8,
        targetLevel,
        targetLevelName: name,
        targetLevelSubtitle: subtitle,
        voltlynxX: canvasWidth * 0.08,
        footstepTimer: 0,
        footstepSparks: [],
        animState: {
          currentAction: 'WALK',
          currentFrame: 0,
          timer: 0,
        },
      };
      setIsCinematicActive(true);
      setCurrentScene('SCENE_GAMEPLAY');
      setBossDefeatedData(null);
      setBossHpData((prev) => ({ ...prev, active: false }));
    },
    [canvasWidth, savedData, language],
  );

  // Full-screen post-boss showcase: fallen boss sprite + Mouler retrieving Celestial Fragment
  const triggerBossDefeatedCinematic = useCallback(
    (
      boss: BossEntity,
      fragmentNumber: number,
      nextLevel: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19,
    ) => {
      const w = worldRef.current;
      w.player.vx = 0;
      w.player.vy = 0;
      w.player.invulnerableTimer = 999;
      w.bossDoorLocked = false;
      w.bossRightDoorLocked = false;

      // Update fragments unlocked
      setRecoveredFragments(fragmentNumber);
      recoveredFragmentsRef.current = fragmentNumber;

      const scoreMult = difficultyRef.current === 'DEVIL' ? 3 : 1;
      const stageScore = 5000 * scoreMult;
      const timeBonus = Math.round((gameStateRef.current.timer ?? 0) * 10) * scoreMult;
      const totalScore =
        (gameStateRef.current.score ?? 0) + stageScore + timeBonus;

      setGameState((prev) => ({
        ...prev,
        score: totalScore,
      }));

      saveArcadeData({
        maxUnlockedLevel: Math.max(
          savedData?.maxUnlockedLevel || 1,
          nextLevel,
        ),
        lastPlayedLevel: nextLevel,
        score: totalScore,
        lives: Math.max(1, gameStateRef.current.lives ?? 15),
        fragments: fragmentNumber,
      });

      let fragmentTitle = 'FRAGMENTO 1/5: ESPÍRITU ORGRINIANO';
      let fragmentPower =
        'Resistencia ancestral restaurada (+3 Vidas y bendición sagrada).';
      if (fragmentNumber === 2) {
        fragmentTitle = 'FRAGMENTO 2/5: FUEGO DE OBSIDIANA';
        fragmentPower =
          'Llamarada Volcánica perforadora desbloqueada [Teclas E / X o Botón F].';
      } else if (fragmentNumber === 3) {
        fragmentTitle = 'FRAGMENTO 3/5: ESENCIA CELESTIAL';
        fragmentPower =
          'Reencarnación Celestial divina (+3 Vidas de gracia inmediata al caer).';
      } else if (fragmentNumber === 4) {
        fragmentTitle = 'FRAGMENTO 4/5: HIELO ETERNO';
        fragmentPower =
          'Flash-Step de evasión espectral [Q / Arriba+Dash] y Rayo Electrogélido (+50% Daño).';
      }

      const allLevels = CHAPTER_ZONES.flatMap((z) => z.levels);
      const curLvlInfo = allLevels.find(
        (l) => l.number === currentLevelRef.current,
      );
      const bgAsset = curLvlInfo?.bgAsset || 'bg_mid_ruins';

      setBossDefeatedData({
        bossName: boss.name,
        bossSubtitle: boss.subtitle,
        bossType: boss.type,
        fragmentNumber,
        fragmentTitle,
        fragmentPower,
        bgAsset,
        nextLevel,
        timer: 4.0,
      });

      gameAudio.playVictoryFanfare();

      transitionToScene('SCENE_BOSS_DEFEATED');
    },
    [savedData, transitionToScene],
  );

  // Stage / Boss Victory Handler
  const triggerStageVictory = useCallback(
    (
      isBoss: boolean,
      bossName?: string,
      bossAsset?: string,
      fragmentUnlocked?: number,
      powerUpText = '✦ SECTOR CONQUISTADO ✦',
      nextLevel: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 = (currentLevelRef.current + 1 as any),
      isCampaignComplete = false,
    ) => {
      const w = worldRef.current;
      w.player.vx = 0;
      w.player.vy = 0;
      w.player.invulnerableTimer = 999;
      w.celebrationPhase = 'BANNER';
      w.inGameCelebrationBanner = {
        title: isBoss ? '¡JEFE DERROTADO!' : '¡ETAPA COMPLETADA!',
        subtitle: isCampaignComplete
          ? '¡VICTORIA TOTAL EN AETHERIA!'
          : powerUpText,
        timer: 2.5,
        isBoss,
      };

      if (isBoss || isCampaignComplete) {
        gameAudio.playVictoryFanfare();
      } else {
        gameAudio.playLevelUpStinger();
      }

      if (fragmentUnlocked !== undefined) {
        setRecoveredFragments(fragmentUnlocked);
        recoveredFragmentsRef.current = fragmentUnlocked;
      }

      const currentLvlNum = currentLevelRef.current;
      const localizedLevel = LEVEL_LOCALIZED_INFO[language]?.[currentLvlNum];
      const allLevels = CHAPTER_ZONES.flatMap((z) => z.levels);
      const lvlInfo = allLevels.find((l) => l.number === currentLvlNum);
      const stageCode = lvlInfo?.code ?? String(currentLvlNum);
      const stageName = localizedLevel?.name ?? lvlInfo?.name ?? `Sector ${currentLvlNum}`;
      const defaultBgAsset = lvlInfo?.bgAsset ?? 'bg_plains_meadows';

      const scoreMult = difficultyRef.current === 'DEVIL' ? 3 : 1;
      const stageScore = (isBoss ? 5000 : 1500) * scoreMult;
      const timeBonus = Math.round((gameStateRef.current.timer ?? 0) * 10) * scoreMult;
      const totalScore = (gameStateRef.current.score ?? 0) + stageScore + timeBonus;

      setVictoryTally({
        stageCode,
        stageName,
        isBoss,
        bossName: bossName ?? lvlInfo?.bossName,
        bossAsset: bossAsset ?? defaultBgAsset,
        fragmentUnlocked,
        powerUpText,
        stageScore,
        totalScore,
        crystals: crystalsCount,
        timeBonus,
        nextLevel,
        isCampaignComplete,
      });

      setTallyProgress(0);
      setTallyCountdown(5);

      const maxUnlocked = Math.max(
        savedData?.maxUnlockedLevel || 1,
        isCampaignComplete ? 19 : nextLevel,
      );
      const updatedSave = saveArcadeData({
        maxUnlockedLevel: maxUnlocked,
        lastPlayedLevel: isCampaignComplete ? 1 : nextLevel,
        score: totalScore,
        lives: Math.max(1, gameStateRef.current.lives ?? 15),
        fragments: fragmentUnlocked ?? recoveredFragmentsRef.current,
      });
      setSavedData(updatedSave);

      setGameState((prev) => ({
        ...prev,
        score: totalScore,
      }));
    },
    [crystalsCount, savedData, language],
  );

  // Auto-advance and key handling for post-boss defeated cinematic
  useEffect(() => {
    if (currentScene !== 'SCENE_BOSS_DEFEATED' || !bossDefeatedData) return;

    const autoTimer = setInterval(() => {
      setBossDefeatedData((prev) => {
        if (!prev) return null;
        if (prev.timer <= 0.2) {
          clearInterval(autoTimer);
          setCurrentScene('SCENE_GAMEPLAY');
          startWalkingTransition(prev.nextLevel);
          return null;
        }
        return { ...prev, timer: prev.timer - 0.2 };
      });
    }, 200);

    const handleKeys = (e: KeyboardEvent) => {
      if (
        ['Space', 'Enter', 'KeyK', 'KeyZ', 'KeyJ', 'Escape'].includes(e.code)
      ) {
        e.preventDefault();
        clearInterval(autoTimer);
        setCurrentScene('SCENE_GAMEPLAY');
        startWalkingTransition(bossDefeatedData.nextLevel);
      }
    };
    window.addEventListener('keydown', handleKeys);

    return () => {
      clearInterval(autoTimer);
      window.removeEventListener('keydown', handleKeys);
    };
  }, [currentScene, bossDefeatedData, startWalkingTransition]);

  // Victory Tally Advance Handler
  const handleAdvanceFromTally = useCallback(() => {
    if (!victoryTally) return;
    gameAudio.playConfirmSelect();
    if (victoryTally.isCampaignComplete) {
      transitionToScene('SCENE_TITLE', () => {
        setGameState((s) => ({ ...s, status: 'START' }));
      });
    } else {
      triggerArcadeLoading(
        victoryTally.nextLevel,
        victoryTally.totalScore,
        victoryTally.fragmentUnlocked,
      );
    }
  }, [victoryTally, transitionToScene, triggerArcadeLoading]);

  // Fast Score Tally count-up and 5s auto-advance countdown effect
  useEffect(() => {
    if (currentScene !== 'SCENE_VICTORY_TALLY' || !victoryTally) return;

    const countUpInterval = setInterval(() => {
      setTallyProgress((prev) => {
        if (prev < 100) {
          if (prev % 20 === 0) {
            gameAudio.playCoinPickup();
          }
          return Math.min(100, prev + 12);
        }
        return 100;
      });
    }, 50);

    const autoAdvanceTimer = setInterval(() => {
      setTallyCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(autoAdvanceTimer);
          handleAdvanceFromTally();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const handleTallyKeys = (e: KeyboardEvent) => {
      if (['Space', 'Enter', 'KeyK', 'KeyZ', 'KeyJ', 'Escape'].includes(e.code)) {
        e.preventDefault();
        handleAdvanceFromTally();
      }
    };
    window.addEventListener('keydown', handleTallyKeys);

    return () => {
      clearInterval(countUpInterval);
      clearInterval(autoAdvanceTimer);
      window.removeEventListener('keydown', handleTallyKeys);
    };
  }, [currentScene, victoryTally, handleAdvanceFromTally]);

  // Respawn after life lost - 100% Infallible Solid-Ground Respawn Placement Fix
  const respawnPlayer = useCallback(() => {
    clearTouchInputs();
    const w = worldRef.current;
    const p = w.player;

    p.vx = 0;
    p.vy = 0;
    p.isCrouching = false;
    p.titanTimer = 0;
    p.ionTimer = 0;
    p.dropDownTimer = 0;
    p.slowTimer = 0;
    p.dashTimer = 0;
    p.attackTimer = 0;
    p.width = 32;
    p.height = 46;
    setActiveForm('NORMAL');

    // Helper to find guaranteed solid platform surface under or nearest to (x, y)
    const findSolidGroundUnder = (reqX: number, reqY: number) => {
      const candidates = w.platforms.filter(
        (plat) =>
          !plat.broken &&
          plat.type !== 'hazard' &&
          plat.type !== 'barrier' &&
          plat.width >= 30,
      );

      // 1. Look for platforms directly beneath reqX
      const directlyUnder = candidates.filter(
        (plat) =>
          plat.x <= reqX + p.width + 10 &&
          plat.x + plat.width >= reqX - 10 &&
          plat.y >= reqY - 40,
      );

      if (directlyUnder.length > 0) {
        // Pick the closest vertically beneath reqY
        directlyUnder.sort((a, b) => Math.abs(a.y - reqY) - Math.abs(b.y - reqY));
        return directlyUnder[0];
      }

      // 2. If nothing is directly under, find the nearest solid platform horizontally and vertically
      candidates.sort((a, b) => {
        const distA = Math.hypot(a.x + a.width / 2 - reqX, a.y - reqY);
        const distB = Math.hypot(b.x + b.width / 2 - reqX, b.y - reqY);
        return distA - distB;
      });

      return candidates[0] || null;
    };

    const lvl = currentLevelRef.current;
    if (lvl === 15) {
      // Level 4-3: Strictly respawn at currentCheckpoint solid platform surface
      const currentCp = w.checkpoint43 || { x: 480, y: 3480 };
      const groundPlat = findSolidGroundUnder(currentCp.x, currentCp.y);

      if (groundPlat) {
        p.x = clamp(
          currentCp.x,
          groundPlat.x + 8,
          groundPlat.x + groundPlat.width - p.width - 8,
        );
        p.y = groundPlat.y - p.height;
      } else {
        p.x = currentCp.x;
        p.y = currentCp.y - p.height;
      }

      p.vx = 0;
      p.vy = 0;
      p.isGrounded = true;
      p.invulnerableTimer = 4.0;

      // Lock camera to checkpoint height: checkpoint.y - 420 (e.g. 3480 - 420 = 3060 at Base)
      const freezeCamY = clamp(currentCp.y - 420, 0, 3060);
      w.cameraX = 0;
      w.cameraY = freezeCamY;
      w.shake = 0;

      // Freeze autoscroll strictly for grace period
      w.verticalAutoscroll.active = true;
      w.verticalAutoscroll.triggered = (currentCp.y < 3400);
      w.verticalAutoscroll.pauseTimer = 3.5;
      w.verticalAutoscroll.resumeBannerTimer = 0;

      w.checkpointX = p.x;
      w.checkpointY = p.y;
      w.safeRespawnX = p.x;
      w.safeRespawnY = p.y;
    } else {
      let targetSpawnX = w.safeRespawnX ?? w.checkpointX;
      let targetSpawnY = w.safeRespawnY ?? w.checkpointY;

      // Guaranteed solid platform search
      const groundPlat = findSolidGroundUnder(targetSpawnX, targetSpawnY);
      if (groundPlat) {
        p.x = clamp(
          targetSpawnX,
          groundPlat.x + 8,
          groundPlat.x + groundPlat.width - p.width - 8,
        );
        p.y = groundPlat.y - p.height;
      } else {
        p.x = targetSpawnX;
        p.y = targetSpawnY;
      }

      p.vx = 0;
      p.vy = 0;
      p.isGrounded = true;
      const baseIframes = (recoveredFragmentsRef.current >= 1 ? 5.0 : 3.0);
      p.invulnerableTimer = baseIframes;

      w.safeRespawnX = p.x;
      w.safeRespawnY = p.y;

      const lookAhead = (p.facingRight ? 1 : -1) * 60;
      w.cameraX = clamp(
        p.x - canvasWidth / 2 + lookAhead,
        0,
        w.levelWidth - canvasWidth,
      );
      w.cameraY = 0;
    }

    // Clear active enemy projectiles and shockwaves
    w.projectiles = (w.projectiles || []).filter((p) => p && p.isPlayer);
    w.shockwaves = [];

    // Clear death and respawn locks after snap
    p.isDying = false;
    w.isRespawning = false;
    w.respawnLockTimer = 0.5;

    // If player died during boss fight, reset arena gates and boss cleanly ONLY if boss is still alive and NOT defeated!
    if (
      w.boss &&
      !w.boss.isDefeated &&
      w.boss.state !== 'DEAD' &&
      w.boss.state !== 'DYING' &&
      !(w.boss as any).isDead &&
      w.boss.hp > 0 &&
      w.boss.state !== 'DESPERATION'
    ) {
      w.bossArenaActive = true;
      w.bossDoorLocked = true;
      w.bossRightDoorLocked = false;
      w.bossIntroBannerTimer = 0;
      w.bossFightBannerTimer = 1.2;
      w.boss.phase = 1;
      w.boss.state = 'IDLE';
      w.boss.facingRight = false;
      w.boss.comboStep = 0;

      if (w.boss.type === 'GHOTUR_DEMON') {
        w.boss.hp = 2500;
        w.boss.displayedHp = 2500;
        w.boss.stateTimer = 0.8;
        w.boss.x = 640;
        w.boss.y = 230;
        w.boss.groundY = 230;
        w.boss.width = 220;
        w.boss.height = 210;
        w.boss.comboLength = 2;
        w.boss.squash = 1;
        w.boss.stretch = 1;
      } else if (w.boss.type === 'GHOTUR_HUMANOID') {
        w.boss.hp = 2200;
        w.boss.displayedHp = 2200;
        w.boss.stateTimer = 0.8;
        w.boss.x = 700;
        w.boss.y = 280;
        w.boss.groundY = 280;
        w.boss.width = 144;
        w.boss.height = 160;
        w.boss.comboLength = 2;
        w.boss.squash = 1;
        w.boss.stretch = 1;
      } else if (w.boss.type === 'FROST_EMPRESS') {
        w.boss.hp = 2000;
        w.boss.displayedHp = 2000;
        w.boss.stateTimer = 0.8;
        w.boss.x = 700;
        w.boss.y = 280;
        w.boss.groundY = 280;
        w.boss.width = 140;
        w.boss.height = 160;
        w.boss.comboLength = 2;
        w.boss.squash = 1;
        w.boss.stretch = 1;
      } else if (w.boss.type === 'CELESTIAL_DEITY') {
        w.boss.hp = 1800;
        w.boss.displayedHp = 1800;
        w.boss.stateTimer = 0.8;
        w.boss.x = 720;
        w.boss.y = 320;
        w.boss.groundY = 280;
        w.boss.width = 150;
        w.boss.height = 160;
        w.boss.shieldActive = true;
        w.boss.comboLength = 2;
        w.boss.squash = 1;
        w.boss.stretch = 1;
      } else if (w.boss.type === 'DRAGON') {
        w.boss.hp = 1200;
        w.boss.displayedHp = 1200;
        w.boss.stateTimer = 0.8;
        w.boss.x = 670;
        w.boss.y = 290;
        w.boss.groundY = 290;
        w.boss.width = 190;
        w.boss.height = 150;
        w.boss.stalactites = [];
        w.boss.comboLength = 2;
        w.boss.platformCampingTimer = 0;
        w.boss.platformHeatTimerLeft = 0;
        w.boss.platformHeatTimerRight = 0;
        w.boss.squash = 1;
        w.boss.stretch = 1;
        w.boss.walkTimer = 0;
        w.boss.animTimer = 0;
        w.boss.animTime = 0;
      } else {
        w.boss.hp = 800;
        w.boss.displayedHp = 800;
        w.boss.stateTimer = 0.6;
        w.boss.x = 700;
        w.boss.y = 348;
        w.boss.groundY = 348;
        w.boss.lightningPillars = [];
        w.boss.cascadeOrbs = [];
        w.boss.pinballBouncesLeft = 0;
        w.boss.comboLength = 2;
        w.boss.squash = 1;
        w.boss.stretch = 1;
        w.boss.walkTimer = 0;
        w.boss.animTimer = 0;
      }
    }

    // Push back patrolling enemies near respawn
    w.enemies.forEach((enemy) => {
      if (enemy.alive) {
        const dist = Math.hypot(enemy.x - w.checkpointX, enemy.y - w.checkpointY);
        if (dist < 320) {
          if (enemy.x < w.checkpointX) {
            enemy.x = w.checkpointX - 360;
          } else {
            enemy.x = w.checkpointX + 360;
          }
        }
      }
    });

    spawnParticles(
      w.checkpointX + 22,
      w.checkpointY + 24,
      20,
      THEME.neonCyan,
      180,
    );
  }, [canvasWidth]);

  // Spawn visual particle bursts
  const spawnParticles = (
    x: number,
    y: number,
    count: number,
    color: string,
    speed = 220,
    gravity = 350,
  ) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = (0.5 + Math.random() * 0.8) * speed;
      worldRef.current.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        color,
        size: 3 + Math.random() * 4,
        life: 0.3 + Math.random() * 0.4,
        maxLife: 0.5,
        gravity,
      });
    }
  };

  // ---------------------------------------------------------------------------
  // MAIN UPDATE SIMULATION
  // ---------------------------------------------------------------------------
  const update = (dt: number) => {
    if (gameStateRef.current.status !== 'PLAYING' || isGameMenuOpen) return;

    const w = worldRef.current;
    const p = w.player;

    // In-Arena Celebration Phase (Freeze movement, display banner, then smooth fade to Victory Tally)
    if (w.celebrationPhase === 'BANNER') {
      p.vx = 0;
      p.vy = 0;
      p.invulnerableTimer = 999;
      if (w.inGameCelebrationBanner) {
        w.inGameCelebrationBanner.timer -= dt;
        if (w.inGameCelebrationBanner.timer <= 0) {
          w.celebrationPhase = 'FADING';
          transitionToScene('SCENE_VICTORY_TALLY', () => {
            w.celebrationPhase = 'NONE';
            w.inGameCelebrationBanner = null;
          });
        }
      }
      return;
    }

    // Dedicated Non-Playable Level Transition Cinematic State Machine
    if (w.cinematic.active) {
      const c = w.cinematic;

      // Update footstep spark particles
      for (let i = c.footstepSparks.length - 1; i >= 0; i--) {
        const sp = c.footstepSparks[i];
        sp.x += sp.vx * dt;
        sp.y += sp.vy * dt;
        sp.life -= dt;
        if (sp.life <= 0) {
          c.footstepSparks.splice(i, 1);
        }
      }

      if (c.phase === 'FADE_OUT_LEVEL') {
        c.phaseTimer -= dt;
        if (c.phaseTimer <= 0) {
          c.phase = 'VOID_WALK';
          c.phaseTimer = c.totalVoidDuration;
          c.voltlynxX = canvasWidth * 0.18;
          c.footstepSparks = [];
        }
      } else if (c.phase === 'VOID_WALK') {
        c.phaseTimer -= dt;

        // Voltlynx walks steadily from left-to-center across the pitch-black void
        const walkSpeed = 70; // px/s
        c.voltlynxX += walkSpeed * dt;

        // Animate Voltlynx walking fluidly using the walking spritesheet action
        c.animState = playerSpriteRendererRef.current.getNextState(
          c.animState,
          dt,
        );

        // Spawn soft cyan particle footstep sparks under paws
        c.footstepTimer -= dt;
        if (c.footstepTimer <= 0) {
          c.footstepTimer = 0.12;
          const pawX = c.voltlynxX + 32;
          const pawY = canvasHeight * 0.5 + 30;
          for (let s = 0; s < 3; s++) {
            c.footstepSparks.push({
              x: pawX + (Math.random() - 0.5) * 14,
              y: pawY + (Math.random() - 0.5) * 4,
              vx: (Math.random() - 0.5) * 35 - 15,
              vy: -15 - Math.random() * 25,
              color: Math.random() > 0.35 ? '#00f0ff' : '#38bdf8',
              size: 2 + Math.random() * 2.5,
              life: 0.35 + Math.random() * 0.25,
              maxLife: 0.6,
            });
          }
        }

        if (c.phaseTimer <= 0) {
          c.phase = 'FADE_OUT_VOID';
          c.phaseTimer = 0.5;
        }
        } else if (c.phase === 'FADE_OUT_VOID') {
          c.phaseTimer -= dt;
          if (c.phaseTimer <= 0) {
            // Smoothly load target level geometry and reset player position
            const targetLvl = c.targetLevel;
            setCurrentLevelNumber(targetLvl);
            currentLevelRef.current = targetLvl;
            buildLevel(targetLvl);

            if (targetLvl === 4 || targetLvl === 8 || targetLvl === 12 || targetLvl === 16 || targetLvl === 18 || targetLvl === 19) {
              p.x = 120;
              p.y = 394;
            } else if (targetLvl === 15) {
              p.x = 480;
              p.y = 3434;
            } else if (targetLvl === 14) {
              p.x = 100;
              p.y = 394;
            } else if (targetLvl === 1 || targetLvl === 2) {
              p.x = 100;
              p.y = 434;
            } else if (targetLvl >= 9 && targetLvl <= 11) {
              p.x = 100;
              p.y = 414;
            } else if (targetLvl >= 5 && targetLvl <= 7) {
              p.x = 100;
              p.y = 434;
            } else {
              p.x = 100;
              p.y = 414;
            }
            p.vx = 0;
            p.vy = 0;
            p.width = 32;
            p.height = 46;
            p.isGrounded = true;
            p.isCrouching = false;
            p.facingRight = true;
            p.invulnerableTimer = 0;
            w.cameraX = 0;
            w.cameraY = targetLvl === 15 ? 3060 : 0;
            w.checkpointX = p.x;
            w.checkpointY = p.y;
            w.safeRespawnX = p.x;
            w.safeRespawnY = p.y;

          setGameState((prev) => ({
            ...prev,
            level: targetLvl,
            timer: getConfig('timeLimit') as number,
          }));

          c.active = true;
          c.phase = 'FADE_IN_LEVEL';
          c.phaseTimer = 0.6;
        }
      } else if (c.phase === 'FADE_IN_LEVEL') {
        c.phaseTimer -= dt;
        if (c.phaseTimer <= 0) {
          // Transition complete! Restore full control to the player
          c.active = false;
          setIsCinematicActive(false);
          setCurrentScene('SCENE_GAMEPLAY');
        }
      }

      return;
    }

    // Mario-Style Secret Pipe Sequence (Sliding Down / Popping Up between stages)
    if (w.pipeSequence.active) {
      const ps = w.pipeSequence;
      ps.timer -= dt;

      if (ps.phase === 'ENTERING') {
        p.vx = 0;
        p.vy = 0;
        p.x = ps.conduitX + (68 - p.width) / 2;
        const prog = clamp(1 - ps.timer / ps.duration, 0, 1);
        p.y = ps.startY + (ps.targetY - ps.startY) * prog;

        if (Math.random() < 0.45) {
          spawnParticles(ps.conduitX + 34, ps.conduitY + 16, 3, '#fbbf24', 60, 0);
        }

        if (ps.timer <= 0) {
          ps.phase = 'FADE_OUT';
          ps.timer = 0.25;
        }
      } else if (ps.phase === 'FADE_OUT') {
        p.vx = 0;
        p.vy = 0;
        if (ps.timer <= 0) {
          if (!w.isBonusRoom) {
            // ENTER BONUS VAULT
            buildBonusRoom(
              currentLevelNumber,
              ps.returnX,
              ps.returnY,
            );
            ps.phase = 'EXITING';
            ps.timer = 0.5;
            ps.duration = 0.5;
            ps.conduitX = 80;
            ps.conduitY = 382;
            ps.startY = 382 + 25;
            ps.targetY = 382 - p.height;
            p.x = 80 + (68 - p.width) / 2;
            p.y = ps.startY;
            w.cameraX = 0;
            w.cameraY = 0;
            gameAudio.playPowerupChime();
          } else {
            // EXIT BONUS VAULT BACK TO ORIGINAL LEVEL
            const retLvl = ps.targetLevel;
            buildLevel(retLvl);
            ps.phase = 'EXITING';
            ps.timer = 0.5;
            ps.duration = 0.5;
            ps.conduitX = ps.returnX;
            ps.conduitY = ps.returnY;
            ps.startY = ps.returnY + 25;
            ps.targetY = ps.returnY - p.height;
            p.x = ps.conduitX + (68 - p.width) / 2;
            p.y = ps.startY;
            w.checkpointX = p.x;
            w.checkpointY = ps.targetY;
            w.cameraX = clamp(
              p.x - canvasWidth / 2,
              0,
              w.levelWidth - canvasWidth,
            );
            gameAudio.playPowerupChime();
          }
        }
      } else if (ps.phase === 'EXITING') {
        p.vx = 0;
        p.vy = 0;
        p.x = ps.conduitX + (68 - p.width) / 2;
        const prog = clamp(1 - ps.timer / ps.duration, 0, 1);
        p.y = ps.startY + (ps.targetY - ps.startY) * prog;

        if (Math.random() < 0.35) {
          spawnParticles(ps.conduitX + 34, ps.conduitY + 12, 3, '#38bdf8', 80, 0);
        }

        if (ps.timer <= 0) {
          p.y = ps.targetY;
          p.isGrounded = true;
          ps.active = false;
          ps.phase = 'NONE';
        }
      }

      return;
    }

    // Hit-stop effect (freeze frames on heavy impact)
    if (w.hitStop > 0) {
      w.hitStop -= dt;
      return;
    }

    // Timer countdown
    setGameState((prev) => {
      const newTimer = Math.max(0, (prev.timer ?? 300) - dt);
      if (newTimer <= 0 && prev.status === 'PLAYING') {
        return {...prev, timer: 0, status: 'GAME_OVER'};
      }
      return {...prev, timer: newTimer};
    });

    // Screen Shake Decay
    if (w.shake > 0) {
      w.shake = Math.max(0, w.shake - dt * 25);
    }

    // Stage splash banner timer
    if (w.stageBannerTimer > 0) {
      w.stageBannerTimer = Math.max(0, w.stageBannerTimer - dt);
    }

    // Update authentic pixel art portal sparks
    const sparkPalette = ['#00f0ff', '#38bdf8', '#facc15', '#ffffff', '#c084fc'];
    for (let i = w.portalSparks.length - 1; i >= 0; i--) {
      const sp = w.portalSparks[i];
      sp.x += sp.vx * dt;
      sp.y += sp.vy * dt;
      sp.life -= dt;
      if (sp.life <= 0) {
        sp.x = (Math.random() - 0.5) * 64;
        sp.y = (Math.random() - 0.5) * 76;
        sp.vx = (Math.random() - 0.5) * 22;
        sp.vy = -14 - Math.random() * 26;
        sp.color = sparkPalette[Math.floor(Math.random() * sparkPalette.length)];
        sp.size = Math.random() > 0.4 ? 2 : 3;
        sp.life = 0.5 + Math.random() * 0.7;
        sp.maxLife = sp.life;
      }
    }

    // Weather Simulation & Storm Flash (Level 1-3)
    if (currentLevelNumber === 3) {
      w.lightningTimer -= dt;
      if (w.lightningTimer <= 0) {
        w.lightningFlash = 1.0;
        w.lightningTimer = 4.0 + Math.random() * 4.5;
        w.shake = Math.max(w.shake, 7);
        gameAudio.playChiptuneExplosion();
      }
      if (w.lightningFlash > 0) {
        w.lightningFlash = Math.max(0, w.lightningFlash - dt * 3.8);
      }
    }

    // Weeping Crimson Bleeding Lightning & Void Tremors (Level 5-1: El Infierno Abisal)
    if (currentLevelNumber === 17) {
      w.bleedingLightningTimer = (w.bleedingLightningTimer || 3.5) - dt;
      if (w.bleedingLightningTimer <= 0) {
        w.bleedingLightningFlash = 1.0;
        w.bleedingLightningTimer = 3.5 + Math.random() * 4.0;
        w.shake = Math.max(w.shake, 10);
        gameAudio.playChiptuneExplosion();
        gameAudio.playGunshotBlast();
      }
      if (w.bleedingLightningFlash > 0) {
        w.bleedingLightningFlash = Math.max(0, w.bleedingLightningFlash - dt * 3.2);
      }
    }

    // Update Weather Particles (Wrap seamlessly around camera viewport)
    const viewLeft = w.cameraX - 60;
    const viewRight = w.cameraX + canvasWidth + 60;
    for (const part of w.weatherParticles) {
      if (currentLevelNumber === 1) {
        part.sway = (part.sway ?? 0) + dt * (part.swaySpeed ?? 2);
        part.x += (part.vx + Math.sin(part.sway) * 18) * dt;
        part.y += (part.vy + Math.cos(part.sway * 0.8) * 8) * dt;
      } else if (currentLevelNumber === 2) {
        part.sway = (part.sway ?? 0) + dt * (part.swaySpeed ?? 2.5);
        part.x += (part.vx + Math.sin(part.sway) * 22) * dt;
        part.y += part.vy * dt;
      } else {
        part.x += part.vx * dt;
        part.y += part.vy * dt;
      }

      if (part.x < viewLeft) {
        part.x = viewRight;
        part.y = Math.random() * canvasHeight;
      } else if (part.x > viewRight) {
        part.x = viewLeft;
        part.y = Math.random() * canvasHeight;
      }

      if (part.y > canvasHeight + 30) {
        part.y = -20;
        part.x = viewLeft + Math.random() * (canvasWidth + 120);
      } else if (part.y < -30) {
        part.y = canvasHeight + 20;
        part.x = viewLeft + Math.random() * (canvasWidth + 120);
      }
    }

    // Input collection
    const kb = inputRef.current.actions;
    const mob = mobileInputRef.current;
    const kbd = keyboardRef.current;
    const moveLeft = kb.left || mob.left || kbd.left;
    const moveRight = kb.right || mob.right || kbd.right;
    const moveUp = kb.up || mob.up || kbd.up;
    const moveDown = kb.down || mob.down || kbd.down;
    const jumpPressed = kb.confirm || mob.jump || kbd.jump;
    const dashPressed = kb.tap || mob.dash || kbd.dash;
    const thunderPressed = mob.thunder || kbd.shoot;

    // Timer counters
    if (w.respawnLockTimer > 0) {
      w.respawnLockTimer = Math.max(0, w.respawnLockTimer - dt);
    }
    if (p.titanTimer > 0) {
      p.titanTimer -= dt;
      if (p.titanTimer <= 0) {
        p.width = 32;
        p.height = p.isCrouching ? 24 : 46;
        setActiveForm('NORMAL');
      }
    }
    if (p.ionTimer > 0) p.ionTimer -= dt;
    if (p.needleTimer > 0) p.needleTimer -= dt;
    if (p.invulnerableTimer > 0) p.invulnerableTimer -= dt;
    if (p.dropDownTimer > 0) p.dropDownTimer -= dt;
    if (p.slowTimer > 0) {
      p.slowTimer -= dt;
      if (Math.random() < 0.35) {
        w.particles.push({
          x: p.x + Math.random() * p.width,
          y: p.y + Math.random() * p.height,
          vx: (Math.random() - 0.5) * 30,
          vy: -20 - Math.random() * 30,
          color: Math.random() > 0.4 ? '#a5f3fc' : '#38bdf8',
          size: 2,
          life: 0.25,
          maxLife: 0.3,
          gravity: 20,
        });
      }
    }
    if (p.attackTimer > 0) p.attackTimer -= dt;
    if (p.dashTimer > 0) p.dashTimer -= dt;
    if (p.shootCooldown > 0) p.shootCooldown -= dt;
    if (p.flameCooldown > 0) p.flameCooldown -= dt;
    if (p.flashStepCooldown > 0) {
      p.flashStepCooldown = Math.max(0, p.flashStepCooldown - dt);
      setFlashStepCooldownDisplay(p.flashStepCooldown);
    }

    // Mana natural regeneration up to dynamic maxManaCapacity (swift 18 mana/sec)
    setEnergyMana((prev) => Math.min(maxManaCapacity, prev + dt * 18));

    // Jump Buffering & Coyote Time
    if (p.isGrounded) {
      p.coyoteTimer = (getConfig('coyoteTimeGracePeriod') as number) || 0.12;
      p.jumpCount = 0;
    } else {
      p.coyoteTimer = Math.max(0, p.coyoteTimer - dt);
    }

    if (jumpPressed && !prevJumpPressedRef.current) {
      p.jumpBufferTimer = (getConfig('jumpBufferWindow') as number) || 0.1;
    } else if (p.jumpBufferTimer > 0) {
      p.jumpBufferTimer -= dt;
    }

    // Calibrated Physics Units
    const rawSpeed = getConfig('playerSpeed') as number;
    const baseSpeed = rawSpeed < 20 ? rawSpeed * 40 : rawSpeed;
    const rawDash = getConfig('dashSpeed') as number;
    const baseDash = rawDash < 20 ? rawDash * 42 : rawDash;
    const rawJump = getConfig('jumpForce') as number;
    const baseJump = rawJump < 20 ? rawJump * 48 : rawJump;
    const rawDoubleJump = getConfig('doubleJumpForce') as number;
    const baseDoubleJump =
      rawDoubleJump < 20 ? rawDoubleJump * 48 : rawDoubleJump;

    // Crouching Duck Mechanics
    const standHeight = p.titanTimer > 0 ? 58 : 46;
    const crouchHeight = p.titanTimer > 0 ? 32 : 24;
    const wantsCrouch = Boolean(moveDown && p.isGrounded);

    if (wantsCrouch && !p.isCrouching) {
      p.isCrouching = true;
      p.height = crouchHeight;
      p.y += standHeight - crouchHeight;
      p.squash = 1.35;
      p.stretch = 0.65;
      spawnParticles(p.x + p.width / 2, p.y + p.height, 4, '#38bdf8', 60, 50);
    } else if (!wantsCrouch && p.isCrouching) {
      const checkY = p.y - (standHeight - crouchHeight);
      let ceilingBlocked = false;
      for (const plat of w.platforms) {
        if (plat.broken || plat.type === 'hazard' || plat.isOneWay) continue;
        if (
          p.x < plat.x + plat.width &&
          p.x + p.width > plat.x &&
          checkY < plat.y + plat.height &&
          p.y >= plat.y + plat.height - 8
        ) {
          ceilingBlocked = true;
          break;
        }
      }
      if (!ceilingBlocked) {
        p.isCrouching = false;
        p.y = checkY;
        p.height = standHeight;
        p.stretch = 1.15;
      }
    }

    // Update Moving Platforms
    for (const plat of w.platforms) {
      if (!plat.moving || plat.broken) continue;
      const speed = (plat.moveSpeed ?? 75) * (plat.moveDir ?? 1);
      const axis = plat.moveAxis ?? 'x';
      if (axis === 'x') {
        const oldX = plat.x;
        plat.x += speed * dt;
        if (plat.moveMin !== undefined && plat.x <= plat.moveMin) {
          plat.x = plat.moveMin;
          plat.moveDir = 1;
        } else if (plat.moveMax !== undefined && plat.x >= plat.moveMax) {
          plat.x = plat.moveMax;
          plat.moveDir = -1;
        }
        const deltaX = plat.x - oldX;
        // Carry player if standing on moving platform
        if (
          p.isGrounded &&
          p.x + p.width > plat.x &&
          p.x < plat.x + plat.width &&
          Math.abs(p.y + p.height - plat.y) < 8
        ) {
          p.x += deltaX;
        }
      } else {
        const oldY = plat.y;
        plat.y += speed * dt;
        if (plat.moveMin !== undefined && plat.y <= plat.moveMin) {
          plat.y = plat.moveMin;
          plat.moveDir = 1;
        } else if (plat.moveMax !== undefined && plat.y >= plat.moveMax) {
          plat.y = plat.moveMax;
          plat.moveDir = -1;
        }
        const deltaY = plat.y - oldY;
        if (
          p.isGrounded &&
          p.x + p.width > plat.x &&
          p.x < plat.x + plat.width &&
          Math.abs(p.y + p.height - plat.y) < 10
        ) {
          p.y += deltaY;
        }
      }
    }

    // -------------------------------------------------------------------------
    // CRUSHING PILLARS SIMULATION (Thwomp Traps: trap_crushing_pillar)
    // -------------------------------------------------------------------------
    for (const pillar of w.crushingPillars) {
      if (pillar.state === 'IDLE') {
        pillar.y = pillar.startY;
        let shouldTrigger = false;
        if (pillar.proximityTrigger !== undefined) {
          const pCenter = p.x + p.width / 2;
          const pilCenter = pillar.x + pillar.width / 2;
          if (
            Math.abs(pCenter - pilCenter) <= pillar.proximityTrigger &&
            p.y + p.height >= pillar.startY
          ) {
            shouldTrigger = true;
          }
        }
        pillar.timer -= dt;
        if (pillar.timer <= 0 || shouldTrigger) {
          pillar.state = 'SLAM';
          pillar.timer = 0;
          gameAudio.playArcadeLaser();
        }
      } else if (pillar.state === 'SLAM') {
        const prevY = pillar.y;
        pillar.y += pillar.slamSpeed * dt;

        // Lethal crush danger: Caught directly underneath the slamming pillar!
        const isUnderneath =
          p.x + p.width > pillar.x + 4 &&
          p.x < pillar.x + pillar.width - 4 &&
          p.y + p.height >= pillar.y + pillar.height - 18 &&
          p.y < pillar.floorY + pillar.height + 10;

        if (isUnderneath) {
          handlePlayerDamage();
        }

        // Floor impact
        if (pillar.y >= pillar.floorY) {
          pillar.y = pillar.floorY;
          pillar.state = 'WAIT';
          pillar.timer = pillar.waitDuration;
          w.shake = Math.max(w.shake, 14);
          gameAudio.playJumpLandingThud();

          // Heavy dust & spark impact particles
          for (let d = 0; d < 16; d++) {
            const dirX = (Math.random() - 0.5) * 220;
            w.particles.push({
              x: pillar.x + (d % 2 === 0 ? 0 : pillar.width),
              y: pillar.floorY + pillar.height,
              vx: dirX,
              vy: -40 - Math.random() * 80,
              color: Math.random() > 0.4 ? '#e2e8f0' : '#38bdf8',
              size: 2.5 + Math.random() * 3,
              life: 0.35 + Math.random() * 0.25,
              maxLife: 0.6,
              gravity: 200,
            });
          }
        }
      } else if (pillar.state === 'WAIT') {
        pillar.y = pillar.floorY;
        pillar.timer -= dt;
        if (pillar.timer <= 0) {
          pillar.state = 'RISE';
        }
      } else if (pillar.state === 'RISE') {
        const oldY = pillar.y;
        pillar.y -= pillar.riseSpeed * dt;

        // Smoothly carry Voltlynx up if standing on top of rising pillar
        if (
          p.isGrounded &&
          p.x + p.width > pillar.x &&
          p.x < pillar.x + pillar.width &&
          Math.abs(p.y + p.height - oldY) < 14
        ) {
          p.y = pillar.y - p.height;
        }

        if (pillar.y <= pillar.startY) {
          pillar.y = pillar.startY;
          pillar.state = 'IDLE';
          pillar.timer = pillar.idleDuration;
        }
      }

      // Solid collision on top: Player safely stands or rides top of pillar
      if (
        p.vy >= 0 &&
        p.x + p.width > pillar.x + 2 &&
        p.x < pillar.x + pillar.width - 2 &&
        p.y + p.height >= pillar.y &&
        p.y + p.height - p.vy * dt <= pillar.y + 16
      ) {
        p.y = pillar.y - p.height;
        p.vy = 0;
        p.isGrounded = true;
      }
      // Solid horizontal side collision (player cannot walk through sides)
      else if (
        p.x < pillar.x + pillar.width &&
        p.x + p.width > pillar.x &&
        p.y + p.height > pillar.y + 14 &&
        p.y < pillar.y + pillar.height - 4
      ) {
        if (p.vx > 0) {
          p.x = pillar.x - p.width;
        } else if (p.vx < 0) {
          p.x = pillar.x + pillar.width;
        }
        p.vx = 0;
      }
    }

    // -------------------------------------------------------------------------
    // GLACIAL BOULDERS SIMULATION (Level 14: trap_glacial_boulder)
    // -------------------------------------------------------------------------
    for (const bld of w.boulders) {
      if (!bld.active && !bld.shattered && p.x >= bld.triggerX) {
        bld.active = true;
        gameAudio.playGunshotBlast();
        w.shake = 10;
      }

      if (bld.active && !bld.shattered) {
        bld.x += bld.vx * dt;
        bld.rotation += (bld.vx / bld.radius) * dt;

        // Downhill slope gravity & landing on stepped platforms
        bld.vy = (bld.vy || 0) + 1300 * dt;
        bld.y += bld.vy * dt;

        for (const plat of w.platforms) {
          if (plat.broken || plat.type === 'hazard') continue;
          if (
            bld.x + bld.radius * 0.5 > plat.x &&
            bld.x - bld.radius * 0.5 < plat.x + plat.width
          ) {
            if (
              bld.y + bld.radius >= plat.y &&
              bld.y + bld.radius - bld.vy * dt <= plat.y + 36
            ) {
              const wasFalling = bld.vy > 140;
              bld.y = plat.y - bld.radius;
              bld.vy = 0;
              if (wasFalling) {
                w.shake = Math.max(w.shake, 5);
                spawnParticles(bld.x, plat.y, 6, '#a5f3fc', 120, 140);
              }
              break;
            }
          }
        }

        // Rumble screen and sound when close to Voltlynx
        const distToPlayer = Math.hypot(
          p.x + p.width / 2 - bld.x,
          p.y + p.height / 2 - bld.y,
        );

        if (distToPlayer < 560) {
          const rumble = (1 - distToPlayer / 560) * 8;
          w.shake = Math.max(w.shake, rumble);
        }

        bld.soundCooldown = (bld.soundCooldown || 0) - dt;
        if (bld.soundCooldown <= 0 && distToPlayer < 450) {
          bld.soundCooldown = 0.36;
          gameAudio.playJumpLandingThud();
        }

        // Frost dust & icy debris spray from rolling
        if (Math.random() < 0.6) {
          w.particles.push({
            x: bld.x - bld.radius * 0.4 + (Math.random() - 0.5) * 16,
            y: bld.y + bld.radius - 4,
            vx: -bld.vx * 0.45 + (Math.random() - 0.5) * 60,
            vy: -25 - Math.random() * 55,
            color: Math.random() > 0.4 ? '#e0f2fe' : '#a5f3fc',
            size: 2.5 + Math.random() * 2,
            life: 0.32,
            maxLife: 0.35,
            gravity: 140,
          });
        }

        // Check impact crash at stop obstacle
        if (bld.x >= bld.stopX) {
          bld.shattered = true;
          bld.active = false;
          w.shake = 22;
          gameAudio.playChiptuneExplosion();
          gameAudio.playJumpLandingThud();
          spawnParticles(bld.x, bld.y, 35, '#a5f3fc', 300);
          spawnParticles(bld.x, bld.y, 25, '#ffffff', 240);
        }

        // Crushing collision with player
        if (distToPlayer < bld.radius + 18) {
          handlePlayerDamage();
          p.vx = 340;
          p.vy = -260;
          w.shake = 16;
        }
      }
    }

    // -------------------------------------------------------------------------
    // FALLING ICICLES SIMULATION (Level 15: hazard_falling_icicle)
    // -------------------------------------------------------------------------
    for (const ici of w.icicles) {
      if (ici.state === 'ATTACHED') {
        ici.y = ici.platY;

        // Ambient loose detachment for unpredictable mountain danger
        if (ici.isAmbientDrop && ici.ambientTimer !== undefined) {
          ici.ambientTimer -= dt;
          if (ici.ambientTimer <= 0) {
            ici.state = 'SHAKING';
            ici.shakeTimer = 0.4;
            gameAudio.playHoverMicroTone();
          }
        }

        // Proximity tell: Voltlynx is below or near the drop column
        const isBeneath =
          Math.abs(p.x + p.width / 2 - ici.x) < 70 &&
          p.y > ici.y &&
          p.y < ici.y + 440;
        if (isBeneath) {
          ici.state = 'SHAKING';
          ici.shakeTimer = 0.4;
          gameAudio.playHoverMicroTone();
        }
      } else if (ici.state === 'SHAKING') {
        ici.shakeTimer -= dt;
        if (Math.random() < 0.6) {
          w.particles.push({
            x: ici.x + (Math.random() - 0.5) * ici.width,
            y: ici.platY + 2,
            vx: (Math.random() - 0.5) * 50,
            vy: 20 + Math.random() * 40,
            color: '#a5f3fc',
            size: 2,
            life: 0.25,
            maxLife: 0.3,
            gravity: 120,
          });
        }
        if (ici.shakeTimer <= 0) {
          ici.state = 'FALLING';
          ici.vy = 120;
          gameAudio.playHoverMicroTone();
        }
      } else if (ici.state === 'FALLING') {
        ici.vy += 850 * dt; // accelerates downward with gravity
        ici.y += ici.vy * dt;

        // Player collision
        if (
          p.x + p.width > ici.x - ici.width / 2 &&
          p.x < ici.x + ici.width / 2 &&
          p.y + p.height > ici.y &&
          p.y < ici.y + ici.height
        ) {
          handlePlayerDamage();
          ici.state = 'SHATTERED';
          gameAudio.playJumpLandingThud();
          spawnParticles(ici.x, ici.y + ici.height / 2, 20, '#a5f3fc', 220);
        }

        // Platform collision below
        for (const plat of w.platforms) {
          if (
            !plat.broken &&
            ici.x >= plat.x &&
            ici.x <= plat.x + plat.width &&
            ici.y + ici.height >= plat.y &&
            ici.y + ici.height - ici.vy * dt <= plat.y + 20
          ) {
            ici.state = 'SHATTERED';
            gameAudio.playJumpLandingThud();
            spawnParticles(ici.x, plat.y, 18, '#a5f3fc', 200);
            spawnParticles(ici.x, plat.y, 10, '#ffffff', 160);
            break;
          }
        }

        if (ici.y > 3650) {
          ici.state = 'SHATTERED';
        }
      }
    }

    // -------------------------------------------------------------------------
    // VERTICAL AUTO-SCROLL SIMULATION (Level 15: La Cumbre Helada)
    // -------------------------------------------------------------------------
    const currentLvl = currentLevelRef.current;
    if (currentLvl === 15 && w.verticalAutoscroll.active) {
      // Pause / Grace period freeze: during pause, camera stays 100% frozen at checkpoint
      if (w.verticalAutoscroll.pauseTimer > 0) {
        w.verticalAutoscroll.pauseTimer = Math.max(0, w.verticalAutoscroll.pauseTimer - dt);
        // Strictly lock camera to checkpoint height during pause (checkpoint.y - 420, e.g. 3060)
        const currentCp = w.checkpoint43 || { x: 480, y: 3480 };
        const freezeY = clamp(currentCp.y - 420, 0, 3060);
        w.cameraY = freezeY;
      } else if (!w.verticalAutoscroll.triggered) {
        const targetCamY = clamp(p.y - 420, 0, 3060);
        w.cameraY += (targetCamY - w.cameraY) * (6 * dt);
        if (p.y < 3300) {
          w.verticalAutoscroll.triggered = true;
        }
      } else if (!w.cinematic.active) {
        // Progressive Camera Speed based on mountain altitude:
        // Base camp (altitude y > 2600): Starts very gentle and slow (~28 px/s)
        // Mid-mountain (2600 >= y > 1400): Increases smoothly to ~42 px/s
        // High peaks (y <= 1400): Thrilling climax speed ~58 px/s
        if (w.cameraY > 2600) {
          w.verticalAutoscroll.speed = 28;
        } else if (w.cameraY > 1400) {
          w.verticalAutoscroll.speed = 42;
        } else {
          w.verticalAutoscroll.speed = 58;
        }

        // Continuous upward ascent towards summit (y = 0)
        w.cameraY = Math.max(0, w.cameraY - w.verticalAutoscroll.speed * dt);

        // If player climbs faster, camera tracks smoothly upward so player isn't off top:
        if (p.y - w.cameraY < 180) {
          w.cameraY = Math.max(0, p.y - 180);
        }
      }
    }

    // Clamp delta-time spike to avoid wild speed or jump calculation errors
    dt = Math.min(dt, 1 / 30);

    // Horizontal Movement & Strict Velocity Calibration
    const MAX_WALK_SPEED = 260;
    const MAX_DASH_SPEED = 420;

    let targetMaxSpeed = Math.min(baseSpeed, MAX_WALK_SPEED);
    if (p.isCrouching) {
      targetMaxSpeed = 70;
    } else if (p.titanTimer > 0) {
      targetMaxSpeed = Math.min(baseSpeed * 0.95, MAX_WALK_SPEED);
    }

    if (p.slowTimer > 0) {
      targetMaxSpeed *= 0.5;
    }

    const isIceSurface =
      currentLevelNumber >= 13 ||
      w.platforms.some(
        (plat) =>
          plat.isIce &&
          !plat.broken &&
          p.isGrounded &&
          p.x + p.width > plat.x &&
          p.x < plat.x + plat.width &&
          Math.abs(p.y + p.height - plat.y) < 12,
      );

    const accel = p.isGrounded ? (isIceSurface ? 1000 : 1500) : 900;
    const decel = p.isGrounded
      ? (isIceSurface ? 550 : (p.isCrouching ? 2400 : 1600))
      : 700;

    if (moveLeft) {
      p.vx -= accel * dt;
      p.facingRight = false;
    } else if (moveRight) {
      p.vx += accel * dt;
      p.facingRight = true;
    } else {
      if (p.vx > 0) {
        p.vx = Math.max(0, p.vx - decel * dt);
      } else if (p.vx < 0) {
        p.vx = Math.min(0, p.vx + decel * dt);
      }
    }

    // Dash sprint initiation
    if (
      dashPressed &&
      !prevAttackPressedRef.current &&
      p.dashTimer <= 0 &&
      !p.isCrouching
    ) {
      p.dashTimer = 0.30;
      if (moveLeft || moveRight) {
        p.isDashing = true;
        const dashSpd = p.slowTimer > 0 ? baseDash * 0.6 : Math.min(baseDash, MAX_DASH_SPEED);
        p.vx = (p.facingRight ? 1 : -1) * dashSpd;
        gameAudio.playArcadeLaser();
        spawnParticles(
          p.x + p.width / 2,
          p.y + p.height / 2,
          10,
          p.slowTimer > 0 ? '#38bdf8' : THEME.neonCyan,
          200,
        );
      } else {
        p.attackTimer = 0.28;
        gameAudio.playMeleePunch();
        spawnParticles(
          p.x + (p.facingRight ? p.width + 10 : -10),
          p.y + p.height / 2,
          8,
          THEME.neonAmber,
          220,
        );
      }
    }

    // Strict horizontal velocity clamping on all terrain (prevents ice velocity runaway)
    if (p.isDashing) {
      if (p.dashTimer <= 0) {
        p.isDashing = false;
        p.vx = clamp(p.vx, -targetMaxSpeed, targetMaxSpeed);
      } else {
        p.vx = clamp(p.vx, -MAX_DASH_SPEED, MAX_DASH_SPEED);
      }
    } else {
      p.vx = clamp(p.vx, -targetMaxSpeed, targetMaxSpeed);
    }

    // Jump Handling & Coyote Time
    const canJump = p.jumpCount === 0 && (p.isGrounded || p.coyoteTimer > 0);
    const enableDouble = getConfig('enableDoubleJump') as boolean;
    // Mobile jump calibration: grant ~10% enhanced jump clearance so mobile players effortlessly clear platform gaps
    const mobileJumpBoost = (showTouchControls || mob.jump) ? 1.10 : 1.0;
    const effJump = (p.slowTimer > 0 ? baseJump * 0.72 : baseJump) * mobileJumpBoost;
    const effDoubleJump = (p.slowTimer > 0 ? baseDoubleJump * 0.72 : baseDoubleJump) * mobileJumpBoost;

    // Down + Jump Drop-Down through One-Way Semi-Solid Platforms
    const standingOnOneWay =
      p.isGrounded &&
      w.platforms.some(
        (plat) =>
          plat.isOneWay &&
          !plat.broken &&
          p.x + p.width > plat.x &&
          p.x < plat.x + plat.width &&
          Math.abs(p.y + p.height - plat.y) < 14,
      );

    if (
      (moveDown || p.isCrouching) &&
      jumpPressed &&
      !prevJumpPressedRef.current &&
      standingOnOneWay
    ) {
      p.dropDownTimer = 0.25;
      p.isGrounded = false;
      p.y += 4;
      p.vy = 120;
      p.coyoteTimer = 0;
      p.jumpBufferTimer = 0;
      gameAudio.playRetroJump();
    }

    if (p.jumpBufferTimer > 0) {
      if (canJump) {
        if (p.isCrouching) {
          p.isCrouching = false;
          p.y -= standHeight - crouchHeight;
          p.height = standHeight;
        }
        p.vy = -effJump;
        p.isGrounded = false;
        p.coyoteTimer = 0;
        p.jumpBufferTimer = 0;
        p.jumpCount = 1;
        p.stretch = 1.35;
        p.squash = 0.75;
        gameAudio.playRetroJump();
        spawnParticles(
          p.x + p.width / 2,
          p.y + p.height,
          8,
          p.slowTimer > 0 ? '#a5f3fc' : '#ffffff',
          140,
          50,
        );
      } else if (enableDouble && p.jumpCount === 1 && !p.isGrounded) {
        p.vy = -effDoubleJump;
        p.jumpBufferTimer = 0;
        p.jumpCount = 2;
        p.stretch = 1.25;
        gameAudio.playRetroJump();
        spawnParticles(
          p.x + p.width / 2,
          p.y + p.height,
          12,
          p.slowTimer > 0 ? '#38bdf8' : THEME.neonCyan,
          180,
          50,
        );
      }
    }

    if (!jumpPressed && prevJumpPressedRef.current && p.vy < 0) {
      // More forgiving jump release on mobile touch so players don't cut their trajectory too short
      p.vy *= showTouchControls ? 0.72 : 0.55;
    }

    // =========================================================================
    // FRAGMENT 4: FLASH-STEP (TELETRANSPORTE DE HIELO)
    // Bound to: Dash + Arriba (moveUp && dashPressed) OR Key Q OR Mobile Flash button
    // =========================================================================
    const flashStepPressed =
      mobileInputRef.current.flashStep ||
      keyboardRef.current.flashStep ||
      (moveUp && dashPressed && !prevAttackPressedRef.current);
    const doFlashStep = flashStepPressed && !prevFlashStepPressedRef.current;

    if (
      doFlashStep &&
      p.flashStepCooldown <= 0 &&
      recoveredFragmentsRef.current >= 4 &&
      energyMana >= 40
    ) {
      p.flashStepCooldown = 4.0;
      setFlashStepCooldownDisplay(4.0);
      setEnergyMana((prev) => Math.max(0, prev - 40));
      gameAudio.playHoverMicroTone();
      gameAudio.playRetroJump();

      const oldX = p.x;
      const oldY = p.y;
      const dir = p.facingRight ? 1 : -1;
      const teleportDist = 320;
      const targetX = clamp(
        p.x + dir * teleportDist,
        30,
        w.levelWidth - p.width - 30,
      );

      // Flurry of snow and frost particles at departure
      spawnParticles(oldX + p.width / 2, oldY + p.height / 2, 28, '#a5f3fc', 260, 20);
      spawnParticles(oldX + p.width / 2, oldY + p.height / 2, 18, '#ffffff', 220, 20);

      p.x = targetX;
      p.vx = dir * 180;
      p.invulnerableTimer = 0.85; // Full invulnerability during/after flash

      // Flurry of snow at arrival
      spawnParticles(p.x + p.width / 2, p.y + p.height / 2, 32, '#38bdf8', 280, 20);
      spawnParticles(p.x + p.width / 2, p.y + p.height / 2, 20, '#ffffff', 240, 20);
      w.shake = Math.max(w.shake, 6);
    }

    // =========================================================================
    // FRAGMENT 2: LLAMARADA VOLCÁNICA (DRAGON FLAME - WIDE CONE BLAST)
    // Bound to: Key E / Key O / Key X OR Mobile Flame Button (F)
    // Consumes 25 mana, pierces through mobs, incinerates enemy projectiles!
    // =========================================================================
    const flamePressed =
      mobileInputRef.current.flame ||
      keyboardRef.current.flame;
    const doFlame = flamePressed && !prevFlamePressedRef.current;

    if (
      doFlame &&
      p.flameCooldown <= 0 &&
      recoveredFragmentsRef.current >= 2 &&
      energyMana >= 25
    ) {
      p.flameCooldown = 0.5;
      setEnergyMana((prev) => Math.max(0, prev - 25));
      gameAudio.playGunshotBlast();
      gameAudio.playChiptuneExplosion();
      w.shake = Math.max(w.shake, 8);

      const baseDir = p.facingRight ? 1 : -1;
      const originX = p.facingRight ? p.x + p.width + 10 : p.x - 10;
      const originY = p.y + p.height * 0.45;

      // Cone angles: 9 flame projectiles sweeping across wide cone
      const flameAngles = [-0.45, -0.3, -0.15, 0, 0.15, 0.3, 0.45];
      flameAngles.forEach((ang) => {
        const spd = 480 + Math.random() * 120;
        const vx = baseDir * Math.cos(ang) * spd;
        const vy = Math.sin(ang) * spd * 0.8;
        w.projectiles.push({
          id: Date.now() + Math.random(),
          x: originX,
          y: originY,
          vx,
          vy,
          radius: 18 + Math.random() * 6,
          isPlayer: true,
          life: 0.48,
          color: Math.random() > 0.4 ? '#f97316' : '#ea580c',
          isFlame: true,
          pierceCount: 99,
          damage: 65,
        });
      });

      // Fiery blast particles
      spawnParticles(originX, originY, 20, '#f97316', 240, 50);
      spawnParticles(originX, originY, 14, '#fde047', 200, 30);
    }

    // Thunder Shot projectile attack with Multi-directional Aiming (Style Contra / Metal Slug)
    // Enhanced with Fragment 4: Rayo Electrogélido (+50% dmg, freeze slowing)
    const doShoot = thunderPressed && !prevShootPressedRef.current;
    const isCharged = p.needleTimer > 0 || hasThunderShot;
    const isFrostEmpowered = recoveredFragmentsRef.current >= 4;

    if (doShoot && p.shootCooldown <= 0 && (energyMana >= 10 || isCharged)) {
      const frags = recoveredFragmentsRef.current || 0;
      p.shootCooldown = isCharged ? 0.18 : 0.24;
      if (!isCharged) {
        setEnergyMana((prev) => Math.max(0, prev - 14));
      }
      gameAudio.playArcadeLaser();

      const baseShotSpeed = isCharged ? 740 : 580;
      const facingDir = p.facingRight ? 1 : -1;
      const isHorizPressed = moveLeft || moveRight;

      let projVx = 0;
      let projVy = 0;
      let projX = p.facingRight ? p.x + p.width + 6 : p.x - 14;
      let projY = p.y + p.height / 2 - 2;

      if (moveUp && !isHorizPressed) {
        // Apuntado Hacia Arriba (90° Vertical)
        projVx = 0;
        projVy = -baseShotSpeed;
        projX = p.x + p.width / 2;
        projY = p.y - 8;
      } else if (moveUp && isHorizPressed) {
        // Apuntado Diagonal Superior (45° Diagonal Up)
        const aimDir = moveRight ? 1 : moveLeft ? -1 : facingDir;
        projVx = aimDir * baseShotSpeed * 0.7071;
        projVy = -baseShotSpeed * 0.7071;
        projX = aimDir > 0 ? p.x + p.width + 4 : p.x - 12;
        projY = p.y + 4;
      } else if (moveDown && !p.isGrounded) {
        // Apuntado en Salto hacia Abajo / Diagonal Inferior
        const aimDir = moveRight ? 1 : moveLeft ? -1 : facingDir;
        projVx = aimDir * baseShotSpeed * 0.7071;
        projVy = baseShotSpeed * 0.7071;
        projX = aimDir > 0 ? p.x + p.width + 4 : p.x - 12;
        projY = p.y + p.height + 4;
      } else {
        // Apuntado Horizontal Estándar
        projVx = facingDir * baseShotSpeed;
        projVy = 0;
        projX = p.facingRight ? p.x + p.width + 6 : p.x - 14;
        projY = p.y + p.height / 2 - 2;
      }

      const projRadius = isCharged
        ? frags >= 1
          ? 12
          : 9
        : frags >= 1
        ? 8
        : 6;
      const projPierce = frags >= 1 ? 1 : 0;
      const projColor = isFrostEmpowered
        ? '#a5f3fc'
        : isCharged
        ? frags >= 1
          ? '#fef08a'
          : '#fbbf24'
        : frags >= 1
        ? '#38bdf8'
        : THEME.neonCyan;

      // Base damage: 35. With Fragment 4 (Rayo Electrogélido): +50% extra!
      let baseDmg = Math.round(35 * (1 + frags * 0.2));
      if (isFrostEmpowered) {
        baseDmg = Math.round(baseDmg * 1.5);
      }

      w.projectiles.push({
        id: Date.now() + Math.random(),
        x: projX,
        y: projY,
        vx: projVx,
        vy: projVy,
        radius: projRadius,
        isPlayer: true,
        life: isCharged ? 1.8 : 1.3,
        color: projColor,
        isBouncing: isCharged && projVy >= 0,
        bouncesLeft: isCharged ? 3 : 0,
        pierceCount: projPierce,
        damage: baseDmg,
        isFrostBolt: isFrostEmpowered,
      });

      // Directional spark muzzle flash along the aiming vector
      const vMag = Math.hypot(projVx, projVy) || 1;
      const dirNormX = projVx / vMag;
      const dirNormY = projVy / vMag;
      const sparkCount = frags >= 1 ? 14 : 10;
      for (let s = 0; s < sparkCount; s++) {
        const spreadAng = (Math.random() - 0.5) * 0.45;
        const sparkSpeed = 130 + Math.random() * 150;
        const cosS = Math.cos(spreadAng);
        const sinS = Math.sin(spreadAng);
        const sparkVx = (dirNormX * cosS - dirNormY * sinS) * sparkSpeed;
        const sparkVy = (dirNormX * sinS + dirNormY * cosS) * sparkSpeed;
        w.particles.push({
          x: projX,
          y: projY,
          vx: sparkVx,
          vy: sparkVy,
          color: isFrostEmpowered && s % 2 === 0 ? '#fef08a' : projColor,
          size: 2.5 + Math.random() * 3.5,
          life: 0.18 + Math.random() * 0.18,
          maxLife: 0.36,
        });
      }
    }

    // Gravity Calculation
    let grav = 1750;
    if (p.vy < 0) {
      if (Math.abs(p.vy) < 80) {
        grav = 700;
      } else {
        grav = 1500;
      }
    }
    p.vy += grav * dt;
    // Bounded vertical velocity clamp (prevents excessive launch or speed stacking)
    p.vy = clamp(p.vy, -800, 750);

    p.squash += (1 - p.squash) * (10 * dt);
    p.stretch += (1 - p.stretch) * (10 * dt);

    // X Collision
    p.x += p.vx * dt;
    if (
      currentLevelNumber === 4 ||
      currentLevelNumber === 8 ||
      currentLevelNumber === 12
    ) {
      p.x = clamp(p.x, 24, w.levelWidth - p.width - 24);
    } else {
      p.x = clamp(p.x, 0, w.levelWidth - p.width);
    }

    for (const plat of w.platforms) {
      if (plat.broken) continue;
      // Semi-solid one-way platforms NEVER block horizontal movement with side walls
      if (plat.isOneWay) continue;

      if (
        p.x < plat.x + plat.width &&
        p.x + p.width > plat.x &&
        p.y < plat.y + plat.height &&
        p.y + p.height > plat.y
      ) {
        if (plat.type === 'breakable' && p.titanTimer > 0) {
          plat.broken = true;
          w.shake = 12;
          w.hitStop = 0.05;
          gameAudio.playChiptuneExplosion();
          spawnParticles(
            plat.x + plat.width / 2,
            plat.y + plat.height / 2,
            24,
            '#8b5cf6',
            250,
          );
          setGameState((s) => ({...s, score: s.score + 150}));
        } else if (plat.type !== 'hazard') {
          if (p.vx > 0) {
            p.x = plat.x - p.width;
          } else if (p.vx < 0) {
            p.x = plat.x + plat.width;
          }
          p.vx = 0;
        }
      }
    }

    // Y Collision
    p.y += p.vy * dt;
    p.isGrounded = false;
    const prevY = p.y - p.vy * dt;

    // Check Jump Geysers (Super Bounce Pads)
    for (const geyser of w.geysers) {
      if (geyser.cooldown > 0) {
        geyser.cooldown -= dt;
      }
      if (
        p.x + p.width > geyser.x &&
        p.x < geyser.x + geyser.width &&
        p.y + p.height >= geyser.y - 12 &&
        p.y + p.height <= geyser.y + 24 &&
        p.vy >= -50
      ) {
        // Trigger super upward propulsion!
        p.vy = -baseJump * 1.55;
        p.isGrounded = false;
        p.jumpCount = 1;
        p.stretch = 1.45;
        geyser.cooldown = 0.2;
        gameAudio.playShieldBlock();
        gameAudio.playRetroJump();
        w.shake = 6;
        spawnParticles(
          geyser.x + geyser.width / 2,
          geyser.y,
          24,
          THEME.neonCyan,
          260,
          100,
        );
      }
    }

    for (const plat of w.platforms) {
      if (plat.broken) continue;

      // ONE-WAY / SEMI-SOLID JUMP-THROUGH PLATFORM
      if (plat.isOneWay) {
        // When jumping upward (vy < 0) or dropping down through: ignore collision completely!
        if (p.vy < 0 || p.dropDownTimer > 0) continue;

        // Falling downward (vy >= 0): check top surface landing with generous tolerance
        const landingTolerance = Math.max(28, p.vy * dt + 12);
        if (
          p.x + p.width > plat.x + 2 &&
          p.x < plat.x + plat.width - 2 &&
          prevY + p.height <= plat.y + landingTolerance &&
          p.y + p.height >= plat.y
        ) {
          p.y = plat.y - p.height;
          if (p.vy > 250) {
            p.squash = 1.3;
            p.stretch = 0.7;
            gameAudio.playJumpLandingThud();
            if (p.titanTimer > 0) {
              w.shake = 8;
              spawnParticles(
                p.x + p.width / 2,
                p.y + p.height,
                14,
                '#a855f7',
                220,
              );
            }
          }
          p.vy = 0;
          p.isGrounded = true;
        }
        continue;
      }

      if (
        p.x < plat.x + plat.width &&
        p.x + p.width > plat.x &&
        p.y < plat.y + plat.height &&
        p.y + p.height > plat.y
      ) {
        if (plat.type === 'hazard') {
          handlePlayerDamage();
          return;
        }

        if (p.vy > 0 && p.y + p.height - p.vy * dt <= plat.y + 14) {
          p.y = plat.y - p.height;
          if (p.vy > 250) {
            p.squash = 1.3;
            p.stretch = 0.7;
            gameAudio.playJumpLandingThud();
            if (p.titanTimer > 0) {
              w.shake = 8;
              spawnParticles(
                p.x + p.width / 2,
                p.y + p.height,
                14,
                '#a855f7',
                220,
              );
            }
          }
          p.vy = 0;
          p.isGrounded = true;
        } else if (p.vy < 0 && p.y - p.vy * dt >= plat.y + plat.height - 14) {
          // CORNER SLIP / EDGE FORGIVENESS (Mario & Celeste Style)
          // If player's head grazes the corner by <= 8px, nudge horizontally into open space instead of dead-stop bonking!
          const leftCornerOverlap = (p.x + p.width) - plat.x;
          const rightCornerOverlap = (plat.x + plat.width) - p.x;

          if (leftCornerOverlap > 0 && leftCornerOverlap <= 8) {
            // Grazed bottom-left corner of platform: slip left smoothly into open air
            p.x = plat.x - p.width - 1;
          } else if (rightCornerOverlap > 0 && rightCornerOverlap <= 8) {
            // Grazed bottom-right corner of platform: slip right smoothly into open air
            p.x = plat.x + plat.width + 1;
          } else {
            // Direct ceiling impact:
            p.y = plat.y + plat.height;
            p.vy = 0;

            if (plat.type === 'dynamo' && !plat.hit) {
              plat.hit = true;
              w.shake = 6;
              gameAudio.playMeleePunch();
              spawnParticles(
                plat.x + plat.width / 2,
                plat.y,
                12,
                THEME.neonAmber,
                180,
              );

              const rewards: Array<ItemEntity['type']> = [
                'crystal',
                'resonant_core',
                'storm_needle',
                'heart_hp',
                'heart_1up',
              ];
              const chosen = rewards[Math.floor(Math.random() * rewards.length)];
              w.items.push({
                id: Date.now() + Math.random(),
                x: plat.x + 8,
                y: plat.y - 36,
                vx: 0,
                vy: -200,
                type: chosen,
              });
              gameAudio.playPowerupChime();
            } else if (plat.type === 'breakable' && p.titanTimer > 0) {
              plat.broken = true;
              w.shake = 10;
              gameAudio.playChiptuneExplosion();
              spawnParticles(
                plat.x + plat.width / 2,
                plat.y + plat.height / 2,
                20,
                '#8b5cf6',
                240,
              );
            }
          }
        }
      }
    }

    // Dynamic Safe Ground Platform Recording (Prevents pit respawn death loop in horizontal levels)
    if (currentLevelNumber !== 15 && p.isGrounded && Math.abs(p.vy) < 0.1) {
      const groundPlat = w.platforms.find(
        (plat) =>
          !plat.broken &&
          plat.type === 'ground' &&
          !plat.moving &&
          !plat.isOneWay &&
          plat.width >= 120 &&
          p.x + p.width > plat.x + 8 &&
          p.x < plat.x + plat.width - 8 &&
          Math.abs(p.y + p.height - plat.y) < 14,
      );
      if (groundPlat) {
        w.safeRespawnX = groundPlat.x + groundPlat.width / 2 - p.width / 2;
        w.safeRespawnY = groundPlat.y - p.height - 4;
      }
    }

    // Pitfall Death Check (y > 560 = pit death in Zone 3 high-altitude stages)
    const activeLvl = currentLevelRef.current;
    if (activeLvl === 15) {
      // In Stage 4-3, pit death happens ONLY if player falls below bottom of camera
      // AND only when autoscroll pause timer <= 0, not respawning, not invulnerable!
      if (
        w.verticalAutoscroll.pauseTimer <= 0 &&
        !w.isRespawning &&
        p.invulnerableTimer <= 0 &&
        p.y > w.cameraY + 560
      ) {
        handlePlayerDamage(true);
        return;
      }
    } else {
      const pitThreshold =
        activeLvl >= 9 && activeLvl <= 11
          ? 560
          : w.levelHeight + 100;
      if (p.y > pitThreshold) {
        handlePlayerDamage(true);
        return;
      }
    }

    // Checkpoint updates per level
    if (currentLevelNumber === 1) {
      if (p.x >= 1460 && w.checkpointX < 1460) {
        w.checkpointX = 1460;
        w.checkpointY = 412;
        w.safeRespawnX = 1460;
        w.safeRespawnY = 412;
        gameAudio.playLevelUpStinger();
        spawnParticles(w.checkpointX, w.checkpointY, 20, THEME.neonCyan, 240);
      } else if (p.x >= 2440 && w.checkpointX < 2440) {
        w.checkpointX = 2440;
        w.checkpointY = 412;
        w.safeRespawnX = 2440;
        w.safeRespawnY = 412;
        gameAudio.playLevelUpStinger();
        spawnParticles(w.checkpointX, w.checkpointY, 20, THEME.neonAmber, 240);
      }
    } else if (currentLevelNumber === 2) {
      if (p.x >= 1260 && w.checkpointX < 1260) {
        w.checkpointX = 1260;
        w.checkpointY = 392;
        w.safeRespawnX = 1260;
        w.safeRespawnY = 392;
        gameAudio.playLevelUpStinger();
        spawnParticles(w.checkpointX, w.checkpointY, 20, THEME.neonCyan, 240);
      } else if (p.x >= 2500 && w.checkpointX < 2500) {
        w.checkpointX = 2500;
        w.checkpointY = 392;
        w.safeRespawnX = 2500;
        w.safeRespawnY = 392;
        gameAudio.playLevelUpStinger();
        spawnParticles(w.checkpointX, w.checkpointY, 20, THEME.neonAmber, 240);
      }
    } else if (currentLevelNumber === 3) {
      if (p.x >= 1500 && w.checkpointX < 1500) {
        w.checkpointX = 1500;
        w.checkpointY = 412;
        w.safeRespawnX = 1500;
        w.safeRespawnY = 412;
        gameAudio.playLevelUpStinger();
        spawnParticles(w.checkpointX, w.checkpointY, 20, THEME.neonCyan, 240);
      } else if (p.x >= 2400 && w.checkpointX < 2400) {
        w.checkpointX = 2400;
        w.checkpointY = 392;
        w.safeRespawnX = 2400;
        w.safeRespawnY = 392;
        gameAudio.playLevelUpStinger();
        spawnParticles(w.checkpointX, w.checkpointY, 24, THEME.neonAmber, 240);
      }
    } else if (currentLevelNumber === 5) {
      if (p.x >= 1500 && w.checkpointX < 1500) {
        w.checkpointX = 1500;
        w.checkpointY = 412;
        w.safeRespawnX = 1500;
        w.safeRespawnY = 412;
        gameAudio.playLevelUpStinger();
        spawnParticles(w.checkpointX, w.checkpointY, 20, '#c084fc', 240);
      } else if (p.x >= 2800 && w.checkpointX < 2800) {
        w.checkpointX = 2800;
        w.checkpointY = 412;
        w.safeRespawnX = 2800;
        w.safeRespawnY = 412;
        gameAudio.playLevelUpStinger();
        spawnParticles(w.checkpointX, w.checkpointY, 20, THEME.neonCyan, 240);
      }
    } else if (currentLevelNumber === 6) {
      if (p.x >= 1500 && w.checkpointX < 1500) {
        w.checkpointX = 1500;
        w.checkpointY = 412;
        w.safeRespawnX = 1500;
        w.safeRespawnY = 412;
        gameAudio.playLevelUpStinger();
        spawnParticles(w.checkpointX, w.checkpointY, 20, '#c084fc', 240);
      } else if (p.x >= 3200 && w.checkpointX < 3200) {
        w.checkpointX = 3200;
        w.checkpointY = 412;
        w.safeRespawnX = 3200;
        w.safeRespawnY = 412;
        gameAudio.playLevelUpStinger();
        spawnParticles(w.checkpointX, w.checkpointY, 20, THEME.neonCyan, 240);
      }
    } else if (currentLevelNumber === 7) {
      if (p.x >= 1700 && w.checkpointX < 1700) {
        w.checkpointX = 1700;
        w.checkpointY = 412;
        w.safeRespawnX = 1700;
        w.safeRespawnY = 412;
        gameAudio.playLevelUpStinger();
        spawnParticles(w.checkpointX, w.checkpointY, 20, '#e879f9', 240);
      } else if (p.x >= 3400 && w.checkpointX < 3400) {
        w.checkpointX = 3400;
        w.checkpointY = 412;
        w.safeRespawnX = 3400;
        w.safeRespawnY = 412;
        gameAudio.playLevelUpStinger();
        spawnParticles(w.checkpointX, w.checkpointY, 20, '#38bdf8', 240);
      }
    } else if (currentLevelNumber === 9) {
      if (p.x >= 1900 && w.checkpointX < 1900) {
        w.checkpointX = 1900;
        w.checkpointY = 392;
        w.safeRespawnX = 1900;
        w.safeRespawnY = 392;
        gameAudio.playLevelUpStinger();
        spawnParticles(w.checkpointX, w.checkpointY, 20, '#38bdf8', 240);
      } else if (p.x >= 3600 && w.checkpointX < 3600) {
        w.checkpointX = 3600;
        w.checkpointY = 372;
        w.safeRespawnX = 3600;
        w.safeRespawnY = 372;
        gameAudio.playLevelUpStinger();
        spawnParticles(w.checkpointX, w.checkpointY, 20, '#facc15', 240);
      }
    } else if (currentLevelNumber === 10) {
      if (p.x >= 1950 && w.checkpointX < 1950) {
        w.checkpointX = 1950;
        w.checkpointY = 392;
        w.safeRespawnX = 1950;
        w.safeRespawnY = 392;
        gameAudio.playLevelUpStinger();
        spawnParticles(w.checkpointX, w.checkpointY, 20, '#facc15', 240);
      } else if (p.x >= 3800 && w.checkpointX < 3800) {
        w.checkpointX = 3800;
        w.checkpointY = 372;
        w.safeRespawnX = 3800;
        w.safeRespawnY = 372;
        gameAudio.playLevelUpStinger();
        spawnParticles(w.checkpointX, w.checkpointY, 20, '#38bdf8', 240);
      }
    } else if (currentLevelNumber === 11) {
      if (p.x >= 2500 && w.checkpointX < 2500) {
        w.checkpointX = 2500;
        w.checkpointY = 392;
        w.safeRespawnX = 2500;
        w.safeRespawnY = 392;
        gameAudio.playLevelUpStinger();
        spawnParticles(w.checkpointX, w.checkpointY, 20, '#818cf8', 240);
      } else if (p.x >= 4840 && w.checkpointX < 4840) {
        w.checkpointX = 4840;
        w.checkpointY = 372;
        w.safeRespawnX = 4840;
        w.safeRespawnY = 372;
        gameAudio.playLevelUpStinger();
        spawnParticles(w.checkpointX, w.checkpointY, 20, '#c084fc', 240);
      }
    } else if (currentLevelNumber === 13) {
      if (p.x >= 1800 && w.checkpointX < 1800) {
        w.checkpointX = 1800;
        w.checkpointY = 412;
        w.safeRespawnX = 1800;
        w.safeRespawnY = 412;
        gameAudio.playLevelUpStinger();
        spawnParticles(w.checkpointX, w.checkpointY, 20, '#38bdf8', 240);
      } else if (p.x >= 3700 && w.checkpointX < 3700) {
        w.checkpointX = 3700;
        w.checkpointY = 412;
        w.safeRespawnX = 3700;
        w.safeRespawnY = 412;
        gameAudio.playLevelUpStinger();
        spawnParticles(w.checkpointX, w.checkpointY, 20, '#a5f3fc', 240);
      }
    } else if (currentLevelNumber === 14) {
      if (p.x >= 1740 && w.checkpointX < 1740) {
        w.checkpointX = 1740;
        w.checkpointY = 512;
        w.safeRespawnX = 1740;
        w.safeRespawnY = 512;
        gameAudio.playLevelUpStinger();
        spawnParticles(w.checkpointX, w.checkpointY, 20, '#06b6d4', 240);
      } else if (p.x >= 3500 && w.checkpointX < 3500) {
        w.checkpointX = 3500;
        w.checkpointY = 484;
        w.safeRespawnX = 3500;
        w.safeRespawnY = 484;
        gameAudio.playLevelUpStinger();
        spawnParticles(w.checkpointX, w.checkpointY, 20, '#a5f3fc', 240);
      }
    } else if (currentLevelRef.current === 15) {
      // Level 4-3: Checkpoints strictly activate silently with a chime and lantern lighting
      // Checkpoint 1 (Refugio Glacial Intermedio: y = 2400):
      if (
        w.lastCheckpoint43 < 1 &&
        p.isGrounded &&
        Math.abs(p.y + p.height - 2400) < 16 &&
        p.x + p.width > 80 &&
        p.x < 880
      ) {
        w.lastCheckpoint43 = 1;
        w.checkpoint43 = { x: 480, y: 2400 };
        w.checkpointX = 480;
        w.checkpointY = 2400;
        w.safeRespawnX = 480;
        w.safeRespawnY = 2400;
        const cp2 = w.mountainCheckpoints.find((c) => c.id === 2);
        if (cp2) {
          cp2.activated = true;
          cp2.beaconLit = true;
        }
        w.verticalAutoscroll.pauseTimer = 3.5;
        w.verticalAutoscroll.resumeBannerTimer = 0;
        w.cameraY = clamp(2400 - 420, 0, 3060);
        gameAudio.playLevelUpStinger();
        spawnParticles(480, 2400, 24, '#fbbf24', 240);
        spawnParticles(400, 2400, 16, '#38bdf8', 180);
      }
      // Checkpoint 2 (Meseta Alta de Viento: y = 1275 / 1300):
      else if (
        w.lastCheckpoint43 < 2 &&
        p.isGrounded &&
        Math.abs(p.y + p.height - 1275) < 16 &&
        p.x + p.width > 80 &&
        p.x < 880
      ) {
        w.lastCheckpoint43 = 2;
        w.checkpoint43 = { x: 480, y: 1275 };
        w.checkpointX = 480;
        w.checkpointY = 1275;
        w.safeRespawnX = 480;
        w.safeRespawnY = 1275;
        const cp3 = w.mountainCheckpoints.find((c) => c.id === 3);
        if (cp3) {
          cp3.activated = true;
          cp3.beaconLit = true;
        }
        w.verticalAutoscroll.pauseTimer = 3.5;
        w.verticalAutoscroll.resumeBannerTimer = 0;
        w.cameraY = clamp(1275 - 420, 0, 3060);
        gameAudio.playLevelUpStinger();
        spawnParticles(480, 1275, 24, '#fde047', 240);
        spawnParticles(540, 1275, 16, '#38bdf8', 180);
      }
    }

    // Dedicated Boss Chambers (Level 4, Level 8, Level 12, Level 16)
    if (
      currentLevelNumber === 4 ||
      currentLevelNumber === 8 ||
      currentLevelNumber === 12 ||
      currentLevelNumber === 16
    ) {
      w.bossArenaActive = true;
      w.bossDoorLocked = true;
    }

    // Secret Bonus Conduit Interactions (Super Mario Bros Pipe Mechanics)
    for (const conduit of w.bonusConduits) {
      const conduitCenterX = conduit.x + conduit.width / 2;
      const playerCenterX = p.x + p.width / 2;
      const isHorizAligned = Math.abs(playerCenterX - conduitCenterX) < 28;
      const isVertOnTop = Math.abs(p.y + p.height - conduit.y) < 16;

      if (isHorizAligned && isVertOnTop && p.isGrounded) {
        if (!conduit.isExit && !conduit.isBonusRoomExit && (moveDown || p.isCrouching)) {
          // Trigger smooth slide down into pipe (Mario style)
          w.pipeSequence = {
            active: true,
            phase: 'ENTERING',
            timer: 0.55,
            duration: 0.55,
            startX: p.x,
            startY: p.y,
            targetY: conduit.y + 40,
            targetLevel: currentLevelNumber,
            returnX: conduit.returnX ?? (conduit.x + 600),
            returnY: conduit.returnY ?? conduit.y,
            conduitX: conduit.x,
            conduitY: conduit.y,
          };
          p.vx = 0;
          p.vy = 0;
          gameAudio.playRetroJump();
          w.shake = 5;
          spawnParticles(conduitCenterX, conduit.y + 12, 18, '#fbbf24', 160);
          return;
        } else if (conduit.isBonusRoomExit && (moveDown || p.isCrouching || jumpPressed)) {
          // Trigger smooth slide down into exit conduit back to main stage
          const ret = w.bonusReturnState;
          w.pipeSequence = {
            active: true,
            phase: 'ENTERING',
            timer: 0.55,
            duration: 0.55,
            startX: p.x,
            startY: p.y,
            targetY: conduit.y + 40,
            targetLevel: ret ? ret.level : 5,
            returnX: ret ? ret.x : 2600,
            returnY: ret ? ret.y : 402,
            conduitX: conduit.x,
            conduitY: conduit.y,
          };
          p.vx = 0;
          p.vy = 0;
          gameAudio.playRetroJump();
          w.shake = 5;
          spawnParticles(conduitCenterX, conduit.y + 12, 18, '#38bdf8', 160);
          return;
        }
      }
    }

    // Genuine Warp Portal Exit Goal Check (Levels 1, 2, 5, 6, 9, 10, 13, 14)
    const portalW = 84;
    const portalH = 88;
    const isStandardPortalLevel =
      currentLevelNumber === 1 ||
      currentLevelNumber === 2 ||
      currentLevelNumber === 5 ||
      currentLevelNumber === 6 ||
      currentLevelNumber === 9 ||
      currentLevelNumber === 10 ||
      currentLevelNumber === 13 ||
      currentLevelNumber === 14;

    if (
      isStandardPortalLevel &&
      !w.cinematic.active &&
      w.celebrationPhase === 'NONE' &&
      !w.isBonusRoom &&
      p.x + p.width >= w.beaconX + 16 &&
      p.x <= w.beaconX + portalW - 16 &&
      p.y + p.height >= w.beaconY + 12 &&
      p.y <= w.beaconY + portalH + 20
    ) {
      let nextLevel: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 = (currentLevelNumber + 1) as any;
      if (currentLevelNumber === 1) nextLevel = 2;
      else if (currentLevelNumber === 2) nextLevel = 3;
      else if (currentLevelNumber === 5) nextLevel = 6;
      else if (currentLevelNumber === 6) nextLevel = 7;
      else if (currentLevelNumber === 9) nextLevel = 10;
      else if (currentLevelNumber === 10) nextLevel = 11;
      else if (currentLevelNumber === 13) nextLevel = 14;
      else if (currentLevelNumber === 14) nextLevel = 15;

      startWalkingTransition(nextLevel);
      return;
    }

    // Monumental Celestial Temple Gate Check (Level 3-3 -> Ascending to Stage 3-B Celestial Throne!)
    if (
      currentLevelNumber === 11 &&
      !w.cinematic.active &&
      w.celebrationPhase === 'NONE' &&
      !w.isBonusRoom &&
      w.celestialTempleGate &&
      p.x + p.width >= w.celestialTempleGate.doorX &&
      p.x <= w.celestialTempleGate.doorX + w.celestialTempleGate.doorW &&
      p.y + p.height >= w.celestialTempleGate.doorY
    ) {
      startWalkingTransition(
        12,
        'Sector 3-B: El Trono Celestial',
        'Acceso al trono de Asura Celestial',
      );
      return;
    }

    // Gran Puerta de la Ciudadela Glacial (Nivel 4-3: Cumbre Helada -> Stage 4-B: Trono de Kryona!)
    if (
      currentLevelRef.current === 15 &&
      !w.cinematic.active &&
      w.celebrationPhase === 'NONE' &&
      !w.isBonusRoom &&
      w.glacialCitadelGate &&
      p.y <= 320 &&
      p.x + p.width >= w.glacialCitadelGate.doorX &&
      p.x <= w.glacialCitadelGate.doorX + w.glacialCitadelGate.doorW &&
      p.y + p.height >= w.glacialCitadelGate.doorY &&
      p.y <= w.glacialCitadelGate.doorY + w.glacialCitadelGate.doorH + 30
    ) {
      startWalkingTransition(
        16,
        'Sector 4-B: El Trono de Kryona',
        'Entrada al palacio gélido de la Emperatriz',
      );
      return;
    }

    // Puerta Monumental del Trono del Vacío (Nivel 5-1 -> Fase 5-B: El Trono del Caos!)
    if (
      currentLevelNumber === 17 &&
      !w.cinematic.active &&
      w.celebrationPhase === 'NONE' &&
      !w.isBonusRoom &&
      w.voidThroneGate &&
      p.x + p.width >= w.voidThroneGate.doorX &&
      p.x <= w.voidThroneGate.doorX + w.voidThroneGate.doorW &&
      p.y + p.height >= w.voidThroneGate.doorY
    ) {
      startWalkingTransition(
        18,
        'Fase 5-B: El Trono del Caos',
        'Catedral de obsidiana de Ghotur',
      );
      return;
    }

    // Cueva Ancestral Goal Check (Level 2-3 -> Enters Dragon Cave into Boss Lair Stage 2-B!)
    if (
      currentLevelNumber === 7 &&
      !w.cinematic.active &&
      w.celebrationPhase === 'NONE' &&
      w.dragonGate &&
      p.x + p.width >= w.dragonGate.doorX &&
      p.x <= w.dragonGate.doorX + w.dragonGate.doorW &&
      p.y + p.height >= w.dragonGate.doorY
    ) {
      startWalkingTransition(
        8,
        'Sector 2-B: La Guarida del Dragón',
        'Descenso a la cueva de Ignisvorm',
      );
      return;
    }

    // Monumental Storm Pyramid Goal Check (Level 1-3 -> Enters Pyramid into Boss Chamber!)
    if (
      currentLevelNumber === 3 &&
      !w.cinematic.active &&
      w.celebrationPhase === 'NONE' &&
      w.pyramid &&
      p.x + p.width >= w.pyramid.doorX &&
      p.x <= w.pyramid.doorX + w.pyramid.doorW &&
      p.y + p.height >= w.pyramid.doorY
    ) {
      startWalkingTransition(
        4,
        'Sector 1-B: El Salón del Guardián',
        'Entrada a la cámara del Escarabajo Quimérico',
      );
      return;
    }

    // Celestial Fragment Collection in Level 4, 8, 12, 16 (Boss Defeat Win Condition)
    if (w.celestialFragment && !w.celestialFragment.collected) {
      w.celestialFragment.bobTimer += dt * 4;
      const fragDist = Math.hypot(
        p.x + p.width / 2 - w.celestialFragment.x,
        p.y + p.height / 2 - w.celestialFragment.y,
      );
      if (fragDist < 52) {
        w.celestialFragment.collected = true;
        const targetFragCount =
          currentLevelNumber === 16
            ? 4
            : currentLevelNumber === 12
            ? 3
            : currentLevelNumber === 8
            ? 2
            : 1;

        const nextUnlockLevel: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 =
          targetFragCount === 4
            ? 17
            : targetFragCount === 3
            ? 13
            : targetFragCount === 2
            ? 9
            : 5;

        const pwrText =
          targetFragCount === 4
            ? '✦ FRAGMENTO 4/5 RECUPERADO: FLASH-STEP TELETRANSPORTE Y RAYO ELECTROGÉLIDO ✦'
            : targetFragCount === 3
            ? '✦ FRAGMENTO 3/5 RECUPERADO: RESURRECCIÓN DIVINA (+3 VIDAS CELESTIALES) ✦'
            : targetFragCount === 2
            ? '✦ FRAGMENTO 2/5 RECUPERADO: LLAMARADA VOLCÁNICA PERFORADORA [E/O/F] ✦'
            : '✦ FRAGMENTO 1/5 RECUPERADO: +3 VIDAS EXTRA Y DOBLE INVULNERABILIDAD ✦';

        const bossNameStr =
          currentLevelNumber === 16
            ? 'REINA DE HIELO KRYONA'
            : currentLevelNumber === 12
            ? 'DIOS CÓSMICO ASURA'
            : currentLevelNumber === 8
            ? 'COLOSAL DRAGÓN UMBRÍO DE OBSIDIANA'
            : 'ESCARABAJO QUIMÉRICO TITÁNICO';

        const bossAssetStr =
          currentLevelNumber === 16
            ? 'bg_frost_empress_throne'
            : currentLevelNumber === 12
            ? 'bg_celestial_throne'
            : currentLevelNumber === 8
            ? 'boss_volcanic_dragon'
            : 'boss_electric_chimera';

        triggerStageVictory(
          true,
          bossNameStr,
          bossAssetStr,
          targetFragCount,
          pwrText,
          nextUnlockLevel,
        );
        return;
      }
    }

    // -------------------------------------------------------------------------
    // SHOCKWAVES SIMULATION (Ondas Expansivas Terrestres del Picado Sísmico)
    // -------------------------------------------------------------------------
    for (let i = w.shockwaves.length - 1; i >= 0; i--) {
      const sw = w.shockwaves[i];
      sw.x += sw.vx * dt;
      sw.life -= dt;

      // Spawn traveling electric ground sparks
      if (Math.random() < 0.4) {
        w.particles.push({
          x: sw.x + sw.width / 2,
          y: sw.y + sw.height - 4,
          vx: (Math.random() - 0.5) * 60,
          vy: -60 - Math.random() * 80,
          color: sw.color,
          size: 2.5 + Math.random() * 2,
          life: 0.25,
          maxLife: 0.35,
          gravity: 200,
        });
      }

      if (sw.life <= 0 || sw.x < 30 || sw.x > 930) {
        w.shockwaves.splice(i, 1);
        continue;
      }

      // Check collision with player:
      // Player MUST jump over the ground shockwave to avoid damage!
      if (
        p.x + p.width > sw.x &&
        p.x < sw.x + sw.width &&
        p.y + p.height >= sw.y + 4 &&
        p.y < sw.y + sw.height
      ) {
        if (sw.isFrostWave) {
          p.slowTimer = 2.5;
          gameAudio.playShieldBlock();
          w.shake = Math.max(w.shake, 8);
          spawnParticles(p.x + p.width / 2, p.y + p.height / 2, 18, '#38bdf8', 180);
        } else {
          handlePlayerDamage();
        }
      }
    }

    // -------------------------------------------------------------------------
    // CENTRALIZED & SECURED BOSS DAMAGE HANDLER
    // Strict rule: Boss MUST ONLY take damage from direct Voltlynx actions!
    // Ground impacts, wall slams, boss shockwaves/orbs NEVER damage the boss!
    // -------------------------------------------------------------------------
    const damageBoss = (
      damageAmount: number,
      source: 'THUNDER_SHOT' | 'PLAYER_STOMP' | 'TITAN_TACKLE',
    ) => {
      const b = w.boss;
      if (!b || b.hp <= 0 || b.isDefeated || b.state === 'DYING' || b.state === 'DEAD' || (b as any).isDead) return;
      if (
        b.state === 'CINEMATIC_SUMMON' ||
        b.state === 'INTRO_ROAR' ||
        b.state === 'INTRO_HP_FILL'
      ) {
        return;
      }
      // Celestial Deity Phase 1 Spherical Shield Deflection
      if (b.type === 'CELESTIAL_DEITY' && b.phase === 1 && b.shieldActive) {
        gameAudio.playShieldBlock();
        spawnParticles(
          b.x + b.width / 2,
          b.y + b.height / 2,
          14,
          '#facc15',
          220,
        );
        return;
      }
      // Strict damage cooldown i-frame guard (prevents rapid multi-frame melts)
      if (b.hurtTimer > 0) return;

      b.hp = Math.max(0, b.hp - damageAmount);
      b.hurtTimer = 0.35; // 350ms damage recovery immunity

      if (b.state === 'VULNERABLE_STUN') {
        b.punishedInStun = true;
        b.stateTimer = Math.min(b.stateTimer, 0.4);
      }

      gameAudio.playSwordClash();
      w.hitStop = 0.06;
      w.shake = 14;

      spawnParticles(
        b.x + b.width / 2,
        b.y + b.height / 2,
        source === 'PLAYER_STOMP' ? 28 : 20,
        source === 'TITAN_TACKLE' ? '#c084fc' : '#fbbf24',
        280,
      );

      if (b.hp <= 0) {
        b.hp = 0;
        b.isDefeated = true;
        if (b.type === 'GHOTUR_HUMANOID') {
          b.state = 'DESPERATION';
          b.deathDuration = 2.4;
          b.stateTimer = 2.4;
          b.desperationTimer = 2.4;
          b.collapseTimer = 0;
          b.vx = 0;
          b.vy = 0;
          w.projectiles = (w.projectiles || []).filter((proj) => proj && proj.isPlayer);
          w.shockwaves = [];
          gameAudio.playDefeatMotif();
        } else if (b.type === 'GHOTUR_DEMON') {
          b.state = 'DYING';
          (b as any).isDead = true;
          b.deathDuration = 2.4;
          b.stateTimer = 2.4;
          b.vx = 0;
          b.vy = 0;
          w.projectiles = (w.projectiles || []).filter((proj) => proj && proj.isPlayer);
          w.shockwaves = [];
          w.voidFirePuddles = [];
          w.icicles = [];
          p.invulnerableTimer = 999;
          gameAudio.playVictoryFanfare();
        } else {
          b.state = 'DYING';
          b.deathDuration = 2.2;
          b.stateTimer = 2.2;
          b.vx = 0;
          b.vy = 0;
          (b as any).isDead = true;
          w.projectiles = (w.projectiles || []).filter((proj) => proj && proj.isPlayer);
          w.shockwaves = [];
          p.invulnerableTimer = 999;
          gameAudio.playVictoryFanfare();
        }
      }
    };

    // -------------------------------------------------------------------------
    // SUB-JEFE: LA QUIMERA ELÉCTRICA SIMULATION (SISTEMA DE ALTA DIFICULTAD E IMPREDECIBLE)
    // -------------------------------------------------------------------------
    if (w.boss && w.boss.state !== 'DEAD') {
      const b = w.boss;
      b.stateTimer -= dt;
      b.animTimer = (b.animTimer || 0) + dt;
      b.animTime = b.animTimer;
      b.wingFlap += dt * (b.phase === 2 ? 24 : 18);
      if (b.hurtTimer > 0) b.hurtTimer -= dt;

      // Tripod and leg locomotion timer
      if (Math.abs(b.vx) > 15) {
        b.walkTimer = (b.walkTimer || 0) + dt * (b.phase === 2 ? 14 : 10);
      } else {
        b.walkTimer = (b.walkTimer || 0) + dt * 3;
      }

      // Smooth elastic spring relaxation for squash and stretch
      b.squash = (b.squash ?? 1) + (1 - (b.squash ?? 1)) * (10 * dt);
      b.stretch = (b.stretch ?? 1) + (1 - (b.stretch ?? 1)) * (10 * dt);

      // Fighting Game smooth lag-drain bar catch-up
      if (b.state === 'CINEMATIC_SUMMON' || b.state === 'INTRO_ROAR') {
        b.displayedHp = 0;
      } else if (b.state === 'INTRO_HP_FILL') {
        b.displayedHp = Math.min(b.hp, b.displayedHp + (b.maxHp / 0.85) * dt);
      } else {
        // Smoothly drains towards actual HP (iconic hit feedback)
        if (b.displayedHp > b.hp) {
          b.displayedHp = Math.max(b.hp, b.displayedHp - 260 * dt);
        } else {
          b.displayedHp = b.hp;
        }
      }

      // Update boss health data for Fighting Game HUD
      setBossHpData({
        active:
          (currentLevelNumber === 4 ||
            currentLevelNumber === 8 ||
            currentLevelNumber === 12 ||
            currentLevelNumber === 16 ||
            currentLevelNumber === 18 ||
            currentLevelNumber === 19) &&
          b.state !== 'DEAD',
        name: b.name,
        subtitle: b.subtitle,
        hp: b.hp,
        maxHp: b.maxHp,
        displayedHp: Math.round(b.displayedHp),
        phase: b.phase,
        isIntro:
          b.state === 'CINEMATIC_SUMMON' ||
          b.state === 'INTRO_ROAR' ||
          b.state === 'INTRO_HP_FILL',
        isHurt: b.hurtTimer > 0,
      });

      // GHOTUR FORMA 1 (HUMANOIDE): INVOCACIÓN CONTINUA DE SOMBRAS ESPECTRALES (LORE & COMBATE ÉPICO)
      if (
        b.type === 'GHOTUR_HUMANOID' &&
        b.state !== 'DEAD' &&
        b.state !== 'DYING' &&
        b.state !== 'DESPERATION' &&
        !b.isDefeated
      ) {
        b.summonTimer = (b.summonTimer ?? (difficultyRef.current === 'DEVIL' ? 2.0 : 3.5)) - dt;
        if (b.summonTimer <= 0) {
          const maxShadows = difficultyRef.current === 'DEVIL' ? 5 : 3;
          const currentShadows = w.enemies.filter((e) => e.alive && e.type === 'abyssal_shadow').length;
          b.summonTimer = difficultyRef.current === 'DEVIL' ? 2.5 : 4.0;

          if (currentShadows < maxShadows) {
            const sVariants: Array<'WRAITH' | 'SPECTER' | 'MINI' | 'LURKER'> = [
              'MINI',
              'SPECTER',
              'LURKER',
              'WRAITH',
            ];
            const v = sVariants[Math.floor(Math.random() * sVariants.length)];
            const sX = Math.random() > 0.5 ? 120 + Math.random() * 120 : 720 + Math.random() * 120;
            const sW = v === 'WRAITH' ? 106 : v === 'SPECTER' ? 56 : v === 'MINI' ? 44 : 94;
            const sH = v === 'WRAITH' ? 110 : v === 'SPECTER' ? 112 : v === 'MINI' ? 46 : 62;
            const sHp = v === 'WRAITH' ? 160 : v === 'LURKER' ? 130 : v === 'SPECTER' ? 95 : 65;

            w.enemies.push({
              id: Date.now() + Math.random(),
              x: sX,
              y: v === 'MINI' ? 200 : v === 'SPECTER' ? 230 : 370,
              width: sW,
              height: sH,
              type: 'abyssal_shadow',
              vx: (Math.random() > 0.5 ? 1 : -1) * (v === 'MINI' ? 140 : 75),
              vy: 0,
              initialY: v === 'MINI' ? 200 : v === 'SPECTER' ? 230 : 370,
              facingRight: Math.random() > 0.5,
              alive: true,
              hp: sHp,
              maxHp: sHp,
              shadowVariant: v,
              emerged: true,
              teleportTimer: 1.8 + Math.random() * 1.5,
              shootTimer: 0.6 + Math.random() * 1.0,
            });

            gameAudio.playHoverMicroTone();
            spawnParticles(sX + sW / 2, 380, 18, '#a855f7', 220);
          }
        }
      }

      // DEVIL MODE: MINION SUMMONING & ENRAGE
      if (difficultyRef.current === 'DEVIL' && b.state !== 'DEAD' && b.state !== 'DYING') {
        b.summonTimer = (b.summonTimer ?? 4.0) - dt;
        if (b.summonTimer <= 0) {
          // Boss 3 (Asura level 12) onwards: <= 50% HP progressively summons waves of zone mobs
          if (b.hp <= b.maxHp * 0.5) {
            b.summonTimer = 6.5; // summon every 6.5 seconds
            gameAudio.playGunshotBlast();
            w.shake = Math.max(w.shake, 10);

            if (b.type === 'CELESTIAL_DEITY') {
              // Asura summons Sky Rays and Crawlers
              for (let sm = 0; sm < 2; sm++) {
                w.enemies.push({
                  id: Date.now() + Math.random(),
                  x: sm === 0 ? 120 : 800,
                  y: 280,
                  width: 58,
                  height: 38,
                  type: sm === 0 ? 'sky_ray' : 'crawler',
                  vx: sm === 0 ? 120 : -100,
                  vy: 0,
                  initialY: 280,
                  facingRight: sm === 0,
                  alive: true,
                  hp: 40,
                  maxHp: 40,
                  shootTimer: 1.5,
                });
              }
            } else if (b.type === 'FROST_EMPRESS') {
              // Kryona summons Volt Bats & Glacial Crawlers
              for (let sm = 0; sm < 2; sm++) {
                w.enemies.push({
                  id: Date.now() + Math.random(),
                  x: sm === 0 ? 120 : 800,
                  y: sm === 0 ? 200 : 390,
                  width: 58,
                  height: 38,
                  type: sm === 0 ? 'volt_bat' : 'crawler',
                  vx: sm === 0 ? 130 : -110,
                  vy: 0,
                  initialY: sm === 0 ? 200 : 390,
                  facingRight: sm === 0,
                  alive: true,
                  hp: 50,
                  maxHp: 50,
                  isFrostVariant: true,
                  shootTimer: 1.5,
                });
              }
            } else if (b.type === 'GHOTUR_HUMANOID') {
              // Ghotur Phase 1 summons Abyssal Shadows
              w.enemies.push({
                id: Date.now() + Math.random(),
                x: Math.random() > 0.5 ? 180 : 760,
                y: 370,
                width: 65,
                height: 75,
                type: 'abyssal_shadow',
                vx: 0,
                vy: 0,
                initialY: 370,
                facingRight: false,
                alive: true,
                hp: 80,
                maxHp: 80,
                shadowVariant: 'SPECTER',
                emerged: true,
                teleportTimer: 2.0,
                shootTimer: 1.2,
              });
            } else if (b.type === 'GHOTUR_DEMON') {
              // Ghotur Titan Final Phase (Devil Mode): Periodically summons mid-sized mini-boss commanders!
              const miniTypes: Array<'SCARAB' | 'DRAGON' | 'ASURA' | 'KRYONA'> = ['SCARAB', 'DRAGON', 'ASURA', 'KRYONA'];
              const chosenMini = miniTypes[(b.miniCommanderIndex || 0) % 4];
              b.miniCommanderIndex = ((b.miniCommanderIndex || 0) + 1);

              w.enemies.push({
                id: Date.now() + Math.random(),
                x: Math.random() > 0.5 ? 150 : 780,
                y: 350,
                width: 80,
                height: 60,
                type: chosenMini === 'SCARAB' ? 'crawler' : chosenMini === 'DRAGON' ? 'sky_ray' : chosenMini === 'KRYONA' ? 'volt_bat' : 'golem',
                vx: 120,
                vy: 0,
                initialY: 350,
                facingRight: true,
                alive: true,
                hp: 200,
                maxHp: 200,
                isCorrupted: true,
                isMiniCommander: true,
                miniCommanderType: chosenMini,
                shootTimer: 1.2,
              });

              spawnParticles(b.x + b.width / 2, b.y + b.height / 2, 35, '#ef4444', 300);
            }
          }
        }
      }

      // MODO FURIA / SOBRECARGA AL BAJAR DEL 50% HP
      const enrageThreshold =
        b.type === 'GHOTUR_DEMON'
          ? 1250
          : b.type === 'GHOTUR_HUMANOID'
          ? 1100
          : b.type === 'FROST_EMPRESS'
          ? 1000
          : b.type === 'CELESTIAL_DEITY'
          ? 900
          : b.type === 'DRAGON'
          ? 600
          : 400;
      if (b.hp <= enrageThreshold && b.phase === 1 && b.state !== 'CINEMATIC_SUMMON') {
        b.phase = 2;
        w.shake = 32;
        w.lightningFlash = 1.0;
        gameAudio.playPowerupChime();
        gameAudio.playGunshotBlast();
        gameAudio.playChiptuneExplosion();

        if (b.type === 'GHOTUR_DEMON') {
          b.state = 'VULNERABLE_STUN';
          b.stateTimer = 1.3;
          spawnParticles(b.x + b.width / 2, b.y + b.height / 2, 50, '#ef4444', 360);
        } else if (b.type === 'GHOTUR_HUMANOID') {
          b.state = 'VULNERABLE_STUN';
          b.stateTimer = 1.2;
          spawnParticles(b.x + b.width / 2, b.y + b.height / 2, 45, '#c084fc', 340);
        } else if (b.type === 'CELESTIAL_DEITY') {
          // Desciende al suelo, disipa escudo protector y empuña el Tridente Sagrado (Trishula)
          b.shieldActive = false;
          b.y = b.groundY;
          b.vy = 0;
          b.state = 'VULNERABLE_STUN';
          b.stateTimer = 1.4;
        } else if (b.type === 'FROST_EMPRESS') {
          // Sobrecarga de Escarcha Glacial
          b.state = 'VULNERABLE_STUN';
          b.stateTimer = 1.3;
          spawnParticles(b.x + b.width / 2, b.y + b.height / 2, 40, '#a5f3fc', 320);
        }

        spawnParticles(
          b.x + b.width / 2,
          b.y + b.height / 2,
          55,
          b.type === 'FROST_EMPRESS'
            ? '#38bdf8'
            : b.type === 'CELESTIAL_DEITY'
            ? '#facc15'
            : b.type === 'DRAGON'
            ? '#f97316'
            : '#c084fc',
          360,
        );
        spawnParticles(
          b.x + b.width / 2,
          b.y + b.height / 2,
          35,
          b.type === 'FROST_EMPRESS'
            ? '#ffffff'
            : b.type === 'CELESTIAL_DEITY'
            ? '#818cf8'
            : b.type === 'DRAGON'
            ? '#00f0ff'
            : '#fbbf24',
          300,
        );
      }

      // Platform Camping Detection for Dragon Boss (Stage 2-B)
      if (b.type === 'DRAGON' && b.state !== 'DEAD' && b.state !== 'DYING') {
        const isPlayerElevated = p.y < 350;
        const isPlayerOnPlat =
          isPlayerElevated &&
          ((p.x + p.width > 70 && p.x < 230) || (p.x + p.width > 730 && p.x < 890));

        if (isPlayerOnPlat) {
          b.platformCampingTimer = (b.platformCampingTimer || 0) + dt;
        } else {
          b.platformCampingTimer = Math.max(0, (b.platformCampingTimer || 0) - dt * 0.7);
        }

        // Platform Heat Timers update
        if (b.platformHeatTimerLeft && b.platformHeatTimerLeft > 0) {
          b.platformHeatTimerLeft -= dt;
          // Spawn fiery ember warning particles on left platform (x: 90 to 210, y: 310)
          if (Math.random() < 0.6) {
            w.particles.push({
              x: 90 + Math.random() * 120,
              y: 310 - Math.random() * 8,
              vx: (Math.random() - 0.5) * 40,
              vy: -20 - Math.random() * 60,
              color: b.platformHeatTimerLeft > 1.2 ? '#facc15' : '#ef4444',
              size: 2 + Math.random() * 2.5,
              life: 0.3,
              maxLife: 0.35,
              gravity: -40,
            });
          }
          // Burn player if standing on molten platform during active heat (< 1.2s remaining)
          if (
            b.platformHeatTimerLeft < 1.2 &&
            p.x + p.width > 90 &&
            p.x < 210 &&
            Math.abs(p.y + p.height - 310) < 8
          ) {
            handlePlayerDamage();
          }
        }

        if (b.platformHeatTimerRight && b.platformHeatTimerRight > 0) {
          b.platformHeatTimerRight -= dt;
          // Spawn fiery ember warning particles on right platform (x: 750 to 870, y: 310)
          if (Math.random() < 0.6) {
            w.particles.push({
              x: 750 + Math.random() * 120,
              y: 310 - Math.random() * 8,
              vx: (Math.random() - 0.5) * 40,
              vy: -20 - Math.random() * 60,
              color: b.platformHeatTimerRight > 1.2 ? '#facc15' : '#ef4444',
              size: 2 + Math.random() * 2.5,
              life: 0.3,
              maxLife: 0.35,
              gravity: -40,
            });
          }
          // Burn player if standing on molten platform during active heat (< 1.2s remaining)
          if (
            b.platformHeatTimerRight < 1.2 &&
            p.x + p.width > 750 &&
            p.x < 870 &&
            Math.abs(p.y + p.height - 310) < 8
          ) {
            handlePlayerDamage();
          }
        }
      }

      // Update Incandescent Stalactites (Dragon Phase 2 Rain / Anti-Camper Rain)
      for (let sIdx = b.stalactites.length - 1; sIdx >= 0; sIdx--) {
        const st = b.stalactites[sIdx];
        st.timer -= dt;
        if (st.timer <= 0 && !st.struck) {
          st.y += st.vy * dt;
          if (st.y >= 440 - st.height) {
            st.struck = true;
            st.y = 440 - st.height;
            w.shake = Math.max(w.shake, 12);
            gameAudio.playChiptuneExplosion();
            spawnParticles(st.x, 440, 20, '#f97316', 220, 100);
            spawnParticles(st.x, 440, 14, '#fbbf24', 180, 100);
          } else {
            // Collision with player
            if (
              p.x + p.width > st.x - st.width / 2 &&
              p.x < st.x + st.width / 2 &&
              p.y + p.height > st.y &&
              p.y < st.y + st.height
            ) {
              handlePlayerDamage();
            }
          }
        }
        if (st.timer <= -0.5 || st.struck) {
          b.stalactites.splice(sIdx, 1);
        }
      }



      // Update Vertical Lightning Pillars (PATRÓN 4: COLUMNAS DE RELÁMPAGOS DEL CIELO)
      for (let lIdx = b.lightningPillars.length - 1; lIdx >= 0; lIdx--) {
        const pillar = b.lightningPillars[lIdx];
        pillar.timer -= dt;

        if (pillar.timer <= 0 && !pillar.struck) {
          pillar.struck = true;
          w.shake = 16;
          w.lightningFlash = 0.5;
          gameAudio.playChiptuneExplosion();
          gameAudio.playGunshotBlast();

          spawnParticles(pillar.x, 460, 24, '#c084fc', 280, 100);
          spawnParticles(pillar.x, 460, 16, '#fde047', 220, 100);

          // Damage player if standing within pillar width
          if (
            p.x + p.width > pillar.x - pillar.width / 2 &&
            p.x < pillar.x + pillar.width / 2 &&
            p.y + p.height > 100
          ) {
            handlePlayerDamage();
          }
        }

        if (pillar.timer <= -0.4) {
          b.lightningPillars.splice(lIdx, 1);
        }
      }

      // BOSS STATE MACHINE
      switch (b.state) {
        // CINEMÁTICA FLUIDA: RAYO CAE EN EL DAIS Y APARECE LA QUIMERA
        case 'CINEMATIC_SUMMON':
          b.y += b.vy * dt;
          b.displayedHp = 0;
          if (b.y >= b.groundY) {
            b.y = b.groundY;
            b.vy = 0;
            b.squash = 1.45;
            b.stretch = 0.62;
            w.shake = 32;
            w.lightningFlash = 1.0;
            gameAudio.playGunshotBlast();
            gameAudio.playJumpLandingThud();
            gameAudio.playChiptuneExplosion();
            spawnParticles(
              b.x + b.width / 2,
              b.groundY + b.height,
              45,
              '#fbbf24',
              320,
            );
            b.state = 'INTRO_ROAR';
            b.stateTimer = 1.2;
          }
          break;

        case 'INTRO_ROAR':
          b.vx = 0;
          b.vy = 0;
          b.telegraphGlow = 1;
          b.wingFlap += dt * 36;
          if (Math.random() < 0.4) {
            spawnParticles(
              b.x + Math.random() * b.width,
              b.y + Math.random() * b.height,
              5,
              '#00f0ff',
              180,
            );
          }
          if (b.stateTimer <= 0) {
            b.state = 'INTRO_HP_FILL';
            b.stateTimer = 0.9;
            gameAudio.playLevelUpStinger();
          }
          break;

        case 'INTRO_HP_FILL':
          b.vx = 0;
          b.vy = 0;
          if (b.stateTimer <= 0) {
            b.displayedHp = b.hp;
            b.state = 'IDLE';
            b.stateTimer = 0.8;
            w.bossFightBannerTimer = 1.8;
            gameAudio.playSwordClash();
          }
          break;

        case 'IDLE':
          b.vx = 0;
          b.vy = 0;
          if (b.type === 'CELESTIAL_DEITY') {
            if (b.phase === 1) {
              b.y = 190 + Math.sin((b.animTime || 0) * 3) * 12;
              b.shieldActive = true;
            } else {
              b.y = b.groundY;
            }
          } else if (b.type === 'DRAGON') {
            // Dragon hovering slightly or on ground
            b.y = b.groundY;
          } else {
            b.y = b.groundY;
          }
          b.facingRight = p.x > b.x + b.width / 2;

          if (b.stateTimer <= 0) {
            // Check combo completion: after comboLength attacks, give a 1.4s / 1.0s vulnerable opening!
            if (b.comboStep >= b.comboLength) {
              b.state = 'VULNERABLE_STUN';
              b.stateTimer = (b.type === 'GHOTUR_DEMON' || b.type === 'GHOTUR_HUMANOID') ? 1.3 : b.type === 'FROST_EMPRESS' ? 1.3 : b.type === 'CELESTIAL_DEITY' ? 1.3 : b.type === 'DRAGON' ? 1.4 : 1.0;
              b.punishedInStun = false;
              b.comboStep = 0;
              b.comboLength = b.phase === 2 ? 3 : 2;
              if (b.type === 'CELESTIAL_DEITY') {
                b.shieldActive = false;
              }
              gameAudio.playShieldBlock();
              break;
            }

            if (b.type === 'GHOTUR_DEMON') {
              const distToPlayer = Math.abs(p.x - b.x);
              const isEnraged = b.phase === 2;

              type DemonAttack =
                | 'TRIDENT_SLAM'
                | 'TRIDENT_CHARGE'
                | 'TRIDENT_LIGHTNING'
                | 'TRIDENT_MARCH'
                | 'TRIDENT_THRUST'
                | 'TRIDENT_SWEEP';

              const dChoices: DemonAttack[] = [];
              if (isEnraged) {
                dChoices.push(
                  'TRIDENT_SLAM',
                  'TRIDENT_CHARGE',
                  'TRIDENT_LIGHTNING',
                  'TRIDENT_THRUST',
                  'TRIDENT_SWEEP',
                );
                if (distToPlayer > 220) dChoices.push('TRIDENT_MARCH');
              } else {
                dChoices.push(
                  'TRIDENT_SLAM',
                  'TRIDENT_CHARGE',
                  'TRIDENT_LIGHTNING',
                  'TRIDENT_THRUST',
                  'TRIDENT_SWEEP',
                  'TRIDENT_MARCH',
                );
              }

              const filtered = dChoices.filter((c) => c !== b.lastAttackType);
              const pool = filtered.length > 0 ? filtered : dChoices;
              const choice = pool[Math.floor(Math.random() * pool.length)];
              b.lastAttackType = choice;

              if (choice === 'TRIDENT_SLAM') {
                // SALTO Y ALETEO -> PICADO CON TRIDENTE (JUMP -> ATTACK)
                b.state = 'TRIDENT_SLAM_JUMP';
                b.stateTimer = 0.45;
                b.vy = -750;
                b.trackTargetX = p.x + p.width / 2;
                b.facingRight = p.x > b.x + b.width / 2;
                gameAudio.playRetroJump();
              } else if (choice === 'TRIDENT_CHARGE') {
                // CARGA DE TRIDENTE (RUN / SWORD_ATTACK) CON ESTELA DE FUEGO OSCURO
                b.state = 'TRIDENT_CHARGE_PREP';
                b.stateTimer = isEnraged ? 0.3 : 0.4;
                b.facingRight = p.x > b.x + b.width / 2;
                gameAudio.playSwordClash();
              } else if (choice === 'TRIDENT_LIGHTNING') {
                // INVOCACIÓN CON TRIDENTE (SHOOT): LEVANTA TRIDENTE Y CANALIZA RAYOS OSCUROS
                b.state = 'TRIDENT_LIGHTNING_PREP';
                b.stateTimer = isEnraged ? 0.45 : 0.55;
                b.facingRight = p.x > b.x + b.width / 2;
                gameAudio.playArcadeLaser();
                gameAudio.playPowerupChime();

                // 3 o 4 columnas telegrafiadas con líneas rojas en el suelo antes del impacto
                const colCount = isEnraged ? 4 : 3;
                const points = [180, 380, 580, 780];
                b.lightningPillars = points.slice(0, colCount).map((px) => ({
                  x: px + (Math.random() - 0.5) * 40,
                  timer: 0.45, // 450ms de advertencia con líneas rojas en el suelo
                  struck: false,
                  width: 70,
                }));
              } else if (choice === 'TRIDENT_MARCH') {
                // PASO MARCIAL PESADO (WALK / IDLE) ACECHANDO CON PASO FIRME GIRANDO TRIDENTE
                b.state = 'TRIDENT_MARCH';
                b.stateTimer = isEnraged ? 0.8 : 1.1;
                b.facingRight = p.x > b.x + b.width / 2;
                b.vx = (b.facingRight ? 1 : -1) * 160;
              } else if (choice === 'TRIDENT_SWEEP') {
                b.state = 'TRIDENT_SWEEP_PREP';
                b.stateTimer = isEnraged ? 0.3 : 0.4;
                b.facingRight = p.x > b.x + b.width / 2;
                gameAudio.playSwordClash();
              } else {
                b.state = 'TRIDENT_THRUST_PREP';
                b.stateTimer = isEnraged ? 0.35 : 0.45;
                b.facingRight = p.x > b.x + b.width / 2;
                gameAudio.playSwordClash();
              }
              break;
            }

            if (b.type === 'GHOTUR_HUMANOID') {
              const distToPlayer = Math.abs(p.x - b.x);
              const isEnraged = b.phase === 2;
              const isDevil = difficultyRef.current === 'DEVIL';

              type HumanoidAttack =
                | 'SHADOW_DASH'
                | 'LIGHTNING_THRUST'
                | 'DESCENDING_THRUST'
                | 'DUAL_ELEMENT'
                | 'TELEPORT'
                | 'SUPREME_POWER';

              const hChoices: HumanoidAttack[] = [];
              if (isEnraged || isDevil) {
                hChoices.push(
                  'SHADOW_DASH',
                  'LIGHTNING_THRUST',
                  'DESCENDING_THRUST',
                  'DUAL_ELEMENT',
                  'TELEPORT',
                  'SUPREME_POWER',
                );
              } else {
                hChoices.push(
                  'SHADOW_DASH',
                  'LIGHTNING_THRUST',
                  'DESCENDING_THRUST',
                  'DUAL_ELEMENT',
                  'TELEPORT',
                );
              }

              const filtered = hChoices.filter((c) => c !== b.lastAttackType);
              const pool = filtered.length > 0 ? filtered : hChoices;
              const choice = pool[Math.floor(Math.random() * pool.length)];
              b.lastAttackType = choice;

              if (choice === 'SHADOW_DASH') {
                // DASHING SOMBRAS / DESLIZAMIENTO ESPECTRAL ULTRA RÁPIDO E IMPREDECIBLE
                b.state = 'SHADOW_DASH';
                b.stateTimer = isDevil ? 0.35 : isEnraged ? 0.4 : 0.5;
                b.facingRight = p.x > b.x + b.width / 2;
                const dashDir = b.facingRight ? 1 : -1;
                b.vx = dashDir * (isDevil ? 840 : isEnraged ? 750 : 660);
                if (isDevil) {
                  b.hurtTimer = Math.max(b.hurtTimer, 0.28); // Invulnerabilidad breve durante dash en Devil Mode
                }
                gameAudio.playArcadeLaser();
                gameAudio.playGunshotBlast();
                w.shake = Math.max(w.shake, 8);
                spawnParticles(b.x + b.width / 2, b.y + b.height / 2, 28, '#a855f7', 300);
              } else if (choice === 'LIGHTNING_THRUST') {
                // ESTOCADA FULGURANTE CON RÁFAGA TRIPLE DE TAJOS DE VACÍO OSCUROS
                b.state = 'LIGHTNING_THRUST';
                b.stateTimer = isDevil ? 0.3 : 0.38;
                b.facingRight = p.x > b.x + b.width / 2;
                gameAudio.playSwordClash();
              } else if (choice === 'DESCENDING_THRUST') {
                // SALTO CON ESTOCADA DESCENDENTE AL SUELO CON ONDA DE CHOQUE
                b.state = 'DESCENDING_THRUST_JUMP';
                b.stateTimer = isDevil ? 0.32 : 0.38;
                b.vy = isDevil ? -860 : -780;
                b.trackTargetX = p.x + p.width / 2;
                b.facingRight = p.x > b.x + b.width / 2;
                gameAudio.playRetroJump();
              } else if (choice === 'DUAL_ELEMENT') {
                b.state = 'DUAL_ELEMENT_PREP';
                b.stateTimer = isDevil ? 0.25 : isEnraged ? 0.3 : 0.4;
                b.facingRight = p.x > b.x + b.width / 2;
                gameAudio.playPowerupChime();
              } else if (choice === 'TELEPORT') {
                b.state = 'TELEPORT_OUT';
                b.stateTimer = isDevil ? 0.2 : 0.28;
                gameAudio.playHoverMicroTone();
                spawnParticles(b.x + b.width / 2, b.y + b.height / 2, 28, '#a855f7', 240);
              } else {
                b.state = 'LEVITATE';
                b.stateTimer = isDevil ? 0.32 : 0.42;
                b.combinedPowerStep = 0;
                gameAudio.playLevelUpStinger();
              }
              break;
            }

            if (b.type === 'FROST_EMPRESS') {
              const distToPlayer = Math.abs(p.x - b.x);
              const isEnraged = b.phase === 2;

              type FrostAttack =
                | 'GLACIAL_GLIDE'
                | 'CEILING_ICICLE_RAIN'
                | 'EXPANDING_FROST_RINGS'
                | 'TELEPORT'
                | 'ICE_PRISMS'
                | 'TRIPLE_JAVELINS'
                | 'SCEPTER_COMBO';

              const fChoices: FrostAttack[] = [];
              if (isEnraged) {
                fChoices.push(
                  'GLACIAL_GLIDE',
                  'CEILING_ICICLE_RAIN',
                  'EXPANDING_FROST_RINGS',
                  'TELEPORT',
                  'TRIPLE_JAVELINS',
                  'ICE_PRISMS',
                );
              } else {
                fChoices.push(
                  'GLACIAL_GLIDE',
                  'CEILING_ICICLE_RAIN',
                  'EXPANDING_FROST_RINGS',
                  'TELEPORT',
                  'ICE_PRISMS',
                );
              }
              if (distToPlayer < 140) fChoices.push('SCEPTER_COMBO');

              const filtered = fChoices.filter((c) => c !== b.lastAttackType);
              const pool = filtered.length > 0 ? filtered : fChoices;
              const choice = pool[Math.floor(Math.random() * pool.length)];
              b.lastAttackType = choice;

              if (choice === 'GLACIAL_GLIDE') {
                // DESPLAZAMIENTOS FLOTANTES RÁPIDOS EN EL AIRE CON ESPEJISMOS DE HIELO
                b.state = 'GLACIAL_GLIDE';
                b.stateTimer = isEnraged ? 1.2 : 1.5;
                b.mirageTimer = 2.2; // Activa espejismos/ilusiones de hielo
                b.facingRight = p.x > b.x + b.width / 2;
                const glideDir = b.facingRight ? 1 : -1;
                b.vx = glideDir * (isEnraged ? 480 : 380);
                b.vy = -300;
                gameAudio.playHoverMicroTone();
                gameAudio.playArcadeLaser();
              } else if (choice === 'CEILING_ICICLE_RAIN') {
                // LLUVIA DE ESTALACTITAS AFILADAS DESDE EL TECHO DE LA CUEVA GLACIAL
                b.state = 'ICICLE_RAIN_CAST';
                b.stateTimer = isEnraged ? 1.1 : 1.3;
                b.facingRight = p.x > b.x + b.width / 2;
                b.mirageTimer = 1.5;
                gameAudio.playPowerupChime();

                // Genera 5-7 estalactitas afiladas cayendo con sombras de aviso
                const count = isEnraged ? 7 : 5;
                const icicleCols = [100, 240, 380, 520, 660, 800, p.x + 20];
                b.stalactites = icicleCols.slice(0, count).map((colX, idx) => ({
                  x: colX,
                  y: -60,
                  vy: 720,
                  timer: 0.35 + idx * 0.16,
                  struck: false,
                  width: 22,
                  height: 42,
                  warningX: colX,
                }));
              } else if (choice === 'EXPANDING_FROST_RINGS') {
                // ANILLOS EXPANSIVOS DE ESCARCHA Y RÁFAGAS DE LANZAS DE HIELO
                b.state = 'EXPANDING_FROST_RINGS';
                b.stateTimer = 0.85;
                b.facingRight = p.x > b.x + b.width / 2;
                gameAudio.playArcadeLaser();
              } else if (choice === 'TRIPLE_JAVELINS') {
                // RÁFAGAS TRIPLES DE LANZAS DE HIELO DIRIGIDAS
                b.state = 'TRIPLE_JAVELINS_PREP';
                b.stateTimer = 0.35;
                b.facingRight = p.x > b.x + b.width / 2;
                gameAudio.playPowerupChime();
              } else if (choice === 'ICE_PRISMS') {
                b.state = 'ICE_PRISMS_PREP';
                b.stateTimer = isEnraged ? 0.3 : 0.4;
                gameAudio.playPowerupChime();
              } else if (choice === 'TELEPORT') {
                b.state = 'TELEPORT_OUT';
                b.stateTimer = 0.3;
                b.mirageTimer = 1.8;
                gameAudio.playRetroJump();
                spawnParticles(b.x + b.width / 2, b.y + b.height / 2, 25, '#a5f3fc', 200, -20);
              } else {
                b.state = 'SCEPTER_COMBO';
                b.stateTimer = 0.65;
                b.facingRight = p.x > b.x + b.width / 2;
                gameAudio.playSwordClash();
              }
              break;
            }

            if (b.type === 'CELESTIAL_DEITY') {
              const isEnraged = b.phase === 2;
              const distToPlayer = Math.abs(p.x - b.x);

              type AsuraAttack =
                | 'PSYCHIC_ORB_FAN'
                | 'SACRED_SHOCKWAVES'
                | 'ASURA_TELEPORT'
                | 'DEITY_SHOOT'
                | 'DEITY_KARATE'
                | 'DEITY_TRIDENT'
                | 'DEITY_PLUNGE'
                | 'DEITY_WALK';

              const aChoices: AsuraAttack[] = [];

              if (b.phase === 1) {
                // FASE 1: Levitación Cósmica, Barreras Defensivas y Orbes Psíquicos
                aChoices.push('PSYCHIC_ORB_FAN', 'SACRED_SHOCKWAVES', 'ASURA_TELEPORT', 'DEITY_SHOOT', 'DEITY_KARATE');
              } else {
                // FASE 2: Tridente Sagrado, Ondas Terrestres Expansivas y Teletransporte Táctico
                aChoices.push('SACRED_SHOCKWAVES', 'PSYCHIC_ORB_FAN', 'ASURA_TELEPORT', 'DEITY_TRIDENT', 'DEITY_PLUNGE');
                if (distToPlayer > 180) aChoices.push('DEITY_WALK');
              }

              const filtered = aChoices.filter((c) => c !== b.lastAttackType);
              const pool = filtered.length > 0 ? filtered : aChoices;
              const chosen = pool[Math.floor(Math.random() * pool.length)];
              b.lastAttackType = chosen;

              if (chosen === 'ASURA_TELEPORT') {
                // TELETRANSPORTE MÍSTICO HACIA DIFERENTES PEDESTALES
                b.state = 'ASURA_TELEPORT_OUT';
                b.stateTimer = 0.32;
                b.shieldActive = true;
                gameAudio.playHoverMicroTone();
                spawnParticles(b.x + b.width / 2, b.y + b.height / 2, 28, '#facc15', 220);
                spawnParticles(b.x + b.width / 2, b.y + b.height / 2, 20, '#818cf8', 180);
              } else if (chosen === 'SACRED_SHOCKWAVES') {
                // ONDAS EXPANSIVAS TERRESTRES SAGRADAS (CASTIGA EL QUEDARSE EN EL SUELO)
                b.state = 'SACRED_SHOCKWAVES_PREP';
                b.stateTimer = isEnraged ? 0.35 : 0.45;
                b.shieldActive = true; // Escudo defensivo activo mientras prepara
                b.facingRight = p.x > b.x + b.width / 2;
                gameAudio.playPowerupChime();
              } else if (chosen === 'PSYCHIC_ORB_FAN') {
                // ORBES PSÍQUICOS RASTRADORES EN PATRONES GEOMÉTRICOS DE ABANICO
                b.state = 'PSYCHIC_ORB_PREP';
                b.stateTimer = isEnraged ? 0.38 : 0.48;
                b.shieldActive = true; // Escudo activo durante canalización
                b.facingRight = p.x > b.x + b.width / 2;
                gameAudio.playArcadeLaser();
              } else if (chosen === 'DEITY_SHOOT') {
                b.state = 'DEITY_SHOOT_PREP';
                b.stateTimer = 0.4;
                b.shieldActive = false;
                b.javelinCount = 0;
                gameAudio.playPowerupChime();
              } else if (chosen === 'DEITY_KARATE') {
                b.state = 'DEITY_KARATE_DASH';
                b.stateTimer = 0.38;
                b.shieldActive = false;
                b.karateCount = 0;
                const targetDir = p.x > b.x ? 1 : -1;
                b.vx = targetDir * 620;
                gameAudio.playGunshotBlast();
              } else if (chosen === 'DEITY_TRIDENT') {
                b.state = 'DEITY_TRIDENT_PREP';
                b.stateTimer = 0.35;
                b.shieldActive = false;
                gameAudio.playSwordClash();
              } else if (chosen === 'DEITY_PLUNGE') {
                b.state = 'DEITY_PLUNGE_JUMP';
                b.stateTimer = 0.4;
                b.shieldActive = false;
                b.vy = -750;
                b.trackTargetX = p.x + p.width / 2;
                gameAudio.playRetroJump();
              } else {
                b.state = 'DEITY_WALK';
                b.stateTimer = 0.9;
                b.shieldActive = false;
              }
              break;
            }

            if (b.type === 'DRAGON') {
              const distToPlayer = Math.abs(p.x - b.x);
              const isEnraged = b.phase === 2;
              const isPlayerElevated = p.y < 350;
              const isCamping = (b.platformCampingTimer || 0) >= 1.2;

              type DragonAttack =
                | 'AERIAL_PATROL'
                | 'AERIAL_SWOOP'
                | 'BLACK_METEOR_CASCADE'
                | 'BREATH'
                | 'TARGETED_FIREBALL'
                | 'PLATFORM_SWOOP';

              const dPool: Array<{type: DragonAttack; weight: number}> = [];

              if (isCamping || isPlayerElevated) {
                // Anti-camper priority: swoops, dark meteor cascades, and targeted fire
                dPool.push({type: 'PLATFORM_SWOOP', weight: 45});
                dPool.push({type: 'BLACK_METEOR_CASCADE', weight: 40});
                dPool.push({type: 'AERIAL_SWOOP', weight: 35});
                dPool.push({type: 'TARGETED_FIREBALL', weight: 30});
                b.platformCampingTimer = 0.4;
              } else if (distToPlayer < 240) {
                dPool.push({type: 'BREATH', weight: 40});
                dPool.push({type: 'AERIAL_SWOOP', weight: 35});
                dPool.push({type: 'AERIAL_PATROL', weight: 35});
                dPool.push({type: 'BLACK_METEOR_CASCADE', weight: 25});
              } else {
                dPool.push({type: 'AERIAL_PATROL', weight: 40});
                dPool.push({type: 'BLACK_METEOR_CASCADE', weight: 35});
                dPool.push({type: 'AERIAL_SWOOP', weight: 35});
                dPool.push({type: 'PLATFORM_SWOOP', weight: 30});
                dPool.push({type: 'BREATH', weight: 25});
              }

              const filtered = dPool.filter((o) => o.type !== b.lastAttackType);
              const pool = filtered.length > 0 ? filtered : dPool;
              const totalW = pool.reduce((acc, c) => acc + c.weight, 0);
              let roll = Math.random() * totalW;
              let chosen = pool[0].type;
              for (const opt of pool) {
                if (roll <= opt.weight) {
                  chosen = opt.type;
                  break;
                }
                roll -= opt.weight;
              }
              b.lastAttackType = chosen;

              if (chosen === 'AERIAL_PATROL') {
                // ASCENSO Y VUELO SINUSOIDAL (SOBREVUELO ACTIVO Y DINÁMICO)
                b.state = 'AERIAL_PATROL';
                b.stateTimer = isEnraged ? 1.6 : 2.0;
                b.vy = -550;
                b.flySineOffset = 0;
                b.flyBaseY = 130;
                b.facingRight = p.x > b.x + b.width / 2;
                gameAudio.playRetroJump();
              } else if (chosen === 'AERIAL_SWOOP') {
                // VUELO RASANTE EN PICADA (DIVE-BOMB ATRAVESANDO LA ARENA)
                b.state = 'DRAGON_DIVE_PREP';
                b.stateTimer = isEnraged ? 0.3 : 0.42;
                b.trackTargetX = p.x + p.width / 2;
                b.facingRight = p.x > b.x + b.width / 2;
                gameAudio.playCrispClick();
              } else if (chosen === 'BLACK_METEOR_CASCADE') {
                // LLUVIA DE METEORITOS DE FUEGO NEGRO EN CASCADA CON SOMBRAS DE AVISO
                b.state = 'BLACK_METEOR_CASCADE';
                b.stateTimer = isEnraged ? 1.4 : 1.7;
                b.cascadeTimer = 0;
                gameAudio.playArcadeLaser();
                // Genera 5-7 meteoritos de fuego negro en cascada con sombras de aviso
                const count = isEnraged ? 7 : 5;
                const meteorCols: number[] = [];
                for (let m = 0; m < count; m++) {
                  meteorCols.push(b.arenaLeft + 60 + Math.random() * (b.arenaRight - b.arenaLeft - 120));
                }
                b.stalactites = meteorCols.map((colX, idx) => ({
                  x: colX,
                  y: -80,
                  vy: 680,
                  timer: 0.35 + idx * 0.18, // Advertencia telegrafiada de 350-1000ms
                  struck: false,
                  width: 28,
                  height: 48,
                  warningX: colX,
                }));
              } else if (chosen === 'BREATH') {
                // ALIENTO ÍGNEO EN ABANICO / CORTINA DE LLAMAS
                b.state = 'FLAME_BREATH_INHALE';
                b.stateTimer = 0.45;
                const jawX = b.facingRight ? b.x + b.width - 24 : b.x + 24;
                const jawY = b.y + 40;
                if (isPlayerElevated) {
                  b.breathAngle = Math.atan2((p.y + p.height / 2) - jawY, (p.x + p.width / 2) - jawX);
                } else {
                  b.breathAngle = undefined;
                }
                gameAudio.playPowerupChime();
              } else if (chosen === 'TARGETED_FIREBALL') {
                b.state = 'TARGETED_FIREBALL_PREP';
                b.stateTimer = 0.35;
                b.facingRight = p.x > b.x + b.width / 2;
                gameAudio.playCrispClick();
              } else {
                b.state = 'PLATFORM_SWOOP_ASCENT';
                b.stateTimer = 0.35;
                gameAudio.playRetroJump();
              }
              break;
            }

            const distToPlayer = Math.abs(p.x - b.x);
            const isEnraged = b.phase === 2;

            type AttackOption = {
              type:
                | 'METEOR'
                | 'CASCADE'
                | 'CHARGE'
                | 'LIGHTNING_COLUMNS'
                | 'PINBALL';
              weight: number;
            };

            const options: AttackOption[] = [];

            if (distToPlayer < 240) {
              // Close range: rapid Metal Slug fan spray or sudden Isaac charge
              options.push({type: 'CASCADE', weight: 45});
              options.push({type: 'CHARGE', weight: 40});
              options.push({type: 'METEOR', weight: 20});
              if (isEnraged) {
                options.push({type: 'PINBALL', weight: 35});
              }
            } else {
              // Far range: high-speed Isaac dive stomp, Metal Slug spray, or charge
              options.push({type: 'METEOR', weight: 45});
              options.push({type: 'CASCADE', weight: 35});
              options.push({type: 'CHARGE', weight: 35});
              if (isEnraged) {
                options.push({type: 'LIGHTNING_COLUMNS', weight: 30});
                options.push({type: 'PINBALL', weight: 30});
              }
            }

            // Avoid same attack 2x in a row
            const filteredOptions = options.filter(
              (o) => o.type !== b.lastAttackType,
            );
            const pool = filteredOptions.length > 0 ? filteredOptions : options;

            const totalWeight = pool.reduce((acc, cur) => acc + cur.weight, 0);
            let roll = Math.random() * totalWeight;
            let chosen = pool[0].type;
            for (const opt of pool) {
              if (roll <= opt.weight) {
                chosen = opt.type;
                break;
              }
              roll -= opt.weight;
            }

            b.lastAttackType = chosen;

            if (chosen === 'METEOR') {
              // PATRÓN 1: ISAAC DIVE STOMP (Snappy 250ms telegraph & rapid ascent)
              b.state = 'METEOR_ASCENT';
              b.stateTimer = 0.25;
              gameAudio.playRetroJump();
            } else if (chosen === 'CASCADE') {
              // PATRÓN 2: METAL SLUG BULLET SPRAY (Short 250ms telegraph -> fast 5-spark arc)
              b.state = 'CASCADE_FLOAT';
              b.stateTimer = 0.25;
              b.facingRight = p.x > b.x;
              gameAudio.playCrispClick();
            } else if (chosen === 'CHARGE') {
              // PATRÓN 3: ISAAC CHARGE (250ms crouch telegraph -> sudden sprint)
              b.state = 'CHARGE_TELEGRAPH';
              b.stateTimer = isEnraged ? 0.2 : 0.28;
              b.chargeDidLeap = false;
              b.facingRight = p.x > b.x;
              gameAudio.playCrispClick();
            } else if (chosen === 'LIGHTNING_COLUMNS') {
              // PATRÓN 4A: RELÁMPAGOS RÁPIDOS (Fase 2)
              b.state = 'LIGHTNING_COLUMNS';
              b.stateTimer = 1.0;
              b.facingRight = p.x > b.x;
              gameAudio.playArcadeLaser();

              const arenaW = b.arenaRight - b.arenaLeft;
              const points = [
                b.arenaLeft + arenaW * 0.25,
                b.arenaLeft + arenaW * 0.5,
                b.arenaLeft + arenaW * 0.75,
              ];
              b.lightningPillars = points.map((px) => ({
                x: px + (Math.random() - 0.5) * 40,
                timer: 0.35, // Snappy 350ms telegraph!
                struck: false,
                width: 60,
              }));
            } else if (chosen === 'PINBALL') {
              // PATRÓN 4B: REBOTE DIAGONAL ENÉRGICO (Fase 2)
              b.state = 'PINBALL_BOUNCE';
              b.stateTimer = 2.0;
              b.pinballBouncesLeft = 2;
              const dirX = Math.random() > 0.5 ? 1 : -1;
              const speed = 560;
              b.vx = dirX * speed * 0.8;
              b.vy = -speed * 0.65;
              gameAudio.playShieldBlock();
            }
          }
          break;

        // =====================================================================
        // PATRÓN 1: PICADO METEORO / STOMP AGRESIVO ESTILO ISAAC (250MS TELEGRAFO)
        // =====================================================================
        case 'METEOR_ASCENT':
          b.vy = -750;
          b.y += b.vy * dt;
          b.squash = 0.75;
          b.stretch = 1.35;
          b.wingFlap += dt * 36;
          if (b.y <= -140 || b.stateTimer <= 0) {
            b.y = -140;
            b.vy = 0;
            b.state = 'METEOR_TRACK';
            b.trackTimer = 0.35; // Rápido rastreo de 350ms
            b.stateTimer = 0.55; // 350ms rastreo + 200ms fijación
            b.trackTargetX = p.x + p.width / 2;
          }
          break;

        case 'METEOR_TRACK':
          if (b.trackTimer > 0) {
            b.trackTimer -= dt;
            b.trackTargetX += (p.x + p.width / 2 - b.trackTargetX) * (14 * dt);
            b.trackTargetX = clamp(b.trackTargetX, b.arenaLeft + 40, b.arenaRight - 40);
          }
          if (b.stateTimer <= 0) {
            b.state = 'METEOR_DIVE';
            b.stateTimer = 0.8;
            b.x = b.trackTargetX - b.width / 2;
            b.y = -100;
            b.vx = 0;
            b.vy = b.phase === 2 ? 880 : 750;
            gameAudio.playGunshotBlast();
            w.shake = 10;
          }
          break;

        case 'METEOR_DIVE':
          b.y += b.vy * dt;
          w.shake = Math.max(w.shake, 6);

          // Impacto rápido en el suelo
          if (b.y >= b.groundY) {
            b.y = b.groundY;
            b.vy = 0;
            b.squash = 1.48;
            b.stretch = 0.58;
            w.shake = 18;
            w.lightningFlash = 0.4;
            gameAudio.playGunshotBlast();
            gameAudio.playJumpLandingThud();

            spawnParticles(
              b.x + b.width / 2,
              b.groundY + b.height,
              30,
              b.phase === 2 ? '#c084fc' : '#fbbf24',
              240,
            );

            // Ondas sísmicas terrestres (velocidad rápida y ágil de 220 px/s)
            const waveSpd = b.phase === 2 ? 260 : 220;
            const waveY = 440 - 18;
            w.shockwaves.push({
              id: Date.now() + 1,
              x: b.x + b.width / 2,
              y: waveY,
              vx: -waveSpd,
              width: 24,
              height: 18,
              life: 1.8,
              maxLife: 1.8,
              color: b.phase === 2 ? '#c084fc' : '#38bdf8',
            });
            w.shockwaves.push({
              id: Date.now() + 2,
              x: b.x + b.width / 2,
              y: waveY,
              vx: waveSpd,
              width: 24,
              height: 18,
              life: 1.8,
              maxLife: 1.8,
              color: b.phase === 2 ? '#c084fc' : '#38bdf8',
            });

            // Avanza el paso del combo y prepara el siguiente ataque
            b.comboStep++;
            b.state = 'IDLE';
            b.stateTimer = 0.25; // Transición rápida de 250ms
          }
          break;

        // =====================================================================
        // PATRÓN 2: RÁFAGA EN ABANICO ESTILO METAL SLUG (5 CHISPAS RÁPIDAS EN ARCO)
        // =====================================================================
        case 'CASCADE_FLOAT':
          b.y += (240 - b.y) * (10 * dt);
          b.facingRight = p.x > b.x;
          if (b.stateTimer <= 0) {
            b.state = 'CASCADE_SHOOT';
            b.stateTimer = 0.35; // Ráfaga inmediata de alta cadencia

            // Disparo instantáneo de 5 chispas eléctricas en abanico (Metal Slug style)
            const sprayCount = 5;
            const baseDir = b.facingRight ? 1 : -1;
            const originX = b.facingRight ? b.x + b.width : b.x;
            const originY = b.y + 28;
            const spraySpeed = b.phase === 2 ? 420 : 350;

            // Ángulos en abanico (-30° a +30°)
            const angles = [-0.5, -0.25, 0, 0.25, 0.5];
            for (let i = 0; i < sprayCount; i++) {
              const ang = angles[i];
              const vx = baseDir * Math.cos(ang) * spraySpeed;
              const vy = Math.sin(ang) * spraySpeed * 0.85;

              w.projectiles.push({
                id: Date.now() + Math.random(),
                x: originX,
                y: originY,
                vx,
                vy,
                radius: 7,
                isPlayer: false,
                life: 2.4,
                color: b.phase === 2 ? '#c084fc' : '#fbbf24',
                isBomb: true,
              });
            }

            gameAudio.playArcadeLaser();
            gameAudio.playGunshotBlast();
            w.shake = 8;
            spawnParticles(originX, originY, 16, '#fbbf24', 180);
          }
          break;

        case 'CASCADE_SHOOT':
          b.y += (b.groundY - b.y) * (8 * dt);
          if (b.stateTimer <= 0) {
            b.y = b.groundY;
            b.comboStep++;
            b.state = 'IDLE';
            b.stateTimer = 0.25; // 250ms hacia el siguiente ataque
          }
          break;

        // =====================================================================
        // PATRÓN 3: CARGA / DASH RELÁMPAGO TERRESTRE ESTILO ISAAC (250MS TELEGRAFO)
        // =====================================================================
        case 'CHARGE_TELEGRAPH':
          b.telegraphGlow = Math.sin(Date.now() * 0.05);
          b.vx = 0;
          b.y = b.groundY;
          b.squash = 1.25;
          b.stretch = 0.78;
          b.facingRight = p.x > b.x;

          if (b.stateTimer <= 0) {
            b.state = 'CHARGE_RUSH';
            b.stateTimer = 0.8;
            b.squash = 0.85;
            b.stretch = 1.2;
            const rushSpd = b.phase === 2 ? 440 : 360;
            b.vx = (b.facingRight ? 1 : -1) * rushSpd;
            gameAudio.playShieldBlock();
            gameAudio.playArcadeLaser();
            w.shake = 6;
          }
          break;

        case 'CHARGE_RUSH':
          b.x += b.vx * dt;
          b.y = b.groundY;

          // Choque contra el muro o fin de carrera
          if (
            (b.vx < 0 && b.x <= b.arenaLeft) ||
            (b.vx > 0 && b.x + b.width >= b.arenaRight) ||
            b.stateTimer <= 0
          ) {
            b.x = clamp(b.arenaLeft, b.x, b.arenaRight - b.width);
            b.vx = 0;
            b.squash = 0.65;
            b.stretch = 1.35;
            w.shake = 12;
            gameAudio.playJumpLandingThud();
            gameAudio.playChiptuneExplosion();
            spawnParticles(b.x + b.width / 2, b.y + b.height / 2, 20, '#fbbf24', 180);

            b.comboStep++;
            b.state = 'IDLE';
            b.stateTimer = 0.25;
          }
          break;

        case 'CHARGE_LEAP':
          b.x += b.vx * dt;
          b.y += b.vy * dt;
          b.vy += 850 * dt;

          if (b.y >= b.groundY) {
            b.y = b.groundY;
            b.vy = 0;
            b.vx = 0;
            w.shake = 8;
            gameAudio.playJumpLandingThud();
            b.comboStep++;
            b.state = 'IDLE';
            b.stateTimer = 0.25;
          }
          break;

        // =====================================================================
        // PATRÓN 4A: COLUMNAS DE RELÁMPAGOS DEL CIELO (FASE 2)
        // =====================================================================
        case 'LIGHTNING_COLUMNS':
          b.vx = 0;
          b.y = 220 + Math.sin(Date.now() * 0.005) * 6;
          b.wingFlap += dt * 24;

          if (b.stateTimer <= 0) {
            b.comboStep++;
            b.state = 'IDLE';
            b.stateTimer = 0.25;
          }
          break;

        // =====================================================================
        // PATRÓN 4B: REBOTE DIAGONAL PINBALL HURACÁN (FASE 2)
        // =====================================================================
        case 'PINBALL_BOUNCE':
          b.x += b.vx * dt;
          b.y += b.vy * dt;
          b.wingFlap += dt * 30;

          if (b.x <= b.arenaLeft) {
            b.x = b.arenaLeft;
            b.vx = Math.abs(b.vx);
            b.pinballBouncesLeft--;
            gameAudio.playSwordClash();
          } else if (b.x + b.width >= b.arenaRight) {
            b.x = b.arenaRight - b.width;
            b.vx = -Math.abs(b.vx);
            b.pinballBouncesLeft--;
            gameAudio.playSwordClash();
          }

          if (b.y <= 120) {
            b.y = 120;
            b.vy = Math.abs(b.vy);
            b.pinballBouncesLeft--;
          } else if (b.y >= b.groundY) {
            b.y = b.groundY;
            b.vy = -Math.abs(b.vy);
            b.pinballBouncesLeft--;
          }

          if (b.pinballBouncesLeft <= 0 || b.stateTimer <= 0) {
            b.y = b.groundY;
            b.vx = 0;
            b.vy = 0;
            b.comboStep++;
            b.state = 'IDLE';
            b.stateTimer = 0.25;
          }
          break;

        // =====================================================================
        // DRAGÓN: SOBREVUELO SINUSOIDAL ACTIVO & VUELOS RASANTES
        // =====================================================================
        case 'AERIAL_PATROL':
          b.wingFlap += dt * 32;
          b.flySineOffset = (b.flySineOffset || 0) + dt * 3.5;
          b.y = 115 + Math.sin(b.flySineOffset) * 40;
          // Desplazamiento horizontal planeando por el cielo
          const glideSpeed = b.phase === 2 ? 260 : 210;
          b.x += (b.facingRight ? 1 : -1) * glideSpeed * dt;

          if (b.x <= b.arenaLeft + 40) {
            b.x = b.arenaLeft + 40;
            b.facingRight = true;
          } else if (b.x + b.width >= b.arenaRight - 40) {
            b.x = b.arenaRight - b.width - 40;
            b.facingRight = false;
          }

          // Partículas de estela de vuelo en picado/planeo
          if (Math.random() < 0.45) {
            w.particles.push({
              x: b.x + Math.random() * b.width,
              y: b.y + b.height * 0.7,
              vx: (Math.random() - 0.5) * 40,
              vy: 20 + Math.random() * 40,
              color: '#f97316',
              size: 2.5,
              life: 0.3,
              maxLife: 0.35,
            });
          }

          if (b.stateTimer <= 0) {
            // Desde el aire, desata cortina de llamas o picada rasante
            if (Math.random() > 0.5) {
              b.state = 'AERIAL_FLAME_CURTAIN';
              b.stateTimer = 1.0;
              b.breathTimer = 0;
              gameAudio.playGunshotBlast();
              w.shake = 10;
            } else {
              b.state = 'DRAGON_DIVE_PREP';
              b.stateTimer = 0.32;
              b.trackTargetX = p.x + p.width / 2;
              gameAudio.playCrispClick();
            }
          }
          break;

        case 'AERIAL_FLAME_CURTAIN':
          b.wingFlap += dt * 28;
          b.breathTimer = (b.breathTimer || 0) + dt;
          b.facingRight = p.x > b.x + b.width / 2;
          b.y = 130 + Math.sin((b.flySineOffset || 0)) * 25;

          // Despliega una cortina en abanico de llamas oscuras hacia el suelo
          if (b.breathTimer >= 0.1) {
            b.breathTimer = 0;
            const jawX = b.facingRight ? b.x + b.width - 20 : b.x + 20;
            const jawY = b.y + 45;
            const dirX = b.facingRight ? 1 : -1;

            // Ráfaga en cascada hacia el suelo
            const fanAngles = [0.4, 0.65, 0.9, 1.15, 1.4];
            for (const ang of fanAngles) {
              w.projectiles.push({
                id: Date.now() + Math.random(),
                x: jawX,
                y: jawY,
                vx: dirX * Math.cos(ang) * 420,
                vy: Math.sin(ang) * 420,
                radius: 10,
                isPlayer: false,
                life: 1.6,
                color: '#f97316',
                isBomb: true,
              });
            }
            gameAudio.playArcadeLaser();
          }

          if (b.stateTimer <= 0) {
            b.state = 'FLYING_RETURN';
            b.stateTimer = 0.45;
          }
          break;

        case 'BLACK_METEOR_CASCADE':
          b.vx = 0;
          b.y += (140 - b.y) * (8 * dt);
          b.wingFlap += dt * 32;
          b.telegraphGlow = 1;

          if (b.stateTimer <= 0) {
            b.comboStep++;
            b.state = 'IDLE';
            b.stateTimer = 0.3;
          }
          break;

        // =====================================================================
        // DRAGÓN: ATAQUE 1: ALIENTO ÍGNEO (ADAPTATIVO HACIA PLATAFORMAS O SUELO)
        // =====================================================================
        case 'FLAME_BREATH_INHALE':
          b.vx = 0;
          b.vy = 0;
          b.y = b.groundY;
          b.squash = 1.15;
          b.stretch = 1.12;
          b.telegraphGlow = clamp(1 - b.stateTimer / 0.5, 0, 1);
          b.facingRight = p.x > b.x + b.width / 2;

          // Chispas de fuego que convergen hacia las fauces
          if (Math.random() < 0.45) {
            const jawX = b.facingRight ? b.x + b.width - 24 : b.x + 24;
            const jawY = b.y + 40;
            w.particles.push({
              x: jawX + (Math.random() - 0.5) * 40,
              y: jawY + (Math.random() - 0.5) * 30,
              vx: (jawX - (jawX + (Math.random() - 0.5) * 40)) * 4,
              vy: (jawY - (jawY + (Math.random() - 0.5) * 30)) * 4,
              color: '#f97316',
              size: 2.5 + Math.random() * 2,
              life: 0.25,
              maxLife: 0.25,
            });
          }

          if (b.stateTimer <= 0) {
            b.state = 'FLAME_BREATH_SWEEP';
            b.stateTimer = 1.1; // 1.1s de llamarada continua
            b.breathTimer = 0;
            // Si el jugador está sobre plataforma, calienta esa plataforma con el aliento
            if (p.y < 350) {
              if (p.x < 480) b.platformHeatTimerLeft = 2.4;
              else b.platformHeatTimerRight = 2.4;
            }
            gameAudio.playGunshotBlast();
            w.shake = 10;
          }
          break;

        case 'FLAME_BREATH_SWEEP':
          b.vx = 0;
          b.vy = 0;
          b.y = b.groundY;
          b.breathTimer = (b.breathTimer || 0) + dt;

          // Disparo continuo de fuego cada 0.07s
          if (b.breathTimer >= 0.07) {
            b.breathTimer = 0;
            const dirX = b.facingRight ? 1 : -1;
            const jawX = b.facingRight ? b.x + b.width - 16 : b.x + 16;
            const jawY = b.y + 42;
            const speed = b.phase === 2 ? 480 : 400;

            let pVx = 0;
            let pVy = 0;
            if (b.breathAngle !== undefined) {
              const spread = (Math.random() - 0.5) * 0.22;
              const ang = b.breathAngle + spread;
              pVx = Math.cos(ang) * speed;
              pVy = Math.sin(ang) * speed;
            } else {
              const spreadAngle = (Math.random() - 0.4) * 0.25;
              pVx = dirX * Math.cos(spreadAngle) * speed;
              pVy = Math.sin(spreadAngle) * speed + 30;
            }

            w.projectiles.push({
              id: Date.now() + Math.random(),
              x: jawX,
              y: jawY,
              vx: pVx,
              vy: pVy,
              radius: 9,
              isPlayer: false,
              life: 1.5,
              color: '#f97316',
            });

            // Brasas volcánicas
            for (let s = 0; s < 3; s++) {
              w.particles.push({
                x: jawX,
                y: jawY,
                vx: dirX * (180 + Math.random() * 120),
                vy: -30 + Math.random() * 60,
                color: Math.random() > 0.4 ? '#f97316' : '#facc15',
                size: 3 + Math.random() * 2,
                life: 0.3,
                maxLife: 0.35,
              });
            }
          }

          if (b.stateTimer <= 0) {
            // Dragón sobrecalentado tras barrido de llamas
            b.comboStep++;
            b.state = 'VULNERABLE_STUN';
            b.stateTimer = 1.4; // 1.4s ventana de castigo
            gameAudio.playJumpLandingThud();
          }
          break;

        // =====================================================================
        // DRAGÓN: ATAQUE ANTI-CAMPER: DISPARO DIRIGIDO A PLATAFORMAS (TARGETED FIREBALL)
        // =====================================================================
        case 'TARGETED_FIREBALL_PREP':
          b.vx = 0;
          b.vy = 0;
          b.y = b.groundY;
          b.telegraphGlow = clamp(1 - b.stateTimer / 0.38, 0, 1);
          b.facingRight = p.x > b.x + b.width / 2;

          if (b.stateTimer <= 0) {
            b.state = 'TARGETED_FIREBALL_SHOOT';
            b.stateTimer = 0.55;
            b.breathTimer = 0;
            gameAudio.playGunshotBlast();
            w.shake = 8;
          }
          break;

        case 'TARGETED_FIREBALL_SHOOT':
          b.vx = 0;
          b.vy = 0;
          b.y = b.groundY;
          b.breathTimer = (b.breathTimer || 0) + dt;

          // Dispara 3 ráfagas de bolas de fuego dirigidas con precisión matemática a Voltlynx
          if (b.breathTimer >= 0.16) {
            b.breathTimer = 0;
            const jawX = b.facingRight ? b.x + b.width - 16 : b.x + 16;
            const jawY = b.y + 40;
            const targetX = p.x + p.width / 2;
            const targetY = p.y + p.height / 2;
            const aimAngle = Math.atan2(targetY - jawY, targetX - jawX);
            const spread = (Math.random() - 0.5) * 0.18;
            const shotSpeed = b.phase === 2 ? 580 : 500;

            w.projectiles.push({
              id: Date.now() + Math.random(),
              x: jawX,
              y: jawY,
              vx: Math.cos(aimAngle + spread) * shotSpeed,
              vy: Math.sin(aimAngle + spread) * shotSpeed,
              radius: 10,
              isPlayer: false,
              life: 1.8,
              color: '#ea580c',
              isBomb: true,
            });

            // Calienta la plataforma objetivo
            if (targetX < 480) {
              b.platformHeatTimerLeft = 2.4;
            } else {
              b.platformHeatTimerRight = 2.4;
            }

            gameAudio.playArcadeLaser();
          }

          if (b.stateTimer <= 0) {
            b.comboStep++;
            b.state = 'IDLE';
            b.stateTimer = 0.25;
          }
          break;

        // =====================================================================
        // DRAGÓN: ATAQUE ANTI-CAMPER: BARRIDO AÉREO DE PLATAFORMA (PLATFORM SWOOP DASH)
        // El dragón vuela a la altura exacta de las plataformas (Y ~ 220-250) y barre horizontalmente
        // =====================================================================
        case 'PLATFORM_SWOOP_ASCENT':
          b.wingFlap += dt * 32;
          b.squash = 0.78;
          b.stretch = 1.3;
          b.y += (220 - b.y) * (10 * dt);
          b.facingRight = p.x > b.x + b.width / 2;

          if (Math.abs(b.y - 220) < 18 || b.stateTimer <= 0) {
            b.y = 220;
            b.state = 'PLATFORM_SWOOP_HOLD';
            b.stateTimer = 0.35; // 350ms telegrafo con alas en llamas
            gameAudio.playGunshotBlast();
            w.shake = 10;
          }
          break;

        case 'PLATFORM_SWOOP_HOLD':
          b.y = 220;
          b.telegraphGlow = 1;
          b.wingFlap += dt * 36;
          b.facingRight = p.x > b.x + b.width / 2;

          // Chispas de fuego telegrafiadas a la altura de las plataformas
          if (Math.random() < 0.6) {
            w.particles.push({
              x: b.x + Math.random() * b.width,
              y: b.y + Math.random() * b.height,
              vx: (b.facingRight ? 1 : -1) * (120 + Math.random() * 100),
              vy: (Math.random() - 0.5) * 40,
              color: '#f97316',
              size: 3 + Math.random() * 3,
              life: 0.25,
              maxLife: 0.25,
            });
          }

          if (b.stateTimer <= 0) {
            b.state = 'PLATFORM_SWOOP_DASH';
            b.stateTimer = 0.85;
            const dir = b.facingRight ? 1 : -1;
            b.vx = dir * (b.phase === 2 ? 760 : 660);
            gameAudio.playArcadeLaser();
            w.shake = 14;
          }
          break;

        case 'PLATFORM_SWOOP_DASH':
          b.x += b.vx * dt;
          b.y = 220;
          b.wingFlap += dt * 36;

          // Calienta las plataformas al pasar velozmente sobre ellas
          if (b.x < 300) b.platformHeatTimerLeft = 2.4;
          if (b.x + b.width > 660) b.platformHeatTimerRight = 2.4;

          // Estela de brasas volcánicas
          for (let s = 0; s < 4; s++) {
            w.particles.push({
              x: b.x + Math.random() * b.width,
              y: b.y + Math.random() * b.height,
              vx: (Math.random() - 0.5) * 80 - b.vx * 0.15,
              vy: (Math.random() - 0.5) * 60,
              color: Math.random() > 0.4 ? '#f97316' : '#ef4444',
              size: 3 + Math.random() * 3,
              life: 0.35,
              maxLife: 0.35,
            });
          }

          // Choque contra muro o fin de carrera -> Cae al suelo en VULNERABLE_STUN para castigo
          if (
            (b.vx < 0 && b.x <= b.arenaLeft) ||
            (b.vx > 0 && b.x + b.width >= b.arenaRight) ||
            b.stateTimer <= 0
          ) {
            b.x = clamp(b.arenaLeft, b.x, b.arenaRight - b.width);
            b.vx = 0;
            b.y = b.groundY;
            b.squash = 1.45;
            b.stretch = 0.62;
            w.shake = 22;
            gameAudio.playJumpLandingThud();
            gameAudio.playChiptuneExplosion();

            spawnParticles(b.x + b.width / 2, b.groundY + b.height, 40, '#f97316', 300);
            spawnParticles(b.x + b.width / 2, b.groundY + b.height, 25, '#fbbf24', 220);

            // Ventana de castigo de 1.4s (equilibrio y recompensa al jugador ágil)
            b.comboStep++;
            b.state = 'VULNERABLE_STUN';
            b.stateTimer = 1.4;
          }
          break;

        // =====================================================================
        // DRAGÓN: ATAQUE 2: VUELO Y BOMBARDEO EXPANSIVO DE BOLAS DE FUEGO
        // =====================================================================
        case 'VAULT_ASCENT':
          b.vy = -620;
          b.y += b.vy * dt;
          b.squash = 0.78;
          b.stretch = 1.3;
          b.wingFlap += dt * 32;
          if (b.y <= 110 || b.stateTimer <= 0) {
            b.y = 110;
            b.vy = 0;
            b.state = 'FIREBALL_BOMBARD';
            b.stateTimer = 1.3;
            b.cascadeTimer = 0;
            b.facingRight = p.x > b.x + b.width / 2;
          }
          break;

        case 'FIREBALL_BOMBARD':
          b.wingFlap += dt * 26;
          b.cascadeTimer = (b.cascadeTimer || 0) + dt;
          // Desplazamiento horizontal por la bóveda
          b.x += (b.facingRight ? 1 : -1) * 150 * dt;
          if (b.x <= b.arenaLeft) {
            b.x = b.arenaLeft;
            b.facingRight = true;
          } else if (b.x + b.width >= b.arenaRight) {
            b.x = b.arenaRight - b.width;
            b.facingRight = false;
          }

          // Dispara ráfagas de 5 bolas de fuego expansivas
          if (b.cascadeTimer >= 0.22) {
            b.cascadeTimer = 0;
            const fX = b.x + b.width / 2;
            const fY = b.y + b.height * 0.7;
            const spreadX = (Math.random() - 0.5) * 360;
            const spreadY = 380 + Math.random() * 80;

            w.projectiles.push({
              id: Date.now() + Math.random(),
              x: fX,
              y: fY,
              vx: spreadX,
              vy: spreadY,
              radius: 10,
              isPlayer: false,
              life: 2.2,
              color: '#ea580c',
              isBomb: true,
            });
            gameAudio.playArcadeLaser();
          }

          if (b.stateTimer <= 0) {
            b.state = 'FLYING_RETURN';
            b.stateTimer = 0.5;
          }
          break;

        case 'FLYING_RETURN':
          b.wingFlap += dt * 20;
          b.y += (b.groundY - b.y) * (8 * dt);
          if (b.y >= b.groundY - 8 || b.stateTimer <= 0) {
            b.y = b.groundY;
            b.squash = 1.35;
            b.stretch = 0.72;
            b.comboStep++;
            b.state = 'IDLE';
            b.stateTimer = 0.25;
          }
          break;

        // =====================================================================
        // DRAGÓN: ATAQUE 3: PICADO AÉREO SÍSMICO CON ESTELA DE FUEGO
        // =====================================================================
        case 'DRAGON_DIVE_PREP':
          b.y += (120 - b.y) * (6 * dt);
          b.wingFlap += dt * 30;
          b.squash = 0.82;
          b.stretch = 1.25;
          b.trackTargetX += (p.x + p.width / 2 - b.trackTargetX) * (10 * dt);
          b.trackTargetX = clamp(b.trackTargetX, b.arenaLeft + 40, b.arenaRight - 40);

          if (b.stateTimer <= 0) {
            b.state = 'DRAGON_DIVE';
            b.stateTimer = 0.75;
            b.squash = 0.75;
            b.stretch = 1.35;
            const targetX = b.trackTargetX;
            const targetY = b.groundY;
            const angle = Math.atan2(targetY - b.y, targetX - (b.x + b.width / 2));
            const diveSpeed = b.phase === 2 ? 800 : 680;
            b.vx = Math.cos(angle) * diveSpeed;
            b.vy = Math.sin(angle) * diveSpeed;
            gameAudio.playGunshotBlast();
            w.shake = 10;
          }
          break;

        case 'DRAGON_DIVE':
          b.x += b.vx * dt;
          b.y += b.vy * dt;
          b.wingFlap += dt * 36;
          w.shake = Math.max(w.shake, 6);

          // Estela de brasas volcánicas continuas
          for (let s = 0; s < 4; s++) {
            w.particles.push({
              x: b.x + Math.random() * b.width,
              y: b.y + Math.random() * b.height,
              vx: (Math.random() - 0.5) * 80 - b.vx * 0.2,
              vy: (Math.random() - 0.5) * 80 - b.vy * 0.2,
              color: Math.random() > 0.4 ? '#f97316' : '#ef4444',
              size: 3 + Math.random() * 3,
              life: 0.35,
              maxLife: 0.35,
            });
          }

          // Impacto sísmico en el suelo
          if (b.y >= b.groundY) {
            b.y = b.groundY;
            b.vx = 0;
            b.vy = 0;
            b.squash = 1.5;
            b.stretch = 0.55;
            w.shake = 22;
            gameAudio.playChiptuneExplosion();
            gameAudio.playJumpLandingThud();

            spawnParticles(b.x + b.width / 2, b.groundY + b.height, 35, '#f97316', 300);
            spawnParticles(b.x + b.width / 2, b.groundY + b.height, 25, '#fbbf24', 220);

            // Dos ondas de choque terrestres que barren el suelo
            const waveSpd = b.phase === 2 ? 260 : 220;
            w.shockwaves.push({
              id: Date.now() + 1,
              x: b.x + b.width / 2,
              y: 440 - 18,
              vx: -waveSpd,
              width: 24,
              height: 18,
              life: 1.8,
              maxLife: 1.8,
              color: '#f97316',
            });
            w.shockwaves.push({
              id: Date.now() + 2,
              x: b.x + b.width / 2,
              y: 440 - 18,
              vx: waveSpd,
              width: 24,
              height: 18,
              life: 1.8,
              maxLife: 1.8,
              color: '#f97316',
            });

            // Dragón sobrecalentado tras el picado: 1.4s de apertura
            b.comboStep++;
            b.state = 'VULNERABLE_STUN';
            b.stateTimer = 1.4;
          }
          break;

        // =====================================================================
        // DRAGÓN: FASE 2: LLUVIA DE ESTALACTITAS INCANDESCENTES
        // =====================================================================
        case 'STALACTITE_RAIN':
          b.vx = 0;
          b.y = b.groundY;
          b.wingFlap += dt * 28;
          b.telegraphGlow = 1;

          if (b.stateTimer <= 0) {
            b.comboStep++;
            b.state = 'IDLE';
            b.stateTimer = 0.25;
          }
          break;

        // =====================================================================
        // ASURA CELESTIAL: TELETRANSPORTE MÍSTICO HACIA PEDESTALES DE LA ARENA
        // =====================================================================
        case 'ASURA_TELEPORT_OUT':
          b.vx = 0;
          b.vy = 0;
          b.shieldActive = true;
          if (b.stateTimer <= 0) {
            b.state = 'ASURA_TELEPORT_IN';
            b.stateTimer = 0.35;

            // Pedestales disponibles: Izquierdo (90), Derecho (740), o Centro (480)
            const pedestals = [
              {x: 90, y: 190},
              {x: 740, y: 190},
              {x: 480, y: 280},
              {x: p.x < 480 ? 740 : 90, y: 190},
            ];
            b.teleportTargetIndex = ((b.teleportTargetIndex || 0) + 1) % pedestals.length;
            const targetPos = pedestals[b.teleportTargetIndex];
            b.x = targetPos.x;
            b.y = targetPos.y;
            b.groundY = targetPos.y;
            b.facingRight = p.x > b.x + b.width / 2;

            gameAudio.playPowerupChime();
            spawnParticles(b.x + b.width / 2, b.y + b.height / 2, 32, '#facc15', 240);
            spawnParticles(b.x + b.width / 2, b.y + b.height / 2, 22, '#818cf8', 200);
          }
          break;

        case 'ASURA_TELEPORT_IN':
          b.vx = 0;
          b.vy = 0;
          b.facingRight = p.x > b.x + b.width / 2;
          if (b.stateTimer <= 0) {
            b.comboStep++;
            b.state = 'IDLE';
            b.stateTimer = 0.25;
            b.shieldActive = false;
          }
          break;

        // =====================================================================
        // ASURA CELESTIAL: ONDAS EXPANSIVAS TERRESTRES SAGRADAS
        // =====================================================================
        case 'SACRED_SHOCKWAVES_PREP':
          b.vx = 0;
          b.shieldActive = true;
          b.facingRight = p.x > b.x + b.width / 2;
          b.telegraphGlow = clamp(1 - b.stateTimer / 0.45, 0, 1);
          if (b.stateTimer <= 0) {
            b.state = 'SACRED_SHOCKWAVES';
            b.stateTimer = 0.55;
            b.shieldActive = false;
            w.shake = 20;
            w.lightningFlash = 0.5;
            gameAudio.playJumpLandingThud();
            gameAudio.playChiptuneExplosion();

            // Dos colosales ondas sagradas doradas y púrpuras que recorren todo el suelo
            const originX = b.x + b.width / 2;
            const waveY = 440 - 20;
            w.shockwaves.push({
              id: Date.now() + 1,
              x: originX,
              y: waveY,
              vx: -300,
              width: 32,
              height: 20,
              life: 2.2,
              maxLife: 2.2,
              color: '#facc15',
            });
            w.shockwaves.push({
              id: Date.now() + 2,
              x: originX,
              y: waveY,
              vx: 300,
              width: 32,
              height: 20,
              life: 2.2,
              maxLife: 2.2,
              color: '#facc15',
            });

            spawnParticles(originX, 440, 35, '#facc15', 300);
            spawnParticles(originX, 440, 25, '#818cf8', 220);
          }
          break;

        case 'SACRED_SHOCKWAVES':
          b.vx = 0;
          if (b.stateTimer <= 0) {
            b.comboStep++;
            b.state = 'VULNERABLE_STUN';
            b.stateTimer = 1.3;
          }
          break;

        // =====================================================================
        // ASURA CELESTIAL: ORBES DE ENERGÍA PSÍQUICA RASTRADORES EN ABANICO GEOMÉTRICO
        // =====================================================================
        case 'PSYCHIC_ORB_PREP':
          b.vx = 0;
          b.shieldActive = true;
          b.facingRight = p.x > b.x + b.width / 2;
          b.telegraphGlow = clamp(1 - b.stateTimer / 0.48, 0, 1);
          if (b.stateTimer <= 0) {
            b.state = 'PSYCHIC_ORB_FAN';
            b.stateTimer = 0.6;
            b.shieldActive = false;
            w.shake = 12;
            gameAudio.playArcadeLaser();
            gameAudio.playGunshotBlast();

            // Dispara 6 orbes psíquicos en formación de abanico geométrico con suave tracking
            const originX = b.x + b.width / 2;
            const originY = b.y + b.height * 0.45;
            const targetX = p.x + p.width / 2;
            const targetY = p.y + p.height / 2;
            const baseAngle = Math.atan2(targetY - originY, targetX - originX);
            const orbCount = b.phase === 2 ? 7 : 5;

            for (let i = 0; i < orbCount; i++) {
              const spread = (i - (orbCount - 1) / 2) * 0.22;
              const ang = baseAngle + spread;
              const spd = 360;
              w.projectiles.push({
                id: Date.now() + Math.random(),
                x: originX,
                y: originY,
                vx: Math.cos(ang) * spd,
                vy: Math.sin(ang) * spd,
                radius: 11,
                isPlayer: false,
                life: 2.8,
                color: '#c084fc',
                isBomb: true,
                damage: 35,
              });
            }

            spawnParticles(originX, originY, 25, '#c084fc', 240);
            spawnParticles(originX, originY, 15, '#facc15', 180);
          }
          break;

        case 'PSYCHIC_ORB_FAN':
          b.vx = 0;
          if (b.stateTimer <= 0) {
            b.comboStep++;
            b.state = 'VULNERABLE_STUN';
            b.stateTimer = 1.2;
          }
          break;

        // =====================================================================
        // ASURA CELESTIAL: FASE 1: ATAQUE 1: RÁFAGA DE RAYOS PUNTIAGUDOS (8 BRAZOS - SHOOT)
        // Calibrado con cadencia justa: ráfaga de 4 jabalinas con espacio entre proyectiles y 1.2s de pausa
        // =====================================================================
        case 'DEITY_SHOOT_PREP':
          b.vx = 0;
          b.shieldActive = false;
          b.facingRight = p.x > b.x + b.width / 2;
          b.telegraphGlow = clamp(1 - b.stateTimer / 0.45, 0, 1);

          // Partículas de luz astral convergiendo hacia los 8 brazos
          if (Math.random() < 0.6) {
            const bx = b.x + b.width / 2;
            const by = b.y + b.height / 2;
            w.particles.push({
              x: bx + (Math.random() - 0.5) * 80,
              y: by + (Math.random() - 0.5) * 80,
              vx: (bx - (bx + (Math.random() - 0.5) * 80)) * 5,
              vy: (by - (by + (Math.random() - 0.5) * 80)) * 5,
              color: '#facc15',
              size: 2.5 + Math.random() * 2.5,
              life: 0.22,
              maxLife: 0.22,
            });
          }

          if (b.stateTimer <= 0) {
            b.state = 'DEITY_SHOOT';
            b.stateTimer = 1.1; // Ráfaga calibrada de 4 disparos con espacio
            b.cascadeTimer = 0;
            b.javelinCount = 0;
            w.shake = 8;
            gameAudio.playArcadeLaser();
          }
          break;

        case 'DEITY_SHOOT':
          b.vx = 0;
          b.shieldActive = false;
          b.facingRight = p.x > b.x + b.width / 2;
          b.cascadeTimer = (b.cascadeTimer || 0) + dt;

          // Cadencia espaciada: 0.26s entre cada disparo (4 disparos en total) con amplios huecos entre proyectiles
          if (b.cascadeTimer >= 0.26 && (b.javelinCount || 0) < 4) {
            b.cascadeTimer = 0;
            b.javelinCount = (b.javelinCount || 0) + 1;

            const originX = b.x + b.width / 2;
            const originY = b.y + b.height * 0.45;
            const dirX = b.facingRight ? 1 : -1;
            const speed = 460; // Velocidad legible para esquivar con reflejos

            if (b.javelinCount % 2 === 1) {
              // Patrón 1: Abanico de 4 jabalinas doradas con amplio espacio entre trayectorias (gaps para saltar o dash)
              const angles = [-0.52, -0.20, 0.20, 0.52];
              for (const ang of angles) {
                w.projectiles.push({
                  id: Date.now() + Math.random(),
                  x: originX,
                  y: originY,
                  vx: dirX * Math.cos(ang) * speed,
                  vy: Math.sin(ang) * speed,
                  radius: 7,
                  isPlayer: false,
                  life: 2.4,
                  color: '#fde047',
                  isBomb: true,
                });
              }
            } else {
              // Patrón 2: 3 Lanzas puntiagudas con separación angular amplia
              const targetX = p.x + p.width / 2;
              const targetY = p.y + p.height / 2;
              const aimAngle = Math.atan2(targetY - originY, targetX - originX);
              const spreadAngles = [-0.26, 0, 0.26];

              for (const sAng of spreadAngles) {
                w.projectiles.push({
                  id: Date.now() + Math.random(),
                  x: originX,
                  y: originY,
                  vx: Math.cos(aimAngle + sAng) * (speed * 1.05),
                  vy: Math.sin(aimAngle + sAng) * (speed * 1.05),
                  radius: 8,
                  isPlayer: false,
                  life: 2.4,
                  color: '#818cf8',
                  isBomb: true,
                });
              }
            }

            gameAudio.playArcadeLaser();
            w.shake = 5;
          }

          if (b.stateTimer <= 0) {
            // Pausa con respiro de 1.2s antes del siguiente ciclo donde además el escudo está abierto para castigar
            b.comboStep++;
            b.state = 'VULNERABLE_STUN';
            b.stateTimer = 1.2;
            b.shieldActive = false;
          }
          break;

        // =====================================================================
        // ASURA CELESTIAL: FASE 1: ATAQUE 2: RÁFAGA DE GOLPES DE KARATE (8 BRAZOS - ATTACK)
        // =====================================================================
        case 'DEITY_KARATE_DASH':
          b.shieldActive = false;
          b.facingRight = p.x > b.x + b.width / 2;
          b.x += b.vx * dt;
          b.y += (p.y - 30 - b.y) * (8 * dt);

          // Estela de vacío y palmas cortantes
          if (Math.random() < 0.5) {
            w.particles.push({
              x: b.x + Math.random() * b.width,
              y: b.y + Math.random() * b.height,
              vx: (Math.random() - 0.5) * 60,
              vy: (Math.random() - 0.5) * 60,
              color: '#818cf8',
              size: 3 + Math.random() * 3,
              life: 0.25,
              maxLife: 0.25,
            });
          }

          if (
            Math.abs(b.x + b.width / 2 - (p.x + p.width / 2)) < 90 ||
            b.stateTimer <= 0
          ) {
            b.state = 'DEITY_KARATE_ATTACK';
            b.stateTimer = 0.75;
            b.vx = 0;
            b.karateCount = 0;
            b.cascadeTimer = 0;
            w.shake = 12;
            gameAudio.playMeleePunch();
          }
          break;

        case 'DEITY_KARATE_ATTACK':
          b.vx = 0;
          b.shieldActive = false;
          b.facingRight = p.x > b.x + b.width / 2;
          b.cascadeTimer = (b.cascadeTimer || 0) + dt;

          // Ráfaga vertiginosa de golpes de kárate y palmas de vacío
          if (b.cascadeTimer >= 0.12 && (b.karateCount || 0) < 6) {
            b.cascadeTimer = 0;
            b.karateCount = (b.karateCount || 0) + 1;

            const dir = b.facingRight ? 1 : -1;
            const shockX = b.facingRight ? b.x + b.width : b.x;
            const shockY = b.y + 40 + Math.random() * 70;

            w.projectiles.push({
              id: Date.now() + Math.random(),
              x: shockX,
              y: shockY,
              vx: dir * (360 + Math.random() * 80),
              vy: (Math.random() - 0.5) * 60,
              radius: 11,
              isPlayer: false,
              life: 0.65,
              color: '#c084fc',
            });

            gameAudio.playMeleePunch();
            w.shake = 5;
          }

          if (b.stateTimer <= 0) {
            b.comboStep++;
            b.state = 'VULNERABLE_STUN';
            b.stateTimer = 1.3; // 1.3s apertura donde Voltlynx puede castigar!
            b.shieldActive = false;
          }
          break;

        // =====================================================================
        // ASURA CELESTIAL: FASE 2: ATAQUE 1: ESTOCADAS Y ARCOS DE RAYOS CON TRIDENTE
        // Telegrafiado de 0.4s con chispas en la punta del tridente y esquivas limpias (saltar o agacharse)
        // =====================================================================
        case 'DEITY_TRIDENT_PREP':
          b.vx = 0;
          b.y = b.groundY;
          b.shieldActive = false;
          b.facingRight = p.x > b.x + b.width / 2;
          b.telegraphGlow = clamp(1 - b.stateTimer / 0.4, 0, 1);

          // Chispas eléctricas brillantes en la punta del tridente sagrado
          if (Math.random() < 0.6) {
            const tipX = b.facingRight ? b.x + b.width + 14 : b.x - 14;
            const tipY = b.groundY + 32;
            w.particles.push({
              x: tipX + (Math.random() - 0.5) * 16,
              y: tipY + (Math.random() - 0.5) * 16,
              vx: (Math.random() - 0.5) * 50,
              vy: -20 - Math.random() * 40,
              color: '#fde047',
              size: 2.5,
              life: 0.22,
              maxLife: 0.22,
            });
          }

          if (b.stateTimer <= 0) {
            b.state = 'DEITY_TRIDENT_THRUST';
            b.stateTimer = 0.85;
            b.cascadeTimer = 0;
            b.javelinCount = 0;
            gameAudio.playSwordClash();
            w.shake = 8;
          }
          break;

        case 'DEITY_TRIDENT_THRUST':
          b.vx = (b.facingRight ? 1 : -1) * 50;
          b.y = b.groundY;
          b.shieldActive = false;
          b.cascadeTimer = (b.cascadeTimer || 0) + dt;

          // Libera 2 ondas de choque a ras de suelo y proyectiles aéreos que se pueden esquivar saltando o agachándose
          if (b.cascadeTimer >= 0.32 && (b.javelinCount || 0) < 2) {
            b.cascadeTimer = 0;
            b.javelinCount = (b.javelinCount || 0) + 1;

            const dir = b.facingRight ? 1 : -1;
            const tX = b.facingRight ? b.x + b.width + 10 : b.x - 10;
            const tY = b.groundY + 80;

            // Onda de choque terrestre que se salta limpiamente (altura 18px)
            w.shockwaves.push({
              id: Date.now() + Math.random(),
              x: tX,
              y: 440 - 18,
              vx: dir * 260,
              width: 28,
              height: 18,
              life: 2.0,
              maxLife: 2.0,
              color: '#facc15',
            });

            // Arco aéreo elevado que se esquiva agachándose (ducking)
            w.projectiles.push({
              id: Date.now() + Math.random(),
              x: tX,
              y: tY - 36,
              vx: dir * 360,
              vy: 0,
              radius: 9,
              isPlayer: false,
              life: 1.8,
              color: '#fde047',
            });

            gameAudio.playSwordClash();
            gameAudio.playArcadeLaser();
            w.shake = 6;
          }

          if (b.stateTimer <= 0) {
            b.comboStep++;
            b.state = 'IDLE';
            b.stateTimer = 0.35;
          }
          break;

        // =====================================================================
        // ASURA CELESTIAL: FASE 2: ATAQUE 2: SALTO Y PICADO PLUNGE CON TRIDENTE
        // =====================================================================
        case 'DEITY_PLUNGE_JUMP':
          b.shieldActive = false;
          b.x += (b.trackTargetX - (b.x + b.width / 2)) * (6 * dt);
          b.y += b.vy * dt;
          b.vy += 1200 * dt;

          if (b.vy >= 0 || b.y <= 120) {
            b.state = 'DEITY_PLUNGE_DIVE';
            b.stateTimer = 0.7;
            b.vy = 860;
            b.vx = 0;
            gameAudio.playGunshotBlast();
            w.shake = 8;
          }
          break;

        case 'DEITY_PLUNGE_DIVE':
          b.shieldActive = false;
          b.y += b.vy * dt;

          // Clava el tridente verticalmente en el suelo
          if (b.y >= b.groundY) {
            b.y = b.groundY;
            b.vy = 0;
            b.squash = 1.5;
            b.stretch = 0.55;
            w.shake = 26;
            w.lightningFlash = 0.5;
            gameAudio.playJumpLandingThud();
            gameAudio.playChiptuneExplosion();

            spawnParticles(b.x + b.width / 2, b.groundY + b.height, 45, '#facc15', 340);
            spawnParticles(b.x + b.width / 2, b.groundY + b.height, 35, '#818cf8', 260);

            // Doble onda de choque celeste a izquierda y derecha
            w.shockwaves.push({
              id: Date.now() + 1,
              x: b.x + b.width / 2,
              y: 440 - 20,
              vx: -270,
              width: 28,
              height: 20,
              life: 1.8,
              maxLife: 1.8,
              color: '#818cf8',
            });
            w.shockwaves.push({
              id: Date.now() + 2,
              x: b.x + b.width / 2,
              y: 440 - 20,
              vx: 270,
              width: 28,
              height: 20,
              life: 1.8,
              maxLife: 1.8,
              color: '#818cf8',
            });

            // Ventana de castigo táctica tras el plunge
            b.comboStep++;
            b.state = 'VULNERABLE_STUN';
            b.stateTimer = 1.4;
          }
          break;

        // =====================================================================
        // ASURA CELESTIAL: FASE 2: ATAQUE 3: MARCHA IMPLACABLE CON TRIDENTE
        // =====================================================================
        case 'DEITY_WALK':
          b.shieldActive = false;
          b.facingRight = p.x > b.x + b.width / 2;
          b.y = b.groundY;
          b.vx = (b.facingRight ? 1 : -1) * 140;
          b.x += b.vx * dt;

          if (
            Math.abs(b.x + b.width / 2 - (p.x + p.width / 2)) < 130 ||
            b.stateTimer <= 0
          ) {
            b.state = 'DEITY_TRIDENT_PREP';
            b.stateTimer = 0.3;
            b.vx = 0;
            gameAudio.playSwordClash();
          }
          break;

        // =====================================================================
        // KRYONA: DESPLAZAMIENTOS FLOTANTES RÁPIDOS EN EL AIRE (GLIDES GÉLIDOS)
        // =====================================================================
        case 'GLACIAL_GLIDE':
          b.mirageTimer = Math.max(0, (b.mirageTimer || 0) - dt);
          b.x += b.vx * dt;
          b.y += (210 - b.y) * (8 * dt);

          // Estela de escarcha, copos de nieve y polvo gélido
          if (Math.random() < 0.5) {
            w.particles.push({
              x: b.x + Math.random() * b.width,
              y: b.y + b.height * 0.7,
              vx: (Math.random() - 0.5) * 50 - b.vx * 0.1,
              vy: (Math.random() - 0.5) * 40,
              color: '#a5f3fc',
              size: 2.5,
              life: 0.3,
              maxLife: 0.35,
            });
          }

          if (
            (b.vx < 0 && b.x <= b.arenaLeft + 40) ||
            (b.vx > 0 && b.x + b.width >= b.arenaRight - 40) ||
            b.stateTimer <= 0
          ) {
            b.vx = 0;
            b.y = b.groundY;
            b.comboStep++;
            b.state = 'IDLE';
            b.stateTimer = 0.25;
            gameAudio.playJumpLandingThud();
          }
          break;

        // =====================================================================
        // KRYONA: LLUVIA DE ESTALACTITAS AFILADAS DESDE EL TECHO GLACIAL
        // =====================================================================
        case 'ICICLE_RAIN_CAST':
          b.vx = 0;
          b.y = b.groundY;
          b.mirageTimer = Math.max(0, (b.mirageTimer || 0) - dt);
          b.telegraphGlow = 1;

          if (b.stateTimer <= 0) {
            b.comboStep++;
            b.state = 'IDLE';
            b.stateTimer = 0.3;
          }
          break;

        // =====================================================================
        // KRYONA: ANILLOS EXPANSIVOS DE ESCARCHA Y RÁFAGAS TRIPLES
        // =====================================================================
        case 'EXPANDING_FROST_RINGS':
          b.vx = 0;
          b.y = b.groundY;
          b.mirageTimer = Math.max(0, (b.mirageTimer || 0) - dt);

          // Clava el cetro liberando dos anillos expansivos a ras de suelo
          if (b.stateTimer < 0.7 && b.stateTimer > 0.6) {
            const originX = b.x + b.width / 2;
            w.shockwaves.push({
              id: Date.now() + 1,
              x: originX,
              y: 440 - 24,
              vx: -320,
              width: 32,
              height: 24,
              life: 2.2,
              maxLife: 2.2,
              color: '#38bdf8',
              isFrostWave: true,
            });
            w.shockwaves.push({
              id: Date.now() + 2,
              x: originX,
              y: 440 - 24,
              vx: 320,
              width: 32,
              height: 24,
              life: 2.2,
              maxLife: 2.2,
              color: '#38bdf8',
              isFrostWave: true,
            });
            w.shake = 12;
            gameAudio.playArcadeLaser();
          }

          if (b.stateTimer <= 0) {
            b.state = 'TRIPLE_JAVELINS_PREP';
            b.stateTimer = 0.35;
            b.facingRight = p.x > b.x + b.width / 2;
            gameAudio.playPowerupChime();
          }
          break;

        case 'TRIPLE_JAVELINS_PREP':
          b.vx = 0;
          b.y = b.groundY;
          b.facingRight = p.x > b.x + b.width / 2;
          b.telegraphGlow = clamp(1 - b.stateTimer / 0.35, 0, 1);
          if (b.stateTimer <= 0) {
            b.state = 'TRIPLE_JAVELINS_SHOOT';
            b.stateTimer = 0.45;
            const originX = b.facingRight ? b.x + b.width : b.x;
            const originY = b.y + 50;
            const targetX = p.x + p.width / 2;
            const targetY = p.y + p.height / 2;
            const baseAngle = Math.atan2(targetY - originY, targetX - originX);
            const speed = b.phase === 2 ? 560 : 480;

            // Ráfaga triple de lanzas de hielo dirigidas
            [-0.18, 0, 0.18].forEach((angOff) => {
              w.projectiles.push({
                id: Date.now() + Math.random(),
                x: originX,
                y: originY,
                vx: Math.cos(baseAngle + angOff) * speed,
                vy: Math.sin(baseAngle + angOff) * speed,
                radius: 10,
                isPlayer: false,
                life: 2.4,
                color: '#a5f3fc',
                isIcePrism: true,
              });
            });

            gameAudio.playArcadeLaser();
            gameAudio.playGunshotBlast();
            w.shake = 8;
          }
          break;

        case 'TRIPLE_JAVELINS_SHOOT':
          b.vx = 0;
          b.y = b.groundY;
          if (b.stateTimer <= 0) {
            b.comboStep++;
            b.state = 'VULNERABLE_STUN';
            b.stateTimer = 1.3;
          }
          break;

        // =====================================================================
        // KRYONA: ATAQUE 1: DISPARO DE CRISTALES DE HIELO (SHOOT)
        // =====================================================================
        case 'ICE_PRISMS_PREP':
          b.vx = 0;
          b.y = b.groundY;
          b.facingRight = p.x > b.x + b.width / 2;
          b.telegraphGlow = clamp(1 - b.stateTimer / 0.45, 0, 1);
          if (b.stateTimer <= 0) {
            b.state = 'ICE_PRISMS_SHOOT';
            b.stateTimer = 0.4;
            const prismCount = b.phase === 2 ? 7 : 5;
            const originX = b.facingRight ? b.x + b.width - 20 : b.x + 20;
            const originY = b.y + 50;
            const targetX = p.x + p.width / 2;
            const targetY = p.y + p.height / 2;
            const baseAngle = Math.atan2(targetY - originY, targetX - originX);
            const speed = b.phase === 2 ? 520 : 440;

            for (let i = 0; i < prismCount; i++) {
              const spread = (i - (prismCount - 1) / 2) * 0.16;
              const ang = baseAngle + spread;
              w.projectiles.push({
                id: Date.now() + Math.random(),
                x: originX,
                y: originY,
                vx: Math.cos(ang) * speed,
                vy: Math.sin(ang) * speed,
                radius: 9,
                isPlayer: false,
                life: 2.5,
                color: '#a5f3fc',
                isIcePrism: true,
              });
            }
            gameAudio.playArcadeLaser();
            gameAudio.playGunshotBlast();
            w.shake = 8;
          }
          break;

        case 'ICE_PRISMS_SHOOT':
          b.vx = 0;
          b.y = b.groundY;
          if (b.stateTimer <= 0) {
            b.comboStep++;
            b.state = 'VULNERABLE_STUN';
            b.stateTimer = 1.3;
          }
          break;

        // =====================================================================
        // KRYONA: ATAQUE 2: VAHO GÉLIDO / AURA DE CONGELAMIENTO (RALENTIZACIÓN)
        // =====================================================================
        case 'FROST_WAVE_PREP':
          b.vx = 0;
          b.y = b.groundY;
          b.facingRight = p.x > b.x + b.width / 2;
          b.telegraphGlow = clamp(1 - b.stateTimer / 0.45, 0, 1);
          if (b.stateTimer <= 0) {
            b.state = 'FROST_WAVE';
            b.stateTimer = 0.5;
            const dir = b.facingRight ? 1 : -1;
            const waveSpd = b.phase === 2 ? 350 : 280;
            const originX = b.facingRight ? b.x + b.width : b.x;
            w.shockwaves.push({
              id: Date.now() + Math.random(),
              x: originX,
              y: 440 - 24,
              vx: dir * waveSpd,
              width: 36,
              height: 24,
              life: 2.2,
              maxLife: 2.2,
              color: '#38bdf8',
              isFrostWave: true,
            });
            gameAudio.playArcadeLaser();
            w.shake = 10;
            spawnParticles(originX, 440 - 12, 20, '#a5f3fc', 220);
          }
          break;

        case 'FROST_WAVE':
          b.vx = 0;
          b.y = b.groundY;
          if (b.stateTimer <= 0) {
            b.comboStep++;
            b.state = 'IDLE';
            b.stateTimer = 0.3;
          }
          break;

        // =====================================================================
        // KRYONA: ATAQUE 3: TELETRANSPORTE TRAS LA ESPALDA & ESTOCADA MÍSTICA
        // =====================================================================
        case 'TELEPORT_OUT':
          b.vx = 0;
          b.vy = 0;
          if (b.stateTimer <= 0) {
            b.state = 'TELEPORT_WAIT';
            b.stateTimer = 0.5; // Desaparece 0.5s en remolino de nieve
          }
          break;

        case 'TELEPORT_WAIT':
          b.vx = 0;
          b.vy = 0;
          if (b.stateTimer <= 0) {
            // Reaparece justo a la espalda de Voltlynx
            const behindOffset = p.facingRight ? -85 : 85;
            let targetX = p.x + behindOffset;
            targetX = clamp(targetX, b.arenaLeft + 20, b.arenaRight - b.width - 20);
            b.x = targetX;
            b.y = b.groundY;
            b.facingRight = p.x > b.x + b.width / 2;
            b.state = 'TELEPORT_IN';
            b.stateTimer = 0.45; // Ejecuta estocada inmediata con cetro
            gameAudio.playHoverMicroTone();
            gameAudio.playSwordClash();
            spawnParticles(b.x + b.width / 2, b.y + b.height / 2, 25, '#a5f3fc', 220, -10);
          }
          break;

        case 'TELEPORT_IN':
          b.vx = (b.facingRight ? 1 : -1) * 80;
          b.y = b.groundY;
          // Área de impacto de la estocada mística
          if (b.stateTimer < 0.35 && b.stateTimer > 0.15) {
            const thrustX = b.facingRight ? b.x + b.width : b.x - 30;
            if (
              p.x < thrustX + 40 &&
              p.x + p.width > thrustX &&
              p.y < b.y + b.height &&
              p.y + p.height > b.y + 40
            ) {
              handlePlayerDamage();
            }
          }
          if (b.stateTimer <= 0) {
            // Fallo y ventana de castigo de 1.3s
            b.vx = 0;
            b.comboStep++;
            b.state = 'VULNERABLE_STUN';
            b.stateTimer = 1.3;
          }
          break;

        // =====================================================================
        // KRYONA: ATAQUE 4: COMBO CUERPO A CUERPO DE 3 GOLPES CON EL CETRO
        // =====================================================================
        case 'SCEPTER_COMBO':
          b.vx = (b.facingRight ? 1 : -1) * 70;
          b.y = b.groundY;
          if (Math.random() < 0.3) {
            gameAudio.playSwordClash();
            w.shake = 4;
          }
          if (b.stateTimer <= 0) {
            b.vx = 0;
            b.comboStep++;
            b.state = 'IDLE';
            b.stateTimer = 0.35;
          }
          break;

        // =====================================================================
        // KRYONA: DESPLAZAMIENTO GLACIAL RÁPIDO (FASE 2)
        // =====================================================================
        case 'GLACIAL_DASH':
          b.x += b.vx * dt;
          b.y = b.groundY;
          if (Math.random() < 0.6) {
            w.particles.push({
              x: b.x + (b.facingRight ? 10 : b.width - 10),
              y: 440 - 6,
              vx: -b.vx * 0.3 + (Math.random() - 0.5) * 40,
              vy: -20 - Math.random() * 40,
              color: '#a5f3fc',
              size: 2.5,
              life: 0.3,
              maxLife: 0.3,
              gravity: 40,
            });
          }
          if (
            (b.vx < 0 && b.x <= b.arenaLeft) ||
            (b.vx > 0 && b.x + b.width >= b.arenaRight) ||
            b.stateTimer <= 0
          ) {
            b.x = clamp(b.arenaLeft, b.x, b.arenaRight - b.width);
            b.vx = 0;
            b.comboStep++;
            b.state = 'VULNERABLE_STUN';
            b.stateTimer = 1.3;
            gameAudio.playJumpLandingThud();
          }
          break;

        // =====================================================================
        // GHOTUR HUMANOIDE: DASHING SOMBRAS & ESTOCADA DESCENDENTE
        // =====================================================================
        case 'SHADOW_DASH':
          b.x += b.vx * dt;
          b.y = b.groundY;

          // Estela espectral de sombras violetas
          if (Math.random() < 0.6) {
            w.particles.push({
              x: b.x + Math.random() * b.width,
              y: b.y + b.height * 0.7,
              vx: -b.vx * 0.2 + (Math.random() - 0.5) * 40,
              vy: -20 - Math.random() * 40,
              color: '#c084fc',
              size: 3,
              life: 0.35,
              maxLife: 0.35,
            });
          }

          // Daño de contacto si embiste a Mouler durante el shadow dash
          if (b.stateTimer < 0.4 && b.stateTimer > 0.1) {
            if (
              p.x < b.x + b.width &&
              p.x + p.width > b.x &&
              p.y < b.y + b.height &&
              p.y + p.height > b.y + 20
            ) {
              handlePlayerDamage(false, 35);
            }
          }

          if (
            (b.vx < 0 && b.x <= b.arenaLeft + 40) ||
            (b.vx > 0 && b.x + b.width >= b.arenaRight - 40) ||
            b.stateTimer <= 0
          ) {
            b.vx = 0;
            b.comboStep++;
            b.state = 'LIGHTNING_THRUST';
            b.stateTimer = 0.35;
            b.facingRight = p.x > b.x + b.width / 2;
            gameAudio.playSwordClash();
          }
          break;

        case 'LIGHTNING_THRUST':
          b.y = b.groundY;
          b.vx = (b.facingRight ? 1 : -1) * (difficultyRef.current === 'DEVIL' ? 260 : 190);

          // RÁFAGA TRIPLE DE TAJOS DE VACÍO OSCUROS (Castiga quedarse a distancia o en el suelo)
          if (b.stateTimer < 0.28 && !b.chargeDidLeap) {
            b.chargeDidLeap = true; // Mark as fired this thrust
            const dirX = b.facingRight ? 1 : -1;
            const originX = b.facingRight ? b.x + b.width + 10 : b.x - 10;
            const originY = b.y + 40;
            const slashSpeed = difficultyRef.current === 'DEVIL' ? 560 : 480;

            [-0.26, 0, 0.26].forEach((ang) => {
              w.projectiles.push({
                id: Date.now() + Math.random(),
                x: originX,
                y: originY,
                vx: dirX * Math.cos(ang) * slashSpeed,
                vy: Math.sin(ang) * slashSpeed * 0.9,
                radius: 13,
                isPlayer: false,
                life: 2.4,
                color: '#c084fc',
                isVoidBurst: true,
                isBomb: true,
                damage: 35,
              });
            });

            gameAudio.playSwordClash();
            gameAudio.playGunshotBlast();
            w.shake = Math.max(w.shake, 9);
            spawnParticles(originX, originY, 18, '#a855f7', 220);
          }

          // Área de impacto de estocada fulgurante cuerpo a cuerpo
          if (b.stateTimer < 0.28 && b.stateTimer > 0.08) {
            const tipX = b.facingRight ? b.x + b.width : b.x - 35;
            if (
              p.x < tipX + 55 &&
              p.x + p.width > tipX &&
              p.y < b.y + b.height &&
              p.y + p.height > b.y + 15
            ) {
              handlePlayerDamage(false, 35);
            }
          }

          if (b.stateTimer <= 0) {
            b.vx = 0;
            b.chargeDidLeap = false;
            b.comboStep++;
            b.state = 'VULNERABLE_STUN';
            b.stateTimer = difficultyRef.current === 'DEVIL' ? 0.75 : 1.0;
          }
          break;

        case 'DESCENDING_THRUST_JUMP':
          b.x += (b.trackTargetX - (b.x + b.width / 2)) * (6 * dt);
          b.y += b.vy * dt;
          b.vy += 1250 * dt;

          if (b.vy >= 0 || b.y <= 110) {
            b.state = 'DESCENDING_THRUST_SLAM';
            b.stateTimer = 0.7;
            b.vy = 880;
            b.vx = 0;
            gameAudio.playGunshotBlast();
            w.shake = 8;
          }
          break;

        case 'DESCENDING_THRUST_SLAM':
          b.y += b.vy * dt;

          // Clava la espada hacia abajo liberando ondas de choque
          if (b.y >= b.groundY) {
            b.y = b.groundY;
            b.vy = 0;
            b.squash = 1.5;
            b.stretch = 0.55;
            w.shake = 22;
            w.lightningFlash = 0.5;
            gameAudio.playJumpLandingThud();
            gameAudio.playChiptuneExplosion();

            spawnParticles(b.x + b.width / 2, b.groundY + b.height, 40, '#c084fc', 320);
            spawnParticles(b.x + b.width / 2, b.groundY + b.height, 25, '#facc15', 240);

            // Dos ondas de choque oscuras
            w.shockwaves.push({
              id: Date.now() + 1,
              x: b.x + b.width / 2,
              y: 440 - 20,
              vx: -280,
              width: 28,
              height: 20,
              life: 2.0,
              maxLife: 2.0,
              color: '#c084fc',
            });
            w.shockwaves.push({
              id: Date.now() + 2,
              x: b.x + b.width / 2,
              y: 440 - 20,
              vx: 280,
              width: 28,
              height: 20,
              life: 2.0,
              maxLife: 2.0,
              color: '#c084fc',
            });

            b.comboStep++;
            b.state = 'VULNERABLE_STUN';
            b.stateTimer = 1.3;
          }
          break;

        // =====================================================================
        // GHOTUR HUMANOIDE (FORMA 1): ATAQUES ELEMENTALES & PODER SUPREMO
        // =====================================================================
        case 'DUAL_ELEMENT_PREP':
          b.vx = 0;
          b.y = b.groundY;
          b.facingRight = p.x > b.x + b.width / 2;
          b.telegraphGlow = clamp(1 - b.stateTimer / 0.45, 0, 1);

          // Partículas duales convergentes (fuego a la izquierda, hielo a la derecha)
          if (Math.random() < 0.5) {
            const bx = b.x + b.width / 2;
            const by = b.y + 40;
            w.particles.push({
              x: bx - 25 + (Math.random() - 0.5) * 20,
              y: by + (Math.random() - 0.5) * 20,
              vx: (Math.random() - 0.5) * 30,
              vy: -20 - Math.random() * 30,
              color: '#f97316',
              size: 2.5,
              life: 0.25,
              maxLife: 0.25,
            });
            w.particles.push({
              x: bx + 25 + (Math.random() - 0.5) * 20,
              y: by + (Math.random() - 0.5) * 20,
              vx: (Math.random() - 0.5) * 30,
              vy: -20 - Math.random() * 30,
              color: '#38bdf8',
              size: 2.5,
              life: 0.25,
              maxLife: 0.25,
            });
          }

          if (b.stateTimer <= 0) {
            b.state = 'DUAL_ELEMENT_SHOOT';
            b.stateTimer = 0.45;
            const dirX = b.facingRight ? 1 : -1;
            const originX = b.facingRight ? b.x + b.width : b.x;
            const originY = b.y + 45;
            const speed = b.phase === 2 ? 540 : 460;

            // Esfera de Fuego de Magma
            w.projectiles.push({
              id: Date.now() + 1,
              x: originX,
              y: originY - 14,
              vx: dirX * speed,
              vy: -40,
              radius: 12,
              isPlayer: false,
              life: 2.5,
              color: '#f97316',
              isBomb: true,
              damage: 35,
            });

            // Esfera de Escarcha Glacial
            w.projectiles.push({
              id: Date.now() + 2,
              x: originX,
              y: originY + 14,
              vx: dirX * (speed * 0.95),
              vy: 40,
              radius: 11,
              isPlayer: false,
              life: 2.5,
              color: '#38bdf8',
              isIcePrism: true,
              damage: 35,
            });

            gameAudio.playArcadeLaser();
            gameAudio.playGunshotBlast();
            w.shake = 10;
          }
          break;

        case 'DUAL_ELEMENT_SHOOT':
          b.vx = 0;
          b.y = b.groundY;
          if (b.stateTimer <= 0) {
            b.comboStep++;
            b.state = 'IDLE';
            b.stateTimer = 0.3;
          }
          break;

        case 'ELEGANT_SLASH':
        case 'SWORD_COMBO':
          b.y = b.groundY;
          b.vx = (b.facingRight ? 1 : -1) * 120;
          // Área de impacto de espada noble
          if (b.stateTimer < 0.5 && b.stateTimer > 0.2) {
            const slashX = b.facingRight ? b.x + b.width : b.x - 30;
            if (
              p.x < slashX + 50 &&
              p.x + p.width > slashX &&
              p.y < b.y + b.height &&
              p.y + p.height > b.y + 20
            ) {
              handlePlayerDamage(false, 35);
            }
          }
          if (b.stateTimer <= 0) {
            b.vx = 0;
            b.comboStep++;
            b.state = 'VULNERABLE_STUN';
            b.stateTimer = 1.3;
            gameAudio.playSwordClash();
          }
          break;

        case 'LEVITATE':
          b.vx = 0;
          b.y += (180 - b.y) * (8 * dt);
          if (Math.abs(b.y - 180) < 15 || b.stateTimer <= 0) {
            b.y = 180;
            b.state = 'SUPREME_POWER';
            b.stateTimer = 0.8;
            b.combinedPowerStep = 0;
            b.cascadeTimer = 0;
            gameAudio.playPowerupChime();
            w.shake = 12;
          }
          break;

        case 'SUPREME_POWER':
          b.vx = 0;
          b.y = 180 + Math.sin(Date.now() * 0.006) * 8;
          b.telegraphGlow = 1;
          b.cascadeTimer = (b.cascadeTimer || 0) + dt;

          // Canaliza los 4 poderes elementales combinados
          if (b.cascadeTimer >= 0.16 && (b.combinedPowerStep || 0) < 4) {
            b.cascadeTimer = 0;
            b.combinedPowerStep = (b.combinedPowerStep || 0) + 1;
            const ox = b.x + b.width / 2;
            const oy = b.y + 50;
            const targetX = p.x + p.width / 2;
            const targetY = p.y + p.height / 2;
            const aimAngle = Math.atan2(targetY - oy, targetX - ox);

            if (b.combinedPowerStep === 1) {
              // 1. Jabalina eléctrica del Asura
              w.projectiles.push({
                id: Date.now() + Math.random(),
                x: ox,
                y: oy,
                vx: Math.cos(aimAngle) * 580,
                vy: Math.sin(aimAngle) * 580,
                radius: 10,
                isPlayer: false,
                life: 2.2,
                color: '#facc15',
                damage: 35,
              });
              gameAudio.playArcadeLaser();
            } else if (b.combinedPowerStep === 2) {
              // 2. Ráfagas de fuego del Dragón
              [-0.2, 0.2].forEach((ang) => {
                w.projectiles.push({
                  id: Date.now() + Math.random(),
                  x: ox,
                  y: oy,
                  vx: Math.cos(aimAngle + ang) * 520,
                  vy: Math.sin(aimAngle + ang) * 520,
                  radius: 12,
                  isPlayer: false,
                  life: 2.2,
                  color: '#f97316',
                  isBomb: true,
                  damage: 35,
                });
              });
              gameAudio.playGunshotBlast();
            } else if (b.combinedPowerStep === 3) {
              // 3. Cristales de hielo de Kryona
              [-0.25, 0, 0.25].forEach((ang) => {
                w.projectiles.push({
                  id: Date.now() + Math.random(),
                  x: ox,
                  y: oy,
                  vx: Math.cos(aimAngle + ang) * 500,
                  vy: Math.sin(aimAngle + ang) * 500,
                  radius: 9,
                  isPlayer: false,
                  life: 2.5,
                  color: '#a5f3fc',
                  isIcePrism: true,
                  damage: 30,
                });
              });
              gameAudio.playSwordClash();
            } else {
              // 4. Rayo oscuro de las Sombras
              w.projectiles.push({
                id: Date.now() + Math.random(),
                x: ox,
                y: oy,
                vx: Math.cos(aimAngle) * 600,
                vy: Math.sin(aimAngle) * 600,
                radius: 14,
                isPlayer: false,
                life: 2.5,
                color: '#c084fc',
                isVoidBurst: true,
                damage: 40,
              });
              gameAudio.playChiptuneExplosion();
            }
            w.shake = 10;
          }

          if (b.stateTimer <= 0) {
            b.state = 'COMBINED_BURST';
            b.stateTimer = 0.4;
          }
          break;

        case 'COMBINED_BURST':
          b.vx = 0;
          b.y += (b.groundY - b.y) * (8 * dt);
          if (b.y >= b.groundY - 10 || b.stateTimer <= 0) {
            b.y = b.groundY;
            b.comboStep++;
            b.state = 'VULNERABLE_STUN';
            b.stateTimer = 1.3;
          }
          break;

        // Derrota / Transición de Fase 1 (Ghotur Humanoide)
        case 'DESPERATION':
          b.vx = 0;
          b.vy = 0;
          b.y = b.groundY;
          w.shake = Math.max(w.shake, 14);

          if (b.stateTimer <= 0) {
            b.isDefeated = true;
            (b as any).isDead = true;
            b.state = 'DEAD';
            startWalkingTransition(
              19,
              'Fase 5-FINAL: El Núcleo Colapsado',
              'Ghotur desata su descomunal forma titánica definitiva',
            );
          }
          break;

        // =====================================================================
        // GHOTUR DEMON: PASO MARCIAL PESADO (WALK) ACECHANDO CON TRIDENTE
        // =====================================================================
        case 'TRIDENT_MARCH':
          b.y = b.groundY;
          b.facingRight = p.x > b.x + b.width / 2;
          b.x += b.vx * dt;

          // Chispas de fuego oscuro bajo sus pisadas pesadas
          if (Math.random() < 0.45) {
            w.particles.push({
              x: b.x + (b.facingRight ? 30 : b.width - 30),
              y: 440 - 6,
              vx: (Math.random() - 0.5) * 40,
              vy: -15 - Math.random() * 30,
              color: '#ef4444',
              size: 2.5,
              life: 0.3,
              maxLife: 0.3,
            });
          }

          if (
            Math.abs(b.x + b.width / 2 - (p.x + p.width / 2)) < 160 ||
            b.stateTimer <= 0
          ) {
            b.vx = 0;
            b.state = 'TRIDENT_THRUST_PREP';
            b.stateTimer = 0.3;
            gameAudio.playSwordClash();
          }
          break;

        // =====================================================================
        // GHOTUR DEMON: CARGA DE TRIDENTE (RUN / SWORD_ATTACK) CON ESTELA OSCURA
        // =====================================================================
        case 'TRIDENT_CHARGE_PREP':
          b.vx = 0;
          b.y = b.groundY;
          b.facingRight = p.x > b.x + b.width / 2;
          b.telegraphGlow = clamp(1 - b.stateTimer / 0.4, 0, 1);
          if (b.stateTimer <= 0) {
            b.state = 'TRIDENT_CHARGE_RUSH';
            b.stateTimer = 0.65;
            const dir = b.facingRight ? 1 : -1;
            b.vx = dir * (b.phase === 2 ? 650 : 540);
            gameAudio.playArcadeLaser();
            gameAudio.playGunshotBlast();
            w.shake = 10;
          }
          break;

        case 'TRIDENT_CHARGE_RUSH':
          b.x += b.vx * dt;
          b.y = b.groundY;

          // Estela de fuego oscuro y brasas ardientes
          for (let s = 0; s < 3; s++) {
            w.particles.push({
              x: b.x + Math.random() * b.width,
              y: b.y + Math.random() * b.height,
              vx: -b.vx * 0.2 + (Math.random() - 0.5) * 50,
              vy: -20 - Math.random() * 50,
              color: Math.random() > 0.4 ? '#ef4444' : '#f97316',
              size: 3.5,
              life: 0.35,
              maxLife: 0.35,
            });
          }

          // Daño de contacto si la punta del tridente impacta a Mouler
          if (b.stateTimer < 0.55 && b.stateTimer > 0.1) {
            const tipX = b.facingRight ? b.x + b.width - 20 : b.x - 30;
            if (
              p.x < tipX + 60 &&
              p.x + p.width > tipX &&
              p.y < b.y + b.height &&
              p.y + p.height > b.y + 15
            ) {
              handlePlayerDamage(false, 40);
            }
          }

          if (
            (b.vx < 0 && b.x <= b.arenaLeft + 40) ||
            (b.vx > 0 && b.x + b.width >= b.arenaRight - 40) ||
            b.stateTimer <= 0
          ) {
            b.vx = 0;
            b.comboStep++;
            b.state = 'TRIDENT_SWEEP_PREP';
            b.stateTimer = 0.35;
            b.facingRight = p.x > b.x + b.width / 2;
            gameAudio.playSwordClash();
          }
          break;

        // =====================================================================
        // GHOTUR DEMON: INVOCACIÓN CON TRIDENTE (SHOOT) - RAYOS OSCUROS
        // =====================================================================
        case 'TRIDENT_LIGHTNING_PREP':
          b.vx = 0;
          b.y = b.groundY;
          b.facingRight = p.x > b.x + b.width / 2;
          b.telegraphGlow = 1;

          // Chispas ascendiendo por las 3 puntas del Tridente
          if (Math.random() < 0.6) {
            const tridentX = b.facingRight ? b.x + b.width - 30 : b.x + 30;
            w.particles.push({
              x: tridentX + (Math.random() - 0.5) * 30,
              y: b.y + 20,
              vx: (Math.random() - 0.5) * 40,
              vy: -60 - Math.random() * 60,
              color: '#facc15',
              size: 3,
              life: 0.3,
              maxLife: 0.3,
            });
          }

          if (b.stateTimer <= 0) {
            b.state = 'TRIDENT_LIGHTNING';
            b.stateTimer = 0.5;
            gameAudio.playGunshotBlast();
            w.shake = 16;
          }
          break;

        case 'TRIDENT_LIGHTNING':
          b.vx = 0;
          b.y = b.groundY;
          if (b.stateTimer <= 0) {
            b.comboStep++;
            b.state = 'VULNERABLE_STUN';
            b.stateTimer = 1.3;
          }
          break;

        // =====================================================================
        // GHOTUR DEMON (FASE 5-FINAL): EXCLUSIVO TRIDENTE DEL VACÍO (TRISHULA)
        // Cero armas de fuego, cero cambios de arma: puro tridente demoníaco
        // =====================================================================
        case 'TRIDENT_THRUST_PREP':
          b.vx = 0;
          b.y = b.groundY;
          b.facingRight = p.x > b.x + b.width / 2;
          b.telegraphGlow = clamp(1 - b.stateTimer / 0.45, 0, 1);
          if (b.stateTimer <= 0) {
            b.state = 'TRIDENT_THRUST';
            b.stateTimer = 0.6;
            const dir = b.facingRight ? 1 : -1;
            b.vx = dir * 280;
            const originX = b.facingRight ? b.x + b.width : b.x;

            // Triple-crested demonic shockwave across the ground
            w.shockwaves.push({
              id: Date.now() + Math.random(),
              x: originX,
              y: 440 - 24,
              vx: dir * 320,
              width: 32,
              height: 24,
              life: 2.2,
              maxLife: 2.2,
              color: '#ef4444',
            });

            // Mid-height trident piercing spear
            w.projectiles.push({
              id: Date.now() + Math.random(),
              x: originX,
              y: 440 - 45,
              vx: dir * 420,
              vy: 0,
              radius: 12,
              isPlayer: false,
              life: 2.0,
              color: '#facc15',
              damage: 35,
            });

            gameAudio.playSwordClash();
            gameAudio.playArcadeLaser();
            w.shake = 10;
          }
          break;

        case 'TRIDENT_THRUST':
          b.y = b.groundY;
          b.vx *= 0.94;
          // Contact damage with the trident thrust tip
          if (b.stateTimer < 0.45 && b.stateTimer > 0.15) {
            const tipX = b.facingRight ? b.x + b.width : b.x - 40;
            if (
              p.x < tipX + 60 &&
              p.x + p.width > tipX &&
              p.y < b.y + b.height &&
              p.y + p.height > b.y + 20
            ) {
              handlePlayerDamage(false, 35);
            }
          }
          if (b.stateTimer <= 0) {
            b.vx = 0;
            b.comboStep++;
            b.state = 'VULNERABLE_STUN';
            b.stateTimer = 1.3;
          }
          break;

        case 'TRIDENT_SWEEP_PREP':
          b.vx = 0;
          b.y = b.groundY;
          b.facingRight = p.x > b.x + b.width / 2;
          b.telegraphGlow = clamp(1 - b.stateTimer / 0.4, 0, 1);
          if (b.stateTimer <= 0) {
            b.state = 'TRIDENT_SWEEP';
            b.stateTimer = 0.55;
            const dir = b.facingRight ? 1 : -1;
            b.vx = dir * 200;
            gameAudio.playSwordClash();
            w.shake = 8;
          }
          break;

        case 'TRIDENT_SWEEP':
          b.y = b.groundY;
          b.vx *= 0.92;
          if (b.stateTimer < 0.45 && b.stateTimer > 0.1) {
            const sweepX = b.facingRight ? b.x + b.width : b.x - 50;
            if (
              p.x < sweepX + 70 &&
              p.x + p.width > sweepX &&
              p.y < b.y + b.height &&
              p.y + p.height > b.y + 15
            ) {
              handlePlayerDamage(false, 35);
            }
          }
          if (b.stateTimer <= 0) {
            b.vx = 0;
            b.comboStep++;
            b.state = 'IDLE';
            b.stateTimer = 0.3;
          }
          break;

        case 'TRIDENT_MAGIC_PREP':
          b.vx = 0;
          b.y = b.groundY;
          b.facingRight = p.x > b.x + b.width / 2;
          b.telegraphGlow = clamp(1 - b.stateTimer / 0.5, 0, 1);
          if (b.stateTimer <= 0) {
            b.state = 'TRIDENT_MAGIC';
            b.stateTimer = 0.8;
            b.cascadeTimer = 0;

            // Ghotur raises Trident aloft! Conjures 3 or 5 fire spears directly from the 3 prongs
            const prongOriginX = b.facingRight ? b.x + b.width * 0.65 : b.x + b.width * 0.35;
            const prongOriginY = b.y + 20;
            const spearCount = b.phase === 2 ? 5 : 3;
            const baseDir = b.facingRight ? 1 : -1;
            const angles = spearCount === 5 ? [-0.5, -0.25, 0, 0.25, 0.5] : [-0.35, 0, 0.35];

            for (const ang of angles) {
              const spd = 480;
              w.projectiles.push({
                id: Date.now() + Math.random(),
                x: prongOriginX,
                y: prongOriginY,
                vx: baseDir * Math.cos(ang) * spd,
                vy: Math.sin(ang) * spd * 0.7,
                radius: 12,
                isPlayer: false,
                life: 2.4,
                color: Math.abs(ang) < 0.1 ? '#facc15' : '#ef4444',
                isBomb: true,
                damage: 35,
              });
            }

            // In Phase 2: Call down 3 columns of trident lightning from the skies
            if (b.phase === 2) {
              const points = [200, 480, 760];
              b.lightningPillars = points.map((px) => ({
                x: px + (Math.random() - 0.5) * 60,
                timer: 0.45,
                struck: false,
                width: 65,
              }));
            }

            gameAudio.playArcadeLaser();
            gameAudio.playChiptuneExplosion();
            w.shake = 12;
          }
          break;

        case 'TRIDENT_MAGIC':
          b.vx = 0;
          b.y = b.groundY;
          if (b.stateTimer <= 0) {
            b.comboStep++;
            b.state = 'VULNERABLE_STUN';
            b.stateTimer = 1.3;
          }
          break;

        case 'TRIDENT_SLAM_JUMP':
          b.x += (b.trackTargetX - (b.x + b.width / 2)) * (6 * dt);
          b.y += b.vy * dt;
          b.vy += 1250 * dt;

          if (b.vy >= 0 || b.y <= 90) {
            b.state = 'TRIDENT_SLAM_DIVE';
            b.stateTimer = 0.7;
            b.vy = 900;
            b.vx = 0;
            gameAudio.playRetroJump();
            w.shake = 8;
          }
          break;

        case 'TRIDENT_SLAM_DIVE':
          b.y += b.vy * dt;

          // Drives the Demon Trident deep into the ground
          if (b.y >= b.groundY) {
            b.y = b.groundY;
            b.vy = 0;
            b.squash = 1.6;
            b.stretch = 0.5;
            w.shake = 32;
            w.lightningFlash = 0.6;
            gameAudio.playJumpLandingThud();
            gameAudio.playChiptuneExplosion();

            spawnParticles(b.x + b.width / 2, b.groundY + b.height, 50, '#ef4444', 360);
            spawnParticles(b.x + b.width / 2, b.groundY + b.height, 35, '#facc15', 300);

            // Generates two massive crimson trident shockwaves splitting across the floor
            w.shockwaves.push({
              id: Date.now() + 1,
              x: b.x + b.width / 2,
              y: 440 - 24,
              vx: -300,
              width: 32,
              height: 24,
              life: 2.0,
              maxLife: 2.0,
              color: '#ef4444',
            });
            w.shockwaves.push({
              id: Date.now() + 2,
              x: b.x + b.width / 2,
              y: 440 - 24,
              vx: 300,
              width: 32,
              height: 24,
              life: 2.0,
              maxLife: 2.0,
              color: '#ef4444',
            });

            b.comboStep++;
            b.state = 'VULNERABLE_STUN';
            b.stateTimer = 1.4;
          }
          break;

        case 'TRIDENT_LEVITATE':
          b.vx = 0;
          b.y += (160 - b.y) * (8 * dt);
          b.telegraphGlow = 1;
          if (b.stateTimer <= 0) {
            b.state = 'TRIDENT_MAGIC_PREP';
            b.stateTimer = 0.3;
          }
          break;

        // =====================================================================
        // VENTANA DE DAÑO TÁCTICA: EXACTAMENTE 1.4S (DRAGÓN) / 1.0S (QUIMERA)
        // =====================================================================
        case 'VULNERABLE_STUN':
          b.vx = 0;
          b.vy = 0;
          b.y = b.groundY;

          // Dragón sobrecalentado: humareda volcánica y jadeo
          if (b.type === 'DRAGON' && Math.random() < 0.4) {
            const snoutX = b.facingRight ? b.x + b.width - 20 : b.x + 20;
            w.particles.push({
              x: snoutX + (Math.random() - 0.5) * 16,
              y: b.y + 36,
              vx: (Math.random() - 0.5) * 30,
              vy: -40 - Math.random() * 40,
              color: 'rgba(203, 213, 225, 0.7)',
              size: 2.5 + Math.random() * 2,
              life: 0.35,
              maxLife: 0.35,
            });
          }

          if (b.stateTimer <= 0) {
            b.state = 'IDLE';
            b.stateTimer = 0.3;
          }
          break;

        case 'DEFENSIVE_PULSE':
          b.vx = 0;
          if (b.stateTimer <= 0) {
            b.state = 'IDLE';
            b.stateTimer = 0.3;
          }
          break;

        case 'DYING':
          b.vx = 0;
          b.vy = 0;
          b.y = b.groundY;
          b.isDefeated = true;
          (b as any).isDead = true;

          // Pure, undisturbed death animation playback - no generic particle sparks covering up the falling boss!
          if (b.stateTimer <= 0) {
            b.state = 'DEAD';
            b.isDefeated = true;
            (b as any).isDead = true;
            w.shake = 16;

            if (b.type === 'GHOTUR_DEMON') {
              // Final Boss defeated -> Trigger the grand Epilogue sequence!
              transitionToScene('SCENE_EPILOGUE', () => {
                setEpilogueSlide(0);
                gameAudio.playVictoryFanfare();
              });
              return;
            }

            if (b.type === 'GHOTUR_HUMANOID') {
              // Humanoid Ghotur defeated -> Automatic transition to Demon Titan form (Level 19)
              startWalkingTransition(
                19,
                'Fase 5-FINAL: El Núcleo Colapsado',
                'Ghotur desata su descomunal forma titánica definitiva',
              );
              return;
            }

            // Bosses 1 to 4: Trigger dedicated full-screen post-boss showcase
            const fragNum =
              b.type === 'FROST_EMPRESS'
                ? 4
                : b.type === 'CELESTIAL_DEITY'
                ? 3
                : b.type === 'DRAGON'
                ? 2
                : 1;
            const nextLvl: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 =
              fragNum === 4 ? 17 : fragNum === 3 ? 13 : fragNum === 2 ? 9 : 5;

            triggerBossDefeatedCinematic(b, fragNum, nextLvl);
          }
          break;
      }

      // Check Player vs Boss Collision
      // En VULNERABLE_STUN el jefe es 100% inofensivo al contacto (permite pisar su cabeza/cuello sin peligro)
      if (
        b.state !== 'DYING' &&
        b.state !== 'DEAD' &&
        b.state !== 'CINEMATIC_SUMMON' &&
        b.state !== 'INTRO_ROAR' &&
        b.state !== 'INTRO_HP_FILL'
      ) {
        // Hitbox ajustado sin colisiones fantasma
        const bHitX = b.x + 10;
        const bHitW = b.width - 20;
        const bHitY = b.y + 10;
        const bHitH = b.height - 10;

        if (
          p.x < bHitX + bHitW &&
          p.x + p.width > bHitX &&
          p.y < bHitY + bHitH &&
          p.y + p.height > bHitY
        ) {
          const isStomping =
            p.vy > 40 &&
            p.y + p.height <= bHitY + 44 &&
            b.state !== 'METEOR_DIVE' &&
            b.state !== 'DRAGON_DIVE' &&
            b.state !== 'DEITY_PLUNGE_DIVE' &&
            b.state !== 'TRIDENT_SLAM_DIVE' &&
            b.state !== 'BEHEMOTH_STOMP_SLAM' &&
            b.hurtTimer <= 0;

          if (isStomping) {
            if (b.type === 'CELESTIAL_DEITY' && b.phase === 1 && b.shieldActive) {
              gameAudio.playShieldBlock();
              p.vy = -baseJump * 1.1;
            } else {
              const stompDmg = b.state === 'VULNERABLE_STUN' ? 160 : 80;
              damageBoss(stompDmg, 'PLAYER_STOMP');
              p.vy = jumpPressed ? -baseJump * 1.25 : -baseJump * 1.05;
              p.jumpCount = 1;
            }
          } else if ((p.titanTimer > 0 || p.isDashing) && b.hurtTimer <= 0) {
            const tackleDmg = p.titanTimer > 0 ? 80 : 50;
            damageBoss(tackleDmg, 'TITAN_TACKLE');
            p.vx = (p.x < b.x ? -1 : 1) * 240;
          } else if (b.state !== 'VULNERABLE_STUN') {
            // El jugador solo recibe daño si toca al jefe durante sus ataques activos
            handlePlayerDamage();
          }
        }
      }
    }

    // -------------------------------------------------------------------------
    // ITEMS SIMULATION
    // -------------------------------------------------------------------------
    for (const item of w.items) {
      if (!item || item.collected) continue;
      if (item.vy !== 0) {
        item.y += item.vy * dt;
        item.vy += 450 * dt;
        if (item.vy > 0) item.vy = 0;
      }

      if (
        p.x < item.x + 36 &&
        p.x + p.width > item.x &&
        p.y < item.y + 36 &&
        p.y + p.height > item.y
      ) {
        item.collected = true;

        if (item.type === 'crystal') {
          gameAudio.playCoinPickup();
          spawnParticles(item.x, item.y, 8, THEME.neonCyan, 120);
          setCrystalsCount((c) => {
            const next = c + 1;
            if (next >= 100) {
              gameAudio.playLevelUpStinger();
              const nextL = Math.min(20, ((typeof w.lives === 'number' ? w.lives : gameStateRef.current.lives) ?? 15) + 1);
              w.lives = nextL;
              setGameState((s) => ({
                ...s,
                lives: nextL,
                score: s.score + 500,
              }));
              return next - 100;
            }
            return next;
          });
          const sMult = difficultyRef.current === 'DEVIL' ? 3 : 1;
          setGameState((s) => ({
            ...s,
            score: s.score + (getConfig('scorePerCrystal') as number) * sMult,
          }));
        } else if (item.type === 'resonant_core') {
          gameAudio.playPowerupChime();
          w.shake = 12;
          p.titanTimer = getConfig('titanDuration') as number;
          p.width = 44;
          p.height = p.isCrouching ? 32 : 58;
          p.y -= 14;
          setActiveForm('TITAN');
          spawnParticles(item.x, item.y, 25, '#c084fc', 260);
          setGameState((s) => ({...s, score: s.score + 500 * (difficultyRef.current === 'DEVIL' ? 3 : 1)}));
        } else if (item.type === 'storm_needle') {
          gameAudio.playPowerupChime();
          p.needleTimer = 45;
          setHasThunderShot(true);
          spawnParticles(item.x, item.y, 25, '#fbbf24', 220);
          setGameState((s) => ({...s, score: s.score + 400 * (difficultyRef.current === 'DEVIL' ? 3 : 1)}));
        } else if (item.type === 'ion_overdrive') {
          gameAudio.playLevelUpStinger();
          p.ionTimer = getConfig('invincibilityDuration') as number;
          spawnParticles(item.x, item.y, 25, '#fef08a', 280);
          setGameState((s) => ({...s, score: s.score + 500 * (difficultyRef.current === 'DEVIL' ? 3 : 1)}));
        } else if (item.type === 'heart_1up' || item.type === 'heart_hp') {
          gameAudio.playLevelUpStinger();
          w.shake = 10;
          const nextL = Math.min(20, ((typeof w.lives === 'number' ? w.lives : gameStateRef.current.lives) ?? 15) + 1);
          w.lives = nextL;
          setGameState((s) => ({
            ...s,
            lives: nextL,
            score: s.score + 1000 * (difficultyRef.current === 'DEVIL' ? 3 : 1),
          }));
          spawnParticles(item.x, item.y, 25, '#ef4444', 220);
          spawnParticles(item.x, item.y, 18, '#fbbf24', 180);
        }
      }
    }

    // -------------------------------------------------------------------------
    // ADVERSARIES SIMULATION
    // -------------------------------------------------------------------------
    // Void Fire Puddles simulation (Corrupted Beetles trail)
    for (let i = w.voidFirePuddles.length - 1; i >= 0; i--) {
      const vfp = w.voidFirePuddles[i];
      if (!vfp) {
        w.voidFirePuddles.splice(i, 1);
        continue;
      }
      vfp.life -= dt;
      if (vfp.life <= 0) {
        w.voidFirePuddles.splice(i, 1);
        continue;
      }
      if (Math.random() < 0.3) {
        w.particles.push({
          x: vfp.x + Math.random() * vfp.width,
          y: vfp.y,
          vx: (Math.random() - 0.5) * 35,
          vy: -15 - Math.random() * 35,
          color: Math.random() > 0.4 ? '#e11d48' : '#a855f7',
          size: 2.5,
          life: 0.25,
          maxLife: 0.3,
          gravity: -20,
        });
      }
      if (
        p.isGrounded &&
        p.x + p.width > vfp.x &&
        p.x < vfp.x + vfp.width &&
        Math.abs(p.y + p.height - vfp.y) < 14
      ) {
        handlePlayerDamage();
      }
    }

    for (const enemy of w.enemies) {
      if (!enemy || !enemy.alive) continue;

      // Partículas de corrupción del abismo para entidades del abismo
      if (enemy.isCorrupted && Math.random() < 0.3) {
        w.particles.push({
          x: enemy.x + Math.random() * enemy.width,
          y: enemy.y + Math.random() * enemy.height,
          vx: (Math.random() - 0.5) * 30,
          vy: -15 - Math.random() * 30,
          color: Math.random() > 0.4 ? '#e11d48' : '#a855f7',
          size: 2.2,
          life: 0.25,
          maxLife: 0.25,
          gravity: -20,
        });
      }

      // -----------------------------------------------------------------------
      // NUEVO ENEMIGO EXCLUSIVO: LAS SOMBRAS DEL ABISMO (mob_abyssal_shadow)
      // Lore: Exclusivo de Zona 5 (El Infierno Abisal de Ghotur) & Forma 1 de Ghotur
      // -----------------------------------------------------------------------
      if (enemy.type === 'abyssal_shadow') {
        enemy.animTime = (enemy.animTime || 0) + dt;

        if (!enemy.emerged) {
          // Slumbering in dark pool
          const distToP = Math.hypot(
            p.x + p.width / 2 - (enemy.x + enemy.width / 2),
            p.y + p.height / 2 - (enemy.y + enemy.height / 2),
          );
          if (distToP < 160) {
            enemy.emerged = true;
            enemy.emergeTimer = 0.45;
            gameAudio.playArcadeLaser();
            gameAudio.playSwordClash();
            w.shake = Math.max(w.shake, 7);
            spawnParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 22, '#a855f7', 220);
            spawnParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 16, '#e11d48', 180);
          }
          continue; // Cannot attack or be stomped while slumbering
        }

        if (enemy.emergeTimer && enemy.emergeTimer > 0) {
          enemy.emergeTimer -= dt;
        }

        enemy.facingRight = p.x > enemy.x;

        // 1. MOVIMIENTO FANTASMAL CAÓTICO Y FLOTANTE (Sinusoidal, parabólico, y deslizamientos)
        const t = enemy.animTime;
        const v = enemy.shadowVariant || 'SPECTER';

        if (v === 'MINI') {
          // Diminuta errática: vuela y zigzaguea velozmente en arcos altos
          enemy.y = enemy.initialY - 50 + Math.sin(t * 4.5 + enemy.id) * 45 + Math.cos(t * 2.2) * 25;
          enemy.x += (enemy.facingRight ? 1 : -1) * (140 + Math.sin(t * 3) * 40) * dt;
        } else if (v === 'SPECTER') {
          // Esbelta y alargada: ultra rápida, oscilaciones espectrales verticales y deslizamientos
          enemy.y = enemy.initialY - 40 + Math.sin(t * 3.0 + enemy.id) * 35;
          enemy.x += (enemy.facingRight ? 1 : -1) * 115 * dt;
        } else if (v === 'WRAITH') {
          // Colosal: masa pesada que flota majestuosamente en trayectorias parabólicas lentas
          enemy.y = enemy.initialY - 30 + Math.sin(t * 1.6 + enemy.id) * 30;
          enemy.x += (enemy.facingRight ? 1 : -1) * 65 * dt;
        } else {
          // Lurker (obesa/ancha): flota a media altura con descensos abruptos al suelo
          const swoopCycle = Math.sin(t * 2.0 + enemy.id);
          enemy.y = enemy.initialY - 20 + swoopCycle * 35;
          enemy.x += (enemy.facingRight ? 1 : -1) * 75 * dt;
        }

        // Clamp inside bounds
        enemy.x = clamp(enemy.x, 30, w.levelWidth - enemy.width - 30);

        // Estela continua de brasas de sombra al flotar
        if (Math.random() < 0.35) {
          w.particles.push({
            x: enemy.x + Math.random() * enemy.width,
            y: enemy.y + Math.random() * enemy.height,
            vx: (Math.random() - 0.5) * 35,
            vy: (Math.random() - 0.5) * 35,
            color: Math.random() > 0.5 ? '#9333ea' : '#e11d48',
            size: 2.2,
            life: 0.28,
            maxLife: 0.3,
            gravity: -10,
          });
        }

        // Deslizamiento fantasmal rápido / reposicionamiento espectral
        enemy.teleportTimer = (enemy.teleportTimer ?? 3.5) - dt;
        if (enemy.teleportTimer <= 0) {
          enemy.teleportTimer = 3.0 + Math.random() * 1.5;
          const oldX = enemy.x;
          const oldY = enemy.y;
          const offset = (Math.random() > 0.5 ? 1 : -1) * (180 + Math.random() * 140);
          const newX = clamp(p.x + offset, 80, w.levelWidth - enemy.width - 80);

          spawnParticles(oldX + enemy.width / 2, oldY + enemy.height / 2, 20, '#a855f7', 220);
          enemy.x = newX;
          spawnParticles(newX + enemy.width / 2, enemy.y + enemy.height / 2, 20, '#e11d48', 220);
          gameAudio.playHoverMicroTone();
        }

        // 2. DISPAROS CAÓTICOS DE ESFERAS DE ENERGÍA OSCURA (⚫/🟣) EN ARCOS IMPREDECIBLES
        enemy.shootTimer = (enemy.shootTimer ?? 1.5) - dt;
        if (enemy.shootTimer <= 0) {
          enemy.shootTimer = (v === 'MINI' ? 1.0 : v === 'SPECTER' ? 1.4 : 1.8) + Math.random() * 0.8;
          const originX = enemy.x + enemy.width / 2;
          const originY = enemy.y + enemy.height * 0.45;
          const targetX = p.x + p.width / 2;
          const targetY = p.y + p.height / 2;
          const baseAngle = Math.atan2(targetY - originY, targetX - originX);
          const burstCount = v === 'WRAITH' ? 3 : v === 'LURKER' ? 3 : 2;
          const shotSpeed = v === 'MINI' ? 460 : v === 'SPECTER' ? 420 : 380;
          const burstRad = v === 'WRAITH' ? 15 : v === 'LURKER' ? 13 : v === 'MINI' ? 8 : 11;

          // Ráfaga caótica en abanico impredecible
          for (let bIdx = 0; bIdx < burstCount; bIdx++) {
            const spread = (bIdx - (burstCount - 1) / 2) * (0.24 + Math.random() * 0.1);
            const ang = baseAngle + spread;
            const finalSpd = shotSpeed * (0.9 + Math.random() * 0.25);

            w.projectiles.push({
              id: Date.now() + Math.random(),
              x: originX,
              y: originY,
              vx: Math.cos(ang) * finalSpd,
              vy: Math.sin(ang) * finalSpd,
              radius: burstRad,
              isPlayer: false,
              life: 3.0,
              color: bIdx % 2 === 0 ? '#9333ea' : '#e11d48',
              isVoidBurst: true,
              isBomb: true,
              damage: v === 'WRAITH' ? 45 : 35,
            });
          }

          gameAudio.playGunshotBlast();
          spawnParticles(originX, originY, 14, '#a855f7', 180);
        }
      }

      // Partículas heladas emanando de las especies glaciales evolucionadas
      if (enemy.isFrostVariant && Math.random() < 0.22) {
        w.particles.push({
          x: enemy.x + Math.random() * enemy.width,
          y: enemy.y + Math.random() * enemy.height,
          vx: (Math.random() - 0.5) * 24,
          vy: -15 - Math.random() * 25,
          color: Math.random() > 0.4 ? '#a5f3fc' : '#38bdf8',
          size: 2,
          life: 0.25,
          maxLife: 0.25,
          gravity: -20,
        });
      }

      if (enemy.type === 'crawler') {
        enemy.x += enemy.vx * dt;
        if (enemy.minX !== undefined && enemy.x < enemy.minX) {
          enemy.vx = Math.abs(enemy.vx);
          enemy.facingRight = true;
        } else if (enemy.maxX !== undefined && enemy.x > enemy.maxX) {
          enemy.vx = -Math.abs(enemy.vx);
          enemy.facingRight = false;
        }

        // Devil Mode: All crawlers fire ranged dark energy daggers!
        if (difficultyRef.current === 'DEVIL') {
          enemy.shootTimer = (enemy.shootTimer ?? 2.5) - dt;
          if (enemy.shootTimer <= 0) {
            enemy.shootTimer = 2.4 + Math.random() * 1.2;
            const dirX = enemy.facingRight ? 1 : -1;
            w.projectiles.push({
              id: Date.now() + Math.random(),
              x: enemy.x + (dirX > 0 ? enemy.width + 4 : -4),
              y: enemy.y + 16,
              vx: dirX * 360,
              vy: 0,
              radius: 7,
              isPlayer: false,
              life: 2.5,
              color: enemy.isCorrupted ? '#e11d48' : '#a855f7',
              damage: 25,
            });
            gameAudio.playArcadeLaser();
          }
        }

        // Corrupted Beetles leave trails of void fire that burn the floor
        if (enemy.isCorrupted) {
          enemy.voidTrailTimer = (enemy.voidTrailTimer ?? 0.4) - dt;
          if (enemy.voidTrailTimer <= 0) {
            enemy.voidTrailTimer = 0.45;
            w.voidFirePuddles.push({
              id: Date.now() + Math.random(),
              x: enemy.x + (enemy.facingRight ? 4 : enemy.width - 24),
              y: enemy.y + enemy.height - 4,
              width: 32,
              height: 8,
              life: 3.5,
              maxLife: 3.5,
            });
          }
        }
      } else if (enemy.type === 'sky_ray') {
        enemy.x += enemy.vx * dt;
        enemy.y = enemy.initialY + Math.sin(Date.now() * 0.003) * 35;
        if (enemy.x < 0 || enemy.x > w.levelWidth - enemy.width) {
          enemy.vx = -enemy.vx;
          enemy.facingRight = enemy.vx > 0;
        }

        // Devil Mode: Sky rays fire dark magic orbs towards player
        if (difficultyRef.current === 'DEVIL' && !enemy.isCorrupted) {
          enemy.shootTimer = (enemy.shootTimer ?? 2.6) - dt;
          if (enemy.shootTimer <= 0) {
            enemy.shootTimer = 2.5 + Math.random() * 1.5;
            const dirX = p.x < enemy.x ? -1 : 1;
            w.projectiles.push({
              id: Date.now() + Math.random(),
              x: enemy.x + enemy.width / 2,
              y: enemy.y + enemy.height / 2,
              vx: dirX * 380,
              vy: 60,
              radius: 8,
              isPlayer: false,
              life: 2.2,
              color: '#38bdf8',
              damage: 25,
            });
            gameAudio.playArcadeLaser();
          }
        }

        // Corrupted Void Rays fire piercing laser beams instead of small darts!
        if (enemy.isCorrupted) {
          enemy.shootTimer = (enemy.shootTimer ?? 2.5) - dt;
          if (enemy.shootTimer <= 0) {
            enemy.shootTimer = 2.4;
            const dirX = p.x < enemy.x ? -1 : 1;
            w.projectiles.push({
              id: Date.now() + Math.random(),
              x: enemy.x + (dirX < 0 ? -12 : enemy.width + 12),
              y: enemy.y + 16,
              vx: dirX * 520,
              vy: 0,
              radius: 9,
              isPlayer: false,
              life: 2.2,
              color: '#e11d48',
              isVoidBeam: true,
              damage: 35,
            });
            gameAudio.playArcadeLaser();
            gameAudio.playGunshotBlast();
            w.shake = Math.max(w.shake, 5);
          }
        }
      } else if (enemy.type === 'turret') {
        enemy.shootTimer = (enemy.shootTimer ?? 2) - dt;
        if (enemy.shootTimer <= 0) {
          enemy.shootTimer = difficultyRef.current === 'DEVIL' ? 1.4 : enemy.isFrostVariant ? 2.0 : 2.6;
          const dirX = p.x < enemy.x ? -1 : 1;
          w.projectiles.push({
            id: Date.now() + Math.random(),
            x: enemy.x + (dirX < 0 ? -8 : enemy.width + 6),
            y: enemy.y + 16,
            vx: dirX * (enemy.isFrostVariant ? 320 : 260),
            vy: 0,
            radius: enemy.isFrostVariant ? 8 : 6,
            isPlayer: false,
            life: 3.5,
            color: enemy.isFrostVariant ? '#a5f3fc' : '#fbbf24',
          });
          gameAudio.playArcadeLaser();
        }
      } else if (enemy.type === 'golem') {
        // Heavy Armored Crystal Golem AI
        // Devil Mode: rapid charging lunges and lobbing obsidian/crystal boulders!
        if (difficultyRef.current === 'DEVIL') {
          enemy.chargeTimer = (enemy.chargeTimer ?? 3.0) - dt;
          if (enemy.chargeTimer <= 0) {
            enemy.chargeTimer = 3.2 + Math.random() * 1.5;
            // Lob boulder projectile in an arc
            const dirX = p.x < enemy.x ? -1 : 1;
            w.projectiles.push({
              id: Date.now() + Math.random(),
              x: enemy.x + (dirX > 0 ? enemy.width : 0),
              y: enemy.y + 10,
              vx: dirX * 320,
              vy: -260,
              radius: 14,
              isPlayer: false,
              life: 3.5,
              color: '#71717a',
              isStoneBoulder: true,
              isBomb: true,
              rockRotation: 0,
              damage: 35,
            });
            // Rapid charge lunge
            enemy.vx = dirX * 240;
            gameAudio.playGunshotBlast();
            w.shake = Math.max(w.shake, 6);
          }
        }

        enemy.poundTimer = (enemy.poundTimer ?? 2.8) - dt;
        if (enemy.poundTimer <= 0) {
          enemy.poundTimer = (enemy.isCorrupted ? 2.0 : enemy.isFrostVariant ? 2.3 : 3.0) + Math.random() * 0.6;
          gameAudio.playJumpLandingThud();
          gameAudio.playChiptuneExplosion();
          w.shake = Math.max(w.shake, 8);
          // Ground shockwave
          w.shockwaves.push({
            id: Date.now() + Math.random(),
            x: enemy.x + (enemy.facingRight ? enemy.width : 0),
            y: enemy.y + enemy.height - 18,
            vx: (enemy.facingRight ? 1 : -1) * (enemy.isCorrupted ? 280 : enemy.isFrostVariant ? 260 : 220),
            width: enemy.isCorrupted ? 32 : 24,
            height: enemy.isCorrupted ? 24 : 18,
            life: 1.8,
            maxLife: 1.8,
            color: enemy.isCorrupted ? '#e11d48' : enemy.isFrostVariant ? '#38bdf8' : '#c084fc',
            isVoidSpike: enemy.isCorrupted,
          });
          spawnParticles(
            enemy.x + enemy.width / 2,
            enemy.y + enemy.height,
            18,
            enemy.isCorrupted ? '#e11d48' : enemy.isFrostVariant ? '#a5f3fc' : '#c084fc',
            180,
          );
        } else if ((enemy.poundTimer ?? 0) > 0.4) {
          enemy.x += enemy.vx * dt;
          if (enemy.minX !== undefined && enemy.x < enemy.minX) {
            enemy.vx = Math.abs(enemy.vx);
            enemy.facingRight = true;
          } else if (enemy.maxX !== undefined && enemy.x > enemy.maxX) {
            enemy.vx = -Math.abs(enemy.vx);
            enemy.facingRight = false;
          }
        }
      } else if (enemy.type === 'volt_bat') {
        // Murciélago Voltaico AI
        const distToPlayer = Math.hypot(p.x - enemy.x, p.y - enemy.y);
        if (!enemy.isSwooping && distToPlayer < 300 && p.y > enemy.y - 40) {
          enemy.isSwooping = true;
          enemy.swoopTimer = 1.4;
          gameAudio.playArcadeLaser();

          // Devil Mode: normal volt bats fire electric / void spark on swoop!
          if (difficultyRef.current === 'DEVIL' && !enemy.isCorrupted) {
            const dirX = p.x > enemy.x ? 1 : -1;
            w.projectiles.push({
              id: Date.now() + Math.random(),
              x: enemy.x + enemy.width / 2,
              y: enemy.y + enemy.height / 2,
              vx: dirX * 320,
              vy: 160,
              radius: 8,
              isPlayer: false,
              life: 2.0,
              color: '#38bdf8',
              damage: 25,
            });
          }

          // Abyssal Bats dive-bomb with split shadowy copies!
          if (enemy.isCorrupted) {
            const dirX = p.x > enemy.x ? 1 : -1;
            [-0.35, 0.35].forEach((ang) => {
              w.projectiles.push({
                id: Date.now() + Math.random(),
                x: enemy.x + enemy.width / 2,
                y: enemy.y + enemy.height / 2,
                vx: dirX * Math.cos(ang) * 260,
                vy: Math.sin(ang) * 260 + 120,
                radius: 7,
                isPlayer: false,
                life: 1.8,
                color: '#a855f7',
                damage: 25,
              });
            });
            spawnParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 12, '#a855f7', 160);
          }
        }

        if (enemy.isSwooping) {
          enemy.swoopTimer = (enemy.swoopTimer ?? 0) - dt;
          const targetDirX = p.x > enemy.x ? 1 : -1;
          enemy.x += targetDirX * 180 * dt;
          if ((enemy.swoopTimer ?? 0) > 0.7) {
            enemy.y += 200 * dt;
          } else {
            enemy.y -= 160 * dt;
          }
          if ((enemy.swoopTimer ?? 0) <= 0) {
            enemy.isSwooping = false;
          }
        } else {
          enemy.x += enemy.vx * dt;
          enemy.y =
            enemy.initialY + Math.sin(Date.now() * 0.006 + enemy.id) * 22;
          if (enemy.x < 0 || enemy.x > w.levelWidth - enemy.width) {
            enemy.vx = -enemy.vx;
            enemy.facingRight = enemy.vx > 0;
          }
        }
      }

      // Check collision with player
      if (
        p.x < enemy.x + enemy.width &&
        p.x + p.width > enemy.x &&
        p.y < enemy.y + enemy.height &&
        p.y + p.height > enemy.y
      ) {
        if (enemy.type === 'abyssal_shadow' && !enemy.emerged) {
          // Slumbering in dark pool — no contact damage or stomp
          continue;
        }

        const isStomping =
          p.vy > 0 && p.y + p.height - p.vy * dt <= enemy.y + 24;

        if (isStomping || p.ionTimer > 0 || p.titanTimer > 0 || p.isDashing) {
          const stompPower =
            p.titanTimer > 0
              ? 120
              : p.ionTimer > 0
              ? 120
              : isStomping
              ? 60
              : 50;

          enemy.hp = (enemy.hp ?? 1) - stompPower;
          enemy.hurtTimer = 0.25;
          gameAudio.playChiptuneExplosion();
          w.shake = 8;
          w.hitStop = 0.04;
          if (isStomping) {
            p.vy = jumpPressed ? -baseJump : -baseJump * 0.75;
            p.jumpCount = 1;
          }

          if ((enemy.hp ?? 0) <= 0) {
            enemy.alive = false;

            // Sombras obesas/anchas (LURKER): explotan en orbes oscuros al morir
            if (enemy.type === 'abyssal_shadow' && enemy.shadowVariant === 'LURKER') {
              for (let o = 0; o < 4; o++) {
                const oAng = (o * Math.PI) / 2 + Math.PI / 4;
                w.projectiles.push({
                  id: Date.now() + Math.random(),
                  x: enemy.x + enemy.width / 2,
                  y: enemy.y + enemy.height / 2,
                  vx: Math.cos(oAng) * 240,
                  vy: Math.sin(oAng) * 240,
                  radius: 11,
                  isPlayer: false,
                  life: 2.0,
                  color: '#9333ea',
                  isVoidBurst: true,
                  damage: 30,
                });
              }
              gameAudio.playChiptuneExplosion();
              w.shake = Math.max(w.shake, 8);
            }

            spawnParticles(
              enemy.x + enemy.width / 2,
              enemy.y + enemy.height / 2,
              20,
              enemy.type === 'abyssal_shadow'
                ? '#e11d48'
                : enemy.type === 'golem'
                ? '#c084fc'
                : enemy.type === 'volt_bat'
                ? '#38bdf8'
                : THEME.neonCyan,
              240,
            );
            const sMult = difficultyRef.current === 'DEVIL' ? 3 : 1;
            setGameState((s) => ({
              ...s,
              score:
                s.score +
                (getConfig('scorePerEnemy') as number) *
                  (enemy.type === 'abyssal_shadow' ? 4 : enemy.type === 'golem' ? 3 : 1) *
                  sMult,
            }));
          } else {
            spawnParticles(
              enemy.x + enemy.width / 2,
              enemy.y + enemy.height / 2,
              12,
              '#fbbf24',
              160,
            );
          }
        } else {
          handlePlayerDamage();
        }
      }
    }

    // -------------------------------------------------------------------------
    // PROJECTILES SIMULATION
    // -------------------------------------------------------------------------
    for (let i = w.projectiles.length - 1; i >= 0; i--) {
      const proj = w.projectiles[i];
      if (!proj) {
        w.projectiles.splice(i, 1);
        continue;
      }

      if (proj?.isPlayer && proj?.isBouncing) {
        proj.vy += 850 * dt;
        for (const plat of w.platforms) {
          if (!plat || plat.broken || plat.type === 'hazard') continue;
          if (
            proj.x >= plat.x &&
            proj.x <= plat.x + plat.width &&
            proj.y + proj.radius >= plat.y &&
            proj.y - proj.radius < plat.y + 14 &&
            proj.vy > 0
          ) {
            proj.y = plat.y - proj.radius;
            proj.vy = -180;
            proj.bouncesLeft = (proj.bouncesLeft ?? 1) - 1;
            spawnParticles(proj.x, proj.y, 4, '#fbbf24', 90, 80);
            if (proj.bouncesLeft <= 0) {
              proj.life = 0;
            }
            break;
          }
        }
      }

      proj.x += proj.vx * dt;
      proj.y += proj.vy * dt;
      proj.life -= dt;

      if (proj.isBomb && proj.vy > 0) {
        // Explode on touching floor
        if (proj.y >= 450) {
          proj.life = 0;
          gameAudio.playChiptuneExplosion();
          w.shake = 5;
          spawnParticles(proj.x, proj.y, 14, proj.color, 180);
        }
      }

      if (!proj.isPlayer && proj.isBouncing) {
        proj.vy += 800 * dt;
        if (proj.y >= 450 && proj.vy > 0) {
          proj.y = 450;
          proj.vy = -Math.abs(proj.vy) * 0.75;
          proj.bouncesLeft = (proj.bouncesLeft ?? 1) - 1;
          spawnParticles(proj.x, proj.y, 6, proj.color, 120);
          if (proj.bouncesLeft <= 0) proj.life = 0;
        }
        if (w.bossArenaActive && (proj.x <= 30 || proj.x >= 930)) {
          proj.vx = -proj.vx;
          spawnParticles(proj.x, proj.y, 6, proj.color, 120);
        }
      }

      if (proj.life <= 0) {
        w.projectiles.splice(i, 1);
        continue;
      }

      if (proj.isPlayer) {
        // Player shot destroying ice prisms
        for (let j = 0; j < w.projectiles.length; j++) {
          const otherProj = w.projectiles[j];
          if (otherProj && !otherProj.isPlayer && otherProj.isIcePrism && otherProj.life > 0) {
            const distP = Math.hypot(proj.x - otherProj.x, proj.y - otherProj.y);
            if (distP < proj.radius + otherProj.radius + 8) {
              otherProj.life = 0;
              proj.life = 0;
              gameAudio.playChiptuneExplosion();
              spawnParticles(otherProj.x, otherProj.y, 14, '#a5f3fc', 180);
              setGameState((s) => ({...s, score: s.score + 50}));
              break;
            }
          }
        }

        if (proj.life <= 0) {
          w.projectiles.splice(i, 1);
          continue;
        }

        // Player shot hitting falling icicles (hazard_falling_icicle)
        for (const ici of w.icicles) {
          if (!ici || ici.state === 'SHATTERED') continue;
          if (proj.life <= 0) break;
          if (
            proj.x + proj.radius > ici.x - ici.width / 2 &&
            proj.x - proj.radius < ici.x + ici.width / 2 &&
            proj.y + proj.radius > ici.y &&
            proj.y - proj.radius < ici.y + ici.height
          ) {
            ici.hp -= proj.damage || 35;
            proj.life = 0;
            if (ici.hp <= 0) {
              ici.state = 'SHATTERED';
              gameAudio.playChiptuneExplosion();
              spawnParticles(ici.x, ici.y + ici.height / 2, 22, '#a5f3fc', 220);
              spawnParticles(ici.x, ici.y + ici.height / 2, 14, '#ffffff', 180);
              setGameState((s) => ({...s, score: s.score + 75}));
            } else {
              gameAudio.playSwordClash();
              spawnParticles(proj.x, proj.y, 8, '#a5f3fc', 140);
            }
            break;
          }
        }

        // Player shot hitting standard enemies (with resilient HP support and piercing!)
        for (const enemy of w.enemies) {
          if (!enemy || !enemy.alive) continue;
          if (enemy.type === 'abyssal_shadow' && !enemy.emerged) continue;
          if (proj.life <= 0) break;
          if (
            proj.x + proj.radius > enemy.x &&
            proj.x - proj.radius < enemy.x + enemy.width &&
            proj.y + proj.radius > enemy.y &&
            proj.y - proj.radius < enemy.y + enemy.height
          ) {
            const shotPower =
              enemy.maxHp && enemy.maxHp > 10
                ? proj.damage || 35
                : proj.isBouncing
                ? 2
                : 1;
            enemy.hp = (enemy.hp ?? 1) - shotPower;
            enemy.hurtTimer = 0.2;
            gameAudio.playSwordClash();

            if (enemy.hp <= 0) {
              enemy.alive = false;

              // Sombras obesas/anchas (LURKER): explotan en orbes oscuros al morir por proyectil
              if (enemy.type === 'abyssal_shadow' && enemy.shadowVariant === 'LURKER') {
                for (let o = 0; o < 4; o++) {
                  const oAng = (o * Math.PI) / 2 + Math.PI / 4;
                  w.projectiles.push({
                    id: Date.now() + Math.random(),
                    x: enemy.x + enemy.width / 2,
                    y: enemy.y + enemy.height / 2,
                    vx: Math.cos(oAng) * 240,
                    vy: Math.sin(oAng) * 240,
                    radius: 11,
                    isPlayer: false,
                    life: 2.0,
                    color: '#9333ea',
                    isVoidBurst: true,
                    damage: 30,
                  });
                }
              }

              gameAudio.playChiptuneExplosion();
              spawnParticles(
                enemy.x + enemy.width / 2,
                enemy.y + enemy.height / 2,
                22,
                enemy.type === 'abyssal_shadow'
                  ? '#e11d48'
                  : enemy.type === 'golem'
                  ? '#c084fc'
                  : enemy.type === 'volt_bat'
                  ? '#38bdf8'
                  : '#fbbf24',
                250,
              );
              setGameState((s) => ({
                ...s,
                score:
                  s.score +
                  (getConfig('scorePerEnemy') as number) *
                    (enemy.type === 'abyssal_shadow' ? 4 : enemy.type === 'golem' ? 3 : 1),
              }));
            } else {
              spawnParticles(proj.x, proj.y, 8, '#fbbf24', 150);
            }

            // Piercing shot logic: if pierceCount > 0, punch through and continue!
            if (proj.pierceCount && proj.pierceCount > 0) {
              proj.pierceCount -= 1;
              spawnParticles(proj.x, proj.y, 12, THEME.neonCyan, 220);
            } else {
              proj.life = 0;
              break;
            }
          }
        }

        // Player shot hitting Boss!
        // ONLY player projectiles with isPlayer === true deal damage!
        if (
          proj.life > 0 &&
          proj.isPlayer &&
          w.boss &&
          w.boss.state !== 'DYING' &&
          w.boss.state !== 'DEAD' &&
          w.boss.state !== 'CINEMATIC_SUMMON' &&
          !w.boss.state.startsWith('INTRO_') &&
          proj.x + proj.radius > w.boss.x &&
          proj.x - proj.radius < w.boss.x + w.boss.width &&
          proj.y + proj.radius > w.boss.y &&
          proj.y - proj.radius < w.boss.y + w.boss.height
        ) {
          // Asura's mudra barrier deflects frontal shots back towards player!
          if (w.boss.type === 'CELESTIAL_DEITY' && w.boss.shieldActive) {
            gameAudio.playShieldBlock();
            proj.isPlayer = false;
            proj.vx = -proj.vx * 0.8;
            proj.vy = (Math.random() - 0.5) * 120;
            proj.color = '#fde047';
            proj.life = 1.4;
            spawnParticles(proj.x, proj.y, 12, '#facc15', 200);
          } else {
            const bossShotDmg = proj.damage || 30;
            damageBoss(bossShotDmg, 'THUNDER_SHOT');
            proj.life = 0;
          }
        }

        // Break basalt blocks with charged shot
        for (const plat of w.platforms) {
          if (!plat || plat.broken || plat.type !== 'breakable') continue;
          if (proj.life <= 0) break;
          if (
            proj.x > plat.x &&
            proj.x < plat.x + plat.width &&
            proj.y > plat.y &&
            proj.y < plat.y + plat.height
          ) {
            plat.broken = true;
            proj.life = 0;
            gameAudio.playChiptuneExplosion();
            spawnParticles(
              plat.x + plat.width / 2,
              plat.y + plat.height / 2,
              22,
              '#8b5cf6',
              240,
            );
            break;
          }
        }
      } else {
        // Enemy or boss projectile hitting player
        if (
          proj &&
          proj.life > 0 &&
          proj.x + proj.radius > p.x &&
          proj.x - proj.radius < p.x + p.width &&
          proj.y + proj.radius > p.y &&
          proj.y - proj.radius < p.y + p.height
        ) {
          proj.life = 0;
          if (proj.isVoidBurst) {
            w.shake = Math.max(w.shake, 14);
            gameAudio.playChiptuneExplosion();
            spawnParticles(proj.x, proj.y, 24, '#a855f7', 240);
            spawnParticles(proj.x, proj.y, 16, '#e11d48', 200);
            handlePlayerDamage(false, proj.damage || 40);
          } else if (proj.isVoidBeam) {
            w.shake = Math.max(w.shake, 10);
            spawnParticles(proj.x, proj.y, 18, '#e11d48', 220);
            handlePlayerDamage(false, proj.damage || 35);
          } else {
            handlePlayerDamage();
          }
        }
      }
    }

    // Particles Simulation
    for (let i = w.particles.length - 1; i >= 0; i--) {
      const part = w.particles[i];
      part.x += part.vx * dt;
      part.y += part.vy * dt;
      if (part.gravity) part.vy += part.gravity * dt;
      part.life -= dt;
      if (part.life <= 0) {
        w.particles.splice(i, 1);
      }
    }

    // Camera Follow & Permanent Isolated Arena Window Locking
    const clvl = currentLevelRef.current;
    if (
      clvl === 4 ||
      clvl === 8 ||
      clvl === 12 ||
      clvl === 16 ||
      clvl === 18 ||
      clvl === 19
    ) {
      // Clamped single-screen boss chamber arena
      w.cameraX = 0;
      w.cameraY = 0;
    } else if (clvl === 15) {
      w.cameraX = 0;
      // In Level 15, cameraY is fully managed by verticalAutoscroll with pauseTimer & checkpoint respawns
    } else {
      w.cameraY = 0;
      const lookAhead = (p.facingRight ? 1 : -1) * 90;
      const targetCamX = clamp(
        p.x - canvasWidth / 2 + lookAhead,
        0,
        w.levelWidth - canvasWidth,
      );
      w.cameraX += (targetCamX - w.cameraX) * (6 * dt);
    }

    // Player Animation State
    let nextAction = 'IDLE';
    if (p.attackTimer > 0) {
      nextAction = 'ATTACK';
    } else if (!p.isGrounded) {
      nextAction = 'JUMP';
    } else if (p.isCrouching) {
      nextAction = Math.abs(p.vx) > 15 ? 'WALK' : 'IDLE';
    } else if (Math.abs(p.vx) > 260 || p.isDashing) {
      nextAction = 'RUN';
    } else if (Math.abs(p.vx) > 15) {
      nextAction = 'WALK';
    }

    if (playerAnimStateRef.current.currentAction !== nextAction) {
      playerAnimStateRef.current = {
        currentAction: nextAction,
        currentFrame: 0,
        timer: 0,
      };
    } else {
      playerAnimStateRef.current =
        playerSpriteRendererRef.current.getNextState(
          playerAnimStateRef.current,
          dt,
        );
    }

    prevJumpPressedRef.current = jumpPressed;
    prevAttackPressedRef.current = dashPressed;
    prevShootPressedRef.current = thunderPressed;
    prevFlamePressedRef.current = flamePressed;
    prevFlashStepPressedRef.current = flashStepPressed;
  };

  // Handle Player Damage - Classic Metal Slug 1-hit Life System (15 Lives Base)
  const handlePlayerDamage = (
    isInstantPitfall = false,
    _customDamage = 25,
  ) => {
    const w = worldRef.current;
    const p = w.player;

    // Immunity once boss is dying, dead, or at 0 HP
    if (
      w.boss &&
      (w.boss.isDefeated ||
        w.boss.hp <= 0 ||
        w.boss.state === 'DYING' ||
        w.boss.state === 'DEAD' ||
        (w.boss as any).isDead ||
        w.boss.state === 'DESPERATION')
    ) {
      return;
    }

    // MANDATORY DEBOUNCE & LOCK DEATH:
    // If already respawning, dying, or invulnerable, NEVER process death or damage again!
    // Prevents multi-frame damage draining all 15 lives in 0.25 seconds.
    if (w.isRespawning || w.respawnLockTimer > 0 || p.isDying || p.invulnerableTimer > 0) {
      return;
    }

    // Lock immediately
    w.isRespawning = true;
    w.respawnLockTimer = 0.8;
    p.isDying = true;

    if (p.titanTimer > 0 && !isInstantPitfall) {
      p.titanTimer = 0;
      p.width = 32;
      p.height = 46;
      const baseIframes = (recoveredFragmentsRef.current >= 1 ? 5.0 : 3.0);
      p.invulnerableTimer = baseIframes;
      w.isRespawning = false;
      w.respawnLockTimer = 0.5;
      p.isDying = false;
      setActiveForm('NORMAL');
      gameAudio.playGeneralDamage();
      w.shake = 10;
      spawnParticles(p.x + p.width / 2, p.y + p.height / 2, 16, '#a855f7', 6);
      return;
    }

    // Metal Slug style: strictly deduct ONLY 1 life synchronously
    const currentLives = typeof w.lives === 'number' ? w.lives : (gameStateRef.current.lives ?? 15);
    const remainingLives = Math.max(0, currentLives - 1);
    w.lives = remainingLives;

    gameAudio.playGeneralDamage();
    w.shake = 14;
    spawnParticles(p.x + p.width / 2, p.y + p.height / 2, 22, '#ef4444', 240);

    // ONLY IF remainingLives <= 0:
    if (remainingLives <= 0) {
      // Check Divine Resurrection (Fragment 3: Asura Celestial)
      if (recoveredFragmentsRef.current >= 3 && !p.divineResurrectionUsed) {
        // Reencarnación Celestial: +3 Vidas Divinas de Segunda Oportunidad!
        p.divineResurrectionUsed = true;
        p.isDivineAvatar = true;
        setIsDivineAvatar(true);
        p.invulnerableTimer = 5.0; // 5 segundos de invulnerabilidad divina
        w.lives = 3;
        w.isRespawning = false;
        w.respawnLockTimer = 0.8;
        p.isDying = false;
        w.shake = 28;
        w.lightningFlash = 1.0;
        gameAudio.playVictoryFanfare();
        gameAudio.playLevelUpStinger();
        spawnParticles(p.x + p.width / 2, p.y + p.height / 2, 60, '#facc15', 340);
        spawnParticles(p.x + p.width / 2, p.y + p.height / 2, 40, '#fef08a', 280);

        setGameState((prev) => ({...prev, lives: 3}));
        const curLvlRes = currentLevelRef.current;
        if (
          (curLvlRes === 4 ||
            curLvlRes === 8 ||
            curLvlRes === 12 ||
            curLvlRes === 16 ||
            curLvlRes === 18 ||
            curLvlRes === 19) &&
          !isInstantPitfall
        ) {
          p.vx = (p.facingRight ? -1 : 1) * 220;
          p.vy = -200;
        } else {
          respawnPlayer();
        }
        return;
      }

      // TRULY ZERO LIVES AND REINCARNATION EXHAUSTED -> GAME OVER
      clearTouchInputs();
      w.isRespawning = false;
      p.isDying = true;
      setGameState((prev) => ({...prev, lives: 0, status: 'GAME_OVER'}));
      return;
    }

    // IF remainingLives > 0: DO NOT SET GAME OVER!
    setGameState((prev) => ({...prev, lives: remainingLives}));

    const curLvlLive = currentLevelRef.current;
    if (
      (curLvlLive === 4 ||
        curLvlLive === 8 ||
        curLvlLive === 12 ||
        curLvlLive === 16 ||
        curLvlLive === 18 ||
        curLvlLive === 19) &&
      !isInstantPitfall
    ) {
      const baseIframes = (recoveredFragmentsRef.current >= 1 ? 5.0 : 3.0);
      p.invulnerableTimer = baseIframes;
      w.isRespawning = false;
      w.respawnLockTimer = 0.5;
      p.isDying = false;
      if (w.boss) {
        p.vx = (p.x < w.boss.x ? -1 : 1) * 220;
        p.vy = -200;
      }
      return;
    }

    // SYNCHRONOUSLY SNAP PLAYER & CAMERA TO CHECKPOINT IMMEDIATELY!
    respawnPlayer();
  };

  // ---------------------------------------------------------------------------
  // CANVAS RENDERING
  // ---------------------------------------------------------------------------
  const draw = (ctx: CanvasRenderingContext2D) => {
    prepareCanvas(ctx, canvasWidth, canvasHeight);
    ctx.imageSmoothingEnabled = false;

    const w = worldRef.current;
    const p = w.player;

    // Dedicated Non-Playable Cutscene Rendering (Void Walk Phase)
    if (w.cinematic.active && (w.cinematic.phase === 'VOID_WALK' || w.cinematic.phase === 'FADE_OUT_VOID')) {
      const c = w.cinematic;

      // 1. Pure Black Void Background
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // 2. Soft luminescent energy trail under paws
      const pawX = c.voltlynxX + 32;
      const groundY = canvasHeight * 0.5 + 30;

      const glowGrad = ctx.createRadialGradient(pawX, groundY, 4, pawX, groundY, 75);
      glowGrad.addColorStop(0, 'rgba(0, 240, 255, 0.28)');
      glowGrad.addColorStop(0.4, 'rgba(56, 189, 248, 0.1)');
      glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.ellipse(pawX, groundY, 75, 18, 0, 0, Math.PI * 2);
      ctx.fill();

      // Subtle horizontal ground guide filament
      const lineGrad = ctx.createLinearGradient(0, groundY, canvasWidth, groundY);
      lineGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
      lineGrad.addColorStop(0.3, 'rgba(56, 189, 248, 0.16)');
      lineGrad.addColorStop(0.7, 'rgba(56, 189, 248, 0.16)');
      lineGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.strokeStyle = lineGrad;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, groundY + 2);
      ctx.lineTo(canvasWidth, groundY + 2);
      ctx.stroke();

      // 3. Small glowing cyan footstep sparks under his paws
      for (const sp of c.footstepSparks) {
        ctx.save();
        ctx.globalAlpha = clamp(sp.life / sp.maxLife, 0, 1);
        ctx.fillStyle = sp.color;
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, Math.max(0, sp.size), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 4. Render Voltlynx's animated walking sprite centered in the dark void
      ctx.save();
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 24;
      playerSpriteRendererRef.current.draw(
        ctx,
        c.animState,
        c.voltlynxX,
        canvasHeight * 0.5 - 28,
        64,
        64,
        assets,
        false,
      );
      ctx.restore();

      // 5. Cinematic Letterbox Bars (top & bottom borders)
      const topBarH = 48;
      const bottomBarH = 68;

      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvasWidth, topBarH);
      ctx.fillRect(0, canvasHeight - bottomBarH, canvasWidth, bottomBarH);

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, topBarH);
      ctx.lineTo(canvasWidth, topBarH);
      ctx.moveTo(0, canvasHeight - bottomBarH);
      ctx.lineTo(canvasWidth, canvasHeight - bottomBarH);
      ctx.stroke();

      // 6. Clean Cinematic Text Centered
      ctx.save();
      ctx.textAlign = 'center';

      // Top letterbox badge
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 10;
      ctx.font = 'bold 12px monospace';
      ctx.fillText('✦ MOULER ATRAVIESA LA GRIETA DEL DESTINO ✦', canvasWidth / 2, 30);

      // Bottom letterbox information
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 14;
      ctx.font = "900 17px 'Trebuchet MS', 'Arial Black', sans-serif";
      ctx.fillText(`Destino: ${c.targetLevelName}`, canvasWidth / 2, canvasHeight - 40);

      ctx.fillStyle = 'rgba(203, 213, 225, 0.85)';
      ctx.shadowBlur = 0;
      ctx.font = 'italic 12px sans-serif';
      ctx.fillText(c.targetLevelSubtitle, canvasWidth / 2, canvasHeight - 20);

      // Cinematic smooth warp progress bar
      const pProg = clamp(1 - c.phaseTimer / c.totalVoidDuration, 0, 1);
      const barW = 220;
      const barH = 3;
      const barX = (canvasWidth - barW) / 2;
      const barY = canvasHeight - 58;

      ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 8;
      ctx.fillRect(barX, barY, barW * pProg, barH);
      ctx.restore();

      // Phase 3 Fade Out from void to black
      if (c.phase === 'FADE_OUT_VOID') {
        const fadeAlpha = clamp(1 - c.phaseTimer / 0.5, 0, 1);
        ctx.fillStyle = `rgba(0, 0, 0, ${fadeAlpha})`;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      }

      return;
    }

    const activeLvlForDraw = currentLevelRef.current;
    const isSingleScreenArena =
      activeLvlForDraw === 4 ||
      activeLvlForDraw === 8 ||
      activeLvlForDraw === 12 ||
      activeLvlForDraw === 16 ||
      activeLvlForDraw === 18 ||
      activeLvlForDraw === 19;
    const camX = isSingleScreenArena ? 0 : Math.floor(w.cameraX);
    const camY = isSingleScreenArena ? 0 : Math.floor(w.cameraY);
    const shakeOffset =
      w.shake > 0 ? (Math.random() - 0.5) * w.shake * 0.8 : 0;

    ctx.save();
    ctx.translate(-camX + shakeOffset, -camY + shakeOffset);

    // =========================================================================
    // 1. SKY & BACKGROUND (Completely distinct per level)
    // =========================================================================
    if (w.isBonusRoom) {
      // -----------------------------------------------------------------------
      // BÓVEDA SECRETA DE BONUS (bg_bonus_treasury)
      // Dedicated Ancient Underground Crystal Treasury Vault
      // -----------------------------------------------------------------------
      drawAsset(
        ctx,
        assets['bg_bonus_treasury'],
        0,
        0,
        w.levelWidth,
        canvasHeight,
        (c) => {
          const vaultGrad = c.createLinearGradient(0, 0, 0, canvasHeight);
          vaultGrad.addColorStop(0, '#1c1917');
          vaultGrad.addColorStop(0.5, '#292524');
          vaultGrad.addColorStop(1, '#0c0a09');
          c.fillStyle = vaultGrad;
          c.fillRect(0, 0, w.levelWidth, canvasHeight);
        },
      );
    } else if (currentLevelNumber === 18) {
      // -----------------------------------------------------------------------
      // FASE 5-B: EL TRONO DEL CAOS (bg_ghotur_sanctum_chamber)
      // Royal gothic void throne cathedral with shattered stained-glass arches,
      // swirling purple chaos nebulae, floating obsidian candelabras, and polished marble floor.
      // -----------------------------------------------------------------------
      drawAsset(
        ctx,
        assets['bg_ghotur_sanctum_chamber'],
        0,
        0,
        canvasWidth,
        canvasHeight,
        (c) => {
          const sanctumGrad = c.createLinearGradient(0, 0, 0, canvasHeight);
          sanctumGrad.addColorStop(0, '#0a0314');
          sanctumGrad.addColorStop(0.4, '#1b082e');
          sanctumGrad.addColorStop(0.8, '#2d0f47');
          sanctumGrad.addColorStop(1, '#0c0417');
          c.fillStyle = sanctumGrad;
          c.fillRect(0, 0, canvasWidth, canvasHeight);
        },
      );

      // Swirling purple chaos nebula back-glow
      const sanctumGlow = ctx.createRadialGradient(
        canvasWidth / 2,
        200,
        20,
        canvasWidth / 2,
        200,
        280,
      );
      sanctumGlow.addColorStop(0, 'rgba(168, 85, 247, 0.22)');
      sanctumGlow.addColorStop(0.5, 'rgba(126, 34, 206, 0.1)');
      sanctumGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = sanctumGlow;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    } else if (currentLevelNumber === 19) {
      // -----------------------------------------------------------------------
      // FASE 5-FINAL: EL NÚCLEO DEL ABISMO COLAPSADO (bg_ghotur_demonic_abyss)
      // The shattered core of the universe in total apocalypse with collapsing obsidian monoliths,
      // boiling crimson magma oceans below, exploding dimensional rifts, and falling meteor debris.
      // -----------------------------------------------------------------------
      drawAsset(
        ctx,
        assets['bg_ghotur_demonic_abyss'],
        0,
        0,
        canvasWidth,
        canvasHeight,
        (c) => {
          const abyssGrad = c.createLinearGradient(0, 0, 0, canvasHeight);
          abyssGrad.addColorStop(0, '#150005');
          abyssGrad.addColorStop(0.35, '#2e020d');
          abyssGrad.addColorStop(0.75, '#5c0618');
          abyssGrad.addColorStop(1, '#180004');
          c.fillStyle = abyssGrad;
          c.fillRect(0, 0, canvasWidth, canvasHeight);
        },
      );

      // Swirling abyssal apocalypse inferno glow
      const demonGlow = ctx.createRadialGradient(
        canvasWidth / 2,
        canvasHeight * 0.45,
        30,
        canvasWidth / 2,
        canvasHeight * 0.45,
        320,
      );
      demonGlow.addColorStop(0, 'rgba(239, 68, 68, 0.25)');
      demonGlow.addColorStop(0.5, 'rgba(168, 85, 247, 0.15)');
      demonGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = demonGlow;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    } else if (currentLevelNumber === 17) {
      // -----------------------------------------------------------------------
      // NIVEL 5-1: EL INFIERNO ABISAL (bg_zone5_abyssal_inferno)
      // Apocalyptic abyss inferno, shattered citadels, swirling crimson & purple void storms
      // -----------------------------------------------------------------------
      const abyssSky = ctx.createLinearGradient(0, 0, 0, canvasHeight);
      abyssSky.addColorStop(0, '#06000a');
      abyssSky.addColorStop(0.35, '#1e0523');
      abyssSky.addColorStop(0.75, '#450920');
      abyssSky.addColorStop(1, '#0a000f');
      ctx.fillStyle = abyssSky;
      ctx.fillRect(camX - 100, 0, canvasWidth + 200, canvasHeight);

      // Distant Parallax Layer: bg_zone5_abyssal_inferno (0.22x speed)
      const distantParallax = camX * 0.22;
      for (let bgIdx = -1; bgIdx < 10; bgIdx++) {
        const bgX = bgIdx * canvasWidth + distantParallax * 0.4;
        drawAsset(
          ctx,
          assets['bg_zone5_abyssal_inferno'],
          bgX,
          0,
          canvasWidth,
          canvasHeight,
          (c) => {
            c.fillStyle = '#1c0524';
            c.fillRect(bgX, 0, canvasWidth, canvasHeight);
          },
        );
      }

      // Swirling Crimson & Void Purple Tempest Vignette
      ctx.save();
      const vigGrad = ctx.createRadialGradient(
        camX + canvasWidth / 2,
        canvasHeight / 2,
        canvasWidth * 0.32,
        camX + canvasWidth / 2,
        canvasHeight / 2,
        canvasWidth * 0.72,
      );
      vigGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vigGrad.addColorStop(0.65, 'rgba(40, 5, 25, 0.28)');
      vigGrad.addColorStop(1, 'rgba(5, 0, 8, 0.85)');
      ctx.fillStyle = vigGrad;
      ctx.fillRect(camX - 100, 0, canvasWidth + 200, canvasHeight);
      ctx.restore();

      // Weeping Crimson Bleeding Lightning Thunder Flash
      if (w.bleedingLightningFlash > 0.02) {
        ctx.save();
        ctx.fillStyle = `rgba(225, 29, 72, ${w.bleedingLightningFlash * 0.55})`;
        ctx.fillRect(camX - 100, 0, canvasWidth + 200, canvasHeight);

        if (w.bleedingLightningFlash > 0.35) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 3;
          ctx.shadowColor = '#e11d48';
          ctx.shadowBlur = 20;
          ctx.beginPath();
          const boltX = camX + canvasWidth * 0.52;
          ctx.moveTo(boltX, 0);
          ctx.lineTo(boltX - 30, 110);
          ctx.lineTo(boltX + 22, 190);
          ctx.lineTo(boltX - 35, 310);
          ctx.lineTo(boltX + 15, 450);
          ctx.stroke();
        }
        ctx.restore();
      }
    } else if (currentLevelNumber === 9) {
      // -----------------------------------------------------------------------
      // NIVEL 3-1: LA FORTALEZA DE LA ESTRATOSFERA (bg_zone3_stratosphere)
      // High-altitude floating sky fortress, broken basalt islands, electric storm clouds
      // -----------------------------------------------------------------------
      const skyGrad = ctx.createLinearGradient(0, 0, 0, canvasHeight);
      skyGrad.addColorStop(0, '#02182b');
      skyGrad.addColorStop(0.35, '#063a5d');
      skyGrad.addColorStop(0.75, '#19648f');
      skyGrad.addColorStop(1, '#02101e');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(camX - 100, 0, canvasWidth + 200, canvasHeight);

      // Distant Parallax Layer: bg_zone3_stratosphere (0.22x speed)
      const distantParallax = camX * 0.22;
      for (let bgIdx = -1; bgIdx < 8; bgIdx++) {
        const bgX = bgIdx * canvasWidth + distantParallax * 0.4;
        drawAsset(
          ctx,
          assets['bg_zone3_stratosphere'],
          bgX,
          0,
          canvasWidth,
          canvasHeight,
          (c) => {
            c.fillStyle = '#062942';
            c.fillRect(bgX, 0, canvasWidth, canvasHeight);
          },
        );
      }

      // High-altitude drifting storm cloud puffs
      ctx.save();
      for (let cIdx = -1; cIdx < 8; cIdx++) {
        const cloudX = cIdx * 700 + 200 - ((camX * 0.45) % 700);
        ctx.fillStyle = 'rgba(224, 242, 254, 0.12)';
        ctx.beginPath();
        ctx.arc(cloudX, 360, 90, 0, Math.PI * 2);
        ctx.arc(cloudX + 70, 340, 110, 0, Math.PI * 2);
        ctx.arc(cloudX + 150, 360, 80, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    } else if (currentLevelNumber === 13) {
      // -----------------------------------------------------------------------
      // NIVEL 4-1: EL VALLE GLACIAL (bg_zone4_glacial_valley)
      // Polar aurora borealis sky, towering glacier spires and snowy crags
      // -----------------------------------------------------------------------
      const valleyGrad = ctx.createLinearGradient(0, 0, 0, canvasHeight);
      valleyGrad.addColorStop(0, '#021827');
      valleyGrad.addColorStop(0.35, '#042e40');
      valleyGrad.addColorStop(0.7, '#07485e');
      valleyGrad.addColorStop(1, '#082538');
      ctx.fillStyle = valleyGrad;
      ctx.fillRect(camX - 100, 0, canvasWidth + 200, canvasHeight);

      // Shimmering Aurora Borealis ribbons across polar night sky
      ctx.save();
      const auroraTime = Date.now() * 0.002;
      for (let a = 0; a < 3; a++) {
        const aY = 35 + a * 26 + Math.sin(auroraTime * 2 + a) * 8;
        const aGrad = ctx.createLinearGradient(0, aY - 20, 0, aY + 30);
        aGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
        aGrad.addColorStop(0.5, a === 1 ? 'rgba(52, 211, 153, 0.28)' : 'rgba(56, 189, 248, 0.24)');
        aGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
        ctx.fillStyle = aGrad;
        ctx.fillRect(camX - 100, aY - 20, canvasWidth + 200, 50);
      }
      ctx.restore();

      // Distant Parallax Layer: bg_zone4_glacial_valley (0.22x speed)
      const distantParallax = camX * 0.22;
      for (let bgIdx = -1; bgIdx < 8; bgIdx++) {
        const bgX = bgIdx * canvasWidth + distantParallax * 0.4;
        drawAsset(
          ctx,
          assets['bg_zone4_glacial_valley'],
          bgX,
          0,
          canvasWidth,
          canvasHeight,
          (c) => {
            c.fillStyle = '#062d42';
            c.fillRect(bgX, 0, canvasWidth, canvasHeight);
          },
        );
      }
    } else if (currentLevelNumber === 14) {
      // -----------------------------------------------------------------------
      // NIVEL 4-2: EL PASO DE LA AVALANCHA (bg_zone4_avalanche_pass)
      // Steep frozen alpine pass, snowdrifts and howling mountain blizzard
      // -----------------------------------------------------------------------
      const passGrad = ctx.createLinearGradient(0, 0, 0, canvasHeight);
      passGrad.addColorStop(0, '#050c18');
      passGrad.addColorStop(0.35, '#0a1a2f');
      passGrad.addColorStop(0.7, '#152945');
      passGrad.addColorStop(1, '#061324');
      ctx.fillStyle = passGrad;
      ctx.fillRect(camX - 100, 0, canvasWidth + 200, canvasHeight);

      // Distant Parallax Layer: bg_zone4_avalanche_pass (0.22x speed)
      const distantParallax = camX * 0.22;
      for (let bgIdx = -1; bgIdx < 8; bgIdx++) {
        const bgX = bgIdx * canvasWidth + distantParallax * 0.4;
        drawAsset(
          ctx,
          assets['bg_zone4_avalanche_pass'],
          bgX,
          0,
          canvasWidth,
          canvasHeight,
          (c) => {
            c.fillStyle = '#091c33';
            c.fillRect(bgX, 0, canvasWidth, canvasHeight);
          },
        );
      }
    } else if (currentLevelNumber === 15) {
      // -----------------------------------------------------------------------
      // NIVEL 4-3: LA CUMBRE HELADA - MULTI-LAYER VERTICAL PARALLAX
      // Deep Layer: bg_zone4_glacial_valley (0.2x vertical parallax)
      // Midground Layer: bg_zone4_frozen_summit & bg_zone4_avalanche_pass blended (0.5x parallax)
      // Foreground Atmosphere: Swirling frost mist bands & falling snow
      // Zero seams, zero cutoffs, buttery smooth 60 FPS
      // -----------------------------------------------------------------------
      // Base atmospheric vertical sky gradient covering the current viewport
      const summitSky = ctx.createLinearGradient(0, camY, 0, camY + canvasHeight);
      summitSky.addColorStop(0, '#020617');
      summitSky.addColorStop(0.35, '#082f49');
      summitSky.addColorStop(0.75, '#0369a1');
      summitSky.addColorStop(1, '#061d30');
      ctx.fillStyle = summitSky;
      ctx.fillRect(0, camY, canvasWidth, canvasHeight);

      // 1. Deep Background Layer: bg_zone4_glacial_valley (0.2x speed)
      const deepParallaxY = (camY * 0.2) % canvasHeight;
      const baseDeepY = camY - deepParallaxY;
      for (let s = -1; s <= 1; s++) {
        const dy = baseDeepY + s * canvasHeight;
        drawAsset(
          ctx,
          assets['bg_zone4_glacial_valley'],
          0,
          dy,
          canvasWidth,
          canvasHeight,
          (c) => {
            c.fillStyle = '#062d42';
            c.fillRect(0, dy, canvasWidth, canvasHeight);
          },
        );
      }

      // 2. Midground Layer: bg_zone4_frozen_summit & bg_zone4_avalanche_pass blended (0.5x speed)
      ctx.save();
      ctx.globalAlpha = 0.58;
      const midParallaxY = (camY * 0.5) % canvasHeight;
      const baseMidY = camY - midParallaxY;
      for (let s = -1; s <= 1; s++) {
        const my = baseMidY + s * canvasHeight;
        const midAsset =
          s % 2 === 0
            ? assets['bg_zone4_frozen_summit']
            : assets['bg_zone4_avalanche_pass'];
        drawAsset(
          ctx,
          midAsset || assets['bg_zone4_frozen_summit'],
          0,
          my,
          canvasWidth,
          canvasHeight,
          (c) => {
            c.fillStyle = '#083344';
            c.fillRect(0, my, canvasWidth, canvasHeight);
          },
        );
      }
      ctx.restore();

      // 3. Atmospheric Foreground: Swirling frost mist layers drifting across the viewport
      ctx.save();
      const mistTime = Date.now() * 0.0018;
      for (let m = 0; m < 3; m++) {
        const mistY = camY + 60 + m * 160 + Math.sin(mistTime * 2 + m) * 18;
        const mistGrad = ctx.createLinearGradient(0, mistY - 35, 0, mistY + 35);
        mistGrad.addColorStop(0, 'rgba(165, 243, 252, 0)');
        mistGrad.addColorStop(0.5, 'rgba(165, 243, 252, 0.16)');
        mistGrad.addColorStop(1, 'rgba(165, 243, 252, 0)');
        ctx.fillStyle = mistGrad;
        ctx.fillRect(0, mistY - 35, canvasWidth, 70);
      }
      ctx.restore();
    } else if (currentLevelNumber === 10) {
      // -----------------------------------------------------------------------
      // NIVEL 3-2: LA AGUJA DEL TRUENO (bg_zone3_spire_shaft)
      // Vertical ascending tower interior, colossal bronze gears, crackling conduits
      // -----------------------------------------------------------------------
      const shaftGrad = ctx.createLinearGradient(0, 0, 0, canvasHeight);
      shaftGrad.addColorStop(0, '#0a0a14');
      shaftGrad.addColorStop(0.35, '#1b182e');
      shaftGrad.addColorStop(0.75, '#2e1c36');
      shaftGrad.addColorStop(1, '#0b0816');
      ctx.fillStyle = shaftGrad;
      ctx.fillRect(camX - 100, 0, canvasWidth + 200, canvasHeight);

      // Distant Parallax Layer: bg_zone3_spire_shaft (0.22x speed)
      const distantParallax = camX * 0.22;
      for (let bgIdx = -1; bgIdx < 8; bgIdx++) {
        const bgX = bgIdx * canvasWidth + distantParallax * 0.4;
        drawAsset(
          ctx,
          assets['bg_zone3_spire_shaft'],
          bgX,
          0,
          canvasWidth,
          canvasHeight,
          (c) => {
            c.fillStyle = '#181224';
            c.fillRect(bgX, 0, canvasWidth, canvasHeight);
          },
        );
      }

      // Crackling vertical energy conduit columns & rotating gear silhouettes
      ctx.save();
      const spireTime = Date.now() * 0.003;
      for (let sIdx = -1; sIdx < 7; sIdx++) {
        const conduitX = sIdx * 760 + 340 - ((camX * 0.38) % 760);
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.35)';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(conduitX, 20);
        ctx.lineTo(conduitX, canvasHeight - 20);
        ctx.stroke();

        const pulseY = 100 + Math.sin(spireTime * 3 + sIdx) * 120;
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(conduitX, pulseY, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      ctx.restore();
    } else if (currentLevelNumber === 11) {
      // -----------------------------------------------------------------------
      // NIVEL 3-3: EL SANTUARIO CELESTIAL (bg_zone3_celestial_sanctuary)
      // Majestic celestial sanctuary above clouds, nebula stars, floating rune columns
      // -----------------------------------------------------------------------
      const celestialGrad = ctx.createLinearGradient(0, 0, 0, canvasHeight);
      celestialGrad.addColorStop(0, '#09051c');
      celestialGrad.addColorStop(0.35, '#160d3d');
      celestialGrad.addColorStop(0.75, '#291754');
      celestialGrad.addColorStop(1, '#060314');
      ctx.fillStyle = celestialGrad;
      ctx.fillRect(camX - 100, 0, canvasWidth + 200, canvasHeight);

      // Distant Parallax Layer: bg_zone3_celestial_sanctuary (0.22x speed)
      const distantParallax = camX * 0.22;
      for (let bgIdx = -1; bgIdx < 9; bgIdx++) {
        const bgX = bgIdx * canvasWidth + distantParallax * 0.4;
        drawAsset(
          ctx,
          assets['bg_zone3_celestial_sanctuary'],
          bgX,
          0,
          canvasWidth,
          canvasHeight,
          (c) => {
            c.fillStyle = '#170e38';
            c.fillRect(bgX, 0, canvasWidth, canvasHeight);
          },
        );
      }

      // Majestic Sea of Clouds below the sanctuary (covering bottom y = 490 to 540)
      ctx.save();
      const cloudGrad = ctx.createLinearGradient(0, 470, 0, canvasHeight);
      cloudGrad.addColorStop(0, 'rgba(224, 231, 255, 0)');
      cloudGrad.addColorStop(0.4, 'rgba(199, 210, 254, 0.45)');
      cloudGrad.addColorStop(1, 'rgba(165, 180, 252, 0.7)');
      ctx.fillStyle = cloudGrad;
      ctx.fillRect(camX - 100, 470, canvasWidth + 200, canvasHeight - 470);
      ctx.restore();
    } else if (currentLevelNumber === 5) {
      // -----------------------------------------------------------------------
      // NIVEL 2-1: ENTRADA A LAS CAVERNAS (bg_crystal_caverns)
      // Deep amethyst cavern, purple stalactites, violet mineral spores
      // -----------------------------------------------------------------------
      const caveGrad = ctx.createLinearGradient(0, 0, 0, canvasHeight);
      caveGrad.addColorStop(0, '#070312');
      caveGrad.addColorStop(0.35, '#150826');
      caveGrad.addColorStop(0.75, '#220b3d');
      caveGrad.addColorStop(1, '#0b0417');
      ctx.fillStyle = caveGrad;
      ctx.fillRect(camX - 100, 0, canvasWidth + 200, canvasHeight);

      // Distant Parallax Background: bg_crystal_caverns (0.22x speed)
      const distantParallax = camX * 0.22;
      for (let bgIdx = -1; bgIdx < 6; bgIdx++) {
        const bgX = bgIdx * canvasWidth + distantParallax * 0.4;
        drawAsset(
          ctx,
          assets['bg_crystal_caverns'],
          bgX,
          0,
          canvasWidth,
          canvasHeight,
          (c) => {
            // Fallback: Deep violet cavern with glowing amethyst crystal stalactites
            c.fillStyle = '#170c2e';
            c.fillRect(bgX, 0, canvasWidth, canvasHeight);
            c.fillStyle = '#c084fc';
            for (let st = 40; st < canvasWidth; st += 120) {
              c.beginPath();
              c.moveTo(bgX + st, 0);
              c.lineTo(bgX + st + 15, 80);
              c.lineTo(bgX + st + 30, 0);
              c.fill();
            }
          },
        );
      }

      // Cavern ceiling stalactites layer
      ctx.save();
      ctx.fillStyle = '#0f0721';
      for (let st = (camX % 160) - 160; st < canvasWidth + 160; st += 160) {
        const absX = camX + st;
        ctx.beginPath();
        ctx.moveTo(absX, 0);
        ctx.lineTo(absX + 24, 72 + Math.sin(absX * 0.05) * 24);
        ctx.lineTo(absX + 48, 0);
        ctx.fill();

        // Glowing amethyst crystal tip
        ctx.fillStyle = Math.sin(absX) > 0 ? '#c084fc' : '#a855f7';
        ctx.beginPath();
        ctx.arc(absX + 24, 72 + Math.sin(absX * 0.05) * 24, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0f0721';
      }
      ctx.restore();
    } else if (currentLevelNumber === 6) {
      // -----------------------------------------------------------------------
      // NIVEL 2-2: EL ABISMO RESONANTE (bg_resonant_chasm)
      // Cyan subterranean waterfalls, deep turquoise abyss, hanging crystal stalactites
      // -----------------------------------------------------------------------
      const abyssGrad = ctx.createLinearGradient(0, 0, 0, canvasHeight);
      abyssGrad.addColorStop(0, '#021219');
      abyssGrad.addColorStop(0.35, '#042733');
      abyssGrad.addColorStop(0.75, '#073b4c');
      abyssGrad.addColorStop(1, '#011117');
      ctx.fillStyle = abyssGrad;
      ctx.fillRect(camX - 100, 0, canvasWidth + 200, canvasHeight);

      // Distant Parallax Background: bg_resonant_chasm (0.22x speed)
      const distantParallax = camX * 0.22;
      for (let bgIdx = -1; bgIdx < 7; bgIdx++) {
        const bgX = bgIdx * canvasWidth + distantParallax * 0.4;
        drawAsset(
          ctx,
          assets['bg_resonant_chasm'],
          bgX,
          0,
          canvasWidth,
          canvasHeight,
          (c) => {
            // Fallback: Deep turquoise chasm with subterranean cascading waterfalls
            c.fillStyle = '#04212b';
            c.fillRect(bgX, 0, canvasWidth, canvasHeight);
            // Waterfall cascade columns
            c.fillStyle = 'rgba(34, 211, 238, 0.25)';
            c.fillRect(bgX + 160, 40, 36, canvasHeight - 80);
            c.fillRect(bgX + 540, 60, 44, canvasHeight - 100);
            c.fillStyle = '#22d3ee';
            for (let st = 50; st < canvasWidth; st += 140) {
              c.beginPath();
              c.moveTo(bgX + st, 0);
              c.lineTo(bgX + st + 16, 90);
              c.lineTo(bgX + st + 32, 0);
              c.fill();
            }
          },
        );
      }

      // Cascading subterranean turquoise energy streams
      ctx.save();
      const chasmTime = Date.now() * 0.002;
      for (let fIdx = -1; fIdx < 5; fIdx++) {
        const flowX = fIdx * 800 + 380 - (camX * 0.35 % 800);
        const flowGrad = ctx.createLinearGradient(flowX, 0, flowX, canvasHeight);
        flowGrad.addColorStop(0, 'rgba(6, 182, 212, 0.08)');
        flowGrad.addColorStop(0.5, 'rgba(34, 211, 238, 0.2)');
        flowGrad.addColorStop(1, 'rgba(6, 182, 212, 0.05)');
        ctx.fillStyle = flowGrad;
        ctx.fillRect(flowX - 18, 0, 36, canvasHeight);

        // Shimmering waterfall light streaks
        ctx.fillStyle = 'rgba(165, 243, 252, 0.45)';
        for (let s = 0; s < 5; s++) {
          const sY = ((chasmTime * 220 + s * 110) % canvasHeight);
          ctx.fillRect(flowX - 8 + (s % 3) * 6, sY, 3, 16);
        }
      }

      // Turquoise hanging stalactites from ceiling
      ctx.fillStyle = '#021820';
      for (let st = (camX % 180) - 180; st < canvasWidth + 180; st += 180) {
        const absX = camX + st;
        ctx.beginPath();
        ctx.moveTo(absX, 0);
        ctx.lineTo(absX + 22, 85 + Math.sin(absX * 0.04) * 30);
        ctx.lineTo(absX + 44, 0);
        ctx.fill();

        ctx.fillStyle = '#22d3ee';
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(absX + 22, 85 + Math.sin(absX * 0.04) * 30, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#021820';
      }
      ctx.restore();
    } else if (currentLevelNumber === 7) {
      // -----------------------------------------------------------------------
      // NIVEL 2-3: LA CIUDADELA SUBTERRÁNEA (bg_crystal_citadel)
      // Towering obsidian temple spires embedded with giant violet geodes & conduits
      // -----------------------------------------------------------------------
      const citadelGrad = ctx.createLinearGradient(0, 0, 0, canvasHeight);
      citadelGrad.addColorStop(0, '#0a0214');
      citadelGrad.addColorStop(0.35, '#1e052d');
      citadelGrad.addColorStop(0.75, '#3b0754');
      citadelGrad.addColorStop(1, '#090111');
      ctx.fillStyle = citadelGrad;
      ctx.fillRect(camX - 100, 0, canvasWidth + 200, canvasHeight);

      // Distant Parallax Background: bg_crystal_citadel (0.22x speed)
      const distantParallax = camX * 0.22;
      for (let bgIdx = -1; bgIdx < 7; bgIdx++) {
        const bgX = bgIdx * canvasWidth + distantParallax * 0.4;
        drawAsset(
          ctx,
          assets['bg_crystal_citadel'],
          bgX,
          0,
          canvasWidth,
          canvasHeight,
          (c) => {
            // Fallback: Towering obsidian temple spires with glowing violet geodes
            c.fillStyle = '#140321';
            c.fillRect(bgX, 0, canvasWidth, canvasHeight);
            c.fillStyle = '#24063b';
            for (let sp = 80; sp < canvasWidth; sp += 240) {
              c.fillRect(bgX + sp, 120, 60, canvasHeight - 120);
              c.beginPath();
              c.moveTo(bgX + sp, 120);
              c.lineTo(bgX + sp + 30, 40);
              c.lineTo(bgX + sp + 60, 120);
              c.fill();
            }
          },
        );
      }

      // Glowing power conduit lines and geode energy pulses
      ctx.save();
      const citTime = Date.now() * 0.003;
      for (let cIdx = -1; cIdx < 6; cIdx++) {
        const spireX = cIdx * 640 + 260 - (camX * 0.38 % 640);
        // Vertical energy conduit filament
        ctx.strokeStyle = 'rgba(232, 121, 249, 0.45)';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#e879f9';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(spireX, 60);
        ctx.lineTo(spireX, canvasHeight - 60);
        ctx.stroke();

        // Pulsing geode orb along conduit
        const pulseY = 120 + Math.sin(citTime * 2 + cIdx) * 80;
        ctx.fillStyle = '#f472b6';
        ctx.beginPath();
        ctx.arc(spireX, pulseY, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      // Obsidian temple ceiling cornices
      ctx.fillStyle = '#08010f';
      ctx.fillRect(camX - 100, 0, canvasWidth + 200, 36);
      ctx.fillStyle = '#e879f9';
      for (let cx = (camX % 64) - 64; cx < canvasWidth + 64; cx += 64) {
        ctx.fillRect(camX + cx, 32, 24, 4);
      }
      ctx.restore();
    } else if (currentLevelNumber === 16) {
      // -----------------------------------------------------------------------
      // NIVEL 4-B: EL TRONO DE LA EMPERATRIZ DE HIELO (bg_frost_empress_throne)
      // Majestic frozen gothic palace throne room, ice crystal chandeliers, arched stained-glass windows
      // -----------------------------------------------------------------------
      drawAsset(
        ctx,
        assets['bg_frost_empress_throne'],
        0,
        0,
        canvasWidth,
        canvasHeight,
        (c) => {
          const frostGrad = c.createLinearGradient(0, 0, 0, canvasHeight);
          frostGrad.addColorStop(0, '#041728');
          frostGrad.addColorStop(0.4, '#082f49');
          frostGrad.addColorStop(0.8, '#0e4a6d');
          frostGrad.addColorStop(1, '#051b2e');
          c.fillStyle = frostGrad;
          c.fillRect(0, 0, canvasWidth, canvasHeight);
        },
      );

      // Ambient frosty back-glow
      const throneGlow = ctx.createRadialGradient(
        canvasWidth / 2,
        220,
        20,
        canvasWidth / 2,
        220,
        280,
      );
      throneGlow.addColorStop(0, 'rgba(165, 243, 252, 0.15)');
      throneGlow.addColorStop(0.5, 'rgba(56, 189, 248, 0.08)');
      throneGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = throneGlow;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    } else if (currentLevelNumber === 12) {
      // -----------------------------------------------------------------------
      // NIVEL 3-B: EL TRONO CELESTIAL (bg_celestial_throne)
      // Deep cosmic nebula, giant golden astral rings, floating marble lotus pedestals
      // -----------------------------------------------------------------------
      drawAsset(
        ctx,
        assets['bg_celestial_throne'],
        0,
        0,
        canvasWidth,
        canvasHeight,
        (c) => {
          const throneGrad = c.createLinearGradient(0, 0, 0, canvasHeight);
          throneGrad.addColorStop(0, '#09051d');
          throneGrad.addColorStop(0.35, '#160d3d');
          throneGrad.addColorStop(0.75, '#2a1661');
          throneGrad.addColorStop(1, '#0c0529');
          c.fillStyle = throneGrad;
          c.fillRect(0, 0, canvasWidth, canvasHeight);

          // Golden astral ring fallback
          c.strokeStyle = '#facc15';
          c.lineWidth = 4;
          c.beginPath();
          c.arc(canvasWidth / 2, 220, 140, 0, Math.PI * 2);
          c.stroke();
        },
      );

      // Ambient celestial astral back-glow
      const ringGlow = ctx.createRadialGradient(
        canvasWidth / 2,
        220,
        20,
        canvasWidth / 2,
        220,
        280,
      );
      ringGlow.addColorStop(0, 'rgba(250, 204, 21, 0.15)');
      ringGlow.addColorStop(0.5, 'rgba(129, 140, 248, 0.1)');
      ringGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = ringGlow;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    } else if (currentLevelNumber === 8) {
      // -----------------------------------------------------------------------
      // NIVEL 2-B: LA GUARIDA DEL DRAGÓN (bg_dragon_boss_lair)
      // Subterranean magma cavern with glowing lava falls & basalt pillars
      // -----------------------------------------------------------------------
      drawAsset(
        ctx,
        assets['bg_dragon_boss_lair'],
        0,
        0,
        canvasWidth,
        canvasHeight,
        (c) => {
          const lairGrad = c.createLinearGradient(0, 0, 0, canvasHeight);
          lairGrad.addColorStop(0, '#160404');
          lairGrad.addColorStop(0.4, '#2d0707');
          lairGrad.addColorStop(0.8, '#420808');
          lairGrad.addColorStop(1, '#180303');
          c.fillStyle = lairGrad;
          c.fillRect(0, 0, canvasWidth, canvasHeight);

          // Lava falls fallback
          c.fillStyle = 'rgba(239, 68, 68, 0.45)';
          c.fillRect(180, 40, 40, canvasHeight - 80);
          c.fillRect(720, 60, 48, canvasHeight - 100);
          c.fillStyle = '#f97316';
          c.fillRect(190, 40, 20, canvasHeight - 80);
          c.fillRect(734, 60, 20, canvasHeight - 100);
        },
      );

      // Ambient heat glow along bottom magma floor
      const heatGrad = ctx.createLinearGradient(0, 380, 0, canvasHeight);
      heatGrad.addColorStop(0, 'rgba(249, 115, 22, 0)');
      heatGrad.addColorStop(1, 'rgba(239, 68, 68, 0.25)');
      ctx.fillStyle = heatGrad;
      ctx.fillRect(0, 380, canvasWidth, canvasHeight - 380);
    } else if (currentLevelNumber === 1) {
      // -----------------------------------------------------------------------
      // NIVEL 1-1: PRADERAS DE AETHERIA (Bright Morning Meadow / Floating Isles)
      // -----------------------------------------------------------------------
      // Morning azure to golden sunlight sky gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, canvasHeight);
      skyGrad.addColorStop(0, '#0284c7');
      skyGrad.addColorStop(0.35, '#38bdf8');
      skyGrad.addColorStop(0.7, '#bae6fd');
      skyGrad.addColorStop(1, '#fef08a');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(camX - 100, 0, canvasWidth + 200, canvasHeight);

      // Morning Sun Glow Disc
      ctx.save();
      const sunX = camX + canvasWidth * 0.8;
      const sunGrad = ctx.createRadialGradient(sunX, 85, 10, sunX, 85, 110);
      sunGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      sunGrad.addColorStop(0.3, 'rgba(254, 240, 138, 0.7)');
      sunGrad.addColorStop(0.7, 'rgba(253, 224, 71, 0.25)');
      sunGrad.addColorStop(1, 'rgba(253, 224, 71, 0)');
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(sunX, 85, 110, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Distant Parallax Background: bg_plains_meadows (0.2x speed)
      const distantParallax = camX * 0.2;
      for (let bgIdx = -1; bgIdx < 5; bgIdx++) {
        const bgX = bgIdx * canvasWidth + distantParallax * 0.5;
        drawAsset(
          ctx,
          assets['bg_plains_meadows'],
          bgX,
          0,
          canvasWidth,
          canvasHeight,
          (c) => {
            // Fallback: Rolling pastel distant mountains and lush hills
            c.fillStyle = '#93c5fd';
            c.beginPath();
            c.moveTo(bgX, canvasHeight);
            c.lineTo(bgX, 220);
            c.quadraticCurveTo(bgX + canvasWidth * 0.3, 140, bgX + canvasWidth * 0.6, 210);
            c.quadraticCurveTo(bgX + canvasWidth * 0.85, 160, bgX + canvasWidth, 240);
            c.lineTo(bgX + canvasWidth, canvasHeight);
            c.fill();
          },
        );
      }

      // Midground Parallax Layer: Lush rolling hills & floating morning clouds (0.45x speed)
      const midParallax = camX * 0.45;
      for (let mIdx = -1; mIdx < 6; mIdx++) {
        const mx = mIdx * canvasWidth - (midParallax % canvasWidth);
        // Soft rolling green hill
        ctx.fillStyle = 'rgba(34, 197, 94, 0.32)';
        ctx.beginPath();
        ctx.moveTo(mx, canvasHeight);
        ctx.quadraticCurveTo(mx + canvasWidth * 0.25, 260, mx + canvasWidth * 0.5, 320);
        ctx.quadraticCurveTo(mx + canvasWidth * 0.75, 240, mx + canvasWidth, 310);
        ctx.lineTo(mx + canvasWidth, canvasHeight);
        ctx.fill();

        // Drifting morning cloud puffs
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.beginPath();
        ctx.arc(mx + 220, 110, 36, 0, Math.PI * 2);
        ctx.arc(mx + 250, 95, 42, 0, Math.PI * 2);
        ctx.arc(mx + 285, 110, 34, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (currentLevelNumber === 2) {
      // -----------------------------------------------------------------------
      // NIVEL 1-2: CAÑÓN DE LOS RELÁMPAGOS (Dramatic Sunset Red-Rock Canyon)
      // -----------------------------------------------------------------------
      // Dramatic sunset orange, amber & terracotta gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, canvasHeight);
      skyGrad.addColorStop(0, '#431407');
      skyGrad.addColorStop(0.32, '#7c2d12');
      skyGrad.addColorStop(0.68, '#ea580c');
      skyGrad.addColorStop(1, '#fde047');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(camX - 100, 0, canvasWidth + 200, canvasHeight);

      // Low Dusk Sun & Heat Glow
      ctx.save();
      const sunX = camX + canvasWidth * 0.28;
      const sunGrad = ctx.createRadialGradient(sunX, 140, 15, sunX, 140, 130);
      sunGrad.addColorStop(0, 'rgba(254, 240, 138, 0.95)');
      sunGrad.addColorStop(0.35, 'rgba(251, 146, 60, 0.65)');
      sunGrad.addColorStop(0.75, 'rgba(234, 88, 12, 0.25)');
      sunGrad.addColorStop(1, 'rgba(234, 88, 12, 0)');
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(sunX, 140, 130, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Distant Parallax Background: bg_lightning_canyon (0.2x speed)
      const distantParallax = camX * 0.2;
      for (let bgIdx = -1; bgIdx < 5; bgIdx++) {
        const bgX = bgIdx * canvasWidth + distantParallax * 0.5;
        drawAsset(
          ctx,
          assets['bg_lightning_canyon'],
          bgX,
          0,
          canvasWidth,
          canvasHeight,
          (c) => {
            // Fallback: Terracotta canyon mesas and bronze spires
            c.fillStyle = '#7c2d12';
            c.beginPath();
            c.moveTo(bgX, canvasHeight);
            c.lineTo(bgX, 230);
            c.lineTo(bgX + 160, 180);
            c.lineTo(bgX + 320, 240);
            c.lineTo(bgX + 540, 170);
            c.lineTo(bgX + 700, 220);
            c.lineTo(bgX + canvasWidth, 190);
            c.lineTo(bgX + canvasWidth, canvasHeight);
            c.fill();
          },
        );
      }

      // Midground Parallax Layer: Jagged Canyon Mesas & Conduit Spires (0.45x speed)
      const midParallax = camX * 0.45;
      for (let mIdx = -1; mIdx < 6; mIdx++) {
        const mx = mIdx * canvasWidth - (midParallax % canvasWidth);
        ctx.fillStyle = 'rgba(124, 45, 18, 0.55)';
        ctx.beginPath();
        ctx.moveTo(mx, canvasHeight);
        ctx.lineTo(mx + 80, 290);
        ctx.lineTo(mx + 220, 260);
        ctx.lineTo(mx + 380, 340);
        ctx.lineTo(mx + 560, 270);
        ctx.lineTo(mx + 760, 310);
        ctx.lineTo(mx + canvasWidth, 280);
        ctx.lineTo(mx + canvasWidth, canvasHeight);
        ctx.fill();

        // Bronze Conduit Spire with crackling spark
        ctx.fillStyle = '#b45309';
        ctx.fillRect(mx + 340, 200, 8, 140);
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(mx + 344, 198, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (currentLevelNumber === 3) {
      // -----------------------------------------------------------------------
      // NIVEL 1-3: RUINAS DE LA TORMENTA (Dark Tempest & Storm Ruins Exterior)
      // -----------------------------------------------------------------------
      // Deep twilight indigo/violet tempest sky
      const skyGrad = ctx.createLinearGradient(0, 0, 0, canvasHeight);
      skyGrad.addColorStop(0, '#050811');
      skyGrad.addColorStop(0.35, '#0f172a');
      skyGrad.addColorStop(0.7, '#1e1b4b');
      skyGrad.addColorStop(1, '#312e81');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(camX - 100, 0, canvasWidth + 200, canvasHeight);

      // Distant Storm Mountains (0.2x speed)
      const distantParallax = camX * 0.2;
      for (let bgIdx = -1; bgIdx < 5; bgIdx++) {
        const bgX = bgIdx * canvasWidth + distantParallax * 0.5;
        drawAsset(
          ctx,
          assets['bg_distant_storm'],
          bgX,
          0,
          canvasWidth,
          canvasHeight,
          (c) => {
            c.fillStyle = '#111827';
            c.fillRect(bgX, 0, canvasWidth, canvasHeight);
          },
        );
      }

      // Midground Ancient Temple Ruins (0.5x speed)
      const midParallax = camX * 0.5;
      for (let mIdx = -1; mIdx < 6; mIdx++) {
        const midX = mIdx * canvasWidth + midParallax * 0.2;
        drawAsset(
          ctx,
          assets['bg_mid_ruins'],
          midX,
          40,
          canvasWidth,
          canvasHeight,
          (c) => {
            c.fillStyle = 'rgba(15, 23, 42, 0.6)';
            c.fillRect(midX, 40, canvasWidth, canvasHeight);
          },
        );
      }

      // Full-Screen Lightning Thunder Flash
      if (w.lightningFlash > 0.02) {
        ctx.save();
        ctx.fillStyle = `rgba(224, 242, 254, ${w.lightningFlash * 0.65})`;
        ctx.fillRect(camX - 100, 0, canvasWidth + 200, canvasHeight);

        // Dramatic jagged lightning bolt descending from the tempest clouds
        if (w.lightningFlash > 0.4) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 3;
          ctx.shadowColor = '#00f0ff';
          ctx.shadowBlur = 18;
          ctx.beginPath();
          const boltX = camX + canvasWidth * 0.6;
          ctx.moveTo(boltX, 0);
          ctx.lineTo(boltX - 25, 110);
          ctx.lineTo(boltX + 15, 180);
          ctx.lineTo(boltX - 35, 300);
          ctx.lineTo(boltX + 10, 420);
          ctx.stroke();
        }
        ctx.restore();
      }
    } else {
      // -----------------------------------------------------------------------
      // NIVEL 1-B: CÁMARA DE LA PIRÁMIDE • EL SALÓN DEL GUARDIÁN (Interior Sanctum)
      // Auténtico Pixel Art de 32 bits: mampostería de losas de obsidiana y pilastras escalonadas.
      // CERO curvas vectoriales, CERO polígonos lisos ni gradientes radiales.
      // -----------------------------------------------------------------------
      ctx.fillStyle = '#060a14';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Muro de fondo con textura de bloques rectangulares de piedra pixelada
      const blockW = 64;
      const blockH = 32;
      ctx.fillStyle = '#0a1020';
      for (let r = 1; r < Math.ceil(440 / blockH); r++) {
        const offset = (r % 2 === 0) ? 0 : 32;
        for (let c = -1; c < Math.ceil(canvasWidth / blockW) + 1; c++) {
          const bx = c * blockW + offset;
          const by = r * blockH;
          ctx.fillRect(bx + 1, by + 1, blockW - 2, blockH - 2);
        }
      }

      // Líneas de mortero pixeladas sutiles
      ctx.fillStyle = '#04070e';
      for (let r = 1; r < Math.ceil(440 / blockH); r++) {
        ctx.fillRect(0, r * blockH, canvasWidth, 1);
      }

      // Techo ceremonial de losas rectangulares
      ctx.fillStyle = '#03050a';
      ctx.fillRect(0, 0, canvasWidth, 48);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 44, canvasWidth, 4);

      // Friso rúnico con píxeles nítidos
      ctx.fillStyle = '#38bdf8';
      for (let rx = 24; rx < canvasWidth; rx += 48) {
        ctx.fillRect(rx, 18, 4, 12);
        ctx.fillRect(rx + 8, 22, 6, 4);
      }

      // Pilastras escalonadas de fondo (Pixel art de 32 bits)
      [200, 360, 600, 760].forEach((colX) => {
        // Fuste
        ctx.fillStyle = '#0d1527';
        ctx.fillRect(colX - 16, 48, 32, 392);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(colX - 10, 48, 20, 392);
        // Capitel escalonado
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(colX - 20, 48, 40, 6);
        ctx.fillRect(colX - 24, 42, 48, 6);
        // Base escalonada
        ctx.fillRect(colX - 20, 432, 40, 4);
        ctx.fillRect(colX - 24, 436, 48, 4);
      });

      // Destello de relámpago pixelado
      if (w.lightningFlash > 0.02) {
        ctx.fillStyle = `rgba(224, 242, 254, ${w.lightningFlash * 0.5})`;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      }
    }

    // =========================================================================
    // 2. ATMOSPHERIC WEATHER PARTICLES
    // =========================================================================
    for (const part of w.weatherParticles) {
      ctx.save();
      ctx.globalAlpha = part.alpha;

      if (currentLevelNumber === 16) {
        // Stage 4-B: Multi-layered soft snowflakes constantly drifting
        ctx.fillStyle = part.color;
        ctx.shadowColor = '#a5f3fc';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(part.x, part.y, Math.max(0, part.size), 0, Math.PI * 2);
        ctx.fill();

        if (part.size > 2.2) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(part.x - 0.75, part.y - 0.75, 1.5, 1.5);
        }
      } else if (currentLevelNumber >= 5 || w.isBonusRoom) {
        // Zone 2: Luminous crystal spores floating with soft sway
        ctx.fillStyle = part.color;
        ctx.shadowColor = part.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(part.x, part.y, Math.max(0, part.size), 0, Math.PI * 2);
        ctx.fill();

        if (part.size > 2.2) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(part.x - 0.75, part.y - 0.75, 1.5, 1.5);
        }
      } else if (currentLevelNumber === 1) {
        // Level 1-1: Floating golden dandelion/spark pollen particles
        ctx.fillStyle = part.color;
        ctx.shadowColor = '#fde047';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(part.x, part.y, Math.max(0, part.size), 0, Math.PI * 2);
        ctx.fill();

        // Delicate pollen filament cross
        ctx.strokeStyle = 'rgba(254, 240, 138, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(part.x - 2.5, part.y - 2.5);
        ctx.lineTo(part.x + 2.5, part.y + 2.5);
        ctx.moveTo(part.x + 2.5, part.y - 2.5);
        ctx.lineTo(part.x - 2.5, part.y + 2.5);
        ctx.stroke();
      } else if (currentLevelNumber === 2) {
        // Level 1-2: Amber dust motes & rising heat updrafts
        ctx.fillStyle = part.color;
        ctx.shadowColor = '#f97316';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(part.x, part.y, Math.max(0, part.size), 0, Math.PI * 2);
        ctx.fill();

        if (part.size > 2.6) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(part.x - 0.75, part.y - 0.75, 1.5, 1.5);
        }
      } else {
        // Level 1-3: Dynamic slanted rain streaks falling through the storm
        ctx.strokeStyle = part.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(part.x, part.y);
        ctx.lineTo(part.x + part.vx * 0.022, part.y + part.vy * 0.022);
        ctx.stroke();
      }

      ctx.restore();
    }

    // =========================================================================
    // 3. PLATFORMS & GEOMETRY (Styled according to Level Palette & Terrain Tone)
    // =========================================================================
    for (const plat of w.platforms) {
      if (plat.broken) continue;

      if (plat.type === 'ground') {
        const groundTile = assets['tile_ground_ruins'];
        const tileSize = getConfig('tileSize') as number;
        const tilesAcross = Math.ceil(plat.width / tileSize);
        for (let t = 0; t < tilesAcross; t++) {
          const tx = plat.x + t * tileSize;
          const tw = Math.min(tileSize, plat.x + plat.width - tx);
          drawAsset(
            ctx,
            groundTile,
            tx,
            plat.y,
            tw,
            plat.height,
            (c) => {
              if (currentLevelNumber === 1) {
                c.fillStyle = '#475569';
              } else if (currentLevelNumber === 2) {
                c.fillStyle = '#9a3412';
              } else {
                c.fillStyle = '#1e293b';
              }
              c.fillRect(tx, plat.y, tw, plat.height);
            },
          );
        }

        // Apply Thematic Terrain Tone Overlays
        if (currentLevelNumber === 1) {
          // Level 1-1: Vibrant emerald moss top crest & bright slate trim
          ctx.save();
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(plat.x, plat.y, plat.width, 5);
          // Grassy moss tufts along top edge
          ctx.fillStyle = '#16a34a';
          for (let gx = 0; gx < plat.width - 6; gx += 14) {
            ctx.beginPath();
            ctx.moveTo(plat.x + gx, plat.y + 5);
            ctx.lineTo(plat.x + gx + 3, plat.y - 2);
            ctx.lineTo(plat.x + gx + 6, plat.y + 5);
            ctx.fill();
          }
          ctx.restore();
        } else if (currentLevelNumber === 2) {
          // Level 1-2: Terracotta red sandstone & copper-streaked stone
          ctx.save();
          ctx.fillStyle = '#ea580c';
          ctx.fillRect(plat.x, plat.y, plat.width, 5);
          // Copper-colored stratified veins
          ctx.fillStyle = 'rgba(251, 191, 36, 0.45)';
          ctx.fillRect(plat.x + 4, plat.y + 12, plat.width - 8, 3);
          ctx.restore();
        } else if (currentLevelNumber === 5 || w.isBonusRoom) {
          // Level 2-1 & Bonus: Amethyst cavern crystal crest
          ctx.save();
          ctx.fillStyle = '#a855f7';
          ctx.fillRect(plat.x, plat.y, plat.width, 5);
          ctx.fillStyle = 'rgba(192, 132, 252, 0.55)';
          ctx.fillRect(plat.x + 4, plat.y + 10, plat.width - 8, 3);
          for (let cx = 12; cx < plat.width - 12; cx += 28) {
            ctx.fillStyle = '#c084fc';
            ctx.fillRect(plat.x + cx, plat.y - 2, 4, 3);
          }
          ctx.restore();
        } else if (currentLevelNumber === 6) {
          // Level 2-2: Deep turquoise abyssal mineral crest
          ctx.save();
          ctx.fillStyle = '#06b6d4';
          ctx.fillRect(plat.x, plat.y, plat.width, 5);
          ctx.fillStyle = 'rgba(34, 211, 238, 0.55)';
          ctx.fillRect(plat.x + 4, plat.y + 10, plat.width - 8, 3);
          for (let cx = 14; cx < plat.width - 14; cx += 32) {
            ctx.fillStyle = '#22d3ee';
            ctx.fillRect(plat.x + cx, plat.y - 2, 3, 3);
          }
          ctx.restore();
        } else if (currentLevelNumber === 7) {
          // Level 2-3: Obsidian citadel stone with fuchsia conduit runes
          ctx.save();
          ctx.fillStyle = '#d946ef';
          ctx.fillRect(plat.x, plat.y, plat.width, 5);
          ctx.fillStyle = 'rgba(244, 114, 182, 0.6)';
          for (let rx = 16; rx < plat.width - 16; rx += 36) {
            ctx.fillRect(plat.x + rx, plat.y + 8, 5, 4);
            ctx.fillRect(plat.x + rx + 8, plat.y + 14, 3, 3);
          }
          ctx.restore();
        } else if (currentLevelNumber === 8) {
          // Level 2-B: Obsidian dragon lair floor with glowing molten magma veins
          ctx.save();
          ctx.fillStyle = '#ea580c';
          ctx.fillRect(plat.x, plat.y, plat.width, 4);
          ctx.fillStyle = 'rgba(239, 68, 68, 0.6)';
          for (let rx = 12; rx < plat.width - 12; rx += 32) {
            ctx.fillRect(plat.x + rx, plat.y + 6, 6, 3);
            ctx.fillRect(plat.x + rx + 4, plat.y + 11, 4, 3);
          }

          // Plataformas Ardientes por Aliento / Brasas del Dragón (Anti-Camping)
          const isLeftElevPlat = plat.x === 90 && plat.y === 310;
          const isRightElevPlat = plat.x === 750 && plat.y === 310;
          const heatTimer = isLeftElevPlat
            ? w.boss?.platformHeatTimerLeft || 0
            : isRightElevPlat
            ? w.boss?.platformHeatTimerRight || 0
            : 0;

          if (heatTimer > 0) {
            const isWarningPhase = heatTimer > 1.2;
            const flashTick = Math.floor(Date.now() / 90) % 2 === 0;

            if (isWarningPhase) {
              // Fase de Advertencia (1.2s): Resplandor ámbar parpadeante
              ctx.fillStyle = flashTick
                ? 'rgba(250, 204, 21, 0.65)'
                : 'rgba(249, 115, 22, 0.45)';
              ctx.fillRect(plat.x, plat.y - 4, plat.width, plat.height + 4);
              ctx.strokeStyle = '#facc15';
              ctx.lineWidth = 2;
              ctx.strokeRect(plat.x, plat.y - 4, plat.width, plat.height + 4);

              // Ticks de advertencia pixelados
              ctx.fillStyle = '#ffffff';
              for (let wx = 10; wx < plat.width; wx += 24) {
                ctx.fillRect(plat.x + wx, plat.y - 6, 4, 3);
              }
            } else {
              // Fase Ardiente Activa (1.2s): Superficie al rojo vivo y llamas
              ctx.fillStyle = 'rgba(239, 68, 68, 0.75)';
              ctx.fillRect(plat.x, plat.y - 6, plat.width, plat.height + 6);
              ctx.strokeStyle = '#ef4444';
              ctx.lineWidth = 2.5;
              ctx.strokeRect(plat.x, plat.y - 6, plat.width, plat.height + 6);

              // Cresta de fuego sobre la plataforma
              ctx.fillStyle = flashTick ? '#fde047' : '#ea580c';
              for (let fx = 6; fx < plat.width - 6; fx += 16) {
                ctx.beginPath();
                ctx.moveTo(plat.x + fx, plat.y - 4);
                ctx.lineTo(plat.x + fx + 4, plat.y - 12);
                ctx.lineTo(plat.x + fx + 8, plat.y - 4);
                ctx.fill();
              }
            }
          }
          ctx.restore();
        } else if (currentLevelNumber === 9) {
          // Level 3-1: Fortaleza de la Estratosfera (Floating basalt crags with electric cyan edge runes)
          ctx.save();
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(plat.x, plat.y, plat.width, 4);
          ctx.fillStyle = 'rgba(14, 165, 233, 0.55)';
          for (let rx = 10; rx < plat.width - 10; rx += 28) {
            ctx.fillRect(plat.x + rx, plat.y + 7, 5, 3);
            ctx.fillRect(plat.x + rx + 3, plat.y + 12, 3, 4);
          }
          ctx.restore();
        } else if (currentLevelNumber === 10) {
          // Level 3-2: La Aguja del Trueno (Bronze tower gears & crackling amber power conduits)
          ctx.save();
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(plat.x, plat.y, plat.width, 4);
          ctx.fillStyle = 'rgba(251, 191, 36, 0.5)';
          for (let rx = 12; rx < plat.width - 12; rx += 32) {
            ctx.fillRect(plat.x + rx, plat.y + 6, 6, 4);
            ctx.fillRect(plat.x + rx + 2, plat.y + 12, 4, 3);
          }
          ctx.restore();
        } else if (currentLevelNumber === 11) {
          // Level 3-3: El Santuario Celestial (Celestial marble & gold stellar rune inlays)
          ctx.save();
          ctx.fillStyle = '#818cf8';
          ctx.fillRect(plat.x, plat.y, plat.width, 4);
          ctx.fillStyle = 'rgba(254, 240, 138, 0.65)';
          for (let rx = 14; rx < plat.width - 14; rx += 34) {
            ctx.fillRect(plat.x + rx, plat.y + 6, 4, 4);
            ctx.fillRect(plat.x + rx + 8, plat.y + 10, 4, 4);
          }
          ctx.restore();
        } else if (currentLevelNumber === 12) {
          // Level 3-B: El Trono Celestial (Radiant white marble & gold filigree crest)
          ctx.save();
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(plat.x, plat.y, plat.width, 4);
          ctx.fillStyle = 'rgba(250, 204, 21, 0.7)';
          for (let rx = 12; rx < plat.width - 12; rx += 28) {
            ctx.fillRect(plat.x + rx, plat.y + 6, 6, 4);
            ctx.fillRect(plat.x + rx + 2, plat.y + 12, 3, 3);
          }
          if (plat.y === 310) {
            ctx.strokeStyle = '#facc15';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(plat.x, plat.y, plat.width, plat.height);
          }
          ctx.restore();
        } else if (currentLevelNumber === 17 || plat.isVoid) {
          // Zona 5: Obsidiana siniestra quebrada con runas escarlatas y moradas sangrantes
          ctx.save();
          ctx.fillStyle = '#e11d48';
          ctx.fillRect(plat.x, plat.y, plat.width, 4);
          ctx.fillStyle = 'rgba(168, 85, 247, 0.75)';
          ctx.fillRect(plat.x + 2, plat.y + 4, plat.width - 4, 3);
          for (let rx = 12; rx < plat.width - 12; rx += 28) {
            ctx.fillStyle = '#f43f5e';
            ctx.fillRect(plat.x + rx, plat.y + 7, 5, 4);
            ctx.fillStyle = '#c084fc';
            ctx.fillRect(plat.x + rx + 3, plat.y + 11, 3, 3);
          }
          ctx.restore();
        } else if (currentLevelNumber >= 13 || plat.isIce) {
          // Zona 4: Permafrost glacial con cresta de hielo translúcido y escarcha
          ctx.save();
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(plat.x, plat.y, plat.width, 4);
          ctx.fillStyle = 'rgba(165, 243, 252, 0.75)';
          ctx.fillRect(plat.x + 2, plat.y + 4, plat.width - 4, 3);
          // Pequeñas agujas de escarcha cristalinas en el borde
          for (let ix = 8; ix < plat.width - 8; ix += 20) {
            ctx.fillStyle = '#e0f2fe';
            ctx.fillRect(plat.x + ix, plat.y - 2, 3, 3);
          }
          if (plat.isOneWay) {
            ctx.strokeStyle = '#a5f3fc';
            ctx.lineWidth = 2;
            ctx.strokeRect(plat.x, plat.y, plat.width, 2);
            const midX = plat.x + plat.width / 2;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
            for (const off of [-12, 0, 12]) {
              ctx.beginPath();
              ctx.moveTo(midX + off, plat.y + 6);
              ctx.lineTo(midX + off + 3, plat.y + 3);
              ctx.lineTo(midX + off + 6, plat.y + 6);
              ctx.fill();
            }
          }
          ctx.restore();
        } else {
          // Level 1-3 & 1-B: Dark weathered basalt stone with glowing cyan rune glyphs
          ctx.save();
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(plat.x, plat.y, plat.width, 4);
          // Glowing cyan rune glyphs
          ctx.fillStyle = 'rgba(0, 240, 255, 0.7)';
          ctx.shadowColor = '#00f0ff';
          ctx.shadowBlur = 8;
          for (let rx = 16; rx < plat.width - 16; rx += 42) {
            ctx.fillRect(plat.x + rx, plat.y + 8, 4, 4);
            ctx.fillRect(plat.x + rx + 6, plat.y + 14, 3, 3);
          }
          ctx.restore();
        }
      } else if (plat.type === 'dynamo') {
        drawAsset(
          ctx,
          assets['tile_energy_dynamo'],
          plat.x,
          plat.y,
          plat.width,
          plat.height,
          (c) => {
            c.fillStyle = '#d97706';
            c.fillRect(plat.x, plat.y, plat.width, plat.height);
          },
        );
      } else if (plat.type === 'breakable') {
        drawAsset(
          ctx,
          assets['tile_breakable_rock'],
          plat.x,
          plat.y,
          plat.width,
          plat.height,
          (c) => {
            c.fillStyle = '#6b21a8';
            c.fillRect(plat.x, plat.y, plat.width, plat.height);
          },
        );
      } else if (plat.type === 'hazard') {
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
        ctx.fillStyle = '#fbbf24';
        for (let sp = 0; sp < plat.width; sp += 16) {
          ctx.beginPath();
          ctx.moveTo(plat.x + sp, plat.y + 12);
          ctx.lineTo(plat.x + sp + 8, plat.y);
          ctx.lineTo(plat.x + sp + 16, plat.y + 12);
          ctx.fill();
        }
      }
    }

    // 4. Heavy Arena Sealing Barriers & Landmark Structures
    // A. Monumental Ancient Storm Pyramid at the end of Level 1-3
    if (currentLevelNumber === 3 && w.pyramid) {
      const pyr = w.pyramid;
      const pyrTime = Date.now() * 0.003;
      ctx.save();

      // Ambient electric back-glow behind the pyramid apex
      const apexX = pyr.x + pyr.width / 2;
      const apexY = pyr.y;
      const apexGlow = ctx.createRadialGradient(apexX, apexY, 10, apexX, apexY, 220);
      apexGlow.addColorStop(0, 'rgba(0, 240, 255, 0.35)');
      apexGlow.addColorStop(0.5, 'rgba(56, 189, 248, 0.12)');
      apexGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = apexGlow;
      ctx.fillRect(pyr.x - 50, pyr.y - 80, pyr.width + 100, pyr.height + 100);

      // Draw the Monumental Pyramid Asset
      drawAsset(
        ctx,
        assets['structure_storm_pyramid'],
        pyr.x,
        pyr.y,
        pyr.width,
        pyr.height,
        (c) => {
          // Procedural Neo-Geo Style Step Pyramid Fallback
          c.save();
          const tiers = 5;
          const tierH = pyr.height / tiers;
          for (let t = 0; t < tiers; t++) {
            const stepInset = t * 38;
            const stepW = pyr.width - stepInset * 2;
            const stepY = pyr.y + (tiers - 1 - t) * tierH;
            c.fillStyle = t % 2 === 0 ? '#0b1120' : '#0f172a';
            c.fillRect(pyr.x + stepInset, stepY, stepW, tierH);
            c.strokeStyle = '#0284c7';
            c.lineWidth = 2;
            c.strokeRect(pyr.x + stepInset, stepY, stepW, tierH);

            c.fillStyle = 'rgba(0, 240, 255, 0.65)';
            c.shadowColor = '#00f0ff';
            c.shadowBlur = 6;
            for (let rx = pyr.x + stepInset + 12; rx < pyr.x + pyr.width - stepInset - 12; rx += 28) {
              c.fillRect(rx, stepY + 4, 4, 4);
              c.fillRect(rx + 6, stepY + 8, 3, 6);
            }
          }
          c.fillStyle = '#facc15';
          c.shadowColor = '#fbbf24';
          c.shadowBlur = 14;
          c.beginPath();
          c.moveTo(apexX, pyr.y - 14);
          c.lineTo(apexX - 24, pyr.y);
          c.lineTo(apexX + 24, pyr.y);
          c.closePath();
          c.fill();
          c.restore();
        },
      );

      // ILLUMINATED GRAND ARCHED DOORWAY AT PYRAMID BASE
      const doorX = pyr.doorX;
      const doorY = pyr.doorY;
      const doorW = pyr.doorW;
      const doorH = pyr.doorH;
      const doorCenterX = doorX + doorW / 2;

      const distToDoor = Math.hypot(
        p.x + p.width / 2 - doorCenterX,
        p.y + p.height / 2 - (doorY + doorH / 2),
      );
      const isNearDoor = distToDoor < 220;
      const doorGlowFactor = 1 + (isNearDoor ? 0.6 : 0) + Math.sin(pyrTime * 4) * 0.15;

      // Outer grand arch stone trim
      ctx.fillStyle = '#060b14';
      ctx.beginPath();
      ctx.arc(doorCenterX, doorY + 28, doorW * 0.65, Math.PI, 0);
      ctx.lineTo(doorX + doorW + 10, doorY + doorH);
      ctx.lineTo(doorX - 10, doorY + doorH);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 12 * doorGlowFactor;
      ctx.stroke();

      // Radiant portal interior light (Cyan/Gold event horizon)
      const doorGrad = ctx.createRadialGradient(
        doorCenterX,
        doorY + doorH * 0.5,
        6,
        doorCenterX,
        doorY + doorH * 0.5,
        doorW * 0.7,
      );
      doorGrad.addColorStop(0, '#ffffff');
      doorGrad.addColorStop(0.3, '#38bdf8');
      doorGrad.addColorStop(0.7, '#1e1b4b');
      doorGrad.addColorStop(1, '#020617');
      ctx.fillStyle = doorGrad;
      ctx.beginPath();
      ctx.arc(doorCenterX, doorY + 28, doorW * 0.5, Math.PI, 0);
      ctx.lineTo(doorX + doorW, doorY + doorH);
      ctx.lineTo(doorX, doorY + doorH);
      ctx.closePath();
      ctx.fill();

      // Swirling electric hieroglyphs inside the portal
      for (let s = 0; s < 3; s++) {
        const sY = doorY + 20 + s * 24 + Math.sin(pyrTime * 6 + s) * 6;
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(doorCenterX - 14, sY);
        ctx.lineTo(doorCenterX + 14, sY);
        ctx.stroke();
      }

      // Interactive Doorway Guidance Label
      ctx.save();
      const badgeY = doorY - 45 + Math.sin(pyrTime * 3) * 4;
      ctx.fillStyle = 'rgba(9, 13, 24, 0.92)';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.roundRect(doorCenterX - 110, badgeY, 220, 28, 8);
      ctx.fill();

      ctx.strokeStyle = isNearDoor ? '#facc15' : '#38bdf8';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = isNearDoor ? '#fef08a' : '#ffffff';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 6;
      ctx.fillText('✦ ENTRAR A LA PIRÁMIDE ✦', doorCenterX, badgeY + 18);
      ctx.restore();

      ctx.restore();
    }

    // A.2 Imposing Dragon Cave Gate at the end of Level 2-3 (structure_dragon_cave_gate)
    if (currentLevelNumber === 7 && w.dragonGate) {
      const dg = w.dragonGate;
      const dgTime = Date.now() * 0.003;
      ctx.save();

      // Ambient fiery/magma back-glow behind the obsidian cave mouth
      const mouthCenterX = dg.doorX + dg.doorW / 2;
      const mouthCenterY = dg.doorY + dg.doorH / 2;
      const mouthGlow = ctx.createRadialGradient(
        mouthCenterX,
        mouthCenterY,
        10,
        mouthCenterX,
        mouthCenterY,
        160,
      );
      mouthGlow.addColorStop(0, 'rgba(239, 68, 68, 0.45)');
      mouthGlow.addColorStop(0.5, 'rgba(249, 115, 22, 0.2)');
      mouthGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = mouthGlow;
      ctx.fillRect(dg.x - 40, dg.y - 40, dg.width + 80, dg.height + 60);

      // Draw authentic 32-bit pixel art asset: structure_dragon_cave_gate
      drawAsset(
        ctx,
        assets['structure_dragon_cave_gate'],
        dg.x,
        dg.y,
        dg.width,
        dg.height,
        (c) => {
          c.fillStyle = '#180505';
          c.fillRect(dg.x, dg.y, dg.width, dg.height);
          c.fillStyle = '#ea580c';
          c.fillRect(dg.doorX, dg.doorY, dg.doorW, dg.doorH);
        },
      );

      // Interactive Guidance Label
      const distToGate = Math.hypot(
        p.x + p.width / 2 - mouthCenterX,
        p.y + p.height / 2 - mouthCenterY,
      );
      const isNearGate = distToGate < 220;

      ctx.save();
      const badgeY = dg.y - 36 + Math.sin(dgTime * 3) * 3;
      ctx.fillStyle = 'rgba(9, 13, 24, 0.94)';
      ctx.shadowColor = '#ea580c';
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.roundRect(mouthCenterX - 130, badgeY, 260, 28, 8);
      ctx.fill();

      ctx.strokeStyle = isNearGate ? '#facc15' : '#ea580c';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = isNearGate ? '#fef08a' : '#fed7aa';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('✦ ENTRAR A LA GUARIDA DEL DRAGÓN ✦', mouthCenterX, badgeY + 18);
      ctx.restore();

      ctx.restore();
    }

    // A.3 Monumental Celestial Temple Gate at the end of Level 3-3 (structure_celestial_temple_gate)
    if (currentLevelNumber === 11 && w.celestialTempleGate) {
      const ctg = w.celestialTempleGate;
      const ctgTime = Date.now() * 0.003;
      ctx.save();

      // Ambient celestial astral back-glow behind the gate
      const doorCenterX = ctg.doorX + ctg.doorW / 2;
      const doorCenterY = ctg.doorY + ctg.doorH / 2;
      const gateGlow = ctx.createRadialGradient(
        doorCenterX,
        doorCenterY,
        10,
        doorCenterX,
        doorCenterY,
        180,
      );
      gateGlow.addColorStop(0, 'rgba(250, 204, 21, 0.45)');
      gateGlow.addColorStop(0.5, 'rgba(129, 140, 248, 0.22)');
      gateGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gateGlow;
      ctx.fillRect(ctg.x - 40, ctg.y - 40, ctg.width + 80, ctg.height + 60);

      // Draw authentic 32-bit pixel art asset: structure_celestial_temple_gate
      drawAsset(
        ctx,
        assets['structure_celestial_temple_gate'],
        ctg.x,
        ctg.y,
        ctg.width,
        ctg.height,
        (c) => {
          c.fillStyle = '#1e1b4b';
          c.fillRect(ctg.x, ctg.y, ctg.width, ctg.height);
          c.fillStyle = '#facc15';
          c.fillRect(ctg.doorX, ctg.doorY, ctg.doorW, ctg.doorH);
        },
      );

      // Interactive Guidance Label
      const distToGate = Math.hypot(
        p.x + p.width / 2 - doorCenterX,
        p.y + p.height / 2 - doorCenterY,
      );
      const isNearGate = distToGate < 220;

      ctx.save();
      const badgeY = ctg.y - 36 + Math.sin(ctgTime * 3) * 3;
      ctx.fillStyle = 'rgba(9, 13, 24, 0.94)';
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.roundRect(doorCenterX - 130, badgeY, 260, 28, 8);
      ctx.fill();

      ctx.strokeStyle = isNearGate ? '#facc15' : '#818cf8';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = isNearGate ? '#fef08a' : '#c7d2fe';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('✦ ENTRAR AL TRONO CELESTIAL ✦', doorCenterX, badgeY + 18);
      ctx.restore();

      ctx.restore();
    }

    // B. Boss Chamber: Arena Perimeter Walls built with authentic rock assets
    if (
      currentLevelNumber === 4 ||
      currentLevelNumber === 8 ||
      currentLevelNumber === 12 ||
      currentLevelNumber === 16 ||
      currentLevelNumber === 18 ||
      currentLevelNumber === 19
    ) {
      ctx.save();

      // Build the arena perimeter walls using authentic tile_breakable_rock & tile_ground_ruins
      const wallH = 440;
      const blockH = 32;

      // Left vertical wall pillar: x = 0 to 32
      for (let y = 0; y < wallH; y += blockH) {
        const h = Math.min(blockH, wallH - y);
        const tileAsset =
          Math.floor(y / blockH) % 2 === 0
            ? assets['tile_breakable_rock']
            : assets['tile_ground_ruins'];
        drawAsset(ctx, tileAsset, 0, y, 32, h, (c) => {
          c.fillStyle = '#0f172a';
          c.fillRect(0, y, 32, h);
        });
      }

      // Right vertical wall pillar: x = 928 to 960
      for (let y = 0; y < wallH; y += blockH) {
        const h = Math.min(blockH, wallH - y);
        const tileAsset =
          Math.floor(y / blockH) % 2 === 0
            ? assets['tile_breakable_rock']
            : assets['tile_ground_ruins'];
        drawAsset(ctx, tileAsset, 928, y, 32, h, (c) => {
          c.fillStyle = '#0f172a';
          c.fillRect(928, y, 32, h);
        });
      }

      // Decorative braziers on the rock columns (subtle ambient flame)
      const chamberFrame = Math.floor(Date.now() / 140);
      [32, 928].forEach((bx, idx) => {
        const torchX = bx === 32 ? 38 : 922;
        const torchY = 240;
        ctx.fillStyle = currentLevelNumber === 16 ? '#0369a1' : '#78350f';
        ctx.fillRect(torchX - 3, torchY, 6, 12);

        const flameOff = (chamberFrame + idx) % 3 === 0 ? -1 : 1;
        ctx.fillStyle = currentLevelNumber === 16 ? '#a5f3fc' : '#00f0ff';
        ctx.fillRect(torchX - 3, torchY - 6 + flameOff, 6, 6);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(torchX - 1, torchY - 4 + flameOff, 2, 2);
      });

      // Suelo ceremonial: Línea rúnica pixelada en el centro de la arena
      ctx.fillStyle = currentLevelNumber === 16 ? 'rgba(165, 243, 252, 0.4)' : 'rgba(56, 189, 248, 0.4)';
      ctx.fillRect(340, 440, 280, 2);
      ctx.fillStyle = currentLevelNumber === 16 ? 'rgba(56, 189, 248, 0.6)' : 'rgba(250, 204, 21, 0.6)';
      for (let rx = 360; rx <= 600; rx += 24) {
        ctx.fillRect(rx, 442, 6, 2);
      }

      ctx.restore();
    }

    // 4.C Menacing 32-Bit Pixel Art Crushing Pillars (trap_crushing_pillar)
    for (const pillar of w.crushingPillars) {
      ctx.save();
      ctx.imageSmoothingEnabled = false;

      // Heavy bronze & iron hanging chains anchoring the pillar to ceiling
      const chainX = Math.round(pillar.x + pillar.width / 2);
      const chainTop = Math.max(0, pillar.startY - 36);
      ctx.fillStyle = '#334155';
      ctx.fillRect(chainX - 3, chainTop, 6, Math.max(0, pillar.y - chainTop));
      ctx.fillStyle = '#64748b';
      for (let cy = chainTop; cy < pillar.y; cy += 12) {
        ctx.fillRect(chainX - 4, cy, 8, 4);
      }

      // Draw the pure 32-bit pixel art crushing stone pillar
      drawAsset(
        ctx,
        assets['trap_crushing_pillar'],
        pillar.x,
        pillar.y,
        pillar.width,
        pillar.height,
        (c) => {
          // Pixel Art Fallback (Obsidian carved grimace stone with runic teeth)
          c.fillStyle = '#1e1b4b';
          c.fillRect(pillar.x, pillar.y, pillar.width, pillar.height);
          c.strokeStyle = '#38bdf8';
          c.lineWidth = 2;
          c.strokeRect(pillar.x, pillar.y, pillar.width, pillar.height);
          // Eyes & grimace
          c.fillStyle = '#facc15';
          c.fillRect(pillar.x + 14, pillar.y + 24, 10, 8);
          c.fillRect(pillar.x + pillar.width - 24, pillar.y + 24, 10, 8);
          // Bottom crushing spikes
          c.fillStyle = '#94a3b8';
          for (let sp = 6; sp < pillar.width - 6; sp += 14) {
            c.fillRect(pillar.x + sp, pillar.y + pillar.height - 8, 10, 8);
          }
        },
      );

      // Dynamic electric cyan crackles along runic edges when slamming
      if (pillar.state === 'SLAM') {
        ctx.fillStyle = pillar.isVoidTeeth ? '#e11d48' : '#00f0ff';
        ctx.shadowColor = pillar.isVoidTeeth ? '#e11d48' : '#00f0ff';
        ctx.shadowBlur = 10;
        const tick = Math.floor(Date.now() / 60);
        for (let s = 0; s < 3; s++) {
          const sx = pillar.x + (s % 2 === 0 ? -2 : pillar.width);
          const sy = pillar.y + 10 + (tick * 15 + s * 20) % (pillar.height - 20);
          ctx.fillRect(sx, sy, 3, 6);
        }
      }

      if (pillar.isVoidTeeth) {
        ctx.fillStyle = '#e11d48';
        for (let sp = 4; sp < pillar.width - 4; sp += 12) {
          ctx.fillRect(pillar.x + sp, pillar.y + pillar.height - 8, 8, 10);
        }
      }

      ctx.restore();
    }

    // 4.D Rocas Glaciales Colosales Rodantes (trap_glacial_boulder en Nivel 4-2)
    for (const bld of w.boulders) {
      if (!bld.shattered && bld.active) {
        ctx.save();
        ctx.translate(Math.round(bld.x), Math.round(bld.y));
        ctx.rotate(bld.rotation);

        const d = bld.radius * 2;
        drawAsset(
          ctx,
          assets['trap_glacial_boulder'],
          -bld.radius,
          -bld.radius,
          d,
          d,
          (c) => {
            // Procedural 32-bit pixel art ice boulder fallback
            c.fillStyle = '#0284c7';
            c.beginPath();
            c.arc(0, 0, bld.radius, 0, Math.PI * 2);
            c.fill();
            c.strokeStyle = '#38bdf8';
            c.lineWidth = 4;
            c.stroke();
            c.fillStyle = '#ffffff';
            c.fillRect(-8, -8, 16, 16);
          },
        );

        ctx.restore();
      }
    }

    // 4.E Témpanos de Hielo Pegados a Plataformas (hazard_falling_icicle en Nivel 4-3)
    for (const ici of w.icicles) {
      if (ici.state !== 'SHATTERED') {
        ctx.save();
        let drawX = ici.x;
        const drawY = ici.y;

        if (ici.state === 'ATTACHED') {
          // Subtle sway with mountain wind
          const sway = Math.sin(Date.now() * 0.003 + ici.id * 1.5) * 1.5;
          drawX += sway;

          // Frost rime joint visually anchoring icicle to platform underside
          ctx.fillStyle = '#bae6fd';
          ctx.fillRect(ici.x - ici.width * 0.45, ici.platY - 2, ici.width * 0.9, 4);
          ctx.fillStyle = '#e0f2fe';
          ctx.fillRect(ici.x - ici.width * 0.3, ici.platY, ici.width * 0.6, 3);
        } else if (ici.state === 'SHAKING') {
          // Warning tremble tell before detaching
          const wobble = Math.sin(Date.now() * 0.06) * 3;
          drawX += wobble;

          // Cracking joint
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(ici.x - ici.width * 0.4, ici.platY - 1, ici.width * 0.8, 3);
        } else if (ici.state === 'FALLING') {
          // Falling speed streaks
          ctx.strokeStyle = 'rgba(165, 243, 252, 0.45)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(ici.x - 3, ici.y - 12);
          ctx.lineTo(ici.x - 3, ici.y);
          ctx.moveTo(ici.x + 3, ici.y - 12);
          ctx.lineTo(ici.x + 3, ici.y);
          ctx.stroke();
        }

        drawAsset(
          ctx,
          assets['hazard_falling_icicle'],
          drawX - ici.width / 2,
          drawY,
          ici.width,
          ici.height,
          (c) => {
            c.fillStyle = '#38bdf8';
            c.beginPath();
            c.moveTo(drawX - ici.width / 2, drawY);
            c.lineTo(drawX + ici.width / 2, drawY);
            c.lineTo(drawX, drawY + ici.height);
            c.closePath();
            c.fill();
            c.fillStyle = '#ffffff';
            c.fillRect(drawX - 2, drawY + 2, 4, ici.height * 0.6);
          },
        );

        ctx.restore();
      }
    }

    // 4.F Campamentos Seguros y Faroles de Control en la Cumbre (Nivel 4-3)
    if (currentLevelNumber === 15 && w.mountainCheckpoints) {
      for (const cp of w.mountainCheckpoints) {
        ctx.save();
        const bx = cp.beaconX;
        const by = cp.beaconY; // Platform level

        // Stone pedestal
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(bx - 14, by - 6, 28, 6);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(bx - 12, by - 6, 24, 2);

        // Ornate crystal lantern pole
        ctx.fillStyle = '#475569';
        ctx.fillRect(bx - 2, by - 46, 4, 40);
        ctx.fillStyle = '#64748b';
        ctx.fillRect(bx - 7, by - 50, 14, 5);

        // Lantern cage
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(bx - 9, by - 46, 18, 22);

        if (cp.beaconLit) {
          // Burning warm golden/amber lantern flame & radiant halo
          const flamePulse = Math.sin(Date.now() * 0.008 + cp.id) * 3;
          const haloR = 26 + flamePulse;

          const glowGrad = ctx.createRadialGradient(bx, by - 35, 3, bx, by - 35, haloR);
          glowGrad.addColorStop(0, 'rgba(254, 240, 138, 0.85)');
          glowGrad.addColorStop(0.4, 'rgba(251, 146, 60, 0.45)');
          glowGrad.addColorStop(1, 'rgba(251, 146, 60, 0)');
          ctx.fillStyle = glowGrad;
          ctx.beginPath();
          ctx.arc(bx, by - 35, haloR, 0, Math.PI * 2);
          ctx.fill();

          // Warm flame core
          ctx.fillStyle = '#fef08a';
          ctx.shadowColor = '#fbbf24';
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.ellipse(bx, by - 35, 4, 8, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ea580c';
          ctx.beginPath();
          ctx.arc(bx, by - 33, 2.5, 0, Math.PI * 2);
          ctx.fill();

          // Camp label above lantern
          ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
          ctx.strokeStyle = '#facc15';
          ctx.lineWidth = 1.5;
          const lW = 168;
          const lH = 20;
          ctx.beginPath();
          ctx.roundRect(bx - lW / 2, by - 74, lW, lH, 4);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#fef08a';
          ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`★ ${cp.name} ★`, bx, by - 60);
        } else {
          // Dormant unlit crystal awaiting player activation
          ctx.fillStyle = '#0284c7';
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.ellipse(bx, by - 35, 3, 6, 0, 0, Math.PI * 2);
          ctx.fill();

          // Activation guide label
          ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1;
          const lW = 154;
          const lH = 18;
          ctx.beginPath();
          ctx.roundRect(bx - lW / 2, by - 72, lW, lH, 4);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#38bdf8';
          ctx.font = 'bold 8px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`[ ${cp.name} ]`, bx, by - 60);
        }

        ctx.restore();
      }
    }

    // 4.F Gran Puerta de la Ciudadela Glacial en la Cumbre (Nivel 4-3)
    if (currentLevelNumber === 15 && w.glacialCitadelGate) {
      const gcg = w.glacialCitadelGate;
      const gcgTime = Date.now() * 0.003;
      ctx.save();

      // Resplandor ártico celestial detrás de la puerta de la ciudadela
      const doorCenterX = gcg.doorX + gcg.doorW / 2;
      const doorCenterY = gcg.doorY + gcg.doorH / 2;
      const citadelGlow = ctx.createRadialGradient(
        doorCenterX,
        doorCenterY,
        10,
        doorCenterX,
        doorCenterY,
        190,
      );
      citadelGlow.addColorStop(0, 'rgba(56, 189, 248, 0.55)');
      citadelGlow.addColorStop(0.5, 'rgba(165, 243, 252, 0.25)');
      citadelGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = citadelGlow;
      ctx.fillRect(gcg.x - 50, gcg.y - 50, gcg.width + 100, gcg.height + 70);

      // Render de la puerta monumental de la ciudadela glacial (structure_glacial_citadel_gate)
      drawAsset(
        ctx,
        assets['structure_glacial_citadel_gate'],
        gcg.x,
        gcg.y,
        gcg.width,
        gcg.height,
        (c) => {
          c.fillStyle = '#082f49';
          c.fillRect(gcg.x, gcg.y, gcg.width, gcg.height);
        },
      );

      // Etiqueta rúnica de interacción en la cumbre
      const distToCitadel = Math.hypot(
        p.x + p.width / 2 - doorCenterX,
        p.y + p.height / 2 - doorCenterY,
      );
      const isNearCitadel = distToCitadel < 220;

      const badgeY = gcg.y - 36 + Math.sin(gcgTime * 3) * 3;
      ctx.fillStyle = 'rgba(8, 25, 45, 0.95)';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.roundRect(doorCenterX - 140, badgeY, 280, 28, 8);
      ctx.fill();

      ctx.strokeStyle = isNearCitadel ? '#fef08a' : '#38bdf8';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = isNearCitadel ? '#fef08a' : '#e0f2fe';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('✦ ENTRAR AL SALÓN DE LA EMPERATRIZ ✦', doorCenterX, badgeY + 18);

      ctx.restore();
    }

    // 5. Jump Geysers (Vent Jump Pads)
    for (const geyser of w.geysers) {
      ctx.save();
      // Vent base
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(geyser.x, geyser.y + 8, geyser.width, geyser.height - 8);
      ctx.strokeStyle = THEME.neonCyan;
      ctx.lineWidth = 2;
      ctx.strokeRect(geyser.x, geyser.y + 8, geyser.width, geyser.height - 8);

      // Upward ionic energy jet
      const timeG = Date.now() * 0.01;
      ctx.fillStyle = 'rgba(0, 240, 255, 0.6)';
      ctx.shadowColor = THEME.neonCyan;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(geyser.x + 6, geyser.y + 8);
      ctx.lineTo(geyser.x + geyser.width / 2, geyser.y - 12 + Math.sin(timeG) * 4);
      ctx.lineTo(geyser.x + geyser.width - 6, geyser.y + 8);
      ctx.fill();
      ctx.restore();
    }

    // 5.B Genuine 32-Bit Pixel Art Secret Bonus Conduits (structure_secret_conduit)
    for (const conduit of w.bonusConduits) {
      const conduitCenterX = conduit.x + conduit.width / 2;
      const conduitCenterY = conduit.y + conduit.height / 2;
      const conduitTime = Date.now() * 0.003;
      const distToPlayer = Math.hypot(
        p.x + p.width / 2 - conduitCenterX,
        p.y + p.height / 2 - conduitCenterY,
      );
      const isNear = distToPlayer < 140;

      ctx.save();
      ctx.imageSmoothingEnabled = false;

      // Draw the genuine 32-bit pixel art asset: structure_secret_conduit
      drawAsset(
        ctx,
        assets['structure_secret_conduit'],
        conduit.x,
        conduit.y,
        conduit.width,
        conduit.height,
        (c) => {
          c.fillStyle = '#1e1b4b';
          c.fillRect(conduit.x, conduit.y, conduit.width, conduit.height);
        },
      );

      // Swirling cosmic rune aura motes around the vortex
      const runeColor = conduit.isExit
        ? '#38bdf8'
        : conduit.isBonusRoomExit
        ? '#34d399'
        : '#fbbf24';
      for (let s = 0; s < 3; s++) {
        const sAngle = conduitTime * 2.5 + (s * Math.PI * 2) / 3;
        const rad = 14 + Math.sin(conduitTime * 3 + s) * 3;
        const sx = conduitCenterX + Math.cos(sAngle) * rad;
        const sy = conduitCenterY + Math.sin(sAngle) * rad;
        ctx.fillStyle = runeColor;
        ctx.fillRect(Math.round(sx) - 1, Math.round(sy) - 1, 3, 3);
      }

      // Retro Arcade Interactive Badge when Voltlynx approaches
      if (isNear) {
        ctx.save();
        const badgeW = conduit.isExit ? 130 : 144;
        const badgeH = 20;
        const badgeX = Math.round(conduitCenterX - badgeW / 2);
        const badgeY = Math.round(conduit.y - 26 + Math.sin(conduitTime * 4) * 2);

        ctx.fillStyle = '#090d16';
        ctx.fillRect(badgeX, badgeY, badgeW, badgeH);
        ctx.strokeStyle = conduit.isExit
          ? '#38bdf8'
          : conduit.isBonusRoomExit
          ? '#34d399'
          : '#facc15';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(badgeX, badgeY, badgeW, badgeH);

        ctx.fillStyle = conduit.isExit
          ? '#bae6fd'
          : conduit.isBonusRoomExit
          ? '#a7f3d0'
          : '#fef08a';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        if (conduit.isBonusRoomExit) {
          ctx.fillText('▼ ABAJO : SALIDA AL MAPA', conduitCenterX, badgeY + 13);
        } else if (conduit.isExit) {
          ctx.fillText('✦ SALIDA DE CONDUCTO ✦', conduitCenterX, badgeY + 13);
        } else {
          ctx.fillText('▼ ABAJO : ENTRAR BONUS', conduitCenterX, badgeY + 13);
        }
        ctx.restore();
      }

      ctx.restore();
    }

    // 6. Collectibles & Items
    for (const item of w.items) {
      if (!item || item.collected) continue;
      const bobY = item.y + Math.sin(Date.now() * 0.005 + item.x) * 4;

      if (item.type === 'heart_1up') {
        // Glowing 1-Up Heart / Battery Collectible
        ctx.save();
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#ef4444';
        const hx = item.x + 14;
        const hy = bobY + 12;
        ctx.beginPath();
        ctx.moveTo(hx, hy);
        ctx.bezierCurveTo(hx - 12, hy - 12, hx - 18, hy + 6, hx, hy + 18);
        ctx.bezierCurveTo(hx + 18, hy + 6, hx + 12, hy - 12, hx, hy);
        ctx.fill();

        // 1-UP text label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('+1UP', hx, hy + 6);
        ctx.restore();
        continue;
      } else if (item.type === 'heart_hp') {
        // Glowing HP Medkit / Heart Collectible
        ctx.save();
        ctx.shadowColor = '#22c55e';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#22c55e';
        const hx = item.x + 14;
        const hy = bobY + 12;
        ctx.beginPath();
        ctx.moveTo(hx, hy);
        ctx.bezierCurveTo(hx - 10, hy - 10, hx - 15, hy + 5, hx, hy + 15);
        ctx.bezierCurveTo(hx + 15, hy + 5, hx + 10, hy - 10, hx, hy);
        ctx.fill();

        // Medical Cross symbol
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(hx - 2, hy - 1, 4, 8);
        ctx.fillRect(hx - 4, hy + 1, 8, 4);
        ctx.restore();
        continue;
      }

      let assetKey = 'item_spark_crystal';
      let wSize = 28;
      let hSize = 28;
      if (item.type === 'resonant_core') {
        assetKey = 'item_resonant_core';
        wSize = 36;
        hSize = 32;
      } else if (item.type === 'storm_needle') {
        assetKey = 'item_storm_needle';
        wSize = 20;
        hSize = 40;
      } else if (item.type === 'ion_overdrive') {
        assetKey = 'item_ion_overdrive';
        wSize = 32;
        hSize = 40;
      }

      drawAsset(
        ctx,
        assets[assetKey],
        item.x,
        bobY,
        wSize,
        hSize,
        (c) => {
          c.fillStyle = '#38bdf8';
          c.beginPath();
          c.arc(item.x + 14, bobY + 14, 12, 0, Math.PI * 2);
          c.fill();
        },
      );
    }

    // 7. Authentic Pixel Art End-of-Stage Warp Portal (structure_warp_portal)
    const showPortal =
      !w.isBonusRoom &&
      (currentLevelNumber < 3 ||
        (currentLevelNumber >= 5 && currentLevelNumber <= 7) ||
        (currentLevelNumber >= 9 && currentLevelNumber <= 10) ||
        (currentLevelNumber >= 13 && currentLevelNumber <= 14) ||
        (currentLevelNumber === 4 && w.boss && w.boss.state === 'DEAD') ||
        (currentLevelNumber === 8 && w.boss && w.boss.state === 'DEAD') ||
        (currentLevelNumber === 12 && w.boss && w.boss.state === 'DEAD') ||
        (currentLevelNumber === 16 && w.boss && w.boss.state === 'DEAD'));

    if (showPortal) {
      const portalTime = Date.now() * 0.003;
      const portalW = 84;
      const portalH = 88;
      const portalX = Math.round(w.beaconX);
      const portalY = Math.round(w.beaconY);
      const portalCenterX = portalX + portalW / 2;
      const portalCenterY = portalY + portalH / 2;

      // Subtle 1-2 pixel vertical hover oscillation for magical float
      const hoverY = Math.round(Math.sin(portalTime * 3.5) * 1.5);

      // Distance to Voltlynx for interactive proximity feedback
      const distToPlayer = Math.hypot(
        p.x + p.width / 2 - portalCenterX,
        p.y + p.height / 2 - portalCenterY,
      );
      const proximityFactor = clamp(1 - distToPlayer / 200, 0, 1);

      ctx.save();
      ctx.imageSmoothingEnabled = false;

      // A. Ground Contact Shadow & Stone Foundation under the portal base
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.fillRect(portalX + 4, portalY + portalH - 1, portalW - 8, 3);
      ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.fillRect(portalX + 8, portalY + portalH, portalW - 16, 2);

      // B. Ambient Atmospheric Back-Glow when approaching
      if (proximityFactor > 0.1) {
        ctx.save();
        ctx.fillStyle = `rgba(0, 240, 255, ${0.08 + proximityFactor * 0.18})`;
        ctx.fillRect(
          portalX - 8,
          portalY + hoverY - 8,
          portalW + 16,
          portalH + 16,
        );
        ctx.restore();
      }

      // C. Draw Authentic 32-bit Pixel Art Asset: structure_warp_portal
      drawAsset(
        ctx,
        assets['structure_warp_portal'],
        portalX,
        portalY + hoverY,
        portalW,
        portalH,
        (c) => {
          // 32-bit pixel art fallback: stepped stone archway with runes and dark cosmic core
          c.save();
          // Stone arch base & sides
          c.fillStyle = '#0f172a';
          c.fillRect(portalX, portalY + hoverY, portalW, portalH);
          c.fillStyle = '#1e293b';
          c.fillRect(portalX + 4, portalY + hoverY + 4, portalW - 8, portalH - 8);
          // Carved rune columns
          c.fillStyle = '#0284c7';
          c.fillRect(portalX + 6, portalY + hoverY + 12, 10, portalH - 24);
          c.fillRect(portalX + portalW - 16, portalY + hoverY + 12, 10, portalH - 24);
          // Swirling plasma portal opening
          c.fillStyle = '#c026d3';
          c.fillRect(portalX + 18, portalY + hoverY + 16, portalW - 36, portalH - 24);
          c.fillStyle = '#38bdf8';
          c.fillRect(portalX + 24, portalY + hoverY + 22, portalW - 48, portalH - 34);
          c.fillStyle = '#ffffff';
          c.fillRect(portalX + portalW / 2 - 3, portalY + hoverY + portalH / 2 - 3, 6, 6);
          c.restore();
        },
      );

      // D. Authentic Pixel-Art Sparks orbiting around the portal frame
      ctx.save();
      for (const sp of w.portalSparks) {
        const alpha = clamp(sp.life / sp.maxLife, 0, 1);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = sp.color;
        ctx.fillRect(
          Math.round(portalCenterX + sp.x),
          Math.round(portalCenterY + sp.y + hoverY),
          sp.size,
          sp.size,
        );
      }
      ctx.globalAlpha = 1;
      ctx.restore();

      // E. Electric Pixel Filament Crackles when Voltlynx approaches
      if (proximityFactor > 0.25) {
        ctx.save();
        ctx.fillStyle = proximityFactor > 0.6 ? '#ffffff' : '#00f0ff';
        const crackleSeed = Math.floor(Date.now() / 90);
        for (let k = 0; k < 4; k++) {
          const kx = portalCenterX + (((crackleSeed + k * 7) % 31) - 15) * 1.8;
          const ky = portalCenterY + (((crackleSeed * 3 + k * 11) % 37) - 18) * 1.8 + hoverY;
          ctx.fillRect(Math.round(kx), Math.round(ky), 3, 3);
        }
        ctx.restore();

        // F. Retro Arcade Interaction Guidance Badge
        ctx.save();
        const badgeW = 166;
        const badgeH = 22;
        const badgeX = Math.round(portalCenterX - badgeW / 2);
        const badgeY = Math.round(portalY + hoverY - 30 + Math.sin(portalTime * 4) * 2);

        ctx.fillStyle = '#090d16';
        ctx.fillRect(badgeX, badgeY, badgeW, badgeH);
        ctx.strokeStyle = proximityFactor > 0.5 ? '#facc15' : '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(badgeX, badgeY, badgeW, badgeH);

        ctx.fillStyle = proximityFactor > 0.5 ? '#fef08a' : '#38bdf8';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(
          currentLevelNumber === 4
            ? '✦ SALIDA DE LA CÁMARA ✦'
            : '✦ PORTAL DIMENSIONAL ✦',
          portalCenterX,
          badgeY + 14,
        );
        ctx.restore();
      }

      ctx.restore();
    }

    // 8. Dropped Celestial Core Fragment (Zone 1 Boss Reward - Precious Gemstone Artifact)
    if (w.celestialFragment && !w.celestialFragment.collected) {
      const frag = w.celestialFragment;
      const fragY = frag.y + Math.sin(frag.bobTimer) * 5;
      ctx.save();

      // Enticing sparkling aura and glowing pedestal illumination
      const auraGrad = ctx.createRadialGradient(frag.x, fragY, 4, frag.x, fragY, 40);
      auraGrad.addColorStop(0, 'rgba(0, 240, 255, 0.4)');
      auraGrad.addColorStop(0.5, 'rgba(250, 204, 21, 0.2)');
      auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(frag.x, fragY, 40, 0, Math.PI * 2);
      ctx.fill();

      // Swirling orbit rings of celestial starlight
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.ellipse(frag.x, fragY, 28, 10, frag.bobTimer * 0.8, 0, Math.PI * 2);
      ctx.stroke();

      // Sparkle motes dancing around the gem
      for (let s = 0; s < 4; s++) {
        const sAngle = frag.bobTimer * 1.5 + (s * Math.PI) / 2;
        const sx = frag.x + Math.cos(sAngle) * 24;
        const sy = fragY + Math.sin(sAngle) * 14;
        ctx.fillStyle = s % 2 === 0 ? '#fef08a' : '#00f0ff';
        ctx.fillRect(sx - 1.5, sy - 1.5, 3, 3);
      }

      // Draw authentic pixel art asset: item_celestial_fragment (682x701)
      const fragW = 44;
      const fragH = 46;
      drawAsset(
        ctx,
        assets['item_celestial_fragment'],
        frag.x - fragW / 2,
        fragY - fragH / 2,
        fragW,
        fragH,
        (c) => {
          c.fillStyle = '#fbbf24';
          c.beginPath();
          c.arc(frag.x, fragY, 18, 0, Math.PI * 2);
          c.fill();
        },
      );
      ctx.restore();
    }

    // 9. SUB-JEFE: LA QUIMERA ELÉCTRICA RENDERING (Dedicated Pixel Art Asset & High-Impact Presentation)
    // 9. SUB-JEFE: LA QUIMERA ELÉCTRICA RENDERING (Pixel Art Estricto de 32 bits)
    // A. Ondas Sísmicas Terrestres Pixeladas
    for (const sw of w.shockwaves) {
      ctx.save();
      const swAlpha = clamp(sw.life / sw.maxLife, 0, 1);
      ctx.globalAlpha = swAlpha;
      ctx.fillStyle = sw.color;

      const bx = Math.round(sw.x);
      const by = Math.round(sw.y);
      const bw = sw.width;
      const bh = sw.height;

      // Cresta de energía pixelada en bloques escalonados (32 bits)
      ctx.fillRect(bx, by + bh - 4, bw, 4);
      ctx.fillRect(bx + 3, by + bh - 10, bw - 6, 6);
      ctx.fillRect(bx + 6, by, bw - 12, bh - 10);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(bx + 8, by + 3, bw - 16, 5);

      if (sw.isVoidSpike) {
        ctx.fillStyle = '#e11d48';
        ctx.shadowColor = '#e11d48';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(bx + bw / 2, by - 6);
        ctx.lineTo(bx, by + bh);
        ctx.lineTo(bx + bw, by + bh);
        ctx.fill();
      }

      ctx.restore();
    }

    // 9. SUB-JEFE: LA QUIMERA ELÉCTRICA RENDERING
    if (w.boss && w.boss.state !== 'DEAD') {
      const b = w.boss;
      const isFlying =
        b.state === 'LEVITATE' ||
        b.state === 'SUPREME_POWER' ||
        b.state === 'COMBINED_BURST' ||
        b.state === 'TRIDENT_SLAM_JUMP' ||
        b.state === 'TRIDENT_LEVITATE' ||
        b.state === 'BEHEMOTH_STOMP_JUMP' ||
        (b.type === 'CELESTIAL_DEITY' && b.phase === 1) ||
        b.state === 'METEOR_ASCENT' ||
        b.state === 'METEOR_TRACK' ||
        b.state === 'METEOR_DIVE' ||
        b.state === 'CASCADE_FLOAT' ||
        b.state === 'CASCADE_SHOOT' ||
        b.state === 'LIGHTNING_COLUMNS' ||
        b.state === 'PINBALL_BOUNCE' ||
        b.state === 'CHARGE_LEAP' ||
        b.state === 'CINEMATIC_SUMMON' ||
        b.state === 'VAULT_ASCENT' ||
        b.state === 'FIREBALL_BOMBARD' ||
        b.state === 'FLYING_RETURN' ||
        b.state === 'DRAGON_DIVE_PREP' ||
        b.state === 'DRAGON_DIVE' ||
        b.state === 'PLATFORM_SWOOP_ASCENT' ||
        b.state === 'PLATFORM_SWOOP_HOLD' ||
        b.state === 'PLATFORM_SWOOP_DASH' ||
        b.state === 'AERIAL_PATROL' ||
        b.state === 'AERIAL_FLAME_CURTAIN' ||
        b.state === 'GLACIAL_GLIDE' ||
        b.state === 'DESCENDING_THRUST_JUMP';

      const hoverBob = isFlying
        ? Math.sin(b.wingFlap * 1.2) * 5
        : Math.sin(b.wingFlap * 0.5) * 2;

      const bossCenterX = Math.round(b.x + b.width / 2);
      const bossCenterY = Math.round(b.y + b.height / 2 + hoverBob);

      // -----------------------------------------------------------------------
      // A. CINEMÁTICA DE APARICIÓN: Rayo de píxeles escalonados
      // -----------------------------------------------------------------------
      if (b.state === 'CINEMATIC_SUMMON') {
        ctx.save();
        const daisX = 480;
        const beamW = 44;

        ctx.fillStyle = 'rgba(250, 204, 21, 0.4)';
        ctx.fillRect(daisX - beamW / 2, 0, beamW, 440);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(daisX - 8, 0, 16, 440);

        // Rayo zig-zag pixelado en pasos de 4px
        ctx.fillStyle = '#fde047';
        for (let y = 0; y < 440; y += 16) {
          const xOff = (Math.floor(y / 16) % 2 === 0) ? -12 : 12;
          ctx.fillRect(daisX + xOff, y, 6, 16);
        }
        ctx.restore();
      }

      // -----------------------------------------------------------------------
      // B. PATRÓN 1: RETÍCULA DE ADVERTENCIA TELEGRAFIADA (PÍXELES EN EL SUELO - SOLO QUIMERA)
      // -----------------------------------------------------------------------
      if (
        b.type === 'CHIMERA' &&
        (b.state === 'METEOR_TRACK' || b.state === 'METEOR_DIVE')
      ) {
        ctx.save();
        const retX = Math.round(b.trackTargetX);
        const isLocked = b.stateTimer <= 0.25 || b.state === 'METEOR_DIVE';

        // Guía vertical de píxeles nítidos
        ctx.fillStyle = isLocked
          ? 'rgba(239, 68, 68, 0.3)'
          : 'rgba(250, 204, 21, 0.2)';
        ctx.fillRect(retX - 20, 0, 40, 440);

        // Marcador rectangular pixelado en el suelo
        ctx.fillStyle = isLocked ? '#ef4444' : '#facc15';
        ctx.fillRect(retX - 24, 436, 48, 4);
        ctx.fillRect(retX - 24, 426, 4, 10);
        ctx.fillRect(retX + 20, 426, 4, 10);
        ctx.restore();
      }

      // Lightning Pillars Warning Markers (Relámpagos Telegrafiados con líneas rojas en el suelo)
      if (b.lightningPillars && b.lightningPillars.length > 0) {
        ctx.save();
        for (const lp of b.lightningPillars) {
          if (lp.timer > 0) {
            // Línea roja telegrafiada en el suelo y haz de advertencia
            ctx.fillStyle = 'rgba(239, 68, 68, 0.22)';
            ctx.fillRect(lp.x - lp.width / 2, 0, lp.width, 440);
            ctx.fillStyle = '#ef4444';
            ctx.shadowColor = '#ef4444';
            ctx.shadowBlur = 12;
            ctx.fillRect(lp.x - lp.width / 2, 436, lp.width, 4);
            // Marcas en los extremos
            ctx.fillRect(lp.x - lp.width / 2, 426, 4, 10);
            ctx.fillRect(lp.x + lp.width / 2 - 4, 426, 4, 10);
          } else if (lp.struck) {
            // Rayo cayendo a tierra
            ctx.fillStyle = b.type === 'GHOTUR_DEMON' ? '#ef4444' : '#facc15';
            ctx.fillRect(lp.x - 10, 0, 20, 440);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(lp.x - 4, 0, 8, 440);
          }
        }
        ctx.restore();
      }

      // Estalactitas incandescentes y Meteoritos Negros telegrafiados en caída
      if (b.stalactites && b.stalactites.length > 0) {
        ctx.save();
        for (const st of b.stalactites) {
          if (st.timer > 0) {
            // Sombra y línea de aviso en el suelo antes del impacto
            const isDarkMeteor = b.type === 'DRAGON';
            const isIceCavern = b.type === 'FROST_EMPRESS';
            ctx.fillStyle = isDarkMeteor
              ? 'rgba(239, 68, 68, 0.25)'
              : isIceCavern
              ? 'rgba(56, 189, 248, 0.22)'
              : 'rgba(239, 68, 68, 0.22)';
            ctx.fillRect(st.warningX - 14, 0, 28, 440);

            // Sombra en el suelo (aviso telegrafiado)
            ctx.fillStyle = isDarkMeteor
              ? '#ef4444'
              : isIceCavern
              ? '#38bdf8'
              : '#ef4444';
            ctx.shadowColor = isDarkMeteor ? '#ef4444' : '#38bdf8';
            ctx.shadowBlur = 10;
            ctx.fillRect(st.warningX - 18, 436, 36, 4);
            ctx.fillRect(st.warningX - 4, 432, 8, 4);
          } else if (!st.struck) {
            if (b.type === 'DRAGON') {
              // Meteorito de fuego negro y obsidiana
              ctx.fillStyle = '#0f172a';
              ctx.shadowColor = '#ea580c';
              ctx.shadowBlur = 16;
              ctx.beginPath();
              ctx.arc(st.x, st.y + st.height / 2, 16, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = '#f97316';
              ctx.beginPath();
              ctx.arc(st.x, st.y + st.height / 2, 9, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = '#fef08a';
              ctx.fillRect(st.x - 2, st.y + st.height / 2 - 2, 4, 4);
            } else if (b.type === 'FROST_EMPRESS') {
              // Estalactita glacial afilada
              ctx.fillStyle = '#a5f3fc';
              ctx.shadowColor = '#38bdf8';
              ctx.shadowBlur = 12;
              ctx.beginPath();
              ctx.moveTo(st.x - 9, st.y);
              ctx.lineTo(st.x + 9, st.y);
              ctx.lineTo(st.x, st.y + st.height);
              ctx.closePath();
              ctx.fill();
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(st.x - 2, st.y + 2, 4, st.height * 0.6);
            } else {
              // Estalactita ígnea estándar
              ctx.fillStyle = '#7c2d12';
              ctx.fillRect(st.x - 8, st.y, 16, st.height);
              ctx.fillStyle = '#f97316';
              ctx.fillRect(st.x - 5, st.y + st.height - 12, 10, 12);
              ctx.fillStyle = '#fde047';
              ctx.fillRect(st.x - 2, st.y + st.height - 5, 4, 5);
            }
          }
        }
        ctx.restore();
      }

      // -----------------------------------------------------------------------
      // C. PATRÓN 2: ORBES EN ARCO TELEDIRIGIDOS (SOLO QUIMERA)
      // -----------------------------------------------------------------------
      if (b.type === 'CHIMERA' && (b.state === 'CASCADE_FLOAT' || b.state === 'CASCADE_SHOOT')) {
        ctx.save();
        for (const orb of b.cascadeOrbs) {
          if (!orb.launched) {
            const ox = Math.round(orb.x);
            const oy = Math.round(orb.y);
            ctx.fillStyle = b.phase === 2 ? '#c084fc' : '#fbbf24';
            ctx.fillRect(ox - 3, oy - 1, 6, 2);
            ctx.fillRect(ox - 2, oy - 3, 4, 6);
            ctx.fillRect(ox - 1, oy - 4, 2, 8);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(ox - 1, oy - 1, 2, 2);
          }
        }
        ctx.restore();
      }

      // -----------------------------------------------------------------------
      // D. PATRÓN 3: TELEGRAFO DE CARGA RELÁMPAGO (SOLO QUIMERA)
      // -----------------------------------------------------------------------
      if (b.type === 'CHIMERA' && b.state === 'CHARGE_TELEGRAPH') {
        ctx.save();
        const beamDir = b.facingRight ? 1 : -1;
        const startX = b.facingRight ? b.x + b.width : b.x;
        const startY = 432;
        const length = 480;

        ctx.fillStyle = '#facc15';
        for (let x = 0; x < length; x += 18) {
          ctx.fillRect(startX + beamDir * x, startY, 10, 2);
        }
        ctx.restore();
      }

      // -----------------------------------------------------------------------
      // G. RENDERIZADO PRINCIPAL DEL JEFE
      // -----------------------------------------------------------------------
      if (b.type === 'GHOTUR_DEMON') {
        drawAnimatedGhoturDemon(ctx, b, assets, bossCenterX, bossCenterY);
      } else if (b.type === 'GHOTUR_HUMANOID') {
        drawAnimatedGhoturHumanoid(ctx, b, assets, bossCenterX, bossCenterY);
      } else if (b.type === 'FROST_EMPRESS') {
        drawAnimatedFrostEmpress(ctx, b, assets, bossCenterX, bossCenterY);
      } else if (b.type === 'CELESTIAL_DEITY') {
        drawAnimatedCelestialDeity(ctx, b, assets, bossCenterX, bossCenterY);
      } else if (b.type === 'DRAGON') {
        drawAnimatedVolcanicDragon(ctx, b, assets, bossCenterX, bossCenterY);
      } else {
        drawAnimatedElectricChimera(ctx, b, assets, bossCenterX, bossCenterY);
      }



      // -----------------------------------------------------------------------
      // H. VENTANA DE DAÑO TÁCTICA: NÚCLEO EXPUESTO (SOLO QUIMERA)
      // -----------------------------------------------------------------------
      if (b.type === 'CHIMERA' && b.state === 'VULNERABLE_STUN') {
        ctx.save();
        const weakX = bossCenterX;
        const weakY = bossCenterY - 32;
        const arrowBounce = Math.floor(Math.sin(Date.now() * 0.02) * 3);

        // Halo de chispa dorada sobre el núcleo
        ctx.fillStyle = 'rgba(254, 240, 138, 0.4)';
        ctx.fillRect(weakX - 12, weakY - 12 + arrowBounce, 24, 24);

        // Chevron pixelado nítido hacia abajo ▼
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(weakX - 6, weakY - 10 + arrowBounce, 12, 3);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(weakX - 4, weakY - 7 + arrowBounce, 8, 3);
        ctx.fillRect(weakX - 2, weakY - 4 + arrowBounce, 4, 3);
        ctx.restore();
      }
    }

    // 10. Standard Adversaries
    for (const enemy of w.enemies) {
      if (!enemy || !enemy.alive) continue;

      ctx.save();
      if (enemy.isFrostVariant) {
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 10;
      }

      if (enemy.type === 'crawler') {
        if (!enemy.facingRight) {
          ctx.translate(enemy.x + enemy.width, enemy.y);
          ctx.scale(-1, 1);
          drawAsset(
            ctx,
            assets['enemy_ground_crawler'],
            0,
            0,
            enemy.width,
            enemy.height,
            (c) => {
              c.fillStyle = enemy.isFrostVariant ? '#0284c7' : '#b45309';
              c.fillRect(0, 0, enemy.width, enemy.height);
            },
          );
        } else {
          drawAsset(
            ctx,
            assets['enemy_ground_crawler'],
            enemy.x,
            enemy.y,
            enemy.width,
            enemy.height,
            (c) => {
              c.fillStyle = enemy.isFrostVariant ? '#0284c7' : '#b45309';
              c.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
            },
          );
        }
      } else if (enemy.type === 'sky_ray') {
        if (enemy.facingRight) {
          ctx.translate(enemy.x + enemy.width, enemy.y);
          ctx.scale(-1, 1);
          drawAsset(
            ctx,
            assets['enemy_sky_ray'],
            0,
            0,
            enemy.width,
            enemy.height,
            (c) => {
              c.fillStyle = enemy.isFrostVariant ? '#0ea5e9' : '#6366f1';
              c.fillRect(0, 0, enemy.width, enemy.height);
            },
          );
        } else {
          drawAsset(
            ctx,
            assets['enemy_sky_ray'],
            enemy.x,
            enemy.y,
            enemy.width,
            enemy.height,
            (c) => {
              c.fillStyle = enemy.isFrostVariant ? '#0ea5e9' : '#6366f1';
              c.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
            },
          );
        }
      } else if (enemy.type === 'turret') {
        drawAsset(
          ctx,
          assets['enemy_energy_turret'],
          enemy.x,
          enemy.y,
          enemy.width,
          enemy.height,
          (c) => {
            c.fillStyle = enemy.isFrostVariant ? '#0369a1' : '#78350f';
            c.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
          },
        );
      } else if (enemy.type === 'golem') {
        // Gólem de Cristal Acorazado (enemy_crystal_golem)
        const isPreparingPound = (enemy.poundTimer ?? 0) <= 0.4;
        if (isPreparingPound) {
          ctx.shadowColor = enemy.isFrostVariant ? '#38bdf8' : '#c084fc';
          ctx.shadowBlur = 18;
        }

        if (enemy.facingRight) {
          ctx.translate(enemy.x + enemy.width, enemy.y);
          ctx.scale(-1, 1);
          drawAsset(
            ctx,
            assets['enemy_crystal_golem'],
            0,
            0,
            enemy.width,
            enemy.height,
            (c) => {
              c.fillStyle = enemy.isFrostVariant ? '#0284c7' : '#7e22ce';
              c.fillRect(0, 0, enemy.width, enemy.height);
            },
          );
        } else {
          drawAsset(
            ctx,
            assets['enemy_crystal_golem'],
            enemy.x,
            enemy.y,
            enemy.width,
            enemy.height,
            (c) => {
              c.fillStyle = enemy.isFrostVariant ? '#0284c7' : '#7e22ce';
              c.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
            },
          );
        }
      } else if (enemy.type === 'abyssal_shadow') {
        const shadowAlpha = !enemy.emerged
          ? 0.45 + Math.sin(Date.now() * 0.005 + enemy.id) * 0.15
          : (enemy.emergeTimer && enemy.emergeTimer > 0)
          ? clamp(1 - enemy.emergeTimer / 0.5, 0.4, 1)
          : 1.0;

        ctx.save();
        ctx.globalAlpha = shadowAlpha;

        if (!enemy.emerged) {
          ctx.shadowColor = '#e11d48';
          ctx.shadowBlur = 8;
          ctx.fillStyle = '#0f051d';
          ctx.beginPath();
          ctx.ellipse(
            enemy.x + enemy.width / 2,
            enemy.y + enemy.height - 4,
            enemy.width * 0.6,
            8,
            0,
            0,
            Math.PI * 2,
          );
          ctx.fill();

          ctx.fillStyle = '#e11d48';
          ctx.beginPath();
          ctx.ellipse(
            enemy.x + enemy.width / 2,
            enemy.y + enemy.height - 4,
            enemy.width * 0.25,
            3,
            0,
            0,
            Math.PI * 2,
          );
          ctx.fill();
        } else {
          // PROCEDURAL VISUAL DEFORMATION (Escalas y transformaciones de los 4 arquetipos)
          const v = enemy.shadowVariant || 'SPECTER';
          let scaleX = 1.0;
          let scaleY = 1.0;
          let auraColor = '#9333ea';

          if (v === 'WRAITH') {
            // Colosal (1.5x)
            scaleX = 1.5;
            scaleY = 1.5;
            auraColor = '#e11d48';
          } else if (v === 'SPECTER') {
            // Esbelta y alargada (scaleX: 0.7, scaleY: 1.6)
            scaleX = 0.7;
            scaleY = 1.6;
            auraColor = '#a855f7';
          } else if (v === 'MINI') {
            // Diminuta errática (scale: 0.6)
            scaleX = 0.6;
            scaleY = 0.6;
            auraColor = '#c084fc';
          } else {
            // Lurker: Obesa / ancha (scaleX: 1.5, scaleY: 0.88)
            scaleX = 1.5;
            scaleY = 0.88;
            auraColor = '#7e22ce';
          }

          ctx.shadowColor = auraColor;
          ctx.shadowBlur = 18;

          const cx = enemy.x + enemy.width / 2;
          const cy = enemy.y + enemy.height / 2;

          ctx.translate(cx, cy);
          if (!enemy.facingRight) {
            ctx.scale(-scaleX, scaleY);
          } else {
            ctx.scale(scaleX, scaleY);
          }

          drawAsset(
            ctx,
            assets['mob_abyssal_shadow'],
            -enemy.width / 2,
            -enemy.height / 2,
            enemy.width,
            enemy.height,
            (c) => {
              c.fillStyle = '#1e052d';
              c.fillRect(-enemy.width / 2, -enemy.height / 2, enemy.width, enemy.height);
              c.fillStyle = '#e11d48';
              c.fillRect(-enemy.width * 0.2, -enemy.height * 0.25, 6, 6);
              c.fillRect(enemy.width * 0.1, -enemy.height * 0.25, 6, 6);
            },
          );

          // Glowing spectral eyes and shadow tendrils
          const eyeFlicker = Math.sin(Date.now() * 0.01 + enemy.id) > 0 ? '#ff0055' : '#fbbf24';
          ctx.fillStyle = eyeFlicker;
          ctx.shadowColor = eyeFlicker;
          ctx.shadowBlur = 8;
          ctx.fillRect(-enemy.width * 0.16, -enemy.height * 0.18, 5, 4);
          ctx.fillRect(enemy.width * 0.08, -enemy.height * 0.18, 5, 4);
        }
        ctx.restore();
      } else if (enemy.type === 'volt_bat') {
        // Murciélago Voltaico Cristalino (enemy_volt_bat)
        const flapOffset = Math.sin(Date.now() * 0.02 + enemy.id) * 3;
        ctx.shadowColor = enemy.isFrostVariant ? '#a5f3fc' : '#38bdf8';
        ctx.shadowBlur = 10;

        if (enemy.vx > 0 || enemy.facingRight) {
          ctx.translate(enemy.x + enemy.width, enemy.y + flapOffset);
          ctx.scale(-1, 1);
          drawAsset(
            ctx,
            assets['enemy_volt_bat'],
            0,
            0,
            enemy.width,
            enemy.height,
            (c) => {
              c.fillStyle = enemy.isFrostVariant ? '#0284c7' : '#6366f1';
              c.fillRect(0, 0, enemy.width, enemy.height);
            },
          );
        } else {
          drawAsset(
            ctx,
            assets['enemy_volt_bat'],
            enemy.x,
            enemy.y + flapOffset,
            enemy.width,
            enemy.height,
            (c) => {
              c.fillStyle = enemy.isFrostVariant ? '#0284c7' : '#6366f1';
              c.fillRect(enemy.x, enemy.y + flapOffset, enemy.width, enemy.height);
            },
          );
        }
      }

      ctx.restore();

    // 10.B Resilient & Devil Mode Mob HP Bars & Mini-Commander Badges
    for (const enemy of w.enemies) {
      if (!enemy || !enemy.alive) continue;
      if (enemy.type === 'abyssal_shadow' && !enemy.emerged) continue;

      const showBar =
        difficultyRef.current === 'DEVIL' ||
        (enemy.maxHp && enemy.maxHp > 1 && enemy.hp !== undefined && enemy.hp < enemy.maxHp);

      if (showBar && enemy.maxHp) {
        ctx.save();
        const barW = Math.max(34, enemy.width);
        const barH = 5;
        const bx = enemy.x + (enemy.width - barW) / 2;
        const by = enemy.y - 12;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.fillRect(bx, by, barW, barH);
        const hpPct = clamp((enemy.hp ?? enemy.maxHp) / enemy.maxHp, 0, 1);
        ctx.fillStyle =
          enemy.isMiniCommander
            ? '#ef4444'
            : enemy.type === 'golem'
            ? '#c084fc'
            : enemy.type === 'volt_bat'
            ? '#38bdf8'
            : hpPct > 0.5
            ? '#38bdf8'
            : '#ef4444';
        ctx.fillRect(bx, by, barW * hpPct, barH);
        ctx.strokeStyle = enemy.isMiniCommander ? '#facc15' : '#475569';
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, by, barW, barH);

        // Mini-Commander label
        if (enemy.isMiniCommander) {
          ctx.fillStyle = '#fde047';
          ctx.font = 'bold 8px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`★ MINI ${enemy.miniCommanderType} ★`, enemy.x + enemy.width / 2, by - 3);
        }
        ctx.restore();
      }
    }
    }

    // 11. Projectiles
    for (const proj of w.projectiles) {
      ctx.save();
      ctx.fillStyle = proj.color;
      ctx.shadowColor = proj.color;
      ctx.shadowBlur = proj.isVoidBurst ? 16 : proj.isVoidBeam ? 18 : 10;

      if (proj.isStoneBoulder) {
        // Golem Rock / Boulder Projectile
        ctx.fillStyle = '#52525b';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, Math.max(0, proj.radius), 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#a1a1aa';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#27272a';
        ctx.fillRect(proj.x - 4, proj.y - 3, 7, 5);
        ctx.fillStyle = '#e4e4e7';
        ctx.fillRect(proj.x - 2, proj.y - 6, 4, 3);
      } else if (proj.isVoidBeam) {
        ctx.strokeStyle = proj.color;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(proj.x - (proj.vx > 0 ? 35 : -35), proj.y);
        ctx.lineTo(proj.x, proj.y);
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(proj.x - 3, proj.y - 3, 6, 6);
      } else {
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, Math.max(0, proj.radius), 0, Math.PI * 2);
        ctx.fill();

        if (proj.isVoidBurst) {
          ctx.fillStyle = '#f43f5e';
          ctx.fillRect(proj.x - 2, proj.y - 2, 4, 4);
        }
      }
      ctx.restore();
    }

    // 12. Particles
    for (const part of w.particles) {
      if (!part) continue;
      ctx.save();
      ctx.globalAlpha = Math.max(0, part.life / part.maxLife);
      ctx.fillStyle = part.color;
      ctx.beginPath();
      ctx.arc(part.x, part.y, Math.max(0, part.size), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 13. Player Protagonist Rendering (Voltlynx)
    const blinkAlpha =
      p.invulnerableTimer > 0
        ? Math.floor(Date.now() / 80) % 2 === 0
          ? 0.45
          : 0.95
        : 1.0;

    ctx.save();
    ctx.globalAlpha = blinkAlpha;
    const centerX = p.x + p.width / 2;
    const groundY = p.y + p.height;
    ctx.translate(centerX, groundY);
    ctx.scale(p.squash, p.stretch);

    if (p.isCrouching) {
      ctx.scale(1.15, 0.6);
    }
    ctx.translate(-centerX, -groundY);

    const isThunderEmpowered = p.needleTimer > 0 || hasThunderShot;
    if (p.titanTimer > 0) {
      ctx.shadowColor = '#c084fc';
      ctx.shadowBlur = 25;
    } else if (p.ionTimer > 0) {
      ctx.shadowColor = '#fef08a';
      ctx.shadowBlur = 22;
    } else if (isThunderEmpowered) {
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 20;
    } else if (p.slowTimer > 0) {
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 22;
    }

    const visualSpriteWidth = p.titanTimer > 0 ? 76 : (p.isCrouching ? 62 : 58);
    const visualSpriteHeight = p.titanTimer > 0 ? 76 : (p.isCrouching ? 46 : 58);
    const drawX = centerX - visualSpriteWidth / 2;
    const drawY = groundY - visualSpriteHeight;

    if (p.slowTimer > 0) {
      ctx.filter = 'drop-shadow(0 0 10px rgba(56, 189, 248, 0.9))';
    }
    playerSpriteRendererRef.current.draw(
      ctx,
      playerAnimStateRef.current,
      drawX,
      drawY,
      visualSpriteWidth,
      visualSpriteHeight,
      assets,
      !p.facingRight,
    );
    ctx.filter = 'none';

    // Divine Celestial Halo (Fragment 3: Avatar Reincarnation)
    if (p.isDivineAvatar) {
      ctx.save();
      const haloX = p.x + p.width / 2;
      const haloY = p.y - 12 + Math.sin(Date.now() * 0.006) * 3;
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.ellipse(haloX, haloY, 18, 6, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(haloX, haloY, 14, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Golden astral sparks
      if (Math.random() < 0.4) {
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(haloX + (Math.random() - 0.5) * 32, haloY + (Math.random() - 0.5) * 8, 3, 3);
      }
      ctx.restore();
    }

    // Visual Slowed / Freezing Frost Debuff Feedback
    if (p.slowTimer > 0) {
      ctx.save();
      // Shimmering ice crystals around Voltlynx
      ctx.strokeStyle = '#a5f3fc';
      ctx.lineWidth = 1.5;
      const fTick = Math.floor(Date.now() / 90);
      for (let ic = 0; ic < 4; ic++) {
        const icX = p.x + ((ic * 13 + fTick * 5) % p.width);
        const icY = p.y + ((ic * 11 + fTick * 7) % p.height);
        ctx.strokeRect(icX - 2, icY - 2, 4, 4);
      }

      // Small [❄ RALENTIZADO] indicator badge
      ctx.fillStyle = 'rgba(8, 47, 73, 0.9)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      const bW = 86;
      const bH = 16;
      const bX = p.x + p.width / 2 - bW / 2;
      const bY = p.y - 18;
      ctx.beginPath();
      ctx.roundRect(bX, bY, bW, bH, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#a5f3fc';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('❄ RALENTIZADO', p.x + p.width / 2, bY + 11);
      ctx.restore();
    }

    // Visual Crouching Shield Feedback
    if (p.isCrouching) {
      ctx.save();
      ctx.strokeStyle = p.titanTimer > 0 ? '#c084fc' : THEME.neonCyan;
      ctx.lineWidth = 3;
      ctx.shadowColor = p.titanTimer > 0 ? '#c084fc' : THEME.neonCyan;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      const crestY = p.y + 4;
      ctx.moveTo(p.x + 2, crestY + 6);
      ctx.quadraticCurveTo(
        p.x + p.width / 2,
        crestY - 4,
        p.x + p.width - 2,
        crestY + 6,
      );
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(p.x + p.width / 2, crestY - 3, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Visual Crackling Thunder Shot Aura
    if (isThunderEmpowered && !p.isCrouching) {
      ctx.save();
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 10;
      const nowMs = Date.now();
      for (let a = 0; a < 3; a++) {
        const arcAngle = (nowMs * 0.008 + (a * Math.PI * 2) / 3);
        const sparkRad = 28 + Math.sin(nowMs * 0.01 + a) * 5;
        const ax = p.x + p.width / 2 + Math.cos(arcAngle) * sparkRad;
        const ay = p.y + p.height / 2 + Math.sin(arcAngle) * (sparkRad * 0.8);
        ctx.beginPath();
        ctx.arc(ax, ay, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    }

    // Visual Invulnerability Shield Ring
    if (p.invulnerableTimer > 0) {
      ctx.save();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.ellipse(
        p.x + p.width / 2,
        p.y + p.height / 2,
        p.width * 0.75,
        p.height * 0.65,
        0,
        0,
        Math.PI * 2,
      );
      ctx.stroke();
      ctx.restore();
    }

    // Visual Aim-Up Targeting Sight & Sparks
    const isAimingUp = Boolean(
      inputRef.current?.actions.up ||
        mobileInputRef.current.up ||
        keyboardRef.current.up,
    );
    if (isAimingUp && !p.isCrouching) {
      ctx.save();
      const isLeft = Boolean(
        inputRef.current?.actions.left ||
          mobileInputRef.current.left ||
          keyboardRef.current.left,
      );
      const isRight = Boolean(
        inputRef.current?.actions.right ||
          mobileInputRef.current.right ||
          keyboardRef.current.right,
      );
      const aimDirX = isRight ? 1 : isLeft ? -1 : 0;
      const startX = p.x + p.width / 2;
      const startY = p.y - 4;
      const aimLength = 52;

      let endX = startX;
      let endY = startY - aimLength;
      if (aimDirX !== 0) {
        endX = startX + aimDirX * (aimLength * 0.7071);
        endY = startY - (aimLength * 0.7071);
      }

      // Targeting dashed plasma beam
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 10;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Reticle sight ring at target point
      ctx.fillStyle = '#fde047';
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(endX, endY, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Aiming spark filaments along muzzle
      const sparkTick = Math.floor(Date.now() / 70) % 3;
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(startX - 2 + (sparkTick - 1) * 3, startY - 2, 4, 4);

      ctx.restore();
    }

    ctx.restore();

    ctx.restore();

    // 14. Arcade Stage Splash Banner (Rendered in Screen-Space)
    if (w.inGameCelebrationBanner) {
      const bnr = w.inGameCelebrationBanner;
      ctx.save();
      ctx.textAlign = 'center';
      const bnrY = canvasHeight * 0.38;

      ctx.fillStyle = 'rgba(9, 11, 20, 0.94)';
      ctx.fillRect(0, bnrY - 46, canvasWidth, 92);
      ctx.strokeStyle = bnr.isBoss ? '#FFE000' : '#00F0FF';
      ctx.lineWidth = 3;
      ctx.strokeRect(0, bnrY - 46, canvasWidth, 92);

      ctx.fillStyle = '#FFE000';
      ctx.shadowColor = bnr.isBoss ? '#FF0055' : '#00F0FF';
      ctx.shadowBlur = 28;
      ctx.font = "900 42px 'Trebuchet MS', 'Arial Black', sans-serif";
      ctx.fillText(bnr.title, canvasWidth / 2, bnrY + 6);

      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 10;
      ctx.font = 'bold 14px monospace';
      ctx.fillText(bnr.subtitle, canvasWidth / 2, bnrY + 30);
      ctx.restore();
    }

    if (w.stageBannerTimer > 0 && w.stageBanner) {
      const banner = w.stageBanner;
      let alpha = 1.0;
      if (w.stageBannerTimer > 3.0) {
        alpha = clamp((3.8 - w.stageBannerTimer) / 0.8, 0, 1);
      } else if (w.stageBannerTimer < 0.8) {
        alpha = clamp(w.stageBannerTimer / 0.8, 0, 1);
      }

      ctx.save();
      ctx.globalAlpha = alpha;

      const bannerWidth = Math.min(520, canvasWidth - 40);
      const bannerHeight = 84;
      const bx = (canvasWidth - bannerWidth) / 2;
      const by = 48;

      // Drop shadow & backdrop
      ctx.fillStyle = 'rgba(9, 13, 24, 0.92)';
      ctx.shadowColor = banner.accentColor;
      ctx.shadowBlur = 24;
      ctx.beginPath();
      ctx.roundRect(bx, by, bannerWidth, bannerHeight, 14);
      ctx.fill();

      // Glowing border
      ctx.strokeStyle = banner.accentColor;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Top Tag
      ctx.fillStyle = banner.accentColor;
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      const zoneTag =
        currentLevelNumber === 17
          ? 'ZONA 5'
          : currentLevelNumber >= 13
          ? 'ZONA 4'
          : currentLevelNumber >= 9
          ? 'ZONA 3'
          : currentLevelNumber >= 5
          ? 'ZONA 2'
          : w.isBonusRoom
          ? 'BONUS'
          : 'ZONA 1';
      ctx.fillText(`✦ ${zoneTag} • ${banner.title} ✦`, canvasWidth / 2, by + 22);

      // Main arcade title
      ctx.fillStyle = '#ffffff';
      ctx.font = "900 21px 'Trebuchet MS', 'Arial Black', sans-serif";
      ctx.fillText(banner.name, canvasWidth / 2, by + 48);

      // Subtitle
      ctx.fillStyle = 'rgba(226, 232, 240, 0.85)';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(banner.subtitle, canvasWidth / 2, by + 68);

      ctx.restore();
    }

    // 14.B. Boss Cinematic Presentation Banner (Screen-Space Title Card)
    if (w.bossIntroBannerTimer > 0) {
      const alpha = clamp(w.bossIntroBannerTimer / 0.8, 0, 1);
      ctx.save();
      ctx.globalAlpha = Math.min(1, alpha);

      const bannerW = Math.min(620, canvasWidth - 40);
      const bannerH = 92;
      const bx = (canvasWidth - bannerW) / 2;
      const by = 52;

      const isFrostStage =
        currentLevelNumber === 16 || w.boss?.type === 'FROST_EMPRESS';
      const isCelestialStage =
        currentLevelNumber === 12 || w.boss?.type === 'CELESTIAL_DEITY';
      const isDragonStage =
        currentLevelNumber === 8 || w.boss?.type === 'DRAGON';

      ctx.fillStyle = 'rgba(9, 13, 24, 0.94)';
      ctx.shadowColor = isFrostStage
        ? '#38bdf8'
        : isCelestialStage
        ? '#fbbf24'
        : isDragonStage
        ? '#f97316'
        : '#ef4444';
      ctx.shadowBlur = 28;
      ctx.beginPath();
      ctx.roundRect(bx, by, bannerW, bannerH, 16);
      ctx.fill();

      ctx.strokeStyle = isFrostStage
        ? '#38bdf8'
        : isCelestialStage
        ? '#fbbf24'
        : isDragonStage
        ? '#f97316'
        : '#facc15';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Top Tag
      ctx.fillStyle = isFrostStage
        ? '#38bdf8'
        : isCelestialStage
        ? '#fbbf24'
        : isDragonStage
        ? '#f97316'
        : '#ef4444';
      ctx.font = '900 12px monospace';
      ctx.textAlign = 'center';
      ctx.shadowColor = isFrostStage
        ? '#38bdf8'
        : isCelestialStage
        ? '#fbbf24'
        : isDragonStage
        ? '#f97316'
        : '#ef4444';
      ctx.shadowBlur = 10;
      ctx.fillText(
        `⚠ ${t.warningBossTag} ⚠`,
        canvasWidth / 2,
        by + 26,
      );

      // Main Boss Title
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = isFrostStage
        ? '#38bdf8'
        : isCelestialStage
        ? '#facc15'
        : isDragonStage
        ? '#ea580c'
        : '#fbbf24';
      ctx.shadowBlur = 16;
      ctx.font = "900 19px 'Trebuchet MS', 'Arial Black', sans-serif";
      ctx.fillText(
        w.boss?.name ||
          (isFrostStage
            ? 'KRYONA - REINA DEL HIELO ETERNO'
            : isCelestialStage
            ? 'ASURA CELESTIAL - DIOS CÓSMICO DE MÚLTIPLES BRAZOS'
            : isDragonStage
            ? 'IGNISVORM - COLOSAL DRAGÓN UMBRÍO DE OBSIDIANA'
            : 'ESCARABAJO QUIMÉRICO TITÁNICO'),
        canvasWidth / 2,
        by + 56,
      );

      // Subtitle
      ctx.fillStyle = isFrostStage
        ? 'rgba(165, 243, 252, 0.95)'
        : isCelestialStage
        ? 'rgba(254, 240, 138, 0.95)'
        : isDragonStage
        ? 'rgba(254, 215, 170, 0.9)'
        : 'rgba(254, 240, 138, 0.9)';
      ctx.shadowBlur = 0;
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(
        w.boss?.subtitle ||
          (isFrostStage
            ? 'Cuarta Comandante Sombría y Consorte de Ghotur (Fragmento 4/5)'
            : isCelestialStage
            ? 'Tercer Comandante Sombrío de Ghotur (Fragmento 3/5)'
            : isDragonStage
            ? 'Segundo Comandante Sombrío de Ghotur (Fragmento 2/5)'
            : 'Primer Comandante Sombrío de Ghotur (Fragmento 1/5)'),
        canvasWidth / 2,
        by + 78,
      );

      ctx.restore();
    }

    // 14.C. Boss Fight Start Banner ("¡A LUCHAR!")
    if (w.bossFightBannerTimer > 0) {
      const alpha = clamp(w.bossFightBannerTimer / 0.6, 0, 1);
      ctx.save();
      ctx.globalAlpha = Math.min(1, alpha);
      const scale = 1 + (1.8 - w.bossFightBannerTimer) * 0.12;
      ctx.translate(canvasWidth / 2, canvasHeight * 0.38);
      ctx.scale(scale, scale);

      ctx.fillStyle = '#fde047';
      ctx.shadowColor = '#ea580c';
      ctx.shadowBlur = 24;
      ctx.font = "900 38px 'Trebuchet MS', 'Arial Black', sans-serif";
      ctx.textAlign = 'center';
      ctx.fillText(t.fightStartText, 0, 0);

      ctx.restore();
    }

      // Mario-Style Secret Pipe Sequence Screen Fade
      if (w.pipeSequence.active && w.pipeSequence.phase === 'FADE_OUT') {
        const fadeAlpha = clamp(1 - w.pipeSequence.timer / 0.25, 0, 1);
        ctx.save();
        ctx.fillStyle = `rgba(0, 0, 0, ${fadeAlpha})`;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        ctx.restore();
      }

    // 15. Cinematic Transition Level Screen Fades (Fade Out current level & Fade In new level)
    if (w.cinematic.active) {
      if (w.cinematic.phase === 'FADE_OUT_LEVEL') {
        const fadeAlpha = clamp(1 - w.cinematic.phaseTimer / 0.6, 0, 1);
        ctx.save();
        ctx.fillStyle = `rgba(0, 0, 0, ${fadeAlpha})`;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        ctx.restore();
      } else if (w.cinematic.phase === 'FADE_IN_LEVEL') {
        const fadeAlpha = clamp(w.cinematic.phaseTimer / 0.6, 0, 1);
        ctx.save();
        ctx.fillStyle = `rgba(0, 0, 0, ${fadeAlpha})`;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        ctx.restore();
      }
    }
  };

  // ---------------------------------------------------------------------------
  // GAME LOOP
  // ---------------------------------------------------------------------------
  const updateRef = useRef(update);
  const drawRef = useRef(draw);
  updateRef.current = update;
  drawRef.current = draw;

  useEffect(() => {
    let raf = 0;
    let lastRenderTime = 0;

    const loop = (time: number) => {
      raf = requestAnimationFrame(loop);

      const fps = targetFpsRef.current;
      const minInterval = 1000 / fps;

      if (lastRenderTime !== 0) {
        const elapsed = time - lastRenderTime;
        if (elapsed < minInterval - 1.5) {
          return;
        }
      }
      lastRenderTime = time;

      if (inputRef.current) {
        const cancelPressed = inputRef.current.actions.cancel;
        if (cancelPressed && !prevCancelRef.current) {
          if (gameStateRef.current.status === 'PLAYING') {
            setIsGameMenuOpen((prev) => !prev);
          } else if (gameStateRef.current.status === 'START') {
            void exitChat({});
          }
        }
        prevCancelRef.current = cancelPressed;
      }

      stepperRef.current?.(time, (dt) => updateRef.current(dt));

      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) drawRef.current(ctx);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [exitChat]);

  const prevCancelRef = useRef(false);

  const currentZoneId =
    currentLevelNumber >= 17
      ? 5
      : currentLevelNumber >= 13
      ? 4
      : currentLevelNumber >= 9
      ? 3
      : currentLevelNumber >= 5
      ? 2
      : 1;

  const isMusicPlaying = !musicMuted && !isGameMenuOpen;

  const startButtonRef = useAutoFocus<HTMLButtonElement>(
    gameState.status === 'START' && currentScene === 'SCENE_TITLE',
  );

  return (
    <div className="fixed inset-0 overflow-hidden touch-none flex flex-col items-center justify-between bg-slate-950 text-white font-sans select-none">
      {!assetsReady && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-cyan-400 font-mono">
          <Sparkles className="animate-spin mb-4" size={48} />
          <div className="text-xl tracking-wider uppercase">
            Sincronizando el Núcleo Celestial de los Orgrinianos...
          </div>
        </div>
      )}

      {/* GLOBAL CSS KEYFRAMES */}
      <style>{`
        @keyframes subtlePan {
          0% { transform: scale(1.08) translate(0%, 0%); }
          50% { transform: scale(1.15) translate(-2.5%, -1.5%); }
          100% { transform: scale(1.08) translate(2%, 1%); }
        }
      `}</style>

      {/* CRT SCANLINES & RETRO BEZEL OVERLAY (EXCLUSIVELY IN MENUS, 11% OPACITY, NEVER OBSCURING VISUALS) */}
      {crtScanlines && currentScene !== 'SCENE_GAMEPLAY' && (
        <div
          aria-hidden="true"
          style={{ opacity: 0.11 }}
          className="pointer-events-none fixed inset-0 z-35 select-none overflow-hidden">
          <div
            className="w-full h-full"
            style={{
              background:
                'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.85) 50%)',
              backgroundSize: '100% 4px',
            }}
          />
          <div
            className="absolute inset-0 shadow-[inset_0_0_80px_rgba(0,0,0,0.5)]"
          />
        </div>
      )}

      <ZoneMusicSynthesizer
        zoneId={currentZoneId}
        isPlaying={isMusicPlaying}
        isMuted={musicMuted}
        volume={0.4}
      />

      {/* FLOATING IMMERSIVE FULLSCREEN BUTTON (Subtle, elegant translucent button) */}
      <button
        onClick={toggleFullscreen}
        title={
          isFullscreen
            ? 'Salir de pantalla completa'
            : 'Pantalla completa inmersiva'
        }
        aria-label="Toggle Fullscreen"
        className="fixed top-2 right-2 md:top-2.5 md:right-3 z-40 flex items-center justify-center w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl bg-slate-900/60 hover:bg-slate-800/90 active:bg-cyan-500/40 text-cyan-300/80 hover:text-cyan-200 border border-cyan-800/50 hover:border-cyan-400 backdrop-blur-md shadow-lg transition-all active:scale-95 touch-none">
        {isFullscreen ? (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round">
            <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
          </svg>
        ) : (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round">
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
          </svg>
        )}
      </button>

      {/* DEDICATED TOP HUD BAR (Active strictly during active gameplay) */}
      <header
        className={`w-full h-11 sm:h-14 bg-slate-900/90 border-b border-cyan-900/50 flex items-center justify-between px-2 sm:px-4 md:px-6 z-20 shrink-0 backdrop-blur-md transition-opacity duration-300 ${
          currentScene !== 'SCENE_GAMEPLAY' || isCinematicActive
            ? 'opacity-0 pointer-events-none'
            : 'opacity-100'
        }`}>
        {/* Left: Form Status, Stage Name, Lives & HP Bar */}
        <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
          <div className="flex items-center gap-1 sm:gap-1.5 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded bg-slate-800 border border-cyan-800">
            <Zap
              size={13}
              className={
                isDivineAvatar
                  ? 'text-yellow-300 animate-pulse'
                  : activeForm === 'TITAN'
                  ? 'text-purple-400 animate-pulse'
                  : hasThunderShot
                  ? 'text-amber-400 animate-pulse'
                  : 'text-cyan-400'
              }
            />
            <span className="text-[10px] sm:text-xs font-black tracking-wide uppercase text-slate-200">
              {isDivineAvatar
                ? 'AVATAR'
                : activeForm === 'TITAN'
                ? 'TITÁN'
                : hasThunderShot
                ? 'TRUENO'
                : 'MOULER'}
            </span>
          </div>

          {/* Current Level Pill */}
          <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-950/70 border border-cyan-800/60 text-[11px] font-mono font-bold text-cyan-300">
            <Layers size={12} className="text-cyan-400" />
            <span>
              {worldRef.current?.isBonusRoom
                ? '★ BÓVEDA BONUS'
                : currentLevelNumber === 1
                ? '1-1: Valle de los Escombros'
                : currentLevelNumber === 2
                ? '1-2: Cañón Relámpagos'
                : currentLevelNumber === 3
                ? '1-3: Ruinas de la Tormenta'
                : currentLevelNumber === 4
                ? '1-B: Escarabajo Quimérico'
                : currentLevelNumber === 5
                ? '2-1: Entrada Catacumbas'
                : currentLevelNumber === 6
                ? '2-2: Abismo Resonante'
                : currentLevelNumber === 7
                ? '2-3: Ciudadela Subt.'
                : currentLevelNumber === 8
                ? '2-B: Dragón de Obsidiana'
                : currentLevelNumber === 9
                ? '3-1: Fortaleza Estratosfera'
                : currentLevelNumber === 10
                ? '3-2: Aguja del Trueno'
                : currentLevelNumber === 11
                ? '3-3: Santuario Celestial'
                : currentLevelNumber === 12
                ? '3-B: Dios Cósmico Asura'
                : currentLevelNumber === 13
                ? '4-1: Valle Glacial'
                : currentLevelNumber === 14
                ? '4-2: Paso Avalancha'
                : currentLevelNumber === 15
                ? '4-3: Cumbre Helada'
                : currentLevelNumber === 16
                ? '4-B: Reina de Hielo Kryona'
                : currentLevelNumber === 17
                ? '5-1: Infierno Abisal'
                : currentLevelNumber === 18
                ? '5-B: Trono de Ghotur'
                : '5-FINAL: Ghotur Titán'}
            </span>
          </div>

          {/* Celestial Core Fragments Indicator (5 Fragmentos) */}
          <div
            title={`Fragmentos del Núcleo Celestial Recuperados: ${recoveredFragments}/5`}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-950/90 border border-cyan-500/50 text-[9px] sm:text-xs font-mono font-bold">
            <span className="text-amber-400">✦</span>
            <span className="text-cyan-300">{recoveredFragments}/5</span>
            <div className="hidden sm:flex items-center gap-0.5 ml-0.5">
              {[0, 1, 2, 3, 4].map((idx) => (
                <span
                  key={idx}
                  className={`w-2 h-2 rotate-45 border ${
                    idx < recoveredFragments
                      ? 'bg-amber-400 border-amber-300 shadow-sm shadow-amber-400'
                      : 'bg-slate-800 border-slate-600'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Metal Slug Style Lives Counter (VIDAS: x15 - Sin Barra de HP) */}
          <div
            title={`Vidas restantes: ${gameState.lives ?? 15}`}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full border shadow-md font-mono ${
              isDivineAvatar
                ? 'bg-amber-950/90 border-amber-400 text-amber-200 shadow-[0_0_12px_rgba(250,204,21,0.5)]'
                : 'bg-slate-950/90 border-red-500/70 text-red-200 shadow-[0_0_10px_rgba(239,68,68,0.25)]'
            }`}>
            <Heart
              size={13}
              className={`${
                isDivineAvatar
                  ? 'text-yellow-300 fill-yellow-400 animate-pulse'
                  : 'text-red-500 fill-red-500'
              } drop-shadow`}
            />
            <span className="text-[10px] sm:text-xs font-black tracking-wider uppercase">
              {isDivineAvatar ? `${t.divineLivesLabel}:` : `${t.livesLabel}:`}
            </span>
            <span
              className={`text-xs sm:text-sm font-black ${
                isDivineAvatar ? 'text-yellow-300' : 'text-white'
              }`}>
              x{gameState.lives ?? (difficulty === 'DEVIL' ? 5 : 15)}
            </span>
          </div>
        </div>

        {/* Center: Retro 32-bit Arcade Boss HP Gauge (Pixel Art Frame & Typography) */}
        {bossHpData.active &&
        worldRef.current?.boss &&
        worldRef.current?.boss.state !== 'DEAD' ? (
          <div className="flex items-center flex-1 max-w-md md:max-w-xl mx-2 px-2.5 py-1 bg-slate-950 border-2 border-amber-400 shadow-[2px_2px_0px_#000] font-mono select-none">
            {/* Left Pixel Marker */}
            <span className="text-amber-400 text-xs font-black mr-2">▶</span>

            {/* Center Meter & Pixel Typography */}
            <div className="flex flex-col flex-1 min-w-0">
              {/* Nameplate & Subtitle Row */}
              <div className="flex items-center justify-between w-full mb-0.5 px-0.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-black text-xs md:text-sm tracking-wider uppercase text-amber-300 truncate">
                    {bossHpData.name || 'QUIMERA ELÉCTRICA'}
                  </span>
                  {bossHpData.phase === 2 && (
                    <span
                      className={`px-1 py-0 border text-[8px] font-bold uppercase animate-pulse ${
                        currentLevelNumber === 16
                          ? 'bg-cyan-950 border-cyan-400 text-cyan-200'
                          : currentLevelNumber === 12
                          ? 'bg-amber-950 border-amber-400 text-amber-200'
                          : currentLevelNumber === 8
                          ? 'bg-red-950 border-red-500 text-red-200'
                          : 'bg-purple-950 border-purple-400 text-purple-200'
                      }`}>
                      {currentLevelNumber === 16
                        ? '❄ HIELO ETERNO'
                        : currentLevelNumber === 12
                        ? '🔱 TRIDENTE SAGRADO'
                        : currentLevelNumber === 8
                        ? '🔥 FURIA ÍGNEA'
                        : '⚡ FURIA'}
                    </span>
                  )}
                </div>

                <div className="text-[10px] md:text-xs font-bold text-amber-200 tracking-tight shrink-0 ml-2">
                  <span>{bossHpData.isIntro ? bossHpData.displayedHp : bossHpData.hp}</span>
                  <span className="text-slate-400">/{bossHpData.maxHp} HP</span>
                </div>
              </div>

              {/* Crisp 32-bit Rectangular Pixel Health Bar with Inset Border */}
              <div className="relative w-full h-3 bg-slate-900 border border-slate-700 overflow-hidden flex items-center">
                {/* Ruby Red Lag Drain Bar */}
                <div
                  className="absolute top-0 bottom-0 left-0 bg-rose-600 transition-all duration-300"
                  style={{
                    width: `${Math.max(
                      0,
                      Math.min(100, (bossHpData.displayedHp / bossHpData.maxHp) * 100),
                    )}%`,
                  }}
                />

                {/* Foreground Active HP Bar */}
                <div
                  className={`relative h-full transition-all duration-100 ${
                    bossHpData.isHurt ? 'brightness-150 contrast-125' : ''
                  } ${
                    currentLevelNumber === 16
                      ? bossHpData.phase === 2
                        ? 'bg-cyan-300'
                        : 'bg-sky-400'
                      : currentLevelNumber === 12
                      ? bossHpData.phase === 2
                        ? 'bg-amber-300'
                        : 'bg-indigo-400'
                      : bossHpData.phase === 2
                      ? currentLevelNumber === 8
                        ? 'bg-red-500'
                        : 'bg-purple-400'
                      : currentLevelNumber === 8
                      ? 'bg-amber-400'
                      : 'bg-cyan-400'
                  }`}
                  style={{
                    width: `${Math.max(
                      0,
                      Math.min(
                        100,
                        ((bossHpData.isIntro ? bossHpData.displayedHp : bossHpData.hp) /
                          bossHpData.maxHp) *
                          100,
                      ),
                    )}%`,
                  }}
                />

                {/* Pixel Grid Segment Ticks every 10% */}
                <div className="absolute inset-0 flex justify-between pointer-events-none opacity-40">
                  {Array.from({length: 9}).map((_, i) => (
                    <span key={i} className="w-[1px] h-full bg-slate-950" />
                  ))}
                </div>
              </div>
            </div>

            {/* Right Pixel Marker */}
            <span className="text-amber-400 text-xs font-black ml-2">◀</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 md:gap-4">
            {(hasThunderShot ||
              (worldRef.current?.player?.needleTimer ?? 0) > 0) && (
              <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/80 text-amber-300 text-xs font-bold shadow animate-pulse">
                <Zap size={13} className="text-amber-400" />
                <span>RAYO [L/J/X]</span>
              </div>
            )}

            <div className="flex items-center gap-1 text-xs md:text-sm font-bold text-cyan-300">
              <Sparkles size={14} className="text-yellow-400" />
              <span>{crystalsCount}/100</span>
            </div>

            {/* FRAGMENT 2: LLAMARADA VOLCÁNICA (DRAGON FLAME) */}
            {recoveredFragments >= 2 && (
              <div
                title="Llamarada Volcánica: Cono masivo de fuego perforador (25 Maná) [Teclas E / O / R o Botón F]"
                className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-orange-950 to-red-950 border border-orange-500 text-[10px] font-bold text-orange-300 shadow">
                <span>🔥 LLAMARADA [E/O]</span>
              </div>
            )}

            {/* FRAGMENT 4: FLASH-STEP COOLDOWN INDICATOR */}
            {recoveredFragments >= 4 && (
              <div
                title="Desplazamiento Espectral Instantáneo: Teletransporte + Inmunidad (40 Maná) [Arriba+Dash o Q]"
                className={`hidden md:flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-mono font-bold ${
                  flashStepCooldownDisplay > 0
                    ? 'bg-slate-900 border-slate-700 text-slate-400'
                    : 'bg-cyan-950 border-cyan-400 text-cyan-200 shadow animate-pulse'
                }`}>
                <span>❄ FLASH-STEP:</span>
                <span>
                  {flashStepCooldownDisplay > 0
                    ? `${flashStepCooldownDisplay.toFixed(1)}s`
                    : 'LISTO'}
                </span>
              </div>
            )}

            {/* Mana Capacity Bar (Expands dynamically up to 200) */}
            <div
              title={`Energía de Éter: ${Math.round(energyMana)} / ${maxManaCapacity}`}
              className="hidden md:flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-950 border border-cyan-900 text-[10px] font-mono text-cyan-300">
              <span className="text-cyan-400 font-bold">{t.manaLabel}</span>
              <div className="w-16 h-2 bg-slate-900 rounded-full p-0.5 border border-cyan-950 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-150"
                  style={{
                    width: `${Math.min(
                      100,
                      (energyMana / maxManaCapacity) * 100,
                    )}%`,
                  }}
                />
              </div>
              <span className="text-[9px] text-slate-400">
                {Math.round(energyMana)}/{maxManaCapacity}
              </span>
            </div>

            <div className="text-xs md:text-sm font-mono font-bold text-amber-400">
              {formatTime(gameState.timer ?? 300)}
            </div>
          </div>
        )}

        {/* Right: Score & Menu Trigger Button */}
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
          <div className="text-[10px] sm:text-xs md:text-sm font-bold tracking-tight text-slate-300">
            Score: <span className="text-cyan-400">{gameState.score}</span>
          </div>

          {/* FPS toggle hidden on mobile HUD to reduce clutter, preserved in Pause Menu */}
          <button
            onClick={() => {
              gameAudio.playCrispClick();
              setTargetFps((prev) => (prev === 60 ? 30 : 60));
            }}
            title="Toggle Target Framerate (60 FPS / 30 FPS)"
            aria-label="Toggle Target Framerate"
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/90 border border-cyan-700/60 hover:border-cyan-400 text-cyan-300 text-xs font-mono font-bold active:scale-95 transition-all min-h-[36px]">
            <Activity
              size={13}
              className={targetFps === 60 ? 'text-cyan-400' : 'text-amber-400'}
            />
            <span>{targetFps} FPS</span>
          </button>

          <button
            onClick={() => {
              gameAudio.playCrispClick();
              (window as any).toggleFullScreenLandscape?.();
            }}
            title="Pantalla Completa"
            aria-label="Toggle Fullscreen"
            className="flex items-center gap-1 px-1.5 sm:px-2.5 py-1 rounded bg-cyan-950/80 border border-cyan-700 hover:bg-cyan-900 active:scale-95 transition-all text-cyan-300 text-[10px] sm:text-xs font-bold shrink-0">
            <Maximize size={13} />
            <span className="hidden md:inline">PANTALLA</span>
          </button>

          <button
            onClick={() => {
              gameAudio.playCrispClick();
              setIsGameMenuOpen(true);
            }}
            aria-label="Open Menu"
            className="flex items-center gap-1 px-2 sm:px-3 py-1 rounded bg-[#FF0055] hover:bg-[#ff3377] active:scale-95 transition-all text-white font-mono text-[10px] sm:text-xs font-black shrink-0 border border-black shadow-[1.5px_1.5px_0_#000]">
            <Menu size={13} />
            <span>MENU</span>
          </button>
        </div>
      </header>

      {/* GAME CANVAS CONTAINER & ERGONOMIC TOUCH OVERLAY */}
      <main className="flex-1 w-full min-h-0 relative flex items-center justify-center bg-slate-950 overflow-hidden select-none">
        {assetsReady && (
          <canvas
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              aspectRatio: `${canvasWidth} / ${canvasHeight}`,
              imageRendering: 'pixelated',
              touchAction: 'none',
            }}
            className="block max-w-full max-h-full drop-shadow-2xl"
          />
        )}

        {/* ERGONOMIC RETRO MOBILE TOUCH CONTROLS (Active strictly on touch/mobile devices during gameplay) */}
        {showTouchControls &&
          gameState.status === 'PLAYING' &&
          !isGameMenuOpen &&
          !isCinematicActive && (
            <div className="fixed inset-0 pointer-events-none z-30 select-none overflow-hidden touch-none">
              {/* Left: Ergonomic Virtual D-Pad (Positioned safely with safe-area insets) */}
              <div
                style={{
                  left: 'calc(16px + env(safe-area-inset-left, 0px))',
                  bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
                }}
                className="absolute pointer-events-auto touch-none select-none w-40 h-40 flex items-center justify-center">
                {/* Center decorative hub */}
                <div className="w-10 h-10 rounded-full bg-white/[0.08] border border-white/15 flex items-center justify-center pointer-events-none">
                  <div className="w-3 h-3 rounded-full bg-cyan-400/40" />
                </div>

                {/* UP Button (Aim Up) */}
                <button
                  onPointerDown={(e) => handleTouchDown('up', e)}
                  onPointerUp={(e) => handleTouchUp('up', e)}
                  onPointerCancel={(e) => handleTouchUp('up', e)}
                  aria-label="Up / Aim Up"
                  className={`absolute top-0 left-1/2 -translate-x-1/2 w-12 h-12 min-w-[48px] min-h-[48px] rounded-full flex flex-col items-center justify-center transition-all ${
                    touchButtons.up
                      ? 'bg-cyan-400/50 border-2 border-cyan-300 text-cyan-100 shadow-[0_0_16px_rgba(0,240,255,0.7)] scale-95'
                      : 'bg-slate-900/60 hover:bg-slate-800/80 border border-cyan-500/40 text-white/90 shadow-[0_0_10px_rgba(0,240,255,0.15)]'
                  } backdrop-blur-md touch-none`}>
                  <span className="text-base font-black leading-none">▲</span>
                  <span className="text-[8px] font-black tracking-tight leading-none text-cyan-300">
                    AIM
                  </span>
                </button>

                {/* DOWN Button (Duck / Crouch) */}
                <button
                  onPointerDown={(e) => handleTouchDown('down', e)}
                  onPointerUp={(e) => handleTouchUp('down', e)}
                  onPointerCancel={(e) => handleTouchUp('down', e)}
                  aria-label="Down / Duck"
                  className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-12 min-w-[48px] min-h-[48px] rounded-full flex flex-col items-center justify-center transition-all ${
                    touchButtons.down
                      ? 'bg-cyan-400/50 border-2 border-cyan-300 text-cyan-100 shadow-[0_0_16px_rgba(0,240,255,0.7)] scale-95'
                      : 'bg-slate-900/60 hover:bg-slate-800/80 border border-cyan-500/40 text-white/90 shadow-[0_0_10px_rgba(0,240,255,0.15)]'
                  } backdrop-blur-md touch-none`}>
                  <span className="text-base font-black leading-none">▼</span>
                  <span className="text-[8px] font-black tracking-tight leading-none text-cyan-300">
                    DUCK
                  </span>
                </button>

                {/* LEFT Button */}
                <button
                  onPointerDown={(e) => handleTouchDown('left', e)}
                  onPointerUp={(e) => handleTouchUp('left', e)}
                  onPointerCancel={(e) => handleTouchUp('left', e)}
                  aria-label="Left"
                  className={`absolute left-0 top-1/2 -translate-y-1/2 w-12 h-12 min-w-[48px] min-h-[48px] rounded-full flex items-center justify-center transition-all ${
                    touchButtons.left
                      ? 'bg-cyan-400/50 border-2 border-cyan-300 text-cyan-100 shadow-[0_0_16px_rgba(0,240,255,0.7)] scale-95'
                      : 'bg-slate-900/60 hover:bg-slate-800/80 border border-cyan-500/40 text-white/90 shadow-[0_0_10px_rgba(0,240,255,0.15)]'
                  } backdrop-blur-md touch-none`}>
                  <span className="text-lg font-black leading-none">◀</span>
                </button>

                {/* RIGHT Button */}
                <button
                  onPointerDown={(e) => handleTouchDown('right', e)}
                  onPointerUp={(e) => handleTouchUp('right', e)}
                  onPointerCancel={(e) => handleTouchUp('right', e)}
                  aria-label="Right"
                  className={`absolute right-0 top-1/2 -translate-y-1/2 w-12 h-12 min-w-[48px] min-h-[48px] rounded-full flex items-center justify-center transition-all ${
                    touchButtons.right
                      ? 'bg-cyan-400/50 border-2 border-cyan-300 text-cyan-100 shadow-[0_0_16px_rgba(0,240,255,0.7)] scale-95'
                      : 'bg-slate-900/60 hover:bg-slate-800/80 border border-cyan-500/40 text-white/90 shadow-[0_0_10px_rgba(0,240,255,0.15)]'
                  } backdrop-blur-md touch-none`}>
                  <span className="text-lg font-black leading-none">▶</span>
                </button>
              </div>

              {/* Right: Ergonomic Action Diamond (Y = Disparo, A = Salto, B = Dash, F = Fuego) */}
              <div
                style={{
                  right: 'calc(16px + env(safe-area-inset-right, 0px))',
                  bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
                }}
                className="absolute pointer-events-auto touch-none select-none w-40 h-40 flex items-center justify-center">
                {/* Center decorative hub */}
                <div className="w-10 h-10 rounded-full bg-white/[0.08] border border-white/15 flex items-center justify-center pointer-events-none">
                  <div className="w-3 h-3 rounded-full bg-amber-400/40" />
                </div>

                {/* Q Button: Flash-Step Teleport (Fragment 4) - Floating on top-left of diamond */}
                {recoveredFragments >= 4 && (
                  <button
                    onPointerDown={(e) => handleTouchDown('flashStep', e)}
                    onPointerUp={(e) => handleTouchUp('flashStep', e)}
                    onPointerCancel={(e) => handleTouchUp('flashStep', e)}
                    aria-label="Q Button (Flash-Step)"
                    className={`absolute -top-2 -left-2 w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex flex-col items-center justify-center transition-all ${
                      touchButtons.flashStep
                        ? 'bg-cyan-300/70 border-2 border-white text-black shadow-[0_0_20px_rgba(56,189,248,0.9)] scale-95'
                        : 'bg-cyan-950/70 hover:bg-cyan-900/80 border-2 border-cyan-400/80 text-cyan-200 shadow-[0_0_12px_rgba(56,189,248,0.4)]'
                    } backdrop-blur-md touch-none`}>
                    <span className="text-xs font-black leading-none">Q</span>
                    <span className="text-[7px] font-black tracking-tight text-cyan-300">
                      FLASH
                    </span>
                  </button>
                )}

                {/* TOP: Y Button - Disparo / Thunder Shot */}
                <button
                  onPointerDown={(e) => handleTouchDown('thunder', e)}
                  onPointerUp={(e) => handleTouchUp('thunder', e)}
                  onPointerCancel={(e) => handleTouchUp('thunder', e)}
                  aria-label="Y Button (Disparo / Rayo)"
                  className={`absolute top-0 left-1/2 -translate-x-1/2 w-12 h-12 min-w-[48px] min-h-[48px] rounded-full flex flex-col items-center justify-center transition-all ${
                    touchButtons.thunder
                      ? 'bg-amber-400/70 border-2 border-amber-300 text-amber-100 shadow-[0_0_20px_rgba(251,191,36,0.9)] scale-95'
                      : 'bg-slate-900/60 hover:bg-slate-800/80 border-2 border-amber-400/70 text-amber-200 shadow-[0_0_12px_rgba(251,191,36,0.3)]'
                  } backdrop-blur-md touch-none`}>
                  <span className="text-xs font-black leading-none">Y</span>
                  <span className="text-[7px] font-black tracking-tight text-amber-300">
                    DISPARO
                  </span>
                </button>

                {/* BOTTOM: A Button - Salto */}
                <button
                  onPointerDown={(e) => handleTouchDown('jump', e)}
                  onPointerUp={(e) => handleTouchUp('jump', e)}
                  onPointerCancel={(e) => handleTouchUp('jump', e)}
                  aria-label="A Button (Salto)"
                  className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-12 min-w-[48px] min-h-[48px] rounded-full flex flex-col items-center justify-center transition-all ${
                    touchButtons.jump
                      ? 'bg-cyan-400/70 border-2 border-cyan-200 text-cyan-950 shadow-[0_0_24px_rgba(0,240,255,0.9)] scale-95'
                      : 'bg-cyan-950/70 hover:bg-cyan-900/80 border-2 border-cyan-400 text-cyan-200 shadow-[0_0_16px_rgba(0,240,255,0.4)]'
                  } backdrop-blur-md touch-none`}>
                  <span className="text-sm font-black leading-none">A</span>
                  <span className="text-[9px] font-black tracking-tight text-cyan-300">
                    SALTO
                  </span>
                </button>

                {/* LEFT: B Button - Dash / Sprint */}
                <button
                  onPointerDown={(e) => handleTouchDown('dash', e)}
                  onPointerUp={(e) => handleTouchUp('dash', e)}
                  onPointerCancel={(e) => handleTouchUp('dash', e)}
                  aria-label="B Button (Dash / Sprint)"
                  className={`absolute left-0 top-1/2 -translate-y-1/2 w-12 h-12 min-w-[48px] min-h-[48px] rounded-full flex flex-col items-center justify-center transition-all ${
                    touchButtons.dash
                      ? 'bg-purple-500/60 border-2 border-purple-300 text-purple-100 shadow-[0_0_20px_rgba(168,85,247,0.85)] scale-95'
                      : 'bg-slate-900/60 hover:bg-slate-800/80 border-2 border-purple-400/60 text-purple-200 shadow-[0_0_12px_rgba(168,85,247,0.25)]'
                  } backdrop-blur-md touch-none`}>
                  <span className="text-xs font-black leading-none">B</span>
                  <span className="text-[8px] font-black tracking-tight text-purple-300">
                    DASH
                  </span>
                </button>

                {/* RIGHT: F Button - Fuego / Llamarada */}
                <button
                  onPointerDown={(e) => handleTouchDown('flame', e)}
                  onPointerUp={(e) => handleTouchUp('flame', e)}
                  onPointerCancel={(e) => handleTouchUp('flame', e)}
                  aria-label="F Button (Llamarada Volcánica)"
                  className={`absolute right-0 top-1/2 -translate-y-1/2 w-12 h-12 min-w-[48px] min-h-[48px] rounded-full flex flex-col items-center justify-center transition-all ${
                    touchButtons.flame
                      ? 'bg-orange-500/70 border-2 border-orange-300 text-orange-100 shadow-[0_0_20px_rgba(249,115,22,0.9)] scale-95'
                      : 'bg-orange-950/60 hover:bg-orange-900/80 border-2 border-orange-500/70 text-orange-200 shadow-[0_0_12px_rgba(249,115,22,0.3)]'
                  } backdrop-blur-md touch-none`}>
                  <span className="text-xs font-black leading-none">F</span>
                  <span className="text-[7px] font-black tracking-tight text-orange-300">
                    FUEGO
                  </span>
                </button>
              </div>
            </div>
          )}
      </main>

      {/* VISUAL NOVEL STORY PROLOGUE (ACCESSED VIA SCENE_PROLOGUE / SCENE_STORY) */}

      {/* 90s ARCADE SECTOR LOADING SCREEN */}
      {arcadeLoading.active && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-between p-6 md:p-10 bg-slate-950/95 backdrop-blur-xl text-white select-none animate-fadeIn">
          {/* Top Arcade Header */}
          <div className="w-full flex items-center justify-between border-b-2 border-cyan-500/40 pb-3">
            <div className="flex items-center gap-2 font-mono text-xs md:text-sm text-cyan-300 font-black tracking-widest uppercase">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              <span>ANDYCROW GAMES ARCADE SYSTEM • 2026</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-amber-300">
              <span className="animate-pulse">CREDIT 01</span>
              <span>•</span>
              <span className="text-cyan-400 font-bold">
                STAGE{' '}
                {
                  CHAPTER_ZONES.flatMap((z) => z.levels).find(
                    (l) => l.number === arcadeLoading.level,
                  )?.code || arcadeLoading.level
                }
              </span>
            </div>
          </div>

          {/* Central Card with Zone Artwork & Title */}
          {(() => {
            const currentLevelItem =
              CHAPTER_ZONES.flatMap((z) => z.levels).find(
                (l) => l.number === arcadeLoading.level,
              ) || CHAPTER_ZONES[0].levels[0];
            const currentZoneItem =
              CHAPTER_ZONES.find((z) => z.id === currentLevelItem.zoneId) ||
              CHAPTER_ZONES[0];

            return (
              <div className="w-full max-w-xl flex flex-col items-center text-center my-auto">
                {/* Zone Crest Badge */}
                <div
                  className="px-4 py-1 rounded-full border mb-3 text-xs font-mono font-black uppercase tracking-wider shadow-lg"
                  style={{
                    borderColor: currentZoneItem.glowColor,
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    color: currentZoneItem.glowColor,
                    boxShadow: `0 0 15px ${currentZoneItem.glowColor}40`,
                  }}>
                  ✦ {currentZoneItem.code}: {currentZoneItem.name} ✦
                </div>

                {/* Thumbnail Preview Container */}
                <div
                  className="relative w-72 md:w-96 h-40 md:h-48 rounded-2xl overflow-hidden border-2 shadow-2xl mb-4 bg-slate-900 flex items-center justify-center"
                  style={{
                    borderColor: currentZoneItem.glowColor,
                    boxShadow: `0 0 25px ${currentZoneItem.glowColor}50`,
                  }}>
                  {assets[currentLevelItem.bgAsset] ? (
                    <img
                      src={ASSETS_MANIFEST[currentLevelItem.bgAsset]}
                      alt={currentLevelItem.name}
                      className="w-full h-full object-cover scale-105 filter brightness-90 contrast-110"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-950 flex items-center justify-center">
                      <Sparkles size={36} className="text-cyan-400 animate-pulse" />
                    </div>
                  )}
                  {/* Scanlines inside thumbnail */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background:
                        'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.35) 50%)',
                      backgroundSize: '100% 4px',
                    }}
                  />
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono font-bold text-amber-300 border border-amber-400/50">
                    {currentLevelItem.isBoss
                      ? `⚠ JEFE: ${currentLevelItem.bossName}`
                      : 'SECTOR EXPLORACIÓN'}
                  </div>
                </div>

                {/* Level Title & Subtitle */}
                <h2 className="text-2xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-200 to-amber-300 tracking-tight mb-1">
                  NIVEL {currentLevelItem.code}: {currentLevelItem.name.toUpperCase()}
                </h2>
                <p className="text-xs md:text-sm text-cyan-200/80 max-w-md italic mb-5">
                  "{currentLevelItem.subtitle}"
                </p>

                {/* Stylized Arcade Progress Bar */}
                <div className="w-full max-w-md flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono font-bold text-cyan-300">
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                      SINCRONIZANDO SECTOR...
                    </span>
                    <span>{arcadeLoading.progress}%</span>
                  </div>
                  <div className="w-full h-3.5 bg-slate-900 border-2 border-cyan-500/70 rounded-full p-0.5 shadow-inner overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-blue-400 to-amber-400 transition-all duration-100 shadow-[0_0_12px_rgba(0,240,255,0.8)]"
                      style={{ width: `${arcadeLoading.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Bottom Arcade Tip Box */}
          <div className="w-full max-w-xl bg-slate-900/90 border border-amber-500/50 rounded-xl px-4 py-2.5 flex items-center gap-2.5 text-xs text-amber-200/90 font-mono shadow-lg">
            <span className="text-amber-400 text-base font-black shrink-0">💡</span>
            <span className="leading-snug">{arcadeLoading.tip}</span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 90s KONAMI / CPS-2 FULL-SCREEN DEDICATED SCENE FLOW (ZERO MODALS) */}
      {/* ========================================================================= */}

      {/* FULL-SCREEN FADE TO BLACK TRANSITION CURTAIN */}
      {fadeOpacity > 0 && (
        <div
          aria-hidden="true"
          style={{ opacity: fadeOpacity }}
          className="fixed inset-0 z-50 pointer-events-none bg-black transition-none select-none"
        />
      )}

      {/* SCENE 1: FULL-SCREEN TITLE SCENE (SCENE_TITLE) */}
      {currentScene === 'SCENE_TITLE' && (
        <div className="fixed inset-0 z-40 w-full h-full flex flex-col justify-between p-1.5 sm:p-3 md:p-6 bg-[#090b14] overflow-hidden select-none relative">
          {/* Animated Atmospheric Background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <img
              src={ASSETS_MANIFEST.bg_crystal_citadel}
              alt="Ciudadela de Cristal"
              className="w-full h-full object-cover scale-105 filter brightness-95 contrast-110 saturate-115 transition-transform duration-1000 ease-out"
              style={{
                animation: 'subtlePan 28s ease-in-out infinite alternate',
              }}
            />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(9,11,20,0.65)_100%)]" />
            <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#090b14]/90 via-[#090b14]/40 to-transparent" />
            <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[#090b14]/80 to-transparent" />
          </div>

          {/* Top Marquee Bezel Bar with Language Toggle & Difficulty Badge */}
          <div className="w-full flex items-center justify-between border-b sm:border-b-4 border-[#FFE000] bg-black/90 px-2 sm:px-5 py-1 sm:py-2 z-10 shadow-[0_2px_10px_rgba(0,0,0,0.8)] shrink-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="px-1.5 sm:px-2 py-0.5 bg-[#FF0055] text-white font-mono font-black text-[8px] sm:text-[11px] tracking-widest border border-white">
                {t.copyright}
              </span>
              <span className="text-[#00F0FF] font-mono text-[9px] sm:text-xs font-black tracking-widest hidden sm:inline">
                {t.arcadeSystem}
              </span>
            </div>

            {/* Interactive Bilingual Flag Toggle (🇺🇸 EN / 🇪🇸 ES) */}
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="flex items-center bg-slate-900 border border-slate-700 sm:border-2 rounded p-0.5 shadow-md">
                <button
                  onClick={() => setLanguageAndPersist('en')}
                  title="Switch to English"
                  aria-label="English"
                  className={`px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded text-[9px] sm:text-xs font-mono font-black flex items-center gap-0.5 sm:gap-1 transition-all ${
                    language === 'en'
                      ? 'bg-cyan-500 text-black shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}>
                  <span className="text-[10px] sm:text-sm">🇺🇸</span>
                  <span>EN</span>
                </button>
                <button
                  onClick={() => setLanguageAndPersist('es')}
                  title="Cambiar a Español"
                  aria-label="Español"
                  className={`px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded text-[9px] sm:text-xs font-mono font-black flex items-center gap-0.5 sm:gap-1 transition-all ${
                    language === 'es'
                      ? 'bg-amber-400 text-black shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}>
                  <span className="text-[10px] sm:text-sm">🇪🇸</span>
                  <span>ES</span>
                </button>
              </div>

              {/* Current Difficulty Tag */}
              <button
                onClick={() => {
                  const nextDiff = difficulty === 'TOURIST' ? 'DEVIL' : 'TOURIST';
                  setDifficultyAndPersist(nextDiff);
                }}
                title={difficulty === 'DEVIL' ? t.devilMode : t.touristMode}
                className={`px-1.5 py-0.5 sm:px-2.5 sm:py-1 border border-cyan-500 sm:border-2 font-mono text-[9px] sm:text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1 ${
                  difficulty === 'DEVIL'
                    ? 'bg-rose-950 border-rose-500 text-rose-300 animate-pulse'
                    : 'bg-cyan-950 border-cyan-500 text-cyan-300'
                }`}>
                <span>{difficulty === 'DEVIL' ? '😈 DEVIL' : '🛡️ TOURIST'}</span>
              </button>
            </div>
          </div>

          {/* Middle Arcade Presentation: Side-by-Side in Landscape, Centered Column in Portrait */}
          <div className="w-full max-w-4xl z-10 flex-1 min-h-0 flex flex-col landscape:flex-row sm:flex-row items-center justify-center gap-2 sm:gap-6 md:gap-10 px-2 overflow-hidden">
            {/* Left / Upper: Central Logo & Arcade Title Card */}
            <div className="flex flex-col items-center text-center shrink-0">
              {/* Radiant Arcade Emblem */}
              <div className="w-8 h-8 sm:w-14 sm:h-14 md:w-18 md:h-18 mb-0.5 sm:mb-1 rounded-none bg-gradient-to-b from-[#FFE000] via-[#FF0055] to-[#7B00FF] p-0.5 sm:p-1 shadow-[0_0_15px_rgba(255,224,0,0.5)] flex items-center justify-center shrink-0">
                <div className="w-full h-full bg-[#090b14] border border-black sm:border-2 flex items-center justify-center">
                  <Zap size={16} className="sm:hidden text-[#FFE000] animate-pulse drop-shadow-[0_0_6px_#FFE000]" />
                  <Zap size={32} className="hidden sm:block text-[#FFE000] animate-pulse drop-shadow-[0_0_12px_#FFE000]" />
                </div>
              </div>

              {/* Sharp Metallic Upper Title */}
              <div className="text-[8px] sm:text-xs font-black tracking-[0.15em] sm:tracking-[0.3em] uppercase text-[#00F0FF] drop-shadow-[0_1px_0_#000]">
                {t.protagonistTag}
              </div>

              {/* Giant Arcade Bitmap Typography */}
              <h1
                className="text-xl sm:text-4xl md:text-6xl lg:text-7xl font-black text-[#FFE000] tracking-tight uppercase drop-shadow-[2px_2px_0_#FF0055] leading-tight sm:leading-none mb-0.5 sm:mb-1"
                style={{
                  textShadow:
                    '2px 2px 0 #FF0055, 3px 3px 0 #000, 0 0 15px rgba(255,224,0,0.6)',
                }}>
                {t.gameTitle}
              </h1>

              {/* Metallic Golden Chrome Banner */}
              <div className="px-2.5 sm:px-5 py-0.5 bg-gradient-to-r from-[#FF0055] via-[#FFE000] to-[#00F0FF] border border-black text-black font-black text-[9px] sm:text-xs tracking-wider uppercase">
                {t.gameSubtitle}
              </div>

              {/* Saved Profile Pill */}
              {savedData && (
                <div className="mt-0.5 sm:mt-1 px-1.5 sm:px-3 py-0.5 bg-black/90 border border-[#00F0FF] text-[#00F0FF] font-mono text-[8px] sm:text-[10px] font-black tracking-wider uppercase shadow-[0_0_8px_rgba(0,240,255,0.4)]">
                  ★ {t.savedFileTag}: SEC {savedData.lastPlayedLevel} • {savedData.score} PTS ★
                </div>
              )}
            </div>

            {/* Right / Lower: Primary Arcade Action Menu */}
            <div className="w-full max-w-[270px] sm:max-w-xs md:max-w-sm flex flex-col gap-1.5 sm:gap-2 shrink-0">
              {savedData && (savedData.lastPlayedLevel > 1 || savedData.score > 0) ? (
                <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                  <button
                    ref={startButtonRef}
                    autoFocus
                    onClick={() => {
                      triggerArcadeLoading(
                        savedData.lastPlayedLevel as any,
                        savedData.score,
                        savedData.fragments,
                      );
                    }}
                    className="py-1.5 sm:py-3 px-2 sm:px-3 bg-[#FFE000] hover:bg-white text-black font-black text-xs sm:text-sm uppercase tracking-wider border border-black sm:border-2 shadow-[2px_2px_0_#000] sm:shadow-[3px_3px_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-1">
                    <Play size={14} className="fill-black" />
                    <span>{t.continueGame}</span>
                  </button>
                  <button
                    onClick={() => {
                      transitionToScene('SCENE_DIFFICULTY_SELECT');
                    }}
                    className="py-1.5 sm:py-3 px-2 sm:px-3 bg-[#FF0055] hover:bg-[#ff3377] text-white font-black text-xs sm:text-sm uppercase tracking-wider border border-black sm:border-2 shadow-[2px_2px_0_#000] sm:shadow-[3px_3px_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-1">
                    <span>{t.newGame}</span>
                  </button>
                </div>
              ) : (
                <button
                  ref={startButtonRef}
                  autoFocus
                  onClick={() => {
                    transitionToScene('SCENE_DIFFICULTY_SELECT');
                  }}
                  className="w-full py-2 sm:py-3 px-3 sm:px-4 bg-[#FFE000] hover:bg-white text-black font-black text-xs sm:text-base md:text-xl uppercase tracking-widest border border-black sm:border-2 shadow-[2px_2px_0_#000] sm:shadow-[4px_4px_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-1.5 animate-pulse">
                  <Play size={15} className="fill-black" />
                  <span>[ {t.startAdventure} ]</span>
                </button>
              )}

              {/* Navigation Strip to Dedicated Scenes */}
              <div className="grid grid-cols-2 gap-1 sm:gap-1.5">
                <button
                  onClick={() => transitionToScene('SCENE_STAGE_SELECT')}
                  className="py-1.5 sm:py-2 px-1.5 sm:px-2 bg-[#00F0FF] hover:bg-white text-black font-black text-[9px] sm:text-xs tracking-wider uppercase border border-black sm:border-2 shadow-[1.5px_1.5px_0_#000] sm:shadow-[2px_2px_0_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-1">
                  <Layers size={12} />
                  <span>{t.stageSelect}</span>
                </button>
                <button
                  onClick={() => transitionToScene('SCENE_CONTROLS')}
                  className="py-1.5 sm:py-2 px-1.5 sm:px-2 bg-[#00F0FF] hover:bg-white text-black font-black text-[9px] sm:text-xs tracking-wider uppercase border border-black sm:border-2 shadow-[1.5px_1.5px_0_#000] sm:shadow-[2px_2px_0_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-1">
                  <GamepadIcon size={12} />
                  <span>{t.controls}</span>
                </button>
                <button
                  onClick={() => transitionToScene('SCENE_OPTIONS')}
                  className="py-1.5 sm:py-2 px-1.5 sm:px-2 bg-[#00F0FF] hover:bg-white text-black font-black text-[9px] sm:text-xs tracking-wider uppercase border border-black sm:border-2 shadow-[1.5px_1.5px_0_#000] sm:shadow-[2px_2px_0_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-1">
                  <Settings size={12} />
                  <span>{t.options}</span>
                </button>
                <button
                  onClick={() => transitionToScene('SCENE_PROLOGUE')}
                  className="py-1.5 sm:py-2 px-1.5 sm:px-2 bg-[#7B00FF] hover:bg-[#9d33ff] text-white font-black text-[9px] sm:text-xs tracking-wider uppercase border border-black sm:border-2 shadow-[1.5px_1.5px_0_#000] sm:shadow-[2px_2px_0_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-1">
                  <Sparkles size={12} />
                  <span>{t.prologue}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Arcade Cabinet Footer */}
          <div className="w-full flex items-center justify-between border-t border-slate-800 text-[8px] sm:text-[10px] md:text-xs font-mono font-bold text-slate-400 pt-0.5 sm:pt-2 z-10 shrink-0">
            <span>© 2026 AndyCrow Games • {t.gameTitle}</span>
            <span className="text-[#FFE000] hidden sm:inline">{t.freePlay}</span>
            <span className="hidden sm:inline">PRESS [ESC] FOR OPTIONS</span>
          </div>
        </div>
      )}

      {/* SCENE: FULL-SCREEN ARCADE DIFFICULTY SELECTION SCENE (SCENE_DIFFICULTY_SELECT) */}
      {currentScene === 'SCENE_DIFFICULTY_SELECT' && (
        <div className="fixed inset-0 z-40 w-full h-full flex flex-col justify-between p-2 sm:p-3 md:p-6 bg-[#090b14] overflow-hidden select-none relative animate-fadeIn">
          {/* Atmospheric Background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <img
              src={ASSETS_MANIFEST.bg_zone5_abyssal_inferno}
              alt="Difficulty Select Background"
              className="w-full h-full object-cover scale-105 filter brightness-[0.25] contrast-125"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#090b14] via-[#090b14]/80 to-[#090b14]/60" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#090b14_85%)]" />
          </div>

          {/* Top Marquee Bar */}
          <div className="relative z-10 w-full flex items-center justify-between border-b-4 border-[#FFE000] bg-black/90 px-3 md:px-5 py-2 shrink-0 shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
            <button
              onClick={() => transitionToScene('SCENE_TITLE')}
              className="px-3 py-1.5 bg-[#FF0055] hover:bg-white text-white hover:text-black font-mono font-black text-xs uppercase tracking-wider border-2 border-black shadow-[2px_2px_0_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-1.5">
              <ChevronLeft size={16} />
              <span>[ESC] {t.back}</span>
            </button>
            <div className="text-sm md:text-lg font-black text-[#FFE000] tracking-widest uppercase font-mono">
              ✦ {t.selectDifficulty} • {t.chooseDestiny} ✦
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-xs font-mono font-black text-cyan-300">ARCADE 1P</span>
            </div>
          </div>

          {/* Central Two-Option Arcade Choice Cards */}
          <div className="relative z-10 w-full max-w-4xl mx-auto flex-1 min-h-0 grid grid-cols-1 landscape:grid-cols-2 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6 my-auto items-stretch py-1 sm:py-3">
            {/* CARD 1: MODO TURISTA (FÁCIL) / TOURIST MODE (EASY) */}
            <div
              onClick={() => {
                setDifficultyAndPersist('TOURIST');
                triggerArcadeLoading(1, 0, 0);
              }}
              className="group relative flex flex-col justify-between p-2.5 sm:p-4 md:p-6 bg-slate-950/90 hover:bg-slate-900 border-4 border-cyan-500 shadow-[6px_6px_0_#000] hover:shadow-[0_0_30px_rgba(0,240,255,0.7)] transition-all cursor-pointer active:scale-[0.98]">
              <div>
                <div className="flex items-center justify-between border-b-2 border-cyan-500/50 pb-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🛡️</span>
                    <h3 className="font-mono font-black text-lg md:text-xl text-cyan-300 uppercase tracking-wider group-hover:text-white">
                      {t.touristMode}
                    </h3>
                  </div>
                  <span className="px-2.5 py-0.5 rounded bg-cyan-950 text-cyan-200 border border-cyan-400 text-xs font-black font-mono">
                    15 {t.livesLabel}
                  </span>
                </div>

                <p className="text-xs md:text-sm text-cyan-100/90 leading-relaxed mb-4 italic">
                  "{t.touristDesc}"
                </p>

                {/* Feature Bullet Points */}
                <div className="space-y-2 mb-4">
                  {t.touristFeatures.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-center gap-2 text-xs font-mono text-slate-300">
                      <span className="text-cyan-400 font-black">✓</span>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <button
                className="w-full py-3.5 px-4 bg-cyan-400 hover:bg-white text-slate-950 font-black font-mono text-sm uppercase tracking-widest border-2 border-black shadow-[3px_3px_0_#000] group-hover:bg-cyan-300 transition-all flex items-center justify-center gap-2">
                <Play size={18} className="fill-slate-950" />
                <span>[ {t.touristMode} ]</span>
              </button>
            </div>

            {/* CARD 2: DEVIL MODE (DIFÍCIL) / DEVIL MODE (HARD) */}
            <div
              onClick={() => {
                setDifficultyAndPersist('DEVIL');
                triggerArcadeLoading(1, 0, 0);
              }}
              className="group relative flex flex-col justify-between p-2.5 sm:p-4 md:p-6 bg-rose-950/90 hover:bg-rose-900/90 border-4 border-rose-500 shadow-[6px_6px_0_#000] hover:shadow-[0_0_35px_rgba(244,63,94,0.85)] transition-all cursor-pointer active:scale-[0.98]">
              <div>
                <div className="flex items-center justify-between border-b-2 border-rose-500/50 pb-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl animate-pulse">😈</span>
                    <h3 className="font-mono font-black text-lg md:text-xl text-rose-300 uppercase tracking-wider group-hover:text-white">
                      {t.devilMode}
                    </h3>
                  </div>
                  <span className="px-2.5 py-0.5 rounded bg-red-950 text-yellow-300 border border-red-500 text-xs font-black font-mono animate-pulse">
                    ★ 3X SCORE ★
                  </span>
                </div>

                <p className="text-xs md:text-sm text-rose-100/90 leading-relaxed mb-4 italic">
                  "{t.devilDesc}"
                </p>

                {/* Feature Bullet Points */}
                <div className="space-y-1.5 mb-4">
                  {t.devilFeatures.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-center gap-2 text-xs font-mono text-slate-200">
                      <span className="text-rose-400 font-black">☠</span>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <button
                className="w-full py-3.5 px-4 bg-rose-500 hover:bg-yellow-300 hover:text-black text-white font-black font-mono text-sm uppercase tracking-widest border-2 border-black shadow-[3px_3px_0_#000] transition-all flex items-center justify-center gap-2 animate-pulse">
                <Play size={18} className="fill-current" />
                <span>[ {t.devilMode} ]</span>
              </button>
            </div>
          </div>

          {/* Bottom Footer Guidance */}
          <div className="relative z-10 w-full flex items-center justify-between border-t-4 border-[#FFE000] bg-black px-4 py-2 shrink-0 font-mono text-xs font-black text-slate-400">
            <span>© 2026 AndyCrow Games • {t.gameTitle}</span>
            <span className="text-yellow-300 hidden sm:inline">PULSA CUALQUIER MODO PARA DESPLEGAR</span>
            <button
              onClick={() => transitionToScene('SCENE_TITLE')}
              className="text-[#FF0055] hover:text-white transition-colors">
              [ESC] {t.back}
            </button>
          </div>
        </div>
      )}
      {currentScene === 'SCENE_STAGE_SELECT' && (
        <div className="fixed inset-0 z-40 w-full h-full flex flex-col justify-between p-2 sm:p-3 md:p-6 bg-[#090b14] overflow-y-auto overflow-x-hidden select-none relative">
          {/* Dynamic In-Game Biome Background: Changes dynamically according to selectedZoneId */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {Object.entries(ZONE_BACKGROUND_MAP).map(([zoneIdStr, bgUrl]) => {
              const zId = Number(zoneIdStr);
              const isActive = selectedZoneId === zId;
              return (
                <img
                  key={zId}
                  src={bgUrl}
                  alt={`Zona ${zId}`}
                  className={`absolute inset-0 w-full h-full object-cover scale-105 filter brightness-[0.34] contrast-125 transition-opacity duration-700 ease-in-out ${
                    isActive ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              );
            })}
            {/* Dark vignette gradient for maximum card and text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#090b14] via-[#090b14]/80 to-[#090b14]/55" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,#090b14_85%)]" />
          </div>

          {/* Dedicated Top Arcade Command Bar */}
          <div className="relative z-10 w-full flex items-center justify-between border-b-4 border-[#00F0FF] bg-black/90 px-3 md:px-4 py-2 shrink-0 shadow-[0_4px_12px_rgba(0,0,0,0.9)]">
            <div className="flex items-center gap-2 md:gap-3">
              <button
                onClick={() => transitionToScene('SCENE_TITLE')}
                className="px-3 py-1 bg-[#FF0055] hover:bg-white text-white hover:text-black font-mono font-black text-xs uppercase tracking-wider border-2 border-black shadow-[2px_2px_0_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-1">
                <ChevronLeft size={16} />
                <span>[ESC] {t.back}</span>
              </button>
              <h2 className="text-sm md:text-lg font-black text-[#FFE000] tracking-widest uppercase hidden sm:block">
                {t.sectorMission}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              {/* Difficulty Toggle in Stage Select */}
              <button
                onClick={() => {
                  const nextDiff = difficulty === 'TOURIST' ? 'DEVIL' : 'TOURIST';
                  setDifficultyAndPersist(nextDiff);
                }}
                title={difficulty === 'DEVIL' ? t.devilMode : t.touristMode}
                className={`px-3 py-1 font-mono text-xs font-black border-2 border-black shadow-[2px_2px_0_#000] transition-all flex items-center gap-1.5 ${
                  difficulty === 'DEVIL'
                    ? 'bg-rose-950 border-rose-500 text-rose-300 animate-pulse'
                    : 'bg-cyan-950 border-cyan-500 text-cyan-300'
                }`}>
                <span>{difficulty === 'DEVIL' ? '😈 DEVIL (3x PTS)' : '🛡️ TOURIST'}</span>
              </button>

              {/* Test Mode Toggle Button in Dedicated Arcade Bar (Hidden in production via SHOW_DEBUG_TEST_BUTTON flag) */}
              {SHOW_DEBUG_TEST_BUTTON && (
                <button
                  onClick={() => {
                    const next = !debugUnlockAll;
                    setDebugUnlockAll(next);
                    if (next) gameAudio.playPowerupChime();
                    else gameAudio.playCrispClick();
                  }}
                  className={`px-3 py-1 font-mono text-xs font-black border-2 border-black shadow-[2px_2px_0_#000] transition-all flex items-center gap-1.5 ${
                    debugUnlockAll
                      ? 'bg-[#FFE000] text-black animate-pulse'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}>
                  {debugUnlockAll ? <Unlock size={14} /> : <Lock size={14} />}
                  <span>[ {t.testMode}: {debugUnlockAll ? t.testModeUnlocked : t.testModeLocked} ]</span>
                </button>
              )}
            </div>
          </div>

          {/* Zone Selector Strip */}
          <div className="relative z-10 w-full flex items-center justify-center gap-2 my-2 shrink-0">
            {CHAPTER_ZONES.map((zone) => {
              const isSelected = selectedZoneId === zone.id;
              return (
                <button
                  key={zone.id}
                  onClick={() => {
                    gameAudio.playCrispClick();
                    setSelectedZoneId(zone.id);
                  }}
                  className={`px-3 md:px-5 py-1.5 font-black text-xs md:text-sm uppercase tracking-wider border-2 border-black shadow-[3px_3px_0_#000] transition-all ${
                    isSelected
                      ? 'bg-[#FFE000] text-black scale-105'
                      : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800'
                  }`}>
                  {zone.code}: {zone.name.split(' ')[0]}
                </button>
              );
            })}
          </div>

          {/* Horizontal Full-Screen Stage Cards (Strictly 1 Row, Zero Scrollbars) */}
          {(() => {
            const activeZone =
              CHAPTER_ZONES.find((z) => z.id === selectedZoneId) || CHAPTER_ZONES[0];
            const maxUnlocked = savedData?.maxUnlockedLevel || 1;

            return (
              <div className="relative z-10 w-full flex-1 min-h-0 flex items-center justify-center px-1">
                <div className="w-full h-full max-h-[380px] grid grid-cols-4 gap-3 md:gap-4 items-stretch">
                  {activeZone.levels.map((lvl) => {
                    const isUnlocked = debugUnlockAll || lvl.number <= maxUnlocked;
                    const isCurrentLatest = isUnlocked && lvl.number === maxUnlocked;

                    return (
                      <div
                        key={lvl.number}
                        onClick={() => {
                          if (!isUnlocked) {
                            gameAudio.playErrorBuzz();
                            return;
                          }
                          gameAudio.playConfirmSelect();
                          const minFrags =
                            lvl.number >= 17
                              ? 4
                              : lvl.number >= 13
                              ? 3
                              : lvl.number >= 9
                              ? 2
                              : lvl.number >= 5
                              ? 1
                              : 0;
                          triggerArcadeLoading(lvl.number, 0, minFrags);
                        }}
                        className={`relative flex flex-col justify-between p-2 md:p-3 border-4 transition-all cursor-pointer select-none group ${
                          isUnlocked
                            ? isCurrentLatest
                              ? 'bg-[#0f172a]/95 border-[#FFE000] shadow-[0_0_25px_rgba(255,224,0,0.9)] animate-pulse active:translate-x-1 active:translate-y-1'
                              : 'bg-[#0f172a]/90 border-cyan-500/80 hover:bg-[#1e293b] hover:border-[#FFE000] shadow-[4px_4px_0_#000] hover:shadow-[0_0_20px_rgba(255,224,0,0.7)] active:translate-x-1 active:translate-y-1'
                            : 'bg-slate-950/90 border-slate-800 opacity-60 cursor-not-allowed filter grayscale'
                        }`}>
                        {/* Stage Artwork Window */}
                        <div className="relative w-full flex-1 min-h-0 bg-black border-2 border-black overflow-hidden flex items-center justify-center mb-2">
                          {assets[lvl.bgAsset] ? (
                            <img
                              src={ASSETS_MANIFEST[lvl.bgAsset]}
                              alt={lvl.name}
                              className={`w-full h-full object-cover transition-transform duration-300 ${
                                isUnlocked ? 'group-hover:scale-110' : ''
                              }`}
                            />
                          ) : (
                            <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                              <Sparkles size={24} className="text-[#00F0FF]" />
                            </div>
                          )}

                          {/* Code Badge */}
                          <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-[#FF0055] text-white font-mono font-black text-[10px] border border-black">
                            STAGE {lvl.code}
                          </div>

                          {lvl.isBoss && (
                            <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-[#FFE000] text-black font-mono font-black text-[9px] border border-black animate-pulse">
                              BOSS
                            </div>
                          )}

                          {/* Bold Graphic Padlock Indicator */}
                          {!isUnlocked && (
                            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-1 text-slate-300">
                              <Lock size={32} className="text-[#FF0055] drop-shadow-[0_0_8px_#FF0055]" />
                              <span className="font-mono font-black text-[11px] text-[#FF0055] tracking-widest">
                                LOCKED
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Title & Objective Info */}
                        <div className="flex flex-col shrink-0">
                          <h4 className="font-black text-xs md:text-sm text-white uppercase truncate group-hover:text-[#FFE000]">
                            {lvl.name}
                          </h4>
                          <p className="text-[10px] md:text-xs text-slate-400 line-clamp-2 italic leading-tight mt-0.5">
                            {lvl.subtitle}
                          </p>

                          <div className="mt-2 pt-1.5 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono font-black">
                            <span className={isUnlocked ? 'text-[#00F0FF]' : 'text-slate-600'}>
                              {isUnlocked ? '▶ INICIAR' : 'BLOQUEADO'}
                            </span>
                            <span className="text-[#FFE000]">
                              {lvl.isBoss ? 'RECOMPENSA ✦' : 'MISIÓN'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Bottom Arcade Cabinet Status Bar */}
          <div className="relative z-10 w-full flex items-center justify-between border-t-4 border-[#00F0FF] bg-black px-4 py-2 shrink-0 font-mono text-xs font-black text-slate-300">
            <span className="text-[#FFE000]">SECTOR {selectedZoneId} OF 5</span>
            <span className="text-cyan-400 hidden sm:inline">PULSA CUALQUIER TARJETA PARA DESPLEGAR</span>
            <button
              onClick={() => transitionToScene('SCENE_TITLE')}
              className="text-[#FF0055] hover:text-white transition-colors">
              [ESC] VOLVER AL TÍTULO
            </button>
          </div>
        </div>
      )}

      {/* SCENE 3: FULL-SCREEN KEY CONFIG / CONTROLS SCENE (SCENE_CONTROLS) - TWO-COLUMN */}
      {currentScene === 'SCENE_CONTROLS' && (
        <div className="fixed inset-0 z-40 w-full h-full flex flex-col justify-between p-2 sm:p-4 md:p-8 bg-[#090b14] overflow-y-auto overflow-x-hidden select-none relative">
          {/* Attenuated In-Game Background with Dark Bluish / Charcoal Tint */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <img
              src={ASSETS_MANIFEST.bg_distant_storm}
              alt="Controls Background"
              className="w-full h-full object-cover scale-105 filter brightness-[0.22] contrast-125 hue-rotate-15"
            />
            {/* Charcoal / dark blue tint overlay */}
            <div className="absolute inset-0 bg-[#070d1e]/85 mix-blend-multiply" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#090b14] via-[#091124]/85 to-[#090b14]/70" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_25%,#090b14_85%)]" />
          </div>

          {/* Top Marquee */}
          <div className="relative z-10 w-full flex items-center justify-between border-b-4 border-[#FFE000] bg-black/90 px-4 py-2 shrink-0 shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
            <div className="flex items-center gap-3">
              <button
                onClick={() => transitionToScene('SCENE_TITLE')}
                className="px-3 py-1 bg-[#FF0055] hover:bg-white text-white hover:text-black font-mono font-black text-xs uppercase tracking-wider border-2 border-black shadow-[2px_2px_0_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-1">
                <ChevronLeft size={16} />
                <span>[ESC] {t.back}</span>
              </button>
              <h2 className="text-sm md:text-lg font-black text-[#FFE000] tracking-widest uppercase">
                {t.controls}
              </h2>
            </div>
            <div className="text-xs font-mono font-black text-[#00F0FF]">
              SYSTEM CONFIG 1P
            </div>
          </div>

          {/* Two-Column Dedicated Layout (Zero Scrollbars) */}
          <div className="relative z-10 w-full flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 my-auto items-stretch py-2">
            {/* Column 1: PC Keyboard & Arcade Joystick Mapping */}
            <div className="h-full flex flex-col justify-between p-4 bg-black/90 border-4 border-[#00F0FF] shadow-[6px_6px_0_#000]">
              <div className="flex items-center gap-2 border-b-2 border-[#00F0FF] pb-2 mb-3">
                <GamepadIcon size={20} className="text-[#00F0FF]" />
                <h3 className="font-mono font-black text-sm md:text-base text-[#00F0FF] uppercase tracking-wider">
                  {t.keyboardTitle}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2 bg-slate-900 border border-slate-700 flex justify-between items-center">
                  <span className="text-slate-400">{t.movement}:</span>
                  <span className="text-[#FFE000] font-black">[A] [D] / [←] [→]</span>
                </div>
                <div className="p-2 bg-slate-900 border border-slate-700 flex justify-between items-center">
                  <span className="text-slate-400">{t.duck}:</span>
                  <span className="text-[#FFE000] font-black">[S] / [↓]</span>
                </div>
                <div className="p-2 bg-slate-900 border border-slate-700 flex justify-between items-center">
                  <span className="text-slate-400">{t.aimVertical}:</span>
                  <span className="text-[#00F0FF] font-black">[W] / [↑]</span>
                </div>
                <div className="p-2 bg-slate-900 border border-slate-700 flex justify-between items-center">
                  <span className="text-slate-400">{t.retroJump}:</span>
                  <span className="text-[#00F0FF] font-black">[SPACE] / [K]</span>
                </div>
                <div className="p-2 bg-slate-900 border border-slate-700 flex justify-between items-center">
                  <span className="text-slate-400">{t.dashSprint}:</span>
                  <span className="text-[#FF0055] font-black">[SHIFT] / [J]</span>
                </div>
                <div className="p-2 bg-slate-900 border border-slate-700 flex justify-between items-center">
                  <span className="text-slate-400">{t.thunderShot}:</span>
                  <span className="text-[#FFE000] font-black">[L] / [U] / [C]</span>
                </div>
                <div className="p-2 bg-slate-900 border border-slate-700 flex justify-between items-center">
                  <span className="text-slate-400">{t.flameBlast}:</span>
                  <span className="text-[#FF0055] font-black">[E] / [O] / [X]</span>
                </div>
                <div className="p-2 bg-slate-900 border border-slate-700 flex justify-between items-center">
                  <span className="text-slate-400">{t.flashStep}:</span>
                  <span className="text-[#00F0FF] font-black">[Q] / [↑+DASH]</span>
                </div>
              </div>

              <div className="mt-3 p-2.5 bg-slate-950 border border-slate-800 text-[11px] text-slate-400 font-mono">
                ✦ <strong>{t.secretPipeTip}</strong>
              </div>
            </div>

            {/* Column 2: Arcade Cabinet Buttons Layout (Concave/Convex Caps) */}
            <div className="h-full flex flex-col justify-between p-4 bg-black/90 border-4 border-[#FF0055] shadow-[6px_6px_0_#000]">
              <div className="flex items-center gap-2 border-b-2 border-[#FF0055] pb-2 mb-3">
                <Zap size={20} className="text-[#FF0055]" />
                <h3 className="font-mono font-black text-sm md:text-base text-[#FF0055] uppercase tracking-wider">
                  {t.arcadeButtonsTitle}
                </h3>
              </div>

              {/* Graphical Arcade Button Caps */}
              <div className="grid grid-cols-2 gap-3 my-auto">
                {/* Button A */}
                <div className="p-3 bg-slate-950 border-2 border-black flex items-center gap-3 shadow-[2px_2px_0_#000]">
                  <div className="w-12 h-12 rounded-full bg-[#00F0FF] border-4 border-[#0099cc] shadow-[inset_0_-4px_6px_rgba(0,0,0,0.6),0_4px_8px_rgba(0,240,255,0.4)] flex items-center justify-center font-black text-black text-lg shrink-0">
                    A
                  </div>
                  <div>
                    <div className="text-xs font-black text-[#00F0FF] font-mono">{t.buttonJump}</div>
                    <div className="text-[10px] text-slate-400 font-mono">Salto ágil & Doble Salto</div>
                  </div>
                </div>

                {/* Button B */}
                <div className="p-3 bg-slate-950 border-2 border-black flex items-center gap-3 shadow-[2px_2px_0_#000]">
                  <div className="w-12 h-12 rounded-full bg-[#7B00FF] border-4 border-[#5200aa] shadow-[inset_0_-4px_6px_rgba(0,0,0,0.6),0_4px_8px_rgba(123,0,255,0.4)] flex items-center justify-center font-black text-white text-lg shrink-0">
                    B
                  </div>
                  <div>
                    <div className="text-xs font-black text-[#7B00FF] font-mono">{t.buttonDash}</div>
                    <div className="text-[10px] text-slate-400 font-mono">Impulso Sprint de evasión</div>
                  </div>
                </div>

                {/* Button Y */}
                <div className="p-3 bg-slate-950 border-2 border-black flex items-center gap-3 shadow-[2px_2px_0_#000]">
                  <div className="w-12 h-12 rounded-full bg-[#FFE000] border-4 border-[#ccb300] shadow-[inset_0_-4px_6px_rgba(0,0,0,0.6),0_4px_8px_rgba(255,224,0,0.4)] flex items-center justify-center font-black text-black text-lg shrink-0">
                    Y
                  </div>
                  <div>
                    <div className="text-xs font-black text-[#FFE000] font-mono">{t.buttonShoot}</div>
                    <div className="text-[10px] text-slate-400 font-mono">Rayo Voltaico multidireccional</div>
                  </div>
                </div>

                {/* Button F */}
                <div className="p-3 bg-slate-950 border-2 border-black flex items-center gap-3 shadow-[2px_2px_0_#000]">
                  <div className="w-12 h-12 rounded-full bg-[#FF0055] border-4 border-[#b3003b] shadow-[inset_0_-4px_6px_rgba(0,0,0,0.6),0_4px_8px_rgba(255,0,85,0.4)] flex items-center justify-center font-black text-white text-lg shrink-0">
                    F
                  </div>
                  <div>
                    <div className="text-xs font-black text-[#FF0055] font-mono">{t.buttonFlame}</div>
                    <div className="text-[10px] text-slate-400 font-mono">Cono masivo perforador</div>
                  </div>
                </div>
              </div>

              <div className="mt-3 p-2.5 bg-slate-950 border border-slate-800 text-[11px] text-slate-400 font-mono">
                ✦ <strong>{t.mobileTouchTip}</strong>
              </div>
            </div>
          </div>

          {/* Bottom Back Strip */}
          <div className="relative z-10 w-full flex items-center justify-between border-t-4 border-[#FFE000] bg-black px-4 py-2 shrink-0 font-mono text-xs font-black text-slate-300">
            <span className="text-[#00F0FF]">CPS-2 JOYSTICK & BUTTON CONFIG READY</span>
            <button
              onClick={() => transitionToScene('SCENE_TITLE')}
              className="px-4 py-1 bg-[#FFE000] text-black hover:bg-white font-black uppercase tracking-wider border-2 border-black transition-all">
              [ESC] {t.back}
            </button>
          </div>
        </div>
      )}

      {/* SCENE: FULL-SCREEN CINEMATIC PROLOGUE SCENE (SCENE_STORY / SCENE_PROLOGUE) */}
      {(currentScene === 'SCENE_STORY' || currentScene === 'SCENE_PROLOGUE') && (() => {
        const currentStoryPanels = STORY_PANELS_LOCALIZED[language];
        const panel = currentStoryPanels[storyPanelIndex] || currentStoryPanels[0];

        return (
          <div className="fixed inset-0 z-40 w-full h-full flex flex-col justify-between p-1 sm:p-2.5 md:p-4 bg-[#080b14] overflow-hidden select-none relative animate-fadeIn">
            {/* Blurred Atmospheric Background using current illustration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <img
                src={ASSETS_MANIFEST[panel.imageKey]}
                alt="Prologue Background"
                className="w-full h-full object-cover scale-110 filter blur-xl brightness-[0.22] contrast-125 transition-all duration-700"
              />
              <div className="absolute inset-0 bg-[#080b14]/75 mix-blend-multiply" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#080b14] via-[#080b14]/80 to-[#080b14]/65" />
            </div>

            {/* Top Marquee Header Bar */}
            <div className="relative z-10 w-full flex items-center justify-between border-b sm:border-b-4 border-amber-400 bg-black/90 px-2 sm:px-4 py-0.5 sm:py-1 shrink-0 shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={() => {
                    gameAudio.playCrispClick();
                    if (prologueAudioRef.current) {
                      prologueAudioRef.current.pause();
                      prologueAudioRef.current.currentTime = 0;
                    }
                    try {
                      localStorage.setItem('la_grieta_prologue_seen', 'true');
                    } catch {}
                    transitionToScene('SCENE_DIFFICULTY_SELECT');
                  }}
                  className="px-1.5 sm:px-3 py-0.5 sm:py-1 bg-[#FF0055] hover:bg-white text-white hover:text-black font-mono font-black text-[9px] sm:text-xs uppercase tracking-wider border border-black sm:border-2 shadow-[1.5px_1.5px_0_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-1">
                  <FastForward size={11} />
                  <span>[ESC / {t.skip}]</span>
                </button>
                <span className="hidden sm:inline text-xs font-black text-cyan-300 font-mono tracking-widest uppercase">
                  {t.gameTitle}: {t.prologue}
                </span>
              </div>

              {/* Visual Progress Indicator Dots + Voice Controls */}
              <div className="flex items-center gap-1.5 sm:gap-3">
                <div className="flex items-center gap-1 sm:gap-1.5">
                  {currentStoryPanels.map((pItem, idx) => {
                    const isActive = idx === storyPanelIndex;
                    return (
                      <button
                        key={pItem.id}
                        onClick={() => changeStoryPanel(idx)}
                        title={`Ir a: ${pItem.title}`}
                        aria-label={`Panel ${idx + 1}`}
                        className={`transition-all duration-300 ${
                          isActive
                            ? 'w-4 sm:w-7 h-1.5 sm:h-2.5 bg-amber-400 rounded-full shadow-[0_0_10px_#fde047] scale-110 border border-yellow-200'
                            : 'w-1.5 sm:w-2.5 h-1.5 sm:h-2.5 bg-slate-700 hover:bg-slate-400 rounded-full border border-slate-600'
                        }`}
                      />
                    );
                  })}
                </div>
                <span className="text-[9px] sm:text-xs font-mono font-black text-amber-300">
                  {storyPanelIndex + 1}/{currentStoryPanels.length}
                </span>

                {/* Voice narration badge & controls */}
                <div className="flex items-center gap-1 pl-1 border-l border-slate-700">
                  <div
                    title="Voz Gemini TTS Flash (Charon)"
                    className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-950/80 border border-purple-500/50 text-[9px] font-mono font-bold text-purple-200">
                    <span className={`w-1.5 h-1.5 rounded-full ${isNarrationPlaying ? 'bg-green-400 animate-ping' : 'bg-slate-500'}`} />
                    <span>CHARON</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (prologueAudioRef.current) {
                        prologueAudioRef.current.currentTime = 0;
                        prologueAudioRef.current.play().catch(() => {});
                      }
                    }}
                    title="Repetir voz"
                    aria-label="Repetir voz"
                    className="p-0.5 sm:p-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 active:scale-95 transition-all">
                    <RotateCw size={11} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setNarrationMuted((prev) => !prev);
                    }}
                    title={narrationMuted ? 'Activar voz' : 'Silenciar voz'}
                    aria-label="Silenciar voz"
                    className={`p-0.5 sm:p-1 rounded border active:scale-95 transition-all ${
                      narrationMuted
                        ? 'bg-red-950/80 border-red-500 text-red-300'
                        : 'bg-slate-800 hover:bg-slate-700 border-cyan-500/40 text-cyan-300'
                    }`}>
                    {narrationMuted ? <VolumeX size={11} /> : <Volume2 size={11} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Central Cinematic Showcase: 16:9 Illustration + Dialogue Box Side-by-Side in Landscape, Stacked in Portrait */}
            <div className="relative z-10 w-full flex-1 min-h-0 flex flex-col landscape:flex-row sm:flex-row items-center justify-start sm:justify-center gap-1.5 sm:gap-3 max-w-5xl mx-auto p-1 overflow-hidden">
              {/* Top (Portrait) / Left (Landscape): 16:9 Illustration Frame */}
              <div className="w-full flex-1 landscape:w-1/2 sm:w-1/2 h-full flex items-center justify-center min-h-0 overflow-hidden">
                <div className="relative w-full max-w-[420px] landscape:max-w-none h-full max-h-full aspect-[16/9] rounded-lg sm:rounded-xl bg-black border sm:border-2 border-amber-400/90 shadow-[0_0_15px_rgba(251,191,36,0.3)] overflow-hidden flex items-center justify-center">
                  <img
                    key={panel.imageKey}
                    src={ASSETS_MANIFEST[panel.imageKey]}
                    alt={panel.title}
                    className="w-full h-full object-cover filter brightness-100 contrast-105 saturate-110"
                    style={{
                      imageRendering: 'pixelated',
                    }}
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

                  {/* Corner accents */}
                  <div className="absolute top-1 left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-amber-300 pointer-events-none" />
                  <div className="absolute top-1 right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-amber-300 pointer-events-none" />
                  <div className="absolute bottom-1 left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-amber-300 pointer-events-none" />
                  <div className="absolute bottom-1 right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-amber-300 pointer-events-none" />

                  {/* Speaker badge tag */}
                  <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full bg-black/85 backdrop-blur-md border border-amber-400/80 text-[8px] sm:text-[10px] font-mono font-black text-amber-300 tracking-wider shadow flex items-center gap-1">
                    <span className="text-amber-400">✦</span>
                    <span>{panel.speaker}</span>
                  </div>

                  {/* Slide number pill */}
                  <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/80 border border-slate-700 text-[8px] sm:text-[9px] font-mono text-amber-300/90">
                    ACTO {storyPanelIndex + 1} / {currentStoryPanels.length}
                  </div>
                </div>
              </div>

              {/* Bottom (Portrait) / Right (Landscape): Dialogue & Subtitle Card */}
              <div
                onClick={() => handleNextStoryPanel(false)}
                className="w-full flex-1 landscape:w-1/2 sm:w-1/2 h-full flex flex-col justify-between bg-black/95 border sm:border-2 border-amber-400/90 rounded-lg sm:rounded-xl p-2 sm:p-3.5 shadow-xl overflow-hidden min-h-0 cursor-pointer hover:border-amber-300 transition-colors">
                {/* Title & speaker header */}
                <div className="border-b border-amber-500/30 pb-0.5 mb-0.5 shrink-0 flex items-center justify-between">
                  <h3 className="text-[11px] sm:text-sm md:text-base font-black text-[#FFE000] tracking-wider uppercase drop-shadow truncate">
                    {panel.title}
                  </h3>
                  <span className="text-[9px] sm:text-[10px] font-mono text-cyan-400 ml-2 shrink-0">
                    {isTextFullyTyped ? `✓ ${t.ready}` : '...'}
                  </span>
                </div>

                {/* Subtitle Dialogue Text */}
                <div className="flex-1 min-h-0 overflow-y-auto pr-1 text-[11px] sm:text-sm text-slate-100 font-sans leading-snug sm:leading-relaxed flex flex-col justify-start">
                  <p>
                    {panel.paragraphs.join(' ').slice(0, typewriterIndex) || panel.paragraphs[0]}
                    {!isTextFullyTyped && (
                      <span className="inline-block w-1.5 h-3 bg-cyan-400 ml-1 animate-pulse" />
                    )}
                  </p>
                </div>

                {/* Voice Narration Progress Bar */}
                <div className="shrink-0 mt-0.5 sm:mt-1">
                  <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden border border-amber-500/30">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 via-yellow-300 to-cyan-400 transition-all duration-150"
                      style={{ width: `${narrationProgress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[8px] sm:text-[9px] font-mono text-slate-400 mt-0.5">
                    <span>{isNarrationPlaying ? '🎙️ NARRACIÓN EN VIVO' : 'PAUSADO'}</span>
                    <span className="text-cyan-400">PULSA SIGUIENTE ▶ PARA AVANZAR</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Navigation Bar */}
            <div className="relative z-10 w-full flex items-center justify-between border-t sm:border-t-4 border-amber-400 bg-black/95 px-2 sm:px-4 py-1 sm:py-1.5 shrink-0 font-mono text-[9px] sm:text-xs font-black shadow-[0_-2px_12px_rgba(0,0,0,0.8)]">
              <button
                disabled={storyPanelIndex === 0}
                onClick={handlePrevStoryPanel}
                className="px-2.5 sm:px-4 py-1 sm:py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-900 text-white border border-slate-700 disabled:border-slate-800 transition-all flex items-center gap-1 min-h-[28px] sm:min-h-[36px] text-[9px] sm:text-xs">
                <ChevronLeft size={12} />
                <span>[←] {t.previous}</span>
              </button>

              <span className="hidden sm:inline text-[10px] text-slate-400 tracking-wide font-mono">
                [ESPACIO / ENTER / CLICK] {t.next}
              </span>

              <button
                onClick={() => handleNextStoryPanel(true)}
                className={`px-3 sm:px-6 py-1 sm:py-1.5 border border-black sm:border-2 font-black uppercase tracking-wider flex items-center gap-1 shadow-[1.5px_1.5px_0_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all min-h-[28px] sm:min-h-[36px] text-[10px] sm:text-xs ${
                  storyPanelIndex === currentStoryPanels.length - 1
                    ? 'bg-[#00F0FF] hover:bg-white text-black animate-pulse'
                    : 'bg-[#FFE000] hover:bg-white text-black'
                }`}>
                <span>
                  {storyPanelIndex === currentStoryPanels.length - 1
                    ? t.startAction
                    : t.next}
                </span>
                <ChevronRight size={12} />
              </button>
            </div>
          </div>
        );
      })()}

      {/* SCENE 5: FULL-SCREEN OPTIONS SCENE (SCENE_OPTIONS) */}
      {currentScene === 'SCENE_OPTIONS' && (
        <div className="fixed inset-0 z-40 w-full h-full flex flex-col justify-between p-2 sm:p-4 md:p-8 bg-[#090b14] overflow-y-auto overflow-x-hidden select-none relative">
          {/* Attenuated in-game background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <img
              src={ASSETS_MANIFEST.bg_crystal_citadel}
              alt="Options Background"
              className="w-full h-full object-cover scale-105 filter brightness-[0.24] contrast-125"
            />
            <div className="absolute inset-0 bg-[#090d16]/85 mix-blend-multiply" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#090b14] via-[#090b14]/80 to-[#090b14]/70" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#090b14_90%)]" />
          </div>

          <div className="relative z-10 w-full flex items-center justify-between border-b-4 border-[#00F0FF] bg-black/90 px-4 py-2 shrink-0 shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
            <div className="flex items-center gap-3">
              <button
                onClick={() => transitionToScene('SCENE_TITLE')}
                className="px-3 py-1 bg-[#FF0055] hover:bg-white text-white hover:text-black font-mono font-black text-xs uppercase tracking-wider border-2 border-black shadow-[2px_2px_0_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-1">
                <ChevronLeft size={16} />
                <span>[ESC] {t.back}</span>
              </button>
              <h2 className="text-sm md:text-lg font-black text-[#00F0FF] tracking-widest uppercase">
                {t.systemSetup}
              </h2>
            </div>
            <div className="text-xs font-mono font-black text-[#FFE000]">
              SYSTEM SETUP
            </div>
          </div>

          <div className="relative z-10 w-full max-w-xl mx-auto flex flex-col my-auto border-4 border-black bg-black/90 shadow-[6px_6px_0_#000] p-4 md:p-6 space-y-4">
            {/* CRT Scanlines Toggle */}
            <div className="flex items-center justify-between p-3.5 bg-slate-950 border-2 border-slate-800">
              <div className="flex flex-col text-left">
                <span className="text-xs font-black text-[#00F0FF] font-mono uppercase tracking-wider">
                  {t.crtEffect}
                </span>
                <span className="text-[11px] text-slate-400">
                  {t.crtDesc}
                </span>
              </div>
              <button
                onClick={toggleCrtScanlines}
                className={`px-4 py-1.5 font-mono text-xs font-black border-2 border-black transition-all ${
                  crtScanlines
                    ? 'bg-[#00F0FF] text-black shadow-[2px_2px_0_#000]'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                {crtScanlines ? t.on : t.off}
              </button>
            </div>

            {/* Framerate Selection */}
            <div className="flex items-center justify-between p-3.5 bg-slate-950 border-2 border-slate-800">
              <div className="flex flex-col text-left">
                <span className="text-xs font-black text-[#FFE000] font-mono uppercase tracking-wider">
                  {t.fps}
                </span>
                <span className="text-[11px] text-slate-400">
                  {t.fpsDesc}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    gameAudio.playCrispClick();
                    setTargetFps(60);
                  }}
                  className={`px-3 py-1 font-mono text-xs font-black border-2 border-black transition-all ${
                    targetFps === 60 ? 'bg-[#FFE000] text-black shadow-[2px_2px_0_#000]' : 'bg-slate-800 text-slate-400'
                  }`}>
                  60 FPS
                </button>
                <button
                  onClick={() => {
                    gameAudio.playCrispClick();
                    setTargetFps(30);
                  }}
                  className={`px-3 py-1 font-mono text-xs font-black border-2 border-black transition-all ${
                    targetFps === 30 ? 'bg-[#FFE000] text-black shadow-[2px_2px_0_#000]' : 'bg-slate-800 text-slate-400'
                  }`}>
                  30 FPS
                </button>
              </div>
            </div>

            {/* Audio Controls */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  const newMuted = gameAudio.toggleMute();
                  setSfxMuted(newMuted);
                }}
                className={`py-3 px-3 border-2 border-black font-mono font-black text-xs flex items-center justify-center gap-2 transition-all ${
                  sfxMuted ? 'bg-red-950 text-red-300' : 'bg-[#00F0FF] text-black shadow-[2px_2px_0_#000]'
                }`}>
                {sfxMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                {t.sfx}: {sfxMuted ? t.off : t.on}
              </button>
              <button
                onClick={() => setMusicMuted((prev) => !prev)}
                className={`py-3 px-3 border-2 border-black font-mono font-black text-xs flex items-center justify-center gap-2 transition-all ${
                  musicMuted ? 'bg-red-950 text-red-300' : 'bg-[#00F0FF] text-black shadow-[2px_2px_0_#000]'
                }`}>
                {musicMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                {t.bgm}: {musicMuted ? t.off : t.on}
              </button>
            </div>

            {/* Reset Progress Button */}
            <button
              onClick={() => {
                if (window.confirm(t.resetConfirm)) {
                  handleResetProgress();
                }
              }}
              className="w-full py-2.5 px-4 bg-red-950/60 hover:bg-red-900 border-2 border-red-700 text-red-300 font-mono font-black text-xs uppercase transition-colors">
              {t.resetProgress}
            </button>
          </div>

          <div className="relative z-10 w-full flex items-center justify-between border-t-4 border-[#00F0FF] bg-black px-4 py-2 shrink-0 font-mono text-xs font-black text-slate-400">
            <span>{t.copyright}</span>
            <button
              onClick={() => transitionToScene('SCENE_TITLE')}
              className="text-[#FFE000] hover:text-white transition-colors">
              [ESC] {t.quitToTitle}
            </button>
          </div>
        </div>
      )}

      {/* SCENE: DEDICATED FULL-SCREEN VICTORY TALLY SCENE (ARCADE STANDARD - ZERO MODALS) */}
      {currentScene === 'SCENE_VICTORY_TALLY' && victoryTally && (
        <div className="fixed inset-0 z-40 w-full h-full flex flex-col justify-between p-4 md:p-8 bg-[#090b14] overflow-hidden select-none relative animate-fadeIn">
          {/* Vibrant Scenery Background with Soft Edge Vignette */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <img
              src={ASSETS_MANIFEST[victoryTally.bossAsset || 'bg_crystal_citadel']}
              alt="Victory Scenery"
              className="w-full h-full object-cover scale-105 filter brightness-90 contrast-120 saturate-115"
            />
            {/* Subtle Edge Vignette Only: Scenery remains vibrant and prominent */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(9,11,20,0.75)_100%)]" />
            <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#090b14]/90 via-[#090b14]/40 to-transparent" />
            <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[#090b14]/80 to-transparent" />
          </div>

          {/* Top Marquee Header Bar */}
          <div className="relative z-10 w-full flex items-center justify-between border-b-4 border-[#FFE000] bg-black/90 px-4 py-2 shrink-0 shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-[#FF0055] text-white font-mono font-black text-xs tracking-widest border border-white">
                {t.missionAccomplished}
              </span>
              <span className="text-[#00F0FF] font-mono text-xs font-black tracking-widest hidden sm:inline">
                SECTOR {victoryTally.stageCode} COMPLETED
              </span>
            </div>
            <div className="text-xs font-mono font-black text-[#FFE000] animate-pulse">
              ★ STAGE CLEAR RATING: S-RANK ★
            </div>
          </div>

          {/* Centerpiece: Banner, Hero Visual, and Tally Counter */}
          <div className="relative z-10 w-full max-w-2xl mx-auto flex flex-col items-center my-auto">
            {/* Stage Clear / Boss Defeated Arcade Banner */}
            <div className="text-center mb-3">
              <h1
                className="text-4xl md:text-6xl font-black text-[#FFE000] tracking-tight uppercase leading-none drop-shadow-[4px_4px_0_#FF0055]"
                style={{
                  textShadow: '3px 3px 0 #FF0055, 6px 6px 0 #000, 0 0 25px rgba(255,224,0,0.8)',
                }}>
                {victoryTally.isBoss ? t.bossDefeated : t.stageClear}
              </h1>
              <div className="text-xs md:text-sm font-mono font-black text-[#00F0FF] uppercase tracking-widest mt-1">
                {victoryTally.stageName}
              </div>
            </div>

            {/* Hero Visual: Animated Celestial Fragment or Defeated Boss Emblem */}
            <div className="relative w-28 h-28 md:w-36 md:h-36 mb-4 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#FFE000]/30 to-[#00F0FF]/30 border-2 border-[#FFE000] animate-ping" />
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-black/90 border-4 border-[#FFE000] shadow-[0_0_30px_rgba(255,224,0,0.7)] flex items-center justify-center p-2 relative z-10">
                {victoryTally.fragmentUnlocked ? (
                  <img
                    src={ASSETS_MANIFEST.item_celestial_fragment}
                    alt="Celestial Fragment"
                    className="w-16 h-16 md:w-20 md:h-20 object-contain drop-shadow-[0_0_15px_#00F0FF] animate-bounce"
                  />
                ) : (
                  <Trophy size={48} className="text-[#FFE000] animate-bounce drop-shadow-[0_0_15px_#FFE000]" />
                )}
              </div>
            </div>

            {/* Fast Arcade Numeric Score Tally Box */}
            <div className="w-full bg-black/90 border-4 border-black shadow-[6px_6px_0_#000] p-4 md:p-5 mb-3 font-mono">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center border-b-2 border-slate-800 pb-3 mb-3">
                <div className="p-2 bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-black uppercase">{t.stageScore}</div>
                  <div className="text-lg md:text-xl font-black text-[#00F0FF]">
                    {Math.round((victoryTally.stageScore * tallyProgress) / 100)}
                  </div>
                </div>
                <div className="p-2 bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-black uppercase">{t.crystals}</div>
                  <div className="text-lg md:text-xl font-black text-[#FFE000]">
                    {Math.round((victoryTally.crystals * tallyProgress) / 100)}
                  </div>
                </div>
                <div className="p-2 bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-black uppercase">{t.celestialCore}</div>
                  <div className="text-lg md:text-xl font-black text-[#FF0055]">
                    {victoryTally.fragmentUnlocked ? `${victoryTally.fragmentUnlocked}/5` : '5/5'}
                  </div>
                </div>
                <div className="p-2 bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-black uppercase">{t.timeBonus}</div>
                  <div className="text-lg md:text-xl font-black text-[#00F0FF]">
                    +{Math.round((victoryTally.timeBonus * tallyProgress) / 100)}
                  </div>
                </div>
              </div>

              {/* Total Score Highlight Row */}
              <div className="flex items-center justify-between px-2 pt-1 text-xs md:text-sm font-black">
                <span className="text-slate-300">{t.totalScore}:</span>
                <span className="text-2xl font-black text-[#FFE000] drop-shadow-[0_0_10px_#FFE000]">
                  {Math.round((victoryTally.totalScore * tallyProgress) / 100)} PTS
                </span>
              </div>
            </div>

            {/* Concise 1-Line Power-Up Text in Sharp Golden Arcade Font */}
            <div className="w-full px-4 py-2 bg-gradient-to-r from-[#FF0055]/30 via-[#FFE000]/30 to-[#00F0FF]/30 border-2 border-[#FFE000] text-center mb-4">
              <span className="text-xs md:text-sm font-mono font-black text-[#FFE000] uppercase tracking-wider">
                {victoryTally.powerUpText}
              </span>
            </div>

            {/* Flashing Bottom Prompt with 5s Auto-Advance Countdown */}
            <button
              onClick={handleAdvanceFromTally}
              className="px-6 py-3 bg-[#FFE000] hover:bg-white text-black font-mono font-black text-sm md:text-base uppercase tracking-widest border-4 border-black shadow-[4px_4px_0_#000] active:translate-x-1 active:translate-y-1 transition-all animate-pulse">
              [ {t.continuePrompt} ({t.autoAdvance} {tallyCountdown}s) ]
            </button>
          </div>

          {/* Bottom Footer Bar */}
          <div className="relative z-10 w-full flex items-center justify-between border-t-4 border-[#FFE000] bg-black px-4 py-2 shrink-0 font-mono text-xs font-black text-slate-400">
            <span>© 1996 ANDYCROW GAMES • EL VIAJE DEL DESTINO</span>
            <span className="text-[#00F0FF]">[ESPACIO / ENTER / TAP] CONTINUAR</span>
          </div>
        </div>
      )}

      {/* SCENE: FULL-SCREEN POST-BOSS DEFEAT CINEMATIC SHOWCASE */}
      {currentScene === 'SCENE_BOSS_DEFEATED' && bossDefeatedData && (
        <div className="fixed inset-0 z-40 w-full h-full flex flex-col justify-between p-1 sm:p-3 md:p-6 bg-[#090b14] overflow-hidden select-none relative animate-fadeIn">
          {/* Defeated Boss Lair Background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <img
              src={ASSETS_MANIFEST[bossDefeatedData.bgAsset || 'bg_mid_ruins']}
              alt="Boss Lair"
              className="w-full h-full object-cover scale-105 filter brightness-75 contrast-125 saturate-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#090b14] via-[#090b14]/75 to-[#090b14]/50" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#090b14_90%)]" />
          </div>

          {/* Top Marquee Bar */}
          <div className="relative z-10 w-full flex items-center justify-between border-b sm:border-b-4 border-[#FFE000] bg-black/90 px-2 sm:px-4 py-0.5 sm:py-1.5 shrink-0 shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="px-1.5 sm:px-2.5 py-0.5 bg-[#FF0055] text-white font-mono font-black text-[9px] sm:text-xs tracking-widest border border-white">
                VICTORIA DECISIVA
              </span>
              <span className="text-[#00F0FF] font-mono text-[9px] sm:text-xs font-black tracking-widest hidden sm:inline">
                COMANDANTE SOMBRÍO DERROTADO
              </span>
            </div>
            <div className="text-[9px] sm:text-xs font-mono font-black text-[#FFE000] animate-pulse">
              ✦ FRAGMENTO {bossDefeatedData.fragmentNumber}/5 ✦
            </div>
          </div>

          {/* Centerpiece Stage: Responsive side-by-side in landscape, stacked in portrait */}
          <div className="relative z-10 w-full max-w-4xl mx-auto flex-1 min-h-0 flex flex-col landscape:flex-row items-center justify-start sm:justify-center gap-1.5 sm:gap-4 my-auto p-1 overflow-hidden">
            {/* Cinematic Diorama Box */}
            <div className="relative w-full max-w-md landscape:w-1/2 h-36 sm:h-52 md:h-60 landscape:h-52 bg-black/85 border sm:border-2 md:border-4 border-black shadow-[3px_3px_0_#000] overflow-hidden flex items-end justify-center pb-2 sm:pb-4 shrink-0">
              {/* Radial aura behind the recovered fragment */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-36 h-36 sm:w-48 sm:h-48 rounded-full bg-gradient-to-b from-amber-400/30 via-cyan-400/20 to-transparent blur-xl pointer-events-none" />

              {/* Stone Platform Floor */}
              <div className="absolute inset-x-0 bottom-0 h-6 sm:h-8 bg-slate-900 border-t border-slate-700 flex items-center justify-center">
                <div className="w-full h-1 bg-cyan-500/40" />
              </div>

              {/* Fallen Boss Sprite */}
              <div className="relative z-10 flex items-end mr-3 sm:mr-8">
                {bossDefeatedData.bossType === 'CELESTIAL_DEITY' && (
                  <div className="relative w-24 h-24 sm:w-36 sm:h-36 md:w-44 md:h-44 flex items-end">
                    <img
                      src={ASSETS_MANIFEST.boss_celestial_deity_spritesheet_death}
                      alt="Dios Cósmico Asura Caído"
                      style={{
                        objectFit: 'cover',
                        objectPosition: '100% 0%',
                        imageRendering: 'pixelated',
                      }}
                      className="w-full h-full filter brightness-75 contrast-125"
                    />
                  </div>
                )}
                {bossDefeatedData.bossType === 'FROST_EMPRESS' && (
                  <div className="relative w-24 h-24 sm:w-36 sm:h-36 md:w-44 md:h-44 flex items-end">
                    <img
                      src={ASSETS_MANIFEST.boss_frost_empress_spritesheet_death}
                      alt="Reina de Hielo Kryona Caída"
                      style={{
                        objectFit: 'cover',
                        objectPosition: '100% 0%',
                        imageRendering: 'pixelated',
                      }}
                      className="w-full h-full filter brightness-75 contrast-125"
                    />
                  </div>
                )}
                {bossDefeatedData.bossType === 'DRAGON' && (
                  <div className="relative w-28 h-20 sm:w-44 sm:h-32 md:w-52 md:h-36 flex items-end">
                    <img
                      src={ASSETS_MANIFEST.boss_volcanic_dragon}
                      alt="Dragón Volcánico Caído"
                      style={{
                        imageRendering: 'pixelated',
                        transform: 'rotate(24deg) translateY(8px)',
                      }}
                      className="w-full h-full object-contain filter brightness-75 contrast-125"
                    />
                  </div>
                )}
                {bossDefeatedData.bossType === 'CHIMERA' && (
                  <div className="relative w-24 h-18 sm:w-36 sm:h-28 md:w-44 md:h-32 flex items-end">
                    <img
                      src={ASSETS_MANIFEST.boss_electric_chimera}
                      alt="Escarabajo Quimérico Caído"
                      style={{
                        imageRendering: 'pixelated',
                        transform: 'rotate(30deg) translateY(8px)',
                      }}
                      className="w-full h-full object-contain filter brightness-75 contrast-125"
                    />
                  </div>
                )}
              </div>

              {/* Victorious Mouler Holding the Fragment Alight */}
              <div className="relative z-10 flex flex-col items-center ml-1 sm:ml-2">
                <div className="relative mb-0.5 sm:mb-1 flex items-center justify-center">
                  <div className="w-8 h-8 sm:w-14 sm:h-14 rounded-full bg-amber-400/40 border border-amber-300 animate-ping absolute" />
                  <img
                    src={ASSETS_MANIFEST.item_celestial_fragment}
                    alt="Fragmento Celestial"
                    className="w-8 h-8 sm:w-12 sm:h-12 object-contain drop-shadow-[0_0_12px_#fde047] animate-bounce relative z-20"
                  />
                </div>

                <div className="w-10 h-10 sm:w-14 sm:h-14">
                  <img
                    src={ASSETS_MANIFEST.titan_voltlynx_sprite_idle}
                    alt="Mouler Guerrero Orgriniano"
                    style={{
                      objectFit: 'cover',
                      objectPosition: '0% 0%',
                      imageRendering: 'pixelated',
                    }}
                    className="w-full h-full filter drop-shadow-[0_0_8px_#00f0ff]"
                  />
                </div>
              </div>
            </div>

            {/* Details Column: Title Billboard + Lore Card + Advance Action */}
            <div className="w-full max-w-md landscape:w-1/2 flex flex-col items-center text-center shrink-0">
              {/* Title Billboard */}
              <div className="mb-1 sm:mb-2">
                <span className="px-2 py-0.5 bg-[#FF0055]/30 border border-[#FF0055] text-[#FF0055] text-[9px] sm:text-[11px] font-mono font-black uppercase tracking-widest">
                  EL GUARDIÁN HA CAÍDO
                </span>
                <h1
                  className="text-lg sm:text-2xl md:text-4xl font-black text-[#FFE000] tracking-tight uppercase leading-none drop-shadow mt-0.5 mb-0.5"
                  style={{
                    textShadow: '2px 2px 0 #FF0055, 3px 3px 0 #000, 0 0 15px rgba(255,224,0,0.7)',
                  }}>
                  {bossDefeatedData.bossName}
                </h1>
                <p className="text-[10px] sm:text-xs font-mono text-slate-300 italic">
                  "{bossDefeatedData.bossSubtitle}"
                </p>
              </div>

              {/* Fragment Lore & Power Card */}
              <div className="w-full bg-black/90 border sm:border-2 border-[#00F0FF] p-2 sm:p-3 text-center font-mono shadow-[2px_2px_0_#000] mb-2 sm:mb-3">
                <div className="text-[10px] sm:text-xs font-black text-[#FFE000] uppercase tracking-wider mb-0.5">
                  ✦ {bossDefeatedData.fragmentTitle} ✦
                </div>
                <p className="text-[10px] sm:text-xs text-cyan-200 font-medium leading-snug">
                  {bossDefeatedData.fragmentPower}
                </p>
              </div>

              {/* Advance Prompt with Auto-Timer */}
              <button
                onClick={() => {
                  gameAudio.playConfirmSelect();
                  setCurrentScene('SCENE_GAMEPLAY');
                  startWalkingTransition(bossDefeatedData.nextLevel);
                }}
                className="w-full py-2 sm:py-3 px-3 sm:px-6 bg-[#FFE000] hover:bg-white text-black font-mono font-black text-[11px] sm:text-xs md:text-sm uppercase tracking-wider border sm:border-2 border-black shadow-[2px_2px_0_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-1.5 animate-pulse">
                <span>AVANZAR AL SIGUIENTE SECTOR</span>
                <span className="text-[10px]">({Math.ceil(bossDefeatedData.timer)}s)</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Bottom Footer Bar */}
          <div className="relative z-10 w-full flex items-center justify-between border-t sm:border-t-4 border-[#FFE000] bg-black px-2 sm:px-4 py-1 shrink-0 font-mono text-[9px] sm:text-xs font-black text-slate-400">
            <span>© 2026 AndyCrow Games • {t.gameTitle}</span>
            <span className="text-[#00F0FF]">[TAP / ENTER] AVANZAR</span>
          </div>
        </div>
      )}

      {/* SCENE: GRAND EPILOGUE CINEMATIC SEQUENCE (AFTER FINAL BOSS GHOTUR DEMON) */}
      {currentScene === 'SCENE_EPILOGUE' && (() => {
        const EPILOGUE_SLIDES = [
          {
            imageKey: 'cinematic_epilogue_01_ghotur_fallen',
            act: 'ACTO I • LA CAÍDA DEL TIRANO DEL VACÍO',
            title: 'Ghotur se desploma en el abismo',
            badge: '✦ QUINTO FRAGMENTO LIBERADO (5/5) ✦',
            text: 'Con un último rugido que desgarró las dimensiones, el Titán Demoníaco Ghotur se desplomó derrotado sobre el basalto. Su tridente del vacío se quebró en pedazos y de su pecho emergió el Quinto y Mayor Fragmento del Núcleo Celestial, liberado de siglos de oscuridad.',
            proceduralType: 'GHOTUR_FALLEN',
          },
          {
            imageKey: 'cinematic_epilogue_02_reconstructing_core',
            act: 'ACTO II • LA RECONSTRUCCIÓN DEL NÚCLEO CELESTIAL',
            title: 'La Perla de Energía de su padre despierta',
            badge: '✦ NÚCLEO CELESTIAL RESTAURADO AL 100% ✦',
            text: 'Sosteniendo la Perla de Energía que su padre le confió en su último aliento, Mouler reunió los 5 fragmentos celestiales. Al fusionarse con su alma orgriniana, los cristales resonaron en una perfecta armonía cósmica. La grieta dimensional se cerró y el sagrado Núcleo Celestial renació en su plenitud.',
            proceduralType: 'CORE_RESTORED',
          },
          {
            imageKey: 'cinematic_epilogue_03_world_restored',
            act: 'ACTO III • EL RENACER DE AETHERIA',
            title: 'Paz, honor y la promesa cumplida',
            badge: '✦ VICTORIA TOTAL • PAZ ETERNA ✦',
            text: 'La luz dorada del Núcleo restaurado se esparció por todos los valles, cordilleras y cavernas. Las plantas volvieron a brotar, las criaturas sanaron y la aldea orgriniana renació con júbilo. Mirando al firmamento azul en paz, Mouler sonrió sabiendo que el sacrificio de su padre había sido honrado. El viaje del destino había concluido.',
            proceduralType: 'WORLD_PEACE',
          },
        ];

        const slide = EPILOGUE_SLIDES[epilogueSlide] || EPILOGUE_SLIDES[0];
        const hasCustomImg =
          assets[slide.imageKey] &&
          assets[slide.imageKey]!.complete &&
          assets[slide.imageKey]!.naturalWidth > 0;

        return (
          <div className="fixed inset-0 z-40 w-full h-full flex flex-col justify-between p-4 md:p-8 bg-[#090b14] overflow-hidden select-none relative animate-fadeIn">
            {/* Background Atmosphere */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <img
                src={
                  epilogueSlide === 2
                    ? ASSETS_MANIFEST.bg_plains_meadows
                    : epilogueSlide === 1
                    ? ASSETS_MANIFEST.bg_celestial_throne
                    : ASSETS_MANIFEST.bg_ghotur_demonic_abyss
                }
                alt="Epilogue Background"
                className="w-full h-full object-cover scale-105 filter brightness-50 contrast-125"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#090b14] via-[#090b14]/75 to-[#090b14]/60" />
            </div>

            {/* Top Epilogue Header */}
            <div className="relative z-10 w-full flex items-center justify-between border-b-4 border-[#FFE000] bg-black/90 px-4 py-2 shrink-0 shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-[#FFE000] text-black font-mono font-black text-xs tracking-widest">
                  {t.epilogueTitle}
                </span>
                <span className="text-[#00F0FF] font-mono text-xs font-black tracking-widest hidden sm:inline">
                  {slide.act}
                </span>
              </div>
              <div className="text-xs font-mono font-black text-amber-300">
                {epilogueSlide + 1} / 3
              </div>
            </div>

            {/* Centerpiece Cinema Slide */}
            <div className="relative z-10 w-full max-w-3xl mx-auto flex flex-col items-center my-auto">
              {/* Illustration Showcase Window */}
              <div className="relative w-full h-64 md:h-76 bg-black border-4 border-black shadow-[6px_6px_0_#000] overflow-hidden flex items-center justify-center mb-4">
                {hasCustomImg ? (
                  /* Custom User Asset Slot */
                  <img
                    src={ASSETS_MANIFEST[slide.imageKey]}
                    alt={slide.title}
                    className="w-full h-full object-cover scale-105 filter brightness-95 contrast-110"
                  />
                ) : (
                  /* High-Quality Native Procedural Cinematic Fallback */
                  <div className="w-full h-full relative overflow-hidden flex items-center justify-center p-6 text-center">
                    {slide.proceduralType === 'GHOTUR_FALLEN' && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-rose-950 via-slate-900 to-slate-950 p-6">
                        {/* Fallen Ghotur Silhouette + Detaching Radiant Fragment */}
                        <div className="relative mb-3 flex items-center justify-center">
                          {/* Glowing 5th fragment rising */}
                          <div className="w-20 h-20 rounded-full bg-amber-400/40 border-2 border-amber-300 animate-ping absolute" />
                          <img
                            src={ASSETS_MANIFEST.item_celestial_fragment}
                            alt="Quinto Fragmento"
                            className="w-16 h-16 object-contain drop-shadow-[0_0_24px_#fde047] animate-bounce relative z-20"
                          />
                        </div>
                        <div className="text-sm font-black text-[#FFE000] uppercase tracking-wider mb-1">
                          ✦ EL QUINTO Y MAYOR FRAGMENTO SE DESPRENDE ✦
                        </div>
                        <p className="text-xs text-rose-200/80 max-w-md">
                          Ghotur yace derrotado. El núcleo corrupto se libera en haces de luz dorada.
                        </p>
                      </div>
                    )}

                    {slide.proceduralType === 'CORE_RESTORED' && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-950 p-6">
                        {/* 5 Orbiting Fragments Uniting around Energy Pearl */}
                        <div className="relative w-36 h-36 mb-2 flex items-center justify-center">
                          {/* Radiant Energy Pearl Core */}
                          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-300 via-cyan-300 to-white shadow-[0_0_35px_#FFE000] animate-pulse flex items-center justify-center">
                            <Sparkles size={32} className="text-amber-500 animate-spin" />
                          </div>
                          {/* Orbiting fragments */}
                          {[0, 1, 2, 3, 4].map((i) => (
                            <div
                              key={i}
                              style={{
                                transform: `rotate(${i * 72}deg) translate(52px) rotate(-${i * 72}deg)`,
                              }}
                              className="absolute w-5 h-5 rounded-sm bg-cyan-300 border border-white shadow-[0_0_10px_#00F0FF] animate-pulse"
                            />
                          ))}
                        </div>
                        <div className="text-sm font-black text-[#00F0FF] uppercase tracking-wider mb-1">
                          ✦ LOS 5 FRAGMENTOS SE FUSIONAN EN ARMONÍA ✦
                        </div>
                        <p className="text-xs text-cyan-200/80 max-w-md">
                          La Perla de Energía canaliza el espíritu orgriniano restaurando el Núcleo Celestial completo.
                        </p>
                      </div>
                    )}

                    {slide.proceduralType === 'WORLD_PEACE' && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-sky-950 via-emerald-950 to-slate-950 p-6">
                        {/* Restored Blooming Sanctuary */}
                        <div className="w-20 h-20 rounded-full bg-amber-400/20 border-2 border-emerald-400 flex items-center justify-center shadow-[0_0_30px_#22c55e] mb-3">
                          <Trophy size={42} className="text-amber-300 animate-bounce" />
                        </div>
                        <div className="text-base font-black text-[#FFE000] uppercase tracking-wider mb-1">
                          ✦ AETHERIA RENACE EN PAZ ✦
                        </div>
                        <p className="text-xs text-emerald-200/90 max-w-md">
                          La luz sagrada baña la aldea de Mouler. La estirpe orgriniana está a salvo y la venganza concluida.
                        </p>
                      </div>
                    )}

                    {/* Notification Slot Pill */}
                    <div className="absolute bottom-2 right-2 px-2.5 py-0.5 rounded bg-black/80 border border-slate-700 text-[10px] font-mono text-slate-400">
                      Slot: {slide.imageKey}
                    </div>
                  </div>
                )}

                {/* Act Badge Tag */}
                <div className="absolute top-2 left-2 px-3 py-1 bg-[#FF0055] text-white font-mono font-black text-[10px] border border-black shadow">
                  {slide.badge}
                </div>
              </div>

              {/* Subtitle Dialogue Card */}
              <div className="w-full bg-black/95 border-4 border-[#FFE000] p-4 text-center font-mono shadow-[4px_4px_0_#000] mb-4">
                <h3 className="text-sm md:text-base font-black text-[#FFE000] uppercase tracking-wider mb-1">
                  {slide.title}
                </h3>
                <p className="text-xs md:text-sm text-slate-200 font-medium leading-relaxed">
                  {slide.text}
                </p>
              </div>

              {/* Navigation Bar */}
              <div className="w-full flex items-center justify-between">
                <button
                  disabled={epilogueSlide === 0}
                  onClick={() => {
                    gameAudio.playCrispClick();
                    setEpilogueSlide((s) => Math.max(0, s - 1));
                  }}
                  className={`px-4 py-2 bg-slate-900 border-2 border-black font-mono font-bold text-xs uppercase ${
                    epilogueSlide === 0
                      ? 'opacity-30 cursor-not-allowed'
                      : 'hover:bg-slate-800 text-white'
                  }`}>
                  ◀ {t.previous}
                </button>

                {epilogueSlide < EPILOGUE_SLIDES.length - 1 ? (
                  <button
                    onClick={() => {
                      gameAudio.playConfirmSelect();
                      setEpilogueSlide((s) => s + 1);
                    }}
                    className="px-6 py-2.5 bg-[#FFE000] hover:bg-white text-black font-mono font-black text-xs md:text-sm uppercase tracking-widest border-3 border-black shadow-[3px_3px_0_#000] flex items-center gap-1.5 transition-all">
                    <span>{t.next}</span>
                    <ChevronRight size={18} />
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      gameAudio.playVictoryFanfare();
                      transitionToScene('SCENE_TITLE', () => {
                        setGameState((s) => ({ ...s, status: 'START' }));
                      });
                    }}
                    className="px-6 py-2.5 bg-[#00F0FF] hover:bg-white text-black font-mono font-black text-xs md:text-sm uppercase tracking-widest border-3 border-black shadow-[3px_3px_0_#000] flex items-center gap-2 animate-pulse">
                    <Trophy size={18} />
                    <span>✦ {t.seeFinalCredits} ✦</span>
                  </button>
                )}
              </div>
            </div>

            {/* Bottom Footer Bar */}
            <div className="relative z-10 w-full flex items-center justify-between border-t-4 border-[#FFE000] bg-black px-4 py-2 shrink-0 font-mono text-xs font-black text-slate-400">
              <span>{t.copyright}</span>
              <span className="text-[#00F0FF]">{t.endOfAdventure}</span>
            </div>
          </div>
        );
      })()}

      {/* IN-GAME ARCADE PAUSE MENU */}
      {isGameMenuOpen && currentScene === 'SCENE_GAMEPLAY' && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-start sm:justify-center p-2 sm:p-4 overflow-y-auto overflow-x-hidden select-none animate-fadeIn">
          <div className="w-full max-w-sm flex flex-col items-center text-center my-auto py-2">
            {/* Header Marquee */}
            <div className="mb-2 sm:mb-4 md:mb-6">
              <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-[#FF0055] text-white font-mono font-black text-[10px] sm:text-xs tracking-widest uppercase border-2 border-black shadow-[2px_2px_0_#000]">
                {t.paused}
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#FFE000] tracking-wider uppercase drop-shadow-[3px_3px_0_#000] mt-1 sm:mt-2">
                {t.pauseTitle}
              </h2>
              <div className="text-[10px] sm:text-[11px] font-mono text-cyan-300 font-bold mt-0.5 sm:mt-1 tracking-widest">
                SECTOR {currentLevelNumber} • {t.livesLabel}: x{gameState.lives} • SCORE: {gameState.score}
              </div>
            </div>

            {/* Exactly 4 Clean Vertical Options */}
            <div className="w-full flex flex-col gap-2 sm:gap-3">
              {/* OPTION 0: REANUDAR (RESUME) */}
              <button
                onClick={() => {
                  gameAudio.playCrispClick();
                  setIsGameMenuOpen(false);
                }}
                onMouseEnter={() => {
                  setPauseMenuIndex(0);
                  gameAudio.playHoverMicroTone();
                }}
                className={`w-full py-2 sm:py-3.5 px-3 sm:px-5 font-mono font-black text-xs sm:text-sm uppercase tracking-wider border-2 sm:border-3 border-black shadow-[3px_3px_0_#000] sm:shadow-[4px_4px_0_#000] flex items-center justify-between transition-all ${
                  pauseMenuIndex === 0
                    ? 'bg-[#FFE000] text-black scale-102 shadow-[0_0_20px_rgba(255,224,0,0.8)]'
                    : 'bg-slate-900/90 text-white hover:bg-slate-800'
                }`}>
                <span className="flex items-center gap-2">
                  <Play size={16} className={pauseMenuIndex === 0 ? 'fill-black' : ''} />
                  <span>{t.resume}</span>
                </span>
                <span className="text-xs">{pauseMenuIndex === 0 ? '▶' : ''}</span>
              </button>

              {/* OPTION 1: REINICIAR NIVEL (RESTART LEVEL) */}
              <button
                onClick={() => {
                  gameAudio.playPowerupChime();
                  setIsGameMenuOpen(false);
                  initGame(currentLevelRef.current);
                }}
                onMouseEnter={() => {
                  setPauseMenuIndex(1);
                  gameAudio.playHoverMicroTone();
                }}
                className={`w-full py-2 sm:py-3.5 px-3 sm:px-5 font-mono font-black text-xs sm:text-sm uppercase tracking-wider border-2 sm:border-3 border-black shadow-[3px_3px_0_#000] sm:shadow-[4px_4px_0_#000] flex items-center justify-between transition-all ${
                  pauseMenuIndex === 1
                    ? 'bg-[#FFE000] text-black scale-102 shadow-[0_0_20px_rgba(255,224,0,0.8)]'
                    : 'bg-slate-900/90 text-white hover:bg-slate-800'
                }`}>
                <span className="flex items-center gap-2">
                  <RotateCw size={16} />
                  <span>{t.restartLevel}</span>
                </span>
                <span className="text-xs">{pauseMenuIndex === 1 ? '▶' : ''}</span>
              </button>

              {/* OPTION 2: SONIDO Y CRT */}
              <div
                onMouseEnter={() => {
                  setPauseMenuIndex(2);
                }}
                className={`w-full py-2 sm:py-3 px-3 sm:px-4 font-mono font-black text-xs sm:text-sm uppercase tracking-wider border-2 sm:border-3 border-black shadow-[3px_3px_0_#000] sm:shadow-[4px_4px_0_#000] flex flex-col gap-1.5 sm:gap-2 transition-all ${
                  pauseMenuIndex === 2
                    ? 'bg-slate-900 border-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.6)]'
                    : 'bg-slate-900/90 text-white border-black'
                }`}>
                <div className="flex items-center justify-between text-xs text-[#00F0FF]">
                  <span className="flex items-center gap-1.5">
                    <Settings size={14} />
                    <span>{t.soundAndCrt}</span>
                  </span>
                  <span className="text-[10px] text-slate-400">{pauseMenuIndex === 2 ? '▶' : ''}</span>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const nextMuted = gameAudio.toggleMute();
                      setSfxMuted(nextMuted);
                    }}
                    className={`py-1 px-1 rounded text-[10px] font-mono font-black border transition-all ${
                      sfxMuted
                        ? 'bg-red-950/80 text-red-300 border-red-700'
                        : 'bg-cyan-950/80 text-cyan-200 border-cyan-500'
                    }`}>
                    SFX: {sfxMuted ? t.off : t.on}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMusicMuted((prev) => !prev);
                    }}
                    className={`py-1 px-1 rounded text-[10px] font-mono font-black border transition-all ${
                      musicMuted
                        ? 'bg-red-950/80 text-red-300 border-red-700'
                        : 'bg-cyan-950/80 text-cyan-200 border-cyan-500'
                    }`}>
                    BGM: {musicMuted ? t.off : t.on}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCrtScanlines();
                    }}
                    className={`py-1 px-1 rounded text-[10px] font-mono font-black border transition-all ${
                      crtScanlines
                        ? 'bg-cyan-950/80 text-cyan-200 border-cyan-500'
                        : 'bg-slate-950 text-slate-400 border-slate-700'
                    }`}>
                    CRT: {crtScanlines ? t.on : t.off}
                  </button>
                </div>
              </div>

              {/* OPTION 3: SALIR AL MENÚ PRINCIPAL */}
              <button
                onClick={() => {
                  gameAudio.playCrispClick();
                  setIsGameMenuOpen(false);
                  transitionToScene('SCENE_TITLE', () => {
                    setGameState((s) => ({ ...s, status: 'START' }));
                  });
                }}
                onMouseEnter={() => {
                  setPauseMenuIndex(3);
                  gameAudio.playHoverMicroTone();
                }}
                className={`w-full py-2 sm:py-3.5 px-3 sm:px-5 font-mono font-black text-xs sm:text-sm uppercase tracking-wider border-2 sm:border-3 border-black shadow-[3px_3px_0_#000] sm:shadow-[4px_4px_0_#000] flex items-center justify-between transition-all ${
                  pauseMenuIndex === 3
                    ? 'bg-[#FF0055] text-white scale-102 shadow-[0_0_20px_rgba(255,0,85,0.8)]'
                    : 'bg-slate-900/90 text-red-400 hover:bg-slate-800'
                }`}>
                <span className="flex items-center gap-2">
                  <X size={16} />
                  <span>{t.quitToTitle}</span>
                </span>
                <span className="text-xs">{pauseMenuIndex === 3 ? '▶' : ''}</span>
              </button>
            </div>

            {/* Arcade Footer Key Reminder */}
            <div className="mt-2 sm:mt-6 text-[10px] font-mono text-slate-400 flex items-center justify-center gap-3">
              <span>[↑ / ↓] NAVEGAR</span>
              <span>•</span>
              <span>[ENTER] ELEGIR</span>
              <span>•</span>
              <span className="text-[#FFE000]">[ESC / P] REANUDAR</span>
            </div>
          </div>
        </div>
      )}

      {/* DEDICATED FULL-SCREEN GAME OVER SCENE */}
      {gameState.status === 'GAME_OVER' && (
        <div className="fixed inset-0 z-50 w-full h-full flex flex-col items-center justify-between p-6 md:p-10 bg-black/95 select-none relative overflow-hidden animate-fadeIn">
          {/* Top Marquee */}
          <div className="w-full flex items-center justify-between border-b-4 border-[#FF0055] pb-2 font-mono text-xs font-black text-slate-400">
            <span className="text-[#FF0055]">SYSTEM CRITICAL • RUN DEPLETED</span>
            <span className="text-[#FFE000] animate-pulse">CREDIT 00</span>
          </div>

          {/* Central Billboard */}
          <div className="flex flex-col items-center text-center my-auto">
            <div className="w-20 h-20 rounded-full bg-red-600/20 border-4 border-[#FF0055] flex items-center justify-center mb-4 text-[#FF0055] shadow-[0_0_30px_rgba(255,0,85,0.6)] animate-pulse">
              <RotateCw size={44} className="text-[#FF0055]" />
            </div>

            <h1
              className="text-6xl md:text-8xl font-black text-[#FF0055] tracking-tighter uppercase drop-shadow-[4px_4px_0_#000] leading-none mb-2"
              style={{
                textShadow: '4px 4px 0 #000, 0 0 35px rgba(255,0,85,0.9)',
              }}>
              {t.gameOver}
            </h1>

            <div className="text-xs md:text-sm font-mono font-bold text-amber-300 uppercase tracking-widest mb-6">
              SECTOR {currentLevelRef.current} • {t.missionFailed}
            </div>

            {/* Scorecard Box */}
            <div className="w-full max-w-sm bg-slate-950 border-4 border-black p-4 mb-6 grid grid-cols-2 gap-3 text-center font-mono shadow-[4px_4px_0_#000]">
              <div className="p-2 bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">{t.stageScore}</div>
                <div className="text-xl font-black text-[#00F0FF]">{gameState.score}</div>
              </div>
              <div className="p-2 bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">{t.crystals}</div>
                <div className="text-xl font-black text-[#FFE000]">{crystalsCount}</div>
              </div>
            </div>

            {/* Arcade Actions */}
            <div className="w-full max-w-sm flex flex-col gap-3">
              <button
                onClick={() => {
                  gameAudio.playPowerupChime();
                  initGame(currentLevelRef.current);
                }}
                autoFocus
                className="w-full py-4 px-6 bg-[#FFE000] hover:bg-white text-black font-mono font-black text-sm md:text-base uppercase tracking-widest border-4 border-black shadow-[4px_4px_0_#000] active:translate-x-1 active:translate-y-1 transition-all flex items-center justify-center gap-2 animate-pulse">
                <RotateCw size={18} />
                <span>{t.continueGame} [{t.retryLevel} {currentLevelRef.current}]</span>
              </button>

              <button
                onClick={() => {
                  gameAudio.playCrispClick();
                  transitionToScene('SCENE_TITLE', () => {
                    setGameState((s) => ({ ...s, status: 'START' }));
                  });
                }}
                className="w-full py-3 px-6 bg-slate-900 hover:bg-slate-800 text-slate-300 font-mono font-black text-xs uppercase tracking-wider border-2 border-slate-700 transition-all flex items-center justify-center gap-2">
                <span>{t.quitToTitle}</span>
              </button>
            </div>
          </div>

          {/* Footer Bar */}
          <div className="w-full flex items-center justify-between border-t-2 border-slate-800 pt-2 font-mono text-[10px] text-slate-500">
            <span>{t.copyright}</span>
            <span>PRESS ANY BUTTON TO CONTINUE</span>
          </div>
        </div>
      )}
    </div>
  );
}
