"""
Plain assert-based self-check for parse_receipt_fields -- no pytest dependency
needed. Run directly: python3 app/services/test_receipt_parser.py
"""
from app.services.receipt_parser import parse_receipt_fields


def test_extracts_total_date_and_merchant_from_a_typical_receipt():
    raw_text = (
        "SUPERMERCADO BOM PRECO LTDA\n"
        "CNPJ: 12.345.678/0001-90\n"
        "DATA: 15/06/2026\n"
        "ITEM 1 ............ 10,00\n"
        "ITEM 2 ............ 25,50\n"
        "TOTAL: R$ 35,50\n"
    )
    fields = parse_receipt_fields(raw_text)
    assert fields["amount"] == 35.50, fields
    assert fields["date"] == "2026-06-15", fields
    assert fields["merchant"] == "SUPERMERCADO BOM PRECO LTDA", fields


def test_picks_the_largest_total_like_match_when_multiple_appear():
    raw_text = "FARMACIA SAUDE\nSUBTOTAL: 12,00\nVALOR TOTAL: 18,90\n"
    fields = parse_receipt_fields(raw_text)
    assert fields["amount"] == 18.90, fields


def test_returns_none_fields_for_unparseable_text():
    fields = parse_receipt_fields("###\n123\n")
    assert fields["amount"] is None
    assert fields["date"] is None
    assert fields["merchant"] is None


if __name__ == "__main__":
    test_extracts_total_date_and_merchant_from_a_typical_receipt()
    test_picks_the_largest_total_like_match_when_multiple_appear()
    test_returns_none_fields_for_unparseable_text()
    print("OK: all receipt_parser self-checks passed")
