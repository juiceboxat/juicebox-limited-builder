// JuiceBox Limited Edition Builder - Main App

import { fruits, extras, primaryFlavors, accents, variants, findBestMatch } from './data/flavors.js';
import { supabase, getCreations, getCreationById, getCreationByEmail, createCreation, updateCreationImage, deleteCreation, voteForCreation, removeVote, getVisitorIp, hasVoted, generateCreationImage, getVotedCreationIds } from './lib/supabase.js';

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
  
  // Load existing votes for this email (if known)
  const userEmail = localStorage.getItem('juicebox-creator-email') || localStorage.getItem('juicebox-voter-email');
  if (userEmail) {
    const votedIds = await getVotedCreationIds(userEmail);
    votedIds.forEach(id => state.votedFor.add(id));
    console.log('Loaded existing votes for email:', votedIds.length);
    
    // Sync DB votes to localStorage (fixes cross-browser/cleared-cache issue)
    if (votedIds.length > 0 && !localStorage.getItem('juicebox-voted-for')) {
      localStorage.setItem('juicebox-voted-for', votedIds[0]);
      console.log('Synced vote from DB to localStorage:', votedIds[0]);
    }
  }
  
  renderFlavorGrids();
  renderToggles();
  setupEventListeners();
  setupShareButton();
  setupSuccessPageListeners();
  setupUserInfo();
  setupAlreadyCreatedSection();
  updatePreview();
  updatePrimaryCounter();
  
  // Handle URL hash routing (e.g., #bestenliste)
  const hashHandled = handleHashRoute();
  
  // Handle shared vote links
  if (!hashHandled) {
    handleVoteUrlParam();
  }
  
  // Check if user already has a creation (show on create page)
  checkAlreadyCreated();
  
  // Listen for hash changes
  window.addEventListener('hashchange', () => handleHashRoute());
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
function switchTab(tabId, updateUrl = true) {
  elements.sections.forEach(s => s.classList.toggle('active', s.id === `${tabId}-section`));
  
  // Update URL for shareability
  if (updateUrl) {
    const newPath = tabId === 'vote' ? '/bestenliste' : '/';
    if (window.location.pathname !== newPath) {
      history.pushState(null, '', newPath);
    }
  }
  
  // Update navigation links visibility
  const navCreator = document.getElementById('nav-creator');
  const navLeaderboard = document.getElementById('nav-leaderboard');
  
  if (tabId === 'vote') {
    // On leaderboard: show Creator link, hide Leaderboard link
    navCreator?.classList.remove('hidden');
    navLeaderboard?.classList.add('hidden');
    loadCreations();
  } else {
    // On creator/success: show Leaderboard link, hide Creator link
    navCreator?.classList.add('hidden');
    navLeaderboard?.classList.remove('hidden');
  }
}

