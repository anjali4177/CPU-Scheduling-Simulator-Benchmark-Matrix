// ==========================================
// 1. QUIZ ENGINE MODULE
// ==========================================

const quizData = [
  {
    question: "Which CPU scheduling algorithm can cause the Convoy Effect?",
    options: ["First Come First Serve (FCFS)", "Round Robin (RR)", "Shortest Remaining Time First (SRTF)", "Priority Scheduling"],
    answer: 0
  },
  {
    question: "In Round Robin scheduling, what happens if the time quantum is extremely large?",
    options: ["It behaves like Shortest Job First", "It behaves like FCFS", "It causes deadlock", "Context switching increases"],
    answer: 1
  },
  {
    question: "Which metric represents the total time elapsed from task arrival to its completion?",
    options: ["Waiting Time (WT)", "Response Time (RT)", "Turnaround Time (TAT)", "Burst Time (BT)"],
    answer: 2
  }
];

let currentQuestion = 0;
let score = 0;

function loadQuestion() {
  const q = quizData[currentQuestion];
  const questionTitle = document.getElementById("questionText");
  const optionsGroup = document.getElementById("optionsGroup");
  
  if (!questionTitle || !optionsGroup) return;

  questionTitle.innerText = `${currentQuestion + 1}. ${q.question}`;
  optionsGroup.innerHTML = "";

  q.options.forEach((opt, idx) => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.innerText = opt;
    btn.onclick = () => selectOption(idx);
    optionsGroup.appendChild(btn);
  });

  const nextBtn = document.getElementById("nextQuestionBtn");
  if (nextBtn) nextBtn.style.display = "none";
}

function selectOption(index) {
  const q = quizData[currentQuestion];
  const buttons = document.querySelectorAll("#optionsGroup .option-btn");

  buttons.forEach((btn, i) => {
    btn.disabled = true;
    if (i === q.answer) btn.classList.add("correct");
    if (i === index && index !== q.answer) btn.classList.add("wrong");
  });

  if (index === q.answer) {
    score++;
    const scoreDisplay = document.getElementById("scoreDisplay");
    if (scoreDisplay) scoreDisplay.innerText = score;
  }

  const nextBtn = document.getElementById("nextQuestionBtn");
  if (nextBtn) nextBtn.style.display = "block";
}

function nextQuestion() {
  currentQuestion++;
  if (currentQuestion < quizData.length) {
    loadQuestion();
  } else {
    showQuizCompletion();
  }
}

function showQuizCompletion() {
  const quizContainer = document.getElementById("quizContainer");
  if (!quizContainer) return;

  quizContainer.innerHTML = `
    <div style="text-align: center; padding: 20px;">
      <h3>🎉 Quiz Completed!</h3>
      <p style="margin: 12px 0; color: var(--text-secondary, #64748b); font-size: 1.1rem;">
        Your Final Score: <strong>${score} / ${quizData.length}</strong>
      </p>
      <button class="btn btn-primary" style="width: auto; padding: 10px 28px;" onclick="resetQuiz()">Try Again</button>
    </div>
  `;
}

function resetQuiz() {
  currentQuestion = 0;
  score = 0;
  
  const scoreDisplay = document.getElementById("scoreDisplay");
  if (scoreDisplay) scoreDisplay.innerText = "0";

  const quizContainer = document.getElementById("quizContainer");
  if (!quizContainer) return;

  quizContainer.innerHTML = `
    <h4 id="questionText" class="question-title">Loading Question...</h4>
    <div id="optionsGroup" class="options-group"></div>
    <button id="nextQuestionBtn" class="btn btn-primary" onclick="nextQuestion()" style="margin-top: 16px; display: none;">Next Question ➔</button>
  `;

  loadQuestion();
}

// Auto-initialize Quiz when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  loadQuestion();
  const totalDisplay = document.getElementById("totalQuestionsDisplay");
  if (totalDisplay) totalDisplay.innerText = quizData.length;
});


// ==========================================
// 2. MULTI-ALGORITHM BENCHMARK MATRIX MODULE
// ==========================================

