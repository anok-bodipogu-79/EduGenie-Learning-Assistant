// ============================================================
// EDUGENIE — Frontend Application Logic
// All API communication, rendering, auth, and state managed here.
// ============================================================

// Global State
let activeTask = "qa";
let activeEndpoint = "/qa";
let currentUser = null;

// DOM Elements
const navItems       = document.querySelectorAll(".nav-item");
const inputLabel     = document.getElementById("input-label");
const inputField     = document.getElementById("query-input");
const btnSubmit      = document.getElementById("btn-submit");
const loadingWrapper = document.getElementById("loading-wrapper");
const outputBox      = document.getElementById("output-box");
const modelBadge     = document.getElementById("model-badge");
const historyList    = document.getElementById("history-list");
const currentToolIcon= document.getElementById("current-tool-icon");

// Suggestion Chips
const suggestionChips = document.querySelectorAll(".suggestion-chip");

// History / Sidebar Elements
const historyPanel    = document.getElementById("history-panel");
const btnHistoryToggle= document.getElementById("btn-history-toggle"); // unused in new shell
const btnHistoryNav   = document.getElementById("btn-history-nav");
const btnHistoryClose = document.getElementById("btn-history-close");
const historyOverlay  = document.getElementById("app-sidebar-overlay");

const appSidebar      = document.getElementById("app-sidebar");
const btnSidebarToggle= document.getElementById("btn-sidebar-toggle");
const btnSidebarClose = document.getElementById("btn-sidebar-close");

// Auth & Header Elements
const userNameHeader   = document.getElementById("user-name-header");
const userAvatar       = document.getElementById("user-avatar");
const userProfileArea  = document.getElementById("user-profile-area");
const userDropdown     = document.getElementById("user-dropdown");
const dynamicGreeting  = document.getElementById("dynamic-greeting");
const btnLoginHeader   = document.getElementById("btn-login-header");
const btnLogoutDropdown= document.getElementById("btn-logout-dropdown");
const btnLoginNav      = document.getElementById("btn-login-nav");
const btnLogoutSidebar = document.getElementById("btn-logout-sidebar");
const loginModal       = document.getElementById("login-modal");
const registerModal    = document.getElementById("register-modal");

// Views
const viewDashboard    = document.getElementById("view-dashboard");
const viewHistory      = document.getElementById("view-history");
const viewPerformance  = document.getElementById("view-performance");
const viewProfile      = document.getElementById("view-profile");
const viewSettings     = document.getElementById("view-settings");
const appHero          = document.getElementById("app-hero");
const aiComposer       = document.getElementById("ai-composer");
const aiResponse       = document.getElementById("ai-response");

// Task configuration — all features use Gemini
const taskConfigs = {
    qa: { label: "Ask AI", placeholder: "Type your learning question...", endpoint: "/qa", model: "Gemini", icon: "message-square", btnText: "Ask EduGenie", desc: "Get clear answers and guidance for your learning questions.", emptyText: "Ask a question to start learning with EduGenie." },
    explain: { label: "Explain Concept", placeholder: "Enter a concept or topic...", endpoint: "/explain", model: "Gemini", icon: "lightbulb", btnText: "Explain Topic", desc: "Break down complex topics into clear, understandable explanations.", emptyText: "Enter a concept and EduGenie will break it down clearly." },
    quiz: { label: "Quiz Generator", placeholder: "Enter a topic to generate a quiz...", endpoint: "/quiz", model: "Gemini", icon: "list-checks", btnText: "Generate Quiz", desc: "Create practice questions to test your understanding.", emptyText: "Choose a topic to generate practice questions." },
    summarize: { label: "Summarize Notes", placeholder: "Paste your notes or content here...", endpoint: "/summarize", model: "Gemini", icon: "file-text", btnText: "Summarize", desc: "Turn lengthy content into concise, useful summaries.", emptyText: "Paste your notes or content to create a concise summary." },
    learn: { label: "Learning Paths", placeholder: "Enter a skill or topic to learn...", endpoint: "/learn/recommendations", model: "Gemini", icon: "route", btnText: "Build Roadmap", desc: "Generate structured roadmaps for learning new skills and topics.", emptyText: "Enter a skill or topic to generate your learning roadmap." }
};

// ============================================================
// TOAST NOTIFICATION SYSTEM
// ============================================================
function showToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    if (!container) return;
    
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    let iconName = type === "success" ? "check-circle" : (type === "error" ? "alert-circle" : "info");
    toast.innerHTML = `<i data-lucide="${iconName}"></i> <span>${message}</span>`;
    container.appendChild(toast);
    if (window.lucide) lucide.createIcons({ root: toast });
    
    setTimeout(() => {
        toast.classList.add("fade-out");
        toast.addEventListener("transitionend", () => toast.remove());
    }, 4000);
}

// ============================================================
// MARKDOWN RENDERING
// ============================================================
function safeRenderMarkdown(text) {
    if (!text) return "";
    const rawHtml = marked.parse(String(text));
    return DOMPurify.sanitize(rawHtml, {
        ALLOWED_TAGS: [ "p", "br", "strong", "em", "b", "i", "u", "s", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "blockquote", "pre", "code", "table", "thead", "tbody", "tr", "th", "td", "hr", "a", "img", "span", "div" ],
        ALLOWED_ATTR: ["href", "src", "alt", "title", "class", "target", "rel"]
    });
}