// Handle URL routing for direct links (path or hash)
function handleHashRoute() {
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  
  // Check path first, then hash
  if (path === '/bestenliste' || path === '/leaderboard' || 
      hash === '#bestenliste' || hash === '#leaderboard' || hash === '#vote') {
    // Skip welcome screen and go directly to leaderboard
    document.getElementById('welcome-screen')?.classList.add('hidden');
    switchTab('vote', false);
    return true;
  }
  
  // Default: on creator page, ensure nav is correct
  const navCreator = document.getElementById('nav-creator');
  const navLeaderboard = document.getElementById('nav-leaderboard');
  navCreator?.classList.add('hidden');
  navLeaderboard?.classList.remove('hidden');
  
  return false;
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

// Navigation - Creator link
document.getElementById('nav-creator')?.addEventListener('click', (e) => {
  e.preventDefault();
  switchTab('create');
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

// Submit button shows email modal first (or skips if email already known)
function submitCreation() {
  const existingEmail = localStorage.getItem('juicebox-creator-email') || localStorage.getItem('juicebox-voter-email');
  
  if (existingEmail) {
    // User already has an email stored - skip modal and use it directly
    elements.emailInput.value = existingEmail;
    processCreation();
  } else {
    // Show email modal for new users
    showEmailModal();
  }
}

// Flag to prevent double submission
let isSubmitting = false;

// Actual creation process (after email is provided)
async function processCreation() {
  // Prevent double submission
  if (isSubmitting) return;
  isSubmitting = true;
  
  const name = elements.nameInput.value.trim();
  const email = elements.emailInput.value.trim();
  const marketingConsent = true; // Always true - consent given by participating
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showToast('Bitte gib eine gültige E-Mail-Adresse ein!', 'error');
    isSubmitting = false;
    return;
  }
  
  // Validate name
  if (name.length < 3 || name.length > 30) {
    showToast('Der Name muss zwischen 3 und 30 Zeichen lang sein!', 'error');
    isSubmitting = false;
    return;
  }
  
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
    localStorage.setItem('juicebox-own-creation-name', name);
    
    // Update user display
    if (window.updateUserDisplay) window.updateUserDisplay();
    
    // Show generation overlay with progress bar
    elements.generationEmoji.textContent = emoji;
    elements.generationName.textContent = name;
    elements.generationOverlay.classList.remove('hidden');
    startProgress();
    
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
    
    // Hide overlay and show success page
    console.log('Hiding overlay, showing success page...');
    stopProgress();
    setTimeout(() => {
      elements.generationOverlay.classList.add('hidden');
    }, 500);
    
    // Show success section with creation details
    showSuccessPage(creation, selectedFlavors, accent);
    console.log('Done!');
    
  } catch (error) {
    console.error('Submit error:', error);
    stopProgress();
    elements.generationOverlay.classList.add('hidden');
    
    // If email already exists, recover and show the existing creation
    if (error.code === 'EMAIL_EXISTS') {
      try {
        // Fetch the existing creation by email
        const email = localStorage.getItem('juicebox-creator-email') || localStorage.getItem('juicebox-voter-email');
        if (email) {
          const existingCreation = await getCreationByEmail(email);
          if (existingCreation) {
            // Store in localStorage so checkAlreadyCreated works
            localStorage.setItem('juicebox-own-creation-id', existingCreation.id);
            localStorage.setItem('juicebox-own-creation-name', existingCreation.name);
            localStorage.setItem('juicebox-own-creation-data', JSON.stringify(existingCreation));
            
            // Show the already-created section
            showToast(`Du hast bereits eine Kreation: "${existingCreation.name}"`, 'info');
            await checkAlreadyCreated();
            return;
          }
        }
      } catch (fetchError) {
        console.error('Failed to fetch existing creation:', fetchError);
      }
      // Fallback if fetch fails
      showToast(`Du hast bereits teilgenommen! Deine Kreation: "${error.existingCreation}"`, 'error');
      switchTab('vote');
      loadCreations();
    } else {
      showToast(error.message || '❌ Fehler beim Einreichen. Versuch es nochmal.', 'error');
    }
  } finally {
    isSubmitting = false;
    elements.submitBtn.disabled = false;
    elements.submitBtn.innerHTML = '<span class="btn-text">🚀 Ab in die Challenge!</span><span class="btn-shine"></span>';
  }
}

// Show success page after creation
function showSuccessPage(creation, selectedFlavors, accent) {
  // Switch to success section
  switchTab('success');
  
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
  
  // Update success page elements
  const successEmoji = document.getElementById('success-emoji');
  const successImage = document.getElementById('success-creation-image');
  const successName = document.getElementById('success-creation-name');
  const successDetails = document.getElementById('success-creation-details');
  const similarFlavor = document.getElementById('similar-flavor');
  
  if (creation.image_url) {
    successImage.innerHTML = `<img src="${creation.image_url}" alt="${creation.name}">`;
  } else {
    successImage.innerHTML = `<span class="success-emoji">${emoji}</span>`;
  }
  
  successName.textContent = creation.name;
  successDetails.textContent = details;
  
  // Set similar flavor for Starter Set pitch - find best matching standard flavor
  if (selectedFlavors.length > 0) {
    const flavorIds = selectedFlavors.map(f => f.id);
    const accentId = accent?.id || 'none';
    
    // Find the best matching standard JuiceBox flavor
    const matchedFlavorName = findBestMatch(flavorIds, accentId);
    similarFlavor.textContent = matchedFlavorName;
    
    // Update the full pitch text with the actual product name
    const pitchEl = document.getElementById('starter-set-pitch');
    if (pitchEl) {
      pitchEl.innerHTML = `Die Sorte <strong>${matchedFlavorName}</strong> ist sehr ähnlich wie deine Kreation, du kannst sie direkt im Starter Set bestellen — genieß deinen Lieblingsgeschmack schon jetzt zuhause!`;
    }
  }
  
  // Store creation data for share functions
  window.currentCreation = creation;
  
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Setup user info display and logout
function setupUserInfo() {
  const userInfoEl = document.getElementById('user-info');
  const userEmailEl = document.getElementById('user-email');
  const logoutBtn = document.getElementById('logout-btn');
  
  // Update user info display
  function updateUserDisplay() {
    const email = localStorage.getItem('juicebox-creator-email') || localStorage.getItem('juicebox-voter-email');
    
    if (email && userInfoEl && userEmailEl) {
      userEmailEl.textContent = email;
      userInfoEl.classList.remove('hidden');
    } else if (userInfoEl) {
      userInfoEl.classList.add('hidden');
    }
  }
  
  // Initial update
  updateUserDisplay();
  
  // Logout handler
  logoutBtn?.addEventListener('click', () => {
    if (confirm('Möchtest du dich wirklich ausloggen? Deine Kreation bleibt erhalten, aber du musst dich erneut anmelden um zu voten.')) {
      // Clear email from localStorage
      localStorage.removeItem('juicebox-creator-email');
      localStorage.removeItem('juicebox-voter-email');
      localStorage.removeItem('juicebox-voted-for');
      localStorage.removeItem('juicebox-voted-for-name');
      
      // Clear vote state
      state.votedFor.clear();
      
      // Update display
      updateUserDisplay();
      
      // Reload to refresh state
      location.reload();
    }
  });
  
  // Expose update function globally for use after login
  window.updateUserDisplay = updateUserDisplay;
}

// Setup Already Created Section
function setupAlreadyCreatedSection() {
  const leaderboardBtn = document.getElementById('already-created-leaderboard');
  const deleteBtn = document.getElementById('already-created-delete');
  
  leaderboardBtn?.addEventListener('click', () => {
    switchTab('vote');
  });
  
  deleteBtn?.addEventListener('click', async () => {
    const ownCreationId = localStorage.getItem('juicebox-own-creation-id');
    const ownCreationName = localStorage.getItem('juicebox-own-creation-name');
    if (!ownCreationId) return;
    
    if (!confirm(`Bist du sicher, dass du "${ownCreationName}" löschen möchtest? Alle Votes gehen verloren!`)) {
      return;
    }
    
    try {
      deleteBtn.disabled = true;
      deleteBtn.textContent = '⏳ Wird gelöscht...';
      
      await deleteCreation(ownCreationId);
      
      // Clear localStorage
      localStorage.removeItem('juicebox-own-creation-id');
      localStorage.removeItem('juicebox-own-creation-name');
      localStorage.removeItem('juicebox-own-creation-data');
      localStorage.removeItem('juicebox-voted-for');
      localStorage.removeItem('juicebox-voted-for-name');
      
      // Hide already created section
      document.getElementById('already-created-section')?.classList.add('hidden');
      
      // Reset state
      state.justCreatedId = null;
      state.votedFor.clear();
      
      showToast('✅ Kreation gelöscht! Du kannst jetzt eine neue erstellen.', 'success');
      
      // Reset wizard
      resetWizard();
      
    } catch (error) {
      console.error('Delete error:', error);
      showToast('❌ Fehler beim Löschen. Bitte versuche es erneut.', 'error');
      deleteBtn.disabled = false;
      deleteBtn.textContent = '🗑️ Löschen & Neu erstellen';
    }
  });
}

// Check if user already has a creation
async function checkAlreadyCreated() {
  const ownCreationId = localStorage.getItem('juicebox-own-creation-id');
  if (!ownCreationId) return;
  
  const section = document.getElementById('already-created-section');
  if (!section) return;
  
  // Try to load creation data
  let creation = null;
  const cachedData = localStorage.getItem('juicebox-own-creation-data');
  
  if (cachedData) {
    try {
      creation = JSON.parse(cachedData);
    } catch (e) {
      console.error('Failed to parse cached creation data');
    }
  }
  
  // If no cached data, fetch directly by ID
  if (!creation) {
    try {
      creation = await getCreationById(ownCreationId);
      if (creation) {
        localStorage.setItem('juicebox-own-creation-data', JSON.stringify(creation));
      }
    } catch (e) {
      console.error('Failed to fetch creation data');
    }
  }
  
  if (!creation) {
    // Creation might have been deleted - clear localStorage
    localStorage.removeItem('juicebox-own-creation-id');
    localStorage.removeItem('juicebox-own-creation-name');
    localStorage.removeItem('juicebox-own-creation-data');
    return;
  }
  
  // Populate the already-created section
  const flavorIds = creation.primary_flavor ? creation.primary_flavor.split(',') : [];
  const selectedFlavors = flavorIds.map(id => primaryFlavors.find(f => f.id === id)).filter(Boolean);
  const accent = accents.find(a => a.id === creation.accent);
  
  let emoji = selectedFlavors.length > 0 
    ? selectedFlavors.map(f => f.emoji).join('')
    : '🧃';
  if (accent && accent.id !== 'none') emoji += accent.emoji;
  
  const details = [
    ...selectedFlavors.map(f => f.name),
    accent && accent.id !== 'none' ? accent.name : null,
    creation.variant === 'light' ? '💪 Light' : '🍬 Original',
  ].filter(Boolean).join(' • ');
  
  // Update DOM
  const imageEl = document.getElementById('already-created-image');
  const nameEl = document.getElementById('already-created-name');
  const detailsEl = document.getElementById('already-created-details');
  const votesEl = document.getElementById('already-created-votes');
  const rankEl = document.getElementById('already-created-rank');
  
  if (creation.image_url && imageEl) {
    imageEl.innerHTML = `<img src="${creation.image_url}" alt="${creation.name}">`;
  } else if (imageEl) {
    imageEl.innerHTML = `<span class="already-created-emoji">${emoji}</span>`;
  }
  
  if (nameEl) nameEl.textContent = creation.name;
  if (detailsEl) detailsEl.textContent = details;
  if (votesEl) votesEl.textContent = `${creation.votes_count || 0} 👍`;
  
  // Calculate rank (approximate)
  try {
    const creations = await getCreations(100, 0);
    const rank = creations.findIndex(c => c.id === ownCreationId) + 1;
    if (rankEl) rankEl.textContent = rank > 0 ? `#${rank}` : '—';
  } catch (e) {
    if (rankEl) rankEl.textContent = '—';
  }
  
  // Show the section
  section.classList.remove('hidden');
}

// Native share helper function
async function nativeShare(title, text, url) {
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return true;
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Share failed:', err);
      }
      return false;
    }
  }
  return false;
}

