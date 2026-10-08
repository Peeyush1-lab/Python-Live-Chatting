const statusElement = document.getElementById("status");
const messageElement = document.getElementById("message");
const retryButton = document.getElementById("retry");
const card = document.querySelector(".connection-card");

function updateStatus(text, state, message) {
    statusElement.textContent = text;
    statusElement.dataset.state = state;
    messageElement.textContent = message;
    retryButton.disabled = state !== "disconnected";
}

if (typeof window.io !== "function") {
    updateStatus(
        "Client failed to load",
        "disconnected",
        "Check your internet connection and reload the page."
    );
    retryButton.addEventListener("click", () => window.location.reload());
} else {
    const socket = io({ autoConnect: false });

    socket.on("connect", () => {
        updateStatus(
            "Connected",
            "connected",
            "Connection established."
        );
    });

    socket.on("server_message", (data) => {
        messageElement.textContent = data.message;
    });

    socket.on("disconnect", () => {
        updateStatus(
            "Disconnected",
            "disconnected",
            "Connection lost. Waiting to reconnect."
        );
    });

    socket.on("connect_error", () => {
        updateStatus(
            "Connection failed",
            "disconnected",
            "Check that your Python server is running."
        );
    });

    socket.io.on("reconnect_attempt", () => {
        updateStatus(
            "Reconnecting…",
            "connecting",
            "Trying to reach the server."
        );
    });

    retryButton.addEventListener("click", () => {
        updateStatus(
            "Connecting…",
            "connecting",
            "Trying to reach the server."
        );
        socket.connect();
    });

    socket.connect();
}

const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
).matches;

if ("IntersectionObserver" in window && !reducedMotion) {
    const observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
            if (entry.isIntersecting) {
                entry.target.classList.remove("reveal-pending");
                observer.unobserve(entry.target);
            }
        }
    });

    card.classList.add("reveal-pending");
    observer.observe(card);
}