/**

- Treasure Hunt Widget v2.0
- Embeddable treasure hunt game for employee engagement
- Built by Mercer Impact Team
  */

(function() {
‘use strict’;

const TreasureHunt = {
config: {
mode: ‘manual’,
theme: ‘easter-eggs’,
totalTreasures: 5,
treasureEmoji: ‘🥚’,
thresholds: {
3: 1,
4: 2,
5: 5
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
  isInitialized: false
},

init: function(userConfig) {
  if (this.state.isInitialized) {
    console.log('TreasureHunt already initialized');
    return;
  }

  this.config = Object.assign({}, this.config, userConfig || {});
  
  const self = this;
  
  function startInit() {
    self.loadProgress();
    
    if (self.config.mode === 'auto') {
      self.autoPlaceTreasures();
    } else {
      self.setupManualTreasures();
    }
    
    self.createTracker();
    self.createWelcomeModal();
    self.injectStyles();
    self.setupNavigationListener();
    
    self.state.isInitialized = true;
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startInit);
  } else {
    startInit();
  }
},

setupManualTreasures: function() {
  const treasures = document.querySelectorAll('[data-treasure], .treasure-hunt-item');
  const self = this;
  
  treasures.forEach(function(treasure, index) {
    const id = treasure.getAttribute('data-treasure') || 'treasure-' + index;
    treasure.setAttribute('data-treasure-id', id);
    treasure.classList.add('treasure-hunt-clickable');
    
    if (self.state.found.indexOf(id) > -1) {
      treasure.classList.add('treasure-found');
    } else {
      treasure.addEventListener('click', function(e) {
        self.collectTreasure(e, id);
      });
    }
  });
},

autoPlaceTreasures: function() {
  const existingTreasures = document.querySelectorAll('.treasure-hunt-auto');
  existingTreasures.forEach(function(t) {
    t.remove();
  });
  
  const preferredElements = document.querySelectorAll(this.config.preferSelectors);
  const excludedElements = document.querySelectorAll(this.config.excludeSelectors);
  const self = this;
  
  const validSpots = Array.from(preferredElements).filter(function(el) {
    let current = el;
    while (current) {
      if (Array.from(excludedElements).indexOf(current) > -1) {
        return false;
      }
      current = current.parentElement;
    }
    
    const text = el.textContent.trim();
    return text.length > 20 && el.offsetParent !== null;
  });

  const maxTreasures = Math.min(this.config.totalTreasures, validSpots.length, 10);
  const shuffled = validSpots.sort(function() { return Math.random() - 0.5; });
  const selectedSpots = shuffled.slice(0, maxTreasures);
  
  selectedSpots.forEach(function(spot, index) {
    const id = 'auto-treasure-' + index;
    const treasure = document.createElement('span');
    treasure.className = 'treasure-hunt-item treasure-hunt-auto treasure-hunt-clickable';
    treasure.setAttribute('data-treasure-id', id);
    treasure.textContent = self.config.treasureEmoji;
    
    const textNode = self.getRandomTextNode(spot);
    if (textNode) {
      const range = document.createRange();
      const position = Math.floor(Math.random() * textNode.textContent.length);
      range.setStart(textNode, position);
      range.insertNode(treasure);
      
      if (self.state.found.indexOf(id) === -1) {
        treasure.addEventListener('click', function(e) {
          self.collectTreasure(e, id);
        });
      } else {
        treasure.classList.add('treasure-found');
      }
    }
  });
},

getRandomTextNode: function(element) {
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        return node.textContent.trim().length > 0 ? 
          NodeFilter.FILTER_ACCEPT : 
          NodeFilter.FILTER_REJECT;
      }
    }
  );
  
  const textNodes = [];
  let node;
  while ((node = walker.nextNode())) {
    textNodes.push(node);
  }
  
  return textNodes.length > 0 ? 
    textNodes[Math.floor(Math.random() * textNodes.length)] : 
    null;
},

collectTreasure: function(event, treasureId) {
  event.preventDefault();
  event.stopPropagation();
  
  if (this.state.found.indexOf(treasureId) > -1) return;
  
  const treasure = event.currentTarget;
  this.state.found.push(treasureId);
  treasure.classList.add('treasure-found', 'treasure-collecting');
  
  this.createCollectionEffect(treasure);
  this.updateTracker();
  this.saveProgress();
  this.checkMilestone();
  
  const self = this;
  setTimeout(function() {
    treasure.classList.remove('treasure-collecting');
  }, 600);
},

