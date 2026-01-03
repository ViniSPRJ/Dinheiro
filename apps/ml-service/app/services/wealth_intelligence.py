import os
from typing import List, Dict, Optional
from sentence_transformers import SentenceTransformer, util
import torch

class WealthIntelligenceService:
    def __init__(self):
        # Load model for semantic similarity
        # 'paraphrase-multilingual-MiniLM-L12-v2' is lightweight and good for Portuguese
        self.model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
        
        # Canonical Items for Personal Inflation
        # This list should ideally come from a database or config, but hardcoded for now as per plan
        self.canonical_items = [
            "Gasolina", "Etanol", "Diesel", # Combustíveis
            "Energia Elétrica", "Água", "Gás", "Internet", "Celular", # Contas
            "Aluguel", "Condomínio", "IPTU", # Moradia
            "Streaming", "TV por Assinatura", # Entretenimento
            "Supermercado", "Restaurante", "Delivery", # Alimentação
            "Farmácia", "Academia", "Plano de Saúde", # Saúde
            "Uber", "Táxi", "Transporte Público", # Transporte
            "Cinema", "Show", "Livros" # Lazer
        ]
        
        # Pre-compute embeddings for canonical items for speed
        self.canonical_embeddings = self.model.encode(self.canonical_items, convert_to_tensor=True)

    def extract_consumption_item(self, description: str) -> Dict[str, any]:
        """
        Extract the consumption item from the transaction description
        using semantic similarity to canonical items.
        """
        # 1. Normalization (Basic)
        clean_desc = description.strip()
        
        # 2. Compute embedding for the description
        desc_embedding = self.model.encode(clean_desc, convert_to_tensor=True)
        
        # 3. Find closest canonical item
        # We use cosine similarity
        cos_scores = util.cos_sim(desc_embedding, self.canonical_embeddings)[0]
        
        # Find the best match
        best_score = torch.max(cos_scores)
        best_idx = torch.argmax(cos_scores)
        
        best_item = self.canonical_items[best_idx]
        
        # Threshold for "Unknown" or generic
        # If similarity is too low, it might not be in the basket
        threshold = 0.4 # Tuning might be needed
        
        if best_score < threshold:
            return {
                "original": description,
                "identified_item": None,
                "category_suggestion": "Outros",
                "confidence": float(best_score),
                "match_type": "low_confidence"
            }
            
        return {
            "original": description,
            "identified_item": best_item,
            "confidence": float(best_score),
            "match_type": "semantic"
        }

    def semantic_category_search(self, description: str, categories: Dict[str, Dict]) -> Dict:
        """
        Search for the best category using semantic similarity instead of keywords.
        categories: Dict from categorizer.py structure
        """
        # Flatten categories into a list of (id, name, keywords_text)
        category_list = []
        category_embeddings = []
        
        # This part might be slow if done every time. 
        # Ideally we compute category embeddings once in __init__ if they are static.
        # For now, let's assume we can map the description to the canonical item, 
        # and checking which category that item belongs to might be easier,
        # OR we just compare description to category keywords semantically.
        
        pass 
