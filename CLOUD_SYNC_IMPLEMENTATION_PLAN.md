# Data Desktop Cloud Sync & Web Version Implementation Plan

## Executive Summary

This document outlines a comprehensive plan to transform Data Desktop into a multi-platform solution with cloud synchronization capabilities, end-to-end encryption, and web deployment. The goal is to enable users to access their personal data across devices while maintaining the highest security standards through client-side encryption.

## Current Architecture Analysis

### Strengths
- **Clean separation**: Well-defined backend (Go) and frontend (React) layers
- **Dynamic schema**: JSON-based field definitions allow flexible data structures
- **Local-first design**: SQLite provides excellent offline capabilities
- **Generic components**: Data tables and forms work with any dataset configuration
- **File handling**: Base64 to local file conversion system already in place

### Areas for Extension
- **No sync capabilities**: Currently desktop-only with local SQLite
- **No cloud infrastructure**: All data stored locally
- **No encryption layer**: Data security relies on local device security
- **No web deployment**: Tied to Wails desktop framework

## Recommended Overall Changes

### 1. Architecture Transformation

**Current:** Desktop App (Wails + Go + SQLite + React)
**Proposed:** Multi-Platform (Desktop + Web + Cloud Sync)

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Desktop App   │    │    Web App      │    │  Cloud Service  │
│  (Wails + Go)   │◄──►│   (React SPA)   │◄──►│ (Node.js/Go +   │
│   + SQLite      │    │  + IndexedDB    │    │  PostgreSQL)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │  E2E Encryption │
                    │   (Web Crypto)  │
                    └─────────────────┘
```

### 2. Technology Stack Additions

**Backend Cloud Service:**
- **Language:** Node.js with TypeScript (for consistency with frontend) or Go (for performance)
- **Database:** PostgreSQL with encrypted data columns
- **Authentication:** JWT with refresh tokens
- **API:** RESTful with WebSocket for real-time sync
- **Deployment:** Docker + Kubernetes or serverless (Vercel/Netlify functions)

**Encryption Layer:**
- **Library:** Web Crypto API (native browser support)
- **Algorithm:** AES-256-GCM for data encryption
- **Key Derivation:** PBKDF2 or Argon2 for password-based keys
- **Transport:** TLS 1.3 for additional transport security

**Web Version:**
- **Framework:** Same React codebase with platform-specific adapters
- **Storage:** IndexedDB for local offline data
- **PWA:** Service workers for offline functionality
- **File Handling:** File System Access API where supported

### 3. Database Schema Evolution

**Current SQLite Schema Extension:**
```sql
-- Add sync metadata to existing tables
ALTER TABLE datasets ADD COLUMN sync_id TEXT;
ALTER TABLE datasets ADD COLUMN last_synced TIMESTAMP;
ALTER TABLE datasets ADD COLUMN is_dirty BOOLEAN DEFAULT FALSE;

ALTER TABLE data_records ADD COLUMN sync_id TEXT;
ALTER TABLE data_records ADD COLUMN last_synced TIMESTAMP;
ALTER TABLE data_records ADD COLUMN is_dirty BOOLEAN DEFAULT FALSE;
ALTER TABLE data_records ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;

-- New sync tracking table
CREATE TABLE sync_metadata (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    device_id TEXT NOT NULL,
    last_sync_timestamp TIMESTAMP,
    sync_version INTEGER DEFAULT 1
);
```

**Cloud PostgreSQL Schema:**
```sql
-- Users and authentication
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    subscription_tier VARCHAR(50) DEFAULT 'free',
    created_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP
);

-- Encrypted user data
CREATE TABLE user_datasets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    dataset_id VARCHAR(255) NOT NULL,
    encrypted_data TEXT NOT NULL, -- JSON data encrypted client-side
    sync_version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    device_id VARCHAR(255),
    UNIQUE(user_id, dataset_id)
);

CREATE TABLE user_data_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    dataset_id VARCHAR(255) NOT NULL,
    record_id VARCHAR(255) NOT NULL,
    encrypted_data TEXT NOT NULL, -- Record data encrypted client-side
    sync_version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    device_id VARCHAR(255),
    is_deleted BOOLEAN DEFAULT FALSE,
    UNIQUE(user_id, dataset_id, record_id)
);