createCollectionEffect: function(element) {
  const rect = element.getBoundingClientRect();
  const particle = document.createElement('div');
  particle.className = 'treasure-particle';
  particle.textContent = this.config.treasureEmoji;
  particle.style.left = rect.left + rect.width / 2 + 'px';
  particle.style.top = rect.top + rect.height / 2 + 'px';
  
  document.body.appendChild(particle);
  
  const tracker = document.querySelector('.treasure-tracker');
  const trackerRect = tracker.getBoundingClientRect();
  
  setTimeout(function() {
    particle.style.transform = 'translate(' + (trackerRect.left - rect.left) + 'px, ' + (trackerRect.top - rect.top) + 'px) scale(0.5)';
    particle.style.opacity = '0';
  }, 50);
  
  setTimeout(function() {
    particle.remove();
  }, 800);
},

checkMilestone: function() {
  const count = this.state.found.length;
  const threshold = this.config.minThreshold;
  const self = this;
  
  if (count === threshold && !this.state.submitted) {
    setTimeout(function() {
      self.showSubmissionModal(count);
    }, 800);
  } else if (count > threshold && this.config.thresholds[count]) {
    setTimeout(function() {
      self.showMilestoneModal(count);
    }, 800);
  } else if (count === this.config.totalTreasures) {
    setTimeout(function() {
      self.showCompletionModal();
    }, 800);
  }
},

createTracker: function() {
  const tracker = document.createElement('div');
  tracker.className = 'treasure-tracker';
  tracker.innerHTML = '<div class="treasure-tracker-header">' +
    '<span class="treasure-tracker-emoji">' + this.config.treasureEmoji + '</span>' +
    '<span class="treasure-tracker-count">0/' + this.config.totalTreasures + '</span>' +
    '</div>' +
    '<div class="treasure-tracker-progress">' +
    '<div class="treasure-tracker-bar"></div>' +
    '</div>' +
    '<div class="treasure-tracker-entries">' +
    '<span class="entries-text">Find ' + this.config.minThreshold + ' to enter!</span>' +
    '</div>';
  
  document.body.appendChild(tracker);
  this.updateTracker();
  
  const self = this;
  let tapTimer = null;
  
  tracker.addEventListener('click', function(e) {
    clearTimeout(tapTimer);
    tapTimer = setTimeout(function() {
      if (!tracker.classList.contains('tracker-dragging')) {
        const count = self.state.found.length;
        if (count >= self.config.minThreshold && self.config.thresholds[count]) {
          self.showMilestoneModal(count);
        }
      }
    }, 200);
  });
  
  this.makeTrackerDraggable(tracker);
},

makeTrackerDraggable: function(tracker) {
  let isDragging = false;
  let hasMoved = false;
  let currentX, currentY, initialX, initialY;
  
  tracker.addEventListener('touchstart', function(e) {
    initialX = e.touches[0].clientX;
    initialY = e.touches[0].clientY;
    isDragging = true;
    hasMoved = false;
  });
  
  tracker.addEventListener('touchmove', function(e) {
    if (isDragging) {
      e.preventDefault();
      hasMoved = true;
      tracker.classList.add('tracker-dragging');
      currentX = e.touches[0].clientX - initialX;
      currentY = e.touches[0].clientY - initialY;
      tracker.style.transform = 'translate(' + currentX + 'px, ' + currentY + 'px)';
    }
  });
  
  tracker.addEventListener('touchend', function() {
    isDragging = false;
    setTimeout(function() {
      tracker.classList.remove('tracker-dragging');
    }, 200);
  });
},

updateTracker: function() {
  const count = this.state.found.length;
  const total = this.config.totalTreasures;
  const percentage = (count / total) * 100;
  
  const countEl = document.querySelector('.treasure-tracker-count');
  const barEl = document.querySelector('.treasure-tracker-bar');
  const entriesEl = document.querySelector('.entries-text');
  
  if (!countEl || !barEl || !entriesEl) return;
  
  countEl.textContent = count + '/' + total;
  barEl.style.width = percentage + '%';
  
  if (count < this.config.minThreshold) {
    entriesEl.textContent = 'Find ' + this.config.minThreshold + ' to enter!';
    entriesEl.classList.remove('entries-active');
  } else if (this.config.thresholds[count]) {
    const entries = this.config.thresholds[count];
    entriesEl.textContent = entries + (entries === 1 ? ' entry' : ' entries') + ' to win! 🎉';
    entriesEl.classList.add('entries-active');
  }
  
  const tracker = document.querySelector('.treasure-tracker');
  tracker.classList.add('treasure-tracker-pulse');
  setTimeout(function() {
    tracker.classList.remove('treasure-tracker-pulse');
  }, 600);
},

