# Student Risk Predictor

Student Risk Predictor is a demo dashboard and backend that predicts student dropout risk using a machine-learned model and provides retrieval-augmented natural language explanations grounded in institutional policy documents. The project includes a Python-based AI/RAG service, a trained scikit-learn model for risk scoring, and a full-stack MERN-style app (Node/Express + React) to manage students and view prediction history and explanations.

## Tech Stack

- React
- Node / Express
- MongoDB (Mongoose)
- Python / FastAPI
- scikit-learn
- LangChain
- ChromaDB
- Groq

## Architecture

The project is organized as three cooperating services:

- ML Model (`ml-model`): trains and serializes the student risk model (scikit-learn). The `train.py` script prepares features and saves a model artifact used by the AI service.
- AI / RAG Service (`ai-service`): a Python FastAPI app that loads the trained model and a Chroma vector store of policy documents, exposes `/predict` and `/explain` endpoints, and uses LangChain-style prompt composition (and Groq embeddings where configured) to produce grounded explanations for predictions.
- MERN App (`server` + `client`): an Express API (`server`) that stores students and prediction history in MongoDB and proxies prediction/explanation requests to the AI service, and a React + Vite frontend (`client`) that provides the admin dashboard, add-student UI, and visualization of prediction histories.

These services communicate over HTTP: the frontend talks to the Express server, and the server calls the AI service for predictions and explanations. MongoDB persists student records and prediction history; the AI service reads the serialized model and the Chroma DB for RAG.

## Features

- ML-based dropout risk prediction with confidence scores
- RAG-powered natural language explanations grounded in institutional policy documents
- Prediction history tracking per student
- Admin dashboard for managing students and running predictions

## Setup & Running Locally

Below are high-level steps to run the project locally. Adjust ports and environment variables as needed.

Prerequisites

- Node.js (16+)
- Python 3.10+
- MongoDB (local or Atlas)
- Optional: `git`, `npm`, `pip`/`venv`

1. AI / RAG Service (`ai-service`)

```bash
cd ai-service
python -m venv venv
# Windows
venv\Scripts\activate
# macOS / Linux
# source venv/bin/activate
pip install -r requirements.txt
```

Required environment variables (example names):

- `OPENAI_API_KEY` or other LLM provider key
- `CHROMA_DB_PATH` (path to `chroma_db` folder)
- `MODEL_PATH` (path to saved model artifact in `ml-model`)
- `PORT` (optional, default used if not set)

Run the service:

```bash
uvicorn app.main:app --reload --port 8000
```

2. Server / API (`server`)

```bash
cd server
npm install
```

Required environment variables:

- `MONGODB_URI` (e.g. mongodb://localhost:27017/student-risk)
- `AI_SERVICE_URL` (e.g. http://localhost:8000)
- `PORT` (optional)

Seed demo data (optional):

```bash
node seed.js
```

Start the server:

```bash
node index.js
# or with nodemon
npx nodemon index.js
```

3. Frontend (`client`)

```bash
cd client
npm install
```

Environment variables (Vite):

- `VITE_API_URL` (URL for the Express API, e.g. http://localhost:5000)

Run the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

## Data

This project uses synthetic student data for demonstration and testing purposes only. Do not use the demo data for real-world decision making or production deployment without appropriate validation, data governance, and human review.

## Notes

- If you retrain the model in `ml-model/train.py`, update `MODEL_PATH` used by the AI service.
- The AI/RAG explanations rely on the Chroma vector store in `chroma_db/`—rebuilding or updating embeddings will change explanation content.

---

If you want, I can also commit this README and the previously added `.gitignore` to a new Git branch and push it. Would you like me to do that?
