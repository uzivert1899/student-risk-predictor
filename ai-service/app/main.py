import os
import re
from difflib import SequenceMatcher
from pathlib import Path

import joblib
import pandas as pd
from dotenv import load_dotenv
from fastapi import FastAPI
from langchain_chroma import Chroma
from langchain_community.document_loaders import TextLoader
from langchain_groq import ChatGroq
from langchain_community.embeddings.fastembed import FastEmbedEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pydantic import BaseModel


FEATURES = [
    "Curricular units 1st sem (approved)",
    "Curricular units 2nd sem (approved)",
    "Curricular units 1st sem (grade)",
    "Curricular units 2nd sem (grade)",
    "Tuition fees up to date",
    "Scholarship holder",
    "Age at enrollment",
    "Previous qualification (grade)",
    "Debtor",
]

TARGET_LABELS = {
    0: "Dropout",
    1: "Enrolled",
    2: "Graduate",
}

MODEL_PATH = Path(__file__).resolve().parents[2] / "ml-model" / "model.pkl"
POLICY_DOCS_DIR = Path(__file__).resolve().parents[1] / "policy_docs"
CHROMA_DB_DIR = Path(__file__).resolve().parents[1] / "chroma_db"

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

app = FastAPI(title="Student Risk Predictor API")


class PredictionRequest(BaseModel):
    units_1st_approved: float
    units_2nd_approved: float
    grade_1st: float
    grade_2nd: float
    tuition_up_to_date: float
    scholarship_holder: float
    age_at_enrollment: float
    previous_qualification_grade: float
    debtor: float


class FeatureImportance(BaseModel):
    feature: str
    importance: float


class ClassProbability(BaseModel):
    class_name: str
    probability: float


class PredictionResponse(BaseModel):
    prediction: str
    top_contributing_features: list[FeatureImportance]
    class_probabilities: list[ClassProbability]


class ExplanationRequest(BaseModel):
    prediction: str
    top_contributing_features: list[FeatureImportance]
    student_features: dict[str, float]


class SourceItem(BaseModel):
    text: str
    source_file: str | None


class ExplanationResponse(BaseModel):
    explanation: str
    sources: list[SourceItem]


model = joblib.load(MODEL_PATH)


def get_class_name(class_value: object) -> str:
    if hasattr(class_value, "item"):
        class_value = class_value.item()

    if isinstance(class_value, (int, float)) and int(class_value) in TARGET_LABELS:
        return TARGET_LABELS[int(class_value)]

    if isinstance(class_value, str):
        normalized = class_value.strip().lower()
        name_map = {
            "dropout": "Dropout",
            "enrolled": "Enrolled",
            "graduate": "Graduate",
        }
        return name_map.get(normalized, class_value)

    return str(class_value)


def build_prediction_phrase(prediction: str) -> str:
    normalized = (prediction or "").strip().lower()
    if "dropout" in normalized:
        return "student predicted to dropout"
    if "graduate" in normalized:
        return "student predicted to graduate successfully"
    if "enrolled" in normalized:
        return "student predicted to be enrolled"
    return f"student predicted to be {normalized or 'at risk'}"


def deduplicate_documents(documents: list[object], target_count: int) -> list[object]:
    unique_documents: list[object] = []
    seen_texts: list[str] = []

    for doc in documents:
        page_text = (getattr(doc, "page_content", "") or "").strip()
        normalized_text = re.sub(r"\s+", " ", page_text.lower())
        if not normalized_text:
            continue

        is_duplicate = any(
            SequenceMatcher(None, normalized_text, existing_text).ratio() >= 0.9
            for existing_text in seen_texts
        )
        if is_duplicate:
            continue

        unique_documents.append(doc)
        seen_texts.append(normalized_text)
        if len(unique_documents) >= target_count:
            break

    return unique_documents


def initialize_policy_vector_store() -> None:
    # Load all policy text files from the policy_docs folder.
    policy_files = sorted(POLICY_DOCS_DIR.glob("*.txt"))
    if not policy_files:
        print("No policy documents found.")
        return

    # Read each file as a LangChain document.
    documents = []
    for file_path in policy_files:
        loader = TextLoader(str(file_path), encoding="utf-8")
        documents.extend(loader.load())

    # Split the documents into smaller chunks for retrieval.
    splitter = RecursiveCharacterTextSplitter(chunk_size=300, chunk_overlap=50)
    chunks = splitter.split_documents(documents)

    # Embed and persist the chunks to a local Chroma vector store.
    embeddings = FastEmbedEmbeddings(model_name="BAAI/bge-small-en-v1.5")
    CHROMA_DB_DIR.mkdir(parents=True, exist_ok=True)
    Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=str(CHROMA_DB_DIR),
    )

    print(f"Loaded {len(documents)} policy documents.")
    print(f"Created {len(chunks)} document chunks.")
    print(f"Embedded and stored chunks in {CHROMA_DB_DIR}")


@app.on_event("startup")
def startup_event() -> None:
    initialize_policy_vector_store()


@app.get("/")
def root() -> dict[str, str]:
    return {"status": "API is running"}