-- Sync state tracking
CREATE TABLE sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    device_id VARCHAR(255) NOT NULL,
    sync_timestamp TIMESTAMP DEFAULT NOW(),
    records_synced INTEGER DEFAULT 0,
    conflicts_resolved INTEGER DEFAULT 0
);
```

## Implementation Phases

### Phase 1: Foundation & Security (Weeks 1-3)

**1.1 End-to-End Encryption Implementation**
```typescript
// New file: frontend/src/lib/encryption.ts
export class E2EEncryption {
  private static async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      "PBKDF2",
      false,
      ["deriveBits", "deriveKey"]
    );
    
    return crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256"
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );
  }

  static async encryptData(data: string, userKey: CryptoKey): Promise<string> {
    const encoder = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encodedData = encoder.encode(data);
    
    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      userKey,
      encodedData
    );
    
    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    return btoa(String.fromCharCode(...combined));
  }

  static async decryptData(encryptedData: string, userKey: CryptoKey): Promise<string> {
    const combined = new Uint8Array(
      atob(encryptedData).split('').map(char => char.charCodeAt(0))
    );
    
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);
    
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      userKey,
      encrypted
    );
    
    return new TextDecoder().decode(decrypted);
  }
}
```

**1.2 Cloud Service Foundation**
```javascript
// New service: cloud-backend/src/server.js
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' })); // For encrypted data payloads

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.sendStatus(401);
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Sync endpoints
app.post('/api/sync/datasets', authenticateToken, async (req, res) => {
  const { datasets } = req.body; // Array of encrypted dataset objects
  // Implementation for dataset sync
});

app.post('/api/sync/records', authenticateToken, async (req, res) => {
  const { records } = req.body; // Array of encrypted record objects
  // Implementation for record sync
});

app.get('/api/sync/pull', authenticateToken, async (req, res) => {
  const { lastSyncTimestamp } = req.query;
  // Return all changes since last sync
});
```

### Phase 2: Desktop App Sync Integration (Weeks 4-6)

**2.1 Sync Service in Go Backend**
```go
// New file: backend/sync/sync_service.go
package sync

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
    "time"
)

type SyncService struct {
    apiEndpoint string
    userToken   string
    client      *http.Client
}

type SyncPayload struct {
    Datasets []EncryptedDataset `json:"datasets"`
    Records  []EncryptedRecord  `json:"records"`
}

func (s *SyncService) PushChanges(payload SyncPayload) error {
    jsonData, err := json.Marshal(payload)
    if err != nil {
        return err
    }

    req, err := http.NewRequest("POST", s.apiEndpoint+"/api/sync/push", bytes.NewBuffer(jsonData))
    if err != nil {
        return err
    }

    req.Header.Set("Content-Type", "application/json")
    req.Header.Set("Authorization", "Bearer "+s.userToken)

    resp, err := s.client.Do(req)
    if err != nil {
        return err
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
        return fmt.Errorf("sync failed with status: %d", resp.StatusCode)
    }

    return nil
}
```

**2.2 Frontend Sync Orchestration**
```typescript
// New file: frontend/src/services/sync-service.ts
export class SyncService {
  private static instance: SyncService;
  private userKey: CryptoKey | null = null;
  private isOnline = true;
  private syncInterval: NodeJS.Timeout | null = null;

  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  async initializeSync(userPassword: string) {
    // Derive encryption key from user password
    const salt = new Uint8Array(16); // Should be stored/retrieved securely
    this.userKey = await E2EEncryption.deriveKey(userPassword, salt);
    
    // Start periodic sync
    this.startPeriodicSync();
  }

  private async syncDatasets() {
    const localDatasets = await ApiService.getDatasets();
    const encryptedDatasets = await Promise.all(
      localDatasets.map(async (dataset) => ({
        id: dataset.id,
        encryptedData: await E2EEncryption.encryptData(
          JSON.stringify(dataset), 
          this.userKey!
        ),
        lastModified: dataset.lastModified
      }))
    );

    // Send to cloud service
    await this.pushToCloud({ datasets: encryptedDatasets, records: [] });
  }

  private startPeriodicSync() {
    this.syncInterval = setInterval(() => {
      if (this.isOnline && this.userKey) {
        this.performFullSync();
      }
    }, 30000); // Sync every 30 seconds
  }
}
```

### Phase 3: Web Version Development (Weeks 7-10)

**3.1 Platform Abstraction Layer**
```typescript
// New file: frontend/src/platform/platform-adapter.ts
export interface PlatformAdapter {
  storage: StorageAdapter;
  fileSystem: FileSystemAdapter;
  notifications: NotificationAdapter;
}

