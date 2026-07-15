





let activeTask = "qa";
let activeEndpoint = "/qa";
let currentUser = null;


const taskCards      = document.querySelectorAll(".task-card");
const inputLabel     = document.getElementById("input-label");
const inputField     = document.getElementById("query-input");
const btnSubmit      = document.getElementById("btn-submit");
const loadingWrapper = document.getElementById("loading-wrapper");
const outputBox      = document.getElementById("output-box");
const modelBadge     = document.getElementById("model-badge");
const historyList    = document.getElementById("history-list");


const userBadge     = document.getElementById("user-badge");
const btnLoginNav   = document.getElementById("btn-login-nav");
const btnLogoutNav  = document.getElementById("btn-logout-nav");
const loginModal    = document.getElementById("login-modal");
const registerModal = document.getElementById("register-modal");


const taskConfigs = {
    qa: {
        label: "Your Question",
        placeholder: "Ask any educational question (e.g., 'Explain quantum computing simply' or 'What causes inflation?')",
        endpoint: "/qa",
        model: "Gemini"
    },
    explain: {
        label: "Concept to Explain",
        placeholder: "Enter a topic to explain (e.g., 'Recursion', 'Photosynthesis', 'World War I', 'SQL Joins')",
        endpoint: "/explain",
        model: "Gemini"   
    },
    quiz: {
        label: "Quiz Topic",
        placeholder: "Enter a topic to generate 3 multiple-choice questions (e.g., 'Python Programming', 'Chemistry')",
        endpoint: "/quiz",
        model: "Gemini"
    },
    summarize: {
        label: "Text to Summarize",
        placeholder: "Paste a long educational paragraph, article, or notes to summarize...",
        endpoint: "/summarize",
        model: "Gemini"
    },
    learn: {
        label: "Learning Topic",
        placeholder: "Enter a topic for a structured study roadmap (e.g., 'Machine Learning', 'Piano for Beginners')",
        endpoint: "/learn/recommendations",
        model: "Gemini"
    }
};




function safeRenderMarkdown(text) {
    if (!text) return "";
    const rawHtml = marked.parse(String(text));
    return DOMPurify.sanitize(rawHtml, {
        ALLOWED_TAGS: [
            "p", "br", "strong", "em", "b", "i", "u", "s",
            "h1", "h2", "h3", "h4", "h5", "h6",
            "ul", "ol", "li",
            "blockquote", "pre", "code",
            "table", "thead", "tbody", "tr", "th", "td",
            "hr", "a", "img", "span", "div"
        ],
        ALLOWED_ATTR: ["href", "src", "alt", "title", "class", "target", "rel"]
    });
}




function getHistoryIcon(queryType) {
    const icons = {
        qa: `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`,
        explain: `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"></path><path d="M9 18h6"></path><path d="M10 22h4"></path></svg>`,
        quiz: `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 18H3"/><path d="M15 6H3"/><path d="M11 12H3"/><path d="M16 16l2 2 4-4"/><path d="M16 10l2 2 4-4"/></svg>`,
        summarize: `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14,2 14,8 20,8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10,9 9,9 8,9"></polyline></svg>`,
        learn: `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/></svg>`
    };
    return icons[queryType] || icons.qa;
}


const SVG_ARROW_UP = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l1.88 5.47L20 10l-5.47 1.88L12 17.94l-1.88-5.47L4 10l5.47-1.88L12 3z"/><path d="M19 19l1 2 1-2 2-1-2-1-1-2-1 2-2 1 2 1z"/><path d="M4 4l.5 1 .5-1 1-.5-1-.5L5 2l-.5 1L3 3.5l1 .5z"/></svg>`;




document.addEventListener("DOMContentLoaded", () => {
    checkCurrentUser();
    setupTaskSelectors();
    setupAuthModals();
});




