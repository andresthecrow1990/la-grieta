export type Language = 'en' | 'es';

export interface Translations {
  gameTitle: string;
  gameSubtitle: string;
  copyright: string;
  arcadeSystem: string;
  insertCoin: string;
  freePlay: string;
  continueGame: string;
  newGame: string;
  startAdventure: string;
  stageSelect: string;
  controls: string;
  options: string;
  prologue: string;
  selectDifficulty: string;
  chooseDestiny: string;
  difficulty: string;
  touristMode: string;
  touristDesc: string;
  touristLives: string;
  touristFeatures: string[];
  devilMode: string;
  devilDesc: string;
  devilLives: string;
  devilFeatures: string[];
  scoreMultiplier: string;
  back: string;
  skip: string;
  next: string;
  previous: string;
  startAction: string;
  sectorMission: string;
  testMode: string;
  testModeUnlocked: string;
  testModeLocked: string;
  locked: string;
  mission: string;
  reward: string;
  pauseTitle: string;
  paused: string;
  resume: string;
  restartLevel: string;
  soundAndCrt: string;
  quitToTitle: string;
  gameOver: string;
  missionFailed: string;
  retryLevel: string;
  stageClear: string;
  bossDefeated: string;
  missionAccomplished: string;
  stageScore: string;
  crystals: string;
  celestialCore: string;
  timeBonus: string;
  totalScore: string;
  autoAdvance: string;
  continuePrompt: string;
  systemSetup: string;
  crtEffect: string;
  crtDesc: string;
  fps: string;
  fpsDesc: string;
  sfx: string;
  bgm: string;
  on: string;
  off: string;
  resetProgress: string;
  resetConfirm: string;
  active: string;
  ready: string;
  keyboardTitle: string;
  arcadeButtonsTitle: string;
  movement: string;
  duck: string;
  aimVertical: string;
  retroJump: string;
  dashSprint: string;
  thunderShot: string;
  flameBlast: string;
  flashStep: string;
  secretPipeTip: string;
  mobileTouchTip: string;
  buttonJump: string;
  buttonDash: string;
  buttonShoot: string;
  buttonFlame: string;
  livesLabel: string;
  divineLivesLabel: string;
  manaLabel: string;
  slowed: string;
  epilogueTitle: string;
  finalEpilogue: string;
  endOfAdventure: string;
  seeFinalCredits: string;
  protagonistTag: string;
  savedFileTag: string;
  warningBossTag: string;
  fightStartText: string;
}

