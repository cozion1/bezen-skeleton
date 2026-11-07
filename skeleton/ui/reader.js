/**
 * skeleton/ui/reader.js — shared front-end module
 *
 * Exports: initReader({ endpoint, examples, showRoute })
 *
 * Covers: Req 9.1, 9.2, 4.3, 5.2
 *
 * Rendering order:
 *   1. Safety banner (if reading.safety === true)
 *   2. Route badge (if showRoute === true)
 *   3. What they are protecting
 *   4. The quote with ✓ verified or ⚠ unverified badge
 *   5. What not to do
 *   6. Next message with Copy button
 */

/**
 * @typedef {Object} InitOptions
 * @property {string}   endpoint  - URL of the Netlify Function to POST to
 * @property {Array<{label: string, text: string}>} examples - Example buttons
 * @property {boolean}  [showRoute=false] - When true, render a route badge in the output
 */

/**
 * @param {InitOptions} options
 */
export function initReader({ endpoint, examples = [], showRoute = false }) {
  // ── DOM wiring ──────────────────────────────────────────────────────────────
  const form      = document.getElementById('reader-form');
  const textarea  = document.getElementById('reader-input');
  const submitBtn = document.getElementById('reader-submit');
  const status    = document.getElementById('reader-status');
  const output    = document.getElementById('reader-output');
  const examplesEl = document.getElementById('reader-examples');

  if (!form || !textarea || !submitBtn || !status || !output) {
    console.error('initReader: required DOM elements not found');
    return;
  }

  // ── Example buttons ─────────────────────────────────────────────────────────
  if (examplesEl && examples.length > 0) {
    examplesEl.innerHTML = '';
    for (const ex of examples) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'example-btn';
      btn.textContent = ex.label;
      btn.addEventListener('click', () => {
        textarea.value = ex.text;
        textarea.focus();
      });
      examplesEl.appendChild(btn);
    }
  }

  // ── Form submit ─────────────────────────────────────────────────────────────
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = textarea.value.trim();
    if (!text) return;

    setLoading(true);
    clearOutput();

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      const data = await res.json();

      if (!res.ok) {
        showError(data.error || `Error ${res.status}`);
        return;
      }

      renderReading(data, output, { showRoute });
    } catch (err) {
      showError('Could not reach the reading service. Please try again.');
    } finally {
      setLoading(false);
    }
  });

  // ── Helpers ─────────────────────────────────────────────────────────────────

  function setLoading(on) {
    submitBtn.disabled = on;
    status.hidden = !on;
    status.textContent = on ? 'Reading…' : '';
    if (!on) status.hidden = true;
  }

  function clearOutput() {
    output.innerHTML = '';
    output.hidden = true;
  }

  function showError(msg) {
    output.innerHTML = '';
    const el = document.createElement('p');
    el.className = 'reading-error';
    el.dir = 'auto';
    el.textContent = msg;
    output.appendChild(el);
    output.hidden = false;
  }
}

// ── renderReading ─────────────────────────────────────────────────────────────

/**
 * Render a Reading object into a container element.
 * Exported separately so apps can call it directly if needed.
 *
 * @param {object} reading
 * @param {HTMLElement} container
 * @param {object} [opts]
 * @param {boolean} [opts.showRoute=false] - Render a route badge when true
 */
export function renderReading(reading, container, { showRoute = false } = {}) {
  container.innerHTML = '';

  // 1. Safety banner
  if (reading.safety === true) {
    const banner = document.createElement('div');
    banner.className = 'safety-banner';
    banner.setAttribute('role', 'alert');
    banner.dir = 'auto';
    banner.textContent =
      'Talk with this child now. If there is any risk to their safety, contact a professional or emergency services immediately.';
    container.appendChild(banner);
  }

  // 2. Route badge
  if (showRoute && reading.route) {
    const badge = document.createElement('div');
    if (reading.route === 'human') {
      badge.className = 'badge-route badge-route-human';
      badge.textContent = 'Hand this to a person';
    } else {
      badge.className = 'badge-route badge-route-bot';
      badge.textContent = 'An agent may answer this';
    }
    container.appendChild(badge);
  }

  // 2. What they are protecting
  if (reading.protecting) {
    const section = createSection('protecting', 'What they are protecting');
    const p = document.createElement('p');
    p.dir = 'auto';
    p.textContent = reading.protecting;
    section.appendChild(p);
    container.appendChild(section);
  }

  // 3. Quote with verified/unverified badge
  if (reading.quote !== undefined) {
    const section = createSection('quote', 'Their words');
    const blockquote = document.createElement('blockquote');
    blockquote.dir = 'auto';
    blockquote.textContent = reading.quote || '(no quote)';

    const badge = document.createElement('span');
    if (reading.verified) {
      badge.className = 'badge badge-verified';
      badge.textContent = '✓ Verified';
      badge.title = 'This quote was found in the original message.';
    } else {
      badge.className = 'badge badge-unverified';
      badge.textContent = '⚠ Unverified reading — the quote was not found in the message';
      badge.setAttribute('role', 'alert');
    }

    section.appendChild(blockquote);
    section.appendChild(badge);
    container.appendChild(section);
  }

  // 4. What not to do
  if (reading.doNot) {
    const section = createSection('do-not', 'Do not');
    const p = document.createElement('p');
    p.dir = 'auto';
    p.textContent = reading.doNot;
    section.appendChild(p);
    container.appendChild(section);
  }

  // 5. Next message with Copy button
  if (reading.nextMessage) {
    const section = createSection('next-message', 'Suggested reply');
    const p = document.createElement('p');
    p.dir = 'auto';
    p.textContent = reading.nextMessage;

    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'copy-btn';
    copyBtn.textContent = 'Copy';
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(reading.nextMessage);
        copyBtn.textContent = 'Copied!';
        setTimeout(() => { copyBtn.textContent = 'Copy'; }, 2000);
      } catch {
        // Fallback: select the text
        const range = document.createRange();
        range.selectNode(p);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
      }
    });

    section.appendChild(p);
    section.appendChild(copyBtn);
    container.appendChild(section);
  }

  container.hidden = false;
}

/**
 * Create a labeled section element.
 * @param {string} cls
 * @param {string} label
 * @returns {HTMLElement}
 */
function createSection(cls, label) {
  const section = document.createElement('div');
  section.className = `reading-section reading-${cls}`;

  const h3 = document.createElement('h3');
  h3.className = 'reading-label';
  h3.textContent = label;

  section.appendChild(h3);
  return section;
}