function getHistoryIcon(queryType) {
    const icons = { qa: "message-square", explain: "lightbulb", quiz: "list-checks", summarize: "file-text", learn: "route" };
    return icons[queryType] || icons.qa;
}

// ============================================================
// INITIALIZATION
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
    checkCurrentUser();
    setupTaskSelectors();
    setupAuthModals();
    setupHistoryDrawer();
    setupSuggestions();
    setupHeader();
});

// ============================================================
// HEADER & SIDEBAR (Mobile) LOGIC
// ============================================================
function setupHeader() {
    if (userProfileArea) {
        userProfileArea.addEventListener("click", (e) => {
            const isExpanded = userProfileArea.getAttribute("aria-expanded") === "true";
            userProfileArea.setAttribute("aria-expanded", !isExpanded);
        });

        document.addEventListener("click", (e) => {
            if (!userProfileArea.contains(e.target)) {
                userProfileArea.setAttribute("aria-expanded", "false");
            }
        });
        
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") userProfileArea.setAttribute("aria-expanded", "false");
        });
    }

    if (btnSidebarToggle && appSidebar && historyOverlay) {
        btnSidebarToggle.addEventListener("click", () => {
            appSidebar.style.transform = "translateX(0)";
            historyOverlay.style.display = "flex";
        });

        const closeSidebar = () => {
            if (window.innerWidth <= 768) {
                appSidebar.style.transform = "translateX(-100%)";
                historyOverlay.style.display = "none";
            }
        };

        if (btnSidebarClose) btnSidebarClose.addEventListener("click", closeSidebar);
        historyOverlay.addEventListener("click", closeSidebar);
        
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                appSidebar.style.transform = "";
                historyOverlay.style.display = "none";
            }
        });
    }
}

function updateGreeting(name) {
    if (!dynamicGreeting) return;
    const hour = new Date().getHours();
    let greeting = "Good Morning";
    if (hour >= 12 && hour < 17) greeting = "Good Afternoon";
    else if (hour >= 17 && hour < 22) greeting = "Good Evening";
    else if (hour >= 22 || hour < 5) greeting = "Welcome Back";

    dynamicGreeting.innerHTML = `${greeting}, ${name} 👋`;
}

// ============================================================
// HISTORY DRAWER (Right Panel toggle if needed on mobile)
// ============================================================
function setupHistoryDrawer() {
    if (btnHistoryNav) {
        btnHistoryNav.addEventListener("click", () => {
            // In Phase 4, History is in the right panel. For mobile, we might just show it.
            // Keeping safe fallback
        });
    }
}

// ============================================================
// SUGGESTION CHIPS
// ============================================================
function setupSuggestions() {
    suggestionChips.forEach(chip => {
        chip.addEventListener("click", () => { inputField.value = chip.textContent; inputField.focus(); });
    });
}

// ============================================================
// TASK SELECTOR / VIEW SWITCHING
// ============================================================
function switchView(task) {
    const views = [viewDashboard, viewPerformance, viewProfile, viewSettings, viewHistory, appHero, aiComposer, aiResponse];
    views.forEach(v => { if (v) v.style.display = 'none'; });

    const dashboardRightPanel = document.getElementById("dashboard-right-panel");
    if (dashboardRightPanel) dashboardRightPanel.style.display = 'none';

    if (task === 'dashboard') {
        if(viewDashboard) viewDashboard.style.display = 'block';
        if(dashboardRightPanel) dashboardRightPanel.style.display = 'block';
    } else if (task === 'performance') {
        if(viewPerformance) viewPerformance.style.display = 'block';
    } else if (task === 'profile') {
        if(viewProfile) viewProfile.style.display = 'block';
    } else if (task === 'settings') {
        if(viewSettings) viewSettings.style.display = 'block';
    } else if (task === 'history') {
        if(viewHistory) viewHistory.style.display = 'block';
        loadPaginatedHistory(); // Trigger history fetch
    } else {
        if(appHero) appHero.style.display = 'block';
        if(aiComposer) aiComposer.style.display = 'block';
        if(aiResponse) aiResponse.style.display = 'block';
    }
}

function setupTaskSelectors() {
    navItems.forEach(item => {
        item.addEventListener("click", () => {
            navItems.forEach(n => n.classList.remove("active"));
            
            const task = item.dataset.task;
            document.querySelectorAll(`.nav-item[data-task="${task}"]`).forEach(n => n.classList.add("active"));
            document.querySelectorAll(`.dropdown-item[data-task="${task}"]`).forEach(n => n.classList.add("active"));
            
            activeTask = task;
            switchView(task);

            if (taskConfigs[activeTask]) {
                const config = taskConfigs[activeTask];
                activeEndpoint = config.endpoint;
                if(inputLabel) inputLabel.textContent = config.label;
                if(inputField) inputField.placeholder = config.placeholder;
                if(modelBadge) modelBadge.innerHTML = `<i data-lucide="sparkles" class="badge-icon"></i> ${config.model}`;
                
                const featureDesc = document.getElementById("feature-description");
                if (featureDesc) featureDesc.textContent = config.desc;

                if (currentToolIcon) {
                    currentToolIcon.setAttribute("data-lucide", config.icon);
                    if (window.lucide) lucide.createIcons({ root: currentToolIcon.parentNode });
                }
                
                if(btnSubmit) {
                    btnSubmit.innerHTML = `<i data-lucide="sparkles"></i> ${config.btnText}`;
                    if (window.lucide) lucide.createIcons({ root: btnSubmit });
                }
                if (window.lucide) lucide.createIcons({ root: modelBadge });

                if(inputField) inputField.value = "";
                
                const responseActions = document.getElementById("response-actions");
                if (responseActions) responseActions.style.display = "none";

                if(outputBox) {
                    outputBox.innerHTML = `<div class="empty-state"><div class="empty-icon-wrapper"><i data-lucide="sparkles" class="empty-icon"></i></div><p id="response-empty-text">${config.emptyText}</p></div>`;
                    if (window.lucide) lucide.createIcons({ root: outputBox });
                }
            }
            
            // Close sidebar on mobile after selection
            if (window.innerWidth <= 768 && appSidebar) {
                appSidebar.style.transform = "translateX(-100%)";
                if(historyOverlay) historyOverlay.style.display = "none";
            }
            
            // Close dropdown if selected from dropdown
            if (userProfileArea) userProfileArea.setAttribute("aria-expanded", "false");
        });
    });
    
    // Also attach to dropdown items
    document.querySelectorAll('.dropdown-item[data-task]').forEach(item => {
        item.addEventListener("click", () => {
            const task = item.dataset.task;
            const sidebarNav = document.querySelector(`.nav-item[data-task="${task}"]`);
            if (sidebarNav) sidebarNav.click();
        });
    });
}

