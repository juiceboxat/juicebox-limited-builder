// JuiceBox Limited Edition Builder - Main App

import { fruits, extras, primaryFlavors, accents, variants } from './data/flavors.js';
import { supabase, getCreations, createCreation, updateCreationImage, voteForCreation, removeVote, getVisitorIp, hasVoted, generateCreationImage, getVotedCreationIds } from './lib/supabase.js';

// Constants
const MAX_PRIMARY_FLAVORS = 3;

// Flavor colors for glass visualization
const flavorColors = {
  'apfel': { top: 'rgba(180,210,100,0.85)', bottom: 'rgba(140,180,60,1)' },
  'birne': { top: 'rgba(210,220,140,0.85)', bottom: 'rgba(180,190,100,1)' },
  'orange': { top: 'rgba(255,180,80,0.85)', bottom: 'rgba(255,140,40,1)' },
  'zitrone': { top: 'rgba(255,245,150,0.85)', bottom: 'rgba(255,230,100,1)' },
  'grapefruit': { top: 'rgba(255,180,180,0.85)', bottom: 'rgba(255,130,130,1)' },
  'erdbeere': { top: 'rgba(255,120,120,0.85)', bottom: 'rgba(220,60,80,1)' },
  'himbeere': { top: 'rgba(220,80,120,0.85)', bottom: 'rgba(180,40,80,1)' },
  'blaubeere': { top: 'rgba(120,100,180,0.85)', bottom: 'rgba(80,60,140,1)' },
  'kirsche': { top: 'rgba(200,60,80,0.85)', bottom: 'rgba(160,30,50,1)' },
  'banane': { top: 'rgba(255,240,150,0.85)', bottom: 'rgba(255,220,100,1)' },
  'mango': { top: 'rgba(255,200,80,0.85)', bottom: 'rgba(255,160,40,1)' },
  'maracuja': { top: 'rgba(255,180,100,0.85)', bottom: 'rgba(255,140,60,1)' },
  'ananas': { top: 'rgba(255,230,120,0.85)', bottom: 'rgba(255,200,60,1)' },
  'wassermelone': { top: 'rgba(255,140,150,0.85)', bottom: 'rgba(255,100,120,1)' },
  'melone': { top: 'rgba(200,240,180,0.85)', bottom: 'rgba(160,220,140,1)' },
  'traube': { top: 'rgba(140,80,160,0.85)', bottom: 'rgba(100,40,120,1)' },
  'johannisbeere': { top: 'rgba(180,60,80,0.85)', bottom: 'rgba(140,30,50,1)' },
  'holunder': { top: 'rgba(180,140,200,0.85)', bottom: 'rgba(140,100,160,1)' },
  'rhabarber': { top: 'rgba(220,140,160,0.85)', bottom: 'rgba(180,100,120,1)' },
  'pfirsich': { top: 'rgba(255,200,160,0.85)', bottom: 'rgba(255,160,120,1)' },
  'kokos': { top: 'rgba(250,250,245,0.85)', bottom: 'rgba(240,235,220,1)' },
  'minze': { top: 'rgba(160,230,200,0.85)', bottom: 'rgba(100,200,160,1)' },
  'vanille': { top: 'rgba(255,250,230,0.85)', bottom: 'rgba(255,240,200,1)' },
  'rose': { top: 'rgba(255,200,210,0.85)', bottom: 'rgba(255,160,180,1)' },
};