export const TRANSLATIONS: Record<Language, Translations> = {
  en: {
    gameTitle: 'THE RIFT',
    gameSubtitle: 'THE JOURNEY OF DESTINY • © 2026 ANDYCROW GAMES',
    copyright: '© 1996 ANDYCROW GAMES • THE JOURNEY OF DESTINY',
    arcadeSystem: 'ARCADE SYSTEM • 16-BIT FM',
    insertCoin: 'INSERT COIN [1 CREDIT]',
    freePlay: '• FREE PLAY •',
    continueGame: 'CONTINUE',
    newGame: 'NEW GAME',
    startAdventure: 'INSERT COIN • START GAME',
    stageSelect: 'STAGE SELECT',
    controls: 'CONTROLS',
    options: 'OPTIONS',
    prologue: 'PROLOGUE (STORY)',
    selectDifficulty: 'SELECT DIFFICULTY',
    chooseDestiny: 'CHOOSE YOUR DESTINY',
    difficulty: 'DIFFICULTY',
    touristMode: 'TOURIST MODE (EASY)',
    touristDesc: 'Accessible and balanced arcade adventure. Ideal for exploring the lore and enjoying the journey.',
    touristLives: '15 Starting Lives',
    touristFeatures: [
      '15 Lives (Friendly respawn)',
      'Balanced mob density and speeds',
      'Standard boss HP and attack rhythms',
      'Normal score gains (1x Multiplier)',
    ],
    devilMode: 'DEVIL MODE (HARD)',
    devilDesc: 'Brutal, relentless nightmare for true arcade veterans. Tripled foes, merciless bosses, and sheer chaos.',
    devilLives: '5 Starting Lives Only',
    devilFeatures: [
      '5 Lives only (Health pickups ultra-rare)',
      '3x Mob density & 2x movement speed',
      'ALL normal mobs fire projectiles!',
      'Golems hurl rocks; Shadows emerge from Zone 3',
      '2x Boss HP & Enrage mob summons at 50% HP',
      'Ghotur Titan summons 4 mini-commanders',
      '3x SCORE MULTIPLIER (Triple points!)',
    ],
    scoreMultiplier: '3x Score Multiplier',
    back: 'BACK',
    skip: 'SKIP',
    next: 'NEXT',
    previous: 'PREV',
    startAction: 'START ADVENTURE!',
    sectorMission: 'SELECT SECTOR MISSION',
    testMode: 'TEST MODE',
    testModeUnlocked: 'UNLOCKED',
    testModeLocked: 'UNLOCK ALL',
    locked: 'LOCKED',
    mission: 'MISSION',
    reward: 'REWARD ✦',
    pauseTitle: 'GAME PAUSED',
    paused: 'PAUSE',
    resume: 'RESUME',
    restartLevel: 'RESTART LEVEL',
    soundAndCrt: 'SOUND & CRT',
    quitToTitle: 'QUIT TO MAIN MENU',
    gameOver: 'GAME OVER',
    missionFailed: 'MISSION FAILED',
    retryLevel: 'RETRY LEVEL',
    stageClear: 'STAGE CLEAR!',
    bossDefeated: 'BOSS DEFEATED!',
    missionAccomplished: 'MISSION ACCOMPLISHED',
    stageScore: 'STAGE SCORE',
    crystals: 'CRYSTALS',
    celestialCore: 'CELESTIAL CORE',
    timeBonus: 'TIME BONUS',
    totalScore: 'TOTAL SCORE',
    autoAdvance: 'AUTO-ADVANCE IN',
    continuePrompt: 'PRESS [ACTION] OR WAIT',
    systemSetup: 'ARCADE SYSTEM OPTIONS',
    crtEffect: 'CRT SCANLINES EFFECT',
    crtDesc: 'Subtle retro scanlines (menus only, zero gameplay interference)',
    fps: 'TARGET FRAMERATE',
    fpsDesc: 'Smooth 60 FPS arcade or 30 FPS standard',
    sfx: 'SFX',
    bgm: 'BGM',
    on: 'ON',
    off: 'OFF',
    resetProgress: 'RESET SAVED DATA (CLEAR PROGRESS)',
    resetConfirm: 'Do you want to reset all saved arcade progress and start from scratch?',
    active: 'ACTIVE',
    ready: 'READY',
    keyboardTitle: 'COLUMN 1 • KEYBOARD & JOYSTICK',
    arcadeButtonsTitle: 'COLUMN 2 • ARCADE CABINET BUTTONS',
    movement: 'MOVEMENT',
    duck: 'DUCK / CROUCH',
    aimVertical: 'AIM VERTICAL',
    retroJump: 'JUMP / DOUBLE JUMP',
    dashSprint: 'DASH SPRINT',
    thunderShot: 'THUNDER SHOT',
    flameBlast: 'FLAME BLAST',
    flashStep: 'FLASH-STEP',
    secretPipeTip: 'RUNIC PIPES: Press [DOWN] over secret conduits to enter treasure vaults.',
    mobileTouchTip: 'TOUCH SCREEN: Virtual arcade buttons appear automatically on smartphones.',
    buttonJump: 'BUTTON A: JUMP',
    buttonDash: 'BUTTON B: DASH',
    buttonShoot: 'BUTTON Y: SHOOT',
    buttonFlame: 'BUTTON F: FLAME',
    livesLabel: 'LIVES',
    divineLivesLabel: 'DIVINE',
    manaLabel: 'MANA',
    slowed: 'SLOWED',
    epilogueTitle: 'FINAL EPILOGUE',
    finalEpilogue: 'ACT III • WORLD RESTORED',
    endOfAdventure: 'THE JOURNEY CONCLUDES',
    seeFinalCredits: 'VIEW FINAL CREDITS',
    protagonistTag: 'PROTAGONIST: MOULER (ORGRINIAN WARRIOR)',
    savedFileTag: 'SAVED PROFILE',
    warningBossTag: 'WARNING • COMMANDER DETECTED',
    fightStartText: 'FIGHT!',
  },
  es: {
    gameTitle: 'LA GRIETA',
    gameSubtitle: 'EL VIAJE DEL DESTINO • © 2026 ANDYCROW GAMES',
    copyright: '© 1996 ANDYCROW GAMES • LA GRIETA - EL VIAJE DEL DESTINO',
    arcadeSystem: 'SISTEMA ARCADE • 16-BIT FM',
    insertCoin: 'INSERT COIN [1 CRÉDITO]',
    freePlay: '• JUEGO LIBRE •',
    continueGame: 'CONTINUAR',
    newGame: 'NUEVA PARTIDA',
    startAdventure: 'INSERT COIN • COMENZAR PARTIDA',
    stageSelect: 'SELECCIÓN DE NIVEL',
    controls: 'CONTROLES',
    options: 'OPCIONES',
    prologue: 'PRÓLOGO (HISTORIA)',
    selectDifficulty: 'SELECCIONA DIFICULTAD',
    chooseDestiny: 'ELIGE TU DESTINO',
    difficulty: 'DIFICULTAD',
    touristMode: 'MODO TURISTA (FÁCIL)',
    touristDesc: 'Aventura accesible y equilibrada. Ideal para disfrutar de la historia, explorar y divertirse sin frustraciones.',
    touristLives: '15 Vidas Iniciales',
    touristFeatures: [
      '15 Vidas (Reaparición amigable)',
      'Densidad de enemigos y velocidades balanceadas',
      'Salud de jefes y ritmos de ataque estándar',
      'Puntuación normal (Multiplicador 1x)',
    ],
    devilMode: 'MODO DEMONIO (DIFÍCIL)',
    devilDesc: 'Pesadilla implacable y brutal para auténticos maestros del arcade. Enemigos triplicados, todos disparan y jefes colosales.',
    devilLives: 'Solo 5 Vidas Iniciales',
    devilFeatures: [
      'Estrictamente 5 Vidas (Corazones ultra-raros)',
      '3x Enemigos & 2x Velocidad de movimiento',
      '¡TODOS los enemigos normales disparan proyectiles!',
      'Gólems lanzan rocas; Sombras aparecen desde Zona 3',
      'Jefes con 2x HP e invocación de hordas al 50% HP',
      'Ghotur Titán invoca a los 4 mini-comandantes',
      '¡PUNTUACIÓN TRIPLICADA (Multiplicador 3x)!',
    ],
    scoreMultiplier: 'Puntuación Triplicada (x3)',
    back: 'VOLVER',
    skip: 'SALTAR',
    next: 'SIGUIENTE',
    previous: 'ANTERIOR',
    startAction: '¡COMENZAR LA AVENTURA!',
    sectorMission: 'SELECCIONA MISIÓN DE SECTOR',
    testMode: 'MODO PRUEBA',
    testModeUnlocked: 'DESBLOQUEADO',
    testModeLocked: 'DESBLOQUEAR TODO',
    locked: 'BLOQUEADO',
    mission: 'MISIÓN',
    reward: 'RECOMPENSA ✦',
    pauseTitle: 'JUEGO EN PAUSA',
    paused: 'PAUSA',
    resume: 'REANUDAR',
    restartLevel: 'REINICIAR NIVEL',
    soundAndCrt: 'SONIDO Y CRT',
    quitToTitle: 'SALIR AL MENÚ PRINCIPAL',
    gameOver: 'FIN DEL JUEGO',
    missionFailed: 'MISIÓN FALLIDA',
    retryLevel: 'REINTENTAR NIVEL',
    stageClear: '¡ETAPA SUPERADA!',
    bossDefeated: '¡JEFE DERROTADO!',
    missionAccomplished: 'MISIÓN CUMPLIDA',
    stageScore: 'PUNTUACIÓN ETAPA',
    crystals: 'CRISTALES',
    celestialCore: 'NÚCLEO CELESTIAL',
    timeBonus: 'BONUS TIEMPO',
    totalScore: 'PUNTUACIÓN TOTAL',
    autoAdvance: 'AUTO-AVANCE EN',
    continuePrompt: 'PULSA [ACCIÓN] O ESPERA',
    systemSetup: 'OPCIONES DE SISTEMA ARCADE',
    crtEffect: 'EFECTO CRT / SCANLINES',
    crtDesc: 'Líneas de barrido sutiles (solo menús, sin oscurecer gráficos)',
    fps: 'TASA DE CUADROS',
    fpsDesc: '60 FPS fluido arcade o 30 FPS estándar',
    sfx: 'SFX',
    bgm: 'MÚSICA',
    on: 'ACTIVADO',
    off: 'DESACTIVADO',
    resetProgress: 'REINICIAR DATOS GUARDADOS (BORRAR PROGRESO)',
    resetConfirm: '¿Deseas reiniciar todo el progreso guardado y empezar desde cero?',
    active: 'ACTIVO',
    ready: 'LISTO',
    keyboardTitle: 'COLUMNA 1 • TECLADO / PALANCA JOYSTICK',
    arcadeButtonsTitle: 'COLUMNA 2 • BOTONERA ARCADE CABINET',
    movement: 'DESPLAZAMIENTO',
    duck: 'AGACHARSE (DUCK)',
    aimVertical: 'APUNTAR VERTICAL',
    retroJump: 'SALTO / DOBLE SALTO',
    dashSprint: 'DASH SPRINT',
    thunderShot: 'DISPARO TRUENO',
    flameBlast: 'LLAMARADA',
    flashStep: 'FLASH-STEP',
    secretPipeTip: 'TUBERÍAS RÚNICAS: Pulsa [ABAJO] sobre un conducto para acceder a la Bóveda Secreta.',
    mobileTouchTip: 'PANTALLA TÁCTIL: Botones arcade virtuales disponibles automáticamente en smartphones.',
    buttonJump: 'BOTÓN A: SALTO',
    buttonDash: 'BOTÓN B: DASH',
    buttonShoot: 'BOTÓN Y: DISPARO',
    buttonFlame: 'BOTÓN F: LLAMARADA',
    livesLabel: 'VIDAS',
    divineLivesLabel: 'DIVINA',
    manaLabel: 'MANA',
    slowed: 'RALENTIZADO',
    epilogueTitle: 'EPÍLOGO FINAL',
    finalEpilogue: 'ACTO III • AETHERIA RENACE',
    endOfAdventure: 'EL VIAJE CONCLUYE',
    seeFinalCredits: 'VER CRÉDITOS FINALES',
    protagonistTag: 'PROTAGONISTA: MOULER (GUERRERO ORGRINIANO)',
    savedFileTag: 'ARCHIVO GUARDADO',
    warningBossTag: 'ADVERTENCIA • COMANDANTE DETECTADO',
    fightStartText: '¡A LUCHAR!',
  },
};

