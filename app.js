// Global process storage
let processes = [];
let processCounter = 1;

// Initialize event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const runBtn = document.getElementById('runBtn');
  const algoSelect = document.getElementById('algoSelect');

  // Toggle Time Quantum visibility when algorithm changes
  if (algoSelect) {
    algoSelect.addEventListener('change', (e) => {
      const quantumGroup = document.getElementById('quantumGroup');
      if (quantumGroup) {
        quantumGroup.style.display = e.target.value === 'rr' ? 'block' : 'none';
      }
    });
  }

  // Bind Run Dispatcher button
  if (runBtn) {
    runBtn.addEventListener('click', runSimulation);
  }
});

// Function to add a process to the ready queue
function addProcess() {
  const atInput = document.getElementById('atInput');
  const btInput = document.getElementById('btInput');
  const prInput = document.getElementById('prInput');

  const at = parseInt(atInput.value) || 0;
  const bt = parseInt(btInput.value) || 1;
  const pr = parseInt(prInput.value) || 1;

  const process = {
    pid: `P${processCounter++}`,
    at: at,
    bt: bt,
    pr: pr
  };

  processes.push(process);
  renderProcessTable();
}

// Function to remove a process from the queue
function removeProcess(index) {
  processes.splice(index, 1);
  renderProcessTable();
}

// Render the active ready queue table
function renderProcessTable() {
  const tbody = document.getElementById('processTableBody');
  if (!tbody) return;

  tbody.innerHTML = '';
  processes.forEach((p, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${p.pid}</strong></td>
      <td>${p.at}</td>
      <td>${p.bt}</td>
      <td>${p.pr}</td>
      <td><button class="btn btn-secondary" style="padding: 4px 10px; font-size:0.75rem; color:#ff4d6d; border-color:#ff4d6d;" onclick="removeProcess(${idx})">✕</button></td>
    `;
    tbody.appendChild(tr);
  });
}

// Run the core simulation and update UI
function runSimulation() {
  if (processes.length === 0) {
    alert('Please add at least one process to run the dispatcher!');
    return;
  }

  const algo = document.getElementById('algoSelect').value;
  const quantum = parseInt(document.getElementById('quantumInput').value) || 2;

  // Execute scheduling engine
  const result = Scheduler.calculate(algo, processes, quantum);

  // Render Gantt Chart
  if (typeof GanttRenderer !== 'undefined') {
    GanttRenderer.render('ganttChart', result.timeline);
  }

  // Render Benchmark Results Table
  renderMetricsTable(result.processes, result.averages);
}

// Display calculated performance metrics
function renderMetricsTable(metricsProcesses, averages) {
  const tbody = document.getElementById('metricsTableBody');
  const summary = document.getElementById('avgMetrics');

  if (!tbody) return;
  tbody.innerHTML = '';

  metricsProcesses.forEach((p) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${p.pid}</strong></td>
      <td>${p.ct}</td>
      <td>${p.tat}</td>
      <td>${p.wt}</td>
      <td>${p.rt}</td>
    `;
    tbody.appendChild(tr);
  });

  if (summary && averages) {
    summary.innerHTML = `
      Average TAT: <strong>${averages.avgTAT}</strong> | 
      Average WT: <strong>${averages.avgWT}</strong> | 
      Average RT: <strong>${averages.avgRT}</strong>
    `;
  }
}