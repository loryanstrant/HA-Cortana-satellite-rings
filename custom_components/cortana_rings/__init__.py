"""Cortana Rings \u2014 visual voice assistant indicator for Home Assistant."""
from __future__ import annotations

import asyncio
import logging

from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.typing import ConfigType
import homeassistant.helpers.config_validation as cv

from .const import (
    CARD_PATH,
    CARD_URL,
    CARD_URL_VERSIONED,
    DOMAIN,
    SOUNDS_DIR,
    SOUNDS_URL_PREFIX,
    VERSION,
)

_LOGGER = logging.getLogger(__name__)

CONFIG_SCHEMA = cv.empty_config_schema(DOMAIN)

_LOVELACE_MAX_RETRIES = 3
_LOVELACE_RETRY_DELAY = 2  # seconds


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Set up the Cortana Rings integration (YAML stub)."""
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up Cortana Rings from a config entry."""
    await _async_register_static_paths(hass)

    if hass.is_running:
        await _async_register_lovelace_resource(hass)
    else:
        async def _deferred(_event: object) -> None:
            await _async_register_lovelace_resource(hass)

        hass.bus.async_listen_once("homeassistant_started", _deferred)

    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a Cortana Rings config entry."""
    return True


# \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
# Internal helpers
# \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

async def _async_register_static_paths(hass: HomeAssistant) -> None:
    """Register static HTTP paths for the card JS and sound files."""
    try:
        await hass.http.async_register_static_paths(
            [
                StaticPathConfig(CARD_URL, str(CARD_PATH), cache_headers=False),
                StaticPathConfig(
                    SOUNDS_URL_PREFIX, str(SOUNDS_DIR), cache_headers=True
                ),
            ]
        )
        _LOGGER.debug("Cortana Rings: registered static paths")
    except RuntimeError:
        # Paths already registered on a reload \u2014 safe to ignore
        pass


async def _async_register_lovelace_resource(
    hass: HomeAssistant,
    retry_count: int = 0,
) -> None:
    """Add the card JS as a Lovelace module resource, with retry logic."""
    lovelace_data = hass.data.get("lovelace")

    if lovelace_data is None:
        if retry_count < _LOVELACE_MAX_RETRIES:
            _LOGGER.debug(
                "Cortana Rings: Lovelace not ready, retrying in %ds (%d/%d)",
                _LOVELACE_RETRY_DELAY,
                retry_count + 1,
                _LOVELACE_MAX_RETRIES,
            )
            await asyncio.sleep(_LOVELACE_RETRY_DELAY)
            return await _async_register_lovelace_resource(hass, retry_count + 1)

        _LOGGER.warning(
            "Cortana Rings: could not register card \u2014 Lovelace not initialised after "
            "%d retries. Add manually: Settings \u2192 Dashboards \u2192 Resources \u2192 %s (module)",
            _LOVELACE_MAX_RETRIES,
            CARD_URL_VERSIONED,
        )
        return

    resources = getattr(lovelace_data, "resources", None)
    if resources is None and hasattr(lovelace_data, "get"):
        resources = lovelace_data.get("resources")

    if resources is None:
        if retry_count < _LOVELACE_MAX_RETRIES:
            await asyncio.sleep(_LOVELACE_RETRY_DELAY)
            return await _async_register_lovelace_resource(hass, retry_count + 1)
        _LOGGER.warning(
            "Cortana Rings: Lovelace is in YAML mode. Add resource manually:\n"
            "  lovelace:\n    resources:\n      - url: %s\n        type: module",
            CARD_URL_VERSIONED,
        )
        return

    if not hasattr(resources, "async_create_item") or not hasattr(
        resources, "async_items"
    ):
        _LOGGER.warning(
            "Cortana Rings: Lovelace resources API unavailable \u2014 cannot auto-register card"
        )
        return

    # Find any existing cortana_rings resource
    for resource in resources.async_items():
        url = resource.get("url", "")
        if url.startswith(CARD_URL):
            if url != CARD_URL_VERSIONED:
                try:
                    await resources.async_update_item(
                        resource["id"],
                        {"url": CARD_URL_VERSIONED, "res_type": "module"},
                    )
                    _LOGGER.info("Cortana Rings: updated card resource to v%s", VERSION)
                except Exception as err:  # noqa: BLE001
                    _LOGGER.warning(
                        "Cortana Rings: failed to update Lovelace resource: %s", err
                    )
            else:
                _LOGGER.debug("Cortana Rings: card already at current version")
            return

    # No existing resource \u2014 create one
    try:
        await resources.async_create_item(
            {"url": CARD_URL_VERSIONED, "res_type": "module"}
        )
        _LOGGER.info("Cortana Rings: registered card as Lovelace resource (v%s)", VERSION)
    except Exception as err:  # noqa: BLE001
        _LOGGER.warning("Cortana Rings: failed to register Lovelace resource: %s", err)
