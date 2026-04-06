import unittest
from unittest.mock import patch


class FactoryStartupTest(unittest.TestCase):
    @patch("service_api.factory.ServicesRepository")
    def test_create_app_registers_repository_without_runtime_schema_init(self, repository_cls):
        repository_instance = repository_cls.return_value

        from service_api.factory import create_app

        app = create_app()

        self.assertIs(app.config["REPOSITORY"], repository_instance)
        repository_cls.assert_called_once()
        repository_instance.init_schema.assert_not_called()


if __name__ == "__main__":
    unittest.main()
