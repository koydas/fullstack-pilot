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

    def list_services(self, app_id: str, limit: int, offset: int) -> Dict[str, object]:
        with self.pool.connection() as connection:
            with connection.cursor(row_factory=dict_row) as cursor:
                cursor.execute(
                    "SELECT COUNT(*) AS total FROM services WHERE app_id = %s",
                    (app_id,),
                )
                total_row = cursor.fetchone()
                total = int(total_row["total"]) if total_row else 0
                cursor.execute(
                    """
                    SELECT id, name, description, app_id
                    FROM services
                    WHERE app_id = %s
                    ORDER BY id ASC
                    LIMIT %s OFFSET %s
                    """,
                    (app_id, limit, offset),
                )
                items = list(cursor.fetchall())
                return {"items": items, "total": total, "limit": limit, "offset": offset}

    def create_service(self, name: str, description: str, app_id: str) -> Dict[str, str]:
        with self.pool.connection() as connection:
            with connection.cursor(row_factory=dict_row) as cursor:
                cursor.execute(
                    """
                    INSERT INTO services (name, description, app_id)
                    VALUES (%s, %s, %s)
                    RETURNING id, name, description, app_id
                    """,
                    (name, description, app_id),
                )
                service = cursor.fetchone()
                connection.commit()
                return dict(service)

    def get_service(self, service_id: int, app_id: Optional[str] = None) -> Optional[Dict[str, str]]:
        with self.pool.connection() as connection:
            with connection.cursor(row_factory=dict_row) as cursor:
                if app_id:
                    cursor.execute(
                        "SELECT id, name, description, app_id FROM services WHERE id = %s AND app_id = %s",
                        (service_id, app_id),
                    )
                else:
                    cursor.execute(
                        "SELECT id, name, description, app_id FROM services WHERE id = %s",
                        (service_id,),
                    )
                service = cursor.fetchone()
                return dict(service) if service else None

    def update_service(self, service_id: int, updates: Dict[str, str], app_id: Optional[str] = None) -> Optional[Dict[str, str]]:
        if not updates:
            return None

        set_clauses: List[str] = []
        params: List[str] = []

        for column in ("name", "description"):
            if column in updates:
                set_clauses.append(f"{column} = %s")
                params.append(updates[column])

        with self.pool.connection() as connection:
            with connection.cursor(row_factory=dict_row) as cursor:
                if app_id:
                    cursor.execute(
                        f"UPDATE services SET {', '.join(set_clauses)} WHERE id = %s AND app_id = %s RETURNING id, name, description, app_id",
                        [*params, service_id, app_id],
                    )
                else:
                    cursor.execute(
                        f"UPDATE services SET {', '.join(set_clauses)} WHERE id = %s RETURNING id, name, description, app_id",
                        [*params, service_id],
                    )
                service = cursor.fetchone()
                connection.commit()
                return dict(service) if service else None

    def delete_service(self, service_id: int, app_id: Optional[str] = None) -> bool:
        with self.pool.connection() as connection:
            with connection.cursor() as cursor:
                if app_id:
                    cursor.execute("DELETE FROM services WHERE id = %s AND app_id = %s", (service_id, app_id))
                else:
                    cursor.execute("DELETE FROM services WHERE id = %s", (service_id,))
                deleted = cursor.rowcount > 0
                connection.commit()
                return deleted

    def close(self) -> None:
        self.pool.close()
        self.pool.wait()
