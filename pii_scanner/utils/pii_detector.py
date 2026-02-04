import re
from sqlalchemy import text
from .regex_rules import PII_PATTERNS


def get_sample_query(table_name, engine):
    # Use SQLAlchemy's dialect-specific quoting
    quoted_table = engine.dialect.identifier_preparer.quote(table_name)
    dialect = str(engine.url.get_backend_name())

    if "oracle" in dialect:
        return text(f"SELECT * FROM {quoted_table} WHERE ROWNUM <= 1000")
    else:
        return text(f"SELECT * FROM {quoted_table} LIMIT 1000")


def scan_table(engine, table_name, allowed_types=None):
    results = []
    selected_patterns = {
        k: v
        for k, v in PII_PATTERNS.items()
        if allowed_types is None or k in allowed_types
    }

    with engine.connect() as conn:
        query = get_sample_query(table_name, engine)
        result_proxy = conn.execute(query)
        rows = result_proxy.fetchall()
        columns = list(result_proxy.keys())

        for row in rows:
            for idx, value in enumerate(row):
                for pii, pattern in selected_patterns.items():
                    if value and re.search(pattern, str(value)):
                        results.append(
                            {
                                "table": table_name,
                                "column": columns[idx],
                                "value": str(value),
                                "pii_type": pii,
                            }
                        )
    return results


def aggregate_scan(engine, tables, allowed_types=None):
    metadata_tables = []
    table_scans = []

    for table in tables:
        scan_results = scan_table(engine, table, allowed_types)
        row_count = len(scan_results)
        classifications_count = {"pii": 0, "identifiers": 0, "Behavioral": 0}
        column_stats = {}

        for result in scan_results:
            pii_type = result["pii_type"]
            classification = classify_pii_type(pii_type)
            classifications_count[classification] += 1

            col_name = result["column"]
            if col_name not in column_stats:
                column_stats[col_name] = {
                    "name": col_name,
                    "type": pii_type,
                    "DataType": "string",
                    "classifications": classification,
                    "scaned": 0,
                    "matched": 0,
                }
            column_stats[col_name]["scaned"] += 1
            column_stats[col_name]["matched"] += 1

        columns = [
            {**col, "accuracy": f"{(col['matched']/col['scaned'])*100:.2f}"}
            for col in column_stats.values()
        ]

        metadata_tables.append(
            {
                "name": table,
                "owner": "Unknown",  # Implement owner logic if needed
                "rowCount": str(row_count),
                "classifications": classifications_count,
            }
        )

        table_scans.append({"name": table, "columns": columns})

    return {
        "results": {
            "metadata": {
                "db_Name": extract_db_name(str(engine.url)),
                "table_metadata": metadata_tables,
            },
            "table_scans": table_scans,
        }
    }


def classify_pii_type(pii_type):
    pii = ["email", "phone", "aadhaar", "pan", "ssn", "dob", "gender", "name"]
    identifiers = ["id", "order_id", "sales_id", "employee_id", "voter_id"]
    behavioral = ["ip_address", "mac_address", "location", "device"]

    if pii_type in pii:
        return "pii"
    if pii_type in identifiers:
        return "identifiers"
    if pii_type in behavioral:
        return "Behavioral"
    return "pii"


def extract_db_name(conn_string):
    parts = conn_string.split("/")
    return parts[-1].split("?")[0] if parts else "Unknown_DB"
