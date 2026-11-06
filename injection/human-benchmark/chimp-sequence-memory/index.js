(() => {
    "use strict";

    // Safely remove a previous instance before creating a new one.
    if (typeof window.mouseReplayOverlay?.destroy === "function") {
        window.mouseReplayOverlay.destroy();
    }

    const CONFIG = {
        maxHistoryPoints: 400,
        minPointDistance: 4,
        replayInterval: 30,
        animationDuration: 400,
        startRadius: 30,
        endRadius: 3,
        maxPixelRatio: 2
    };

    // --------------------------------------------------
    // Canvas setup
    // --------------------------------------------------

    const canvas = document.createElement("canvas");

    Object.assign(canvas.style, {
        position: "fixed",
        top: "0",
        left: "0",
        width: "100vw",
        height: "100vh",
        zIndex: "999999",
        pointerEvents: "none",
        display: "block"
    });

    canvas.setAttribute("aria-hidden", "true");
    (document.body || document.documentElement).appendChild(canvas);

    const ctx = canvas.getContext("2d");

    let viewportWidth = window.innerWidth;
    let viewportHeight = window.innerHeight;

    function resizeCanvas() {
        const pixelRatio = Math.min(
            window.devicePixelRatio || 1,
            CONFIG.maxPixelRatio
        );

        viewportWidth = window.innerWidth;
        viewportHeight = window.innerHeight;

        canvas.width = Math.round(viewportWidth * pixelRatio);
        canvas.height = Math.round(viewportHeight * pixelRatio);

        // Keep drawing coordinates in CSS pixels.
        if (ctx) {
            ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        }
    }

    resizeCanvas();

    // --------------------------------------------------
    // State
    // --------------------------------------------------

    let mouseHistory = [];
    let animations = [];

    let isPointerDown = false;
    let activePointerId = null;

    let animationFrameId = null;
    let destroyed = false;

    const pendingTimers = new Set();

    // --------------------------------------------------
    // Mouse / pointer history
    // --------------------------------------------------

    function addHistoryPoint(x, y) {
        const previous = mouseHistory[mouseHistory.length - 1];

        if (previous) {
            const dx = x - previous.x;
            const dy = y - previous.y;
            const distance = Math.hypot(dx, dy);

            // Ignore points that are too close together.
            if (distance < CONFIG.minPointDistance) {
                return;
            }
        }

        mouseHistory.push({ x, y });

        // Keep memory and replay time bounded.
        if (mouseHistory.length > CONFIG.maxHistoryPoints) {
            mouseHistory.shift();
        }
    }

    function handlePointerDown(event) {
        // Only record the primary pointer and primary mouse button.
        if (!event.isPrimary || event.button !== 0) {
            return;
        }

        isPointerDown = true;
        activePointerId = event.pointerId;

        // Start a fresh path.
        mouseHistory = [{ x: event.clientX, y: event.clientY }];
    }

    function handlePointerMove(event) {
        if (!isPointerDown || event.pointerId !== activePointerId) {
            return;
        }

        addHistoryPoint(event.clientX, event.clientY);
    }

    function handlePointerUp(event) {
        if (event.pointerId !== activePointerId) {
            return;
        }

        // Include the final position in the recorded path.
        addHistoryPoint(event.clientX, event.clientY);

        isPointerDown = false;
        activePointerId = null;
    }

    function handlePointerCancel(event) {
        if (event.pointerId !== activePointerId) {
            return;
        }

        isPointerDown = false;
        activePointerId = null;
    }

    function handleWindowBlur() {
        // Avoid getting stuck in a dragging state if the page loses focus.
        isPointerDown = false;
        activePointerId = null;
    }

    // --------------------------------------------------
    // Synthetic click simulation
    // --------------------------------------------------

    function simulateClick(x, y) {
        if (!Number.isFinite(x) || !Number.isFinite(y)) {
            return null;
        }

        const element = document.elementFromPoint(x, y);

        if (!element) {
            return null;
        }

        const baseEvent = {
            view: window,
            bubbles: true,
            cancelable: true,
            clientX: x,
            clientY: y,
            screenX: x,
            screenY: y,
            button: 0,
            detail: 1
        };

        element.dispatchEvent(
            new MouseEvent("mousedown", {
                ...baseEvent,
                buttons: 1
            })
        );

        element.dispatchEvent(
            new MouseEvent("mouseup", {
                ...baseEvent,
                buttons: 0
            })
        );

        element.dispatchEvent(
            new MouseEvent("click", {
                ...baseEvent,
                buttons: 0
            })
        );

        return element;
    }

    // --------------------------------------------------
    // Timer management
    // --------------------------------------------------

    function schedule(callback, delay) {
        const timerId = window.setTimeout(() => {
            pendingTimers.delete(timerId);

            if (!destroyed) {
                callback();
            }
        }, delay);

        pendingTimers.add(timerId);
        return timerId;
    }

    function cancelPendingTimers() {
        for (const timerId of pendingTimers) {
            clearTimeout(timerId);
        }

        pendingTimers.clear();
    }

    // --------------------------------------------------
    // Visual animation
    // --------------------------------------------------

    function createClosingCircle(x, y) {
        animations.push({
            x,
            y,
            startTime: performance.now()
        });
    }

    function drawHistoryPath() {
        if (!ctx || mouseHistory.length < 2) {
            return;
        }

        ctx.beginPath();
        ctx.strokeStyle = "rgba(0, 150, 255, 0.3)";
        ctx.lineWidth = 2;

        ctx.moveTo(mouseHistory[0].x, mouseHistory[0].y);

        for (let i = 1; i < mouseHistory.length; i++) {
            ctx.lineTo(mouseHistory[i].x, mouseHistory[i].y);
        }

        ctx.stroke();
    }

    function drawAnimations(timestamp) {
        if (!ctx) {
            return;
        }

        animations = animations.filter(animation => {
            const elapsed = timestamp - animation.startTime;

            const progress = Math.min(
                elapsed / CONFIG.animationDuration,
                1
            );

            const radius =
                CONFIG.startRadius -
                (CONFIG.startRadius - CONFIG.endRadius) * progress;

            const opacity = 1 - progress;

            // Outer shrinking circle.
            ctx.beginPath();
            ctx.arc(animation.x, animation.y, radius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 0, 80, ${opacity})`;
            ctx.lineWidth = 2;
            ctx.stroke();

            // Center dot.
            ctx.beginPath();
            ctx.arc(
                animation.x,
                animation.y,
                CONFIG.endRadius,
                0,
                Math.PI * 2
            );

            ctx.fillStyle = `rgba(255, 0, 80, ${0.8 * opacity})`;
            ctx.fill();

            return progress < 1;
        });
    }

    function animate(timestamp) {
        if (destroyed || !ctx) {
            return;
        }

        ctx.clearRect(0, 0, viewportWidth, viewportHeight);

        drawHistoryPath();
        drawAnimations(timestamp);

        animationFrameId = requestAnimationFrame(animate);
    }

    if (ctx) {
        animationFrameId = requestAnimationFrame(animate);
    }

    // --------------------------------------------------
    // History replay
    // --------------------------------------------------

    function replayHistory(shouldClick = false) {
        if (mouseHistory.length === 0) {
            return;
        }

        // Use a snapshot so subsequent pointer input cannot alter this replay.
        const points = mouseHistory.slice();

        // Clear history immediately for click replay.
        if (shouldClick) {
            mouseHistory = [];
        }

        points.forEach((point, index) => {
            const delay = index * CONFIG.replayInterval;

            schedule(() => {
                createClosingCircle(point.x, point.y);

                if (shouldClick) {
                    simulateClick(point.x, point.y);
                }
            }, delay);
        });
    }

    // --------------------------------------------------
    // Keyboard shortcuts
    // --------------------------------------------------

    function isEditingText(target) {
        return Boolean(
            target?.closest?.(
                "input, textarea, select, [contenteditable='true'], [role='textbox']"
            ) || target?.isContentEditable
        );
    }

    function handleKeyDown(event) {
        // Ignore key repeats, IME input, and modified shortcuts.
        if (
            event.repeat ||
            event.isComposing ||
            event.altKey ||
            event.ctrlKey ||
            event.metaKey ||
            event.shiftKey ||
            event.defaultPrevented ||
            isEditingText(event.target)
        ) {
            return;
        }

        const key = event.key.toLowerCase();

        if (key === "x") {
            // Visual replay only; retain the recorded path.
            replayHistory(false);
        } else if (key === "r") {
            // Visual replay plus synthetic clicks; clear the path.
            replayHistory(true);
        }
    }

    // --------------------------------------------------
    // Event registration
    // --------------------------------------------------

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerCancel);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("blur", handleWindowBlur);

    // --------------------------------------------------
    // Cleanup
    // --------------------------------------------------

    function destroy() {
        if (destroyed) {
            return;
        }

        destroyed = true;

        cancelPendingTimers();

        if (animationFrameId !== null) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }

        window.removeEventListener("pointerdown", handlePointerDown);
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
        window.removeEventListener("pointercancel", handlePointerCancel);

        window.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("resize", resizeCanvas);
        window.removeEventListener("blur", handleWindowBlur);

        animations = [];
        mouseHistory = [];

        canvas.remove();

        if (window.mouseReplayOverlay === api) {
            delete window.mouseReplayOverlay;
        }
    }

    const api = { destroy };
    window.mouseReplayOverlay = api;

    console.log(
        "Mouse replay overlay active. Press X to visualize or R to replay clicks. Run mouseReplayOverlay.destroy() to remove it."
    );
})();
