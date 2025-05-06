// Capture the Base - Main JavaScript File

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed');

    // --- Constants ---
    const QR_CODE_RED = "CAPTURE_BASE_RED";
    const QR_CODE_BLUE = "CAPTURE_BASE_BLUE";
    const SCAN_DURATION_MS = 5000; // Required hold time in milliseconds
    const GRACE_PERIOD_MS = 1000;  // Allow brief code loss (milliseconds)
    const INITIAL_GAME_DURATION_SECONDS = 300; // 5 minutes
    let currentInitialGameDurationSeconds = INITIAL_GAME_DURATION_SECONDS; // Variable to hold current setting
    const TARGET_ASPECT_RATIO = 9 / 16;

    // --- DOM Element References ---
    const cameraFeed = document.getElementById('camera-feed');
    const cameraToggleButton = document.getElementById('camera-toggle-button');
    const scanIndicator = document.getElementById('scan-indicator');
    const cooldownBarFill = document.getElementById('scan-cooldown-bar-fill');
    const startButton = document.getElementById('start-button'); // Added
    // Create a hidden canvas for frame grabbing
    const scanCanvas = document.createElement('canvas');
    const scanContext = scanCanvas.getContext('2d', { willReadFrequently: true });
    // UI Display Elements
    const scoreRedDisplay = document.getElementById('score-red');
    const scoreBlueDisplay = document.getElementById('score-blue');
    const gameTimerDisplay = document.getElementById('game-timer');
    const gameStatusDisplay = document.getElementById('game-status');
    const baseHolderDisplay = document.getElementById('base-holder');
    const teamIndicatorDisplay = document.getElementById('team-indicator');
    const announcementsDisplay = document.getElementById('announcements');
    // Buttons
    const settingsButton = document.getElementById('settings-button'); // Added
    // Settings Modal Elements
    const settingsModal = document.getElementById('settings-modal');
    const closeSettingsButton = document.getElementById('close-settings-button');
    const bgmVolumeSlider = document.getElementById('bgm-volume');
    const bgmVolumeValueDisplay = document.getElementById('bgm-volume-value');
    const sfxVolumeSlider = document.getElementById('sfx-volume');
    const sfxVolumeValueDisplay = document.getElementById('sfx-volume-value');
    const gameDurationInput = document.getElementById('game-duration');
    // Camera Setting Radio Buttons
    const cameraFrontRadio = document.getElementById('cam-front');
    const cameraRearRadio = document.getElementById('cam-rear');
    const gameContainer = document.getElementById('game-container'); // Added
    // QR Info Modal Elements (New)
    const qrInfoButton = document.getElementById('qr-info-button');
    const qrInfoModal = document.getElementById('qr-info-modal');
    const closeQrInfoButton = document.getElementById('close-qr-info-button');
    const qrRedImg = document.getElementById('qr-red-img'); // Added for error handling
    const qrBlueImg = document.getElementById('qr-blue-img'); // Added for error handling
    // Title Screen Elements (New)
    const titleScreen = document.getElementById('title-screen');
    const titleEnterButton = document.getElementById('title-enter-button');

    // --- Audio Elements ---
    const audioContext = new (window.AudioContext || window.webkitAudioContext)(); // For better audio handling potentially later
    const soundGameStart = new Audio('media/Start Match.m4a');
    const soundCaptureRed = new Audio('media/red captured base.m4a');
    const soundCaptureBlue = new Audio('media/blue captured base.m4a');
    const soundEndGameWarning = new Audio('media/end game.m4a'); // Plays at 10 sec mark
    const soundVictorySfx = new Audio('media/victorysfx.m4a');   // Plays at T=0
    const soundRedWins = new Audio('media/red wins.m4a');      // Plays after victory sfx
    const soundBlueWins = new Audio('media/blue wins.m4a');     // Plays after victory sfx
    const soundDraw = new Audio('media/draw.m4a');            
    // Time Update Sounds (Corrected Names)
    const soundTime4Min = new Audio('media/4mins_remaining.mp3'); 
    const soundTime3Min = new Audio('media/3mins_remaining.mp3');
    const soundTime2Min = new Audio('media/2mins_remaining.mp3'); 
    const soundTime1Min = new Audio('media/1mins_remaining.mp3'); 
    const soundCapturingRed = new Audio('media/red capturing base.m4a'); // Added
    const soundCapturingBlue = new Audio('media/blue capturing base.m4a'); // Added
    const soundBgm = new Audio('media/bgm.m4a'); // Added BGM
    const soundAmbiance = new Audio('media/ambiance.m4a'); // Added Ambiance
    const soundScanning = new Audio('media/scanning sfx.mp3'); // Added Scanning SFX
    // Group SFX for easier volume control
    const sfxSounds = [
        soundGameStart, soundCaptureRed, soundCaptureBlue, soundEndGameWarning,
        soundVictorySfx, soundRedWins, soundBlueWins, soundDraw,
        soundCapturingRed, soundCapturingBlue, soundScanning, 
        soundTime4Min, soundTime3Min, soundTime2Min, soundTime1Min
        // Note: currentlyPlayingAnnouncement is handled separately
    ];
    // Set loops & Volume
    soundBgm.loop = true;
    soundBgm.volume = 0.5; // Default
    soundAmbiance.loop = true;
    soundAmbiance.volume = 0.8; // Default 
    soundScanning.loop = true; 
    // Preload setting
    soundGameStart.preload = 'auto';
    soundCaptureRed.preload = 'auto';
    soundCaptureBlue.preload = 'auto';
    soundEndGameWarning.preload = 'auto';
    soundVictorySfx.preload = 'auto';
    soundRedWins.preload = 'auto';
    soundBlueWins.preload = 'auto';
    soundDraw.preload = 'auto';
    soundCapturingRed.preload = 'auto'; // Added
    soundCapturingBlue.preload = 'auto'; // Added
    soundBgm.preload = 'auto'; // Preload loops
    soundAmbiance.preload = 'auto';
    soundScanning.preload = 'auto'; // Added preload
    soundTime4Min.preload = 'auto';
    soundTime3Min.preload = 'auto';
    soundTime2Min.preload = 'auto';
    soundTime1Min.preload = 'auto';
    let currentSfxVolume = 1.0; // Default SFX Volume
    // Apply initial SFX volume
    sfxSounds.forEach(sound => { if(sound) sound.volume = currentSfxVolume; });

    // --- Dynamic Announcement Sounds ---
    const redTakesLeadSounds = [
        'media/Red_TakesLead_1.mp3', 'media/Red_TakesLead_2.mp3', 'media/Red_TakesLead_3.mp3', 
        'media/Red_TakesLead_4.mp3', 'media/Red_TakesLead_5.mp3'
    ];
    const blueTakesLeadSounds = [
        'media/Blue_TakesLead_1.mp3', 'media/Blue_TakesLead_2.mp3', 'media/Blue_TakesLead_3.mp3',
        'media/Blue_TakesLead_4.mp3', 'media/Blue_TakesLead_5.mp3'
    ];
    const redDominatingSounds = [
        'media/Red_Dominating_1.mp3', 'media/Red_Dominating_2.mp3', 'media/Red_Dominating_3.mp3',
        'media/Red_Dominating_4.mp3', 'media/Red_Dominating_5.mp3'
    ];
    const blueDominatingSounds = [
        'media/Blue_Dominating_1.mp3', 'media/Blue_Dominating_2.mp3', 'media/Blue_Dominating_3.mp3',
        'media/Blue_Dominating_4.mp3', 'media/Blue_Dominating_5.mp3'
    ];
    const redFallingBehindSounds = [
        'media/Red_FallingBehind_1.mp3', 'media/Red_FallingBehind_2.mp3', 'media/Red_FallingBehind_3.mp3',
        'media/Red_FallingBehind_4.mp3', 'media/Red_FallingBehind_5.mp3'
    ];
    const blueFallingBehindSounds = [
        'media/Blue_FallingBehind_1.mp3', 'media/Blue_FallingBehind_2.mp3', 'media/Blue_FallingBehind_3.mp3',
        'media/Blue_FallingBehind_4.mp3', 'media/Blue_FallingBehind_5.mp3'
    ];
    const timeRunningOutSounds = [
        'media/Time_RunningOut_1.mp3', 'media/Time_RunningOut_2.mp3', 'media/Time_RunningOut_3.mp3',
        'media/Time_RunningOut_4.mp3', 'media/Time_RunningOut_5.mp3'
    ];

    // --- Game State Variables ---
    let cameraStream = null;
    let isCameraOn = false;
    let animationFrameId = null; // To control the scan loop
    let currentFacingMode = 'user'; // Default to front camera ('user')

    // Scan Progress State
    let currentScanTarget = null; // e.g., "CAPTURE_BASE_RED" or null
    let scanStartTime = 0; // Timestamp when current target was first seen
    let lastSeenTime = 0; // Timestamp when current target was last detected
    let isScanSuccessful = false; // Flag to indicate recent success flash

    // Core Game State
    let gameState = 'idle'; // 'idle', 'running', 'gameover'
    let scoreRed = 0;
    let scoreBlue = 0;
    let gameTimerSeconds = INITIAL_GAME_DURATION_SECONDS;
    let baseHolderTeam = null; // null, 'Red', 'Blue'
    let gameIntervalId = null; // To control the game loop timer
    let isScanningSoundPlaying = false; // Track scanning sound state
    // State for Dynamic Announcements
    let previousBaseHolderTeam = null;
    let previousScoreRed = 0;
    let previousScoreBlue = 0;
    let lastAnnouncementTime = 0;
    const ANNOUNCEMENT_COOLDOWN_MS = 5000; // Min 5 seconds between dynamic announcements - Reduced
    const DOMINATION_THRESHOLD = 15; // Score difference considered dominating
    const TIME_WARNING_THRESHOLD_SECONDS = 30;
    let playedTimeWarning = false; // Renaming for clarity - this is the dynamic time warning
    let playedEndGameWarning = false; // For the 10-second specific sound
    let played4MinWarning = false;
    let played3MinWarning = false;
    let played2MinWarning = false;
    let played1MinWarning = false;
    let currentlyPlayingAnnouncement = null; // Prevent overlapping announcements
    let lastPointAwardTime = 0; // Timestamp for 2-second point interval

    // --- Core Functions ---

    function resizeGameContainer() {
        // Use visualViewport dimensions if available, otherwise fallback to window
        const vv = window.visualViewport;
        const windowWidth = vv ? vv.width : window.innerWidth;
        const windowHeight = vv ? vv.height : window.innerHeight;

        const windowAspectRatio = windowWidth / windowHeight;
        const TARGET_ASPECT_RATIO = 9 / 16; // Ensure this is defined or accessible here

        let newWidth;
        let newHeight;

        if (windowAspectRatio > TARGET_ASPECT_RATIO) {
            // Window is wider than target: use full height, calculate width
            newHeight = windowHeight;
            newWidth = windowHeight * TARGET_ASPECT_RATIO;
        } else {
            // Window is taller or equal aspect ratio: use full width, calculate height
            newWidth = windowWidth;
            newHeight = windowWidth / TARGET_ASPECT_RATIO;
        }

        // Ensure gameContainer reference is available
        const gameContainer = document.getElementById('game-container'); 
        if (gameContainer) { 
            gameContainer.style.width = `${newWidth}px`;
            gameContainer.style.height = `${newHeight}px`;
            console.log(`[resizeGameContainer] Set size to ${newWidth.toFixed(2)} x ${newHeight.toFixed(2)} using ${vv ? 'visualViewport' : 'window'} dimensions.`); // Debug log
        } else {
             console.error('[resizeGameContainer] Could not find game-container element!');
        }
    }

    // --- UI Update Functions ---

    function formatTime(totalSeconds) {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    function updateTimerDisplay(seconds) {
        gameTimerDisplay.textContent = `Time: ${formatTime(seconds)}`;
    }

    function updateScoreDisplay(r, b) {
        scoreRedDisplay.textContent = `Red: ${r}`;
        scoreBlueDisplay.textContent = `Blue: ${b}`;
    }

    function updateBaseHolderDisplay(holder) { 
        const holderText = holder ? `${holder} Team` : 'None';
        baseHolderDisplay.textContent = `Base Holder: ${holderText}`;
        teamIndicatorDisplay.textContent = holder ? holder.toUpperCase() : '--';
        
        let teamColor = '#B2FF59'; // Default color for base holder text (bright green)
        let indicatorColor = '#FFBF00'; // Default color for center indicator (amber)
        let borderColor = '#FFBF00'; // Default border color for center indicator

        if (holder === 'Red') {
            teamColor = '#F44336'; // Red
            indicatorColor = '#F44336';
            borderColor = '#F44336';
        } else if (holder === 'Blue') {
            teamColor = '#2196F3'; // Blue
            indicatorColor = '#2196F3';
            borderColor = '#2196F3';
        }

        // Apply the colors
        baseHolderDisplay.style.color = teamColor;
        teamIndicatorDisplay.style.color = indicatorColor;
        teamIndicatorDisplay.style.borderColor = borderColor;
    }

    function updateGameStatusDisplay(status) {
        let statusText = 'Waiting to Start';
        if (status === 'starting') {
             statusText = 'Starting Match...'; // Indicate countdown
        } else if (status === 'running') {
            statusText = 'Game in Progress';
        } else if (status === 'gameover') {
            statusText = 'Game Over';
        }
        gameStatusDisplay.textContent = statusText;
    }

    function addAnnouncement(message) {
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: "2-digit", second: "2-digit" });
        const newMessage = document.createElement('p');
        newMessage.textContent = `[${timestamp}] ${message}`;
        announcementsDisplay.prepend(newMessage); // Add new messages to the top
        // Optional: Limit number of announcements shown
        while (announcementsDisplay.children.length > 10) {
             announcementsDisplay.removeChild(announcementsDisplay.lastChild);
         }
    }

    // --- Settings Functions ---

    function openSettingsModal() {
        loadSettings(); 
        if (settingsModal) settingsModal.style.display = 'flex';
    }

    function closeSettingsModal() {
        if (settingsModal) settingsModal.style.display = 'none';
    }

    function applyAndSaveSetting(key, value) {
        localStorage.setItem(key, value);

        switch (key) {
            case 'bgmVolume':
                const bgmVol = parseFloat(value);
                if(soundBgm) soundBgm.volume = bgmVol;
                if(soundAmbiance) soundAmbiance.volume = bgmVol * 1.6; // Keep ambiance relative? Adjust as needed
                if(bgmVolumeValueDisplay) bgmVolumeValueDisplay.textContent = `${Math.round(bgmVol * 100)}%`;
                break;
            case 'sfxVolume':
                const sfxVol = parseFloat(value);
                currentSfxVolume = sfxVol; // Store for announcements created later
                sfxSounds.forEach(sound => { if(sound) sound.volume = sfxVol; });
                if(sfxVolumeValueDisplay) sfxVolumeValueDisplay.textContent = `${Math.round(sfxVol * 100)}%`;
                break;
            case 'gameDuration':
                const durationMinutes = parseInt(value, 10);
                if (!isNaN(durationMinutes) && durationMinutes >= 1 && durationMinutes <= 15) {
                    currentInitialGameDurationSeconds = durationMinutes * 60;
                     // Update display only if game isn't running/starting
                     if(gameState === 'idle' || gameState === 'gameover') {
                         updateTimerDisplay(currentInitialGameDurationSeconds);
                     }
                    console.log(`Game duration setting updated to: ${durationMinutes} minutes`);
                } else {
                     // Revert invalid input in UI
                     gameDurationInput.value = currentInitialGameDurationSeconds / 60;
                 }
                break;
            case 'facingMode':
                currentFacingMode = value;
                console.log(`[Settings] Apply/Save: Set currentFacingMode to: ${currentFacingMode}`); // DEBUG LOG
                // Actual change happens next time startCamera() is called
                break;
        }
    }

    function loadSettings() {
        const savedBgmVolume = localStorage.getItem('bgmVolume') ?? soundBgm.volume; // Default to current if not saved
        const savedSfxVolume = localStorage.getItem('sfxVolume') ?? currentSfxVolume;
        const savedGameDuration = localStorage.getItem('gameDuration') ?? (INITIAL_GAME_DURATION_SECONDS / 60);
        const savedFacingMode = localStorage.getItem('facingMode') ?? 'user'; // Default to 'user' if not saved

        if (bgmVolumeSlider) bgmVolumeSlider.value = savedBgmVolume;
        if (sfxVolumeSlider) sfxVolumeSlider.value = savedSfxVolume;
        if (gameDurationInput) gameDurationInput.value = savedGameDuration;

        if (savedFacingMode === 'user' && cameraFrontRadio) {
             cameraFrontRadio.checked = true;
        } else if (savedFacingMode === 'environment' && cameraRearRadio) {
             cameraRearRadio.checked = true;
        }

        // Apply loaded settings (especially visual updates for sliders)
        applyAndSaveSetting('bgmVolume', savedBgmVolume); 
        applyAndSaveSetting('sfxVolume', savedSfxVolume);
        applyAndSaveSetting('gameDuration', savedGameDuration);
        applyAndSaveSetting('facingMode', savedFacingMode); // Apply loaded mode to state
    }

    // --- Audio Playback Helper ---
    function playRandomSound(soundArray) {
        console.log("[playRandomSound] Entered function."); // DEBUG
        // --- Prevent Overlap --- 
        if ((soundCaptureRed && !soundCaptureRed.paused) || (soundCaptureBlue && !soundCaptureBlue.paused)) {
            console.log("[playRandomSound] Skipping: Capture sound playing."); // DEBUG
            return;
        }
        if (currentlyPlayingAnnouncement && !currentlyPlayingAnnouncement.paused) {
            console.log("[playRandomSound] Skipping: Another announcement playing."); // DEBUG
            return; 
        }
        // --- End Prevent Overlap ---

        if (soundArray && soundArray.length > 0) {
            const randomIndex = Math.floor(Math.random() * soundArray.length);
            const soundFile = soundArray[randomIndex];
            console.log(`[playRandomSound] Attempting to play: ${soundFile}`); // DEBUG
            currentlyPlayingAnnouncement = new Audio(soundFile); 
            currentlyPlayingAnnouncement.volume = currentSfxVolume; // Apply current SFX volume
            currentlyPlayingAnnouncement.play().catch(e => console.error(`[playRandomSound] Error playing ${soundFile}:`, e));
            lastAnnouncementTime = Date.now(); 
            currentlyPlayingAnnouncement.onended = () => { 
                console.log(`[playRandomSound] Finished playing: ${soundFile}`); // DEBUG
                currentlyPlayingAnnouncement = null; 
            }; 
            currentlyPlayingAnnouncement.onerror = () => { 
                console.error(`[playRandomSound] Error loading/playing: ${soundFile}`); // DEBUG
                currentlyPlayingAnnouncement = null; 
            }; 
        } else {
            console.warn("[playRandomSound] Failed: Sound array empty or invalid."); // DEBUG
        }
    }

    // --- Functions ---

    /**
     * Called ONLY after a QR code has been held for SCAN_DURATION_MS.
     */
    function onScanSuccess(capturedCode) {
        console.log(`>>> Entering onScanSuccess with code: ${capturedCode}`); // LOG 1: Function Entry
        isScanSuccessful = true;

        // -- Existing DEBUGGING LOGS --
        console.log(`  onScanSuccess: Current gameState: ${gameState}`); // LOG 2: Game State Check
        console.log(`  onScanSuccess: Current baseHolderTeam: ${baseHolderTeam}`); // LOG 3: Current Holder
        // -- END DEBUGGING --

        if (gameState === 'running') {
            console.log("  onScanSuccess: Game is running, proceeding with capture check."); // LOG 4: Passed GameState Check
            let capturedTeam = null;
            if (capturedCode === QR_CODE_RED) capturedTeam = 'Red';
            if (capturedCode === QR_CODE_BLUE) capturedTeam = 'Blue';
            
            console.log(`  onScanSuccess: Attempting to capture for team: ${capturedTeam}`); // LOG 5: Determined Team

            if (capturedTeam && baseHolderTeam !== capturedTeam) {
                console.log(`  onScanSuccess: Conditions met (valid team, not current holder). Capturing...`); // LOG 6: Capture Conditions Met
                const oldHolder = baseHolderTeam;
                baseHolderTeam = capturedTeam; 
                console.log(`  onScanSuccess: >>> Base HOLDER variable UPDATED to: ${baseHolderTeam}`); // LOG 7: State Variable Updated
                updateBaseHolderDisplay(baseHolderTeam); 
                addAnnouncement(`${baseHolderTeam} captured the base from ${oldHolder || 'Neutral'}!`);
                lastPointAwardTime = Date.now(); 
                // Play specific capture sound 
                 if (capturedTeam === 'Red') {
                    soundCaptureRed.play().catch(e => console.error("Error playing red capture sound:", e));
                } else if (capturedTeam === 'Blue') {
                    soundCaptureBlue.play().catch(e => console.error("Error playing blue capture sound:", e));
                }
            } else if (!capturedTeam) {
                console.log('  onScanSuccess: Capture failed - scanned code did not match Red or Blue QR data.'); // LOG 8a: Invalid Code
            } else {
                 console.log(`  onScanSuccess: Capture failed - base already held by ${baseHolderTeam}.`); // LOG 8b: Same Team
            }
        } else {
            console.log('  onScanSuccess: Capture failed - gameState is not \'running\'.'); // LOG 9: Game Not Running
        }

        // Visual feedback for SUCCESS (unchanged)
        // ... (visual feedback logic) ...
    }

    /**
     * Resets the scanning progress bar and indicator to their default state.
     */
    function resetScanVisuals() {
        if (!isScanSuccessful) {
            cooldownBarFill.style.width = '0%';
            cooldownBarFill.style.backgroundColor = '#4A684C'; // Use correct inactive color
            scanIndicator.style.borderColor = '#4CAF50'; // Use correct active color
        }
        // Ensure scanning sound stops if visuals are reset
        stopScanningSound();
    }

    /**
     * Starts the scanning sound if not already playing.
     */
    function startScanningSound() {
        if (!isScanningSoundPlaying) {
            // console.log("Starting scanning sound..."); // Optional debug
            soundScanning.play().catch(e => console.error("Error playing scanning SFX:", e));
            isScanningSoundPlaying = true;
        }
    }

    /**
     * Stops the scanning sound if playing.
     */
    function stopScanningSound() {
        if (isScanningSoundPlaying && !soundScanning.paused) {
            // console.log("Stopping scanning sound..."); // Optional debug
            soundScanning.pause();
            soundScanning.currentTime = 0;
        }
        isScanningSoundPlaying = false;
    }

    /**
     * Continuously grabs frames, scans them, and manages the hold-to-scan timer with grace period.
     */
    function tick() {
        let detectedCodeData = null;
        if (isCameraOn && cameraFeed.readyState === cameraFeed.HAVE_ENOUGH_DATA) {
            scanCanvas.height = cameraFeed.videoHeight;
            scanCanvas.width = cameraFeed.videoWidth;
            scanContext.drawImage(cameraFeed, 0, 0, scanCanvas.width, scanCanvas.height);
            const imageData = scanContext.getImageData(0, 0, scanCanvas.width, scanCanvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "dontInvert",
            });

            if (code) {
                detectedCodeData = code.data; // Store detected data
            }
        }

        // --- Hold-to-Scan Logic with Grace Period & Team Lockout ---
        const now = Date.now();
        const isValidTargetDetected = detectedCodeData === QR_CODE_RED || detectedCodeData === QR_CODE_BLUE;
        let detectedTeam = null;
        if (detectedCodeData === QR_CODE_RED) detectedTeam = 'Red';
        if (detectedCodeData === QR_CODE_BLUE) detectedTeam = 'Blue';

        // Determine if the detected code is allowed to start a scan
        const canStartScan = gameState === 'running' && 
                             isValidTargetDetected && 
                             (baseHolderTeam === null || detectedTeam !== baseHolderTeam);

        if (currentScanTarget) {
            // --- Currently tracking a target ---
            if (detectedCodeData === currentScanTarget) {
                // Target still visible
                lastSeenTime = now;
                startScanningSound(); // Ensure scanning sound is playing
                const scanElapsed = now - scanStartTime;
                const progressPercent = Math.min(100, (scanElapsed / SCAN_DURATION_MS) * 100);
                cooldownBarFill.style.width = `${progressPercent}%`;
                cooldownBarFill.style.backgroundColor = '#FFFF00'; 
                scanIndicator.style.borderColor = '#FFFF00'; 
                if (scanElapsed >= SCAN_DURATION_MS) {
                    onScanSuccess(currentScanTarget);
                    stopScanningSound(); // Stop scanning sound on success
                    currentScanTarget = null; 
                    scanStartTime = 0;
                    lastSeenTime = 0;
                }
            } else {
                // Target lost or changed - check grace period
                if (now - lastSeenTime > GRACE_PERIOD_MS) {
                    console.log(`Scan interrupted (grace period expired) for: ${currentScanTarget}`);
                    stopScanningSound(); // Stop scanning sound on interrupt
                    currentScanTarget = null;
                    scanStartTime = 0;
                    lastSeenTime = 0;
                    resetScanVisuals();
                    // Check if a NEW valid target can START a scan immediately
                    if (canStartScan) {
                         console.log(`Starting scan timer immediately for new target: ${detectedCodeData}`);
                         currentScanTarget = detectedCodeData;
                         scanStartTime = now;
                         lastSeenTime = now;
                         cooldownBarFill.style.width = '0%'; 
                         cooldownBarFill.style.backgroundColor = '#FFFF00';
                         scanIndicator.style.borderColor = '#FFFF00';
                         if (currentScanTarget === QR_CODE_RED) {
                            console.log("Attempting to play soundCapturingRed (after grace period)"); 
                            soundCapturingRed.play().catch(e => console.error("Error playing red capturing sound:", e));
                         } else if (currentScanTarget === QR_CODE_BLUE) {
                            console.log("Attempting to play soundCapturingBlue (after grace period)"); 
                            soundCapturingBlue.play().catch(e => console.error("Error playing blue capturing sound:", e));
                         }
                         startScanningSound(); // Start sound for the new scan
                    }
                } else {
                    // Still within grace period, keep sound playing if it was
                }
            }
        } else if (canStartScan) {
             // --- Not currently tracking, but a valid & allowed target is detected ---
             console.log(`Starting scan timer for: ${detectedCodeData}`);
             currentScanTarget = detectedCodeData;
             scanStartTime = now;
             lastSeenTime = now;
             cooldownBarFill.style.width = '0%';
             cooldownBarFill.style.backgroundColor = '#FFFF00';
             scanIndicator.style.borderColor = '#FFFF00';
             if (currentScanTarget === QR_CODE_RED) {
                 console.log("Attempting to play soundCapturingRed (initial scan)"); 
                 soundCapturingRed.play().catch(e => console.error("Error playing red capturing sound:", e));
             } else if (currentScanTarget === QR_CODE_BLUE) {
                 console.log("Attempting to play soundCapturingBlue (initial scan)"); 
                 soundCapturingBlue.play().catch(e => console.error("Error playing blue capturing sound:", e));
             }
             startScanningSound(); // Start scanning sound
        } else {
            // --- Not tracking and no valid target detected, OR detected code belongs to current holder ---
             stopScanningSound(); // Stop scanning sound if no scan is active/possible
             if (!isScanSuccessful) { 
                 if (currentScanTarget === null) { 
                    resetScanVisuals();
                 }
             }
        }

        // Schedule the next frame scan
        if (isCameraOn) {
            animationFrameId = requestAnimationFrame(tick);
        }
    }

    /**
     * Initializes and starts the QR code scanning loop.
     */
    function startQrScanner() {
        if (!animationFrameId) {
            console.log('Starting jsQR scan loop...');
            currentScanTarget = null; // Ensure state is clean on start
            scanStartTime = 0;
            isScanSuccessful = false;
            resetScanVisuals();
            animationFrameId = requestAnimationFrame(tick);
        }
    }

    /**
     * Stops the QR code scanning loop.
     */
    function stopQrScanner() {
        if (animationFrameId) {
            console.log('Stopping jsQR scan loop...');
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        // Reset state and visuals
        currentScanTarget = null;
        scanStartTime = 0;
        lastSeenTime = 0; 
        isScanSuccessful = false;
        stopScanningSound(); // Ensure scanning sound stops
        resetScanVisuals();
    }

    /**
     * Requests camera access and starts displaying the feed.
     */
    async function startCamera() {
        if (isCameraOn) return;
        console.log(`[startCamera] Attempting with currentFacingMode: ${currentFacingMode}`); // DEBUG LOG
        try {
            const constraints = {
                video: {
                    facingMode: currentFacingMode 
                },
                audio: false
            };
            console.log("[startCamera] Calling getUserMedia with constraints:", constraints); // DEBUG LOG
            cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
            console.log("[startCamera] getUserMedia SUCCESSFUL."); // DEBUG LOG
            cameraFeed.srcObject = cameraStream;

            cameraFeed.onloadedmetadata = () => {
                cameraFeed.play();
                cameraFeed.hidden = false;
                isCameraOn = true;
                cameraToggleButton.textContent = 'Hide Camera';
                console.log('Camera started successfully.');
                startQrScanner(); // Start scan loop
            };

        } catch (error) {
             console.error(`[startCamera] getUserMedia FAILED for facingMode ${currentFacingMode}:`, error); // DEBUG LOG
            alert(`Could not access ${currentFacingMode} camera: ${error.name}. Ensure permissions are granted or try the other camera.`);
            // Reset state fully
            isCameraOn = false;
            cameraStream = null;
            cameraFeed.hidden = true;
            cameraToggleButton.textContent = 'Show Camera';
            stopQrScanner(); 
        }
    }

    /**
     * Stops the camera feed and releases the stream.
     */
    async function stopCamera() { // No longer needs async for scanner
        if (!isCameraOn || !cameraStream) return;

        console.log('Stopping camera...');
        stopQrScanner(); // Stop scanner loop first

        cameraStream.getTracks().forEach(track => track.stop());
        cameraFeed.srcObject = null;
        cameraFeed.hidden = true;
        cameraStream = null;
        isCameraOn = false;
        cameraToggleButton.textContent = 'Show Camera';
        console.log('Camera stopped.');
    }

    /**
     * Toggles the camera state (on/off).
     */
    function toggleCamera() {
        if (isCameraOn) {
            stopCamera();
        } else {
            startCamera();
        }
    }

    // --- Game Logic Functions --- 

    /**
     * Starts the game timer and main loop.
     */
    function startGame() {
        if (gameState === 'running' || gameState === 'starting') return; // Prevent multiple starts

        console.log('Starting Game Sequence...');
        // Initial state resets (scores, holder, timer variable)
        scoreRed = 0;
        scoreBlue = 0;
        baseHolderTeam = null;
        gameTimerSeconds = currentInitialGameDurationSeconds;
        // Reset Announcement State
        previousBaseHolderTeam = null;
        previousScoreRed = 0;
        previousScoreBlue = 0;
        lastAnnouncementTime = 0; 
        playedTimeWarning = false;
        playedEndGameWarning = false;
        played4MinWarning = false;
        played3MinWarning = false;
        played2MinWarning = false;
        played1MinWarning = false;
        currentlyPlayingAnnouncement = null; // Ensure no leftover sound object
        lastPointAwardTime = Date.now(); // Initialize point timer on start

        // Set state to indicate countdown is happening, but loop hasn't started
        gameState = 'starting'; 
        startButton.disabled = true;
        startButton.textContent = 'Starting...'; 
        announcementsDisplay.innerHTML = ''; 
        addAnnouncement('Get Ready!'); // Initial announcement

        // Update UI displays to initial visual state
        updateScoreDisplay(scoreRed, scoreBlue);
        updateTimerDisplay(gameTimerSeconds); // Show the full time initially
        updateBaseHolderDisplay(baseHolderTeam);
        updateGameStatusDisplay(gameState); // Show 'Starting...' or similar

        // Start background loops IMMEDIATELY
        soundAmbiance.play().catch(e => console.error("Error playing ambiance:", e));
        soundBgm.play().catch(e => console.error("Error playing BGM:", e));

        // Play the start announcement sound
        soundGameStart.play().then(() => {
            console.log('Start sound playing...');
        }).catch(e => {
            console.error("Error playing start sound:", e);
             startActualGameLoop();
        });

        soundGameStart.onended = () => {
            console.log('Start sound finished.');
            startActualGameLoop();
            soundGameStart.onended = null; 
        };
    }

    /**
     * Contains the logic moved from startGame to start the actual timer loop.
     */
    function startActualGameLoop() {
         if (gameState === 'starting' && !gameIntervalId) {
            console.log('Countdown complete. Starting game loop!');
            gameState = 'running'; 
            updateGameStatusDisplay(gameState);
            addAnnouncement('Game Started! Capture the Base!');
            startButton.textContent = 'Running'; 

            // Background loops are already playing
            // soundAmbiance.play().catch(e => console.error("Error playing ambiance:", e));
            // soundBgm.play().catch(e => console.error("Error playing BGM:", e));

            // Set initial previous state just before loop starts
            previousBaseHolderTeam = baseHolderTeam;
            previousScoreRed = scoreRed;
            previousScoreBlue = scoreBlue;
            lastAnnouncementTime = Date.now(); // Start cooldown timer

            gameIntervalId = setInterval(gameLoop, 1000); 
        }
    }

    /**
     * The main game loop, runs every second.
     */
    function gameLoop() {
        if (gameState !== 'running') return;
        gameTimerSeconds--;
        const now = Date.now();
        let pointScoredThisTick = false; 

        // Award points to base holder every 2 seconds
        if (baseHolderTeam && now - lastPointAwardTime >= 2000) { 
            if (baseHolderTeam === 'Red') {
                scoreRed++;
                pointScoredThisTick = true;
            } else if (baseHolderTeam === 'Blue') {
                scoreBlue++;
                pointScoredThisTick = true;
            }
            if (pointScoredThisTick) {
                 lastPointAwardTime = now; // Update time only if points were awarded
                 console.log(`Point awarded to ${baseHolderTeam} at ${now}`); // Debug log
            }
        }

        // Update UI every second (timer display)
        updateTimerDisplay(gameTimerSeconds);
        // Update score display only if it changed
        if (pointScoredThisTick) {
             updateScoreDisplay(scoreRed, scoreBlue);
        }
        
        // --- Time Specific Announcements & Warnings ---
        let timeAnnouncementPlayedThisTick = false;

        // Play 4 Min Warning (at 240s)
        if (!played4MinWarning && gameTimerSeconds === 240) {
             console.log("Playing 4-minute warning.");
             soundTime4Min.play().catch(e => console.error("Error playing 4min warning:", e));
             played4MinWarning = true;
             timeAnnouncementPlayedThisTick = true;
             lastAnnouncementTime = now; // Apply cooldown after time warning
        }
        // Play 3 Min Warning (at 180s)
        else if (!played3MinWarning && gameTimerSeconds === 180) {
             console.log("Playing 3-minute warning.");
             soundTime3Min.play().catch(e => console.error("Error playing 3min warning:", e));
             played3MinWarning = true;
             timeAnnouncementPlayedThisTick = true;
             lastAnnouncementTime = now;
        }
        // Play 2 Min Warning (at 120s)
        else if (!played2MinWarning && gameTimerSeconds === 120) {
             console.log("Playing 2-minute warning.");
             soundTime2Min.play().catch(e => console.error("Error playing 2min warning:", e));
             played2MinWarning = true;
             timeAnnouncementPlayedThisTick = true;
             lastAnnouncementTime = now;
        }
        // Play 1 Min Warning (at 60s)
        else if (!played1MinWarning && gameTimerSeconds === 60) {
             console.log("Playing 1-minute warning.");
             soundTime1Min.play().catch(e => console.error("Error playing 1min warning:", e));
             played1MinWarning = true;
             timeAnnouncementPlayedThisTick = true;
             lastAnnouncementTime = now;
        }
        // Play 10 Sec End Game Warning (at 10s)
        else if (!playedEndGameWarning && gameTimerSeconds <= 10) {
             console.log("Playing 10-second warning sound (end game.m4a).")
             soundEndGameWarning.play().catch(e => console.error("Error playing end game warning sound:", e));
             playedEndGameWarning = true; 
             playedTimeWarning = true; // Also counts as a general time warning
             timeAnnouncementPlayedThisTick = true;
             lastAnnouncementTime = now;
        }

        // --- Dynamic Announcement Logic --- 
        const timeSinceLastAnnounce = now - lastAnnouncementTime;
        // console.log(`Time since last announcement: ${timeSinceLastAnnounce}ms`); // Optional detailed timing log
        if (!timeAnnouncementPlayedThisTick && timeSinceLastAnnounce > ANNOUNCEMENT_COOLDOWN_MS) {
            console.log(`[gameLoop] Cooldown met (${timeSinceLastAnnounce} > ${ANNOUNCEMENT_COOLDOWN_MS}). Checking dynamic announcements...`); // DEBUG
            let announcementPlayed = false;
            
            // 1. Check Dynamic Time Warning (e.g., at 30 seconds)
            if (!playedTimeWarning && gameTimerSeconds <= TIME_WARNING_THRESHOLD_SECONDS && gameTimerSeconds > 10) { 
                console.log("[gameLoop] Condition Met: Dynamic Time Warning."); // DEBUG
                playRandomSound(timeRunningOutSounds);
                playedTimeWarning = true; 
                announcementPlayed = true;
            }
            
            // 2. Check Lead Changes 
            if (!announcementPlayed && baseHolderTeam !== previousBaseHolderTeam) {
                 console.log(`[gameLoop] Condition Met: Lead Change (${previousBaseHolderTeam} -> ${baseHolderTeam}).`); // DEBUG
                if (baseHolderTeam === 'Red') {
                    playRandomSound(redTakesLeadSounds);
                } else if (baseHolderTeam === 'Blue') {
                    playRandomSound(blueTakesLeadSounds);
                } else { 
                    if (previousBaseHolderTeam === 'Red') playRandomSound(redFallingBehindSounds);
                    if (previousBaseHolderTeam === 'Blue') playRandomSound(blueFallingBehindSounds);
                }
                 announcementPlayed = true; 
            }
            
            // 3. Check Domination 
            if (!announcementPlayed) {
                const scoreDiff = scoreRed - scoreBlue;
                const prevScoreDiff = previousScoreRed - previousScoreBlue;
                const absScoreDiff = Math.abs(scoreDiff);
                const absPrevScoreDiff = Math.abs(prevScoreDiff);

                if (scoreDiff > 0 && baseHolderTeam === 'Red' && ( (absScoreDiff >= DOMINATION_THRESHOLD && absPrevScoreDiff < DOMINATION_THRESHOLD) || (absScoreDiff > absPrevScoreDiff + (DOMINATION_THRESHOLD / 2)) ) ) {
                     console.log(`[gameLoop] Condition Met: Red Domination (Score: ${scoreRed}-${scoreBlue}).`); // DEBUG
                     playRandomSound(redDominatingSounds);
                     announcementPlayed = true;
                } else if (scoreDiff < 0 && baseHolderTeam === 'Blue' && ( (absScoreDiff >= DOMINATION_THRESHOLD && absPrevScoreDiff < DOMINATION_THRESHOLD) || (absScoreDiff > absPrevScoreDiff + (DOMINATION_THRESHOLD / 2)) )) {
                    console.log(`[gameLoop] Condition Met: Blue Domination (Score: ${scoreRed}-${scoreBlue}).`); // DEBUG
                    playRandomSound(blueDominatingSounds);
                    announcementPlayed = true;
                }
            }
            
            // 4. Check Falling Behind (if missed lead change - less likely now but keep check)
             if (!announcementPlayed && previousBaseHolderTeam !== baseHolderTeam) {
                  console.log(`[gameLoop] Condition Met: Falling Behind Check (Prev: ${previousBaseHolderTeam}, Now: ${baseHolderTeam}).`); // DEBUG
                  if (previousBaseHolderTeam === 'Red' && baseHolderTeam !== 'Red') {
                       playRandomSound(redFallingBehindSounds);
                       announcementPlayed = true;
                  } else if (previousBaseHolderTeam === 'Blue' && baseHolderTeam !== 'Blue') {
                       playRandomSound(blueFallingBehindSounds);
                       announcementPlayed = true;
                  }
             }

            if (announcementPlayed) {
                 console.log("[gameLoop] Dynamic announcement triggered this tick."); // DEBUG
            }
        }

        // Update previous state for next loop comparison
        previousBaseHolderTeam = baseHolderTeam;
        previousScoreRed = scoreRed;
        previousScoreBlue = scoreBlue;

        if (gameTimerSeconds <= 0) {
            endGame();
        }
    }

    /**
     * Ends the game, calculates winner, stops loop.
     */
    function endGame() {
        if (gameState !== 'running' && gameState !== 'starting') return; 

        // Stop other sounds first
        if (!soundGameStart.paused) {
            soundGameStart.pause();
            soundGameStart.currentTime = 0; 
            soundGameStart.onended = null; 
        }
        if (!soundAmbiance.paused) {
             soundAmbiance.pause();
             soundAmbiance.currentTime = 0;
         }
        if (!soundBgm.paused) {
             soundBgm.pause();
             soundBgm.currentTime = 0;
         }
        stopScanningSound(); // Use helper
        if (currentlyPlayingAnnouncement && !currentlyPlayingAnnouncement.paused) {
             currentlyPlayingAnnouncement.pause();
             currentlyPlayingAnnouncement.currentTime = 0;
             currentlyPlayingAnnouncement = null;
         }
        // Stop the 10-second warning if it was somehow still playing
        if (!soundEndGameWarning.paused) {
            soundEndGameWarning.pause();
            soundEndGameWarning.currentTime = 0;
        }

        // Clear interval etc.
        if (gameIntervalId) { clearInterval(gameIntervalId); gameIntervalId = null; }
        console.log('Game Over!');
        gameState = 'gameover';

        // Determine winner
        let winner = 'Tie';
        if (scoreRed > scoreBlue) winner = 'Red';
        if (scoreBlue > scoreRed) winner = 'Blue';
        console.log(`Final Score: Red ${scoreRed} - Blue ${scoreBlue}`);
        console.log(`Winner: ${winner}`);
        
        // Update UI immediately
        updateGameStatusDisplay(gameState);
        addAnnouncement(`Game Over! Final Score: Red ${scoreRed} - Blue ${scoreBlue}.`);
        addAnnouncement(`${winner === 'Tie' ? 'It\'s a Draw' : winner + ' wins'}!`);
        startButton.disabled = false;
        startButton.textContent = 'Play Again?';

        // --- Play End Game Audio Sequence ---
        // 1. Play Victory SFX immediately
        soundVictorySfx.play().then(() => {
            // 2. When Victory SFX finishes, play winner/draw sound
            soundVictorySfx.onended = () => {
                console.log("Victory SFX finished, playing winner sound.");
                if (winner === 'Red') {
                    soundRedWins.play().catch(e => console.error("Error playing red wins sound:", e));
                } else if (winner === 'Blue') {
                    soundBlueWins.play().catch(e => console.error("Error playing blue wins sound:", e));
                } else { // Tie
                    soundDraw.play().catch(e => console.error("Error playing draw sound:", e));
                }
                soundVictorySfx.onended = null; // Remove listener
            };
        }).catch(e => {
            console.error("Error playing victory SFX:", e);
            // Fallback: If victory sfx fails, try playing winner sound directly?
             if (winner === 'Red') soundRedWins.play().catch(e2 => console.error("Error playing red wins sound (fallback):", e2));
             else if (winner === 'Blue') soundBlueWins.play().catch(e2 => console.error("Error playing blue wins sound (fallback):", e2));
             else soundDraw.play().catch(e2 => console.error("Error playing draw sound (fallback):", e2));
        });

        // Stop specific time sounds if playing
        if (!soundTime4Min.paused) { soundTime4Min.pause(); soundTime4Min.currentTime = 0; }
        if (!soundTime3Min.paused) { soundTime3Min.pause(); soundTime3Min.currentTime = 0; }
        if (!soundTime2Min.paused) { soundTime2Min.pause(); soundTime2Min.currentTime = 0; }
        if (!soundTime1Min.paused) { soundTime1Min.pause(); soundTime1Min.currentTime = 0; }
        if (!soundEndGameWarning.paused) { /* ... already handled ... */ }
    }

    // --- QR Info Modal Functions (Ensure these are defined globally) ---
    function openQrInfoModal() {
        if (qrInfoModal) qrInfoModal.style.display = 'flex';
    }

    function closeQrInfoModal() {
        if (qrInfoModal) qrInfoModal.style.display = 'none';
    }

    // --- Event Listeners ---
    cameraToggleButton.addEventListener('click', toggleCamera);
    startButton.addEventListener('click', startGame); // Added listener for Start button
    settingsButton.addEventListener('click', openSettingsModal); // Open modal
    closeSettingsButton.addEventListener('click', closeSettingsModal); // Close modal via button
    settingsModal.addEventListener('click', (event) => { // Close modal via background click
        if (event.target === settingsModal) {
            closeSettingsModal();
        }
    });
    // QR Info Modal Listeners (New)
    if (qrInfoButton) {
        qrInfoButton.addEventListener('click', openQrInfoModal);
    }
    if (closeQrInfoButton) {
        closeQrInfoButton.addEventListener('click', closeQrInfoModal);
    }
    if (qrInfoModal) {
        qrInfoModal.addEventListener('click', (event) => {
            if (event.target === qrInfoModal) {
                closeQrInfoModal();
            }
        });
    }
    // Check if QR images loaded, add fallback text if not (New)
    if (qrRedImg) {
        qrRedImg.onerror = () => {
            qrRedImg.parentElement.innerHTML += '<p style="color:red;">Error: Red QR image not found at media/redteamqrcode.png</p>';
        }
    }
    if (qrBlueImg) {
        qrBlueImg.onerror = () => {
             qrBlueImg.parentElement.innerHTML += '<p style="color:red;">Error: Blue QR image not found at media/blueteamqrcode.png</p>';
        }
    }
    // Apply settings immediately on change
    if (bgmVolumeSlider) {
         bgmVolumeSlider.addEventListener('input', (e) => applyAndSaveSetting('bgmVolume', e.target.value));
    }
    if (sfxVolumeSlider) {
         sfxVolumeSlider.addEventListener('input', (e) => applyAndSaveSetting('sfxVolume', e.target.value));
    }
    if (gameDurationInput) {
         gameDurationInput.addEventListener('change', (e) => applyAndSaveSetting('gameDuration', e.target.value));
    }
    // Add listeners for camera radio buttons
    if (cameraFrontRadio) {
        cameraFrontRadio.addEventListener('change', (e) => {
             if (e.target.checked) applyAndSaveSetting('facingMode', 'user');
        });
    }
    if (cameraRearRadio) {
        cameraRearRadio.addEventListener('change', (e => {
             if (e.target.checked) applyAndSaveSetting('facingMode', 'environment');
        }));
    }
    window.addEventListener('resize', resizeGameContainer);
    window.addEventListener('orientationchange', resizeGameContainer);
    // Add listener for visualViewport resize events (for dynamic UI like keyboards/address bars)
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', resizeGameContainer);
    }

    // Initial state setup on load
    resizeGameContainer(); // Apply initial size
    loadSettings(); 
    stopQrScanner(); 
    updateScoreDisplay(scoreRed, scoreBlue);
    updateTimerDisplay(currentInitialGameDurationSeconds); // Use current setting for initial display
    updateBaseHolderDisplay(baseHolderTeam);
    updateGameStatusDisplay(gameState);

    // Explicitly hide modals on load just in case
    if (settingsModal) settingsModal.style.display = 'none'; 
    if (qrInfoModal) qrInfoModal.style.display = 'none'; // Hide QR modal too

    // Title Screen Button (New)
    if (titleEnterButton) {
        titleEnterButton.addEventListener('click', () => {
            if (titleScreen) {
                titleScreen.classList.add('hidden');
                console.log("Title screen hidden.");
                // Optionally: Initialize camera now? Or let user click toggle?
                // initializeCamera(); // Decide if you want camera on immediately after title
            }
        });
    }

    console.log('Capture the Base script initialized with jsQR (Hold-to-Scan + Grace + Scanning SFX).');

    // --- Service Worker Registration ---
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('[Service Worker] Registered successfully with scope:', registration.scope);
                })
                .catch(error => {
                    console.error('[Service Worker] Registration failed:', error);
                });
        });
    } else {
        console.log('Service Worker is not supported by this browser.');
    }

    console.log('End of script.js reached.'); // Add a final log
}); 