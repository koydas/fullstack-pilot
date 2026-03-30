from __future__ import annotations

import os
import time
from datetime import datetime, timezone

from flask import Flask, jsonify

from .db import ServicesRepository
from .logging_config import configure_logging
from .monitoring import register_monitoring
from .routes import services_bp


def create_app() -> Flask:
    app = Flask(__name__)

    configure_logging()

    app.config["START_TIME"] = time.perf_counter()
    app.config["POSTGRES_DSN"] = os.environ.get("POSTGRES_DSN")
    repository = ServicesRepository(app.config["POSTGRES_DSN"])
    repository.init_schema()

    app.config["REPOSITORY"] = repository

    @app.get("/healthz")
    def healthz():
        uptime = time.perf_counter() - app.config["START_TIME"]
        return jsonify(
            {
                "status": "ok",
                "uptime": round(uptime, 3),
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
        )

    app.register_blueprint(services_bp)
    register_monitoring(app)
    return app
