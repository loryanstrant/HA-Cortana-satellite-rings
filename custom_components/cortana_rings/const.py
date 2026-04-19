"""Constants for the Cortana Rings integration."""
from __future__ import annotations

import json
import logging
from pathlib import Path

_LOGGER = logging.getLogger(__name__)

DOMAIN = "cortana_rings"

# Read version from manifest for Lovelace cache-busting
_MANIFEST_PATH = Path(__file__).parent / "manifest.json"
try:
    with open(_MANIFEST_PATH, encoding="utf-8") as _f:
        VERSION = json.load(_f).get("version", "1.0.0")
except Exception:
    VERSION = "1.0.0"

# Card registration
CARD_JS = "cortana-rings-card.js"
CARD_URL = "/cortana-rings-card.js"
CARD_URL_VERSIONED = f"{CARD_URL}?v={VERSION}"
CARD_PATH = Path(__file__).parent / "www" / CARD_JS

# Sound files served under this HTTP prefix
SOUNDS_URL_PREFIX = "/cortana_rings/sounds"
SOUNDS_DIR = Path(__file__).parent / "www" / "sounds"

# Config entry keys
CONF_SATELLITE = "satellite_entity_id"
CONF_MEDIA_PLAYER = "media_player_entity_id"