// ============================================================
// AUTHENTICATION CHECK
// ============================================================
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
        console.error("Auth verification failed:", error);
        updateUIForAuth(false);
    }
}

// ============================================================
// UI AUTH STATE UPDATE
// ============================================================
function updateUIForAuth(isLoggedIn) {
    if (isLoggedIn && currentUser) {
        const userName = currentUser.UserName || "User";
        if (userNameHeader) userNameHeader.textContent = userName;
        if (userAvatar) userAvatar.textContent = userName.charAt(0).toUpperCase();
        updateGreeting(userName);

        if (userProfileArea) userProfileArea.style.display = "flex";
        if (btnLoginHeader) btnLoginHeader.style.display = "none";
        if (btnLoginNav) btnLoginNav.style.display = "none";
        if (btnLogoutSidebar) btnLogoutSidebar.style.display = "flex";

        if(btnSubmit && activeTask in taskConfigs) {
            btnSubmit.innerHTML = `<i data-lucide="sparkles"></i> ${taskConfigs[activeTask].btnText}`;
            if (window.lucide) lucide.createIcons({ root: btnSubmit });
        }

        fetchAndRenderHistory();
    } else {
        updateGreeting("Guest");
        
        if (userProfileArea) userProfileArea.style.display = "none";
        if (btnLoginHeader) btnLoginHeader.style.display = "block";
        if (btnLoginNav) btnLoginNav.style.display = "flex";
        if (btnLogoutSidebar) btnLogoutSidebar.style.display = "none";

        if(btnSubmit) {
            btnSubmit.innerHTML = `<i data-lucide="sparkles"></i> Sign In to Ask`;
            if (window.lucide) lucide.createIcons({ root: btnSubmit });
        }

        if(historyList) {
            historyList.innerHTML = '<div class="empty-state">Sign in to view history.</div>';
        }
    }
}

