# AI Agent Workflow Builder

A production-ready visual workflow builder for AI agent pipelines — similar to Langflow / n8n / Zapier. Drag-and-drop nodes onto a canvas to build workflows that chain AI processing, Slack messaging, Google Sheets writes, HTTP requests, and more.

## Architecture

```
┌─────────────────────────────────────────────────┐
│                   Frontend                       │
│  React + Vite + TypeScript + React Flow          │
│  ┌──────────┐ ┌──────────────┐ ┌─────────────┐  │
│  │ Sidebar   │ │ Flow Canvas  │ │ Config Panel│  │
│  │ (drag)    │ │ (React Flow) │ │ (edit node) │  │
│  └──────────┘ └──────────────┘ └─────────────┘  │
│         Zustand State Management                 │
└───────────────────┬─────────────────────────────┘
                    │ REST API
┌───────────────────▼─────────────────────────────┐
│                   Backend                        │
│  Node.js + Express + TypeScript                  │
│  ┌────────────────────────────────────────────┐  │
│  │ Workflow Engine (topological sort + exec)  │  │
│  │ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐       │  │
│  │ │Trigger│ │AI Agnt│ │Slack │ │GSheet│ ...  │  │
│  │ └──────┘ └──────┘ └──────┘ └──────┘       │  │
│  └────────────────────────────────────────────┘  │
│  Nango (third-party OAuth integrations)          │
│  OpenAI API (AI agent processing)                │
└─────────────────────────────────────────────────┘
```

## Features

- **Visual Drag & Drop Builder** — React Flow canvas with custom node components
- **5 Node Types** — Trigger, AI Agent, Slack, Google Sheets, HTTP Request
- **Workflow Execution Engine** — Topological-sort-based sequential + branching execution
- **AI Agent Node** — OpenAI GPT integration with template interpolation
- **Nango Integrations** — OAuth-managed Slack and Google Sheets via Nango
- **Save / Load / Export / Import** — Full workflow persistence as JSON
- **Extensible Architecture** — Add new node types by implementing `NodeExecutor`
- **Modern Dark UI** — TailwindCSS with a polished dark theme

## Tech Stack

| Layer          | Technology                        |
|----------------|-----------------------------------|
| Frontend       | React, Vite, TypeScript           |
| Visual Builder | React Flow                        |
| State          | Zustand                           |
| Styling        | TailwindCSS                       |
| Backend        | Node.js, Express, TypeScript      |
| AI             | OpenAI API                        |
| Integrations   | Nango                             |

## Project Structure

```
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── nodes/          # Custom React Flow node components
│   │   │   ├── sidebar/        # Draggable node palette
│   │   │   ├── panels/         # Node config + workflow settings panels
│   │   │   └── canvas/         # React Flow canvas wrapper
│   │   ├── store/              # Zustand state management
│   │   ├── services/           # API client
│   │   ├── pages/              # Page components
│   │   └── types/              # TypeScript type definitions
│   └── ...config files
│
├── backend/
│   ├── src/
│   │   ├── routes/             # Express route definitions
│   │   ├── controllers/        # Request handlers
│   │   ├── services/           # Workflow store (in-memory)
│   │   ├── workflow-engine/    # Execution engine (topological sort)
│   │   ├── executors/          # Node executor implementations
│   │   ├── integrations/       # Nango client setup
│   │   ├── utils/              # Logger, helpers
│   │   └── types/              # Shared TypeScript types
│   └── ...config files
│
├── example-workflow.json       # Sample workflow to import
└── README.md
```

## Getting Started

### Prerequisites

- Node.js >= 18
- npm or yarn
- OpenAI API key (for AI Agent node)
- Nango account + secret key (for Slack / Google Sheets integrations)

### 1. Clone and Install

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment

```bash
# In the backend directory, copy and edit the env file
cd backend
cp .env.example .env
# Edit .env with your API keys:
#   OPENAI_API_KEY=sk-...
#   NANGO_SECRET_KEY=...
```

### 3. Start the Servers

```bash
# Terminal 1 — Backend (port 4000)
cd backend
npm run dev

# Terminal 2 — Frontend (port 5173)
cd frontend
npm run dev
```

Open **http://localhost:5173** in your browser.

### 4. Build a Workflow

1. **Drag** nodes from the sidebar onto the canvas
2. **Connect** nodes by dragging from output handles to input handles
3. **Configure** nodes by clicking them to open the config panel
4. **Save** the workflow using the toolbar
5. **Run** the workflow to execute it end-to-end
6. **Export/Import** workflows as JSON files

### 5. Try the Example Workflow

Click **Import** in the toolbar and select `example-workflow.json` from the project root. This creates a sample flow:

```
Trigger → AI Agent → Slack → Google Sheets
```

## API Endpoints

| Method | Endpoint              | Description             |
|--------|-----------------------|-------------------------|
| POST   | `/api/workflow/save`  | Save a workflow         |
| GET    | `/api/workflow/list`  | List all workflows      |
| GET    | `/api/workflow/:id`   | Get a workflow by ID    |
| POST   | `/api/workflow/:id/run` | Execute a workflow    |
| DELETE | `/api/workflow/:id`   | Delete a workflow       |
| GET    | `/api/health`         | Health check            |

## Adding Custom Node Types

1. Add the type to `NodeType` union in `backend/src/types/workflow.ts`
2. Create an executor in `backend/src/executors/` implementing `NodeExecutor`
3. Register it in `backend/src/executors/index.ts`
4. Add the definition to `NODE_TYPE_DEFINITIONS` in `frontend/src/types/workflow.ts`
5. Add config fields in `frontend/src/components/panels/NodeConfigPanel.tsx`

## Nango Setup

1. Sign up at [nango.dev](https://nango.dev)
2. Create integrations for **Slack** and **Google Sheets**
3. Set up OAuth connections
4. Copy your secret key to `.env`

## License

MIT
