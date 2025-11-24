# Tiny ETL Studio - Complete Architecture Diagram

## System Architecture Overview

```mermaid
graph TB
    subgraph "User's Browser"
        UI[React App<br/>App.tsx]
        API_CLIENT[API Client<br/>api.ts]
    end

    subgraph "Railway - Frontend Service"
        VITE[Vite Dev Server<br/>Port 5173]
        HTML[index.html<br/>Entry Point]
    end

    subgraph "Railway - Backend Service"
        EXPRESS[Express Server<br/>server.ts<br/>Port 3000]
        
        subgraph "Routes"
            CSV_ROUTES[CSV Routes<br/>csv.routes.ts]
            WEBHOOK_ROUTES[Webhook Routes<br/>webhook.routes.ts]
        end
        
        subgraph "Services"
            CLEANER[CSV Cleaner<br/>csvCleaner.ts<br/>Parse/Clean/Profile]
            DB_SERVICE[Database Service<br/>database.ts<br/>Connection Pool]
            INIT_DB[Init Database<br/>initDatabase.ts<br/>Create Tables]
        end
        
        subgraph "Storage"
            UPLOADS[uploads/ folder<br/>File System]
        end
    end

    subgraph "Railway - Database Service"
        POSTGRES[(PostgreSQL<br/>Port 5432)]
        
        subgraph "Tables"
            UPLOADS_TABLE[uploads table<br/>file metadata]
            JOBS_TABLE[cleaning_jobs table<br/>operation history]
        end
    end

    subgraph "n8n Cloud"
        N8N_WORKFLOW[n8n Workflows<br/>Automation]
    end

    subgraph "GitHub"
        REPO[Repository<br/>niklasax/tiny-etl]
    end

    %% User interactions
    USER((User)) --> UI
    UI --> API_CLIENT
    
    %% Frontend connections
    API_CLIENT -->|HTTP Requests| EXPRESS
    VITE --> HTML
    HTML --> UI
    
    %% Backend routing
    EXPRESS --> CSV_ROUTES
    EXPRESS --> WEBHOOK_ROUTES
    
    %% Service connections
    CSV_ROUTES --> CLEANER
    CSV_ROUTES --> DB_SERVICE
    CSV_ROUTES --> UPLOADS
    WEBHOOK_ROUTES --> CLEANER
    WEBHOOK_ROUTES --> DB_SERVICE
    
    %% Database connections
    DB_SERVICE --> POSTGRES
    INIT_DB --> POSTGRES
    EXPRESS --> INIT_DB
    
    %% Database tables
    POSTGRES --> UPLOADS_TABLE
    POSTGRES --> JOBS_TABLE
    
    %% n8n integration
    N8N_WORKFLOW -->|Webhook Calls| WEBHOOK_ROUTES
    
    %% Deployment
    REPO -->|Auto Deploy| VITE
    REPO -->|Auto Deploy| EXPRESS

    %% Styling
    classDef frontend fill:#06b6d4,stroke:#0891b2,color:#0f172a
    classDef backend fill:#8b5cf6,stroke:#7c3aed,color:#fff
    classDef database fill:#10b981,stroke:#059669,color:#fff
    classDef external fill:#f59e0b,stroke:#d97706,color:#0f172a
    classDef storage fill:#64748b,stroke:#475569,color:#fff
    
    class UI,API_CLIENT,VITE,HTML frontend
    class EXPRESS,CSV_ROUTES,WEBHOOK_ROUTES,CLEANER,DB_SERVICE,INIT_DB backend
    class POSTGRES,UPLOADS_TABLE,JOBS_TABLE database
    class N8N_WORKFLOW,REPO external
    class UPLOADS storage
```

## Detailed Data Flow Diagrams

### 1. File Upload Flow

