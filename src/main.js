// JuiceBox Limited Edition Builder - Main App

import { fruits, extras, primaryFlavors, accents, variants } from './data/flavors.js';
import { supabase, getCreations, createCreation, updateCreationImage, voteForCreation, getVisitorIp, hasVoted, generateCreationImage, getVotedCreationIds } from './lib/supabase.js';

// Constants
const MAX_PRIMARY_FLAVORS = 3;

// State
const state = {
  primaryFlavors: [], // Array of selected flavor IDs (max 3)
  accent: 'none',
  variant: 'original',
  visitorIp: null,
  votedFor: new Set(),
  creations: [],
  offset: 0,
  limit: 10,
  justCreatedId: null, // ID of the creation just submitted (for highlighting)
};

// DOM Elements
const elements = {
  tabs: document.querySelectorAll('.tab'),
  sections: document.querySelectorAll('.section'),
  fruitsGrid: document.getElementById('fruits-grid'),
  extrasGrid: document.getElementById('extras-grid'),
  accentsGrid: document.getElementById('accents'),
  variantGroup: document.getElementById('variant'),
  counterFill: document.getElementById('counter-fill'),
  previewEmoji: document.getElementById('preview-emoji'),
  previewName: document.getElementById('preview-name'),
  previewTags: document.getElementById('preview-tags'),
  primaryCounter: document.getElementById('primary-counter'),
  counterText: document.getElementById('counter-text'),
  nameInput: document.getElementById('creation-name'),
  submitBtn: document.getElementById('submit-btn'),
  leaderboard: document.getElementById('leaderboard'),
  loadMoreBtn: document.getElementById('load-more'),
  toast: document.getElementById('toast'),
  generationOverlay: document.getElementById('generation-overlay'),
  generationEmoji: document.getElementById('generation-emoji'),
  generationName: document.getElementById('generation-name'),
  progressBar: document.getElementById('progress-bar'),
  progressText: document.getElementById('progress-text'),
  voteModal: document.getElementById('vote-modal'),
  voteModalName: document.getElementById('vote-modal-name'),
  voteCancel: document.getElementById('vote-cancel'),
  voteConfirm: document.getElementById('vote-confirm'),
  emailModal: document.getElementById('email-modal'),
  emailInput: document.getElementById('email-input'),
  marketingCheckbox: document.getElementById('marketing-checkbox'),
  emailCancel: document.getElementById('email-cancel'),
  emailConfirm: document.getElementById('email-confirm'),
};

// Pending vote state
let pendingVoteId = null;
let pendingVoteName = null;

// Progress animation controller
let progressInterval = null;

function startProgress() {
  let progress = 0;
  const messages = [
    { at: 0, text: 'Entsafte die Früchte... 🍊' },
    { at: 12, text: 'Klaut Eiswürfel aus der Tiefkühltruhe... 🧊' },
    { at: 25, text: 'Mixt mit geheimer Formel... 🧪' },
    { at: 38, text: 'Arrangiert die Garnierung... 🎨' },
    { at: 50, text: 'Macht Fotos fürs Insta... 📸' },
    { at: 62, text: 'Wischt Fingerabdrücke vom Glas... ✨' },
    { at: 75, text: 'Perfektioniert den Splash-Effekt... 💦' },
    { at: 85, text: 'Noch schnell Sonnenbrille aufsetzen... 😎' },
    { at: 92, text: 'Gleich fertig, versprochen! 🤞' },
  ];
  
  elements.progressBar.style.width = '0%';
  
  progressInterval = setInterval(() => {
    // Slow down as we approach 95% (never quite reaches 100% until done)
    if (progress < 60) {
      progress += 1.5;
    } else if (progress < 85) {
      progress += 0.5;
    } else if (progress < 95) {
      progress += 0.1;
    }
    
    elements.progressBar.style.width = `${Math.min(progress, 95)}%`;
    
    // Update message based on progress
    for (let i = messages.length - 1; i >= 0; i--) {
      if (progress >= messages[i].at) {
        elements.progressText.textContent = messages[i].text;
        break;
      }
    }
  }, 200);
}

function stopProgress() {
  if (progressInterval) {
    clearInterval(progressInterval);
    progressInterval = null;
  }
  // Fill to 100%
  elements.progressBar.style.width = '100%';
  elements.progressText.textContent = 'Fertig! 🎉';
}

