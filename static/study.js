const MODES = {

    pomodoro:{
        focus:25,
        break:5
    },

    deepwork:{
        focus:90,
        break:15
    },

    quickburst:{
        focus:15,
        break:3
    },

    examcrunch:{
        focus:50,
        break:10
    }

};

let timer;
let secondsRemaining;
let currentMode="pomodoro";

let isBreak=false;
let isRunning=false;

function loadMode(){

    currentMode =
        document.getElementById("modeSelect").value;

    if(currentMode==="custom"){

        document.getElementById(
            "customSettings"
        ).style.display="block";

        secondsRemaining=
            document.getElementById("customFocus").value*60;

    }

    else{

        document.getElementById(
            "customSettings"
        ).style.display="none";

        secondsRemaining=
            MODES[currentMode].focus*60;
    }

    updateDisplay();
}

function updateDisplay(){

    let minutes=
        Math.floor(secondsRemaining/60);

    let seconds=
        secondsRemaining%60;

    document.getElementById(
        "timerDisplay"
    ).innerText=
        String(minutes).padStart(2,"0")
        +":"+
        String(seconds).padStart(2,"0");
}

function startTimer(){

    if(isRunning) return;

    isRunning=true;

    timer=setInterval(()=>{

        secondsRemaining--;

        updateDisplay();

        if(secondsRemaining<=0){

            clearInterval(timer);

            isRunning=false;

            sessionFinished();
        }

    },1000);
}

function pauseTimer(){

    clearInterval(timer);

    isRunning=false;
}

function resumeTimer(){

    startTimer();
}

function resetTimer(){

    clearInterval(timer);

    isRunning=false;

    loadMode();
}

function sessionFinished(){

    let completedMinutes;

    if(currentMode==="custom"){

        completedMinutes=
            parseInt(
                document.getElementById("customFocus").value
            );

    }else{

        completedMinutes=
            MODES[currentMode].focus;
    }

    fetch("/save_study_session",{

        method:"POST",

        headers:{
            "Content-Type":"application/json"
        },

        body:JSON.stringify({

            mode:currentMode,

            task:
                document.getElementById(
                    "taskSelect"
                ).value,

            minutes:completedMinutes

        })

    });

    alert("Focus session complete!");

    switchPhase();
}

function switchPhase(){

    if(!isBreak){

        document.getElementById(
            "phaseLabel"
        ).innerText="Break Time";

        if(currentMode==="custom"){

            secondsRemaining=
                document.getElementById(
                    "customBreak"
                ).value*60;

        }

        else{

            secondsRemaining=
                MODES[currentMode].break*60;
        }

        isBreak=true;

    }

    else{

        document.getElementById(
            "phaseLabel"
        ).innerText="Focus Time";

        loadMode();

        isBreak=false;
    }

    updateDisplay();
}

async function loadStats(){

    const response=
        await fetch("/get_study_stats");

    const data=
        await response.json();

    document.getElementById(
        "todayMinutes"
    ).innerText=
        data.today_minutes || 0;

    document.getElementById(
        "weeklyMinutes"
    ).innerText=
        data.weekly_minutes || 0;

    document.getElementById(
        "totalSessions"
    ).innerText=
        data.total_sessions || 0;

    document.getElementById(
        "totalMinutes"
    ).innerText=
        data.total_minutes || 0;
}

document.getElementById(
    "modeSelect"
).addEventListener(
    "change",
    loadMode
);

loadMode();
loadStats();
