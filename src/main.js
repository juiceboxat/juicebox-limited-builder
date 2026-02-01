// JuiceBox Limited Edition Builder - Main App

import { primaryFlavors, secondaryFlavors, accents, baseTypes, variants } from './data/flavors.js';
import { supabase, getCreations, createCreation, voteForCreation, getVisitorIp, hasVoted } from './lib/supabase.js';

// State
const state = {
  primary: null,
  secondary: null,
  accent: null,
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
  secondaryGrid: document.getElementById('secondary-flavors'),
  accentsGrid: document.getElementById('accents'),
  baseTypeGroup: document.getElementById('base-type'),
  variantGroup: document.getElementById('variant'),
  previewEmoji: document.getElementById('preview-emoji'),
  previewName: document.getElementById('preview-name'),
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
}

// Render Flavor Grids
function renderFlavorGrids() {
  elements.primaryGrid.innerHTML = primaryFlavors.map(f => 
    `<button class="flavor-btn" data-id="${f.id}" data-type="primary">
      <span class="emoji">${f.emoji}</span>
      <span class="name">${f.name}</span>
    </button>`
  ).join('');

  elements.secondaryGrid.innerHTML = secondaryFlavors.map(f => 
    `<button class="flavor-btn" data-id="${f.id}" data-type="secondary">
      <span class="emoji">${f.emoji}</span>
      <span class="name">${f.name}</span>
    </button>`
  ).join('');

  elements.accentsGrid.innerHTML = accents.map(a => 
    `<button class="flavor-btn" data-id="${a.id}" data-type="accent">
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

// Select Flavor
function selectFlavor(btn) {
  const type = btn.dataset.type;
  const id = btn.dataset.id;
  
  // Toggle selection
  if (state[type] === id) {
    state[type] = null;
    btn.classList.remove('selected');
  } else {
    // Remove previous selection
    document.querySelectorAll(`.flavor-btn[data-type="${type}"]`).forEach(b => b.classList.remove('selected'));
    state[type] = id;
    btn.classList.add('selected');
  }
  
  updatePreview();
  validateForm();
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
  const primary = primaryFlavors.find(f => f.id === state.primary);
  const secondary = secondaryFlavors.find(f => f.id === state.secondary);
  const accent = accents.find(a => a.id === state.accent);
  
  // Build emoji
  let emoji = primary ? primary.emoji : '🧃';
  if (secondary) emoji += secondary.emoji;
  if (accent && accent.id !== 'none') emoji += accent.emoji;
  
  // Build name
  let nameParts = [];
  if (primary) nameParts.push(primary.name);
  if (secondary) nameParts.push(secondary.name);
  if (accent && accent.id !== 'none') nameParts.push(accent.name);
  
  let name = nameParts.length > 0 ? nameParts.join(' + ') : 'Wähle Zutaten...';
  name += ` | ${state.baseType === 'eistee' ? 'Eistee' : 'Normal'} ${state.variant === 'light' ? 'Light' : 'Original'}`;
  
  elements.previewEmoji.textContent = emoji;
  elements.previewName.textContent = name;
}

// Validate Form
function validateForm() {
  const name = elements.nameInput.value.trim();
  const isValid = state.primary && name.length >= 3 && name.length <= 30 && /^[a-zA-Z0-9äöüÄÖÜß\s]+$/.test(name);
  elements.submitBtn.disabled = !isValid;
}

// Submit Creation
async function submitCreation() {
  const name = elements.nameInput.value.trim();
  
  try {
    elements.submitBtn.disabled = true;
    elements.submitBtn.textContent = '⏳ Wird eingereicht...';
    
    const creation = {
      name,
      primary_flavor: state.primary,
      secondary_flavor: state.secondary,
      accent: state.accent,
      base_type: state.baseType,
      variant: state.variant,
      creator_ip: state.visitorIp,
    };
    
    await createCreation(creation);
    
    showToast('🎉 Deine Kreation wurde eingereicht!', 'success');
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
  state.primary = null;
  state.secondary = null;
  state.accent = null;
  elements.nameInput.value = '';
  
  document.querySelectorAll('.flavor-btn').forEach(btn => btn.classList.remove('selected'));
  updatePreview();
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
    const primary = primaryFlavors.find(f => f.id === c.primary_flavor);
    const secondary = secondaryFlavors.find(f => f.id === c.secondary_flavor);
    const accent = accents.find(a => a.id === c.accent);
    
    let emoji = primary ? primary.emoji : '🧃';
    if (secondary) emoji += secondary.emoji;
    if (accent && accent.id !== 'none') emoji += accent.emoji;
    
    const details = [
      primary?.name,
      secondary?.name,
      accent && accent.id !== 'none' ? accent.name : null,
    ].filter(Boolean).join(' + ');
    
    const voted = state.votedFor.has(c.id);
    
    return `
      <div class="creation-card">
        <div class="creation-rank">#${state.offset + i + 1}</div>
        <div class="creation-emoji">${emoji}</div>
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
