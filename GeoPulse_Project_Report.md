# GeoPulse: Real-Time Emergency Incident & Disaster Dispatch System

**A Web-Based Emergency Response & Rescue Coordination Platform**  
*Project Report — Department of Computer Science & Engineering*  
**Lovely Professional University, Punjab**  
**Author:** Bhupendra Sirvi (B.Tech Computer Science & Engineering)  
**Date:** October 2026  

---

## Chapter 1: Project Overview & Problem Statement
Emergency situations such as road accidents, fire outbreaks, and urban floods require immediate assistance. In emergency management, every minute counts toward saving lives and reducing damage.

### 1.1 Background & Practical Problem
In most cities and regions, conventional emergency handling depends on manual telephone helplines. When callers contact control rooms under panic, several practical problems occur:
- **Unclear Landmark Descriptions:** Callers often struggle to convey exact street names or landmarks, especially in flooded or unfamiliar areas.
- **Manual Team Search:** Dispatchers have to manually call or look up which team is free, resulting in dispatch delays.
- **No Real-Time Map Overview:** Coordinators lack a single live map showing open emergencies alongside active responder units.

### 1.2 Project Solution
**GeoPulse** is a practical web application built to solve these exact problems. It provides a clean portal where citizens can submit distress alerts with one-click GPS coordinate capture, and a centralized operations dashboard where emergency coordinators can view all incidents on a live map and match them with the nearest available rescue unit in seconds.

---

## Chapter 2: System Requirements & Technologies Used
GeoPulse was built using lightweight, modern web technologies ensuring that the application can run on any standard personal computer or local server without complex setup.

### 2.1 Technologies Used
- **Frontend:** HTML5, CSS3, JavaScript, and **Leaflet.js** for mobile-friendly interactive mapping and custom map markers.
- **Backend:** **Node.js** with **Express.js** framework handling REST API requests on port 5000.
- **Database:** **MongoDB** Community Server providing native geospatial indexing (`2dsphere`) for spherical distance queries.

### 2.2 Hardware & Software Specifications
- **Operating System:** Windows 10 / 11, Linux, or macOS (Tested on Windows 11)
- **Processor:** Dual-Core 2.0 GHz or higher (Tested on Intel Core i5 / AMD Ryzen 5)
- **RAM:** 4 GB minimum (8 GB / 16 GB DDR4 recommended)
- **Disk Space:** 500 MB free space
- **Backend Runtime:** Node.js v16+ (Used Node.js v20 LTS)
- **Database Server:** MongoDB v5.0+ (Used v7.0)
- **Browser:** Modern web browser (Chrome, Edge, Firefox)

### 2.3 Key Project Objectives
1. Provide an easy SOS form for victims to report emergencies with accurate GPS coordinates.
2. Display live incidents, available rescue squads, and relief shelters on an interactive map.
3. Automatically compute the closest available rescue squad within a 15 km radius.
4. Render a clear dynamic route line connecting the squad to the victim with estimated travel time.

---

## Chapter 3: System Architecture & Workflow
GeoPulse is structured as a standard 3-tier client-server application:
1. **Presentation Layer (Frontend):** Web browser interface containing the SOS form, status counters, incident list, and Leaflet crisis map.
2. **Application Layer (Node.js API):** Express server exposing REST endpoints (`/api/incidents`, `/api/match`, `/api/resolve`).
3. **Data Layer (MongoDB):** Houses collections and executes `$geoNear` aggregation pipeline over Earth's spherical surface.

### Complete Project Workflow
1. **Citizen SOS Submission:** User opens app, enters contact details, selects incident type, and drops GPS pin on map.
2. **Database Insertion:** Backend receives POST request and saves the incident as a GeoJSON Point in MongoDB.
3. **Dispatcher Proximity Matching:** Dispatcher clicks *'Match Unit'*. Node.js executes a `$geoNear` query searching within 15 km.
4. **Assignment & Visual Route Line:** Closest squad is assigned and a dashed route line connects the team to the victim.
5. **Resolution:** When the rescue squad reaches the victim and provides assistance, dispatcher clicks *'Resolve'*.

---

## Chapter 4: Database Design & MongoDB Collections
The project stores all information in a MongoDB database named `geopulse` with three collections:

### 1. `incidents` Collection (Distress Reports)
```json
{
  "id": "SOS-104",
  "caller": "Kavita Sharma",
  "phone": "+91 98141-89210",
  "category": "Medical / Trauma",
  "severity": "CRITICAL",
  "victims": 2,
  "note": "Patient experiencing chest pain; road knee-deep in water.",
  "location": { "type": "Point", "coordinates": [75.7050, 31.2555] },
  "status": "OPEN",
  "assignedTo": null,
  "createdAt": "2026-10-15T14:30:00Z",
  "resolvedAt": null
}
```

