from __future__ import annotations

from typing import Dict

from flask import Blueprint, abort, current_app, jsonify, request, url_for
from .validation import parse_payload, validate_new_service, validate_updates

services_bp = Blueprint("services", __name__, url_prefix="/api/services")


def _services() -> Dict[int, Dict[str, str]]:
    return current_app.config["SERVICES"]


def _next_id() -> int:
    service_id = current_app.config["NEXT_SERVICE_ID"]
    current_app.config["NEXT_SERVICE_ID"] = service_id + 1
    return service_id


def _ensure_service_or_404(service_id: int) -> Dict[str, str]:
    service = _services().get(service_id)
    if service is None:
        abort(404, description="Service not found")
    return service


@services_bp.get("")
def list_services():
    return jsonify(list(_services().values()))


@services_bp.post("")
def create_service():
    payload = parse_payload(request.get_json(silent=True))

    try:
        name, description = validate_new_service(payload)
    except ValueError as exc:
        abort(400, description=str(exc))

    service_id = _next_id()
    service = {"id": service_id, "name": name, "description": description}
    _services()[service_id] = service

    response = jsonify(service)
    response.status_code = 201
    response.headers["Location"] = url_for("services.get_service", service_id=service["id"])
    return response


@services_bp.get("/<int:service_id>")
def get_service(service_id: int):
    service = _ensure_service_or_404(service_id)
    return jsonify(service)


@services_bp.put("/<int:service_id>")
def update_service(service_id: int):
    payload = parse_payload(request.get_json(silent=True))

    try:
        updates = validate_updates(payload)
    except ValueError as exc:
        abort(400, description=str(exc))

    _ensure_service_or_404(service_id)
    service = _services()[service_id]
    service.update(updates)
    return jsonify(service)


@services_bp.delete("/<int:service_id>")
def delete_service(service_id: int):
    _ensure_service_or_404(service_id)
    del _services()[service_id]
    return "", 204
