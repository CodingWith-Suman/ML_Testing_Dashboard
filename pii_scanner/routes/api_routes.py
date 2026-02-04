from flask import Blueprint, request, jsonify
from db.connector import create_connection
from utils.metadata_extractor import classify_metadata
from utils.pii_detector import scan_table, aggregate_scan

routes = Blueprint("routes", __name__)


@routes.route("/metadata-classify", methods=["POST"])
def metadata_classify():
    data = request.json
    conn_str = data.get("conn_string")
    host = data.get("host")
    port = data.get("port")
    username = data.get("username")
    password = data.get("password")
    database = data.get("database")
    db_type = data.get("db_type")

    engine, inspector = create_connection(
        conn_str, host, port, username, password, database, db_type
    )
    metadata = classify_metadata(inspector)
    return jsonify(metadata)


@routes.route("/full-pii-scan", methods=["POST"])
def full_scan():
    data = request.json
    conn_str = data.get("conn_string")
    pii_types = data.get("pii_types")
    host = data.get("host")
    port = data.get("port")
    username = data.get("username")
    password = data.get("password")
    database = data.get("database")
    db_type = data.get("db_type")

    engine, inspector = create_connection(
        conn_str, host, port, username, password, database, db_type
    )
    all_tables = inspector.get_table_names()
    scan_result = aggregate_scan(engine, all_tables, allowed_types=pii_types)
    return jsonify(scan_result)


@routes.route("/table-pii-scan", methods=["POST"])
def table_scan():
    data = request.json
    conn_str = data.get("conn_string")
    table_name = data.get("table_name")
    pii_types = data.get("pii_types")
    host = data.get("host")
    port = data.get("port")
    username = data.get("username")
    password = data.get("password")
    database = data.get("database")
    db_type = data.get("db_type")

    engine, _ = create_connection(
        conn_str, host, port, username, password, database, db_type
    )
    scan_result = aggregate_scan(engine, [table_name], allowed_types=pii_types)
    return jsonify(scan_result)