// Copy to clipboard helper
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // Fallback
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    return true;
  }
}

// Setup success page event listeners
function setupSuccessPageListeners() {
  // Copy/Share link button - uses native share on mobile
  document.getElementById('success-copy-link')?.addEventListener('click', async () => {
    const creation = window.currentCreation;
    if (!creation) return;
    
    const shareUrl = `${window.location.origin}${window.location.pathname}?vote=${creation.id}`;
    const shareTitle = `JuiceBox Limited: ${creation.name}`;
    const shareText = `Ich hab meine eigene JuiceBox Limited Edition kreiert: "${creation.name}"! 🧃 Stimm für mich ab!`;
    
    // Try native share first (mobile)
    const shared = await nativeShare(shareTitle, shareText, shareUrl);
    
    if (!shared) {
      // Fallback to clipboard copy
      await copyToClipboard(shareUrl);
      const btn = document.getElementById('success-copy-link');
      btn.classList.add('copied');
      btn.textContent = '✅ Link kopiert!';
      showToast('🔗 Link kopiert!', 'success');
      
      setTimeout(() => {
        btn.classList.remove('copied');
        btn.textContent = '🔗 Link kopieren';
      }, 3000);
    }
  });
  
  // WhatsApp share
  document.getElementById('share-whatsapp')?.addEventListener('click', () => {
    const creation = window.currentCreation;
    if (!creation) return;
    const shareUrl = `${window.location.origin}${window.location.pathname}?vote=${creation.id}`;
    const text = `Ich hab meine eigene JuiceBox Limited Edition kreiert: "${creation.name}"! 🧃 Stimm für mich ab: ${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  });
  
  // Instagram (copy to clipboard since no direct share)
  document.getElementById('share-instagram')?.addEventListener('click', async () => {
    const creation = window.currentCreation;
    if (!creation) return;
    const shareUrl = `${window.location.origin}${window.location.pathname}?vote=${creation.id}`;
    const text = `Ich hab meine eigene JuiceBox Limited Edition kreiert: "${creation.name}"! 🧃 Stimm ab: ${shareUrl}`;
    
    try {
      await navigator.clipboard.writeText(text);
      showToast('📋 Text kopiert! Füge ihn in deine Instagram Story ein.', 'success');
    } catch (err) {
      showToast('Öffne Instagram und teile den Link!', 'success');
    }
  });
  
  // Twitter/X share
  document.getElementById('share-twitter')?.addEventListener('click', () => {
    const creation = window.currentCreation;
    if (!creation) return;
    const shareUrl = `${window.location.origin}${window.location.pathname}?vote=${creation.id}`;
    const text = `Ich hab meine eigene JuiceBox Limited Edition kreiert: "${creation.name}"! 🧃 Stimm für mich ab:`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
  });
  
  // Facebook share
  document.getElementById('share-facebook')?.addEventListener('click', () => {
    const creation = window.currentCreation;
    if (!creation) return;
    const shareUrl = `${window.location.origin}${window.location.pathname}?vote=${creation.id}`;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank', 'width=600,height=400');
  });
  
  // Go to leaderboard
  document.getElementById('go-to-leaderboard')?.addEventListener('click', () => {
    switchTab('vote');
    loadCreations();
  });
  
  // Delete creation button
  document.getElementById('delete-creation-btn')?.addEventListener('click', () => {
    const ownCreationId = localStorage.getItem('juicebox-own-creation-id');
    const ownCreationName = localStorage.getItem('juicebox-own-creation-name');
    if (!ownCreationId) return;
    
    document.getElementById('delete-creation-name').textContent = `"${ownCreationName || 'Deine Kreation'}"`;
    document.getElementById('delete-confirm-check').checked = false;
    document.getElementById('delete-confirm').disabled = true;
    document.getElementById('delete-creation-modal').classList.remove('hidden');
  });
  
  // Delete modal checkbox
  document.getElementById('delete-confirm-check')?.addEventListener('change', (e) => {
    document.getElementById('delete-confirm').disabled = !e.target.checked;
  });
  
  // Delete modal cancel
  document.getElementById('delete-cancel')?.addEventListener('click', () => {
    document.getElementById('delete-creation-modal').classList.add('hidden');
  });
  
  // Delete modal confirm
  document.getElementById('delete-confirm')?.addEventListener('click', async () => {
    const ownCreationId = localStorage.getItem('juicebox-own-creation-id');
    if (!ownCreationId) return;
    
    const confirmBtn = document.getElementById('delete-confirm');
    confirmBtn.disabled = true;
    confirmBtn.textContent = '⏳ Wird gelöscht...';
    
    try {
      await deleteCreation(ownCreationId);
      
      // Clear localStorage (all creation-related data)
      localStorage.removeItem('juicebox-own-creation-id');
      localStorage.removeItem('juicebox-own-creation-name');
      localStorage.removeItem('juicebox-own-creation-data');
      localStorage.removeItem('juicebox-voted-for');
      localStorage.removeItem('juicebox-voted-for-name');
      
      // Hide modal
      document.getElementById('delete-creation-modal').classList.add('hidden');
      
      // Hide my-creation section in leaderboard
      document.getElementById('my-creation-section')?.classList.add('hidden');
      
      // Hide already-created section in builder
      document.getElementById('already-created-section')?.classList.add('hidden');
      
      // Reset state
      state.justCreatedId = null;
      state.votedFor.clear();
      
      showToast('✅ Kreation gelöscht! Du kannst jetzt eine neue erstellen.', 'success');
      
      // Go to create section
      switchTab('create');
      
      // Reset wizard
      resetWizard();
      
    } catch (error) {
      console.error('Delete error:', error);
      showToast('❌ Fehler beim Löschen. Bitte versuche es erneut.', 'error');
      confirmBtn.disabled = false;
      confirmBtn.textContent = '🗑️ Endgültig löschen';
    }
  });
}

// Reset wizard to start state
function resetWizard() {
  // Clear selections
  state.primaryFlavors = [];
  state.accent = 'none';
  state.variant = 'original';
  
  // Reset UI
  document.querySelectorAll('.flavor-btn').forEach(btn => btn.classList.remove('selected'));
  document.querySelectorAll('.accent-btn').forEach(btn => {
    btn.classList.remove('selected');
    if (btn.dataset.id === 'none') btn.classList.add('selected');
  });
  document.querySelectorAll('.variant-btn').forEach(btn => {
    btn.classList.remove('selected');
    if (btn.dataset.id === 'original') btn.classList.add('selected');
  });
  
  // Reset name input
  elements.nameInput.value = '';
  elements.submitBtn.disabled = true;
  
  // Reset to step 1
  document.querySelectorAll('.wizard-step').forEach((step, i) => {
    step.classList.toggle('active', i === 0);
  });
  document.querySelectorAll('.progress-step').forEach((step, i) => {
    step.classList.toggle('active', i === 0);
  });
  
  // Update preview
  updatePreview();
  updatePrimaryCounter();
  
  // Hide welcome screen
  document.getElementById('welcome-screen').classList.add('hidden');
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
    updateChallengeStats();
    
    elements.loadMoreBtn.style.display = creations.length === state.limit ? 'block' : 'none';
  } catch (error) {
    console.error('Load error:', error);
    elements.leaderboard.innerHTML = '<div class="empty-state">Fehler beim Laden. Versuch es nochmal.</div>';
  }
}

// Update challenge stats banner
function updateChallengeStats() {
  // Calculate days until challenge ends (example: Feb 28, 2026)
  const challengeEndDate = new Date('2026-02-28T23:59:59');
  const now = new Date();
  const daysRemaining = Math.max(0, Math.ceil((challengeEndDate - now) / (1000 * 60 * 60 * 24)));
  
  const countdownEl = document.getElementById('countdown-days');
  const totalCreationsEl = document.getElementById('total-creations');
  const totalVotesEl = document.getElementById('total-votes');
  
  if (countdownEl) {
    countdownEl.textContent = daysRemaining;
    // Change color if urgent
    if (daysRemaining <= 3) {
      countdownEl.parentElement.parentElement.style.background = '#ff5722';
    }
  }
  
  if (totalCreationsEl) {
    totalCreationsEl.textContent = state.creations.length;
  }
  
  if (totalVotesEl) {
    const totalVotes = state.creations.reduce((sum, c) => sum + (c.votes_count || 0), 0);
    totalVotesEl.textContent = totalVotes;
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
    
    const shareUrl = `${window.location.origin}/bestenliste?creation=${c.id}`;
    
    return `
      <div class="creation-wrapper">
        <div class="creation-rank ${isTop3 ? 'top-3' : ''}">${isJustCreated || isSharedHighlight ? '✨' : '#' + rank}</div>
        <div class="creation-card ${c.image_url ? 'has-image' : ''} ${isJustCreated || isSharedHighlight ? 'highlighted' : ''}">
          <div class="creation-image-wrapper">
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
              <button class="share-link-btn" data-url="${shareUrl}" title="Link kopieren">🔗</button>
              ${hideVoteButton ? '' : `
                <button class="vote-btn ${voteButtonClass}" data-id="${c.id}" ${voteButtonDisabled ? 'disabled' : ''}>
                  ${voteButtonText}
                </button>
              `}
            </div>
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
  
  // Add share link button listeners
  document.querySelectorAll('.share-link-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const url = btn.dataset.url;
      try {
        await navigator.clipboard.writeText(url);
        btn.textContent = '✓';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.textContent = '🔗';
          btn.classList.remove('copied');
        }, 2000);
      } catch (err) {
        // Fallback for older browsers
        const input = document.createElement('input');
        input.value = url;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        btn.textContent = '✓';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.textContent = '🔗';
          btn.classList.remove('copied');
        }, 2000);
      }
    });
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
  
  // Reset modal state
  isRemovingVote = false;
  document.querySelector('#vote-modal h3').textContent = 'Vote abgeben?';
  document.querySelector('#vote-modal p:first-of-type').textContent = 'Du willst für';
  document.querySelector('#vote-modal .modal-warning').textContent = '⚠️ Nur ein Vote pro Person möglich!';
  document.getElementById('vote-confirm').textContent = '✅ Let\'s go!';
}

