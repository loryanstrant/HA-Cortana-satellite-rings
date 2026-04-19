/**
 * Cortana Rings Card for Home Assistant
 *
 * Visual design pixel-reverse-engineered from authentic Cortana GIFs.
 * Reference: 400×300px, 231 frames @ 30ms/frame = 6.93s full cycle.
 *
 * PIXEL-EXACT RING COLOUR ZONES (horizontal cross-section, frame 0):
 *   Zone 1: BACKGROUND  r=0–48  #0e0e0e  (14.14,14)
 *   Zone 2: INNER EDGE  r=49    #09424f  1px anti-alias
 *   Zone 3: BRIGHT CYAN r=50–58 #00a0c6  9px solid bright
 *   Zone 4: TRANSITION  r=59    #0290b2  1px
 *   Zone 5: TRANSITION  r=60    #057089  1px
 *   Zone 6: DARK TEAL   r=61–76 #06667c  16px solid dark
 *   Zone 7: OUTER EDGE  r=77    #065c71  1px
 *   Zone 8: OUTER SHADOW r=78   #0a3640  1px
 *   Zone 9: BACKGROUND  r=79+   #0e0e0e
 *
 * The ring is TWO SEPARATE CONCENTRIC BANDS:
 *   Inner bright band: r_centre=54, stroke-width=10 → spans r=49–59
 *   Outer dark band:   r_centre=68.5, stroke-width=18 → spans r=59.5–77.5
 *   Total ring: 30px from r=49 to r=78
 *   Ratio bright:dark = 1:2 (inner 1/3 bright, outer 2/3 dark)
 *
 * ANIMATION (frame-by-frame analysis):
 *   - Ring stays PERFECTLY CIRCULAR at all frames (h/v ratio = 1.000)
 *   - Breathing = OPACITY ONLY (no scale, no scaleY)
 *   - Double heartbeat pulse at frames 108–115 and 118–122:
 *     Ring contracts to scale(0.22) → visual r≈14, then expands back
 */

const CARD_VERSION = "1.0.4";

// ── Cortana colour palette (pixel-extracted from reference GIFs) ─────────────
const C_BRIGHT  = "#00A0C6";   // Bright cyan inner band   (r=50-58 in GIF)
const C_BODY    = "#06667C";   // Dark teal outer band      (r=61-76 in GIF)
const C_BG      = "#0e0e0e";   // Background (near-black)

