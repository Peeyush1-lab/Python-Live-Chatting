const statusElement = document.getElementById("status");
const messageElement = document.getElementById("message");
const retryButton = document.getElementById("retry");
const card = document.querySelector(".connection-card");

const usernameForm = document.getElementById("username-form");
const usernameInput = document.getElementById("username");
const joinButton = document.getElementById("join-button");
const usernameFeedback = document.getElementById("username-feedback");

const messageForm = document.getElementById("message-form");
const messageInput = document.getElementById("message-input");
const sendButton = document.getElementById("send-button");
const messages = document.getElementById("messages");
const messageFeedback = document.getElementById("message-feedback");

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

    let joining = false;
    let joinRequest = 0;

    let joined = false;
    let sending = false;
    let messageRequest = 0;

    function updateComposer() {
        const enabled = socket.connected && joined;
        messageInput.disabled = !enabled;
        sendButton.disabled = !enabled || sending;
    }

    socket.on("disconnect", () => {
        joined = false;
        sending = false;
        messageRequest += 1;
        updateComposer();
        messageFeedback.textContent =
            "Connection lost. Join again after reconnecting.";
    });

    socket.on("chat_message", (data) => {
        const nearBottom =
            messages.scrollHeight - messages.scrollTop - messages.clientHeight < 60;

        const item = document.createElement("li");
        const header = document.createElement("header");
        const sender = document.createElement("strong");
        const body = document.createElement("p");

        header.className = "message-header";
        sender.textContent = data.username;
        body.textContent = data.message;

        header.append(sender);

        const date = new Date(data.timestamp);

        if (data.timestamp && !Number.isNaN(date.getTime())) {
            const time = document.createElement("time");

            time.dateTime = date.toISOString();
            time.textContent = new Intl.DateTimeFormat(undefined, {
                hour: "2-digit",
                minute: "2-digit",
            }).format(date);

            time.title = date.toLocaleString();
            time.setAttribute("aria-label", date.toLocaleString());

            header.append(time);
        }

        item.append(header, body);
        messages.append(item);

        if (nearBottom) {
            messages.scrollTop = messages.scrollHeight;
        }
    });

    socket.on("system_message", (data) => {
        const nearBottom =
            messages.scrollHeight - messages.scrollTop - messages.clientHeight < 60;

        const item = document.createElement("li");
        const text = document.createElement("p");

        item.className = "system-message";
        text.textContent = data.message;
        item.append(text);

        const date = new Date(data.timestamp);

        if (data.timestamp && !Number.isNaN(date.getTime())) {
            const time = document.createElement("time");

            time.dateTime = date.toISOString();
            time.textContent = date.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            });
            time.title = date.toLocaleString();

            item.append(time);
        }

        messages.append(item);

        if (nearBottom) {
            messages.scrollTop = messages.scrollHeight;
        }
    });
    messageForm.addEventListener("submit", (event) => {
        event.preventDefault();

        if (!socket.connected || !joined || sending) {
            return;
        }

        const message = messageInput.value.trim();

        if (!message || message.length > 1000) {
            messageFeedback.textContent =
                "Message must contain 1 to 1000 characters.";
            return;
        }

        sending = true;
        updateComposer();
        messageFeedback.textContent = "Sending…";

        const request = ++messageRequest;
        const draft = messageInput.value;

        socket.timeout(5000).emit("send_message", { message }, (error, response) => {
            if (request !== messageRequest) {
                return;
            }

            sending = false;
            updateComposer();

            if (error) {
                messageFeedback.textContent =
                    "Delivery is unconfirmed. Check the conversation before retrying.";
                return;
            }

            if (!response?.ok) {
                messageFeedback.textContent =
                    response?.error ?? "Message could not be sent.";
                return;
            }

            if (messageInput.value === draft) {
                messageInput.value = "";
            }

            messageFeedback.textContent = "Message sent.";
            messageInput.focus();
        });
    });

    socket.on("connect", () => {
        joining = false;
        joinButton.disabled = false;
        usernameFeedback.textContent = "Connected. Choose a name to join.";
    });

    socket.on("disconnect", () => {
        joinRequest += 1;
        joining = false;
        joinButton.disabled = true;
        usernameFeedback.textContent =
            "Disconnected. Join again after reconnecting.";
    });

    usernameForm.addEventListener("submit", (event) => {
        event.preventDefault();

        if (!socket.connected || joining) {
            return;
        }

        const username = usernameInput.value.trim();

        if (username.length < 2 || username.length > 24) {
            usernameFeedback.textContent =
                "Username must contain 2 to 24 characters.";
            usernameInput.focus();
            return;
        }

        joining = true;
        joinButton.disabled = true;
        usernameFeedback.textContent = "Joining…";

        const request = ++joinRequest;

        socket.timeout(5000).emit("join_chat", { username }, (error, response) => {
            if (request !== joinRequest) {
                return;
            }

            joining = false;
            joinButton.disabled = !socket.connected;

            if (error) {
                usernameFeedback.textContent =
                    "No response from the server. Please retry.";
                return;
            }

            if (!response?.ok) {
                usernameFeedback.textContent =
                    response?.error ?? "Could not join the chat.";
                return;
            }

            joined = true;
            updateComposer();
            usernameFeedback.textContent = `Joined as ${response.username}.`;
            messageFeedback.textContent = "You can now send messages.";
            messageInput.focus();
        });
    });
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