from sqlalchemy import create_engine
from sqlalchemy.engine import reflection


def create_connection(
    conn_string=None,
    host=None,
    port=None,
    username=None,
    password=None,
    database=None,
    db_type=None,
):
    if conn_string and conn_string.strip() != "":
        engine_url = conn_string.strip()
    else:
        if not all([host, port, username, password, database, db_type]):
            raise ValueError("Missing DB connection parameters")

        # Normalize dialect and driver
        db_type = db_type.lower()
        if db_type == "mysql":
            dialect = "mysql+pymysql"
        elif db_type == "postgresql":
            dialect = "postgresql+psycopg2"
        elif db_type == "oracle":
            dialect = "oracle+cx_oracle"
        elif db_type == "sqlite":
            dialect = "sqlite"
        else:
            raise ValueError(f"Unsupported db_type: {db_type}")

        engine_url = f"{dialect}://{username}:{password}@{host}:{port}/{database}"

    # Create engine
    engine = create_engine(engine_url)
    inspector = reflection.Inspector.from_engine(engine)
    return engine, inspector