export interface LocalizedStoryPanel {
  id: number;
  title: string;
  speaker: string;
  badgeColor: string;
  paragraphs: string[];
  imageKey: string;
}

export const STORY_PANELS_LOCALIZED: Record<Language, LocalizedStoryPanel[]> = {
  en: [
    {
      id: 1,
      title: 'ORGRINIAN HARMONY',
      speaker: 'ORGRINIAN VILLAGE • AETHERIA',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-400',
      paragraphs: [
        'The village of the Orgrinians flourished in peace and splendor under the sacred mantle of the Celestial Core, the greatest relic of the world that nourished all creatures and valleys with vitality.',
        'Here grew Mouler, a young and noble Orgrinian warrior educated with courage and righteousness by his revered father, the supreme chieftain. Cosmic harmony reigned under the Core’s divine brilliance.',
      ],
      imageKey: 'cinematic_prologue_01_village_peace',
    },
    {
      id: 2,
      title: 'THE RIFT IN THE SKY',
      speaker: 'VOID INVASION • GHOTUR',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-400',
      paragraphs: [
        'Without warning, the firmament tore asunder with a deafening roar. From the colossal dimensional rift descended the tyrant Ghotur, flanked by his shadowy commanders.',
        'They unleashed a merciless tempest of ruinous void sorcery that engulfed the Orgrinian homes in obsidian fire. The peaceful sanctuary was annihilated in mere moments.',
      ],
      imageKey: 'cinematic_prologue_01_village_peace_copy_copy_copy',
    },
    {
      id: 3,
      title: 'FALL OF THE CHIEFTAIN',
      speaker: 'LAST STAND • THE SUPREME SACRIFICE',
      badgeColor: 'bg-red-500/20 text-red-300 border-red-400',
      paragraphs: [
        'Mouler fought alongside his kin with heroic fury, but the abyssal power of the invaders was overwhelming.',
        'Mouler’s father, standing alone against Ghotur to shield his fleeing people, clashed until his final breath before falling mortally wounded amidst the smoke and embers.',
      ],
      imageKey: 'cinematic_prologue_01_village_peace_copy_copy',
    },
    {
      id: 4,
      title: 'SHATTERING OF THE CORE',
      speaker: 'CORRUPTED POWER • 5 FRAGMENTS',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-400',
      paragraphs: [
        'Ghotur desecrated the sacred altar and seized the Celestial Core, shattering it with ruthless violence into five distinct fragments.',
        'He kept the greatest core fragment for himself, mutating into a monstrous demon titan, while bestowing the four other shards unto his commanders, who scattered across the four corners of Aetheria to rule with iron fists.',
      ],
      imageKey: 'cinematic_prologue_01_village_peace_copy_copy_copy_copy',
    },
    {
      id: 5,
      title: 'THE PEARL OF DESTINY',
      speaker: 'SACRED LEGACY • MOULER’S FATHER',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-400',
      paragraphs: [
        'Through the burning ashes, Mouler crawled desperately to his dying father. With his fading strength, the fallen chieftain placed the Energy Pearl into his son’s hands:',
        '“My son... destiny now rests upon your shoulders. Harmonize this pearl with your Orgrinian spirit and restore balance...” His father closed his eyes forever in his arms.',
      ],
      imageKey: 'cinematic_prologue_01_village_peace_copy_copy_copy_copy_copy',
    },
    {
      id: 6,
      title: 'MOULER’S SOLEMN VOW',
      speaker: 'VOW OF VENGEANCE • MOULER',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-400',
      paragraphs: [
        'With the Energy Pearl assimilated into his soul and the ashes of his homeland beneath his feet, Mouler cast his gaze toward the rift above.',
        'He swore a sacred oath: he will traverse every realm of Aetheria, vanquish Ghotur’s commanders, reclaim all five fragments of the Celestial Core, and avenge his father and people!',
      ],
      imageKey: 'cinematic_prologue_01_village_peace_copy_copy_copy_copy_copy_copy',
    },
  ],
  es: [
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
  ],
};