export interface StorageAdapter {
  createDataset(dataset: Dataset): Promise<void>;
  getDatasets(): Promise<Dataset[]>;
  addRecord(record: DataRecord): Promise<void>;
  getRecords(datasetId: string): Promise<DataRecord[]>;
}

// Desktop implementation using Wails
export class DesktopAdapter implements PlatformAdapter {
  storage = new WailsStorageAdapter();
  fileSystem = new WailsFileSystemAdapter();
  notifications = new DesktopNotificationAdapter();
}

// Web implementation using IndexedDB
export class WebAdapter implements PlatformAdapter {
  storage = new IndexedDBStorageAdapter();
  fileSystem = new WebFileSystemAdapter();
  notifications = new WebNotificationAdapter();
}

class IndexedDBStorageAdapter implements StorageAdapter {
  private db: IDBDatabase | null = null;

  async init() {
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('DataDesktop', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('datasets')) {
          db.createObjectStore('datasets', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('records')) {
          const recordStore = db.createObjectStore('records', { keyPath: 'id' });
          recordStore.createIndex('datasetId', 'datasetId', { unique: false });
        }
      };
    });
  }

  async createDataset(dataset: Dataset): Promise<void> {
    const transaction = this.db!.transaction(['datasets'], 'readwrite');
    const store = transaction.objectStore('datasets');
    await store.add(dataset);
  }
}
```

**3.2 Build Configuration for Web**
```javascript
// New file: frontend-web/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.datadesktop\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      manifest: {
        name: 'Data Desktop',
        short_name: 'DataDesktop',
        description: 'Track and visualize your personal data',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
  define: {
    __PLATFORM__: '"web"',
  },
  build: {
    outDir: 'dist-web',
  },
});
```

### Phase 4: Advanced Features (Weeks 11-14)

**4.1 Real-time Sync with WebSockets**
```typescript
// New file: frontend/src/services/realtime-sync.ts
export class RealtimeSyncService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(userToken: string) {
    const wsUrl = `wss://api.datadesktop.com/ws?token=${userToken}`;
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('Real-time sync connected');
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleSyncMessage(message);
    };

    this.ws.onclose = () => {
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        setTimeout(() => {
          this.reconnectAttempts++;
          this.connect(userToken);
        }, Math.pow(2, this.reconnectAttempts) * 1000);
      }
    };
  }

  private async handleSyncMessage(message: any) {
    switch (message.type) {
      case 'DATASET_UPDATED':
        await this.handleDatasetUpdate(message.data);
        break;
      case 'RECORD_UPDATED':
        await this.handleRecordUpdate(message.data);
        break;
      case 'SYNC_CONFLICT':
        await this.handleSyncConflict(message.data);
        break;
    }
  }
}
```

**4.2 Conflict Resolution Strategy**
```typescript
// New file: frontend/src/services/conflict-resolver.ts
export class ConflictResolver {
  static async resolveDatasetConflict(
    localDataset: Dataset,
    remoteDataset: Dataset
  ): Promise<Dataset> {
    // Last-writer-wins based on lastModified timestamp
    if (localDataset.lastModified > remoteDataset.lastModified) {
      return localDataset;
    } else if (remoteDataset.lastModified > localDataset.lastModified) {
      return remoteDataset;
    } else {
      // Same timestamp - merge field definitions
      return this.mergeDatasets(localDataset, remoteDataset);
    }
  }

  static async resolveRecordConflict(
    localRecord: DataRecord,
    remoteRecord: DataRecord
  ): Promise<DataRecord> {
    // For data records, always use the most recent
    return localRecord.lastModified > remoteRecord.lastModified 
      ? localRecord 
      : remoteRecord;
  }

  private static mergeDatasets(local: Dataset, remote: Dataset): Dataset {
    // Combine field definitions, preferring local for duplicates
    const mergedFields = [...local.fields];
    
    remote.fields.forEach(remoteField => {
      const existsLocally = local.fields.some(f => f.key === remoteField.key);
      if (!existsLocally) {
        mergedFields.push(remoteField);
      }
    });

    return {
      ...local,
      fields: mergedFields,
      lastModified: new Date()
    };
  }
}
```

### Phase 5: Business & Deployment (Weeks 15-16)

**5.1 Subscription Management**
```typescript
// New file: cloud-backend/src/subscription/stripe-service.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

