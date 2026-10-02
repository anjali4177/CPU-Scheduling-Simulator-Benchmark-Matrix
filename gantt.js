class GanttRenderer {
  static colorMap = {
    'P1': '#FF4D6D',
    'P2': '#7000FF',
    'P3': '#00B4D8',
    'P4': '#10B981',
    'P5': '#F59E0B',
    'P6': '#EC4899',
    'IDLE': '#94A3B8'
  };

  static render(containerId, timeline) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    if (!timeline || timeline.length === 0) return;

    timeline.forEach((block, idx) => {
      const duration = block.end - block.start;

      const el = document.createElement('div');
      el.className = 'gantt-block';
      el.style.flex = duration;
      el.style.backgroundColor = this.colorMap[block.pid] || '#6366F1';
      el.innerHTML = `
        <span>${block.pid}</span>
        <span class="time-stamp">${block.end}</span>
      `;

      if (idx === 0) {
        const startStamp = document.createElement('span');
        startStamp.className = 'time-stamp';
        startStamp.style.left = '0px';
        startStamp.innerText = block.start;
        el.appendChild(startStamp);
      }

      container.appendChild(el);
    });
  }
}