"""Config flow for Cortana Rings."""
from __future__ import annotations

from typing import Any

import voluptuous as vol

from homeassistant.config_entries import ConfigEntry, ConfigFlow, ConfigFlowResult, OptionsFlow
from homeassistant.core import callback
from homeassistant.helpers.selector import EntitySelector, EntitySelectorConfig

from .const import CONF_MEDIA_PLAYER, CONF_SATELLITE, DOMAIN

_STEP_USER_SCHEMA = vol.Schema(
    {
        vol.Required(CONF_SATELLITE): EntitySelector(
            EntitySelectorConfig(domain="assist_satellite")
        ),
        vol.Optional(CONF_MEDIA_PLAYER, default=""): EntitySelector(
            EntitySelectorConfig(domain="media_player")
        ),
    }
)


class CortanaRingsConfigFlow(ConfigFlow, domain=DOMAIN):  # type: ignore[call-arg]
    """Handle a config flow for Cortana Rings."""

    VERSION = 1

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: ConfigEntry) -> CortanaRingsOptionsFlow:
        """Return the options flow handler."""
        return CortanaRingsOptionsFlow(config_entry)

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Handle the initial setup step."""
        if user_input is not None:
            satellite = user_input[CONF_SATELLITE]
            await self.async_set_unique_id(satellite)
            self._abort_if_unique_id_configured()
            return self.async_create_entry(
                title=f"Cortana Rings ({satellite})",
                data=user_input,
            )

        return self.async_show_form(
            step_id="user",
            data_schema=_STEP_USER_SCHEMA,
        )


class CortanaRingsOptionsFlow(OptionsFlow):
    """Handle options for Cortana Rings (reconfiguration)."""

    def __init__(self, config_entry: ConfigEntry) -> None:
        """Store the config entry for use in the options steps."""
        self._config_entry = config_entry

    async def async_step_init(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Manage options."""
        if user_input is not None:
            return self.async_create_entry(title="", data=user_input)

        current = {**self._config_entry.data, **self._config_entry.options}
        schema = vol.Schema(
            {
                vol.Required(
                    CONF_SATELLITE,
                    default=current.get(CONF_SATELLITE, ""),
                ): EntitySelector(EntitySelectorConfig(domain="assist_satellite")),
                vol.Optional(
                    CONF_MEDIA_PLAYER,
                    default=current.get(CONF_MEDIA_PLAYER, ""),
                ): EntitySelector(EntitySelectorConfig(domain="media_player")),
            }
        )

        return self.async_show_form(step_id="init", data_schema=schema)
