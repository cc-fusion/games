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
