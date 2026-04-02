from __future__ import annotations

from typing import Any, Dict, Tuple


def parse_payload(raw_payload: Any) -> Dict[str, Any]:
    if isinstance(raw_payload, dict):
        return raw_payload
    return {}


DEFAULT_APP_ID = "default-app"
DEFAULT_LIMIT = 20
MAX_LIMIT = 100


def _normalize_app_id(raw_value: Any, *, required: bool = False) -> str:
    if raw_value is None:
        if required:
            raise ValueError("Field 'appId' is required and must be a non-empty string")
        return DEFAULT_APP_ID

    if not isinstance(raw_value, str) or not raw_value.strip():
        if required:
            raise ValueError("Field 'appId' is required and must be a non-empty string")
        return DEFAULT_APP_ID

    return raw_value.strip()


def validate_new_service(payload: Dict[str, Any]) -> Tuple[str, str, str]:
    name = payload.get("name")
    description = payload.get("description", "")
    app_id = _normalize_app_id(payload.get("appId"))

    if not isinstance(name, str) or not name.strip():
        raise ValueError("Field 'name' is required and must be a non-empty string")
    if not isinstance(description, str):
        raise ValueError("Field 'description' must be a string")

    return name.strip(), description.strip(), app_id


def validate_app_id_query_param(raw_value: Any) -> str:
    return _normalize_app_id(raw_value)


def parse_pagination_params(raw_limit: Any, raw_offset: Any) -> Tuple[int, int]:
    limit = _parse_non_negative_int(raw_limit, "limit", DEFAULT_LIMIT)
    offset = _parse_non_negative_int(raw_offset, "offset", 0)
    return min(limit, MAX_LIMIT), offset


def _parse_non_negative_int(raw_value: Any, field_name: str, default: int) -> int:
    if raw_value is None or raw_value == "":
        return default

    try:
        parsed = int(raw_value)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"Query parameter '{field_name}' must be a non-negative integer") from exc

    if parsed < 0:
        raise ValueError(f"Query parameter '{field_name}' must be a non-negative integer")
    return parsed


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
