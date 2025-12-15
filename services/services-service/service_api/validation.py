from __future__ import annotations

from typing import Any, Dict, Tuple


def parse_payload(raw_payload: Any) -> Dict[str, Any]:
    if isinstance(raw_payload, dict):
        return raw_payload
    return {}


def validate_new_service(payload: Dict[str, Any]) -> Tuple[str, str]:
    name = payload.get("name")
    description = payload.get("description", "")

    if not isinstance(name, str) or not name.strip():
        raise ValueError("Field 'name' is required and must be a non-empty string")
    if not isinstance(description, str):
        raise ValueError("Field 'description' must be a string")

    return name.strip(), description.strip()


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
