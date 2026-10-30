# GeoPulse: Real-Time Emergency Incident & Disaster Dispatch System

**Web-Based Emergency Response & Rescue Coordination using Node.js and MongoDB**  
*A Project Report submitted in partial fulfillment of the requirements for the award of the degree of Bachelor of Technology in Computer Science & Engineering*  
**Lovely Professional University, Punjab**  
**Author:** Bhupendra Sirvi  
**Date:** October 2026  

---

## Candidate's Declaration
I hereby declare that the project entitled **"GeoPulse: Real-Time Emergency Incident & Disaster Dispatch System"** submitted to the Department of Computer Science & Engineering, Lovely Professional University, is an authentic record of original project work completed by me under the supervision of my faculty mentor.

The matter presented in this report has not been submitted in part or full to any other University or Institution for the award of any degree or diploma. All project resources, third-party libraries, and software tools have been properly acknowledged.

**Place:** Lovely Professional University, Punjab  
**Date:** 30th October 2026  
**Bhupendra Sirvi** (B.Tech Computer Science & Engineering)  

---

## Certificate of Approval
This is to certify that the project report entitled **"GeoPulse: Real-Time Emergency Incident & Disaster Dispatch System"**, submitted by **Bhupendra Sirvi** in partial fulfillment of the requirements for the award of the Degree of **Bachelor of Technology in Computer Science & Engineering** from Lovely Professional University, Punjab, is a bonafide record of project work completed under my supervision and guidance.

The project design, implementation, and results presented in this report meet the standards required for an undergraduate engineering project.

---

## Acknowledgements
I express my sincere gratitude to my faculty project mentor for continuous guidance, constructive feedback, and support throughout the development of this project. I also thank the Department of Computer Science & Engineering and Lovely Professional University for providing the required computer labs and software facilities to complete and test this work. Finally, I thank my family and friends for their encouragement and support.

---

## Abstract
During emergencies such as road accidents, building fires, and severe weather floods, fast communication and prompt rescue team dispatch are critical to saving lives. In standard systems, emergency calls are often handled manually over the phone, where callers struggle to describe exact locations, leading to dispatch delays and wasted travel time.

**GeoPulse** is a real-time web-based emergency incident and dispatch coordination system designed to solve this problem. The application allows citizens in distress to submit emergency alerts along with their exact GPS coordinates, type of emergency, and number of people requiring assistance. On the coordinator side, an interactive live map displays all reported incidents and active rescue units in real time.

### Key Features of the Project
1. **Real-Time Proximity Matching:** Uses MongoDB's `2dsphere` index and `$geoNear` aggregation pipeline to quickly find the nearest available rescue squads to an incident.
2. **Citizen SOS Submission:** An easy-to-use reporting form that captures GPS location with one click, emergency category, and severity.
3. **Interactive Map Dashboard:** Built using Leaflet.js to visualize incidents (red markers), rescue teams (blue markers), and relief shelters (green markers).
4. **Dynamic Route Line & ETA:** Displays a visual route line connecting the assigned rescue team directly to the incident pin, along with calculated distance and ETA.
5. **Automatic Data Purge (TTL):** Implements MongoDB TTL indexing on resolved incidents so old records are cleaned up after 48 hours.
6. **Simple & Lightweight Stack:** Runs completely on Node.js, Express, and MongoDB without requiring external heavy third-party message brokers.

---

## Chapter 1: Introduction & Problem Statement
Emergency response systems play a vital role in public safety by coordinating help during accidents, medical emergencies, and natural disasters. Timely intervention can mean the difference between life and death.

### 1.1 Background & Motivation
Most conventional emergency helplines rely heavily on voice calls. During high-stress situations or severe disasters, this conventional approach faces several common challenges:
- **Location Ambiguity:** Callers often cannot describe exact street addresses or landmarks, especially in unfamiliar or flooded areas.
- **Manual Dispatching:** Dispatchers have to manually look up unit locations, which slows down the dispatch process.
- **Lack of Real-Time Overview:** Coordinators do not have a single unified map showing where all open incidents and available units are located simultaneously.

### 1.2 Problem Statement
> *"To develop a simple, responsive, and real-time emergency dispatch web application that allows citizens to report incidents with precise GPS coordinates and enables emergency dispatchers to instantly identify and assign the closest available response team using geospatial indexing."*

---

## Chapter 2: Project Objectives & System Requirements
The primary goal of GeoPulse is to provide an easy-to-use, reliable, and lightweight platform for emergency dispatch coordination.

### 2.1 Project Objectives
1. Create an intuitive web interface for citizens to report emergencies with accurate GPS coordinates.
2. Develop a live mapping dashboard for coordinators to visualize incidents, rescue units, and relief centers in real time.
3. Implement fast proximity-based responder matching using MongoDB's native geospatial capabilities.
4. Display visual route lines between assigned responders and incidents along with estimated travel time.
5. Provide a query inspection tool to allow administrators and examiners to inspect active database queries.