// ─────────────────────────────────────────────────────────────────────────────
// Shared CSS
// ─────────────────────────────────────────────────────────────────────────────
const CARD_STYLES = `
  :host { display: block; }
  ha-card { background: transparent; border: none; overflow: hidden; }

  .card-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px 16px 14px;
    background: ${C_BG};
    border-radius: var(--ha-card-border-radius, 12px);
    min-height: 220px;
  }

  .rings-wrapper {
    position: relative;
    width: 190px;
    height: 190px;
  }

  .rings-svg {
    width: 100%;
    height: 100%;
    overflow: visible;
  }

  /* Transform anchoring for scale/rotate animations */
  .ring-bright, .ring-dark, .ring-glow, .pulse-group {
    transform-box: fill-box;
    transform-origin: center;
  }

  .entity-label {
    margin-top: 12px;
    font-size: 10px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    color: rgba(0, 160, 198, 0.45);
    letter-spacing: 0.7px;
    text-align: center;
    max-width: 190px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .state-badge {
    margin-top: 5px;
    font-size: 9px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    color: rgba(0, 160, 198, 0.50);
    letter-spacing: 2px;
    text-transform: uppercase;
  }

  /* ══ IDLE — opacity-only breathing, ring stays circular ════════════

     The DARK outer band dims in opacity so the ring appears to
     "narrow" to just the bright inner band — exactly matching the GIF
     where the ring width oscillates 29px→19px→29px.

     The BRIGHT inner band stays constant — always visible.
     The GLOW dims together with the dark band.                        */

  @keyframes idle-dark {
    0%, 100% { opacity: 1.00; }
    50%       { opacity: 0.0; }
  }
  .state-idle .ring-dark {
    animation: idle-dark 3.5s ease-in-out infinite;
  }

  @keyframes idle-glow {
    0%, 100% { opacity: 0.50; }
    50%       { opacity: 0.08; }
  }
  .state-idle .ring-glow {
    animation: idle-glow 3.5s ease-in-out infinite;
  }

  /* Bright inner band stays at full opacity — no idle animation */

  /* Double heartbeat pulse: frames 108-122 in GIF.
     A bright ring contracts from scale(1) to scale(0.22) → r≈14.
     Fires twice per 7s supercycle, 330ms apart.                       */
  @keyframes idle-pulse {
    0%,  43%  { opacity: 0;    transform: scale(1.00); }
    44%        { opacity: 0.75; transform: scale(1.00); }
    45.5%      { opacity: 0.35; transform: scale(0.50); }
    47%        { opacity: 0.15; transform: scale(0.22); }
    48.5%      { opacity: 0.35; transform: scale(0.58); }
    50%        { opacity: 0;    transform: scale(1.00); }
    51.5%      { opacity: 0;    transform: scale(1.00); }
    52.5%      { opacity: 0.75; transform: scale(1.00); }
    54%        { opacity: 0.35; transform: scale(0.50); }
    55.5%      { opacity: 0.15; transform: scale(0.22); }
    57%        { opacity: 0.35; transform: scale(0.58); }
    58.5%      { opacity: 0;    transform: scale(1.00); }
    100%       { opacity: 0;    transform: scale(1.00); }
  }
  .state-idle .pulse-group {
    animation: idle-pulse 7s ease-in-out infinite;
  }

  /* ══ LISTENING — faster breathing ══════════════════════════════════ */
  @keyframes listen-dark {
    0%, 100% { opacity: 1.00; }
    50%       { opacity: 0.20; }
  }
  .state-listening .ring-dark {
    animation: listen-dark 0.90s ease-in-out infinite;
  }
  @keyframes listen-glow {
    0%, 100% { opacity: 0.70; }
    50%       { opacity: 0.15; }
  }
  .state-listening .ring-glow {
    animation: listen-glow 0.90s ease-in-out infinite;
  }

  /* ══ PROCESSING — arc orbit via stroke-dashoffset ═════════════════
     Bright band C = 2π×54  ≈ 339.3px  → dasharray "100 13"
     Dark band   C = 2π×68.5 ≈ 430.4px → dasharray "127 17"
     Three arcs visible with small gaps, rotating smoothly.             */
  .state-processing .ring-bright {
    stroke-dasharray: 100 13;
  }
  .state-processing .ring-dark {
    stroke-dasharray: 127 17;
  }
  .state-processing .ring-glow {
    stroke-dasharray: 127 17;
  }
  @keyframes dash-bright {
    from { stroke-dashoffset: 0; }
    to   { stroke-dashoffset: -339.3; }
  }
  @keyframes dash-dark {
    from { stroke-dashoffset: 0; }
    to   { stroke-dashoffset: -430.4; }
  }
  .state-processing .ring-bright {
    animation: dash-bright 2.2s linear infinite;
  }
  .state-processing .ring-dark,
  .state-processing .ring-glow {
    animation: dash-dark 2.2s linear infinite;
  }

  /* ══ RESPONDING — scale ripple (expand + fade) ═══════════════════════ */
  @keyframes respond {
    0%   { transform: scale(0.92); opacity: 1.00; }
    65%  { transform: scale(1.16); opacity: 0.45; }
    100% { transform: scale(1.22); opacity: 0.00; }
  }
  .state-responding .ring-bright,
  .state-responding .ring-dark,
  .state-responding .ring-glow {
    animation: respond 1.5s ease-out infinite;
  }

  /* ══ UNAVAILABLE / UNKNOWN ═══════════════════════════════════════════ */
  .state-unavailable .ring-bright, .state-unavailable .ring-dark,
  .state-unavailable .ring-glow,   .state-unavailable .pulse-group,
  .state-unknown     .ring-bright, .state-unknown     .ring-dark,
  .state-unknown     .ring-glow,   .state-unknown     .pulse-group {
    opacity: 0.10 !important;
    animation: none !important;
  }
`;

const _VALID_STATES = new Set(["idle", "listening", "processing", "responding"]);

// ─────────────────────────────────────────────────────────────────────────────
// CortanaRingsCard
// ─────────────────────────────────────────────────────────────────────────────
class CortanaRingsCard extends HTMLElement {
  constructor() {
    super();
    this._config = {};
    this._hass = null;
    this._prevState = null;
    this._svg = null;
    this._entityLabel = null;
    this._stateBadge = null;
  }

  // ── Static helpers required by Lovelace ────────────────────────────────────

  static getConfigElement() {
    return document.createElement("cortana-rings-card-editor");
  }

  static getStubConfig() {
    return { entity: "", media_player: "" };
  }

  // ── Lovelace lifecycle ─────────────────────────────────────────────────────