// ============================================================
// SUBMIT HANDLER
// ============================================================
btnSubmit.addEventListener("click", async () => {
    if (!currentUser) {
        loginModal.style.display = "flex";
        loginModal.setAttribute("aria-hidden", "false");
        return;
    }

    const textValue = inputField.value.trim();
    if (!textValue) {
        showToast("Please enter a question or topic.", "error");
        return;
    }

    let payload = {};
    if (activeTask === "qa")         payload = { question: textValue };
    else if (activeTask === "explain")    payload = { topic: textValue };
    else if (activeTask === "quiz")       payload = { topic: textValue };
    else if (activeTask === "summarize")  payload = { text: textValue };
    else if (activeTask === "learn")      payload = { topic: textValue };

    // Update loading text contextually
    const loadingText = document.getElementById("loading-text");
    if (loadingText) {
        if (activeTask === "explain") loadingText.textContent = "Explaining...";
        else if (activeTask === "quiz") loadingText.textContent = "Creating your quiz...";
        else if (activeTask === "summarize") loadingText.textContent = "Summarizing...";
        else if (activeTask === "learn") loadingText.textContent = "Building your roadmap...";
        else loadingText.textContent = "Thinking...";
    }

    // Hide actions while loading
    const responseActions = document.getElementById("response-actions");
    if (responseActions) responseActions.style.display = "none";

    loadingWrapper.style.display = "flex";
    outputBox.style.display      = "none";
    btnSubmit.disabled           = true;

    try {
        const response = await fetch(activeEndpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorDetails = await response.json();
            throw new Error(errorDetails.detail || "Something went wrong.");
        }

        const data = await response.json();
        
        // Cache current successful request for regeneration
        window._lastAiPayload = payload;
        window._lastAiTask = activeTask;
        window._lastAiEndpoint = activeEndpoint;
        
        renderResult(data);
        if (responseActions) responseActions.style.display = "flex";
        
        fetchAndRenderHistory();
        
        // Refresh Dashboard if it's rendered and caching
        if (typeof fetchDashboardAnalytics === "function") fetchDashboardAnalytics();

    } catch (error) {
        console.error("API call failed:", error);
        showToast("Unable to generate a response. Please try again.", "error");
        outputBox.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon-wrapper" style="background: rgba(244, 63, 94, 0.1); color: var(--accent-danger);">
                    <i data-lucide="alert-circle"></i>
                </div>
                <p>Unable to generate a response. Please try again.</p>
                <button class="btn btn-secondary btn-sm" style="margin-top: 1rem;" onclick="document.getElementById('btn-submit').click()">Retry</button>
            </div>`;
        if (window.lucide) lucide.createIcons({ root: outputBox });
    } finally {
        loadingWrapper.style.display = "none";
        outputBox.style.display      = "block";
        btnSubmit.disabled           = false;
    }
});

// ============================================================
// RENDER RESULT
// ============================================================
function renderResult(data) {
    outputBox.innerHTML = "";

    if (activeTask === "qa") {
        outputBox.innerHTML = `<div class="rendered-markdown response-card">${safeRenderMarkdown(data.answer)}</div>`;
    } else if (activeTask === "explain") {
        outputBox.innerHTML = `<div class="rendered-markdown response-card">${safeRenderMarkdown(data.explanation)}</div>`;
    } else if (activeTask === "summarize") {
        outputBox.innerHTML = `<div class="rendered-markdown response-card">${safeRenderMarkdown(data.summary)}</div>`;
    } else if (activeTask === "quiz") {
        renderQuiz(data);
    } else if (activeTask === "learn") {
        renderLearningPath(data);
    }
}

// ============================================================
// RESPONSE ACTIONS (Copy & Regenerate)
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
    const btnCopy = document.getElementById("btn-copy-response");
    const btnRegen = document.getElementById("btn-regenerate-response");
    
    if (btnCopy) {
        btnCopy.addEventListener("click", async () => {
            const outputText = outputBox.innerText;
            if (!outputText) return;
            try {
                await navigator.clipboard.writeText(outputText);
                btnCopy.innerHTML = `<i data-lucide="check"></i> Copied`;
                if (window.lucide) lucide.createIcons({ root: btnCopy });
                showToast("Response copied to clipboard", "success");
                
                setTimeout(() => {
                    btnCopy.innerHTML = `<i data-lucide="copy"></i> Copy`;
                    if (window.lucide) lucide.createIcons({ root: btnCopy });
                }, 2000);
            } catch (err) {
                showToast("Failed to copy text", "error");
            }
        });
    }

    if (btnRegen) {
        btnRegen.addEventListener("click", () => {
            if (window._lastAiTask === activeTask && window._lastAiPayload) {
                // To regenerate, just click submit again (it takes from text area)
                // Wait, if they changed the textarea, it would generate based on the new text.
                // The prompt says "Existing Request Data -> Regenerate -> Existing API Endpoint".
                // We'll just trigger btn-submit.
                if (btnSubmit) btnSubmit.click();
            }
        });
    }
});

// ============================================================
// QUIZ RENDERER
// ============================================================
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
            optBtn.setAttribute("type", "button");

            optBtn.addEventListener("click", () => {
                const siblings = optsList.querySelectorAll(".quiz-option");
                siblings.forEach(btn => btn.disabled = true);

                if (opt === q.correct_answer) {
                    optBtn.classList.add("correct");
                } else {
                    optBtn.classList.add("incorrect");
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

// ============================================================
// LEARNING ROADMAP RENDERER
// ============================================================
function renderLearningPath(data) {
    const timeline = document.createElement("div");
    timeline.className = "timeline";

    data.roadmap.forEach((step, stepIdx) => {
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

// ============================================================
// AUTH MODALS SETUP
// ============================================================
function setupAuthModals() {
    const showModal = (modal) => {
        modal.style.display = "flex";
        // small delay for transition
        setTimeout(() => modal.setAttribute("aria-hidden", "false"), 10);
        const firstInput = modal.querySelector("input");
        if (firstInput) setTimeout(() => firstInput.focus(), 100);
    };

    const hideModal = (modal) => {
        modal.setAttribute("aria-hidden", "true");
        setTimeout(() => modal.style.display = "none", 250);
    };

    const hideAllModals = () => {
        hideModal(loginModal);
        hideModal(registerModal);
    };

    if (btnLoginNav) btnLoginNav.addEventListener("click", () => showModal(loginModal));
    if (btnLoginHeader) btnLoginHeader.addEventListener("click", () => showModal(loginModal));

    document.querySelectorAll(".modal-close").forEach(btn => {
        btn.addEventListener("click", hideAllModals);
    });

    [loginModal, registerModal].forEach(modal => {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) hideAllModals();
        });
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") hideAllModals();
    });

    document.getElementById("link-goto-register").addEventListener("click", (e) => {
        e.preventDefault();
        hideModal(loginModal);
        setTimeout(() => showModal(registerModal), 250);
    });

    document.getElementById("link-goto-login").addEventListener("click", (e) => {
        e.preventDefault();
        hideModal(registerModal);
        setTimeout(() => showModal(loginModal), 250);
    });

    // Password Visibility Toggles
    document.querySelectorAll(".password-toggle").forEach(btn => {
        btn.addEventListener("click", () => {
            const input = btn.previousElementSibling;
            if (input && input.tagName === 'INPUT') {
                if (input.type === "password") {
                    input.type = "text";
                    btn.innerHTML = `<i data-lucide="eye-off"></i>`;
                } else {
                    input.type = "password";
                    btn.innerHTML = `<i data-lucide="eye"></i>`;
                }
                if (window.lucide) lucide.createIcons({ root: btn });
            }
        });
    });

    // Helper for loading state
    const setAuthLoading = (btnId, isLoading) => {
        const btn = document.getElementById(btnId);
        if (!btn) return;
        const textSpan = btn.querySelector('.btn-text');
        const loadingDiv = btn.querySelector('.auth-loading');
        
        if (isLoading) {
            btn.disabled = true;
            if (textSpan) textSpan.style.opacity = '0';
            if (loadingDiv) loadingDiv.style.display = 'flex';
        } else {
            btn.disabled = false;
            if (textSpan) textSpan.style.opacity = '1';
            if (loadingDiv) loadingDiv.style.display = 'none';
        }
    };

    // Form Submission
    document.getElementById("form-register").addEventListener("submit", async (e) => {
        e.preventDefault();
        const username = document.getElementById("reg-username").value.trim();
        const email    = document.getElementById("reg-email").value.trim();
        const password = document.getElementById("reg-password").value.trim();

        setAuthLoading("btn-register-submit", true);
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
            showToast("Account created successfully!", "success");
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            setAuthLoading("btn-register-submit", false);
        }
    });

    document.getElementById("form-login").addEventListener("submit", async (e) => {
        e.preventDefault();
        const email    = document.getElementById("login-email").value.trim();
        const password = document.getElementById("login-password").value.trim();

        setAuthLoading("btn-login-submit", true);
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
            showToast("Welcome back!", "success");
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            setAuthLoading("btn-login-submit", false);
        }
    });

    const handleLogout = async () => {
        try {
            await fetch("/auth/logout", { method: "POST" });
            currentUser = null;
            updateUIForAuth(false);
            showToast("Logged out successfully.", "info");
            setTimeout(() => window.location.reload(), 1000);
        } catch (err) {
            console.error("Logout failed:", err);
            showToast("Logout failed.", "error");
        }
    };

    if (btnLogoutNav) btnLogoutNav.addEventListener("click", handleLogout);
    if (btnLogoutSidebar) btnLogoutSidebar.addEventListener("click", handleLogout);
    if (btnLogoutDropdown) btnLogoutDropdown.addEventListener("click", handleLogout);
}

// ============================================================
// DATE FORMATTING
// ============================================================
function formatHistoryDate(dateStr) {
    try {
        if (!dateStr) return "";
        const parts = dateStr.split(" ");
        if (parts.length < 2) return dateStr;

        const dateParts = parts[0].split("-");
        const timeParts = parts[1].split(":");

        const dateObj = new Date(Date.UTC(
            parseInt(dateParts[0]),
            parseInt(dateParts[1]) - 1,
            parseInt(dateParts[2]),
            parseInt(timeParts[0]),
            parseInt(timeParts[1]),
            parseInt(timeParts[2])
        ));

        const now      = new Date();
        const diffMs   = now - dateObj;
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1)  return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;

        const diffHours = Math.floor(diffMins / 60);
        const isToday   = dateObj.getFullYear() === now.getFullYear() &&
                          dateObj.getMonth()     === now.getMonth()    &&
                          dateObj.getDate()      === now.getDate();

        if (diffHours < 24 && isToday) {
            return `Today, ${dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
        }

        return dateObj.toLocaleDateString([], { month: "short", day: "numeric" }) + ", " +
               dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch (e) {
        return dateStr;
    }
}

// ============================================================
// HISTORY FETCH AND RENDER
// ============================================================
async function fetchAndRenderHistory() {
    if (!currentUser) {
        historyList.innerHTML = '<div class="empty-state">Sign in to view history.</div>';
        return;
    }

    try {
        const response = await fetch("/auth/history");
        if (!response.ok) return;

        const historyData = await response.json();

        const dashboardRecentList = document.getElementById("dashboard-recent-activity-list");

        if (historyData.length === 0) {
            historyList.innerHTML = '<div class="empty-state">No queries recorded yet.</div>';
            if (dashboardRecentList) {
                dashboardRecentList.innerHTML = `
                    <div class="empty-state-small" id="dashboard-recent-empty">
                        <p style="color: var(--text-muted); font-size: 0.9rem;">No recent learning activity yet.<br>Start asking questions or generating quizzes to build your learning history.</p>
                    </div>`;
            }
            return;
        }

        historyList.innerHTML = "";
        if (dashboardRecentList) dashboardRecentList.innerHTML = "";

        historyData.forEach((item, index) => {
            const itemCard = document.createElement("div");
            itemCard.className = `history-item ${item.QueryType}`;
            
            const iconSpan = document.createElement("div");
            iconSpan.className = "history-icon-wrapper";
            iconSpan.innerHTML = `<i data-lucide="${getHistoryIcon(item.QueryType)}"></i>`;
            itemCard.appendChild(iconSpan);

            const infoDiv = document.createElement("div");
            infoDiv.className = "history-item-info";

            let typeLabel = "Q&A";
            if (item.QueryType === "explain")   typeLabel = "Explain";
            else if (item.QueryType === "quiz")       typeLabel = "Quiz";
            else if (item.QueryType === "summarize")  typeLabel = "Summary";
            else if (item.QueryType === "learn")      typeLabel = "Roadmap";

            const promptTitle = document.createElement("span");
            promptTitle.className   = "history-item-title";
            promptTitle.textContent = item.QueryText;

            const dateSpan = document.createElement("span");
            dateSpan.className   = "history-item-meta";
            dateSpan.textContent = `${typeLabel} • ${formatHistoryDate(item.CreatedAt)}`;

            infoDiv.appendChild(promptTitle);
            infoDiv.appendChild(dateSpan);
            itemCard.appendChild(infoDiv);

            const activateItem = () => {
                document.querySelectorAll(".history-item").forEach(el => el.classList.remove("active"));
                itemCard.classList.add("active");

                const taskNavToActivate = document.querySelector(`.nav-item[data-task="${item.QueryType}"]`);
                if (taskNavToActivate) taskNavToActivate.click();

                inputField.value       = item.QueryText;
                
                outputBox.innerHTML    = "";

                if (["qa", "explain", "summarize"].includes(item.QueryType)) {
                    outputBox.innerHTML = `<div class="rendered-markdown">${safeRenderMarkdown(item.ResponseText)}</div>`;
                } else if (item.QueryType === "quiz") {
                    try {
                        renderQuiz(JSON.parse(item.ResponseText));
                    } catch (e) {
                        outputBox.innerHTML = `<div class="rendered-markdown">${safeRenderMarkdown(item.ResponseText)}</div>`;
                    }
                } else if (item.QueryType === "learn") {
                    try {
                        const parsedRoadmap = JSON.parse(item.ResponseText);
                        renderLearningPath({ topic: item.QueryText, roadmap: parsedRoadmap });
                    } catch (e) {
                        outputBox.innerHTML = `<div class="rendered-markdown">${safeRenderMarkdown(item.ResponseText)}</div>`;
                    }
                }
                
                // close drawer on mobile if open
                if (historyPanel.classList.contains("open")) {
                    historyPanel.classList.remove("open");
                    historyOverlay.style.display = "none";
                }
            };

            itemCard.addEventListener("click", activateItem);
            historyList.appendChild(itemCard);

            // Dashboard integration
            if (dashboardRecentList && index < 3) {
                const dashItem = document.createElement("div");
                dashItem.className = "activity-item";
                dashItem.style.cursor = "pointer";
                
                dashItem.innerHTML = `
                    <div class="icon-wrapper icon-wrapper-sm icon-primary">
                        <i data-lucide="${getHistoryIcon(item.QueryType)}"></i>
                    </div>
                    <div class="activity-content">
                        <div class="activity-title">${item.QueryText}</div>
                        <div class="activity-desc">${typeLabel}</div>
                    </div>
                    <div class="activity-time">${formatHistoryDate(item.CreatedAt)}</div>
                `;
                dashItem.addEventListener("click", () => {
                    const taskNavToActivate = document.querySelector('.nav-item[data-task="history"]');
                    if (taskNavToActivate) taskNavToActivate.click();
                    setTimeout(activateItem, 100);
                });
                dashboardRecentList.appendChild(dashItem);
            }
        });
        
        if (window.lucide) {
            lucide.createIcons({ root: historyList });
            if (dashboardRecentList) lucide.createIcons({ root: dashboardRecentList });
        }
        
    } catch (e) {
        console.error("Failed to load history:", e);
    }
}

// ============================================================
// DASHBOARD LOGIC
// ============================================================
function setupDashboard() {
    // 1. Hook up Hero Ask EduGenie button
    const btnAsk = document.getElementById("btn-dashboard-ask");
    const inputAsk = document.getElementById("dashboard-hero-input");
    
    if (btnAsk && inputAsk) {
        btnAsk.addEventListener("click", () => {
            const query = inputAsk.value.trim();
            if (!query) {
                showToast("Please enter a question or topic first.", "warning");
                return;
            }
            // Switch to Ask AI view
            const askAiNav = document.querySelector('.nav-item[data-task="chat"]');
            if (askAiNav) askAiNav.click();
            
            // Populate and submit existing form
            if (inputField) {
                inputField.value = query;
                if (btnSubmit) btnSubmit.click();
                inputAsk.value = ""; // Clear dashboard input
            }
        });

        inputAsk.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                btnAsk.click();
            }
        });
    }

    // 2. Setup Study Calendar (Visual setup, data injected later)
    setupStudyCalendar();

    // 3. Fetch Analytics
    fetchDashboardAnalytics();
}

