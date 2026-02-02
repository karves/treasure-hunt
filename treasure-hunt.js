/**

- Treasure Hunt Widget
- Embeddable treasure hunt game for employee engagement
- Supports both manual placement and smart auto-placement modes
  */

(function() {
‘use strict’;

const TreasureHunt = {
config: {
mode: ‘manual’, // ‘manual’ or ‘auto’
theme: ‘easter-eggs’,
totalTreasures: 5,
treasureEmoji: ‘🥚’,
thresholds: {
3: 1,  // 3 found = 1 entry
4: 2,  // 4 found = 2 entries
5: 5   // 5 found = 5 entries
},
minThreshold: 3,
brandColors: {
primary: ‘#FF6B35’,
secondary: ‘#004E89’,
accent: ‘#FFD23F’
},
submitEndpoint: ‘/api/treasure-entries’,
excludeSelectors: ‘nav, header, footer, form, button, a, .no-treasure’,
preferSelectors: ‘p, li, figcaption, blockquote’,
storageKey: ‘treasureHuntProgress’
},

```
state: {
  found: [],
  submitted: false,
  startTime: null,
  treasurePositions: []
},

init(userConfig = {}) {
  // Merge user config with defaults
  this.config = { ...this.config, ...userConfig };
  
  // Wait for DOM to be ready before initializing
  const startInit = () => {
    // Load saved progress
    this.loadProgress();
    
    // Initialize based on mode
    if (this.config.mode === 'auto') {
      this.autoPlaceTreasures();
    } else {
      this.setupManualTreasures();
    }
    
    // Create UI
    this.createTracker();
    this.createWelcomeModal();
    this.injectStyles();
    
    // Setup SPA navigation detection
    this.setupNavigationListener();
  };
  
  // Check if DOM is already loaded
  if (document.readyState === 'loading') {
    // DOM is still loading, wait for it
    document.addEventListener('DOMContentLoaded', startInit);
  } else {
    // DOM is already ready, initialize immediately
    startInit();
  }
},

setupManualTreasures() {
  // Find all manually placed treasures
  const treasures = document.querySelectorAll('[data-treasure], .treasure-hunt-item');
  
  treasures.forEach((treasure, index) => {
    const id = treasure.getAttribute('data-treasure') || `treasure-${index}`;
    treasure.setAttribute('data-treasure-id', id);
    treasure.classList.add('treasure-hunt-clickable');
    
    // Check if already found
    if (this.state.found.includes(id)) {
      treasure.classList.add('treasure-found');
    } else {
      treasure.addEventListener('click', (e) => this.collectTreasure(e, id));
    }
  });
},

autoPlaceTreasures() {
  // Remove any existing auto-placed treasures first (prevents duplicates)
  const existingTreasures = document.querySelectorAll('.treasure-hunt-auto');
  existingTreasures.forEach(t => t.remove());
  
  // Find safe placement spots
  const preferredElements = document.querySelectorAll(this.config.preferSelectors);
  const excludedElements = document.querySelectorAll(this.config.excludeSelectors);
  
  const validSpots = Array.from(preferredElements).filter(el => {
    // Check if element or any parent is in excluded list
    let current = el;
    while (current) {
      if (Array.from(excludedElements).includes(current)) {
        return false;
      }
      current = current.parentElement;
    }
    
    // Check if element has enough text content
    const text = el.textContent.trim();
    return text.length > 20 && el.offsetParent !== null; // visible element
  });

  // Limit to available spots or configured total, whichever is lower
  const maxTreasures = Math.min(this.config.totalTreasures, validSpots.length, 10);
  
  // Randomly select spots and place treasures
  const shuffled = validSpots.sort(() => Math.random() - 0.5);
  const selectedSpots = shuffled.slice(0, maxTreasures);
  
  selectedSpots.forEach((spot, index) => {
    const id = `auto-treasure-${index}`;
    const treasure = document.createElement('span');
    treasure.className = 'treasure-hunt-item treasure-hunt-auto treasure-hunt-clickable';
    treasure.setAttribute('data-treasure-id', id);
    treasure.textContent = this.config.treasureEmoji;
    
    // Insert at a random position within the element
    const textNode = this.getRandomTextNode(spot);
    if (textNode) {
      const range = document.createRange();
      const position = Math.floor(Math.random() * textNode.textContent.length);
      range.setStart(textNode, position);
      range.insertNode(treasure);
      
      if (!this.state.found.includes(id)) {
        treasure.addEventListener('click', (e) => this.collectTreasure(e, id));
      } else {
        treasure.classList.add('treasure-found');
      }
    }
  });
},

getRandomTextNode(element) {
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        return node.textContent.trim().length > 0 ? 
          NodeFilter.FILTER_ACCEPT : 
          NodeFilter.FILTER_REJECT;
      }
    }
  );
  
  const textNodes = [];
  let node;
  while (node = walker.nextNode()) {
    textNodes.push(node);
  }
  
  return textNodes.length > 0 ? 
    textNodes[Math.floor(Math.random() * textNodes.length)] : 
    null;
},

collectTreasure(event, treasureId) {
  event.preventDefault();
  event.stopPropagation();
  
  if (this.state.found.includes(treasureId)) return;
  
  const treasure = event.currentTarget;
  this.state.found.push(treasureId);
  treasure.classList.add('treasure-found', 'treasure-collecting');
  treasure.removeEventListener('click', this.collectTreasure);
  
  // Celebration animation
  this.createCollectionEffect(treasure);
  
  // Update tracker
  this.updateTracker();
  
  // Save progress
  this.saveProgress();
  
  // Check for threshold milestones
  this.checkMilestone();
  
  // Remove animation class after animation completes
  setTimeout(() => {
    treasure.classList.remove('treasure-collecting');
  }, 600);
},

createCollectionEffect(element) {
  const rect = element.getBoundingClientRect();
  const particle = document.createElement('div');
  particle.className = 'treasure-particle';
  particle.textContent = this.config.treasureEmoji;
  particle.style.left = rect.left + rect.width / 2 + 'px';
  particle.style.top = rect.top + rect.height / 2 + 'px';
  
  document.body.appendChild(particle);
  
  // Animate to tracker
  const tracker = document.querySelector('.treasure-tracker');
  const trackerRect = tracker.getBoundingClientRect();
  
  setTimeout(() => {
    particle.style.transform = `translate(${trackerRect.left - rect.left}px, ${trackerRect.top - rect.top}px) scale(0.5)`;
    particle.style.opacity = '0';
  }, 50);
  
  setTimeout(() => {
    particle.remove();
  }, 800);
},

checkMilestone() {
  const count = this.state.found.length;
  const threshold = this.config.minThreshold;
  
  if (count === threshold && !this.state.submitted) {
    // First threshold reached
    setTimeout(() => this.showSubmissionModal(count), 800);
  } else if (count > threshold && count in this.config.thresholds) {
    // Higher threshold reached
    setTimeout(() => this.showMilestoneModal(count), 800);
  } else if (count === this.config.totalTreasures) {
    // All treasures found!
    setTimeout(() => this.showCompletionModal(), 800);
  }
},

createTracker() {
  const tracker = document.createElement('div');
  tracker.className = 'treasure-tracker';
  tracker.innerHTML = `
    <div class="treasure-tracker-header">
      <span class="treasure-tracker-emoji">${this.config.treasureEmoji}</span>
      <span class="treasure-tracker-count">0/${this.config.totalTreasures}</span>
    </div>
    <div class="treasure-tracker-progress">
      <div class="treasure-tracker-bar"></div>
    </div>
    <div class="treasure-tracker-entries">
      <span class="entries-text">Find ${this.config.minThreshold} to enter!</span>
    </div>
  `;
  
  document.body.appendChild(tracker);
  this.updateTracker();
  
  // Make tracker tappable on mobile to show status/submit
  tracker.addEventListener('click', (e) => {
    // Only if not dragging
    if (!tracker.classList.contains('tracker-dragging')) {
      const count = this.state.found.length;
      if (count >= this.config.minThreshold) {
        // Show appropriate modal
        if (count in this.config.thresholds) {
          this.showMilestoneModal(count);
        }
      }
    }
  });
  
  // Make it draggable on mobile
  this.makeTrackerDraggable(tracker);
},

makeTrackerDraggable(tracker) {
  let isDragging = false;
  let hasMoved = false;
  let currentX, currentY, initialX, initialY;
  
  tracker.addEventListener('touchstart', (e) => {
    initialX = e.touches[0].clientX;
    initialY = e.touches[0].clientY;
    isDragging = true;
    hasMoved = false;
  });
  
  tracker.addEventListener('touchmove', (e) => {
    if (isDragging) {
      e.preventDefault();
      hasMoved = true;
      tracker.classList.add('tracker-dragging');
      currentX = e.touches[0].clientX - initialX;
      currentY = e.touches[0].clientY - initialY;
      tracker.style.transform = `translate(${currentX}px, ${currentY}px)`;
    }
  });
  
  tracker.addEventListener('touchend', () => {
    isDragging = false;
    setTimeout(() => {
      tracker.classList.remove('tracker-dragging');
    }, 100);
  });
},

updateTracker() {
  const count = this.state.found.length;
  const total = this.config.totalTreasures;
  const percentage = (count / total) * 100;
  
  const countEl = document.querySelector('.treasure-tracker-count');
  const barEl = document.querySelector('.treasure-tracker-bar');
  const entriesEl = document.querySelector('.entries-text');
  
  countEl.textContent = `${count}/${total}`;
  barEl.style.width = `${percentage}%`;
  
  // Update entries text based on thresholds
  if (count < this.config.minThreshold) {
    entriesEl.textContent = `Find ${this.config.minThreshold} to enter!`;
  } else if (count in this.config.thresholds) {
    const entries = this.config.thresholds[count];
    entriesEl.textContent = `${entries} ${entries === 1 ? 'entry' : 'entries'} to win! 🎉`;
    entriesEl.classList.add('entries-active');
  }
  
  // Add pulse animation on update
  const tracker = document.querySelector('.treasure-tracker');
  tracker.classList.add('treasure-tracker-pulse');
  setTimeout(() => tracker.classList.remove('treasure-tracker-pulse'), 600);
},

createWelcomeModal() {
  if (this.state.found.length > 0) return; // Don't show if already started
  
  const modal = document.createElement('div');
  modal.className = 'treasure-modal treasure-welcome-modal';
  modal.innerHTML = `
    <div class="treasure-modal-content treasure-modal-enter">
      <button class="treasure-modal-close">&times;</button>
      <div class="treasure-modal-emoji-big">${this.config.treasureEmoji}</div>
      <h2>Treasure hunt!</h2>
      <p>There are <strong>${this.config.totalTreasures} hidden treasures</strong> scattered across this page. Can you find them all?</p>
      <div class="treasure-modal-rewards">
        <div class="reward-item">
          <span class="reward-count">3 treasures</span>
          <span class="reward-value">1 entry to win</span>
        </div>
        <div class="reward-item">
          <span class="reward-count">4 treasures</span>
          <span class="reward-value">2 entries to win</span>
        </div>
        <div class="reward-item">
          <span class="reward-count">5 treasures</span>
          <span class="reward-value">5 entries to win!</span>
        </div>
      </div>
      <p class="treasure-hint">Look for glowing ${this.config.treasureEmoji} icons hidden in the content!</p>
      <button class="treasure-btn treasure-btn-primary">Start hunting</button>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Event listeners
  modal.querySelector('.treasure-btn-primary').addEventListener('click', () => {
    this.state.startTime = Date.now();
    this.saveProgress();
    modal.classList.add('treasure-modal-exit');
    setTimeout(() => modal.remove(), 300);
  });
  
  modal.querySelector('.treasure-modal-close').addEventListener('click', () => {
    modal.classList.add('treasure-modal-exit');
    setTimeout(() => modal.remove(), 300);
  });
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.add('treasure-modal-exit');
      setTimeout(() => modal.remove(), 300);
    }
  });
},

