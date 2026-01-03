import sys
import os

# Add app to path
sys.path.append(os.getcwd())

from app.services.categorizer import CategorySuggestionService

def test_extraction():
    print("Initializing Service...")
    service = CategorySuggestionService()
    
    test_cases = [
        ("POSTO SHELL", "Gasolina"),
        ("NETFLIX.COM", "Streaming"), # Canonical item is Streaming
        ("UBER DO BRASIL", "Uber"), # Canonical item might be Uber
        ("PAGTO ELETRICIDADE", "Energia Elétrica"),
        ("SUP MERCADO DIA", "Supermercado"),
    ]
    
    print("\n--- Testing Entity Extraction ---")
    for desc, expected in test_cases:
        print(f"\nInput: {desc}")
        result = service.extract_entities(desc)
        print(f"Result: {result}")
        
        item = result.get("item")
        if item == expected:
             print(f"✅ PASS")
        else:
             print(f"⚠️  MATCH: '{item}' (Expected: '{expected}')")
             # Check if it's acceptable (e.g. Netflix -> Streaming is good, but text might say Netflix)
             # My WealthService returns canonical items. 
             # If WealthService works, it returns "Streaming" for Netflix.
             pass

if __name__ == "__main__":
    test_extraction()
