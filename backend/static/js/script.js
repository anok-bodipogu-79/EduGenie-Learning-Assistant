// Global State variables
let activeTask = "qa";
let activeEndpoint = "/qa";
let currentUser = null;

// DOM Elements
const taskCards = document.querySelectorAll(".task-card");
const inputLabel = document.getElementById("input-label");
const inputField = document.getElementById("query-input");
const btnSubmit = document.getElementById("btn-submit");
const loadingWrapper = document.getElementById("loading-wrapper");
const outputBox = document.getElementById("output-box");
const modelBadge = document.getElementById("model-badge");
const historyList = document.getElementById("history-list");

// Auth Elements
const userBadge = document.getElementById("user-badge");
const btnLoginNav = document.getElementById("btn-login-nav");
const btnLogoutNav = document.getElementById("btn-logout-nav");
const loginModal = document.getElementById("login-modal");
const registerModal = document.getElementById("register-modal");

// Task configuration mapping
const taskConfigs = {
    qa: {
        label: "Your Question",
        placeholder: "Ask any educational question (e.g., 'Explain the concept of quantum computing like I'm five' or 'What is the largest ocean in the world?')",
        endpoint: "/qa",
        model: "Gemini 1.5 Flash"
    },
    explain: {
        label: "Concept to Explain",
        placeholder: "Enter an educational topic to explain (e.g., 'Recursion', 'Photosynthesis', 'World War I', or 'SQL Joins')",
        endpoint: "/explain",
        model: "LaMini-Flan-T5"
    },
    quiz: {
        label: "Quiz Topic",
        placeholder: "Enter a topic to generate 3 custom multiple-choice questions (e.g., 'Python Programming', 'Chemistry', 'European Geography')",
        endpoint: "/quiz",
        model: "Gemini 1.5 Flash"
    },
    summarize: {
        label: "Text to Summarize",
        placeholder: "Paste a long educational paragraph, article, or notes to summarize...",
        endpoint: "/summarize",
        model: "Gemini 1.5 Flash"
    },
    learn: {
        label: "Learning Topic",
        placeholder: "Enter a topic you want a study roadmap for (e.g., 'Machine Learning', 'Public Speaking', 'Piano for Beginners')",
        endpoint: "/learn/recommendations",
        model: "Gemini 1.5 Flash"
    }
};

// Initialize Application
document.addEventListener("DOMContentLoaded", () => {
    checkCurrentUser();
    setupTaskSelectors();
    setupAuthModals();
});

// Setup Task Card Selection Events
function setupTaskSelectors() {
    taskCards.forEach(card => {
        card.addEventListener("click", () => {
            // Remove active class from all cards
            taskCards.forEach(c => c.classList.remove("active"));
            
            // Add active to current card
            card.classList.add("active");
            
            // Update active task & configuration
            activeTask = card.dataset.task;
            const config = taskConfigs[activeTask];
            
            activeEndpoint = config.endpoint;
            inputLabel.textContent = config.label;
            inputField.placeholder = config.placeholder;
            modelBadge.textContent = config.model;
            
            // Clear input and output box
            inputField.value = "";
            outputBox.innerHTML = '<div class="output-placeholder">Enter your inputs above and click Submit to generate output.</div>';
        });
    });
}

// Check Current Logged-In User
async function checkCurrentUser() {
    try {
        const response = await fetch("/auth/me");
        if (response.ok) {
            currentUser = await response.json();
            updateUIForAuth(true);
        } else {
            updateUIForAuth(false);
        }
    } catch (error) {
        console.error("Auth verification failed", error);
        updateUIForAuth(false);
    }
}

// Update Header for Auth status
function updateUIForAuth(isLoggedIn) {
    if (isLoggedIn && currentUser) {
        userBadge.textContent = currentUser.UserName;
        userBadge.style.display = "flex";
        btnLoginNav.style.display = "none";
        btnLogoutNav.style.display = "block";
        btnSubmit.innerHTML = "Ask Genie 🪄";
        fetchAndRenderHistory();
    } else {
        userBadge.style.display = "none";
        btnLoginNav.style.display = "block";
        btnLogoutNav.style.display = "none";
        btnSubmit.innerHTML = "Sign In to Ask Genie 🔑";
        historyList.innerHTML = '<div class="output-placeholder" style="font-size: 0.85rem; padding: 1rem 0; font-style: italic; text-align: center; color: var(--text-muted);">Sign in to view your learning history.</div>';
    }
}

