/**
 * Crochet Pricing Calculator — script.js
 * ----------------------------------------
 * All pricing logic, UI interactions, and
 * result rendering live here.
 *
 * Pricing rates (per hour):
 *   Simple  → ₹120
 *   Medium  → ₹160
 *   Complex → ₹200
 *
 * Profit tiers:
 *   Minimum Selling Price       → 30% profit
 *   Ideal Instagram Price       → 40% profit
 *   Premium Aesthetic Brand     → 50% profit
 */

/* ── Labour rates ─────────────────────────────── */
const LABOUR_RATE = {
  simple:  120,
  medium:  160,
  complex: 200
};

/* ── Indian market suggested ranges by type ────── */
const MARKET_RANGE = {
  "Amigurumi / Stuffed Toy": { low: 250, high: 900 },
  "Bag / Purse":             { low: 350, high: 1500 },
  "Clothing / Wearable":     { low: 500, high: 2500 },
  "Home Décor":              { low: 200, high: 1200 },
  "Accessories (Hat, Scarf…)":{low: 200, high: 800  },
  "Other":                   { low: 150, high: 1000 }
};

/* ── DOM References ───────────────────────────── */
const form              = document.getElementById('calcForm');
const calcBtn           = document.getElementById('calcBtn');
const resetBtn          = document.getElementById('resetBtn');
const deliverySelect    = document.getElementById('deliveryIncluded');
const deliveryCostField = document.getElementById('deliveryCostField');
const timeSpentInput    = document.getElementById('timeSpent');
const timeUnitSelect    = document.getElementById('timeUnit');
const timeHint          = document.getElementById('timeHint');
const resultsSection    = document.getElementById('results');
const breakdownBody     = document.getElementById('breakdownBody');
const baseCostCell      = document.getElementById('baseCostCell');
const priceCards        = document.getElementById('priceCards');
const analysisBox       = document.getElementById('analysisBox');

/* ── Delivery field toggle ────────────────────── */
deliverySelect.addEventListener('change', () => {
  if (deliverySelect.value === 'yes') {
    deliveryCostField.classList.remove('hidden-field');
  } else {
    deliveryCostField.classList.add('hidden-field');
    document.getElementById('deliveryCost').value = '';
  }
});

// Initialize on load
deliveryCostField.classList.add('hidden-field');

/* ── Auto time-hint: show hours equivalent ──────── */
function updateTimeHint() {
  const val  = parseFloat(timeSpentInput.value) || 0;
  const unit = timeUnitSelect.value;

  if (!val) { timeHint.textContent = ''; return; }

  if (unit === 'minutes') {
    const hrs = (val / 60).toFixed(2);
    timeHint.textContent = `≈ ${hrs} hour${hrs === '1.00' ? '' : 's'}`;
  } else {
    const mins = Math.round(val * 60);
    timeHint.textContent = `= ${mins} minutes`;
  }
}

timeSpentInput.addEventListener('input', updateTimeHint);
timeUnitSelect.addEventListener('change', updateTimeHint);

/* ── Helper: get numeric field value (0 if empty) ── */
function num(id) {
  return parseFloat(document.getElementById(id).value) || 0;
}

/* ── Helper: format currency ───────────────────── */
function fmt(n) {
  return '₹' + Math.round(n).toLocaleString('en-IN');
}

/* ── Helper: selected complexity ───────────────── */
function getComplexity() {
  const checked = document.querySelector('input[name="complexity"]:checked');
  return checked ? checked.value : 'medium';
}