// Flag to prevent double voting from modal
let isConfirmingVote = false;

// Confirm vote
async function confirmVote() {
  if (!pendingVoteId || isConfirmingVote) return;
  isConfirmingVote = true;
  
  const creationId = pendingVoteId;
  const creationName = pendingVoteName;
  hideVoteModal();
  
  try {
    // Get email from localStorage (creator or voter email)
    const voterEmail = localStorage.getItem('juicebox-creator-email') || localStorage.getItem('juicebox-voter-email');
    await voteForCreation(creationId, voterEmail);
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
  } finally {
    isConfirmingVote = false;
  }
}

// Show remove vote confirmation
function showRemoveVoteConfirmation(creationId) {
  const creation = state.creations.find(c => c.id === creationId);
  if (!creation) return;
  
  pendingVoteId = creationId;
  pendingVoteName = creation.name;
  isRemovingVote = true;
  
  // Reuse vote modal but change text
  elements.voteModalName.textContent = `"${creation.name}"`;
  document.querySelector('#vote-modal h3').textContent = 'Stimme entfernen?';
  document.querySelector('#vote-modal p:first-of-type').textContent = 'Willst du deine Stimme für';
  document.querySelector('#vote-modal .modal-warning').textContent = '⚠️ Du kannst danach für eine andere Sorte stimmen.';
  document.getElementById('vote-confirm').textContent = '🗑️ Entfernen';
  elements.voteModal.classList.remove('hidden');
}

