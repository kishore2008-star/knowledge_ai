

## ⚡ Quick Start (Docker Compose)

The easiest way to spin up the local development environment (including PostgreSQL with `pgvector` enabled) is using Docker Compose:

1. **Clone the repository** and navigate to the root directory.
2. **Execute the containers**:
   ```bash
   docker-compose up --build
   ```
3. **Run database migrations** (optional if automatic, or trigger manually from the backend container):
   ```bash
   docker exec -it knowforge_backend npx prisma db push
   ```
4. **Access the application**:
   - Frontend Client: [http://localhost:80](http://localhost:80)
   - Backend API endpoint: [http://localhost:5000/api](http://localhost:5000/api)
   - Database port: `5432`

---

## 📂 Core Folder Structure

---

## ⚙️ Environment Variables (`.env`)

Copy `.env.example` to `.env` in your workspace or declare inside docker environments:

- `DATABASE_URL`: Connection string to Supabase PostgreSQL or local docker database.
- `JWT_SECRET`: Random token sequence used for JWT signing.
- `OPENAI_API_KEY`: Required for active text embeddings (fallback mock vectors are generated if absent).

---

## 🏗️ AI Ingestion & RAG Inquiries

1. **Ingestion In Staging**: Operators upload a manual. The backend parses content, transcribes audio if applicable via OpenAI Whisper, splits text recursively into chunks, and generates vector coordinates using OpenAI text-embeddings. Result records are stored as `STAGING` documents.
2. **Supervisor Checks**: Supervisors/Managers check staging contents, keywords, and chunk distributions, then toggle the status to `PRODUCTION`.
3. **Verified RAG Search**: Employees query the AI assistant. The app converts queries to coordinates, runs a PostgreSQL cosine similarity lookup (`<=>` distance), gathers matching production chunks, and feeds them to OpenAI GPT to output a structured problem, cause, safety precautions, tools, and citations checklist.