// Handle submit execution
btnSubmit.addEventListener("click", async () => {
    // Enforce authentication check in the UI
    if (!currentUser) {
        loginModal.style.display = "flex";
        return;
    }

    const textValue = inputField.value.trim();
    if (!textValue) {
        alert("Please provide some input first.");
        return;
    }
    
    // Prepare request payload key depending on endpoint
    let payload = {};
    if (activeTask === "qa") {
        payload = { question: textValue };
    } else if (activeTask === "explain") {
        payload = { topic: textValue };
    } else if (activeTask === "quiz") {
        payload = { topic: textValue };
    } else if (activeTask === "summarize") {
        payload = { text: textValue };
    } else if (activeTask === "learn") {
        payload = { topic: textValue };
    }
    
    // Update UI for loading state
    loadingWrapper.style.display = "flex";
    outputBox.style.display = "none";
    btnSubmit.disabled = true;
    
    try {
        const response = await fetch(activeEndpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            const errorDetails = await response.json();
            throw new Error(errorDetails.detail || "Server error occurred");
        }
        
        const data = await response.json();
        renderResult(data);
        fetchAndRenderHistory();
    } catch (error) {
        console.error("API call failed", error);
        outputBox.innerHTML = `<div style="color: var(--accent-danger); font-weight: 600;">Error: ${error.message}</div>`;
    } finally {
        loadingWrapper.style.display = "none";
        outputBox.style.display = "block";
        btnSubmit.disabled = false;
    }
});

// Render results dynamically by task type
function renderResult(data) {
    outputBox.innerHTML = "";
    
    if (activeTask === "qa") {
        outputBox.innerHTML = `<div class="rendered-markdown">${formatMarkdown(data.answer)}</div>`;
    } else if (activeTask === "explain") {
        outputBox.innerHTML = `<div class="rendered-markdown">${formatMarkdown(data.explanation)}</div>`;
    } else if (activeTask === "summarize") {
        outputBox.innerHTML = `<div class="rendered-markdown">${formatMarkdown(data.summary)}</div>`;
    } else if (activeTask === "quiz") {
        renderQuiz(data);
    } else if (activeTask === "learn") {
        renderLearningPath(data);
    }
}

// Render Interactive Quiz
function renderQuiz(questions) {
    const quizWrapper = document.createElement("div");
    quizWrapper.className = "quiz-wrapper";
    
    questions.forEach((q, qIdx) => {
        const qCard = document.createElement("div");
        qCard.className = "quiz-question-card";
        
        const qText = document.createElement("div");
        qText.className = "quiz-question-text";
        qText.textContent = `${qIdx + 1}. ${q.question}`;
        qCard.appendChild(qText);
        
        const optsList = document.createElement("div");
        optsList.className = "quiz-options-list";
        
        q.options.forEach(opt => {
            const optBtn = document.createElement("button");
            optBtn.className = "quiz-option";
            optBtn.textContent = opt;
            
            optBtn.addEventListener("click", () => {
                // Disable clicking other options for this question
                const siblings = optsList.querySelectorAll(".quiz-option");
                siblings.forEach(btn => btn.disabled = true);
                
                // Highlight choice
                if (opt === q.correct_answer) {
                    optBtn.classList.add("correct");
                } else {
                    optBtn.classList.add("incorrect");
                    // Highlight correct option
                    siblings.forEach(btn => {
                        if (btn.textContent === q.correct_answer) {
                            btn.classList.add("correct");
                        }
                    });
                }
            });
            optsList.appendChild(optBtn);
        });
        
        qCard.appendChild(optsList);
        quizWrapper.appendChild(qCard);
    });
    
    outputBox.appendChild(quizWrapper);
}

// Render Interactive Learning Path Timeline
function renderLearningPath(data) {
    const timeline = document.createElement("div");
    timeline.className = "timeline";
    
    data.roadmap.forEach(step => {
        const item = document.createElement("div");
        item.className = "timeline-item";
        
        const dot = document.createElement("div");
        dot.className = "timeline-dot";
        item.appendChild(dot);
        
        const content = document.createElement("div");
        content.className = "timeline-content";
        
        const header = document.createElement("div");
        header.className = "timeline-header";
        
        const levelBadge = document.createElement("span");
        levelBadge.className = `badge-level ${step.level.toLowerCase()}`;
        levelBadge.textContent = step.level;
        header.appendChild(levelBadge);
        
        const titleSpan = document.createElement("span");
        titleSpan.textContent = "Study Roadmap";
        header.appendChild(titleSpan);
        
        content.appendChild(header);
        
        const topicsList = document.createElement("ul");
        topicsList.className = "timeline-topics";
        
        step.topics.forEach((topic, tIdx) => {
            const topicItem = document.createElement("li");
            topicItem.className = "timeline-topic-item";
            
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.id = `topic-${step.level}-${tIdx}`;
            
            const label = document.createElement("label");
            label.htmlFor = checkbox.id;
            label.textContent = topic;
            
            topicItem.appendChild(checkbox);
            topicItem.appendChild(label);
            topicsList.appendChild(topicItem);
        });
        
        content.appendChild(topicsList);
        item.appendChild(content);
        timeline.appendChild(item);
    });
    
    outputBox.appendChild(timeline);
}