// Confirm remove vote
async function confirmRemoveVote() {
  if (!pendingVoteId) return;
  
  const creationId = pendingVoteId;
  hideVoteModal();
  
  // Reset modal text and state for next use
  isRemovingVote = false;
  document.querySelector('#vote-modal h3').textContent = 'Vote abgeben?';
  document.querySelector('#vote-modal p:first-of-type').textContent = 'Du willst für';
  document.querySelector('#vote-modal .modal-warning').textContent = '⚠️ Nur ein Vote pro Person möglich!';
  document.getElementById('vote-confirm').textContent = '✅ Let\'s go!';
  
  try {
    const voterEmail = localStorage.getItem('juicebox-creator-email') || localStorage.getItem('juicebox-voter-email');
    await removeVote(creationId, voterEmail);
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
    const ownCreationName = localStorage.getItem('juicebox-own-creation-name');
    if (!ownCreationId) return;
    
    const shareUrl = `${window.location.origin}${window.location.pathname}?vote=${ownCreationId}`;
    const shareTitle = `JuiceBox Limited: ${ownCreationName || 'Meine Kreation'}`;
    const shareText = `Ich hab meine eigene JuiceBox Limited Edition kreiert: "${ownCreationName}"! 🧃 Stimm für mich ab!`;
    
    // Try native share first (mobile)
    const shared = await nativeShare(shareTitle, shareText, shareUrl);
    
    if (!shared) {
      // Fallback to clipboard copy
      try {
        await copyToClipboard(shareUrl);
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
  
  // Hide CTA banner if user has already voted (regardless of name being stored)
  if (votedForId) {
    ctaBanner?.classList.add('hidden');
    
    // Show voted banner if we have the name
    if (votedForName && banner && nameEl) {
      nameEl.textContent = `"${votedForName}"`;
      banner.classList.remove('hidden');
    } else {
      banner?.classList.add('hidden');
    }
  } else {
    banner?.classList.add('hidden');
    ctaBanner?.classList.remove('hidden');
  }
}

// State for vote modal action
let isRemovingVote = false;

// Setup modal event listeners
elements.voteCancel.addEventListener('click', hideVoteModal);
elements.voteConfirm.addEventListener('click', () => {
  if (isRemovingVote) {
    confirmRemoveVote();
  } else {
    confirmVote();
  }
});

// Close modal on backdrop click
elements.voteModal.addEventListener('click', (e) => {
  if (e.target === elements.voteModal) hideVoteModal();
});

// Vote Email Modal handlers
const voteEmailModal = document.getElementById('vote-email-modal');
const voteEmailInput = document.getElementById('vote-email-input');
const voteEmailConfirm = document.getElementById('vote-email-confirm');
const voteEmailCancel = document.getElementById('vote-email-cancel');

// Validate email input (same regex as creation email)
voteEmailInput?.addEventListener('input', () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = emailRegex.test(voteEmailInput.value.trim());
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
// Flag to prevent double voting
let isVoting = false;

voteEmailConfirm?.addEventListener('click', async () => {
  if (isVoting) return;
  
  const email = voteEmailInput.value.trim();
  if (!email || !pendingVoteId) return;
  
  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showToast('Bitte gib eine gültige E-Mail-Adresse ein!', 'error');
    return;
  }
  
  isVoting = true;
  voteEmailConfirm.disabled = true;
  voteEmailConfirm.textContent = '⏳ Wird abgestimmt...';
  
  // Store email for future votes
  localStorage.setItem('juicebox-voter-email', email);
  
  // Update user display
  if (window.updateUserDisplay) window.updateUserDisplay();
  
  // Hide modal
  voteEmailModal?.classList.add('hidden');
  voteEmailInput.value = '';
  
  // Now do the actual vote
  const creationId = pendingVoteId;
  const creationName = pendingVoteName;
  
  try {
    await voteForCreation(creationId, email);
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
  } finally {
    isVoting = false;
    voteEmailConfirm.disabled = false;
    voteEmailConfirm.textContent = '✅ Vote abgeben!';
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
// Remove all active classes first, then set the correct one
viewButtons.forEach(b => b.classList.remove('active'));
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

// Mobile Sidebar
const hamburgerBtn = document.getElementById('hamburger-btn');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const sidebarClose = document.getElementById('sidebar-close');
const sidebarCreator = document.getElementById('sidebar-creator');
const sidebarLeaderboard = document.getElementById('sidebar-leaderboard');
const sidebarUserInfo = document.getElementById('sidebar-user-info');
const sidebarUserEmail = document.getElementById('sidebar-user-email');
const sidebarLogoutBtn = document.getElementById('sidebar-logout-btn');

function openSidebar() {
  sidebar?.classList.add('active');
  sidebarOverlay?.classList.add('active');
  hamburgerBtn?.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeSidebar() {
  sidebar?.classList.remove('active');
  sidebarOverlay?.classList.remove('active');
  hamburgerBtn?.classList.remove('active');
  document.body.style.overflow = '';
}

// Sync sidebar nav visibility with desktop nav
function syncSidebarNav() {
  const navCreator = document.getElementById('nav-creator');
  const navLeaderboard = document.getElementById('nav-leaderboard');
  
  if (navCreator?.classList.contains('hidden')) {
    sidebarCreator?.classList.add('hidden');
  } else {
    sidebarCreator?.classList.remove('hidden');
  }
  
  if (navLeaderboard?.classList.contains('hidden')) {
    sidebarLeaderboard?.classList.add('hidden');
  } else {
    sidebarLeaderboard?.classList.remove('hidden');
  }
  
  // Sync user info
  const userInfo = document.getElementById('user-info');
  const userEmail = document.getElementById('user-email');
  if (userInfo && !userInfo.classList.contains('hidden')) {
    sidebarUserInfo?.classList.add('active');
    if (sidebarUserEmail && userEmail) {
      sidebarUserEmail.textContent = userEmail.textContent;
    }
  } else {
    sidebarUserInfo?.classList.remove('active');
  }
}

hamburgerBtn?.addEventListener('click', openSidebar);
sidebarOverlay?.addEventListener('click', closeSidebar);
sidebarClose?.addEventListener('click', closeSidebar);

// Close sidebar when clicking a link
[sidebarCreator, sidebarLeaderboard].forEach(link => {
  link?.addEventListener('click', () => {
    closeSidebar();
  });
});

// Sidebar logout
sidebarLogoutBtn?.addEventListener('click', () => {
  closeSidebar();
  // Trigger the main logout
  document.getElementById('logout-btn')?.click();
});

// Sync on page load and observe changes
syncSidebarNav();

// Use MutationObserver to keep sidebar in sync
const navCreatorEl = document.getElementById('nav-creator');
if (navCreatorEl) {
  const observer = new MutationObserver(syncSidebarNav);
  observer.observe(navCreatorEl, { attributes: true, attributeFilter: ['class'] });
}

const userInfoEl = document.getElementById('user-info');
if (userInfoEl) {
  const observer = new MutationObserver(syncSidebarNav);
  observer.observe(userInfoEl, { attributes: true, attributeFilter: ['class'] });
}

// Start
init();