// Initialize
async function init() {
  state.visitorIp = await getVisitorIp();
  
  // Load existing votes for this IP
  const votedIds = await getVotedCreationIds(state.visitorIp);
  votedIds.forEach(id => state.votedFor.add(id));
  console.log('Loaded existing votes:', votedIds.length);
  
  renderFlavorGrids();
  renderToggles();
  setupEventListeners();
  updatePreview();
  updatePrimaryCounter();
}

// Render Flavor Grids
function renderFlavorGrids() {
  // Fruits
  elements.fruitsGrid.innerHTML = fruits.map(f => 
    `<button class="flavor-btn" data-id="${f.id}" data-type="primary">
      <span class="emoji">${f.emoji}</span>
      <span class="name">${f.name}</span>
    </button>`
  ).join('');
  
  // Extras (Kokos, Minze, etc.)
  elements.extrasGrid.innerHTML = extras.map(f => 
    `<button class="flavor-btn" data-id="${f.id}" data-type="primary">
      <span class="emoji">${f.emoji}</span>
      <span class="name">${f.name}</span>
    </button>`
  ).join('');

  elements.accentsGrid.innerHTML = accents.map(a => 
    `<button class="flavor-btn ${state.accent === a.id ? 'selected' : ''}" data-id="${a.id}" data-type="accent">
      <span class="emoji">${a.emoji}</span>
      <span class="name">${a.name}</span>
    </button>`
  ).join('');
}

// Render Toggle Buttons
function renderToggles() {
  elements.variantGroup.innerHTML = variants.map(v => 
    `<button class="toggle-btn ${state.variant === v.id ? 'selected' : ''}" data-id="${v.id}" data-type="variant">
      ${v.name}
    </button>`
  ).join('');
}

// Setup Event Listeners
function setupEventListeners() {
  // Tab switching
  elements.tabs.forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  // Flavor selection
  document.querySelectorAll('.flavor-btn').forEach(btn => {
    btn.addEventListener('click', () => selectFlavor(btn));
  });

  // Toggle selection
  document.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => selectToggle(btn));
  });

  // Name input
  elements.nameInput.addEventListener('input', validateForm);

  // Submit
  elements.submitBtn.addEventListener('click', submitCreation);

  // Load more
  elements.loadMoreBtn.addEventListener('click', loadMoreCreations);
}

// Tab Switching
function switchTab(tabId) {
  elements.tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tabId));
  elements.sections.forEach(s => s.classList.toggle('active', s.id === `${tabId}-section`));
  
  if (tabId === 'vote') {
    loadCreations();
  }
}

// Select Primary Flavor (multi-select up to 3)
function selectFlavor(btn) {
  const type = btn.dataset.type;
  const id = btn.dataset.id;
  
  if (type === 'primary') {
    const index = state.primaryFlavors.indexOf(id);
    
    if (index > -1) {
      // Deselect
      state.primaryFlavors.splice(index, 1);
      btn.classList.remove('selected');
    } else if (state.primaryFlavors.length < MAX_PRIMARY_FLAVORS) {
      // Select (if under limit)
      state.primaryFlavors.push(id);
      btn.classList.add('selected');
    } else {
      // Already at max
      showToast(`Maximal ${MAX_PRIMARY_FLAVORS} Geschmacksrichtungen!`, 'error');
      return;
    }
    
    updatePrimaryCounter();
    updateDisabledState();
  } else if (type === 'accent') {
    // Single select for accent
    state.accent = id;
    document.querySelectorAll('.flavor-btn[data-type="accent"]').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
  }
  
  updatePreview();
  validateForm();
}

// Update counter display
function updatePrimaryCounter() {
  const count = state.primaryFlavors.length;
  if (count > 0) {
    elements.primaryCounter.style.display = 'flex';
    elements.counterText.textContent = `${count}/${MAX_PRIMARY_FLAVORS} gewählt`;
    if (elements.counterFill) {
      elements.counterFill.style.width = `${(count / MAX_PRIMARY_FLAVORS) * 100}%`;
    }
  } else {
    elements.primaryCounter.style.display = 'none';
  }
}