```mermaid
sequenceDiagram
    participant User
    participant App.tsx
    participant api.ts
    participant Express
    participant Multer
    participant CSVCleaner
    participant FileSystem
    participant PostgreSQL

    User->>App.tsx: Select CSV file
    App.tsx->>App.tsx: handleFileUpload()
    App.tsx->>api.ts: uploadCSV(file)
    api.ts->>Express: POST /api/upload
    Express->>Multer: Process file upload
    Multer->>FileSystem: Save to uploads/
    FileSystem-->>Multer: File path
    Express->>CSVCleaner: parseCSV(fileText)
    CSVCleaner-->>Express: {data, headers}
    Express->>PostgreSQL: INSERT INTO uploads
    PostgreSQL-->>Express: Success
    Express-->>api.ts: {fileId, headers, rowCount}
    api.ts-->>App.tsx: Response data
    App.tsx->>App.tsx: Update state (fileId, headers)
    App.tsx->>User: Show file info
```

### 2. Data Cleaning Flow

```mermaid
sequenceDiagram
    participant User
    participant App.tsx
    participant api.ts
    participant Express
    participant PostgreSQL
    participant FileSystem
    participant CSVCleaner

    User->>App.tsx: Click "Clean Data"
    App.tsx->>App.tsx: handleCleanData()
    App.tsx->>api.ts: cleanCSV(fileId, rules)
    api.ts->>Express: POST /api/clean/:fileId
    Express->>PostgreSQL: SELECT file_path FROM uploads
    PostgreSQL-->>Express: File metadata
    Express->>FileSystem: Read CSV file
    FileSystem-->>Express: CSV text
    Express->>CSVCleaner: parseCSV(text)
    CSVCleaner-->>Express: Original data
    Express->>CSVCleaner: cleanData(data, rules)
    CSVCleaner->>CSVCleaner: Remove duplicates
    CSVCleaner->>CSVCleaner: Remove empty rows
    CSVCleaner->>CSVCleaner: Trim whitespace
    CSVCleaner->>CSVCleaner: Handle missing values
    CSVCleaner-->>Express: Cleaned data
    Express->>CSVCleaner: convertToCSV(cleaned)
    CSVCleaner-->>Express: CSV string
    Express->>FileSystem: Save cleaned file
    Express->>PostgreSQL: INSERT INTO cleaning_jobs
    Express->>CSVCleaner: profileData(original)
    Express->>CSVCleaner: profileData(cleaned)
    CSVCleaner-->>Express: Profiles
    Express-->>api.ts: {originalProfile, cleanedProfile}
    api.ts-->>App.tsx: Response
    App.tsx->>App.tsx: Update state (profiles)
    App.tsx->>User: Show before/after stats
```

### 3. Download Flow

```mermaid
sequenceDiagram
    participant User
    participant App.tsx
    participant Browser
    participant Express
    participant PostgreSQL
    participant FileSystem

    User->>App.tsx: Click "Download"
    App.tsx->>Browser: window.open(download URL)
    Browser->>Express: GET /api/download/:fileId
    Express->>PostgreSQL: SELECT file_path FROM uploads
    PostgreSQL-->>Express: File path
    Express->>FileSystem: Read file
    FileSystem-->>Express: File stream
    Express->>Express: Set download headers
    Express-->>Browser: Stream CSV file
    Browser->>Browser: Save file to disk
    Browser->>User: Download complete
```

### 4. n8n Workflow Integration

```mermaid
sequenceDiagram
    participant n8n
    participant WebhookRoutes
    participant PostgreSQL
    participant CSVCleaner
    participant FileSystem

    n8n->>WebhookRoutes: GET /api/webhook/list-uploads
    WebhookRoutes->>PostgreSQL: SELECT * FROM uploads
    PostgreSQL-->>WebhookRoutes: Upload list
    WebhookRoutes-->>n8n: {uploads: [...]}
    
    n8n->>n8n: User selects file + rules
    
    n8n->>WebhookRoutes: POST /api/webhook/trigger-clean
    Note over n8n,WebhookRoutes: {fileId, rules}
    WebhookRoutes->>PostgreSQL: Get file metadata
    WebhookRoutes->>FileSystem: Read CSV
    WebhookRoutes->>CSVCleaner: Clean data
    WebhookRoutes->>FileSystem: Save cleaned file
    WebhookRoutes->>PostgreSQL: Log cleaning job
    WebhookRoutes-->>n8n: {success, downloadUrl}
    n8n->>n8n: Continue workflow
```