createWelcomeModal: function() {
  if (this.state.found.length > 0) return;
  
  const modal = document.createElement('div');
  modal.className = 'treasure-modal treasure-welcome-modal';
  const self = this;
  
  modal.innerHTML = '<div class="treasure-modal-content treasure-modal-enter">' +
    '<button class="treasure-modal-close">&times;</button>' +
    '<div class="treasure-modal-emoji-big">' + this.config.treasureEmoji + '</div>' +
    '<h2>Treasure hunt!</h2>' +
    '<p>There are <strong>' + this.config.totalTreasures + ' hidden treasures</strong> scattered across this page. Can you find them all?</p>' +
    '<div class="treasure-modal-rewards">' +
    '<div class="reward-item">' +
    '<span class="reward-count">3 treasures</span>' +
    '<span class="reward-value">1 entry to win</span>' +
    '</div>' +
    '<div class="reward-item">' +
    '<span class="reward-count">4 treasures</span>' +
    '<span class="reward-value">2 entries to win</span>' +
    '</div>' +
    '<div class="reward-item">' +
    '<span class="reward-count">5 treasures</span>' +
    '<span class="reward-value">5 entries to win!</span>' +
    '</div>' +
    '</div>' +
    '<p class="treasure-hint">Look for glowing ' + this.config.treasureEmoji + ' icons hidden in the content!</p>' +
    '<button class="treasure-btn treasure-btn-primary">Start hunting</button>' +
    '</div>';
  
  document.body.appendChild(modal);
  
  modal.querySelector('.treasure-btn-primary').addEventListener('click', function() {
    self.state.startTime = Date.now();
    self.saveProgress();
    modal.classList.add('treasure-modal-exit');
    setTimeout(function() {
      modal.remove();
    }, 300);
  });
  
  modal.querySelector('.treasure-modal-close').addEventListener('click', function() {
    modal.classList.add('treasure-modal-exit');
    setTimeout(function() {
      modal.remove();
    }, 300);
  });
  
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      modal.classList.add('treasure-modal-exit');
      setTimeout(function() {
        modal.remove();
      }, 300);
    }
  });
},

showSubmissionModal: function(count) {
  const entries = this.config.thresholds[count];
  const nextCount = count + 1;
  const nextEntries = this.config.thresholds[nextCount];
  const self = this;
  
  const modal = document.createElement('div');
  modal.className = 'treasure-modal';
  
  modal.innerHTML = '<div class="treasure-modal-content treasure-modal-enter">' +
    '<div class="treasure-confetti">🎉</div>' +
    '<h2>Great work!</h2>' +
    '<p>You\'ve found <strong>' + count + ' treasures</strong> and unlocked entry to the prize draw!</p>' +
    '<p class="treasure-highlight">You have <strong>' + entries + (entries === 1 ? ' entry' : ' entries') + '</strong> to win</p>' +
    '<form class="treasure-form" id="treasureSubmitForm">' +
    '<input type="email" name="email" placeholder="Enter your email" required />' +
    '<button type="submit" class="treasure-btn treasure-btn-primary">Enter draw (' + entries + (entries === 1 ? ' chance' : ' chances') + ')</button>' +
    '</form>' +
    (nextEntries ? '<p class="treasure-continue">Keep hunting for more chances! Find ' + nextCount + ' for ' + nextEntries + ' entries</p>' : '') +
    '</div>';
  
  document.body.appendChild(modal);
  
  modal.querySelector('#treasureSubmitForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const email = e.target.email.value;
    self.submitEntry(email, count, modal);
  });
  
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      modal.classList.add('treasure-modal-exit');
      setTimeout(function() {
        modal.remove();
      }, 300);
    }
  });
},