// Simple regex markdown formatting
function formatMarkdown(text) {
    if (!text) return "";
    let html = text;
    
    // Clean escape
    html = html
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
        
    // Headers
    html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');
    
    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Inline code
    html = html.replace(/`(.*?)`/g, '<code>$1</code>');
    
    // List items
    html = html.replace(/^\s*[\*\-]\s+(.*?)$/gm, '<li>$1</li>');
    
    // Wrap standalone list nodes into list wraps
    html = html.replace(/(<li>.*?<\/li>)+/gs, '<ul>$&</ul>');
    
    // Spacing paragraphs
    html = html.replace(/\n\n/g, '<br><br>');
    
    return html;
}

// Setup Auth Dialog Modals
function setupAuthModals() {
    const showModal = (modal) => modal.style.display = "flex";
    const hideModal = (modal) => modal.style.display = "none";
    
    // Link Nav Buttons
    btnLoginNav.addEventListener("click", () => showModal(loginModal));
    
    // Close Triggers
    document.querySelectorAll(".modal-close").forEach(btn => {
        btn.addEventListener("click", () => {
            hideModal(loginModal);
            hideModal(registerModal);
        });
    });
    
    // Switch between register and login links inside modals
    document.getElementById("link-goto-register").addEventListener("click", (e) => {
        e.preventDefault();
        hideModal(loginModal);
        showModal(registerModal);
    });
    
    document.getElementById("link-goto-login").addEventListener("click", (e) => {
        e.preventDefault();
        hideModal(registerModal);
        showModal(loginModal);
    });
    
    // Handle Registration Form Submit
    document.getElementById("form-register").addEventListener("submit", async (e) => {
        e.preventDefault();
        const username = document.getElementById("reg-username").value.trim();
        const email = document.getElementById("reg-email").value.trim();
        const password = document.getElementById("reg-password").value.trim();
        
        try {
            const res = await fetch("/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ UserName: username, Email: email, Password: password })
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || "Registration failed");
            }
            currentUser = await res.json();
            updateUIForAuth(true);
            hideModal(registerModal);
            alert("Account registered successfully! Logged in as " + currentUser.UserName);
        } catch (err) {
            alert(err.message);
        }
    });
    
    // Handle Login Form Submit
    document.getElementById("form-login").addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("login-email").value.trim();
        const password = document.getElementById("login-password").value.trim();
        
        try {
            const res = await fetch("/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ Email: email, Password: password })
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || "Login failed");
            }
            const data = await res.json();
            currentUser = { UserID: data.user_id, UserName: data.username, Email: email };
            updateUIForAuth(true);
            hideModal(loginModal);
        } catch (err) {
            alert(err.message);
        }
    });
    
    // Handle Logout Event
    btnLogoutNav.addEventListener("click", async () => {
        try {
            await fetch("/auth/logout", { method: "POST" });
            currentUser = null;
            updateUIForAuth(false);
            window.location.reload();
        } catch (err) {
            console.error("Logout failed", err);
        }
    });
}