// Update disabled state when max reached
function updateDisabledState() {
  const atMax = state.primaryFlavors.length >= MAX_PRIMARY_FLAVORS;
  
  document.querySelectorAll('.flavor-btn[data-type="primary"]').forEach(btn => {
    const isSelected = state.primaryFlavors.includes(btn.dataset.id);
    if (atMax && !isSelected) {
      btn.classList.add('disabled');
    } else {
      btn.classList.remove('disabled');
    }
  });
}

// Select Toggle
function selectToggle(btn) {
  const type = btn.dataset.type;
  const id = btn.dataset.id;
  
  state[type] = id;
  
  // Update UI
  btn.parentElement.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  
  updatePreview();
}

// Update Preview
function updatePreview() {
  // Build emoji from selected flavors
  let emoji = '';
  const selectedFlavors = state.primaryFlavors.map(id => primaryFlavors.find(f => f.id === id)).filter(Boolean);
  
  if (selectedFlavors.length > 0) {
    emoji = selectedFlavors.map(f => f.emoji).join('');
  } else {
    emoji = '🧃';
  }
  
  const accent = accents.find(a => a.id === state.accent);
  if (accent && accent.id !== 'none') {
    emoji += accent.emoji;
  }
  
  // Build name
  const flavorNames = selectedFlavors.map(f => f.name);
  let name = flavorNames.length > 0 ? flavorNames.join(' + ') : 'Wähle Geschmacksrichtungen...';
  
  if (accent && accent.id !== 'none') {
    name += ` + ${accent.name}`;
  }
  
  elements.previewEmoji.textContent = emoji;
  elements.previewName.textContent = name;
  
  // Update tags
  const tags = [];
  tags.push(state.variant === 'light' ? '💪 Light' : '🍬 Original');
  
  elements.previewTags.innerHTML = tags.map(t => `<span class="preview-tag">${t}</span>`).join('');
}

// Validate Form
function validateForm() {
  const name = elements.nameInput.value.trim();
  const hasValidName = name.length >= 3 && name.length <= 30 && /^[a-zA-Z0-9äöüÄÖÜß\s\-]+$/.test(name);
  const hasFlavors = state.primaryFlavors.length > 0;
  
  elements.submitBtn.disabled = !(hasValidName && hasFlavors);
}

// Show email modal before submitting
function showEmailModal() {
  elements.emailInput.value = '';
  elements.marketingCheckbox.checked = true; // Pre-selected
  elements.emailConfirm.disabled = true;
  elements.emailModal.classList.remove('hidden');
}

// Hide email modal
function hideEmailModal() {
  elements.emailModal.classList.add('hidden');
}

// Validate email input
function validateEmailInput() {
  const email = elements.emailInput.value.trim();
  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  elements.emailConfirm.disabled = !isValid;
}

// Setup email modal listeners
elements.emailInput.addEventListener('input', validateEmailInput);
elements.emailCancel.addEventListener('click', hideEmailModal);
elements.emailModal.addEventListener('click', (e) => {
  if (e.target === elements.emailModal) hideEmailModal();
});
elements.emailConfirm.addEventListener('click', () => {
  hideEmailModal();
  processCreation();
});

// Submit button shows email modal first
function submitCreation() {
  showEmailModal();
}