### 2.2 Hardware & Software Requirements
- **Operating System:** Windows 10/11, Linux, or macOS (Tested on Windows 11)
- **Processor:** Dual-Core 2.0 GHz or higher (Tested on Intel Core i5 / AMD Ryzen 5)
- **Memory (RAM):** 4 GB minimum (8 GB / 16 GB recommended)
- **Runtime:** Node.js v16+ (Used Node.js v20 LTS)
- **Database:** MongoDB Community Server v5.0+ (Used v7.0)
- **Browser:** Modern web browser (Google Chrome, Edge, Firefox)

---

## Chapter 3: System Architecture & Workflow
GeoPulse follows a clean 3-tier client-server architecture:
1. **Frontend Layer:** Built using HTML5, CSS3, JavaScript, and Leaflet.js.
2. **Backend Layer:** Express.js REST API server running on Node.js (port 5000).
3. **Database Layer:** MongoDB database `geopulse` storing BSON documents with `2dsphere` indexes.

### Project Workflow
1. **Incident Submission:** Citizen enters details and picks location on map.
2. **Database Storage:** Backend saves the report as a GeoJSON Point in `incidents`.
3. **Proximity Search:** Dispatcher clicks *'Match Unit'*, triggering a `$geoNear` query.
4. **Assignment & Routing:** The best match is assigned, and a dashed route line connects the team to the victim.
5. **Resolution:** Once aid arrives, the dispatcher clicks *'Resolve'*, closing the incident.

---

## Chapter 4: Database Design & Schema Structure
The project uses three collections in the `geopulse` database:

### 1. `incidents` Collection
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

### 2. `responders` Collection
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

### 3. Indexes Used
- `db.incidents.createIndex({ location: "2dsphere" })`
- `db.responders.createIndex({ location: "2dsphere" })`
- `db.incidents.createIndex({ resolvedAt: 1 }, { expireAfterSeconds: 172800 })`

---

## Chapter 5: Proximity Search & Backend Implementation
Finding the closest rescue unit is handled using MongoDB's `$geoNear` aggregation pipeline:

```javascript
const pipeline = [
  {
    $geoNear: {
      near: { type: 'Point', coordinates: [parseFloat(incidentLng), parseFloat(incidentLat)] },
      distanceField: 'distanceMeters',
      spherical: true,       // Calculates accurate spherical distance
      maxDistance: 15000,    // Search within 15 km radius
      query: { status: 'Available' }
    }
  },
  { $limit: 3 } // Returns top 3 candidate units with distance
];
const nearest = await db.collection('responders').aggregate(pipeline).toArray();
```

### Fallback Auto-Assignment
If no pre-registered unit is currently free within 15 km (`nearest.length === 0`), GeoPulse automatically provisions a local emergency volunteer unit nearby so that every distress beacon receives an assigned responder.

---

## Chapter 6: User Interface & Working Screenshots
- **Active Crisis Map View:** Leaflet map visualizing open incident markers, responder positions, and safe shelters.
- **Dynamic Route Vector Display:** Dashed route line connecting assigned responder to incident location with distance and estimated travel time.

---

## Chapter 7: Testing & System Verification
- **Query Inspector Feature:** Built-in modal displaying active MongoDB queries, indexes, and raw output for demonstration and testing.
- **Test Cases:**
  - TC-01: SOS Submission (PASS)
  - TC-02: Nearest Match (PASS)
  - TC-03: Route Line (PASS)
  - TC-04: Resolve Incident (PASS)
  - TC-05: Fallback Unit (PASS)

---

## Chapter 8: How to Run the Project & API Endpoints
1. **Start MongoDB:** `net start MongoDB`
2. **Start Backend:** `cd geopulse-backend` and run `node server.js`
3. **Open in Browser:** Navigate to `http://localhost:5000` (or double-click `start.bat`)

### REST API Endpoints
- `GET /api/incidents`: Fetch all incidents
- `POST /api/incidents`: Submit new distress report
- `GET /api/responders`: Fetch available rescue squads
- `POST /api/match`: Find closest squad for an incident
- `POST /api/resolve`: Mark an incident as resolved

---

## Chapter 9: Conclusion, Future Scope & References
### 9.1 Conclusion
The **GeoPulse** project successfully demonstrates a practical, working web application for real-time emergency dispatch coordination using Node.js, Express, and MongoDB geospatial features. It provides an intuitive map-based interface, automated distance calculation, route line rendering, and clean data management.

### 9.2 Future Scope
- Dedicated Mobile App (Android / iOS)
- SMS & Offline SOS Reporting
- Turn-by-Turn GPS Navigation for Responder Vehicles

### 9.3 References
- MongoDB Inc., *"Geospatial Queries and 2dsphere Indexing Guide"*, 2026.
- Express.js Foundation, *"Express Web Framework Documentation"*, 2026.
- Leaflet.js, *"Leaflet Interactive Maps Library"*, 2026.
- Node.js Foundation, *"Node.js Runtime Documentation"*, 2026.
- RFC 7946, *"The GeoJSON Format Specification"*, 2016.