// Accent overrides for liquid color
const accentColors = {
  'cola': { top: 'rgba(80,40,20,0.9)', bottom: 'rgba(40,20,10,1)' },
  'energy': { top: 'rgba(255,240,150,0.9)', bottom: 'rgba(240,210,80,1)' }, // Energy gelblich
  'eistee': { top: 'rgba(210,140,60,0.9)', bottom: 'rgba(180,100,30,1)' }, // Goldener Eistee
};

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
  sections: document.querySelectorAll('.section'),
  createSection: document.getElementById('create-section'),
  voteSection: document.getElementById('vote-section'),
  fruitsGrid: document.getElementById('fruits-grid'),
  extrasGrid: document.getElementById('extras-grid'),
  accentsGrid: document.getElementById('accents'),
  variantGroup: document.getElementById('variant'),
  counterFill: document.getElementById('counter-fill'),
  liquidTop: document.getElementById('liquid-top'),
  liquidBottom: document.getElementById('liquid-bottom'),
  floatingIngredients: document.getElementById('floating-ingredients'),
  straw: document.getElementById('straw'),
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
  emailCancel: document.getElementById('email-cancel'),
  emailConfirm: document.getElementById('email-confirm'),
  // My Creation Section
  myCreationSection: document.getElementById('my-creation-section'),
  myCreationImage: document.getElementById('my-creation-image'),
  myCreationEmoji: document.getElementById('my-creation-emoji'),
  myCreationName: document.getElementById('my-creation-name'),
  myCreationDetails: document.getElementById('my-creation-details'),
  myCreationVotes: document.getElementById('my-creation-votes'),
  myCreationRank: document.getElementById('my-creation-rank'),
  shareCreationBtn: document.getElementById('share-creation-btn'),
};

// Pending vote state
let pendingVoteId = null;
let pendingVoteName = null;

// Wizard state
let currentStep = 1;
const totalSteps = 4;

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
  setupShareButton();
  updatePreview();
  updatePrimaryCounter();
  
  // Handle shared vote links
  handleVoteUrlParam();
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

// Section Switching (no tabs anymore)
function switchTab(tabId) {
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
  let name = flavorNames.length > 0 ? flavorNames.join(' + ') : 'Wähle deine Zutaten...';
  
  if (accent && accent.id !== 'none') {
    name += ` + ${accent.name}`;
  }
  
  elements.previewName.textContent = name;
  
  // Update tags - only show variant when at step 3 or later
  const tags = [];
  if (currentStep >= 3) {
    tags.push(state.variant === 'light' ? '💪 Light' : '🍬 Original');
  }
  
  elements.previewTags.innerHTML = tags.map(t => `<span class="preview-tag">${t}</span>`).join('');
  
  // Update glass visualization
  updateGlassVisualization(selectedFlavors, accent);
}