// Actual creation process (after email is provided)
async function processCreation() {
  const name = elements.nameInput.value.trim();
  const email = elements.emailInput.value.trim();
  const marketingConsent = elements.marketingCheckbox.checked;
  
  try {
    elements.submitBtn.disabled = true;
    elements.submitBtn.innerHTML = '<span class="btn-text">⏳ Wird erstellt...</span>';
    
    // Build emoji for overlay
    const selectedFlavors = state.primaryFlavors.map(id => primaryFlavors.find(f => f.id === id)).filter(Boolean);
    let emoji = selectedFlavors.length > 0 ? selectedFlavors.map(f => f.emoji).join('') : '🧃';
    const accent = accents.find(a => a.id === state.accent);
    if (accent && accent.id !== 'none') emoji += accent.emoji;
    
    // Join primary flavors with comma
    const creationData = {
      name,
      primary_flavor: state.primaryFlavors.join(','),
      secondary_flavor: null, // Not used anymore
      accent: state.accent !== 'none' ? state.accent : null,
      base_type: 'normal', // Default - not selectable anymore
      variant: state.variant,
      creator_ip: state.visitorIp,
      creator_email: email,
      marketing_consent: marketingConsent,
    };
    
    // Create the entry first
    const creation = await createCreation(creationData);
    
    // Store the ID for highlighting
    state.justCreatedId = creation.id;
    
    // Show generation overlay with progress bar
    elements.generationEmoji.textContent = emoji;
    elements.generationName.textContent = name;
    elements.generationOverlay.classList.remove('hidden');
    startProgress();
    
    // Switch to vote tab (behind the overlay)
    switchTab('vote');
    
    // Reset the form now
    resetForm();
    
    // Generate image (API also updates database directly)
    console.log('Starting image generation...');
    try {
      const imageResult = await generateCreationImage(creation);
      console.log('Image result:', imageResult);
      if (imageResult && imageResult.imageUrl) {
        creation.image_url = imageResult.imageUrl;
        console.log('Image generated and saved by API');
      } else {
        console.warn('No image URL in result');
      }
    } catch (imgError) {
      console.error('Image generation error:', imgError);
      // Continue even if image fails
    }
    
    // Hide overlay and reload leaderboard with highlight
    console.log('Hiding overlay, loading creations...');
    stopProgress();
    setTimeout(() => {
      elements.generationOverlay.classList.add('hidden');
    }, 500); // Small delay to show 100%
    await loadCreationsWithHighlight(creation.id);
    console.log('Done!');
    
    showToast('🎉 Deine Kreation ist live!', 'success');
    
  } catch (error) {
    console.error('Submit error:', error);
    stopProgress();
    elements.generationOverlay.classList.add('hidden');
    
    // If email already exists, redirect to leaderboard
    if (error.code === 'EMAIL_EXISTS') {
      showToast(`Du hast bereits teilgenommen! Deine Kreation: "${error.existingCreation}"`, 'error');
      switchTab('vote');
      loadCreations();
    } else {
      showToast(error.message || '❌ Fehler beim Einreichen. Versuch es nochmal.', 'error');
    }
  } finally {
    elements.submitBtn.disabled = false;
    elements.submitBtn.innerHTML = '<span class="btn-text">🚀 Ab in die Challenge!</span><span class="btn-shine"></span>';
  }
}

// Load creations with a specific creation highlighted at top
async function loadCreationsWithHighlight(highlightId) {
  try {
    state.offset = 0;
    elements.leaderboard.innerHTML = '<div class="loading">Lädt...</div>';
    
    const creations = await getCreations(state.limit, state.offset);
    state.creations = creations;
    
    // Sort so highlighted creation is at top (if not already)
    const highlightIndex = state.creations.findIndex(c => c.id === highlightId);
    if (highlightIndex > 0) {
      const [highlighted] = state.creations.splice(highlightIndex, 1);
      state.creations.unshift(highlighted);
    }
    
    renderLeaderboard();
    elements.loadMoreBtn.style.display = creations.length === state.limit ? 'block' : 'none';
    
    // Scroll to top to see the new creation
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
  } catch (error) {
    console.error('Load error:', error);
    elements.leaderboard.innerHTML = '<div class="empty-state">Fehler beim Laden.</div>';
  }
}

// Reset Form
function resetForm() {
  state.primaryFlavors = [];
  state.accent = 'none';
  elements.nameInput.value = '';
  
  document.querySelectorAll('.flavor-btn').forEach(btn => btn.classList.remove('selected', 'disabled'));
  document.querySelectorAll('.flavor-btn[data-type="accent"][data-id="none"]').forEach(btn => btn.classList.add('selected'));
  
  updatePreview();
  updatePrimaryCounter();
  validateForm();
}

// Load Creations
async function loadCreations(append = false) {
  try {
    if (!append) {
      state.offset = 0;
      elements.leaderboard.innerHTML = '<div class="loading">Lädt...</div>';
    }
    
    const creations = await getCreations(state.limit, state.offset);
    state.creations = append ? [...state.creations, ...creations] : creations;
    
    renderLeaderboard();
    
    elements.loadMoreBtn.style.display = creations.length === state.limit ? 'block' : 'none';
  } catch (error) {
    console.error('Load error:', error);
    elements.leaderboard.innerHTML = '<div class="empty-state">Fehler beim Laden. Versuch es nochmal.</div>';
  }
}

// Load More
function loadMoreCreations() {
  state.offset += state.limit;
  loadCreations(true);
}