showMilestoneModal: function(count) {
  const entries = this.config.thresholds[count];
  const isSubmitted = this.state.submitted;
  const self = this;
  
  const modal = document.createElement('div');
  modal.className = 'treasure-modal';
  
  if (isSubmitted) {
    const remaining = this.config.totalTreasures - count;
    modal.innerHTML = '<div class="treasure-modal-content treasure-modal-enter">' +
      '<div class="treasure-confetti">✨</div>' +
      '<h2>Entry upgraded!</h2>' +
      '<p>You\'ve found <strong>' + count + ' treasures</strong>!</p>' +
      '<p class="treasure-highlight">Your entry has been upgraded to <strong>' + entries + ' chances</strong> to win! 🏆</p>' +
      (remaining > 0 ? '<p class="treasure-continue">Keep hunting! ' + remaining + ' more to go</p>' : '<p class="treasure-continue">You\'ve found them all! Amazing! 🎉</p>') +
      '<button class="treasure-btn treasure-btn-primary">Keep hunting</button>' +
      '</div>';
  } else {
    const nextCount = count + 1;
    const nextEntries = this.config.thresholds[nextCount];
    modal.innerHTML = '<div class="treasure-modal-content treasure-modal-enter">' +
      '<div class="treasure-confetti">🎉</div>' +
      '<h2>Excellent work!</h2>' +
      '<p>You\'ve found <strong>' + count + ' treasures</strong>!</p>' +
      '<p class="treasure-highlight">You now have <strong>' + entries + (entries === 1 ? ' entry' : ' entries') + '</strong> to win!</p>' +
      '<form class="treasure-form" id="treasureMilestoneForm">' +
      '<input type="email" name="email" placeholder="Enter your email" required />' +
      '<button type="submit" class="treasure-btn treasure-btn-primary">Enter draw (' + entries + (entries === 1 ? ' chance' : ' chances') + ')</button>' +
      '</form>' +
      (nextEntries ? '<p class="treasure-continue">Or keep hunting for ' + nextCount + ' to get ' + nextEntries + ' entries!</p>' : '') +
      '</div>';
  }
  
  document.body.appendChild(modal);
  
  const closeBtn = modal.querySelector('.treasure-btn-primary');
  if (closeBtn && isSubmitted) {
    closeBtn.addEventListener('click', function() {
      modal.classList.add('treasure-modal-exit');
      setTimeout(function() {
        modal.remove();
      }, 300);
    });
  }
  
  const form = modal.querySelector('#treasureMilestoneForm');
  if (form && !isSubmitted) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      const email = e.target.email.value;
      self.submitEntry(email, count, modal);
    });
  }
  
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      modal.classList.add('treasure-modal-exit');
      setTimeout(function() {
        modal.remove();
      }, 300);
    }
  });
},

showCompletionModal: function() {
  const entries = this.config.thresholds[this.config.totalTreasures];
  const self = this;
  
  const modal = document.createElement('div');
  modal.className = 'treasure-modal';
  
  const formHtml = !this.state.submitted ? 
    '<form class="treasure-form" id="treasureCompleteForm">' +
    '<input type="email" name="email" placeholder="Enter your email" required />' +
    '<button type="submit" class="treasure-btn treasure-btn-primary">Claim ' + entries + ' entries</button>' +
    '</form>' : 
    '<p>Good luck in the draw! 🍀</p>';
  
  modal.innerHTML = '<div class="treasure-modal-content treasure-modal-enter">' +
    '<div class="treasure-confetti">🏆🎉✨</div>' +
    '<h2>You\'re a legend!</h2>' +
    '<p>You found all <strong>' + this.config.totalTreasures + ' treasures</strong>!</p>' +
    '<p class="treasure-highlight">You have the maximum <strong>' + entries + ' chances</strong> to win! 🎊</p>' +
    formHtml +
    '</div>';
  
  document.body.appendChild(modal);
  
  if (!this.state.submitted) {
    modal.querySelector('#treasureCompleteForm').addEventListener('submit', function(e) {
      e.preventDefault();
      const email = e.target.email.value;
      self.submitEntry(email, self.config.totalTreasures, modal);
    });
  }
  
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      modal.classList.add('treasure-modal-exit');
      setTimeout(function() {
        modal.remove();
      }, 300);
    }
  });
},