export const ARCADE_TIPS_LOCALIZED: Record<Language, string[]> = {
  en: [
    'Mouler can press [S] or Down Arrow to duck and dodge incoming projectile attacks.',
    'Dash Sprint [Shift/J] grants rapid momentum and shatters fragile barriers in Titan Mode.',
    'Over runic conduits, press DOWN to enter Secret Crystal Treasury Vaults.',
    'Every 100 Spark Crystals grant Mouler an Extra Life automatically.',
    'With Fragment 2 (Dragon), press [E] or [X] to unleash the piercing Volcanic Flame.',
    'With Fragment 4 (Kryona), press [Q] or Up+Dash to execute a spectral Flash-Step.',
    'With the Energy Pearl assimilated, Mouler can aim his lightning beam straight up with [W].',
    'After heavy boss attacks, seize their vulnerability window to deal devastating critical strikes.',
    'Reclaim all 5 Celestial Core Fragments to avenge your father and restore your world.',
  ],
  es: [
    'Mouler puede pulsar [S] o Flecha Abajo para agacharse y esquivar proyectiles enemigos.',
    'El Dash Sprint [Shift/J] te otorga impulso veloz y rompe obstáculos frágiles en Modo Titán.',
    'Sobre los conductos rúnicos, pulsa ABAJO para entrar a las Bóvedas Secretas de Cristales.',
    'Cada 100 Cristales de Chispa otorgan una Vida Extra automática a Mouler.',
    'Con el Fragmento 2 (Dragón), pulsa [E] o [X] para disparar la Llamarada Volcánica.',
    'Con el Fragmento 4 (Kryona), pulsa [Q] o Arriba+Dash para realizar el Flash-Step espectral.',
    'Con la Perla de Energía asimilada, Mouler puede apuntar su Rayo hacia arriba pulsando [W].',
    'Tras los ataques pesados de un Jefe, aprovecha su ventana de cansancio para asestar golpes críticos.',
    'Recupera los 5 Fragmentos del Núcleo Celestial para vengar la caída de tu padre y de tu pueblo.',
  ],
};