// Render Leaderboard
function renderLeaderboard() {
  if (state.creations.length === 0) {
    elements.leaderboard.innerHTML = '<div class="empty-state">Noch keine Kreationen. Sei der Erste!</div>';
    return;
  }
  
  elements.leaderboard.innerHTML = state.creations.map((c, i) => {
    // Parse primary flavors (comma-separated)
    const flavorIds = c.primary_flavor ? c.primary_flavor.split(',') : [];
    const selectedFlavors = flavorIds.map(id => primaryFlavors.find(f => f.id === id)).filter(Boolean);
    const accent = accents.find(a => a.id === c.accent);
    
    let emoji = selectedFlavors.length > 0 
      ? selectedFlavors.map(f => f.emoji).join('')
      : '🧃';
    if (accent && accent.id !== 'none') emoji += accent.emoji;
    
    const details = [
      ...selectedFlavors.map(f => f.name),
      accent && accent.id !== 'none' ? accent.name : null,
    ].filter(Boolean).join(' + ');
    
    const voted = state.votedFor.has(c.id);
    const rank = state.offset + i + 1;
    const isTop3 = rank <= 3;
    const isJustCreated = c.id === state.justCreatedId;
    
    // Badge for user's own creation
    const yourBadge = isJustCreated ? '<span class="your-creation-badge">✨ Dein Mix!</span>' : '';
    
    // Variant badge
    const variantBadge = c.variant === 'light' ? '💪 Light' : '🍬 Original';
    
    return `
      <div class="creation-card ${c.image_url ? 'has-image' : ''} ${isJustCreated ? 'highlighted' : ''}">
        <div class="creation-image-wrapper">
          <div class="creation-rank ${isTop3 ? 'top-3' : ''}">${isJustCreated ? '✨' : '#' + rank}</div>
          ${c.image_url 
            ? `<img src="${c.image_url}" alt="${c.name}" class="creation-image" loading="lazy">`
            : `<div class="creation-emoji">${emoji}</div>`
          }
        </div>
        <div class="creation-body">
          <div class="creation-info">
            <div class="creation-name">${c.name}${yourBadge}</div>
            <div class="creation-details">${details} • ${variantBadge}</div>
          </div>
          <div class="creation-vote">
            <span class="vote-count">${c.votes_count} 👍</span>
            <button class="vote-btn ${voted ? 'voted' : ''}" data-id="${c.id}" ${voted ? 'disabled' : ''}>
              ${voted ? '✓' : '👍 Vote'}
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  // Add vote listeners
  document.querySelectorAll('.vote-btn:not(.voted)').forEach(btn => {
    btn.addEventListener('click', () => showVoteConfirmation(btn.dataset.id));
  });
}

// Show vote confirmation modal
function showVoteConfirmation(creationId) {
  const creation = state.creations.find(c => c.id === creationId);
  if (!creation) return;
  
  pendingVoteId = creationId;
  pendingVoteName = creation.name;
  elements.voteModalName.textContent = `"${creation.name}"`;
  elements.voteModal.classList.remove('hidden');
}

// Hide vote modal
function hideVoteModal() {
  elements.voteModal.classList.add('hidden');
  pendingVoteId = null;
  pendingVoteName = null;
}

// Confirm vote
async function confirmVote() {
  if (!pendingVoteId) return;
  
  const creationId = pendingVoteId;
  hideVoteModal();
  
  try {
    await voteForCreation(creationId, state.visitorIp);
    state.votedFor.add(creationId);
    
    // Update UI optimistically
    const creation = state.creations.find(c => c.id === creationId);
    if (creation) creation.votes_count++;
    
    renderLeaderboard();
    showToast('👍 Stimme abgegeben!', 'success');
  } catch (error) {
    console.error('Vote error:', error);
    showToast(error.message || '❌ Fehler beim Abstimmen.', 'error');
  }
}

// Setup modal event listeners
elements.voteCancel.addEventListener('click', hideVoteModal);
elements.voteConfirm.addEventListener('click', confirmVote);

// Close modal on backdrop click
elements.voteModal.addEventListener('click', (e) => {
  if (e.target === elements.voteModal) hideVoteModal();
});

// Toast
function showToast(message, type = '') {
  elements.toast.textContent = message;
  elements.toast.className = `toast ${type} show`;
  
  setTimeout(() => {
    elements.toast.classList.remove('show');
  }, 3000);
}

// Start
init();