  setConfig(config) {
    if (!config.entity) {
      throw new Error("Cortana Rings: 'entity' is required (assist_satellite.*)");
    }
    this._config = config;
    // If already rendered, update labels
    if (this._entityLabel) {
      this._entityLabel.textContent = config.entity;
    }
  }

  set hass(hass) {
    this._hass = hass;
    if (!this.shadowRoot) {
      this._buildCard();
    }
    this._updateState();
  }

  getCardSize() {
    return 3;
  }

  // ── Shadow DOM construction (runs once) ───────────────────────────────────

  _buildCard() {
    const shadow = this.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = CARD_STYLES;
    shadow.appendChild(style);

    const card = document.createElement("ha-card");
    const content = document.createElement("div");
    content.className = "card-content";

    const wrapper = document.createElement("div");
    wrapper.className = "rings-wrapper";

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 200 200");
    svg.setAttribute("class", "rings-svg state-idle");

    // ── Pixel-exact Cortana ring SVG ─────────────────────────────────────
    //
    // TWO separate concentric ring bands (not one ring with an edge):
    //
    //   Bright inner band: SVG circle r=54,  SW=10  → paints r=49–59
    //     Colour: #00A0C6 (pixel-exact from GIF r=50–58)
    //
    //   Dark outer band:   SVG circle r=68.5, SW=18 → paints r=59.5–77.5
    //     Colour: #06667C (pixel-exact from GIF r=61–76)
    //
    //   Glow: blurred copy of the dark band, drawn behind everything
    //
    //   Pulse ring: clone of bright band, normally invisible,
    //     fires the double-heartbeat contraction animation
    svg.innerHTML = `
      <defs>
        <filter id="ring-blur" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="5"/>
        </filter>
      </defs>

      <!-- Dark background — #0e0e0e exact match -->
      <circle cx="100" cy="100" r="98" fill="${C_BG}"/>

      <!-- Glow: blurred dark-teal halo behind the ring -->
      <circle class="ring-glow" cx="100" cy="100" r="68.5"
        fill="none"
        stroke="${C_BODY}"
        stroke-width="24"
        filter="url(#ring-blur)"/>

      <!-- Dark outer band: r=68.5, SW=18 → spans r=59.5–77.5 -->
      <circle class="ring-dark" cx="100" cy="100" r="68.5"
        fill="none"
        stroke="${C_BODY}"
        stroke-width="18"/>

      <!-- Bright inner band: r=54, SW=10 → spans r=49–59 -->
      <circle class="ring-bright" cx="100" cy="100" r="54"
        fill="none"
        stroke="${C_BRIGHT}"
        stroke-width="10"/>

      <!-- Heartbeat pulse ring (clone of bright band, initially hidden) -->
      <g class="pulse-group">
        <circle cx="100" cy="100" r="54"
          fill="none"
          stroke="${C_BRIGHT}"
          stroke-width="10"/>
      </g>
    `;

    this._svg = svg;
    wrapper.appendChild(svg);
    content.appendChild(wrapper);

    // Entity name label
    const label = document.createElement("div");
    label.className = "entity-label";
    label.textContent = this._config.entity || "";
    this._entityLabel = label;
    content.appendChild(label);

    // State badge
    const badge = document.createElement("div");
    badge.className = "state-badge";
    badge.textContent = "idle";
    this._stateBadge = badge;
    content.appendChild(badge);

    card.appendChild(content);
    shadow.appendChild(card);
  }

  // ── State management ───────────────────────────────────────────────────────

  _updateState() {
    if (!this._hass || !this._config.entity) return;

    const stateObj = this._hass.states[this._config.entity];
    const state = stateObj ? stateObj.state : "unavailable";

    if (state !== this._prevState) {
      this._onStateChange(this._prevState, state);
      this._prevState = state;
    }

    this._applyState(state);
  }

  _applyState(state) {
    if (!this._svg) return;
    const cssState = _VALID_STATES.has(state)
      ? state
      : state === "unavailable" ? "unavailable" : "unknown";
    this._svg.setAttribute("class", `rings-svg state-${cssState}`);
    if (this._stateBadge) {
      this._stateBadge.textContent = state;
    }
  }

  // ── Sound / state-change handler ──────────────────────────────────────────

  _onStateChange(prevState, newState) {
    if (!this._config.media_player) return;

    let soundFile = null;

    if (newState === "listening") {
      // User interaction started — play "start listening" chime
      soundFile = "cortana-listening.wav";
    } else if (prevState === "listening" && newState === "processing") {
      // User finished speaking — play "stop listening" chime
      soundFile = "cortana-stop-listening.wav";
    } else if (newState === "responding") {
      // Response about to be spoken — play "thinking done" chime
      soundFile = "cortana-thinking.wav";
    } else if (newState === "idle" && prevState === "responding") {
      // Interaction complete — play completion chime
      soundFile = "cortana-complete.wav";
    }

    if (soundFile) {
      this._playSound(soundFile);
    }
  }

