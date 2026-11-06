// Core click simulation helper provided
function simulateClick(x, y) {
    const element = document.elementFromPoint(x, y);
    if (!element) return null;
    const eventInit = {
        view: window,
        bubbles: true,
        cancelable: true,
        clientX: x,
        clientY: y,
        screenX: x,
        screenY: y,
        button: 0 // Primary (left) mouse button
    };
    element.dispatchEvent(new MouseEvent('mousedown', eventInit));
    element.dispatchEvent(new MouseEvent('mouseup', eventInit));
    element.dispatchEvent(new MouseEvent('click', eventInit));
    return element;
}

// Track currently held keys
let keys = {};
addEventListener("keydown", (e) => {
    let key = e.key.toLowerCase();
    keys[key] = true;
});
addEventListener("keyup", (e) => {
    let key = e.key.toLowerCase();
    keys[key] = false;
});

// Track real-time mouse position and states
let mouse = { x: 0, y: 0, down: false, element: null };
addEventListener("mousedown", (e) => {
    mouse.down = true;
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.element = document.elementFromPoint(e.clientX, e.clientY);
});
addEventListener("mousemove", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.element = document.elementFromPoint(e.clientX, e.clientY);
});
addEventListener("mouseup", (e) => {
    mouse.down = false;
    mouse.element = null;
});

// Macro Configuration & State
const CONFIG = {
    recordKey: 'r',      // Hold 'R' to record your mouse coordinates/clicks
    playbackKey: 'p',    // Hold 'P' to play back the recorded macro loop
    intervalMs: 50       // Tick rate (determines precision of macro timeline)
};

let macroTimeline = []; // Stores the recorded sequence
let playbackIndex = 0;   // Keeps track of where we are during playback
let isRecording = false;

// Main Loop: Runs every 50ms to manage state machines
setInterval(() => {
    // --- 1. HANDLE RECORDING ---
    if (keys[CONFIG.recordKey]) {
        if (!isRecording) {
            console.log("%c🔴 Recording Started...", "color: red; font-weight: bold;");
            macroTimeline = []; // Clear previous recording
            isRecording = true;
        }
        
        // Push the mouse state at this exact tick into our timeline
        macroTimeline.push({
            x: mouse.x,
            y: mouse.y,
            clicked: mouse.down
        });
    } else {
        if (isRecording) {
            console.log(`%c⏹️ Recording Stopped. Saved ${macroTimeline.length} steps.`, "color: orange; font-weight: bold;");
            isRecording = false;
        }
    }

    // --- 2. HANDLE PLAYBACK ---
    // Make sure we aren't trying to record and play at the same time
    if (keys[CONFIG.playbackKey] && !isRecording && macroTimeline.length > 0) {
        if (playbackIndex === 0) {
            console.log("%c▶️ Playing Macro...", "color: green; font-weight: bold;");
        }

        // Get the current step in the macro sequence
        let currentStep = macroTimeline[playbackIndex];

        if (currentStep) {
            if (currentStep.clicked) {
                // If the mouse was down during this tick, simulate a click
                simulateClick(currentStep.x, currentStep.y);
            } else {
                // Optional visual feedback: log the cursor movement simulation
                // console.log(`Simulating Hover at: X:${currentStep.x}, Y:${currentStep.y}`);
            }
        }

        // Advance to next step or loop back to the beginning
        playbackIndex = (playbackIndex + 1) % macroTimeline.length;
    } else {
        // Reset playback index if key is released
        playbackIndex = 0;
    }

}, CONFIG.intervalMs);
