"""PostgreSQL persistence layer for the services API."""
from __future__ import annotations

import os
from typing import Dict, List, Optional

from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool

DEFAULT_POSTGRES_DSN = "postgresql://fullstack:fullstack@localhost:5432/fullstack-pilot"


class ServicesRepository:
    """Encapsulate CRUD operations for services backed by PostgreSQL."""

    def __init__(self, dsn: Optional[str] = None):
        conninfo = dsn or os.environ.get("POSTGRES_DSN") or DEFAULT_POSTGRES_DSN
        self.pool = ConnectionPool(conninfo=conninfo)

    def init_schema(self) -> None:
        """Ensure the backing table exists."""
        with self.pool.connection() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    CREATE TABLE IF NOT EXISTS services (
                        id SERIAL PRIMARY KEY,
                        name TEXT NOT NULL,
                        description TEXT NOT NULL DEFAULT ''
                    )
                    """
                )
                connection.commit()

    def list_services(self) -> List[Dict[str, str]]:
        with self.pool.connection() as connection:
            with connection.cursor(row_factory=dict_row) as cursor:
                cursor.execute(
                    "SELECT id, name, description FROM services ORDER BY id ASC"
                )
                return list(cursor.fetchall())

    def create_service(self, name: str, description: str) -> Dict[str, str]:
        with self.pool.connection() as connection:
            with connection.cursor(row_factory=dict_row) as cursor:
                cursor.execute(
                    """
                    INSERT INTO services (name, description)
                    VALUES (%s, %s)
                    RETURNING id, name, description
                    """,
                    (name, description),
                )
                service = cursor.fetchone()
                connection.commit()
                return dict(service)

    def get_service(self, service_id: int) -> Optional[Dict[str, str]]:
        with self.pool.connection() as connection:
            with connection.cursor(row_factory=dict_row) as cursor:
                cursor.execute(
                    "SELECT id, name, description FROM services WHERE id = %s",
                    (service_id,),
                )
                service = cursor.fetchone()
                return dict(service) if service else None

    def update_service(self, service_id: int, updates: Dict[str, str]) -> Optional[Dict[str, str]]:
        if not updates:
            return None

        set_clauses: List[str] = []
        params: List[str] = []

        for column in ("name", "description"):
            if column in updates:
                set_clauses.append(f"{column} = %s")
                params.append(updates[column])

        params.append(service_id)

        with self.pool.connection() as connection:
            with connection.cursor(row_factory=dict_row) as cursor:
                cursor.execute(
                    f"UPDATE services SET {', '.join(set_clauses)} WHERE id = %s RETURNING id, name, description",
                    params,
                )
                service = cursor.fetchone()
                connection.commit()
                return dict(service) if service else None

    def delete_service(self, service_id: int) -> bool:
        with self.pool.connection() as connection:
            with connection.cursor() as cursor:
                cursor.execute("DELETE FROM services WHERE id = %s", (service_id,))
                deleted = cursor.rowcount > 0
                connection.commit()
                return deleted

    def close(self) -> None:
        self.pool.close()
        self.pool.wait()
