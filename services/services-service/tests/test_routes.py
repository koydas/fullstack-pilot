import unittest

from flask import Flask

from service_api.routes import services_bp


class FakeRepository:
    def __init__(self):
        self.items = [
            {"id": 1, "name": "Service A", "description": "", "app_id": "app-1"},
            {"id": 2, "name": "Service B", "description": "", "app_id": "app-1"},
            {"id": 3, "name": "Service C", "description": "", "app_id": "app-1"},
        ]

    def list_services(self, app_id, limit, offset):
        scoped = [item for item in self.items if item["app_id"] == app_id]
        return {
            "items": scoped[offset : offset + limit],
            "total": len(scoped),
            "limit": limit,
            "offset": offset,
        }


class ServicesRoutesPaginationTest(unittest.TestCase):
    def setUp(self):
        self.app = Flask(__name__)
        self.app.config["TESTING"] = True
        self.app.config["REPOSITORY"] = FakeRepository()
        self.app.register_blueprint(services_bp)
        self.client = self.app.test_client()

    def test_list_services_returns_paginated_payload(self):
        response = self.client.get("/api/services?appId=app-1&limit=2&offset=1")

        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertEqual(payload["total"], 3)
        self.assertEqual(payload["limit"], 2)
        self.assertEqual(payload["offset"], 1)
        self.assertEqual([item["name"] for item in payload["items"]], ["Service B", "Service C"])

    def test_list_services_defaults_pagination(self):
        response = self.client.get("/api/services?appId=app-1")

        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertEqual(payload["limit"], 20)
        self.assertEqual(payload["offset"], 0)

    def test_list_services_validates_limit(self):
        response = self.client.get("/api/services?appId=app-1&limit=-1")

        self.assertEqual(response.status_code, 400)


if __name__ == "__main__":
    unittest.main()