export const LEVEL_LOCALIZED_INFO: Record<Language, Record<number, { name: string; subtitle: string; bossName?: string }>> = {
  en: {
    1: { name: 'The Valley of Debris', subtitle: 'Mouler embarks across the charred ruins of his village' },
    2: { name: 'Lightning Canyon', subtitle: 'Sandstone gorge and conduits guarded by minions' },
    3: { name: 'Storm Ruins', subtitle: 'Ascent toward the Grand Storm Pyramid' },
    4: { name: "The Guardian's Hall", subtitle: 'Commander 1: Titanic Chimeric Scarab (Shard 1/5)', bossName: 'Titanic Chimeric Scarab' },
    5: { name: 'Catacombs Entrance', subtitle: 'Amethyst caverns and first corrupted crystal golems' },
    6: { name: 'The Resonant Chasm', subtitle: 'Subterranean waterfalls and moving platforms over the abyss' },
    7: { name: 'Underground Citadel', subtitle: 'Crystal needle toward the ancient dragon cavern' },
    8: { name: "The Dragon's Lair", subtitle: 'Commander 2: Colossal Obsidian Shadow Dragon (Shard 2/5)', bossName: 'Colossal Obsidian Shadow Dragon' },
    9: { name: 'Stratosphere Fortress', subtitle: 'Floating basalt isles and Thwomp crushing pillars' },
    10: { name: 'The Thunder Spire', subtitle: 'Vertical ascent between giant gears and elevators' },
    11: { name: 'Celestial Sanctuary', subtitle: 'Summit above the clouds leading to the Celestial Gate' },
    12: { name: 'The Celestial Throne', subtitle: 'Commander 3: Cosmic Deity Asura of Many Arms (Shard 3/5)', bossName: 'Cosmic Deity Asura' },
    13: { name: 'The Glacial Valley', subtitle: 'Polar fissures, slippery frost and ice crawlers' },
    14: { name: 'Avalanche Pass', subtitle: 'Frantic downhill pursuit evading the colossal glacial boulder' },
    15: { name: 'The Frozen Summit', subtitle: 'Climb the frozen vertical tower between icicles and blizzards' },
    16: { name: 'Throne of Kryona', subtitle: 'Commander 4: Frost Queen Kryona — Consort of Ghotur (Shard 4/5)', bossName: 'Frost Queen Kryona' },
    17: { name: 'The Abyssal Inferno', subtitle: 'Twilight of the Void and dread Abyssal Shadow Phantoms' },
    18: { name: 'Throne of Chaos', subtitle: 'Obsidian cathedral showdown against Tyrant Ghotur in noble form', bossName: 'Ghotur (Noble Demon)' },
    19: { name: 'The Collapsed Core', subtitle: 'Final clash against Colossal Demon Titan Ghotur (Major Shard 5/5)', bossName: 'Ghotur (Colossal Demon Titan)' },
  },
  es: {
    1: { name: 'El Valle de los Escombros', subtitle: 'Mouler emprende el viaje sobre la tierra quemada de su aldea' },
    2: { name: 'Cañón de los Relámpagos', subtitle: 'Garganta de arenisca y conductos custodiados por esbirros' },
    3: { name: 'Ruinas de la Tormenta', subtitle: 'Ascenso fúnebre hacia la Gran Pirámide' },
    4: { name: 'El Salón del Guardián', subtitle: 'Comandante 1: Escarabajo Quimérico Titánico (Fragmento 1/5)', bossName: 'Escarabajo Quimérico Titánico' },
    5: { name: 'Entrada a las Catacumbas', subtitle: 'Grutas amatista y primeros gólems corrompidos' },
    6: { name: 'El Abismo Resonante', subtitle: 'Cascadas subterráneas y plataformas móviles sobre el vacío' },
    7: { name: 'La Ciudadela Subterránea', subtitle: 'Aguja de cristal hacia la cueva ancestral de magma' },
    8: { name: 'La Guarida del Dragón', subtitle: 'Comandante 2: Colosal Dragón Umbrío de Obsidiana (Fragmento 2/5)', bossName: 'Colosal Dragón Umbrío de Obsidiana' },
    9: { name: 'Fortaleza de la Estratosfera', subtitle: 'Islas flotantes de basalto y pilares trituradores Thwomp' },
    10: { name: 'La Aguja del Trueno', subtitle: 'Ascenso vertical entre engranajes gigantescos y elevadores' },
    11: { name: 'El Santuario Celestial', subtitle: 'La cumbre sobre el mar de nubes y la Gran Puerta Celestial' },
    12: { name: 'El Trono Celestial', subtitle: 'Comandante 3: Dios Cósmico Asura de múltiples brazos (Fragmento 3/5)', bossName: 'Dios Cósmico Asura' },
    13: { name: 'El Valle Glacial', subtitle: 'Grietas polares, escarcha resbaladiza y escarabajos de hielo' },
    14: { name: 'El Paso de la Avalancha', subtitle: 'Descenso vertiginoso perseguido por la colosal roca glacial' },
    15: { name: 'La Cumbre Helada', subtitle: 'Escala la torre vertical entre témpanos y ventiscas solitarias' },
    16: { name: 'El Trono de Kryona', subtitle: 'Comandante 4: Reina de Hielo Kryona — Consorte de Ghotur (Fragmento 4/5)', bossName: 'Reina de Hielo Kryona' },
    17: { name: 'El Infierno Abisal', subtitle: 'El Ocaso del Vacío y las temibles Sombras del Abismo' },
    18: { name: 'El Trono del Caos', subtitle: 'Catedral de obsidiana contra el Tirano Ghotur en su porte noble', bossName: 'Ghotur (Noble Demonio)' },
    19: { name: 'El Núcleo Colapsado', subtitle: 'Choque definitivo contra el Titán Demoníaco Ghotur (Fragmento Mayor 5/5)', bossName: 'Ghotur (Titán Demoníaco Descomunal)' },
  },
};
