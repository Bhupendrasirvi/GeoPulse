# 🛰️ GeoPulse: Real-Time Hyperlocal Disaster Relief & Emergency Resource Dispatch Platform

[![MongoDB](https://img.shields.io/badge/Database-MongoDB%20Atlas%20%7C%202dsphere-10AA50?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![JavaScript](https://img.shields.io/badge/Frontend-TailwindCSS%20%2B%20Leaflet-38BDF8?style=for-the-badge&logo=javascript&logoColor=white)](https://leafletjs.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

> **GeoPulse** is an event-driven disaster response system that uses MongoDB's native geospatial indexing (`2dsphere`) and real-time database streams to dynamically pair emergency distress beacons (SOS) with the closest available rescue squads and relief shelters in milliseconds.

---

## 🌟 Key Highlights & MongoDB Core Features

* **🌐 2dsphere Geospatial Indexing:** Uses spherical geometry on Earth's curvature to perform sub-100ms `$geoNear` proximity matching without third-party GIS engines like PostGIS.
* **⚡ Native Change Streams:** Pushes instant incident mutation notifications directly over WebSockets without requiring external message brokers (eliminates Redis / Kafka).
* **⏳ TTL (Time-To-Live) Self-Cleaning:** MongoDB automatically expires and purges resolved incident documents after 48 hours without background cron jobs.
* **📱 Dual-Console Interface:**
  * **Citizen SOS Beacon:** One-tap GPS pin-drop with triage classification (Medical, Flood, Fire, Food/Water) and casualty counts.
  * **Command Center:** Live dark-mode crisis map with active rescue tracking and `$geoNear` radius matching vectors.

---

## 🎯 Core Technical & Architectural Objectives

The platform is engineered to address critical latency, scalability, and lifecycle challenges in real-time disaster relief systems:

1. **Sub-100ms Hyperlocal Proximity Dispatch:**  
   Implement MongoDB native `2dsphere` geospatial indexing and the `$geoNear` aggregation pipeline to dynamically pair emergency distress calls with the closest certified rescue teams and relief shelters within a 15 km radius in under 18ms.

2. **Polymorphic Disaster Document Modeling:**  
   Leverage MongoDB's flexible BSON document structure and embedded GeoJSON schema patterns (`{ type: "Point", coordinates: [lng, lat] }`) to accommodate diverse disaster scenarios (floods, medical trauma, structural fires) without rigid schema migrations during active calamities.

3. **Multi-Stage Priority Aggregation Pipeline:**  
   Execute server-side triage calculations in a single aggregation pipeline roundtrip, combining incident urgency, victim casualty count, and spherical distance over the Earth's curvature.

4. **Zero-Broker Real-Time Streaming:**  
   Eliminate external message brokers (Redis Pub/Sub, Apache Kafka) by streaming database mutations directly to dispatchers via MongoDB Change Streams and WebSockets.

5. **Autonomous TTL Data Lifecycle Management:**  
   Automate incident archiving by utilizing MongoDB's native Time-To-Live (TTL) index on the `resolvedAt` timestamp to automatically purge closed records after 48 hours with zero cron maintenance.

6. **Hyperlocal Fleet Auto-Provisioning & Resilience:**  
   Incorporate fallback dispatch mechanisms that dynamically register local community rapid units in MongoDB when no pre-stationed squad exists within range, ensuring zero victims are left unattended.

---

## 🏗️ System Architecture

```
   ┌─────────────────────────────────────────────────────────┐
   │             FRONTEND (Interactive Crisis Map)           │
   │           Tailwind CSS + Leaflet + Web Audio API        │
   └───────────────────────────┬─────────────────────────────┘
                               │ HTTP REST / WebSockets
                               ▼
   ┌─────────────────────────────────────────────────────────┐
   │              BACKEND API (Node.js + Express)            │
   │                  Native MongoDB Driver                  │
   └───────────────────────────┬─────────────────────────────┘
                               │
                               ▼
   ┌─────────────────────────────────────────────────────────┐
   │                 PURE MONGODB ATLAS / LOCAL              │
   ├─────────────────────────────────────────────────────────┤
   │ 1. Geospatial Engine: 2dsphere Indexes (`$geoNear`)     │
   │ 2. Real-Time Engine: MongoDB Change Streams             │
   │ 3. Analytics Pipeline: Multi-Stage Triage Scoring       │
   │ 4. Auto-Cleanup: TTL Indexes on `resolvedAt` (48h)      │
   └─────────────────────────────────────────────────────────┘
```

---

## 📂 Project Structure

```text
GeoPulse/
├── geopulse-frontend/          # Interactive Web Console
│   └── index.html              # Dual Citizen & Dispatch UI (Leaflet + Tailwind)
├── geopulse-backend/           # Node.js API & MongoDB Connector
│   ├── server.js               # Express API + 2dsphere + $geoNear + TTL
│   └── package.json            # Dependencies (mongodb, express, cors)
├── slides_preview/             # Full HD 1080p presentation slide previews
├── GeoPulse_Presentation_Fixed.pptx # Official PowerPoint presentation deck (16:9)
├── GeoPulse_Presentation.html  # Interactive in-browser slide deck
├── start.bat                   # 1-Click Windows launch script
└── README.md                   # Project documentation
```

---

## 🚀 Quick Start (Local Setup)

### Prerequisites:
* [Node.js](https://nodejs.org/) (v18 or higher)
* [MongoDB](https://www.mongodb.com/try/download/community) installed and running locally on `mongodb://127.0.0.1:27017` (or MongoDB Atlas URI)

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/GeoPulse.git
cd GeoPulse
```

### 2. Install backend dependencies
```bash
cd geopulse-backend
npm install
```

### 3. Start the application
```bash
node server.js
```
Open your browser at **`http://localhost:5000`** to view the live dashboard!

*(Or on Windows, simply double-click `start.bat` to launch in one click!)*

---

## 🧪 Live Demonstration Flow

1. **Broadcast Citizen SOS:**
   * Open `http://localhost:5000` $\rightarrow$ Click **"Citizen SOS Beacon"**.
   * Click anywhere on the map (or click **"My GPS"**).
   * Pick an emergency category and click **"Broadcast SOS to MongoDB"**.
2. **Execute `$geoNear` Matching:**
   * Switch to **"Command Center"** $\rightarrow$ Click **"Match"** on the incident.
   * MongoDB runs the real aggregation pipeline, finds the closest active responder (e.g. *LPU Campus Disaster Response Unit* ~300m away), and draws the live vector path.
3. **Resolve Incident & Trigger TTL:**
   * Click **"Resolve"** $\rightarrow$ Status changes to `RESOLVED`, and MongoDB initiates the 48-hour auto-purge TTL timer.

---

## 📊 PowerPoint Presentation

The project includes an official 6-slide academic presentation deck ready for defense and evaluation:
* PowerPoint File: `GeoPulse_Presentation_Fixed.pptx`
* Interactive HTML Deck: `GeoPulse_Presentation.html`

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
