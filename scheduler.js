class Scheduler {
  static calculate(algo, inputProcesses, quantum = 2) {
    // Deep clone input processes
    let procs = JSON.parse(JSON.stringify(inputProcesses));
    
    switch (algo) {
      case 'fcfs':
        return this.fcfs(procs);
      case 'sjf':
        return this.sjf(procs);
      case 'srtf':
        return this.srtf(procs);
      case 'rr':
        return this.rr(procs, quantum);
      case 'priority_np':
        return this.priorityNonPreemptive(procs);
      case 'hrrn':
        return this.hrrn(procs);
      default:
        return this.fcfs(procs);
    }
  }

  static fcfs(procs) {
    procs.sort((a, b) => a.at - b.at);
    let currentTime = 0;
    let timeline = [];

    procs.forEach((p) => {
      if (currentTime < p.at) {
        timeline.push({ pid: 'IDLE', start: currentTime, end: p.at });
        currentTime = p.at;
      }
      let start = currentTime;
      p.rt = start - p.at;
      currentTime += p.bt;
      p.ct = currentTime;
      p.tat = p.ct - p.at;
      p.wt = p.tat - p.bt;

      timeline.push({ pid: p.pid, start: start, end: p.ct });
    });

    return this.formatResult(procs, timeline);
  }

  static sjf(procs) {
    let n = procs.length;
    let completed = 0;
    let currentTime = 0;
    let isCompleted = new Array(n).fill(false);
    let timeline = [];

    procs.forEach(p => p.firstTime = -1);

    while (completed < n) {
      let idx = -1;
      let minBt = Infinity;

      for (let i = 0; i < n; i++) {
        if (procs[i].at <= currentTime && !isCompleted[i]) {
          if (procs[i].bt < minBt) {
            minBt = procs[i].bt;
            idx = i;
          }
        }
      }

      if (idx !== -1) {
        let p = procs[idx];
        p.rt = currentTime - p.at;
        let start = currentTime;
        currentTime += p.bt;
        p.ct = currentTime;
        p.tat = p.ct - p.at;
        p.wt = p.tat - p.bt;

        timeline.push({ pid: p.pid, start: start, end: p.ct });
        isCompleted[idx] = true;
        completed++;
      } else {
        timeline.push({ pid: 'IDLE', start: currentTime, end: currentTime + 1 });
        currentTime++;
      }
    }

    return this.formatResult(procs, this.mergeTimeline(timeline));
  }

  static srtf(procs) {
    let n = procs.length;
    let remainingBt = procs.map(p => p.bt);
    let firstResponse = new Array(n).fill(-1);
    let completed = 0;
    let currentTime = 0;
    let timeline = [];

    while (completed < n) {
      let idx = -1;
      let minBt = Infinity;

      for (let i = 0; i < n; i++) {
        if (procs[i].at <= currentTime && remainingBt[i] > 0) {
          if (remainingBt[i] < minBt) {
            minBt = remainingBt[i];
            idx = i;
          }
        }
      }

      if (idx !== -1) {
        if (firstResponse[idx] === -1) {
          firstResponse[idx] = currentTime - procs[idx].at;
        }

        timeline.push({ pid: procs[idx].pid, start: currentTime, end: currentTime + 1 });
        remainingBt[idx]--;
        currentTime++;

        if (remainingBt[idx] === 0) {
          procs[idx].ct = currentTime;
          procs[idx].tat = procs[idx].ct - procs[idx].at;
          procs[idx].wt = procs[idx].tat - procs[idx].bt;
          procs[idx].rt = firstResponse[idx];
          completed++;
        }
      } else {
        timeline.push({ pid: 'IDLE', start: currentTime, end: currentTime + 1 });
        currentTime++;
      }
    }

    return this.formatResult(procs, this.mergeTimeline(timeline));
  }

  static rr(procs, quantum) {
    procs.sort((a, b) => a.at - b.at);
    let n = procs.length;
    let remainingBt = procs.map(p => p.bt);
    let firstResponse = new Array(n).fill(-1);
    let currentTime = 0;
    let queue = [];
    let visited = new Array(n).fill(false);
    let timeline = [];
    let completed = 0;

    const checkNewArrivals = () => {
      for (let i = 0; i < n; i++) {
        if (procs[i].at <= currentTime && !visited[i]) {
          queue.push(i);
          visited[i] = true;
        }
      }
    };

    checkNewArrivals();

    while (completed < n) {
      if (queue.length === 0) {
        timeline.push({ pid: 'IDLE', start: currentTime, end: currentTime + 1 });
        currentTime++;
        checkNewArrivals();
        continue;
      }

      let idx = queue.shift();

      if (firstResponse[idx] === -1) {
        firstResponse[idx] = currentTime - procs[idx].at;
      }

      let execTime = Math.min(quantum, remainingBt[idx]);
      timeline.push({ pid: procs[idx].pid, start: currentTime, end: currentTime + execTime });
      currentTime += execTime;
      remainingBt[idx] -= execTime;

      checkNewArrivals();

      if (remainingBt[idx] > 0) {
        queue.push(idx);
      } else {
        procs[idx].ct = currentTime;
        procs[idx].tat = procs[idx].ct - procs[idx].at;
        procs[idx].wt = procs[idx].tat - procs[idx].bt;
        procs[idx].rt = firstResponse[idx];
        completed++;
      }
    }

    return this.formatResult(procs, this.mergeTimeline(timeline));
  }

  static priorityNonPreemptive(procs) {
    let n = procs.length;
    let completed = 0;
    let currentTime = 0;
    let isCompleted = new Array(n).fill(false);
    let timeline = [];

    while (completed < n) {
      let idx = -1;
      let minPr = Infinity;

      for (let i = 0; i < n; i++) {
        if (procs[i].at <= currentTime && !isCompleted[i]) {
          if (procs[i].pr < minPr) {
            minPr = procs[i].pr;
            idx = i;
          }
        }
      }

      if (idx !== -1) {
        let p = procs[idx];
        p.rt = currentTime - p.at;
        let start = currentTime;
        currentTime += p.bt;
        p.ct = currentTime;
        p.tat = p.ct - p.at;
        p.wt = p.tat - p.bt;

        timeline.push({ pid: p.pid, start: start, end: p.ct });
        isCompleted[idx] = true;
        completed++;
      } else {
        timeline.push({ pid: 'IDLE', start: currentTime, end: currentTime + 1 });
        currentTime++;
      }
    }

    return this.formatResult(procs, this.mergeTimeline(timeline));
  }

  static hrrn(procs) {
    let n = procs.length;
    let completed = 0;
    let currentTime = 0;
    let isCompleted = new Array(n).fill(false);
    let timeline = [];

    while (completed < n) {
      let idx = -1;
      let maxHrr = -1;

      for (let i = 0; i < n; i++) {
        if (procs[i].at <= currentTime && !isCompleted[i]) {
          let wt = currentTime - procs[i].at;
          let hrr = (wt + procs[i].bt) / procs[i].bt;
          if (hrr > maxHrr) {
            maxHrr = hrr;
            idx = i;
          }
        }
      }

      if (idx !== -1) {
        let p = procs[idx];
        p.rt = currentTime - p.at;
        let start = currentTime;
        currentTime += p.bt;
        p.ct = currentTime;
        p.tat = p.ct - p.at;
        p.wt = p.tat - p.bt;

        timeline.push({ pid: p.pid, start: start, end: p.ct });
        isCompleted[idx] = true;
        completed++;
      } else {
        timeline.push({ pid: 'IDLE', start: currentTime, end: currentTime + 1 });
        currentTime++;
      }
    }

    return this.formatResult(procs, this.mergeTimeline(timeline));
  }

  static mergeTimeline(timeline) {
    if (timeline.length === 0) return [];
    let merged = [timeline[0]];

    for (let i = 1; i < timeline.length; i++) {
      let last = merged[merged.length - 1];
      let current = timeline[i];

      if (last.pid === current.pid) {
        last.end = current.end;
      } else {
        merged.push(current);
      }
    }
    return merged;
  }

  static formatResult(procs, timeline) {
    let totalTAT = procs.reduce((acc, p) => acc + p.tat, 0);
    let totalWT = procs.reduce((acc, p) => acc + p.wt, 0);
    let totalRT = procs.reduce((acc, p) => acc + p.rt, 0);
    let count = procs.length;

    return {
      processes: procs,
      timeline: timeline,
      averages: {
        avgTAT: (totalTAT / count).toFixed(2),
        avgWT: (totalWT / count).toFixed(2),
        avgRT: (totalRT / count).toFixed(2)
      }
    };
  }
}