submitEntry: function(email, treasuresFound, modal) {
  const entries = this.config.thresholds[treasuresFound];
  const self = this;
  const submitData = {
    email: email,
    treasuresFound: treasuresFound,
    entries: entries,
    totalTreasures: this.config.totalTreasures,
    timeSpent: this.state.startTime ? Math.floor((Date.now() - this.state.startTime) / 1000) : null,
    timestamp: new Date().toISOString(),
    treasureIds: this.state.found
  };

  const submitBtn = modal.querySelector('button[type="submit"]');
  submitBtn.textContent = 'Submitting...';
  submitBtn.disabled = true;
  
  fetch(this.config.submitEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(submitData)
  })
  .then(function(response) {
    if (response.ok) {
      return response.json();
    }
    throw new Error('Submission failed');
  })
  .then(function() {
    self.state.submitted = true;
    self.saveProgress();
    
    const remaining = self.config.totalTreasures - treasuresFound;
    const continueHtml = remaining > 0 ? 
      '<p class="treasure-continue">Keep hunting to increase your chances!</p>' +
      '<button class="treasure-btn treasure-btn-primary">Keep hunting</button>' :
      '<button class="treasure-btn treasure-btn-primary">Close</button>';
    
    modal.querySelector('.treasure-modal-content').innerHTML = 
      '<div class="treasure-confetti">✅</div>' +
      '<h2>You\'re entered!</h2>' +
      '<p>Thanks for playing! You have <strong>' + entries + (entries === 1 ? ' entry' : ' entries') + '</strong> in the prize draw.</p>' +
      '<p class="treasure-highlight">Good luck! 🍀</p>' +
      continueHtml;
    
    modal.querySelector('.treasure-btn-primary').addEventListener('click', function() {
      modal.classList.add('treasure-modal-exit');
      setTimeout(function() {
        modal.remove();
      }, 300);
    });
  })
  .catch(function(error) {
    console.error('Error submitting entry:', error);
    alert('Sorry, there was an error submitting your entry. Please try again.');
    submitBtn.textContent = 'Enter draw (' + entries + (entries === 1 ? ' chance' : ' chances') + ')';
    submitBtn.disabled = false;
  });
},

setupNavigationListener: function() {
  let lastUrl = location.href;
  const self = this;
  
  new MutationObserver(function() {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      setTimeout(function() {
        if (self.config.mode === 'auto') {
          self.autoPlaceTreasures();
        } else {
          self.setupManualTreasures();
        }
      }, 500);
    }
  }).observe(document, { subtree: true, childList: true });
  
  window.addEventListener('popstate', function() {
    setTimeout(function() {
      if (self.config.mode === 'auto') {
        self.autoPlaceTreasures();
      } else {
        self.setupManualTreasures();
      }
    }, 500);
  });
},

