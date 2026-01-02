from __future__ import annotations

from flask import Blueprint, abort, current_app, jsonify, request, url_for

from .db import ServicesRepository
from .validation import (
    parse_payload,
    validate_app_id_query_param,
    validate_new_service,
    validate_updates,
)

services_bp = Blueprint("services", __name__, url_prefix="/api/services")


def _repository() -> ServicesRepository:
    return current_app.config["REPOSITORY"]


def _ensure_service_or_404(service_id: int, app_id: str):
    service = _repository().get_service(service_id, app_id)
    if service is None:
        abort(404, description="Service not found")
    return service


@services_bp.get("")
def list_services():
    try:
        app_id = validate_app_id_query_param(request.args.get("appId"))
    except ValueError as exc:
        abort(400, description=str(exc))

    services = _repository().list_services(app_id)
    return jsonify(services)


@services_bp.post("")
def create_service():
    payload = parse_payload(request.get_json(silent=True))

    try:
        name, description, app_id = validate_new_service(payload)
    except ValueError as exc:
        abort(400, description=str(exc))

    service = _repository().create_service(name, description, app_id)

    response = jsonify(service)
    response.status_code = 201
    response.headers["Location"] = url_for(
        "services.get_service", service_id=service["id"], appId=service["app_id"]
    )
    return response


@services_bp.get("/<int:service_id>")
def get_service(service_id: int):
    try:
        app_id = validate_app_id_query_param(request.args.get("appId"))
    except ValueError as exc:
        abort(400, description=str(exc))

    service = _ensure_service_or_404(service_id, app_id)
    return jsonify(service)


@services_bp.put("/<int:service_id>")
def update_service(service_id: int):
    payload = parse_payload(request.get_json(silent=True))

    try:
        updates = validate_updates(payload)
        app_id = validate_app_id_query_param(request.args.get("appId"))
    except ValueError as exc:
        abort(400, description=str(exc))

    service = _repository().update_service(service_id, updates, app_id)
    if service is None:
        abort(404, description="Service not found")

    return jsonify(service)


@services_bp.delete("/<int:service_id>")
def delete_service(service_id: int):
    try:
        app_id = validate_app_id_query_param(request.args.get("appId"))
    except ValueError as exc:
        abort(400, description=str(exc))

    service = _repository().delete_service(service_id, app_id)
    if not service:
        abort(404, description="Service not found")
    return "", 204