class SubscriptionService {
  static async createCustomer(email, userId) {
    const customer = await stripe.customers.create({
      email,
      metadata: { userId }
    });
    
    return customer;
  }

  static async createSubscription(customerId, priceId) {
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    });
    
    return subscription;
  }

  static async handleWebhook(event) {
    switch (event.type) {
      case 'subscription.created':
        await this.activateUserSubscription(event.data.object);
        break;
      case 'subscription.deleted':
        await this.deactivateUserSubscription(event.data.object);
        break;
      case 'invoice.payment_failed':
        await this.handlePaymentFailure(event.data.object);
        break;
    }
  }
}
```

**5.2 Deployment Configuration**
```yaml
# New file: cloud-backend/docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
      - STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
    depends_on:
      - db
      - redis

  db:
    image: postgres:14
    environment:
      - POSTGRES_DB=datadesktop
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

## Security Considerations

### 1. Encryption Architecture
- **Client-side encryption**: All data encrypted before transmission
- **Zero-knowledge**: Server cannot decrypt user data
- **Key derivation**: User password + device salt for unique keys
- **Perfect forward secrecy**: Regular key rotation

### 2. Authentication Security
- **JWT tokens**: Short-lived access tokens + refresh tokens
- **Device fingerprinting**: Track authorized devices
- **Rate limiting**: Prevent brute force attacks
- **2FA option**: Time-based OTP for enhanced security

### 3. Data Privacy
- **Minimal metadata**: Only sync timestamps and IDs stored unencrypted
- **GDPR compliance**: Right to deletion and data export
- **Audit logging**: Track access patterns without content exposure

## Deployment Strategy

### Web Version Hosting
```javascript
// Vercel deployment configuration
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "frontend-web/dist/**/*",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/index.js"
    },
    {
      "src": "/(.*)",
      "dest": "/frontend-web/dist/$1"
    }
  ],
  "functions": {
    "api/index.js": {
      "runtime": "nodejs18.x"
    }
  }
}
```

### Desktop Distribution
- **Current**: Continue Wails build process
- **Enhanced**: Add auto-updater for sync features
- **Packaging**: Include sync service configuration

## Migration Strategy

### Existing Users
1. **Opt-in sync**: Users choose to enable cloud sync
2. **Data migration**: Existing SQLite data encrypted and uploaded
3. **Backward compatibility**: Continue supporting local-only mode
4. **Gradual rollout**: Phased feature release

### Development Approach
1. **Feature flags**: Toggle sync functionality
2. **A/B testing**: Compare sync vs local-only performance
3. **Monitoring**: Track sync success rates and conflicts
4. **Rollback plan**: Ability to disable sync if issues arise

## Success Metrics

### Technical KPIs
- **Sync reliability**: 99.9% successful sync operations
- **Conflict rate**: <1% of sync operations result in conflicts
- **Performance**: Sync operations complete within 5 seconds
- **Uptime**: 99.95% service availability

### Business KPIs
- **User adoption**: 40% of desktop users enable sync within 3 months
- **Cross-platform usage**: 25% of users access from multiple devices
- **Subscription conversion**: 15% of sync users upgrade to paid plans
- **User retention**: 80% of sync users remain active after 6 months

## Timeline Summary

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| 1 | Weeks 1-3 | Encryption layer, cloud backend foundation |
| 2 | Weeks 4-6 | Desktop sync integration, conflict resolution |
| 3 | Weeks 7-10 | Web version, IndexedDB storage, PWA features |
| 4 | Weeks 11-14 | Real-time sync, advanced conflict handling |
| 5 | Weeks 15-16 | Subscription system, deployment, testing |

**Total Timeline: 16 weeks (4 months)**

## Next Steps

1. **Technical validation**: Prototype encryption layer
2. **Architecture review**: Validate cloud service design
3. **Security audit**: Review encryption implementation
4. **User research**: Validate sync feature requirements
5. **Infrastructure setup**: Provision cloud resources
6. **Development kickoff**: Begin Phase 1 implementation

This implementation plan transforms Data Desktop from a local desktop application into a comprehensive, secure, multi-platform personal data management solution while maintaining the core principles of user privacy and data ownership through end-to-end encryption.