function setupTaskSelectors() {
    taskCards.forEach(card => {
        card.addEventListener("click", () => {
            
            taskCards.forEach(c => {
                c.classList.remove("active");
                c.setAttribute("aria-pressed", "false");
            });
            card.classList.add("active");
            card.setAttribute("aria-pressed", "true");

            
            activeTask = card.dataset.task;
            const config = taskConfigs[activeTask];

            activeEndpoint         = config.endpoint;
            inputLabel.textContent = config.label;
            inputField.placeholder = config.placeholder;
            modelBadge.textContent = config.model;

            
            inputField.value      = "";
            outputBox.innerHTML   = '<div class="output-placeholder">Your response will appear here.</div>';
        });

        
        card.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                card.click();
            }
        });
    });
}




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




function updateUIForAuth(isLoggedIn) {
    if (isLoggedIn && currentUser) {
        
        const userNameEl = userBadge.querySelector(".user-name");
        if (userNameEl) {
            userNameEl.textContent = currentUser.UserName;
        } else {
            userBadge.textContent = currentUser.UserName;
        }

        userBadge.style.display    = "flex";
        btnLoginNav.style.display  = "none";
        btnLogoutNav.style.display = "flex";

        btnSubmit.innerHTML = `${SVG_ARROW_UP} Ask EduGenie`;

        fetchAndRenderHistory();
    } else {
        userBadge.style.display    = "none";
        btnLoginNav.style.display  = "flex";
        btnLogoutNav.style.display = "none";

        btnSubmit.innerHTML = `${SVG_ARROW_UP} Sign In to Ask`;

        historyList.innerHTML = '<div class="output-placeholder">Sign in to view history.</div>';
    }
}




btnSubmit.addEventListener("click", async () => {
    
    if (!currentUser) {
        loginModal.style.display = "flex";
        return;
    }

    const textValue = inputField.value.trim();
    if (!textValue) {
        alert("Please provide some input first.");
        return;
    }

    
    let payload = {};
    if (activeTask === "qa")         payload = { question: textValue };
    else if (activeTask === "explain")    payload = { topic: textValue };
    else if (activeTask === "quiz")       payload = { topic: textValue };
    else if (activeTask === "summarize")  payload = { text: textValue };
    else if (activeTask === "learn")      payload = { topic: textValue };

    
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
            throw new Error(errorDetails.detail || "Server error occurred");
        }

        const data = await response.json();
        renderResult(data);
        fetchAndRenderHistory();
    } catch (error) {
        console.error("API call failed:", error);
        outputBox.innerHTML = `
            <div class="error-message">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                ${error.message}
            </div>`;
    } finally {
        loadingWrapper.style.display = "none";
        outputBox.style.display      = "block";
        btnSubmit.disabled           = false;
    }
});




