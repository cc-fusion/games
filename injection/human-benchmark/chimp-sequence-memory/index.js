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
    //element.dispatchEvent(new MouseEvent('click', eventInit));
    element.click()
    return element;
}

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

// ===== Click History & Playback =====

const dotHistory = [];
const activeAnimations = new Set();
let playbackId = 0;

// Create a non-interactive overlay for dots and ripple effects
const dotLayer = document.createElement("div");
dotLayer.id = "click-history-overlay";
Object.assign(dotLayer.style, {
    position: "fixed",
    inset: "0",
    pointerEvents: "none",
    zIndex: "2147483647",
    overflow: "visible"
});
dotLayer.setAttribute("aria-hidden", "true");
document.body.appendChild(dotLayer);


// Create a persistent dot at the current cursor position
function createDot(x, y) {
    const dot = document.createElement("div");

    Object.assign(dot.style, {
        position: "absolute",
        left: `${x}px`,
        top: `${y}px`,
        width: "12px",
        height: "12px",
        background: "#ff3b30",
        border: "2px solid white",
        borderRadius: "50%",
        boxShadow: "0 0 6px rgba(0,0,0,0.5)",
        transform: "translate(-50%, -50%)"
    });

    dotLayer.appendChild(dot);

    // Save both coordinates and the visual element
    dotHistory.push({ x, y, element: dot });
}


// Stop any currently running playback
function stopDotPlayback() {
    playbackId++;

    for (const animation of activeAnimations) {
        animation.cancel();
    }

    activeAnimations.clear();
    dotLayer.querySelectorAll(".click-history-ripple")
        .forEach(ripple => ripple.remove());
}


// Undo the most recently created dot
function undoDot() {
    stopDotPlayback();

    const lastDot = dotHistory.pop();

    if (lastDot) {
        lastDot.element.remove();
    }
}


// Clear all dots and history
function clearDotHistory() {
    stopDotPlayback();

    dotHistory.forEach(dot => dot.element.remove());
    dotHistory.length = 0;
}


// Animate an inward ripple at a saved position
function showInwardRipple(point) {
    return new Promise(resolve => {
        const ripple = document.createElement("div");
        ripple.className = "click-history-ripple";

        Object.assign(ripple.style, {
            position: "absolute",
            left: `${point.x}px`,
            top: `${point.y}px`,
            width: "76px",
            height: "76px",
            border: "3px solid #00aaff",
            borderRadius: "50%",
            boxSizing: "border-box",
            transform: "translate(-50%, -50%) scale(1)",
            opacity: "0.9",
            filter: "drop-shadow(0 0 5px #00aaff)"
        });

        dotLayer.appendChild(ripple);

        const animation = ripple.animate(
            [
                {
                    transform: "translate(-50%, -50%) scale(1)",
                    opacity: 0.9
                },
                {
                    transform: "translate(-50%, -50%) scale(0.05)",
                    opacity: 0
                }
            ],
            {
                duration: 450,
                easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
                fill: "forwards"
            }
        );

        activeAnimations.add(animation);

        animation.finished
            .catch(() => {}) // Handle cancellation
            .finally(() => {
                activeAnimations.delete(animation);
                ripple.remove();
                resolve();
            });
    });
}


async function playDotHistory() {
    stopDotPlayback();

    const currentPlayback = playbackId;

    // Process dots in chronological order
    while (dotHistory.length > 0) {
        if (currentPlayback !== playbackId) return;

        // Remove the first dot from history
        const point = dotHistory.shift();
        simulateClick(point.x, point.y)

        // Remove its visible dot
        point.element.remove();

        // Start ripple without waiting for animation to finish
        showInwardRipple(point);

        // Brief delay between ripple starts (animations overlap)
        await new Promise(resolve => setTimeout(resolve, 150));
    }
}



// Keyboard shortcuts
addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase();

    // Don't trigger shortcuts while typing in an input or editable area
    if (
        e.target instanceof Element &&
        e.target.closest("input, textarea, select, [contenteditable='true']")
    ) {
        return;
    }

    if (!["x", "u", "p", "c"].includes(key) || e.repeat) return;

    e.preventDefault();

    switch (key) {
        case "x":
            createDot(mouse.x, mouse.y);
            break;

        case "u":
            undoDot();
            break;

        case "p":
            playDotHistory();
            break;

        case "c":
            clearDotHistory();
            break;
    }
});
