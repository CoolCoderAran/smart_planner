const MODES = {
    pomodoro: { focus: 25, break: 5 },
    deepwork: { focus: 90, break: 15 },
    quickburst: { focus: 15, break: 3 },
    examcrunch: { focus: 50, break: 10 }
};

let timer = null;
let secondsRemaining = 1500;
let currentMode = "pomodoro";
let isBreak = false;
let isRunning = false;

function loadMode() {
    currentMode = document.getElementById("modeSelect").value;

    if (currentMode === "custom") {
        document.getElementById("customSettings").style.display = "grid";
        const customMins = parseInt(document.getElementById("customFocus").value) || 25;
        secondsRemaining = customMins * 60;
    } else {
        document.getElementById("customSettings").style.display = "none";
        secondsRemaining = MODES[currentMode].focus * 60;
    }

    isBreak = false;
    document.getElementById("phaseLabel").innerText = "Focus Time";
    updateDisplay();
}

function updateDisplay() {
    const minutes = Math.floor(secondsRemaining / 60);
    const seconds = secondsRemaining % 60;
    document.getElementById("timerDisplay").innerText = 
        `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function startTimer() {
    if (isRunning) return;
    isRunning = true;

    timer = setInterval(() => {
        secondsRemaining--;
        updateDisplay();

        if (secondsRemaining <= 0) {
            clearInterval(timer);
            isRunning = false;
            sessionFinished();
        }
    }, 1000);
}

function pauseTimer() {
    clearInterval(timer);
    isRunning = false;
}

function resumeTimer() {
    startTimer();
}

function resetTimer() {
    clearInterval(timer);
    isRunning = false;
    loadMode();
}

async function sessionFinished() {
    let completedMinutes = 0;

    if (currentMode === "custom") {
        completedMinutes = parseInt(document.getElementById("customFocus").value) || 0;
    } else {
        completedMinutes = MODES[currentMode].focus;
    }

    const selectedTask = document.getElementById("taskSelect").value;

    if (!isBreak && completedMinutes > 0) {
        try {
            const res = await fetch("/save_study_session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mode: currentMode,
                    task: selectedTask || "General Focus",
                    minutes: completedMinutes
                })
            });

            const data = await res.json();
            if (data.success) {
                // Refresh both the stats counters and the history log table instantly
                await loadStats();
                await loadHistory();
            }
        } catch (err) {
            console.error("Failed to save study session:", err);
        }
    }

    switchPhase();
}

function switchPhase() {
    if (!isBreak) {
        document.getElementById("phaseLabel").innerText = "Break Time";
        if (currentMode === "custom") {
            const breakMins = parseInt(document.getElementById("customBreak").value) || 5;
            secondsRemaining = breakMins * 60;
        } else {
            secondsRemaining = MODES[currentMode].break * 60;
        }
        isBreak = true;
    } else {
        document.getElementById("phaseLabel").innerText = "Focus Time";
        loadMode();
        isBreak = false;
    }

    updateDisplay();
}

async function loadStats() {
    try {
        const response = await fetch("/get_study_stats");
        if (!response.ok) return;

        const data = await response.json();
        
        const today = data.today_minutes || 0;
        document.getElementById("todayMinutes").innerText = today;
        document.getElementById("weeklyMinutes").innerText = data.weekly_minutes || 0;
        document.getElementById("totalSessions").innerText = data.total_sessions || 0;
        document.getElementById("totalMinutes").innerText = data.total_minutes || 0;

        // Populate Streaks
        document.getElementById("currentStreak").innerText = `${data.current_streak || 0} Days`;
        document.getElementById("bestStreak").innerText = `${data.best_streak || 0} Days`;

        // Daily Goal progress update (Target: 120 mins)
        const target = 120;
        const pct = Math.min(100, Math.round((today / target) * 100));
        document.getElementById("goalFill").style.width = `${pct}%`;
        document.getElementById("goalProgressText").innerText = `${today} / ${target} mins`;
    } catch (e) {
        console.error("Could not load stats", e);
    }
}

// TAB SWITCHING
function switchTab(tabName) {
    document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(content => content.classList.remove("active"));

    if (tabName === 'history') {
        document.querySelectorAll(".tab-btn")[0].classList.add("active");
        document.getElementById("tabHistory").classList.add("active");
    } else {
        document.querySelectorAll(".tab-btn")[1].classList.add("active");
        document.getElementById("tabNotes").classList.add("active");
    }
}

// BRAIN DUMP LOCALSTORAGE
const notesElem = document.getElementById("brainDumpNotes");
if (notesElem) {
    notesElem.value = localStorage.getItem("focus_notes") || "";
    notesElem.addEventListener("input", () => {
        localStorage.setItem("focus_notes", notesElem.value);
    });
}

// AMBIENT AUDIO CONTROLLER
let activeAudio = null;
let activeBtn = null;

function toggleAudio(type) {
    const soundMap = {
        rain: { audio: document.getElementById("audioRain"), btn: event.currentTarget },
        lofi: { audio: document.getElementById("audioLofi"), btn: event.currentTarget },
        waves: { audio: document.getElementById("audioWaves"), btn: event.currentTarget },
        forest: { audio: document.getElementById("audioForest"), btn: event.currentTarget },
        cafe: { audio: document.getElementById("audioCafe"), btn: event.currentTarget },
        fire: { audio: document.getElementById("audioFire"), btn: event.currentTarget }
    };

    const target = soundMap[type];

    if (activeAudio === target.audio) {
        activeAudio.pause();
        activeBtn.classList.remove("playing");
        activeAudio = null;
        activeBtn = null;
        return;
    }

    if (activeAudio) {
        activeAudio.pause();
        activeBtn.classList.remove("playing");
    }

    target.audio.play();
    target.btn.classList.add("playing");
    activeAudio = target.audio;
    activeBtn = target.btn;
}

// FETCH RECENT HISTORY
async function loadHistory() {
    try {
        const res = await fetch("/get_recent_sessions");
        if (!res.ok) return;
        const sessions = await res.json();
        
        const tbody = document.getElementById("sessionHistoryBody");
        if (sessions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="empty-msg">No recent sessions found.</td></tr>';
            return;
        }

        tbody.innerHTML = sessions.map(s => `
            <tr>
                <td>${s.task || 'General Focus'}</td>
                <td style="text-transform: capitalize;">${s.mode}</td>
                <td>${s.minutes} mins</td>
                <td>${new Date(s.completed_at).toLocaleDateString()}</td>
            </tr>
        `).join('');
    } catch (err) {
        console.error("Could not fetch session history", err);
    }
}

// Hook into initial load
loadHistory();

document.getElementById("modeSelect").addEventListener("change", loadMode);
document.getElementById("customFocus").addEventListener("change", loadMode);

loadMode();
loadStats();