let dashboardDataCache = null;

async function fetchDashboardAnalytics() {
    if (!currentUser) return;

    try {
        const response = await fetch("/dashboard/analytics");
        if (!response.ok) throw new Error("Failed to load dashboard analytics");
        
        const data = await response.json();
        dashboardDataCache = data;

        renderDashboardAnalytics(data);
    } catch (e) {
        console.error(e);
        // Fallback or leave as empty state
    }
}

function renderDashboardAnalytics(data) {
    // 1. Statistics
    const elQuestions = document.getElementById("dashboard-questions-count");
    const elQuizzes = document.getElementById("dashboard-quizzes-count");
    const elConcepts = document.getElementById("dashboard-concepts-count");
    
    if (elQuestions) elQuestions.textContent = data.statistics.questions !== null ? data.statistics.questions : "—";
    if (elQuizzes) elQuizzes.textContent = data.statistics.quizzes !== null ? data.statistics.quizzes : "—";
    if (elConcepts) elConcepts.textContent = data.statistics.concepts !== null ? data.statistics.concepts : "—";
    
    // 2. Recent Activity - Reusing the history logic that is already connected to real data via fetchAndRenderHistory()
    // Or we could map data.recent_activity here, but fetchAndRenderHistory does it too.
    // For now we rely on fetchAndRenderHistory to populate the list safely with correct icons and click handlers.

    // 3. Continue Learning
    const elContinueTitle = document.getElementById("dashboard-continue-title");
    const elContinueDesc = document.getElementById("dashboard-continue-desc");
    if (data.continue_learning && elContinueTitle && elContinueDesc) {
        elContinueTitle.textContent = data.continue_learning.title;
        elContinueDesc.textContent = data.continue_learning.description;
    }

    // 4. Learning Streak
    const elStreakCount = document.getElementById("dashboard-current-streak");
    if (elStreakCount && data.learning_streak) {
        elStreakCount.textContent = data.learning_streak.current_streak;
        
        const streakDaysContainer = document.getElementById("dashboard-streak-days");
        if (streakDaysContainer) {
            streakDaysContainer.innerHTML = "";
            const daysOfWeek = ["M", "T", "W", "T", "F", "S", "S"];
            data.learning_streak.weekly_activity.forEach((dayData, i) => {
                const dayEl = document.createElement("div");
                dayEl.className = `streak-day ${dayData.active ? 'active' : ''}`;
                dayEl.innerHTML = `
                    <div class="streak-dot"></div>
                    <span>${daysOfWeek[i]}</span>
                `;
                streakDaysContainer.appendChild(dayEl);
            });
        }
    }

    // 5. Calendar Markers (Re-render calendar to apply markers)
    if (data.calendar_activity) {
        setupStudyCalendar(data.calendar_activity);
    }

    // 6. Progress Ring Sub-metrics
    const elMetQs = document.getElementById("dashboard-metric-questions");
    const elMetQz = document.getElementById("dashboard-metric-quizzes");
    const elMetPath = document.getElementById("dashboard-metric-paths");
    
    if (elMetQs) elMetQs.textContent = data.statistics.questions !== null ? data.statistics.questions : "—";
    if (elMetQz) elMetQz.textContent = data.statistics.quizzes !== null ? data.statistics.quizzes : "—";
    
    // Assuming concepts represents explored paths/concepts for the 3rd metric
    if (elMetPath) elMetPath.textContent = data.statistics.concepts !== null ? data.statistics.concepts : "—";
}

