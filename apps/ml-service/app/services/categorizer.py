import re
import os
import json
from typing import Optional, List, Dict
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
import joblib
import redis
from pathlib import Path


class CategorySuggestionService:
    """
    ML service for suggesting transaction categories.
    Uses TF-IDF + Naive Bayes for text classification.
    Maintains per-user models that learn from corrections.
    """

    # Default Brazilian Portuguese transaction categories with keywords
    DEFAULT_CATEGORIES = {
        "alimentacao": {
            "name": "Alimentacao",
            "keywords": [
                "supermercado", "mercado", "padaria", "restaurante", "lanchonete",
                "ifood", "rappi", "uber eats", "pizzaria", "hamburguer", "acougue",
                "hortifruti", "feira", "atacado", "carrefour", "extra", "pao de acucar",
                "assai", "dia", "sonda", "hirota", "st marche", "cafe", "starbucks",
                "mcdonalds", "burger king", "subway", "kfc", "habibs", "giraffas",
                "outback", "madero", "coco bambu", "almoco", "jantar", "comida"
            ]
        },
        "transporte": {
            "name": "Transporte",
            "keywords": [
                "uber", "99", "cabify", "taxi", "onibus", "metro", "trem", "vlt",
                "combustivel", "gasolina", "etanol", "diesel", "posto", "shell",
                "ipiranga", "petrobras", "br", "estacionamento", "pedagio", "sem parar",
                "conectcar", "veloe", "bilhete unico", "sptrans", "cptm", "bike",
                "patinete", "lime", "yellow", "grin"
            ]
        },
        "moradia": {
            "name": "Moradia",
            "keywords": [
                "aluguel", "condominio", "iptu", "luz", "energia", "enel", "eletropaulo",
                "cemig", "copel", "agua", "sabesp", "gas", "comgas", "internet",
                "vivo", "claro", "tim", "oi", "net", "sky", "tv cabo", "netflix",
                "spotify", "amazon prime", "disney", "hbo", "reforma", "manutencao",
                "limpeza", "diarista", "porteiro", "seguro residencial"
            ]
        },
        "saude": {
            "name": "Saude",
            "keywords": [
                "farmacia", "drogaria", "droga raia", "drogasil", "pacheco", "pague menos",
                "remedio", "medicamento", "hospital", "clinica", "medico", "dentista",
                "consulta", "exame", "laboratorio", "fleury", "delboni", "lavoisier",
                "plano de saude", "unimed", "bradesco saude", "sulamerica", "amil",
                "hapvida", "notredame", "academia", "smartfit", "bluefit", "crossfit"
            ]
        },
        "educacao": {
            "name": "Educacao",
            "keywords": [
                "escola", "colegio", "faculdade", "universidade", "curso", "udemy",
                "coursera", "alura", "rocketseat", "livro", "saraiva", "cultura",
                "amazon livros", "material escolar", "kalunga", "papelaria", "mensalidade",
                "matricula", "uniforme", "apostila"
            ]
        },
        "lazer": {
            "name": "Lazer",
            "keywords": [
                "cinema", "cinemark", "uci", "kinoplex", "teatro", "show", "ingresso",
                "eventim", "sympla", "ticketmaster", "parque", "viagem", "hotel",
                "airbnb", "booking", "latam", "gol", "azul", "decolar", "123milhas",
                "maxmilhas", "bar", "balada", "festa", "clube", "praia", "resort",
                "cruzeiro", "passeio", "museu", "exposicao", "zoo", "aquario"
            ]
        },
        "compras": {
            "name": "Compras",
            "keywords": [
                "amazon", "mercado livre", "magazine luiza", "magalu", "americanas",
                "shopee", "shein", "aliexpress", "casas bahia", "ponto frio", "fast shop",
                "renner", "riachuelo", "c&a", "zara", "h&m", "nike", "adidas", "centauro",
                "netshoes", "kabum", "pichau", "terabyte", "shopping", "outlet", "roupa",
                "sapato", "tenis", "eletronico", "celular", "notebook", "moveis"
            ]
        },
        "servicos": {
            "name": "Servicos",
            "keywords": [
                "banco", "tarifa", "iof", "ted", "pix", "boleto", "mensalidade",
                "assinatura", "seguro", "porto seguro", "sulamerica", "bradesco seguros",
                "cartorio", "despachante", "contador", "advogado", "dentista", "pet",
                "veterinario", "petlove", "petz", "cobasi", "banho e tosa", "cabeleireiro",
                "barbeiro", "manicure", "estetica"
            ]
        },
        "salario": {
            "name": "Salario",
            "keywords": [
                "salario", "pagamento", "folha", "holerite", "vencimento", "remuneracao",
                "adiantamento", "13o", "decimo terceiro", "ferias", "bonus", "plr",
                "participacao lucros", "comissao"
            ]
        },
        "investimentos": {
            "name": "Investimentos",
            "keywords": [
                "investimento", "aplicacao", "tesouro direto", "cdb", "lci", "lca",
                "fundo", "acao", "acoes", "fii", "renda fixa", "renda variavel",
                "btg", "xp", "rico", "clear", "nuinvest", "inter", "easynvest",
                "dividendo", "jcp", "proventos", "cripto", "bitcoin", "ethereum"
            ]
        },
        "outros_receita": {
            "name": "Outras Receitas",
            "keywords": [
                "freelance", "extra", "bico", "venda", "aluguel recebido", "presente",
                "premio", "loteria", "reembolso", "estorno", "cashback", "rendimento"
            ]
        },
        "outros_despesa": {
            "name": "Outras Despesas",
            "keywords": [
                "presente", "doacao", "caridade", "igreja", "dizimo", "oferta",
                "imposto", "multa", "taxa", "anuidade", "mensalidade"
            ]
        }
    }

    def __init__(self):
        self.models_dir = Path(os.getenv("MODELS_DIR", "/tmp/ml_models"))
        self.models_dir.mkdir(parents=True, exist_ok=True)

        # Redis connection for caching (optional)
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        try:
            self.redis = redis.from_url(redis_url)
            self.redis.ping()
        except Exception:
            self.redis = None

        # Global model trained on default categories
        self.global_model = self._build_global_model()

    def _build_global_model(self) -> Pipeline:
        """Build the global model from default categories"""
        # Create training data from keywords
        texts = []
        labels = []

        for category_id, category_data in self.DEFAULT_CATEGORIES.items():
            for keyword in category_data["keywords"]:
                texts.append(keyword)
                labels.append(category_id)
                # Add variations
                texts.append(keyword.upper())
                labels.append(category_id)
                texts.append(keyword.title())
                labels.append(category_id)

        # Build pipeline
        pipeline = Pipeline([
            ("tfidf", TfidfVectorizer(
                lowercase=True,
                ngram_range=(1, 2),
                max_features=5000,
                strip_accents="unicode"
            )),
            ("clf", MultinomialNB(alpha=0.1))
        ])

        pipeline.fit(texts, labels)
        return pipeline

    def _get_user_model_path(self, user_id: str) -> Path:
        """Get the path for a user's model file"""
        return self.models_dir / f"user_{user_id}_model.joblib"

    def _get_user_data_path(self, user_id: str) -> Path:
        """Get the path for a user's training data file"""
        return self.models_dir / f"user_{user_id}_data.json"

    def _load_user_model(self, user_id: str) -> Optional[Pipeline]:
        """Load a user's trained model if it exists"""
        model_path = self._get_user_model_path(user_id)
        if model_path.exists():
            try:
                return joblib.load(model_path)
            except Exception:
                return None
        return None

    def _load_user_data(self, user_id: str) -> List[Dict]:
        """Load a user's training data"""
        data_path = self._get_user_data_path(user_id)
        if data_path.exists():
            try:
                with open(data_path, "r") as f:
                    return json.load(f)
            except Exception:
                return []
        return []

    def _save_user_data(self, user_id: str, data: List[Dict]):
        """Save a user's training data"""
        data_path = self._get_user_data_path(user_id)
        with open(data_path, "w") as f:
            json.dump(data, f)

    def _train_user_model(self, user_id: str, data: List[Dict]) -> Optional[Pipeline]:
        """Train a model on user's data"""
        if len(data) < 5:
            return None

        texts = [d["description"] for d in data]
        labels = [d["category_id"] for d in data]

        pipeline = Pipeline([
            ("tfidf", TfidfVectorizer(
                lowercase=True,
                ngram_range=(1, 2),
                max_features=1000,
                strip_accents="unicode"
            )),
            ("clf", MultinomialNB(alpha=0.1))
        ])

        try:
            pipeline.fit(texts, labels)
            # Save the model
            joblib.dump(pipeline, self._get_user_model_path(user_id))
            return pipeline
        except Exception:
            return None

    def _normalize_text(self, text: str) -> str:
        """Normalize text for matching"""
        text = text.lower()
        text = re.sub(r"[^\w\s]", " ", text)
        text = re.sub(r"\s+", " ", text).strip()
        return text

    def suggest_category(
        self,
        description: str,
        user_id: str,
        amount: Optional[float] = None,
        account_type: Optional[str] = None,
    ) -> Dict:
        """
        Suggest a category for a transaction.
        Uses user's model if available, falls back to global model.
        """
        normalized_desc = self._normalize_text(description)

        # Try user model first
        user_model = self._load_user_model(user_id)
        if user_model:
            try:
                predictions = user_model.predict_proba([normalized_desc])[0]
                classes = user_model.classes_
                best_idx = predictions.argmax()
                best_category_id = classes[best_idx]
                confidence = float(predictions[best_idx])

                # Get alternatives
                sorted_indices = predictions.argsort()[::-1][:3]
                alternatives = [
                    {
                        "category_id": classes[i],
                        "category_name": self.DEFAULT_CATEGORIES.get(classes[i], {}).get("name", classes[i]),
                        "confidence": float(predictions[i])
                    }
                    for i in sorted_indices[1:] if predictions[i] > 0.1
                ]

                if confidence > 0.3:
                    return {
                        "category_id": best_category_id,
                        "category_name": self.DEFAULT_CATEGORIES.get(best_category_id, {}).get("name", best_category_id),
                        "confidence": confidence,
                        "alternatives": alternatives
                    }
            except Exception:
                pass

        # Fall back to global model
        try:
            predictions = self.global_model.predict_proba([normalized_desc])[0]
            classes = self.global_model.classes_
            best_idx = predictions.argmax()
            best_category_id = classes[best_idx]
            confidence = float(predictions[best_idx])

            # Get alternatives
            sorted_indices = predictions.argsort()[::-1][:3]
            alternatives = [
                {
                    "category_id": classes[i],
                    "category_name": self.DEFAULT_CATEGORIES.get(classes[i], {}).get("name", classes[i]),
                    "confidence": float(predictions[i])
                }
                for i in sorted_indices[1:] if predictions[i] > 0.1
            ]

            return {
                "category_id": best_category_id,
                "category_name": self.DEFAULT_CATEGORIES.get(best_category_id, {}).get("name", best_category_id),
                "confidence": confidence,
                "alternatives": alternatives
            }
        except Exception as e:
            # Fallback to keyword matching
            return self._keyword_match(normalized_desc)

    def _keyword_match(self, text: str) -> Dict:
        """Simple keyword matching as fallback"""
        best_match = None
        best_score = 0

        for category_id, category_data in self.DEFAULT_CATEGORIES.items():
            score = sum(1 for kw in category_data["keywords"] if kw in text)
            if score > best_score:
                best_score = score
                best_match = category_id

        if best_match:
            return {
                "category_id": best_match,
                "category_name": self.DEFAULT_CATEGORIES[best_match]["name"],
                "confidence": min(0.5, best_score * 0.1),
                "alternatives": []
            }

        return {
            "category_id": "outros_despesa",
            "category_name": "Outras Despesas",
            "confidence": 0.1,
            "alternatives": []
        }

    def add_training_example(
        self,
        user_id: str,
        transaction_id: str,
        description: str,
        category_id: str,
        category_name: str,
    ):
        """Add a training example for a user"""
        data = self._load_user_data(user_id)

        # Avoid duplicates
        existing_ids = {d.get("transaction_id") for d in data}
        if transaction_id not in existing_ids:
            data.append({
                "transaction_id": transaction_id,
                "description": self._normalize_text(description),
                "category_id": category_id,
                "category_name": category_name
            })
            self._save_user_data(user_id, data)

            # Retrain if we have enough data
            if len(data) >= 5:
                self._train_user_model(user_id, data)

    def get_model_status(self, user_id: str) -> Dict:
        """Get status of a user's model"""
        data = self._load_user_data(user_id)
        model_path = self._get_user_model_path(user_id)

        return {
            "user_id": user_id,
            "has_model": model_path.exists(),
            "training_examples": len(data),
            "min_examples_required": 5,
            "ready_for_training": len(data) >= 5
        }