showSubmissionModal(count) {
  const entries = this.config.thresholds[count];
  
  const modal = document.createElement('div');
  modal.className = 'treasure-modal';
  modal.innerHTML = `
    <div class="treasure-modal-content treasure-modal-enter">
      <div class="treasure-confetti">🎉</div>
      <h2>Great work!</h2>
      <p>You've found <strong>${count} treasures</strong> and unlocked entry to the prize draw!</p>
      <p class="treasure-highlight">You have <strong>${entries} ${entries === 1 ? 'entry' : 'entries'}</strong> to win</p>
      <form class="treasure-form" id="treasureSubmitForm">
        <input type="email" name="email" placeholder="Enter your email" required />
        <button type="submit" class="treasure-btn treasure-btn-primary">Enter draw (${entries} ${entries === 1 ? 'chance' : 'chances'})</button>
      </form>
      <p class="treasure-continue">Keep hunting for more chances! Find ${count + 1} for ${this.config.thresholds[count + 1] || entries} entries</p>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  modal.querySelector('#treasureSubmitForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    this.submitEntry(email, count, modal);
  });
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.add('treasure-modal-exit');
      setTimeout(() => modal.remove(), 300);
    }
  });
},

showMilestoneModal(count) {
  // Always show milestone celebration, whether submitted or not
  const entries = this.config.thresholds[count];
  const isSubmitted = this.state.submitted;
  
  const modal = document.createElement('div');
  modal.className = 'treasure-modal';
  
  if (isSubmitted) {
    // They already submitted, show upgrade message
    modal.innerHTML = `
      <div class="treasure-modal-content treasure-modal-enter">
        <div class="treasure-confetti">✨</div>
        <h2>Entry upgraded!</h2>
        <p>You've found <strong>${count} treasures</strong>!</p>
        <p class="treasure-highlight">Your entry has been upgraded to <strong>${entries} chances</strong> to win! 🏆</p>
        ${count < this.config.totalTreasures ? 
          `<p class="treasure-continue">Keep hunting! ${this.config.totalTreasures - count} more to go</p>` : 
          `<p class="treasure-continue">You've found them all! Amazing! 🎉</p>`}
        <button class="treasure-btn treasure-btn-primary">Keep hunting</button>
      </div>
    `;
  } else {
    // Haven't submitted yet, show submission form
    modal.innerHTML = `
      <div class="treasure-modal-content treasure-modal-enter">
        <div class="treasure-confetti">🎉</div>
        <h2>Excellent work!</h2>
        <p>You've found <strong>${count} treasures</strong>!</p>
        <p class="treasure-highlight">You now have <strong>${entries} ${entries === 1 ? 'entry' : 'entries'}</strong> to win!</p>
        <form class="treasure-form" id="treasureMilestoneForm">
          <input type="email" name="email" placeholder="Enter your email" required />
          <button type="submit" class="treasure-btn treasure-btn-primary">Enter draw (${entries} ${entries === 1 ? 'chance' : 'chances'})</button>
        </form>
        ${count < this.config.totalTreasures ? 
          `<p class="treasure-continue">Or keep hunting for ${count + 1} to get ${this.config.thresholds[count + 1] || entries} entries!</p>` : 
          ''}
      </div>
    `;
  }
  
  document.body.appendChild(modal);
  
  // Setup event listeners
  const closeBtn = modal.querySelector('.treasure-btn-primary');
  if (closeBtn && isSubmitted) {
    closeBtn.addEventListener('click', () => {
      modal.classList.add('treasure-modal-exit');
      setTimeout(() => modal.remove(), 300);
    });
  }
  
  const form = modal.querySelector('#treasureMilestoneForm');
  if (form && !isSubmitted) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = e.target.email.value;
      this.submitEntry(email, count, modal);
    });
  }
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.add('treasure-modal-exit');
      setTimeout(() => modal.remove(), 300);
    }
  });
},

showCompletionModal() {
  const entries = this.config.thresholds[this.config.totalTreasures];
  
  const modal = document.createElement('div');
  modal.className = 'treasure-modal';
  modal.innerHTML = `
    <div class="treasure-modal-content treasure-modal-enter">
      <div class="treasure-confetti">🏆🎉✨</div>
      <h2>You're a legend!</h2>
      <p>You found all <strong>${this.config.totalTreasures} treasures</strong>!</p>
      <p class="treasure-highlight">You have the maximum <strong>${entries} chances</strong> to win! 🎊</p>
      ${!this.state.submitted ? `
        <form class="treasure-form" id="treasureCompleteForm">
          <input type="email" name="email" placeholder="Enter your email" required />
          <button type="submit" class="treasure-btn treasure-btn-primary">Claim ${entries} entries</button>
        </form>
      ` : `
        <p>Good luck in the draw! 🍀</p>
      `}
    </div>
  `;
  
  document.body.appendChild(modal);
  
  if (!this.state.submitted) {
    modal.querySelector('#treasureCompleteForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const email = e.target.email.value;
      this.submitEntry(email, this.config.totalTreasures, modal);
    });
  }
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.add('treasure-modal-exit');
      setTimeout(() => modal.remove(), 300);
    }
  });
},

async submitEntry(email, treasuresFound, modal) {
  const entries = this.config.thresholds[treasuresFound];
  const submitData = {
    email,
    treasuresFound,
    entries,
    totalTreasures: this.config.totalTreasures,
    timeSpent: this.state.startTime ? Math.floor((Date.now() - this.state.startTime) / 1000) : null,
    timestamp: new Date().toISOString(),
    treasureIds: this.state.found
  };

  try {
    // Show loading state
    const submitBtn = modal.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Submitting...';
    submitBtn.disabled = true;
    
    const response = await fetch(this.config.submitEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(submitData)
    });

    if (response.ok) {
      this.state.submitted = true;
      this.saveProgress();
      
      // Show success
      modal.querySelector('.treasure-modal-content').innerHTML = `
        <div class="treasure-confetti">✅</div>
        <h2>You're entered!</h2>
        <p>Thanks for playing! You have <strong>${entries} ${entries === 1 ? 'entry' : 'entries'}</strong> in the prize draw.</p>
        <p class="treasure-highlight">Good luck! 🍀</p>
        ${treasuresFound < this.config.totalTreasures ? 
          `<p class="treasure-continue">Keep hunting to increase your chances!</p>
          <button class="treasure-btn treasure-btn-primary">Keep hunting</button>` :
          `<button class="treasure-btn treasure-btn-primary">Close</button>`
        }
      `;
      
      modal.querySelector('.treasure-btn-primary').addEventListener('click', () => {
        modal.classList.add('treasure-modal-exit');
        setTimeout(() => modal.remove(), 300);
      });
    } else {
      throw new Error('Submission failed');
    }
  } catch (error) {
    console.error('Error submitting entry:', error);
    alert('Sorry, there was an error submitting your entry. Please try again.');
    const submitBtn = modal.querySelector('button[type="submit"]');
    submitBtn.textContent = `Enter draw (${entries} ${entries === 1 ? 'chance' : 'chances'})`;
    submitBtn.disabled = false;
  }
},

setupNavigationListener() {
  // For SPAs, listen for URL changes and re-scan for treasures
  let lastUrl = location.href;
  
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      setTimeout(() => {
        if (this.config.mode === 'auto') {
          this.autoPlaceTreasures();
        } else {
          this.setupManualTreasures();
        }
      }, 500);
    }
  }).observe(document, { subtree: true, childList: true });
  
  // Also listen for popstate
  window.addEventListener('popstate', () => {
    setTimeout(() => {
      if (this.config.mode === 'auto') {
        this.autoPlaceTreasures();
      } else {
        this.setupManualTreasures();
      }
    }, 500);
  });
},

saveProgress() {
  const data = {
    found: this.state.found,
    submitted: this.state.submitted,
    startTime: this.state.startTime
  };
  localStorage.setItem(this.config.storageKey, JSON.stringify(data));
},

loadProgress() {
  const saved = localStorage.getItem(this.config.storageKey);
  if (saved) {
    const data = JSON.parse(saved);
    this.state = { ...this.state, ...data };
  }
},

injectStyles() {
  const styles = `
    .treasure-hunt-clickable {
      cursor: pointer;
      position: relative;
      display: inline-block;
      animation: treasure-glow 2s ease-in-out infinite;
      transition: transform 0.2s ease;
      user-select: none;
    }
    
    .treasure-hunt-clickable:hover {
      transform: scale(1.2);
    }
    
    .treasure-collecting {
      animation: treasure-collect 0.6s ease-out forwards !important;
    }
    
    .treasure-found {
      opacity: 0.3;
      cursor: default;
      animation: none !important;
    }
    
    @keyframes treasure-glow {
      0%, 100% { 
        filter: drop-shadow(0 0 2px ${this.config.brandColors.accent}) 
                drop-shadow(0 0 4px ${this.config.brandColors.accent});
      }
      50% { 
        filter: drop-shadow(0 0 8px ${this.config.brandColors.accent}) 
                drop-shadow(0 0 12px ${this.config.brandColors.accent});
      }
    }
    
    @keyframes treasure-collect {
      0% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.5) rotate(180deg); }
      100% { transform: scale(0) rotate(360deg); opacity: 0; }
    }
    
    .treasure-particle {
      position: fixed;
      font-size: 24px;
      pointer-events: none;
      z-index: 10000;
      transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .treasure-tracker {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: white;
      padding: 16px 20px;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.12);
      z-index: 9999;
      min-width: 180px;
      transition: transform 0.3s ease;
    }
    
    .treasure-tracker-pulse {
      animation: tracker-pulse 0.6s ease;
    }
    
    @keyframes tracker-pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
    
    .treasure-tracker-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
    }
    
    .treasure-tracker-emoji {
      font-size: 28px;
    }
    
    .treasure-tracker-count {
      font-size: 18px;
      font-weight: 700;
      color: #333;
    }
    
    .treasure-tracker-progress {
      height: 8px;
      background: #f0f0f0;
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 8px;
    }
    
    .treasure-tracker-bar {
      height: 100%;
      background: linear-gradient(90deg, ${this.config.brandColors.primary}, ${this.config.brandColors.accent});
      border-radius: 4px;
      transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .treasure-tracker-entries {
      text-align: center;
    }
    
    .entries-text {
      font-size: 12px;
      color: #666;
      font-weight: 500;
    }
    
    .entries-active {
      color: ${this.config.brandColors.primary};
      font-weight: 700;
    }
    
    .treasure-modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      padding: 20px;
    }
    
    .treasure-modal-content {
      background: white;
      padding: 40px;
      border-radius: 24px;
      max-width: 500px;
      width: 100%;
      text-align: center;
      position: relative;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    
    .treasure-modal-enter {
      animation: modal-enter 0.3s ease-out;
    }
    
    .treasure-modal-exit .treasure-modal-content {
      animation: modal-exit 0.3s ease-in;
    }
    
    @keyframes modal-enter {
      from {
        opacity: 0;
        transform: translateY(30px) scale(0.9);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
    
    @keyframes modal-exit {
      from {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
      to {
        opacity: 0;
        transform: translateY(-30px) scale(0.9);
      }
    }
    
    .treasure-modal-close {
      position: absolute;
      top: 16px;
      right: 16px;
      background: none;
      border: none;
      font-size: 32px;
      cursor: pointer;
      color: #999;
      line-height: 1;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: all 0.2s;
    }
    
    .treasure-modal-close:hover {
      background: #f0f0f0;
      color: #333;
    }
    
    .treasure-modal-emoji-big {
      font-size: 64px;
      margin-bottom: 16px;
    }
    
    .treasure-confetti {
      font-size: 48px;
      margin-bottom: 16px;
      animation: confetti-pop 0.6s ease-out;
    }
    
    @keyframes confetti-pop {
      0% { transform: scale(0) rotate(0deg); }
      50% { transform: scale(1.2) rotate(180deg); }
      100% { transform: scale(1) rotate(360deg); }
    }
    
    .treasure-modal h2 {
      font-size: 32px;
      font-weight: 700;
      color: #222;
      margin: 0 0 16px 0;
    }
    
    .treasure-modal p {
      font-size: 16px;
      color: #666;
      margin: 0 0 16px 0;
      line-height: 1.6;
    }
    
    .treasure-highlight {
      font-size: 18px;
      color: ${this.config.brandColors.primary};
      font-weight: 600;
    }
    
    .treasure-continue {
      font-size: 14px;
      color: #999;
      margin-top: 16px;
    }
    
    .treasure-modal-rewards {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin: 24px 0;
      padding: 20px;
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      border-radius: 12px;
    }
    
    .reward-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }
    
    .reward-count {
      font-weight: 600;
      color: #333;
    }
    
    .reward-value {
      font-weight: 700;
      color: ${this.config.brandColors.primary};
    }
    
    .treasure-hint {
      font-size: 14px;
      color: #999;
      font-style: italic;
      margin-top: 8px;
    }
    
    .treasure-form {
      margin: 24px 0;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .treasure-form input {
      padding: 14px 16px;
      font-size: 16px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      outline: none;
      transition: border-color 0.2s;
    }
    
    .treasure-form input:focus {
      border-color: ${this.config.brandColors.primary};
    }
    
    .treasure-btn {
      padding: 14px 28px;
      font-size: 16px;
      font-weight: 600;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      outline: none;
    }
    
    .treasure-btn-primary {
      background: linear-gradient(135deg, ${this.config.brandColors.primary}, ${this.config.brandColors.secondary});
      color: white;
    }
    
    .treasure-btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(0,0,0,0.2);
    }
    
    .treasure-btn-primary:active {
      transform: translateY(0);
    }
    
    .treasure-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none !important;
    }
    
    @media (max-width: 768px) {
      .treasure-tracker {
        bottom: 10px;
        right: 10px;
        padding: 12px 16px;
        min-width: 150px;
      }
      
      .treasure-modal-content {
        padding: 30px 20px;
      }
      
      .treasure-modal h2 {
        font-size: 24px;
      }
    }
  `;
  
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}
```

};

// Expose globally
window.TreasureHunt = TreasureHunt;
})();