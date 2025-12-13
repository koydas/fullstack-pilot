from __future__ import annotations

from flask import Flask

from .monitoring import register_monitoring
from .routes import services_bp


def create_app() -> Flask:
    app = Flask(__name__)
    app.config["SERVICES"] = {}
    app.config["NEXT_SERVICE_ID"] = 1
    app.register_blueprint(services_bp)
    register_monitoring(app)
    return app