// Update glass visualization based on selections
function updateGlassVisualization(selectedFlavors, accent) {
  // Determine liquid color
  let liquidColor = { top: 'rgba(200,200,200,0.5)', bottom: 'rgba(180,180,180,0.6)' }; // Default gray
  
  if (accent && accentColors[accent.id]) {
    // Accent overrides flavor color
    liquidColor = accentColors[accent.id];
  } else if (selectedFlavors.length > 0) {
    // Mix colors from selected flavors
    const mainFlavor = selectedFlavors[0];
    if (flavorColors[mainFlavor.id]) {
      liquidColor = flavorColors[mainFlavor.id];
      
      // If multiple flavors, slightly blend
      if (selectedFlavors.length > 1 && flavorColors[selectedFlavors[1].id]) {
        // Create a mixed effect by adjusting opacity
        const color2 = flavorColors[selectedFlavors[1].id];
        liquidColor = {
          top: liquidColor.top.replace('0.85', '0.9'),
          bottom: color2.bottom
        };
      }
    }
  }
  
  // Apply liquid color
  if (elements.liquidTop && elements.liquidBottom) {
    elements.liquidTop.setAttribute('stop-color', liquidColor.top);
    elements.liquidBottom.setAttribute('stop-color', liquidColor.bottom);
  }
  
  // Update floating ingredients
  if (elements.floatingIngredients) {
    const ingredients = selectedFlavors.slice(0, 4).map((f, i) => 
      `<span class="floating-ingredient" style="animation-delay: ${i * 0.5}s">${f.emoji}</span>`
    ).join('');
    elements.floatingIngredients.innerHTML = ingredients;
  }
  
  // Show straw for cola/energy
  if (elements.straw) {
    if (accent && (accent.id === 'cola' || accent.id === 'energy')) {
      elements.straw.classList.add('visible');
    } else {
      elements.straw.classList.remove('visible');
    }
  }
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

// Wizard Navigation
function goToStep(step) {
  if (step < 1 || step > totalSteps) return;
  
  // Validate before moving forward
  if (step > currentStep && !validateCurrentStep()) return;
  
  // Update steps
  document.querySelectorAll('.wizard-step').forEach((el, i) => {
    el.classList.toggle('active', i + 1 === step);
  });
  
  // Update progress indicators
  document.querySelectorAll('.progress-step').forEach((el, i) => {
    const stepNum = i + 1;
    el.classList.toggle('active', stepNum === step);
    el.classList.toggle('completed', stepNum < step);
  });
  
  document.querySelectorAll('.progress-line').forEach((el, i) => {
    el.classList.toggle('active', i + 1 < step);
  });
  
  currentStep = step;
}

function validateCurrentStep() {
  if (currentStep === 1) {
    // Must have at least one flavor
    if (state.primaryFlavors.length === 0) {
      showToast('Wähle mindestens eine Frucht! 🍓', 'error');
      return false;
    }
  }
  return true;
}

// Setup wizard navigation buttons
document.getElementById('next-1')?.addEventListener('click', () => goToStep(2));
document.getElementById('back-2')?.addEventListener('click', () => goToStep(1));
document.getElementById('next-2')?.addEventListener('click', () => goToStep(3));
document.getElementById('back-3')?.addEventListener('click', () => goToStep(2));
document.getElementById('next-3')?.addEventListener('click', () => goToStep(4));
document.getElementById('back-4')?.addEventListener('click', () => goToStep(3));

// Welcome Screen
const welcomeScreen = document.getElementById('welcome-screen');
const welcomeStartBtn = document.getElementById('welcome-start');

// Navigation - Leaderboard link
document.getElementById('nav-leaderboard')?.addEventListener('click', (e) => {
  e.preventDefault();
  switchTab('vote');
  loadCreations();
});

// Check for shared vote link - skip welcome screen if present
const urlParams = new URLSearchParams(window.location.search);
const hasVoteParam = urlParams.has('vote');

// Check if user has seen welcome screen (v2 = reset for new design)
// OR if they came via a shared vote link
if (localStorage.getItem('juicebox-welcome-seen-v2') || hasVoteParam) {
  welcomeScreen?.classList.add('hidden');
  // If vote param, mark as seen so they don't see it later
  if (hasVoteParam) {
    localStorage.setItem('juicebox-welcome-seen-v2', 'true');
  }
}

welcomeStartBtn?.addEventListener('click', () => {
  localStorage.setItem('juicebox-welcome-seen-v2', 'true');
  welcomeScreen?.classList.add('hidden');
});

// Submit button shows email modal first
function submitCreation() {
  showEmailModal();
}

// Actual creation process (after email is provided)
async function processCreation() {
  const name = elements.nameInput.value.trim();
  const email = elements.emailInput.value.trim();
  const marketingConsent = true; // Always true - consent given by participating
  
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
    
    // Store email in localStorage for voting
    localStorage.setItem('juicebox-creator-email', email);
    localStorage.setItem('juicebox-own-creation-id', creation.id);
    
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
  // Always update my creation section first
  updateMyCreationSection();
  
  if (state.creations.length === 0) {
    elements.leaderboard.innerHTML = '<div class="empty-state">Noch keine Kreationen. Sei der Erste!</div>';
    return;
  }
  
  // Get user's vote and creation from localStorage
  const ownCreationId = localStorage.getItem('juicebox-own-creation-id');
  const votedForId = localStorage.getItem('juicebox-voted-for');
  const highlightSharedId = state.highlightSharedId;
  
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
    
    // Check if user voted for this - localStorage is authoritative for current session
    // state.votedFor contains all votes by this IP (from DB), but we only show ONE as "voted"
    const voted = c.id === votedForId;
    const isOwn = c.id === ownCreationId || c.id === state.justCreatedId;
    const rank = state.offset + i + 1;
    const isTop3 = rank <= 3;
    const isJustCreated = c.id === state.justCreatedId;
    const isSharedHighlight = c.id === highlightSharedId;
    
    // Badge for user's own creation
    const yourBadge = isOwn ? '<span class="your-creation-badge">✨ Dein Mix!</span>' : '';
    
    // Variant badge
    const variantBadge = c.variant === 'light' ? '💪 Light' : '🍬 Original';
    
    // Vote button state
    let voteButtonClass = '';
    let voteButtonText = '👍 Vote';
    let voteButtonDisabled = false;
    let hideVoteButton = false;
    
    if (isOwn) {
      voteButtonClass = 'own';
      voteButtonText = '🙈';
      voteButtonDisabled = true;
    } else if (voted) {
      voteButtonClass = 'voted';
      voteButtonText = '✓ Gewählt';
      voteButtonDisabled = false; // Allow clicking to remove vote
    } else if (votedForId) {
      // User already voted for something else - hide button
      hideVoteButton = true;
    }
    
    return `
      <div class="creation-card ${c.image_url ? 'has-image' : ''} ${isJustCreated || isSharedHighlight ? 'highlighted' : ''}">
        <div class="creation-image-wrapper">
          <div class="creation-rank ${isTop3 ? 'top-3' : ''}">${isJustCreated || isSharedHighlight ? '✨' : '#' + rank}</div>
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
            ${hideVoteButton ? '' : `
              <button class="vote-btn ${voteButtonClass}" data-id="${c.id}" ${voteButtonDisabled ? 'disabled' : ''}>
                ${voteButtonText}
              </button>
            `}
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  // Add vote listeners
  document.querySelectorAll('.vote-btn:not(.voted):not(.own):not([disabled])').forEach(btn => {
    btn.addEventListener('click', () => showVoteConfirmation(btn.dataset.id));
  });
  
  // Add remove vote listeners (for voted buttons)
  document.querySelectorAll('.vote-btn.voted').forEach(btn => {
    btn.addEventListener('click', () => showRemoveVoteConfirmation(btn.dataset.id));
  });
  
  // Update voted banner
  updateVotedBanner();
  
  // Clear shared highlight after render (so it doesn't persist on subsequent loads)
  if (state.highlightSharedId) {
    // Scroll to the highlighted creation
    setTimeout(() => {
      const highlightedCard = document.querySelector('.creation-card.highlighted');
      if (highlightedCard) {
        highlightedCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      state.highlightSharedId = null;
    }, 500);
  }
}

// Show vote confirmation modal
function showVoteConfirmation(creationId) {
  const creation = state.creations.find(c => c.id === creationId);
  if (!creation) return;
  
  // Check if this is user's own creation
  const ownCreationId = localStorage.getItem('juicebox-own-creation-id');
  if (ownCreationId === creationId) {
    showToast('Du kannst nicht für deine eigene Kreation stimmen! 🙈', 'error');
    return;
  }
  
  // Check if user already voted
  const votedForId = localStorage.getItem('juicebox-voted-for');
  if (votedForId) {
    const votedCreation = state.creations.find(c => c.id === votedForId);
    showToast(`Du hast bereits für "${votedCreation?.name || 'eine Sorte'}" gestimmt!`, 'error');
    return;
  }
  
  // Check if user has email (either created something or provided for voting)
  const hasEmail = localStorage.getItem('juicebox-creator-email') || localStorage.getItem('juicebox-voter-email');
  
  pendingVoteId = creationId;
  pendingVoteName = creation.name;
  
  if (!hasEmail) {
    // Show email modal for voting
    showVoteEmailModal();
  } else {
    // Show regular vote confirmation
    elements.voteModalName.textContent = `"${creation.name}"`;
    elements.voteModal.classList.remove('hidden');
  }
}

// Show email modal for vote-only users
function showVoteEmailModal() {
  const voteEmailModal = document.getElementById('vote-email-modal');
  const voteEmailName = document.getElementById('vote-email-name');
  if (voteEmailName) voteEmailName.textContent = `"${pendingVoteName}"`;
  voteEmailModal?.classList.remove('hidden');
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
  const creationName = pendingVoteName;
  hideVoteModal();
  
  try {
    await voteForCreation(creationId, state.visitorIp);
    state.votedFor.add(creationId);
    
    // Store vote in localStorage
    localStorage.setItem('juicebox-voted-for', creationId);
    localStorage.setItem('juicebox-voted-for-name', creationName);
    
    // Update UI optimistically
    const creation = state.creations.find(c => c.id === creationId);
    if (creation) creation.votes_count++;
    
    renderLeaderboard();
    updateVotedBanner();
    showToast('👍 Stimme abgegeben!', 'success');
  } catch (error) {
    console.error('Vote error:', error);
    showToast(error.message || '❌ Fehler beim Abstimmen.', 'error');
  }
}

// Show remove vote confirmation
function showRemoveVoteConfirmation(creationId) {
  const creation = state.creations.find(c => c.id === creationId);
  if (!creation) return;
  
  pendingVoteId = creationId;
  pendingVoteName = creation.name;
  
  // Reuse vote modal but change text
  elements.voteModalName.textContent = `"${creation.name}"`;
  document.querySelector('#vote-modal h3').textContent = 'Stimme entfernen?';
  document.querySelector('#vote-modal p:first-of-type').textContent = 'Willst du deine Stimme für';
  document.querySelector('#vote-modal .modal-warning').textContent = '⚠️ Du kannst danach für eine andere Sorte stimmen.';
  document.getElementById('vote-confirm').textContent = '🗑️ Entfernen';
  document.getElementById('vote-confirm').onclick = confirmRemoveVote;
  elements.voteModal.classList.remove('hidden');
}

// Confirm remove vote
async function confirmRemoveVote() {
  if (!pendingVoteId) return;
  
  const creationId = pendingVoteId;
  hideVoteModal();
  
  // Reset modal text for next use
  document.querySelector('#vote-modal h3').textContent = 'Vote abgeben?';
  document.querySelector('#vote-modal p:first-of-type').textContent = 'Du willst für';
  document.querySelector('#vote-modal .modal-warning').textContent = '⚠️ Nur ein Vote pro Person möglich!';
  document.getElementById('vote-confirm').textContent = '✅ Let\'s go!';
  document.getElementById('vote-confirm').onclick = confirmVote;
  
  try {
    await removeVote(creationId, state.visitorIp);
    state.votedFor.delete(creationId);
    
    // Clear localStorage
    localStorage.removeItem('juicebox-voted-for');
    localStorage.removeItem('juicebox-voted-for-name');
    
    // Update UI optimistically
    const creation = state.creations.find(c => c.id === creationId);
    if (creation && creation.votes_count > 0) creation.votes_count--;
    
    renderLeaderboard();
    updateVotedBanner();
    showToast('🗑️ Stimme entfernt. Du kannst jetzt neu wählen!', 'success');
  } catch (error) {
    console.error('Remove vote error:', error);
    showToast(error.message || '❌ Fehler beim Entfernen.', 'error');
  }
}

// Update "My Creation" section
function updateMyCreationSection() {
  const ownCreationId = localStorage.getItem('juicebox-own-creation-id');
  
  if (!ownCreationId || !elements.myCreationSection) {
    elements.myCreationSection?.classList.add('hidden');
    return;
  }
  
  // Find the creation in loaded data
  const creation = state.creations.find(c => c.id === ownCreationId);
  
  if (!creation) {
    // Creation not in current list, keep section hidden or show with cached data
    const cachedData = localStorage.getItem('juicebox-own-creation-data');
    if (cachedData) {
      try {
        const cached = JSON.parse(cachedData);
        displayMyCreation(cached, -1);
      } catch (e) {
        elements.myCreationSection.classList.add('hidden');
      }
    } else {
      elements.myCreationSection.classList.add('hidden');
    }
    return;
  }
  
  // Find rank
  const rank = state.creations.findIndex(c => c.id === ownCreationId) + 1 + state.offset;
  
  // Cache the data
  localStorage.setItem('juicebox-own-creation-data', JSON.stringify(creation));
  
  displayMyCreation(creation, rank);
}

function displayMyCreation(creation, rank) {
  // Parse flavors
  const flavorIds = creation.primary_flavor ? creation.primary_flavor.split(',') : [];
  const selectedFlavors = flavorIds.map(id => primaryFlavors.find(f => f.id === id)).filter(Boolean);
  const accent = accents.find(a => a.id === creation.accent);
  
  // Build emoji
  let emoji = selectedFlavors.length > 0 
    ? selectedFlavors.map(f => f.emoji).join('')
    : '🧃';
  if (accent && accent.id !== 'none') emoji += accent.emoji;
  
  // Build details
  const details = [
    ...selectedFlavors.map(f => f.name),
    accent && accent.id !== 'none' ? accent.name : null,
    creation.variant === 'light' ? '💪 Light' : '🍬 Original',
  ].filter(Boolean).join(' • ');
  
  // Update DOM
  elements.myCreationName.textContent = creation.name;
  elements.myCreationDetails.textContent = details;
  elements.myCreationVotes.textContent = `${creation.votes_count || 0} 👍`;
  elements.myCreationRank.textContent = rank > 0 ? `#${rank}` : '—';
  
  // Update image
  if (creation.image_url) {
    elements.myCreationImage.innerHTML = `<img src="${creation.image_url}" alt="${creation.name}">`;
  } else {
    elements.myCreationImage.innerHTML = `<span class="my-creation-emoji">${emoji}</span>`;
  }
  
  // Show section
  elements.myCreationSection.classList.remove('hidden');
}

// Share creation link
function setupShareButton() {
  elements.shareCreationBtn?.addEventListener('click', async () => {
    const ownCreationId = localStorage.getItem('juicebox-own-creation-id');
    if (!ownCreationId) return;
    
    const shareUrl = `${window.location.origin}${window.location.pathname}?vote=${ownCreationId}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      elements.shareCreationBtn.classList.add('copied');
      elements.shareCreationBtn.innerHTML = '<span>✅ Link kopiert!</span>';
      showToast('🔗 Link kopiert! Teile ihn mit deinen Freunden.', 'success');
      
      setTimeout(() => {
        elements.shareCreationBtn.classList.remove('copied');
        elements.shareCreationBtn.innerHTML = '<span>🔗 Link kopieren</span>';
      }, 3000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showToast('🔗 Link kopiert!', 'success');
    }
  });
}

// Handle vote URL parameter (when someone opens a shared link)
function handleVoteUrlParam() {
  const urlParams = new URLSearchParams(window.location.search);
  const voteId = urlParams.get('vote');
  
  if (voteId) {
    // Switch to vote tab and highlight the shared creation
    switchTab('vote');
    state.highlightSharedId = voteId;
    
    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

// Update voted banner
function updateVotedBanner() {
  const votedForId = localStorage.getItem('juicebox-voted-for');
  const votedForName = localStorage.getItem('juicebox-voted-for-name');
  const hasEmail = localStorage.getItem('juicebox-creator-email') || localStorage.getItem('juicebox-voter-email');
  const banner = document.getElementById('voted-banner');
  const ctaBanner = document.getElementById('vote-cta-banner');
  const voteInfo = document.getElementById('vote-info');
  const nameEl = document.getElementById('voted-for-name');
  
  // Show vote-info only if user has email
  if (hasEmail) {
    voteInfo?.classList.remove('hidden');
  } else {
    voteInfo?.classList.add('hidden');
  }
  
  if (votedForId && votedForName && banner && nameEl) {
    nameEl.textContent = `"${votedForName}"`;
    banner.classList.remove('hidden');
    ctaBanner?.classList.add('hidden');
  } else {
    banner?.classList.add('hidden');
    ctaBanner?.classList.remove('hidden');
  }
}

// Setup modal event listeners
elements.voteCancel.addEventListener('click', hideVoteModal);
elements.voteConfirm.addEventListener('click', confirmVote);

// Close modal on backdrop click
elements.voteModal.addEventListener('click', (e) => {
  if (e.target === elements.voteModal) hideVoteModal();
});

// Vote Email Modal handlers
const voteEmailModal = document.getElementById('vote-email-modal');
const voteEmailInput = document.getElementById('vote-email-input');
const voteEmailConfirm = document.getElementById('vote-email-confirm');
const voteEmailCancel = document.getElementById('vote-email-cancel');

// Validate email input
voteEmailInput?.addEventListener('input', () => {
  const isValid = voteEmailInput.value.includes('@') && voteEmailInput.value.includes('.');
  voteEmailConfirm.disabled = !isValid;
});

// Cancel vote email modal
voteEmailCancel?.addEventListener('click', () => {
  voteEmailModal?.classList.add('hidden');
  voteEmailInput.value = '';
  pendingVoteId = null;
  pendingVoteName = null;
});

// Close on backdrop click
voteEmailModal?.addEventListener('click', (e) => {
  if (e.target === voteEmailModal) {
    voteEmailModal.classList.add('hidden');
    voteEmailInput.value = '';
    pendingVoteId = null;
    pendingVoteName = null;
  }
});

// Confirm vote with email
voteEmailConfirm?.addEventListener('click', async () => {
  const email = voteEmailInput.value.trim();
  if (!email || !pendingVoteId) return;
  
  // Store email for future votes
  localStorage.setItem('juicebox-voter-email', email);
  
  // Hide modal
  voteEmailModal?.classList.add('hidden');
  voteEmailInput.value = '';
  
  // Now do the actual vote
  const creationId = pendingVoteId;
  const creationName = pendingVoteName;
  
  try {
    await voteForCreation(creationId, state.visitorIp);
    state.votedFor.add(creationId);
    
    localStorage.setItem('juicebox-voted-for', creationId);
    localStorage.setItem('juicebox-voted-for-name', creationName);
    
    const creation = state.creations.find(c => c.id === creationId);
    if (creation) creation.votes_count++;
    
    renderLeaderboard();
    updateVotedBanner();
    showToast('👍 Stimme abgegeben!', 'success');
  } catch (error) {
    console.error('Vote error:', error);
    showToast(error.message || '❌ Fehler beim Abstimmen.', 'error');
  }
  
  pendingVoteId = null;
  pendingVoteName = null;
});

// Toast
function showToast(message, type = '') {
  elements.toast.textContent = message;
  elements.toast.className = `toast ${type} show`;
  
  setTimeout(() => {
    elements.toast.classList.remove('show');
  }, 3000);
}

// View Toggle for Leaderboard
const viewButtons = document.querySelectorAll('.view-btn');
const leaderboard = document.getElementById('leaderboard');

// Load saved view preference
const savedView = localStorage.getItem('juicebox-view') || 'grid-2';
leaderboard?.classList.add(`view-${savedView}`);
document.querySelector(`.view-btn[data-view="${savedView}"]`)?.classList.add('active');

viewButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const view = btn.dataset.view;
    
    // Update active button
    viewButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // Update leaderboard class
    leaderboard?.classList.remove('view-list', 'view-grid-2', 'view-grid-1');
    leaderboard?.classList.add(`view-${view}`);
    
    // Save preference
    localStorage.setItem('juicebox-view', view);
  });
});

// Start
init();
