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

let keys = {};
let mouseHistory = []; // Stores path coordinates when dragging

// Injected Overlay Canvas for Visual Effects
const canvas = document.createElement('canvas');
canvas.style.position = 'fixed';
canvas.style.top = '0';
canvas.style.left = '0';
canvas.style.width = '100vw';
canvas.style.height = '100vh';
canvas.style.zIndex = '999999';
canvas.style.pointerEvents = 'none'; // Clicks pass right through it
document.body.appendChild(canvas);
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Active animations container
let animations = [];

// Animation Loop
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw current mouse history path for debugging / visual reference (Optional)
    if (mouseHistory.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(0, 150, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.moveTo(mouseHistory[0].x, mouseHistory[0].y);
        for(let i = 1; i < mouseHistory.length; i++) {
            ctx.lineTo(mouseHistory[i].x, mouseHistory[i].y);
        }
        ctx.stroke();
    }

    // Update and draw shrinking circle animations
    animations = animations.filter(anim => {
        const elapsed = performance.now() - anim.startTime;
        const progress = Math.min(elapsed / anim.duration, 1);
        
        // Calculate shrinking radius down to a small dot
        const currentRadius = anim.startRadius - (anim.startRadius - anim.endRadius) * progress;
        
        ctx.beginPath();
        ctx.arc(anim.x, anim.y, currentRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 0, 80, ${1 - progress})`; // Fades out as it shrinks
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Always maintain the small center core dot
        ctx.beginPath();
        ctx.arc(anim.x, anim.y, anim.endRadius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 0, 80, ${0.8 * (1 - progress)})`;
        ctx.fill();

        return progress < 1; // Keep animation active until complete
    });

    requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

// Spawn a shrinking circle animation at target coordinates
function createClosingCircle(x, y, delay = 0) {
    setTimeout(() => {
        animations.push({
            x: x,
            y: y,
            startTime: performance.now(),
            duration: 400, // duration in ms
            startRadius: 30,
            endRadius: 3
        });
    }, delay);
}

// Trigger history replay sequence
function replayHistory(shouldClick) {
    if (mouseHistory.length === 0) return;
    
    // Process points evenly staggered over time to recreate the dynamic pattern
    mouseHistory.forEach((point, index) => {
        const delay = index * 30; // Stagger effect sequentially 
        
        // Action 1: Create visual closing circle indicator
        createClosingCircle(point.x, point.y, delay);
        
        // Action 2: If requested (Pressing 'R'), execute synthetic click simulation
        if (shouldClick) {
            setTimeout(() => {
                simulateClick(point.x, point.y);
            }, delay);
        }
    });

    // If 'R' is pressed, purge the historical coordinates after executing
    if (shouldClick) {
        mouseHistory = [];
    }
}

// Event Listeners
addEventListener("keydown", (e) => {
    let key = e.key.toLowerCase();
    keys[key] = true;

    if (key === 'x') {
        // Visual closing pattern animation only
        replayHistory(false);
    } else if (key === 'r') {
        // Simulates clicks on the path pattern and clears historical data
        replayHistory(true);
    }
});

addEventListener("keyup", (e) => {
    let key = e.key.toLowerCase();
    keys[key] = false;
});

let mouse = { x: 0, y: 0, down: false, element: null };

addEventListener("mousedown", (e) => {
    mouse.down = true;
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.element = document.elementFromPoint(e.clientX, e.clientY);
    
    // Clear previous trail on a fresh click downward to start recording anew
    mouseHistory = [{ x: e.clientX, y: e.clientY }];
});

addEventListener("mousemove", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.element = document.elementFromPoint(e.clientX, e.clientY);
    
    // Record movements dynamically while the user holds down drag
    if (mouse.down) {
        mouseHistory.push({ x: e.clientX, y: e.clientY });
    }
});

addEventListener("mouseup", (e) => {
    mouse.down = false;
    mouse.element = null;
});
