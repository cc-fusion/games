// Core click simulation helper
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

// Provided Fake Cursor SVG Data URL
const fakeCursorURL = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 40'%3E%3Cpath d='M3 2 L3 32 L10 25 L15 37 L20 35 L15 23 L26 23 Z' fill='black' stroke='white' stroke-width='2.4' stroke-linejoin='round'/%3E%3C/svg%3E";

// Create and inject the virtual cursor element into the page
const cursorEl = document.createElement('img');
cursorEl.src = fakeCursorURL;
cursorEl.style.position = 'fixed';
cursorEl.style.width = '24px';
cursorEl.style.height = '30px';
cursorEl.style.zIndex = '999999'; // Stay on top of all elements
cursorEl.style.pointerEvents = 'none'; // Don't block elementFromPoint clicks
cursorEl.style.display = 'none'; // Hidden by default
document.body.appendChild(cursorEl);

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
    if (keys[CONFIG.playbackKey] && !isRecording && macroTimeline.length > 0) {
        if (playbackIndex === 0) {
            console.log("%c▶️ Playing Macro...", "color: green; font-weight: bold;");
            cursorEl.style.display = 'block'; // Show fake cursor when playback starts
        }

        // Get the current step in the macro sequence
        let currentStep = macroTimeline[playbackIndex];

        if (currentStep) {
            // Update the fake cursor position on screen
            cursorEl.style.left = `${currentStep.x}px`;
            cursorEl.style.top = `${currentStep.y}px`;

            if (currentStep.clicked) {
                // If the mouse was down during this tick, simulate a click
                simulateClick(currentStep.x, currentStep.y);
            }
        }

        // Advance to next step or loop back to the beginning
        playbackIndex = (playbackIndex + 1) % macroTimeline.length;
    } else {
        // Reset playback index and hide the virtual cursor if the key is released
        playbackIndex = 0;
        cursorEl.style.display = 'none';
    }

}, CONFIG.intervalMs);