// Formats YYYY-MM-DD HH:MM:SS string to a clean relative or compact time string
function formatHistoryDate(dateStr) {
    try {
        if (!dateStr) return "";
        const parts = dateStr.split(" ");
        if (parts.length < 2) return dateStr;
        
        const datePart = parts[0]; // YYYY-MM-DD
        const timePart = parts[1]; // HH:MM:SS
        
        const dateParts = datePart.split("-");
        const timeParts = timePart.split(":");
        
        // Parse into a Date object as UTC
        const dateObj = new Date(Date.UTC(
            parseInt(dateParts[0]),
            parseInt(dateParts[1]) - 1,
            parseInt(dateParts[2]),
            parseInt(timeParts[0]),
            parseInt(timeParts[1]),
            parseInt(timeParts[2])
        ));
        
        const now = new Date();
        const diffMs = now - dateObj;
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        
        const diffHours = Math.floor(diffMins / 60);
        const isToday = dateObj.getFullYear() === now.getFullYear() && 
                        dateObj.getMonth() === now.getMonth() && 
                        dateObj.getDate() === now.getDate();
                        
        if (diffHours < 24 && isToday) {
            return `Today, ${dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        }
        
        return dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ", " + 
               dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
        console.error("Error formatting date", e);
        return dateStr;
    }
}

// Fetch and render past queries and responses for the current user
async function fetchAndRenderHistory() {
    if (!currentUser) {
        historyList.innerHTML = '<div class="output-placeholder" style="font-size: 0.85rem; padding: 1rem 0; font-style: italic; text-align: center; color: var(--text-muted);">Sign in to view your learning history.</div>';
        return;
    }
    
    try {
        const response = await fetch("/auth/history");
        if (!response.ok) return;
        
        const historyData = await response.json();
        if (historyData.length === 0) {
            historyList.innerHTML = '<div class="output-placeholder" style="font-size: 0.85rem; padding: 1rem 0; font-style: italic; text-align: center; color: var(--text-muted);">No queries recorded yet.</div>';
            return;
        }
        
        historyList.innerHTML = "";
        
        historyData.forEach(item => {
            const itemCard = document.createElement("div");
            itemCard.className = `history-item ${item.QueryType}`;
            
            const iconSpan = document.createElement("div");
            iconSpan.className = "history-icon-wrapper";
            
            let emoji = "💬";
            let typeLabel = "Q&A";
            if (item.QueryType === "explain") { emoji = "💡"; typeLabel = "Explanation"; }
            else if (item.QueryType === "quiz") { emoji = "📝"; typeLabel = "Quiz"; }
            else if (item.QueryType === "summarize") { emoji = "📄"; typeLabel = "Summary"; }
            else if (item.QueryType === "learn") { emoji = "🚀"; typeLabel = "Roadmap"; }
            
            iconSpan.textContent = emoji;
            itemCard.appendChild(iconSpan);
            
            const infoDiv = document.createElement("div");
            infoDiv.className = "history-item-info";
            
            const promptTitle = document.createElement("span");
            promptTitle.className = "history-item-title";
            promptTitle.textContent = item.QueryText;
            promptTitle.title = item.QueryText; // Show full text on tooltip hover
            
            const dateSpan = document.createElement("span");
            dateSpan.className = "history-item-meta";
            dateSpan.textContent = `${typeLabel} • ${formatHistoryDate(item.CreatedAt)}`;
            
            infoDiv.appendChild(promptTitle);
            infoDiv.appendChild(dateSpan);
            itemCard.appendChild(infoDiv);
            
            itemCard.addEventListener("click", () => {
                // Remove active class from all history items, add to this one
                document.querySelectorAll(".history-item").forEach(el => el.classList.remove("active"));
                itemCard.classList.add("active");

                // Click corresponding left task panel card
                const taskCardToActivate = document.querySelector(`.task-card[data-task="${item.QueryType}"]`);
                if (taskCardToActivate) {
                    taskCardToActivate.click();
                }
                
                inputField.value = item.QueryText;
                modelBadge.textContent = item.ModelUsed;
                outputBox.innerHTML = "";
                
                if (item.QueryType === "qa" || item.QueryType === "explain" || item.QueryType === "summarize") {
                    outputBox.innerHTML = `<div class="rendered-markdown">${formatMarkdown(item.ResponseText)}</div>`;
                } else if (item.QueryType === "quiz") {
                    try {
                        const parsedQuiz = JSON.parse(item.ResponseText);
                        renderQuiz(parsedQuiz);
                    } catch (e) {
                        outputBox.innerHTML = `<div class="rendered-markdown">${formatMarkdown(item.ResponseText)}</div>`;
                    }
                } else if (item.QueryType === "learn") {
                    try {
                        const parsedRoadmap = JSON.parse(item.ResponseText);
                        const formattedRoadmap = {
                            topic: item.QueryText,
                            roadmap: parsedRoadmap
                        };
                        renderLearningPath(formattedRoadmap);
                    } catch (e) {
                        outputBox.innerHTML = `<div class="rendered-markdown">${formatMarkdown(item.ResponseText)}</div>`;
                    }
                }
            });
            
            historyList.appendChild(itemCard);
        });
    } catch (e) {
        console.error("Failed to load history", e);
    }
}