## Component Dependency Map

```mermaid
graph LR
    subgraph "Frontend Dependencies"
        APP[App.tsx]
        API[api.ts]
        VITE_CONFIG[vite.config.ts]
        INDEX_HTML[index.html]
        INDEX_TSX[index.tsx]
    end

    subgraph "Backend Dependencies"
        SERVER[server.ts]
        CSV_R[csv.routes.ts]
        WEBHOOK_R[webhook.routes.ts]
        CLEANER_S[csvCleaner.ts]
        DB_S[database.ts]
        INIT_S[initDatabase.ts]
    end

    subgraph "External Libraries"
        REACT[React]
        PAPA[Papa Parse]
        EXPRESS_LIB[Express]
        PG[node-postgres]
        MULTER[Multer]
        CORS[CORS]
    end

    %% Frontend dependencies
    APP --> API
    APP --> REACT
    INDEX_TSX --> APP
    INDEX_HTML --> INDEX_TSX
    API --> PAPA
    
    %% Backend dependencies
    SERVER --> EXPRESS_LIB
    SERVER --> CORS
    SERVER --> CSV_R
    SERVER --> WEBHOOK_R
    SERVER --> INIT_S
    
    CSV_R --> EXPRESS_LIB
    CSV_R --> MULTER
    CSV_R --> CLEANER_S
    CSV_R --> DB_S
    
    WEBHOOK_R --> EXPRESS_LIB
    WEBHOOK_R --> CLEANER_S
    WEBHOOK_R --> DB_S
    
    CLEANER_S --> PAPA
    
    DB_S --> PG
    INIT_S --> PG

    classDef lib fill:#fbbf24,stroke:#f59e0b,color:#0f172a
    class REACT,PAPA,EXPRESS_LIB,PG,MULTER,CORS lib
```

## File System Structure

```mermaid
graph TB
    ROOT[tiny-etl/]
    
    ROOT --> FRONTEND[frontend/]
    ROOT --> BACKEND[backend/]
    ROOT --> CONFIG[Config Files]
    
    FRONTEND --> F_SRC[src/]
    FRONTEND --> F_PUBLIC[public/]
    FRONTEND --> F_CONFIG[vite.config.ts]
    FRONTEND --> F_PKG[package.json]
    FRONTEND --> F_INDEX[index.html]
    
    F_SRC --> APP_TSX[App.tsx]
    F_SRC --> API_TS[api.ts]
    F_SRC --> INDEX_TSX[index.tsx]
    F_SRC --> APP_CSS[App.css]
    
    BACKEND --> B_SRC[src/]
    BACKEND --> B_UPLOADS[uploads/]
    BACKEND --> B_PKG[package.json]
    BACKEND --> B_ENV[.env]
    
    B_SRC --> B_SERVER[server.ts]
    B_SRC --> B_ROUTES[routes/]
    B_SRC --> B_SERVICES[services/]
    
    B_ROUTES --> CSV_ROUTES_FILE[csv.routes.ts]
    B_ROUTES --> WEBHOOK_ROUTES_FILE[webhook.routes.ts]
    
    B_SERVICES --> CLEANER_FILE[csvCleaner.ts]
    B_SERVICES --> DB_FILE[database.ts]
    B_SERVICES --> INIT_FILE[initDatabase.ts]
    
    CONFIG --> DOCKER[docker-compose.yml]
    CONFIG --> GIT[.gitignore]
    CONFIG --> README[README.md]

    classDef folder fill:#64748b,stroke:#475569,color:#fff
    classDef file fill:#94a3b8,stroke:#64748b,color:#0f172a
    
    class ROOT,FRONTEND,BACKEND,F_SRC,F_PUBLIC,B_SRC,B_UPLOADS,B_ROUTES,B_SERVICES,CONFIG folder
    class APP_TSX,API_TS,INDEX_TSX,APP_CSS,F_CONFIG,F_PKG,F_INDEX,B_SERVER,CSV_ROUTES_FILE,WEBHOOK_ROUTES_FILE,CLEANER_FILE,DB_FILE,INIT_FILE,B_PKG,B_ENV,DOCKER,GIT,README file
```

