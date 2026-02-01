// JuiceBox Limited Edition Builder - Main App

import { primaryFlavors, accents, baseTypes, variants } from './data/flavors.js';
import { supabase, getCreations, createCreation, updateCreationImage, voteForCreation, getVisitorIp, hasVoted, generateCreationImage } from './lib/supabase.js';

// Constants
const MAX_PRIMARY_FLAVORS = 3;

// State
const state = {
  primaryFlavors: [], // Array of selected flavor IDs (max 3)
  accent: 'none',
  baseType: 'normal',
  variant: 'light',
  visitorIp: null,
  votedFor: new Set(),
  creations: [],
  offset: 0,
  limit: 10,
};

// DOM Elements
const elements = {
  tabs: document.querySelectorAll('.tab'),
  sections: document.querySelectorAll('.section'),
  primaryGrid: document.getElementById('primary-flavors'),
  accentsGrid: document.getElementById('accents'),
  baseTypeGroup: document.getElementById('base-type'),
  variantGroup: document.getElementById('variant'),
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
};

// Initialize
async function init() {
  state.visitorIp = await getVisitorIp();
  renderFlavorGrids();
  renderToggles();
  setupEventListeners();
  updatePreview();
  updatePrimaryCounter();
}

// Render Flavor Grids
function renderFlavorGrids() {
  elements.primaryGrid.innerHTML = primaryFlavors.map(f => 
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
  elements.baseTypeGroup.innerHTML = baseTypes.map(b => 
    `<button class="toggle-btn ${state.baseType === b.id ? 'selected' : ''}" data-id="${b.id}" data-type="baseType">
      ${b.name}
    </button>`
  ).join('');

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
    elements.primaryCounter.style.display = 'inline-flex';
    elements.counterText.textContent = `${count}/${MAX_PRIMARY_FLAVORS} gewählt`;
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
  tags.push(state.baseType === 'eistee' ? 'Eistee' : 'Normal');
  tags.push(state.variant === 'light' ? 'Light' : 'Original');
  
  elements.previewTags.innerHTML = tags.map(t => `<span class="preview-tag">${t}</span>`).join('');
}

// Validate Form
function validateForm() {
  const name = elements.nameInput.value.trim();
  const hasValidName = name.length >= 3 && name.length <= 30 && /^[a-zA-Z0-9äöüÄÖÜß\s\-]+$/.test(name);
  const hasFlavors = state.primaryFlavors.length > 0;
  
  elements.submitBtn.disabled = !(hasValidName && hasFlavors);
}

// Submit Creation
async function submitCreation() {
  const name = elements.nameInput.value.trim();
  
  try {
    elements.submitBtn.disabled = true;
    elements.submitBtn.textContent = '⏳ Wird eingereicht...';
    
    // Join primary flavors with comma
    const creationData = {
      name,
      primary_flavor: state.primaryFlavors.join(','),
      secondary_flavor: null, // Not used anymore
      accent: state.accent !== 'none' ? state.accent : null,
      base_type: state.baseType,
      variant: state.variant,
      creator_ip: state.visitorIp,
    };
    
    // Create the entry first
    const creation = await createCreation(creationData);
    
    showToast('🎉 Deine Kreation wurde eingereicht!', 'success');
    
    // Generate image in background
    elements.submitBtn.textContent = '🎨 Bild wird generiert...';
    
    try {
      const imageResult = await generateCreationImage(creation);
      if (imageResult && imageResult.imageUrl) {
        await updateCreationImage(creation.id, imageResult.imageUrl);
        showToast('🖼️ Produktbild wurde erstellt!', 'success');
      }
    } catch (imgError) {
      console.error('Image generation error:', imgError);
      // Don't fail the whole submission if image fails
    }
    
    resetForm();
  } catch (error) {
    console.error('Submit error:', error);
    showToast('❌ Fehler beim Einreichen. Versuch es nochmal.', 'error');
  } finally {
    elements.submitBtn.disabled = false;
    elements.submitBtn.textContent = '🚀 Einreichen';
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
    
    // Image display
    const imageHtml = c.image_url 
      ? `<img src="${c.image_url}" alt="${c.name}" class="creation-image" loading="lazy">`
      : `<div class="creation-emoji">${emoji}</div>`;
    
    return `
      <div class="creation-card ${c.image_url ? 'has-image' : ''}">
        <div class="creation-rank ${isTop3 ? 'top-3' : ''}">#${rank}</div>
        ${imageHtml}
        <div class="creation-info">
          <div class="creation-name">${c.name}</div>
          <div class="creation-details">${details} | ${c.base_type === 'eistee' ? 'Eistee' : 'Normal'} ${c.variant === 'light' ? 'Light' : 'Original'}</div>
        </div>
        <div class="creation-vote">
          <span class="vote-count">${c.votes_count} 👍</span>
          <button class="vote-btn ${voted ? 'voted' : ''}" data-id="${c.id}" ${voted ? 'disabled' : ''}>
            ${voted ? '✓ Gestimmt' : '👍 Vote'}
          </button>
        </div>
      </div>
    `;
  }).join('');
  
  // Add vote listeners
  document.querySelectorAll('.vote-btn:not(.voted)').forEach(btn => {
    btn.addEventListener('click', () => vote(btn.dataset.id));
  });
}

// Vote
async function vote(creationId) {
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