function setupStudyCalendar(activeDates = []) {
    const calendarGrid = document.getElementById("dashboard-calendar-grid");
    const monthLabel = document.getElementById("calendar-month-label");
    const btnPrev = document.getElementById("btn-calendar-prev");
    const btnNext = document.getElementById("btn-calendar-next");
    
    if (!calendarGrid || !monthLabel) return;

    // Use closure variable to keep track of current view date, init to today
    if (!window._calendarCurrentDate) {
        window._calendarCurrentDate = new Date();
    }
    let currentDate = window._calendarCurrentDate;

    const renderCalendar = (date) => {
        calendarGrid.innerHTML = "";
        const year = date.getFullYear();
        const month = date.getMonth();
        
        // Update label
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        monthLabel.textContent = `${monthNames[month]} ${year}`;

        // Get first day of month and total days
        const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Pad start with empty days
        for (let i = 0; i < firstDay; i++) {
            const emptyDay = document.createElement("div");
            emptyDay.className = "calendar-day empty";
            calendarGrid.appendChild(emptyDay);
        }

        // Fill days
        const today = new Date();
        for (let i = 1; i <= daysInMonth; i++) {
            const dayDiv = document.createElement("div");
            dayDiv.className = "calendar-day";
            dayDiv.textContent = i;
            
            // Format current checking date to YYYY-MM-DD
            const m = (month + 1).toString().padStart(2, '0');
            const d = i.toString().padStart(2, '0');
            const dateString = `${year}-${m}-${d}`;

            if (year === today.getFullYear() && month === today.getMonth() && i === today.getDate()) {
                dayDiv.classList.add("today");
            }

            if (activeDates && activeDates.includes(dateString)) {
                // If it's an active learning day, add an active class for styling
                // We'll reuse 'today' styling or a new class
                dayDiv.classList.add("active-day");
                dayDiv.style.backgroundColor = "rgba(16, 185, 129, 0.2)";
                dayDiv.style.color = "var(--accent-success)";
                dayDiv.style.fontWeight = "600";
            }
            
            calendarGrid.appendChild(dayDiv);
        }
    };

    renderCalendar(currentDate);

    // Remove old event listeners to prevent duplicates
    const newPrev = btnPrev.cloneNode(true);
    const newNext = btnNext.cloneNode(true);
    btnPrev.parentNode.replaceChild(newPrev, btnPrev);
    btnNext.parentNode.replaceChild(newNext, btnNext);

    newPrev.addEventListener("click", () => {
        window._calendarCurrentDate.setMonth(window._calendarCurrentDate.getMonth() - 1);
        renderCalendar(window._calendarCurrentDate);
    });
    
    newNext.addEventListener("click", () => {
        window._calendarCurrentDate.setMonth(window._calendarCurrentDate.getMonth() + 1);
        renderCalendar(window._calendarCurrentDate);
    });
}