## Database Schema

```mermaid
erDiagram
    uploads ||--o{ cleaning_jobs : "has many"
    
    uploads {
        int id PK
        varchar file_id UK "Unique identifier"
        varchar original_name "Original filename"
        text file_path "Path on disk"
        int row_count "Number of rows"
        int column_count "Number of columns"
        timestamp uploaded_at "Upload timestamp"
    }
    
    cleaning_jobs {
        int id PK
        varchar file_id FK "References uploads"
        jsonb rules "Cleaning rules applied"
        int original_row_count "Rows before cleaning"
        int cleaned_row_count "Rows after cleaning"
        timestamp created_at "Job timestamp"
    }
```

## State Management Flow (Frontend)

```mermaid
stateDiagram-v2
    [*] --> Idle: App loads
    
    Idle --> Uploading: User selects file
    Uploading --> FileUploaded: Upload success
    Uploading --> Idle: Upload error
    
    FileUploaded --> ConfiguringRules: User checks options
    ConfiguringRules --> Cleaning: Click "Clean Data"
    
    Cleaning --> Cleaned: Clean success
    Cleaning --> FileUploaded: Clean error
    
    Cleaned --> Downloading: Click "Download"
    Downloading --> Cleaned: Download complete
    
    FileUploaded --> Uploading: Upload new file
    Cleaned --> Uploading: Upload new file
    
    note right of Idle
        State: {
          file: null,
          fileId: null,
          cleaningRules: defaults
        }
    end note
    
    note right of FileUploaded
        State: {
          file: File object,
          fileId: "123-file.csv",
          headers: ["Name", "Email"],
          rowCount: 100
        }
    end note
    
    note right of Cleaned
        State: {
          ...FileUploaded,
          originalProfile: {...},
          cleanedProfile: {...}
        }
    end note
```

## API Endpoint Map

```mermaid
graph LR
    subgraph "Public API Endpoints"
        HEALTH[GET /api/health<br/>Health check]
        UPLOAD[POST /api/upload<br/>Upload CSV file]
        CLEAN[POST /api/clean/:fileId<br/>Clean data]
        DOWNLOAD[GET /api/download/:fileId<br/>Download CSV]
        HISTORY[GET /api/history<br/>Upload history]
    end
    
    subgraph "Webhook API (n8n)"
        TRIGGER[POST /api/webhook/trigger-clean<br/>Trigger cleaning]
        LIST[GET /api/webhook/list-uploads<br/>List all uploads]
    end
    
    FRONTEND_APP[Frontend App] --> HEALTH
    FRONTEND_APP --> UPLOAD
    FRONTEND_APP --> CLEAN
    FRONTEND_APP --> DOWNLOAD
    FRONTEND_APP -.-> HISTORY
    
    N8N[n8n Workflows] --> TRIGGER
    N8N --> LIST

    classDef public fill:#06b6d4,stroke:#0891b2,color:#0f172a
    classDef webhook fill:#8b5cf6,stroke:#7c3aed,color:#fff
    
    class HEALTH,UPLOAD,CLEAN,DOWNLOAD,HISTORY public
    class TRIGGER,LIST webhook
```

