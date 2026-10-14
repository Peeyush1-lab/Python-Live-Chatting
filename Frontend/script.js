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

const historyFeedback = document.getElementById("history-feedback");
const historyRetry = document.getElementById("history-retry");

const roomSelect = document.getElementById("room");
const currentRoomLabel = document.getElementById("current-room");

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

    historyFeedback.textContent = "History is unavailable until connected.";
    retryButton.addEventListener("click", () => window.location.reload());
} else {
    const socket = io({ autoConnect: false });
    const displayedIds = new Set();

    let joining = false;
    let joined = false;
    let currentRoom = null;
    let sending = false;
    let loadingHistory = false;

    let joinRequest = 0;
    let messageRequest = 0;
    let historyRequest = 0;

    let pendingMessages = [];

    function updateComposer() {
        const enabled = socket.connected && joined && !joining;

        messageInput.disabled = !enabled;
        sendButton.disabled = !enabled || sending;
    }

    function nearBottom() {
        return (
            messages.scrollHeight -
            messages.scrollTop -
            messages.clientHeight <
            60
        );
    }

    function createTime(timestamp) {
        const date = new Date(timestamp);

        if (!timestamp || Number.isNaN(date.getTime())) {
            return null;
        }

        const time = document.createElement("time");

        time.dateTime = date.toISOString();
        time.textContent = new Intl.DateTimeFormat(undefined, {
            hour: "2-digit",
            minute: "2-digit",
        }).format(date);

        time.title = date.toLocaleString();
        time.setAttribute("aria-label", date.toLocaleString());

        return time;
    }

    function renderMessage(data) {
        if (displayedIds.has(data.id)) {
            return;
        }

        displayedIds.add(data.id);

        const shouldScroll = nearBottom();
        const item = document.createElement("li");
        const header = document.createElement("header");
        const sender = document.createElement("strong");
        const body = document.createElement("p");

        header.className = "message-header";
        sender.textContent = data.username;
        body.textContent = data.message;

        header.append(sender);

        const time = createTime(data.timestamp);

        if (time) {
            header.append(time);
        }

        item.append(header, body);
        messages.append(item);

        if (shouldScroll) {
            messages.scrollTop = messages.scrollHeight;
        }
    }

    function renderSystemMessage(data) {
        const shouldScroll = nearBottom();
        const item = document.createElement("li");
        const text = document.createElement("p");

        item.className = "system-message";
        text.textContent = data.message;
        item.append(text);

        const time = createTime(data.timestamp);

        if (time) {
            item.append(time);
        }

        messages.append(item);

        if (shouldScroll) {
            messages.scrollTop = messages.scrollHeight;
        }
    }

    function flushPendingMessages() {
        const chatMessages = pendingMessages
            .filter((entry) => entry.type === "chat")
            .sort((a, b) => a.data.id - b.data.id);

        const systemMessages = pendingMessages.filter(
            (entry) => entry.type === "system"
        );

        for (const entry of chatMessages) {
            renderMessage(entry.data);
        }

        for (const entry of systemMessages) {
            renderSystemMessage(entry.data);
        }

        pendingMessages = [];
    }

    function loadHistory() {
        if (!socket.connected || !joined || joining || loadingHistory) {
            return;
        }

        loadingHistory = true;
        pendingMessages = [];
        historyRetry.disabled = true;
        historyFeedback.textContent = "Loading saved messages…";

        const request = ++historyRequest;
        const requestedRoom = currentRoom;

        socket.timeout(5000).emit("get_history", (error, response) => {
            if (request !== historyRequest || requestedRoom !== currentRoom) {
                return;
            }

            if (!error && response?.ok && response.room === requestedRoom && Array.isArray(response.messages)) {
                messages.replaceChildren();
                displayedIds.clear();

                for (const message of response.messages) {
                    renderMessage(message);
                }

                historyFeedback.textContent =
                    `Loaded ${response.messages.length} saved messages.`;
            } else {
                historyFeedback.textContent = error
                    ? "History request timed out. Try reloading history."
                    : response?.error ?? "Could not load history.";
            }

            flushPendingMessages();
            loadingHistory = false;
            historyRetry.disabled = !socket.connected;
            messages.scrollTop = messages.scrollHeight;
        });
    }

    socket.on("connect", () => {
        joining = false;
        joined = false;
        sending = false;

        joinButton.disabled = false;
        updateComposer();

        updateStatus(
            "Connected",
            "connected",
            "Connection established."
        );

        usernameFeedback.textContent = "Connected. Choose a name to join.";
        messageFeedback.textContent = "Join the chat to send messages.";

        currentRoom = null;
        currentRoomLabel.textContent = "Not joined";
        historyRetry.disabled = true;
        historyFeedback.textContent = "Join a room to load its history.";
    });

    socket.on("server_message", (data) => {
        messageElement.textContent = data.message;
    });

    socket.on("disconnect", () => {
        joinRequest += 1;
        messageRequest += 1;
        historyRequest += 1;

        joining = false;
        joined = false;
        sending = false;
        loadingHistory = false;

        pendingMessages = [];
        currentRoom = null;
        currentRoomLabel.textContent = "Not joined";

        joinButton.disabled = true;
        historyRetry.disabled = true;
        updateComposer();

        updateStatus(
            "Disconnected",
            "disconnected",
            "Connection lost. Waiting to reconnect."
        );

        usernameFeedback.textContent =
            "Disconnected. Join again after reconnecting.";

        messageFeedback.textContent =
            "Connection lost. Join again after reconnecting.";

        historyFeedback.textContent =
            "Disconnected. Rejoin a room after reconnecting to load history.";
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

    socket.on("chat_message", (data) => {
        if (joining || data.room !== currentRoom) {
            return;
        }

        if (loadingHistory) {
            pendingMessages.push({ type: "chat", data });
        } else {
            renderMessage(data);
        }
    });

    socket.on("system_message", (data) => {
        if (joining || data.room !== currentRoom) {
            return;
        }

        if (loadingHistory) {
            pendingMessages.push({ type: "system", data });
        } else {
            renderSystemMessage(data);
        }
    });

    usernameForm.addEventListener("submit", (event) => {
        event.preventDefault();

        if (!socket.connected || joining || sending) {
            return;
        }

        const username = usernameInput.value.trim();
        const room = roomSelect.value;

        if (username.length < 2 || username.length > 24) {
            usernameFeedback.textContent =
                "Username must contain 2 to 24 characters.";
            usernameInput.focus();
            return;
        }

        joining = true;
        historyRequest += 1;
        loadingHistory = false;
        pendingMessages = [];

        joinButton.disabled = true;
        historyRetry.disabled = true;
        updateComposer();

        usernameFeedback.textContent = "Joining room…";

        const request = ++joinRequest;

        socket.timeout(5000).emit(
            "join_chat",
            { username, room },
            (error, response) => {
                if (request !== joinRequest) {
                    return;
                }

                joining = false;
                joinButton.disabled = !socket.connected;

                if (error) {
                    joined = false;
                    currentRoom = null;
                    currentRoomLabel.textContent = "Not confirmed";
                    messages.replaceChildren();
                    displayedIds.clear();
                    updateComposer();

                    usernameFeedback.textContent =
                        "Room join is unconfirmed. Choose a room and retry.";
                    historyFeedback.textContent =
                        "Join a room to load its history.";
                    return;
                }

                if (!response?.ok) {
                    updateComposer();

                    usernameFeedback.textContent =
                        response?.error ?? "Could not join the room.";

                    if (joined) {
                        loadHistory();
                    }

                    return;
                }

                joined = true;
                currentRoom = response.room;
                currentRoomLabel.textContent = currentRoom;

                messages.replaceChildren();
                displayedIds.clear();

                updateComposer();
                usernameFeedback.textContent =
                    `Joined ${currentRoom} as ${response.username}.`;
                messageFeedback.textContent = "You can now send messages.";

                loadHistory();
                messageInput.focus();
            }
        );
    });

    messageForm.addEventListener("submit", (event) => {
        event.preventDefault();

        if (!socket.connected || !joined || joining || sending) {
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
        const sentRoom = currentRoom;

        socket.timeout(5000).emit(
            "send_message",
            { message },
            (error, response) => {
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

                if (sentRoom !== currentRoom) {
                    return;
                }

                if (messageInput.value === draft) {
                    messageInput.value = "";
                }

                messageFeedback.textContent = "Message sent.";
                messageInput.focus();
            }
        );
    });

    historyRetry.addEventListener("click", loadHistory);

    socket.connect();
}

const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
).matches;

if (card && "IntersectionObserver" in window && !reducedMotion) {
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