// Ensure setupDashboard is called when DOM loads
document.addEventListener("DOMContentLoaded", () => {
    // Other setups...
    setTimeout(setupDashboard, 500); // Wait for elements to be ready
});


// ============================================================
// PHASE 8 HISTORY WORKSPACE
// ============================================================
const historyState = {
    search: '',
    filter: 'all',
    sort: 'desc',
    page: 1,
    limit: 10
};

let currentHistoryItems = [];

async function loadPaginatedHistory() {
    const historyListView = document.getElementById('history-list');
    const loadingView = document.getElementById('history-loading');
    const paginationView = document.getElementById('history-pagination');
    const pageInfo = document.getElementById('history-page-info');
    
    if (!historyListView || !currentUser) return;
    
    historyListView.style.display = 'none';
    if(paginationView) paginationView.style.display = 'none';
    if(loadingView) loadingView.style.display = 'flex';
    
    try {
        const queryParams = new URLSearchParams({
            page: historyState.page,
            limit: historyState.limit,
            search: historyState.search,
            feature_type: historyState.filter,
            sort: historyState.sort
        });
        
        const response = await fetch("/auth/history/paginated?" + queryParams.toString());
        if (!response.ok) throw new Error("Failed to fetch paginated history");
        
        const data = await response.json();
        currentHistoryItems = data.items;
        
        loadingView.style.display = 'none';
        historyListView.style.display = 'grid';
        
        if (data.items.length === 0) {
            historyListView.innerHTML = '<div class="empty-state" style="grid-column: 1 / -1;"><i data-lucide="history" class="empty-icon"></i><p>No activity matches your criteria.</p></div>';
            if (window.lucide) lucide.createIcons();
            return;
        }
        
        historyListView.innerHTML = '';
        data.items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'activity-card';
            
            let typeLabel = "Q&A";
            if (item.QueryType === "explain") typeLabel = "Explain";
            else if (item.QueryType === "quiz") typeLabel = "Quiz";
            else if (item.QueryType === "summarize") typeLabel = "Summary";
            else if (item.QueryType === "learn") typeLabel = "Roadmap";
            
            card.innerHTML = 
                <div class="activity-card-header">
                    <div class="activity-type-badge">
                        <i data-lucide=""></i>
                                            </div>
                    <div class="activity-date">\</div>
                </div>
                <div style="font-weight: 600; font-size: 1.05rem; color: var(--text-primary);">\</div>
                <div class="activity-preview">\</div>
            ;
            
            card.addEventListener('click', () => openActivityDetail(item));
            historyListView.appendChild(card);
        });
        
        if (window.lucide) lucide.createIcons({ root: historyListView });
        
        if (data.total_pages > 1) {
            paginationView.style.display = 'flex';
            pageInfo.textContent = Page \ of \;
            
            document.getElementById('btn-history-prev').disabled = data.page <= 1;
            document.getElementById('btn-history-next').disabled = data.page >= data.total_pages;
        }
        
    } catch (error) {
        console.error(error);
        loadingView.style.display = 'none';
        historyListView.style.display = 'block';
        historyListView.innerHTML = '<div class="empty-state" style="color: var(--accent-red);">Failed to load history.</div>';
    }
}