function runAllAlgorithmsComparison() {
  const tableBody = document.getElementById("comparisonTableBody");
  if (!tableBody) return;

  // 1. Get current process queue from JS memory or fallback to HTML table
  let currentTasks = [];
  
  if (typeof processes !== "undefined" && Array.isArray(processes) && processes.length > 0) {
    currentTasks = processes;
  } else if (typeof processList !== "undefined" && Array.isArray(processList) && processList.length > 0) {
    currentTasks = processList;
  } else {
    // Fallback: Parse tasks from table rows if memory variables aren't set
    const rows = document.querySelectorAll("#processTableBody tr");
    rows.forEach(row => {
      const cells = row.querySelectorAll("td");
      if (cells.length >= 4) {
        currentTasks.push({
          id: cells[0].innerText.trim(),
          arrivalTime: parseInt(cells[1].innerText) || 0,
          burstTime: parseInt(cells[2].innerText) || 1,
          priority: parseInt(cells[3].innerText) || 1,
          at: parseInt(cells[1].innerText) || 0,
          bt: parseInt(cells[2].innerText) || 1,
          pr: parseInt(cells[3].innerText) || 1
        });
      }
    });
  }

  // Show error if queue is completely empty
  if (currentTasks.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; color: #ef4444; font-weight: 600; padding: 18px;">
          ⚠️ Please enqueue at least 1 task in the Workload Configuration panel first!
        </td>
      </tr>
    `;
    return;
  }

  // 2. Get Time Quantum input
  const quantumInput = document.getElementById("quantumInput") || document.getElementById("timeQuantum");
  const userQuantum = quantumInput ? (parseInt(quantumInput.value) || 2) : 2;

  // 3. Define algorithms array
  const algorithms = [
    { name: "First-Come, First-Served (FCFS)", code: "fcfs" },
    { name: "Shortest Job First (SJF)", code: "sjf" },
    { name: "Shortest Remaining Time First (SRTF)", code: "srtf" },
    { name: `Round Robin (RR - Quantum ${userQuantum})`, code: "rr", quantum: userQuantum },
    { name: "Priority Scheduling (Non-Preemptive)", code: "priority_np" },
    { name: "Highest Response Ratio Next (HRRN)", code: "hrrn" }
  ];

  let bestWT = Infinity;
  let bestAlgoIndex = -1;

  // 4. Run simulations
  const results = algorithms.map((algo, index) => {
    const queueCopy = JSON.parse(JSON.stringify(currentTasks));
    let simResult = null;

    try {
      if (typeof Scheduler !== "undefined" && typeof Scheduler.calculate === "function") {
        simResult = Scheduler.calculate(algo.code, queueCopy, algo.quantum);
      } else if (algo.code === "fcfs" && typeof runFCFS === "function") simResult = runFCFS(queueCopy);
      else if (algo.code === "sjf" && typeof runSJF === "function") simResult = runSJF(queueCopy);
      else if (algo.code === "srtf" && typeof runSRTF === "function") simResult = runSRTF(queueCopy);
      else if (algo.code === "rr" && typeof runRR === "function") simResult = runRR(queueCopy, algo.quantum);
      else if (algo.code === "priority_np" && typeof runPriorityNP === "function") simResult = runPriorityNP(queueCopy);
      else if (algo.code === "hrrn" && typeof runHRRN === "function") simResult = runHRRN(queueCopy);
    } catch (e) {
      console.error("Error executing " + algo.name, e);
    }

    // Safely pull metrics or default to 0
    const avgTAT = (simResult && simResult.avgTAT !== undefined) ? simResult.avgTAT : (simResult && simResult.averages ? simResult.averages.avgTAT : 0);
    const avgWT = (simResult && simResult.avgWT !== undefined) ? simResult.avgWT : (simResult && simResult.averages ? simResult.averages.avgWT : 0);

    if (avgWT < bestWT) {
      bestWT = avgWT;
      bestAlgoIndex = index;
    }

    return { name: algo.name, avgTAT: parseFloat(avgTAT) || 0, avgWT: parseFloat(avgWT) || 0 };
  });

  // 5. Render results
  let rowsHTML = "";
  results.forEach((res, idx) => {
    const isOptimal = idx === bestAlgoIndex;
    const badge = isOptimal 
      ? `<span style="background: #22c55e; color: #fff; padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: bold;">BEST OPTIMAL</span>`
      : `<span style="background: #e2e8f0; color: #475569; padding: 4px 10px; border-radius: 20px; font-size: 0.75rem;">STANDARD</span>`;

    rowsHTML += `
      <tr style="${isOptimal ? 'background: rgba(34, 197, 94, 0.08); font-weight: 600;' : ''}">
        <td>${res.name}</td>
        <td>${res.avgTAT.toFixed(2)} ticks</td>
        <td>${res.avgWT.toFixed(2)} ticks</td>
        <td>100%</td>
        <td>${badge}</td>
      </tr>
    `;
  });

  tableBody.innerHTML = rowsHTML;
}