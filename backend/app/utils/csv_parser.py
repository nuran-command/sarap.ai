import pandas as pd
from io import BytesIO
from typing import Any

REQUIRED_CSV_COLUMNS = {
    "branch_name",
    "reviewer_name",
    "rating",
    "text",
    "review_date",
    "source",
    "is_answered",
}

def parse_reviews_csv(content: bytes) -> list[dict[str, Any]]:
    """
    Parses a CSV file containing reviews using Pandas and validates required columns.
    Returns a list of dictionaries representing the rows.
    """
    try:
        # Read CSV content using Pandas
        df = pd.read_csv(BytesIO(content))
    except Exception as e:
        raise ValueError(f"Failed to parse CSV file: {str(e)}") from e

    # Validate required columns
    missing_columns = REQUIRED_CSV_COLUMNS.difference(set(df.columns))
    if missing_columns:
        raise ValueError(f"CSV is missing required columns: {', '.join(sorted(missing_columns))}")

    # Replace NaN values with None (null in Python) for proper DB insertion
    df = df.where(pd.notnull(df), None)

    # Convert DataFrame to a list of dictionaries
    return df.to_dict(orient="records")