/* ── Main calculate function ───────────────────── */
function calculate() {
  /* 1. Gather inputs */
  const yarnGrams      = num('yarnGrams');
  const yarnPrice      = num('yarnPrice');       // per 100g
  const stuffingGrams  = num('stuffingGrams');
  const stuffingCost   = num('stuffingCost');    // per 100g
  const accessoriesCost= num('accessoriesCost');
  const packagingCost  = num('packagingCost');
  const deliveryCost   = deliverySelect.value === 'yes' ? num('deliveryCost') : 0;

  const timeVal        = num('timeSpent');
  const timeUnit       = timeUnitSelect.value;
  const productType    = document.getElementById('productType').value || 'Other';
  const complexity     = getComplexity();

  /* 2. Convert time → hours */
  const timeHours = timeUnit === 'minutes' ? timeVal / 60 : timeVal;

  /* 3. Calculate individual costs */
  const yarnCost     = (yarnGrams / 100) * yarnPrice;
  const stuffCost    = (stuffingGrams / 100) * stuffingCost;
  const labourRate   = LABOUR_RATE[complexity];
  const labourCost   = timeHours * labourRate;

  /* 4. Base cost = all costs combined */
  const materialCost = yarnCost + stuffCost + accessoriesCost;
  const baseCost     = materialCost + labourCost + packagingCost + deliveryCost;

  /* 5. Selling prices at different profit margins */
  const minPrice     = baseCost * 1.30;  // 30% profit
  const instaPrice   = baseCost * 1.40;  // 40% profit
  const premiumPrice = baseCost * 1.50;  // 50% profit

  /* 6. Render cost breakdown table */
  const rows = [
    ['🧶 Yarn',         yarnCost],
    ['🪶 Stuffing',     stuffCost],
    ['📎 Accessories',  accessoriesCost],
    ['🛍️ Packaging',   packagingCost],
    ['🚚 Delivery',     deliveryCost],
    [`⏱️ Labour (${complexity}, ${timeHours.toFixed(2)} hr × ₹${labourRate})`, labourCost],
  ].filter(r => r[1] > 0);  // hide zero-value rows

  breakdownBody.innerHTML = rows.map(([label, val]) =>
    `<tr><td>${label}</td><td>${fmt(val)}</td></tr>`
  ).join('');

  baseCostCell.textContent = fmt(baseCost);

  /* 7. Render price cards */
  priceCards.innerHTML = `
    <div class="price-card min">
      <div class="label">Minimum Price</div>
      <div class="amount">${fmt(minPrice)}</div>
      <div class="profit-tag">30% profit margin</div>
    </div>
    <div class="price-card insta">
      <div class="label">Instagram Price</div>
      <div class="amount">${fmt(instaPrice)}</div>
      <div class="profit-tag">40% profit margin ✨</div>
    </div>
    <div class="price-card premium">
      <div class="label">Premium Brand</div>
      <div class="amount">${fmt(premiumPrice)}</div>
      <div class="profit-tag">50% profit margin</div>
    </div>
  `;

  /* 8. Analysis */
  renderAnalysis(instaPrice, productType, baseCost);

  /* 9. Show results */
  resultsSection.classList.remove('hidden');
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ── Analysis renderer ─────────────────────────── */
function renderAnalysis(instaPrice, productType, baseCost) {
  const range   = MARKET_RANGE[productType] || MARKET_RANGE['Other'];
  const midMarket = (range.low + range.high) / 2;

  // Pricing assessment
  let pricingTag, pricingMsg;
  if (instaPrice < range.low) {
    pricingTag = `<span class="tag red">Underpriced</span>`;
    pricingMsg = `Your Instagram price (${fmt(instaPrice)}) is below the typical Indian market range for this product type. Consider raising your price — buyers associate higher prices with quality craftsmanship.`;
  } else if (instaPrice > range.high) {
    pricingTag = `<span class="tag orange">Premium</span>`;
    pricingMsg = `Your price (${fmt(instaPrice)}) is above the typical range. This works if you have a strong brand/aesthetic or offer customisation — but be ready to justify your value.`;
  } else {
    pricingTag = `<span class="tag green">Well Priced</span>`;
    pricingMsg = `Your Instagram price (${fmt(instaPrice)}) sits nicely within the market range. Buyers are likely to consider it fair.`;
  }

  // Will customers buy?
  let buyLikelihood;
  if (instaPrice <= range.low * 1.2) {
    buyLikelihood = '✅ Very likely — this is an accessible price point for Indian buyers.';
  } else if (instaPrice <= midMarket) {
    buyLikelihood = '🤔 Likely — customers who value handmade quality will buy at this price.';
  } else if (instaPrice <= range.high) {
    buyLikelihood = '💡 Possible — target buyers who appreciate handmade artistry & aesthetics.';
  } else {
    buyLikelihood = '⚠️ Niche audience — position as a premium / gifting brand to convert sales.';
  }

  // Advice
  const advice = baseCost < 50
    ? '💬 Low material cost detected. Make sure you\'re valuing your time fairly — labour is your biggest asset!'
    : '💬 Showcase your process (reels, behind-the-scenes) to justify your price and build trust with buyers.';

  analysisBox.innerHTML = `
    <h3>Market Analysis</h3>
    <div class="analysis-item">
      <span class="icon">📊</span>
      <div>
        <strong>Suggested market range in India (${productType}):</strong>
        ${fmt(range.low)} – ${fmt(range.high)}
      </div>
    </div>
    <div class="analysis-item">
      <span class="icon">🏷️</span>
      <div>
        <strong>Pricing status:</strong> ${pricingTag}<br/>
        <span style="color:var(--muted);font-size:.88rem">${pricingMsg}</span>
      </div>
    </div>
    <div class="analysis-item">
      <span class="icon">🛒</span>
      <div><strong>Will customers buy?</strong> ${buyLikelihood}</div>
    </div>
    <div class="analysis-item">
      <span class="icon">📣</span>
      <div>${advice}</div>
    </div>
  `;
}

/* ── Reset ─────────────────────────────────────── */
function resetForm() {
  form.reset();
  // Re-apply default state
  deliveryCostField.classList.add('hidden-field');
  timeHint.textContent = '';
  resultsSection.classList.add('hidden');
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ── Event listeners ───────────────────────────── */
calcBtn.addEventListener('click', calculate);
resetBtn.addEventListener('click', resetForm);