@app.post("/predict", response_model=PredictionResponse)
def predict(request: PredictionRequest) -> PredictionResponse:
    input_payload = {
        "Curricular units 1st sem (approved)": request.units_1st_approved,
        "Curricular units 2nd sem (approved)": request.units_2nd_approved,
        "Curricular units 1st sem (grade)": request.grade_1st,
        "Curricular units 2nd sem (grade)": request.grade_2nd,
        "Tuition fees up to date": request.tuition_up_to_date,
        "Scholarship holder": request.scholarship_holder,
        "Age at enrollment": request.age_at_enrollment,
        "Previous qualification (grade)": request.previous_qualification_grade,
        "Debtor": request.debtor,
    }

    input_frame = pd.DataFrame([input_payload], columns=FEATURES)
    prediction = model.predict(input_frame)[0]
    prediction_value = prediction.item() if hasattr(prediction, "item") else prediction

    if isinstance(prediction_value, (int, float)) and int(prediction_value) in TARGET_LABELS:
        predicted_class = TARGET_LABELS[int(prediction_value)]
    else:
        predicted_class = str(prediction_value)

    classifier = model.named_steps["classifier"]
    feature_importances = list(zip(FEATURES, classifier.feature_importances_))
    top_features = [
        FeatureImportance(feature=feature_name, importance=float(importance))
        for feature_name, importance in sorted(feature_importances, key=lambda item: item[1], reverse=True)[:3]
    ]

    probabilities = model.predict_proba(input_frame)[0]
    class_indices = list(classifier.classes_)
    class_probabilities = [
        ClassProbability(
            class_name=get_class_name(class_index),
            probability=round(float(probability) * 100, 1),
        )
        for class_index, probability in zip(class_indices, probabilities)
    ]
    class_probabilities.sort(key=lambda item: item.probability, reverse=True)

    return PredictionResponse(
        prediction=predicted_class,
        top_contributing_features=top_features,
        class_probabilities=class_probabilities,
    )


@app.post("/explain", response_model=ExplanationResponse)
def explain(request: ExplanationRequest) -> ExplanationResponse:
    prediction_phrase = build_prediction_phrase(request.prediction)

    # Build a retrieval query from the prediction context and the student's feature values.
    context_details = "\n".join(
        [
            f"Prediction outcome: {prediction_phrase}",
            f"Prediction label: {request.prediction}",
            "Top contributing features:",
            *[f"- {feature.feature}: {feature.importance:.4f}" for feature in request.top_contributing_features],
            "Student feature values:",
            *[f"- {name}: {value}" for name, value in request.student_features.items()],
        ]
    )

    # Retrieve the most relevant policy chunks from the local Chroma vector store, while avoiding duplicates.
    embeddings = FastEmbedEmbeddings(model_name="BAAI/bge-small-en-v1.5")
    vector_store = Chroma(
        persist_directory=str(CHROMA_DB_DIR),
        embedding_function=embeddings,
    )

    relevant_docs: list[object] = []
    fetch_size = 6
    for attempt in range(3):
        batch_size = fetch_size + (attempt * 3)
        batch_docs = vector_store.similarity_search(context_details, k=batch_size)
        relevant_docs = deduplicate_documents([*relevant_docs, *batch_docs], target_count=3)

        if len(relevant_docs) >= 3:
            break

    policy_chunks = "\n\n".join(getattr(doc, "page_content", "") or "" for doc in relevant_docs)

    # Build sources list from retrieved documents (truncate text to 150 chars)
    sources = []
    for doc in relevant_docs:
        # robustly get filename from metadata if available
        src = None
        try:
            meta = getattr(doc, "metadata", None) or {}
            src = meta.get("source") or meta.get("source_file") or meta.get("file_path") or meta.get("path")
        except Exception:
            src = None

        if src:
            try:
                src_name = Path(src).name
            except Exception:
                src_name = str(src)
        else:
            src_name = None

        text = (getattr(doc, "page_content", "") or "")[:150]
        if len((getattr(doc, "page_content", "") or "")) > 150:
            text = text.rstrip() + "..."

        sources.append(SourceItem(text=text, source_file=src_name))

    # Load the Groq API key from the environment file.
    groq_api_key = os.getenv("GROQ_API_KEY")
    if not groq_api_key:
        raise RuntimeError("GROQ_API_KEY is not configured. Please add it to the .env file.")

    # Assemble a plain-language prompt for the LLM using the prediction context and policy excerpts.
    prompt = f"""
You are a student success support assistant.
Explain in plain language why this student was flagged for the following prediction outcome:
{prediction_phrase}

Prediction label: {request.prediction}

STUDENT FEATURE VALUES:
{chr(10).join(f'- {name}: {value}' for name, value in request.student_features.items())}

FEATURE IMPORTANCE SCORES (do not use these as grades or values):
{chr(10).join(f'- {feature.feature}: importance score {feature.importance:.4f}' for feature in request.top_contributing_features)}

Relevant institutional policy excerpts:
{policy_chunks}

Write a concise explanation that explains the likely reason for the flag and which support policy is most relevant. Do not mention that you are an AI.
If the prediction is Graduate with high confidence, explain positive/supporting factors - do not describe normal or improving performance as concerning or declining. Only use risk/intervention framing if the prediction is Dropout or the confidence for Dropout/Enrolled is significant.
Do not use importance scores as if they were grades, units, or any other feature value. Importance scores only indicate how much a feature influenced the prediction.
Do not refer to importance scores using any phrase other than "importance score".
"""

    # Send the prompt to ChatGroq and return the generated explanation.
    llm = ChatGroq(model="llama-3.1-8b-instant", temperature=0.2, api_key=groq_api_key)
    response = llm.invoke(prompt)
    explanation_text = response.content if hasattr(response, "content") else str(response)

    return ExplanationResponse(explanation=explanation_text, sources=sources)