function openActivityDetail(item) {
    const drawer = document.getElementById('activity-detail-drawer');
    const overlay = document.getElementById('drawer-overlay');
    
    document.getElementById('detail-date').textContent = formatHistoryDate(item.CreatedAt);
    document.getElementById('detail-prompt').textContent = item.QueryText;
    
    const respBox = document.getElementById('detail-response');
    respBox.innerHTML = DOMPurify.sanitize(marked.parse(item.ResponseText));
    
    drawer.classList.add('open');
    overlay.style.display = 'block';
    
    // Bind buttons
    document.getElementById('btn-detail-copy').onclick = () => {
        navigator.clipboard.writeText(item.ResponseText);
        showToast("Copied to clipboard!");
    };
    
    document.getElementById('btn-detail-reuse').onclick = () => {
        const taskNavToActivate = document.querySelector(.nav-item[data-task=""]);
        if (taskNavToActivate) taskNavToActivate.click();
        
        const inputField = document.getElementById("query-input");
        if (inputField) inputField.value = item.QueryText;
        
        closeActivityDetail();
    };
}

function closeActivityDetail() {
    document.getElementById('activity-detail-drawer').classList.remove('open');
    document.getElementById('drawer-overlay').style.display = 'none';
}

// Bind History Toolbar Events
document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById('history-search-input');
    const filterSelect = document.getElementById('history-feature-filter');
    const sortSelect = document.getElementById('history-sort');
    
    let searchTimeout;
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                historyState.search = e.target.value;
                historyState.page = 1;
                loadPaginatedHistory();
            }, 300);
        });
    }
    
    if (filterSelect) {
        filterSelect.addEventListener('change', (e) => {
            historyState.filter = e.target.value;
            historyState.page = 1;
            loadPaginatedHistory();
        });
    }
    
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            historyState.sort = e.target.value;
            historyState.page = 1;
            loadPaginatedHistory();
        });
    }
    
    const btnPrev = document.getElementById('btn-history-prev');
    const btnNext = document.getElementById('btn-history-next');
    
    if (btnPrev) {
        btnPrev.addEventListener('click', () => {
            if (historyState.page > 1) { historyState.page--; loadPaginatedHistory(); }
        });
    }
    if (btnNext) {
        btnNext.addEventListener('click', () => {
            historyState.page++; loadPaginatedHistory();
        });
    }
    
    const btnCloseDetail = document.getElementById('btn-close-detail');
    const overlay = document.getElementById('drawer-overlay');
    if (btnCloseDetail) btnCloseDetail.addEventListener('click', closeActivityDetail);
    if (overlay) overlay.addEventListener('click', closeActivityDetail);
});