### 2. `responders` Collection (Rescue Units)
```json
{
  "id": "R-PB1",
  "name": "LPU Campus Quick Response Squad",
  "type": "Rescue Team",
  "status": "Available",
  "contact": "+91 98761-11001",
  "location": { "type": "Point", "coordinates": [75.7045, 31.2560] }
}
```

### 3. Indexing Strategy
- `db.incidents.createIndex({ location: "2dsphere" })`
- `db.responders.createIndex({ location: "2dsphere" })`
- `db.incidents.createIndex({ resolvedAt: 1 }, { expireAfterSeconds: 172800 })`

---

## Chapter 5: Proximity Search & $geoNear Engine
Finding the closest rescue unit is handled using MongoDB's `$geoNear` aggregation pipeline in `server.js`:

```javascript
const pipeline = [
  {
    $geoNear: {
      near: { type: 'Point', coordinates: [parseFloat(incidentLng), parseFloat(incidentLat)] },
      distanceField: 'distanceMeters',
      spherical: true,       // Calculates accurate distance over spherical Earth surface
      maxDistance: 15000,    // Search within 15 km radius
      query: { status: 'Available' }
    }
  },
  { $limit: 3 } // Returns top 3 candidate units with distance
];
const nearest = await db.collection('responders').aggregate(pipeline).toArray();
```

---

## Chapter 6: Fallback Auto-Assignment & Report Stacking
### 6.1 Fallback Auto-Provisioning
If an emergency occurs in an unstaffed area and `nearest.length === 0` (no pre-registered squad exists within 15 km), GeoPulse automatically creates a local emergency volunteer squad nearby and assigns it to the incident so zero distress beacons remain unattended.

### 6.2 Report Stacking for Disaster Zones
When multiple distress calls arrive for the same location within ~200m, the frontend groups them into a single consolidated card with a badge (e.g. `x3 reports`), aggregating victim count while preventing map clutter.

---

## Chapter 7: Interactive Crisis Map & Dispatch Interface
- **Red Markers (Incidents):** Open distress calls with caller details, category, and victim count popup.
- **Blue Markers (Responders):** Registered rescue vehicles, ambulances, and rescue teams.
- **Green Markers (Shelters):** Relief centers and schools where evacuated citizens can shelter.
- **Keyboard Shortcuts:** `[/]` Search, `[J/K]` Cycle cards, `[M]` Match nearest, `[R]` Resolve, `[N]` Test SOS.

---

## Chapter 8: Dynamic Route Vector & ETA Projection
When a responder is assigned, a dashed blue polyline is drawn on the map connecting the squad to the incident.
- Straight-line distance $D$ is calculated from MongoDB output in meters.
- Estimated Time of Arrival (ETA) is computed based on urban emergency speed (~35 km/h) and shown in a popup.

---

## Chapter 9: Live Database Query Inspection Modal
Built-in query inspector opened via the `</>` navbar button. Displays active MongoDB URI, database name (`geopulse`), active 2dsphere indexes, and raw BSON aggregation output for live verification and testing.

---

## Chapter 10: System Testing & Results
- **TC-01 (SOS Submission):** Incident saved in MongoDB and pin placed on map (PASS).
- **TC-02 (Nearest Match):** Closest squad matched in <20ms via `$geoNear` (PASS).
- **TC-03 (Route Vector):** Dashed blue route line drawn on map (PASS).
- **TC-04 (Resolve):** Status marked RESOLVED with timestamp (PASS).
- **TC-05 (Fallback Unit):** Auto-created volunteer team in remote zones (PASS).

---

## Chapter 11: How to Run, REST APIs & Conclusion
### 11.1 Execution Guide
1. Start MongoDB: `net start MongoDB`
2. Start Node.js: `cd geopulse-backend && node server.js`
3. Open Browser: `http://localhost:5000` (or double-click `start.bat`)

### 11.2 REST API Specification
- `GET /api/incidents`: Fetch all emergency incidents
- `POST /api/incidents`: Submit a new SOS distress report
- `GET /api/responders`: Fetch all rescue units
- `POST /api/match`: Match closest unit for incident
- `POST /api/resolve`: Mark incident as resolved

### 11.3 Conclusion & Future Scope
**Conclusion:** GeoPulse successfully demonstrates a practical, working web application for real-time emergency dispatch coordination using Node.js, Express, and MongoDB geospatial features.  
**Future Scope:** Developing native Android/iOS mobile applications, offline SMS reporting, and turn-by-turn responder vehicle navigation.