  _playSound(soundFile) {
    const hass = this._hass;
    if (!hass || !this._config.media_player) return;

    const hassUrl =
      hass.auth && hass.auth.data && hass.auth.data.hassUrl
        ? hass.auth.data.hassUrl.replace(/\/$/, "")
        : window.location.origin;

    hass.callService("media_player", "play_media", {
      entity_id: this._config.media_player,
      media_content_id: `${hassUrl}/cortana_rings/sounds/${soundFile}`,
      media_content_type: "music",
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CortanaRingsCardEditor  (visual config panel)
// ─────────────────────────────────────────────────────────────────────────────
class CortanaRingsCardEditor extends HTMLElement {
  constructor() {
    super();
    this._config = {};
    this._hass = null;
    this._rendered = false;
  }

  setConfig(config) {
    this._config = { ...config };
    if (this._rendered) {
      this._syncPickerValues();
    }
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._rendered) {
      if (!this.shadowRoot) this.attachShadow({ mode: "open" });
      this._render();
      this._rendered = true;
    } else {
      // Push updated hass to existing pickers so their entity lists stay current
      const pickers = this.shadowRoot.querySelectorAll("ha-entity-picker");
      pickers.forEach((p) => {
        p.hass = hass;
      });
    }
  }

  _render() {
    const shadow = this.shadowRoot;
    shadow.innerHTML = `
      <style>
        .editor {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .field-label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: var(--secondary-text-color);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 6px;
        }
        .hint {
          font-size: 11px;
          color: var(--disabled-text-color, rgba(0, 0, 0, 0.38));
          margin-top: 5px;
          line-height: 1.4;
        }
      </style>
      <div class="editor">
        <div>
          <span class="field-label">Voice Assistant Satellite</span>
          <ha-entity-picker
            id="satellite-picker"
            allow-custom-entity
            label="Select satellite entity…"
          ></ha-entity-picker>
          <div class="hint">Entity domain: <code>assist_satellite</code></div>
        </div>
        <div>
          <span class="field-label">Media Player (Cortana sounds)</span>
          <ha-entity-picker
            id="media-picker"
            allow-custom-entity
            label="Select media player… (optional)"
          ></ha-entity-picker>
          <div class="hint">Leave empty to disable sound playback.</div>
        </div>
      </div>
    `;

    this._satellitePicker = shadow.getElementById("satellite-picker");
    this._mediaPicker = shadow.getElementById("media-picker");

    // Set JS properties (not HTML attributes) — must happen after DOM insertion
    this._satellitePicker.hass = this._hass;
    this._satellitePicker.includeDomains = ["assist_satellite"];

    this._mediaPicker.hass = this._hass;
    this._mediaPicker.includeDomains = ["media_player"];

    this._syncPickerValues();

    this._satellitePicker.addEventListener("value-changed", (e) => {
      this._config = { ...this._config, entity: e.detail.value };
      this._fireConfigChanged();
    });

    this._mediaPicker.addEventListener("value-changed", (e) => {
      this._config = { ...this._config, media_player: e.detail.value };
      this._fireConfigChanged();
    });
  }

  _syncPickerValues() {
    if (this._satellitePicker) {
      this._satellitePicker.value = this._config.entity || "";
    }
    if (this._mediaPicker) {
      this._mediaPicker.value = this._config.media_player || "";
    }
  }

  _fireConfigChanged() {
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: this._config },
        bubbles: true,
        composed: true,
      })
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Register custom elements & advertise card to Lovelace
// ─────────────────────────────────────────────────────────────────────────────
customElements.define("cortana-rings-card", CortanaRingsCard);
customElements.define("cortana-rings-card-editor", CortanaRingsCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "cortana-rings-card",
  name: "Cortana Rings",
  description:
    "Cortana-style concentric ring animations for voice assistant satellites, with authentic Cortana sounds.",
  preview: true,
  documentationURL: "https://github.com/loryanstrant/HA-Cortana-satellite-rings",
});

console.info(
  `%c CORTANA-RINGS-CARD %c v${CARD_VERSION} `,
  "color: #0078D4; background: #050510; font-weight: 700; padding: 2px 4px;",
  "color: #050510; background: #0078D4; font-weight: 400; padding: 2px 4px;"
);