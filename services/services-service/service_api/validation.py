from __future__ import annotations

from typing import Any, Dict, Tuple


def parse_payload(raw_payload: Any) -> Dict[str, Any]:
    if isinstance(raw_payload, dict):
        return raw_payload
    return {}


def _get_app_id(payload: Dict[str, Any]) -> str:
    app_id = payload.get("appId")
    if not isinstance(app_id, str) or not app_id.strip():
        raise ValueError("Field 'appId' is required and must be a non-empty string")
    return app_id.strip()


def validate_new_service(payload: Dict[str, Any]) -> Tuple[str, str, str]:
    name = payload.get("name")
    description = payload.get("description", "")
    app_id = _get_app_id(payload)

    if not isinstance(name, str) or not name.strip():
        raise ValueError("Field 'name' is required and must be a non-empty string")
    if not isinstance(description, str):
        raise ValueError("Field 'description' must be a string")

    return name.strip(), description.strip(), app_id


def validate_app_id_query_param(raw_value: Any) -> str:
    if not isinstance(raw_value, str) or not raw_value.strip():
        raise ValueError('Query parameter "appId" is required and must be a non-empty string')
    return raw_value.strip()


def validate_updates(payload: Dict[str, Any]) -> Dict[str, str]:
    updates: Dict[str, str] = {}

    if "name" in payload:
        name = payload["name"]
        if not isinstance(name, str) or not name.strip():
            raise ValueError("Field 'name' must be a non-empty string when provided")
        updates["name"] = name.strip()

    if "description" in payload:
        description = payload["description"]
        if not isinstance(description, str):
            raise ValueError("Field 'description' must be a string when provided")
        updates["description"] = description.strip()

    if not updates:
        raise ValueError("Provide at least one of 'name' or 'description' to update")

    return updates