function renderResult(data) {
    outputBox.innerHTML = "";

    if (activeTask === "qa") {
        outputBox.innerHTML = `<div class="rendered-markdown">${safeRenderMarkdown(data.answer)}</div>`;
    } else if (activeTask === "explain") {
        outputBox.innerHTML = `<div class="rendered-markdown">${safeRenderMarkdown(data.explanation)}</div>`;
    } else if (activeTask === "summarize") {
        outputBox.innerHTML = `<div class="rendered-markdown">${safeRenderMarkdown(data.summary)}</div>`;
    } else if (activeTask === "quiz") {
        renderQuiz(data);
    } else if (activeTask === "learn") {
        renderLearningPath(data);
    }
}




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
            optBtn.setAttribute("aria-label", `Option: ${opt}`);

            optBtn.addEventListener("click", () => {
                
                const siblings = optsList.querySelectorAll(".quiz-option");
                siblings.forEach(btn => btn.disabled = true);

                
                if (opt === q.correct_answer) {
                    optBtn.classList.add("correct");
                    optBtn.setAttribute("aria-label", `Correct: ${opt}`);
                } else {
                    optBtn.classList.add("incorrect");
                    optBtn.setAttribute("aria-label", `Incorrect: ${opt}`);
                    
                    siblings.forEach(btn => {
                        if (btn.textContent === q.correct_answer) {
                            btn.classList.add("correct");
                            btn.setAttribute("aria-label", `Correct answer: ${q.correct_answer}`);
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




function renderLearningPath(data) {
    const timeline = document.createElement("div");
    timeline.className = "timeline";

    data.roadmap.forEach((step, stepIdx) => {
        const item = document.createElement("div");
        item.className = "timeline-item";

        const dot = document.createElement("div");
        dot.className = "timeline-dot";
        dot.setAttribute("aria-hidden", "true");
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
            checkbox.setAttribute("aria-label", `Mark "${topic}" as complete`);

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




function setupAuthModals() {
    const showModal = (modal) => {
        modal.style.display = "flex";
        modal.setAttribute("aria-hidden", "false");
        
        const firstInput = modal.querySelector("input");
        if (firstInput) setTimeout(() => firstInput.focus(), 100);
    };

    const hideModal = (modal) => {
        modal.style.display = "none";
        modal.setAttribute("aria-hidden", "true");
    };

    const hideAllModals = () => {
        hideModal(loginModal);
        hideModal(registerModal);
    };

    
    btnLoginNav.addEventListener("click", () => showModal(loginModal));

    
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
        showModal(registerModal);
    });

    document.getElementById("link-goto-login").addEventListener("click", (e) => {
        e.preventDefault();
        hideModal(registerModal);
        showModal(loginModal);
    });

    
    document.getElementById("form-register").addEventListener("submit", async (e) => {
        e.preventDefault();
        const username = document.getElementById("reg-username").value.trim();
        const email    = document.getElementById("reg-email").value.trim();
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
            alert("Account created! Logged in as " + currentUser.UserName);
        } catch (err) {
            alert(err.message);
        }
    });

    
    document.getElementById("form-login").addEventListener("submit", async (e) => {
        e.preventDefault();
        const email    = document.getElementById("login-email").value.trim();
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

    
    btnLogoutNav.addEventListener("click", async () => {
        try {
            await fetch("/auth/logout", { method: "POST" });
            currentUser = null;
            updateUIForAuth(false);
            window.location.reload();
        } catch (err) {
            console.error("Logout failed:", err);
        }
    });
}




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
        console.error("Error formatting date:", e);
        return dateStr;
    }
}




async function fetchAndRenderHistory() {
    if (!currentUser) {
        historyList.innerHTML = '<div class="output-placeholder">Sign in to view history.</div>';
        return;
    }

    try {
        const response = await fetch("/auth/history");
        if (!response.ok) return;

        const historyData = await response.json();

        if (historyData.length === 0) {
            historyList.innerHTML = '<div class="output-placeholder">No queries recorded yet.</div>';
            return;
        }

        historyList.innerHTML = "";

        historyData.forEach(item => {
            const itemCard = document.createElement("div");
            itemCard.className = `history-item ${item.QueryType}`;
            itemCard.setAttribute("role", "button");
            itemCard.setAttribute("tabindex", "0");
            itemCard.setAttribute("aria-label", `${item.QueryType}: ${item.QueryText}`);

            
            const iconSpan = document.createElement("div");
            iconSpan.className = "history-icon-wrapper";
            iconSpan.innerHTML = getHistoryIcon(item.QueryType);
            iconSpan.setAttribute("aria-hidden", "true");
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
            promptTitle.title       = item.QueryText;

            const dateSpan = document.createElement("span");
            dateSpan.className   = "history-item-meta";
            dateSpan.textContent = `${typeLabel} • ${formatHistoryDate(item.CreatedAt)}`;

            infoDiv.appendChild(promptTitle);
            infoDiv.appendChild(dateSpan);
            itemCard.appendChild(infoDiv);

            
            const activateItem = () => {
                
                document.querySelectorAll(".history-item").forEach(el => el.classList.remove("active"));
                itemCard.classList.add("active");

                
                const taskCardToActivate = document.querySelector(`.task-card[data-task="${item.QueryType}"]`);
                if (taskCardToActivate) taskCardToActivate.click();

                
                inputField.value       = item.QueryText;
                modelBadge.textContent = item.ModelUsed;
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
            };

            itemCard.addEventListener("click", activateItem);
            itemCard.addEventListener("keydown", (e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    activateItem();
                }
            });

            historyList.appendChild(itemCard);
        });
    } catch (e) {
        console.error("Failed to load history:", e);
    }
}