saveProgress: function() {
  const data = {
    found: this.state.found,
    submitted: this.state.submitted,
    startTime: this.state.startTime
  };
  try {
    localStorage.setItem(this.config.storageKey, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving progress:', e);
  }
},

loadProgress: function() {
  try {
    const saved = localStorage.getItem(this.config.storageKey);
    if (saved) {
      const data = JSON.parse(saved);
      this.state.found = data.found || [];
      this.state.submitted = data.submitted || false;
      this.state.startTime = data.startTime || null;
    }
  } catch (e) {
    console.error('Error loading progress:', e);
  }
},

injectStyles: function() {
  if (document.getElementById('treasure-hunt-styles')) return;
  
  const primary = this.config.brandColors.primary;
  const secondary = this.config.brandColors.secondary;
  const accent = this.config.brandColors.accent;
  
  const styles = '.treasure-hunt-clickable{cursor:pointer;position:relative;display:inline-block;animation:treasure-glow 2s ease-in-out infinite;transition:transform .2s ease;user-select:none}.treasure-hunt-clickable:hover{transform:scale(1.2)}.treasure-collecting{animation:treasure-collect .6s ease-out forwards!important}.treasure-found{opacity:.3;cursor:default;animation:none!important}@keyframes treasure-glow{0%,100%{filter:drop-shadow(0 0 2px ' + accent + ') drop-shadow(0 0 4px ' + accent + ')}50%{filter:drop-shadow(0 0 8px ' + accent + ') drop-shadow(0 0 12px ' + accent + ')}}@keyframes treasure-collect{0%{transform:scale(1);opacity:1}50%{transform:scale(1.5) rotate(180deg)}100%{transform:scale(0) rotate(360deg);opacity:0}}.treasure-particle{position:fixed;font-size:24px;pointer-events:none;z-index:10000;transition:all .8s cubic-bezier(.4,0,.2,1)}.treasure-tracker{position:fixed;bottom:20px;right:20px;background:#fff;padding:16px 20px;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,.12);z-index:9999;min-width:180px;transition:transform .3s ease}.treasure-tracker-pulse{animation:tracker-pulse .6s ease}@keyframes tracker-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}.treasure-tracker-header{display:flex;align-items:center;gap:10px;margin-bottom:8px}.treasure-tracker-emoji{font-size:28px}.treasure-tracker-count{font-size:18px;font-weight:700;color:#333}.treasure-tracker-progress{height:8px;background:#f0f0f0;border-radius:4px;overflow:hidden;margin-bottom:8px}.treasure-tracker-bar{height:100%;background:linear-gradient(90deg,' + primary + ',' + accent + ');border-radius:4px;transition:width .5s cubic-bezier(.4,0,.2,1)}.treasure-tracker-entries{text-align:center}.entries-text{font-size:12px;color:#666;font-weight:500}.entries-active{color:' + primary + ';font-weight:700}.treasure-modal{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.7);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;z-index:10000;padding:20px}.treasure-modal-content{background:#fff;padding:40px;border-radius:24px;max-width:500px;width:100%;text-align:center;position:relative;box-shadow:0 20px 60px rgba(0,0,0,.3)}.treasure-modal-enter{animation:modal-enter .3s ease-out}.treasure-modal-exit .treasure-modal-content{animation:modal-exit .3s ease-in}@keyframes modal-enter{from{opacity:0;transform:translateY(30px) scale(.9)}to{opacity:1;transform:translateY(0) scale(1)}}@keyframes modal-exit{from{opacity:1;transform:translateY(0) scale(1)}to{opacity:0;transform:translateY(-30px) scale(.9)}}.treasure-modal-close{position:absolute;top:16px;right:16px;background:0 0;border:none;font-size:32px;cursor:pointer;color:#999;line-height:1;width:32px;height:32px;display:flex;align-items:center;justify-content:center;border-radius:50%;transition:all .2s}.treasure-modal-close:hover{background:#f0f0f0;color:#333}.treasure-modal-emoji-big{font-size:64px;margin-bottom:16px}.treasure-confetti{font-size:48px;margin-bottom:16px;animation:confetti-pop .6s ease-out}@keyframes confetti-pop{0%{transform:scale(0) rotate(0)}50%{transform:scale(1.2) rotate(180deg)}100%{transform:scale(1) rotate(360deg)}}.treasure-modal h2{font-size:32px;font-weight:700;color:#222;margin:0 0 16px}.treasure-modal p{font-size:16px;color:#666;margin:0 0 16px;line-height:1.6}.treasure-highlight{font-size:18px;color:' + primary + ';font-weight:600}.treasure-continue{font-size:14px;color:#999;margin-top:16px}.treasure-modal-rewards{display:flex;flex-direction:column;gap:12px;margin:24px 0;padding:20px;background:linear-gradient(135deg,#f8f9fa 0,#e9ecef 100%);border-radius:12px}.reward-item{display:flex;justify-content:space-between;align-items:center;padding:12px;background:#fff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.05)}.reward-count{font-weight:600;color:#333}.reward-value{font-weight:700;color:' + primary + '}.treasure-hint{font-size:14px;color:#999;font-style:italic;margin-top:8px}.treasure-form{margin:24px 0;display:flex;flex-direction:column;gap:12px}.treasure-form input{padding:14px 16px;font-size:16px;border:2px solid #e0e0e0;border-radius:8px;outline:0;transition:border-color .2s}.treasure-form input:focus{border-color:' + primary + '}.treasure-btn{padding:14px 28px;font-size:16px;font-weight:600;border:none;border-radius:8px;cursor:pointer;transition:all .2s;outline:0}.treasure-btn-primary{background:linear-gradient(135deg,' + primary + ',' + secondary + ');color:#fff}.treasure-btn-primary:hover{transform:translateY(-2px);box-shadow:0 8px 20px rgba(0,0,0,.2)}.treasure-btn-primary:active{transform:translateY(0)}.treasure-btn:disabled{opacity:.6;cursor:not-allowed;transform:none!important}@media (max-width:768px){.treasure-tracker{bottom:10px;right:10px;padding:12px 16px;min-width:150px}.treasure-modal-content{padding:30px 20px}.treasure-modal h2{font-size:24px}}';
  
  const styleSheet = document.createElement('style');
  styleSheet.id = 'treasure-hunt-styles';
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}
```

};

window.TreasureHunt = TreasureHunt;
})();