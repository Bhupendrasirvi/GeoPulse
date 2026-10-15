# Project Report: GeoPulse
### Real-Time Emergency Response & Resource Dispatch System

---

## 1. Project Overview

**Project Name:** GeoPulse  
**Student Name:** Bhupendra Sirvi  
**Course:** Bachelor of Technology (B.Tech) - Computer Science & Engineering  
**GitHub Repository:** [https://github.com/Bhupendrasirvi/GeoPulse](https://github.com/Bhupendrasirvi/GeoPulse)  

---

## 2. Introduction

During emergencies like floods, fires, or building collapses, getting help quickly is the most important thing. Usually, people call helpline numbers, and operators manually figure out who to send. This takes too much time, and teams are often sent from far away even when a closer team was available.

**GeoPulse** is a simple, fast web-based emergency dispatch system. It connects citizens in danger with the nearest rescue teams and relief shelters in seconds using **MongoDB's built-in location search**.

### Why this project was built:
* To give citizens a quick one-tap button on their phone to share their location and what help they need.
* To automatically find and assign the nearest available rescue unit using coordinates.
* To show everything live on a dark, easy-to-read map for coordinators.
* To automatically delete old resolved emergency records after 48 hours so the database stays clean.

---

## 3. Project Objectives

The main goals of this project are:

1. **Quick Nearest-Team Search:** Use MongoDB's `2dsphere` location index to find rescue teams closest to the victim in less than 20 milliseconds.
2. **Citizen SOS Portal:** Give people a simple form to pick their emergency type (Medical, Flood, Fire, Food), number of people stuck, and drop their GPS pin.
3. **Smart Priority Ranking:** Put dangerous cases with more people stuck at the top of the queue so dispatchers see them first.
4. **Automatic 48-Hour Cleanup:** Use MongoDB's Time-To-Live (TTL) feature to delete closed emergency cases after 48 hours without needing manual cleanup scripts.
5. **Backup Team Creation:** If no team is registered within 15 km of an emergency, the system automatically creates a local community squad so nobody is left waiting.
6. **No Heavy Third-Party Queues:** Keep the whole system simple using just Node.js, Express, and MongoDB without requiring extra tools like Redis or Kafka.

---

## 4. Technologies Used

| Layer | Technology | Why We Used It |
| :--- | :--- | :--- |
| **Frontend** | HTML5, Tailwind CSS, JavaScript | Lightweight, fast loading, no heavy frameworks needed |
| **Interactive Map** | Leaflet.js | Free, open-source map library that runs smoothly in any browser |
| **Backend Server** | Node.js with Express.js | Easy to write REST APIs and connects directly to MongoDB |
| **Database** | MongoDB (Local or Atlas) | Native support for coordinates, fast location queries, and flexible data |
| **Map Tiles** | Esri Dark Gray Canvas | Free, dark-mode map tiles that make pins and route lines easy to see |

---

## 5. System Requirements

### Hardware Requirements:
* **Processor:** Intel Core i3 / AMD Ryzen 3 or higher
* **RAM:** 4 GB minimum (8 GB recommended)
* **Storage:** 500 MB free hard disk space
* **Internet:** Required to load online map tiles

### Software Requirements:
* **Operating System:** Windows 10/11, macOS, or Linux
* **Node.js:** Version 16 or higher
* **MongoDB:** Community Server (v5.0+) or MongoDB Atlas cloud account
* **Web Browser:** Google Chrome, Microsoft Edge, or Mozilla Firefox

---

## 6. How the System Works

The system has two main user views:

### View 1: Citizen SOS View (For People Needing Help)
1. A citizen opens the web page on their phone or computer.
2. They click **"Use My GPS"** or click on the map to mark where they are.
3. They select the emergency category (e.g., *Medical / Trauma*, *Flood Evacuation*).
4. They select how many people need help (e.g., 3 people).
5. They write a quick note (e.g., *"Ground floor flooded, senior citizen on 1st floor terrace"*).
6. They click **"Transmit Emergency SOS Beacon"**.
7. The distress alert is saved into MongoDB in less than a second.

### View 2: Dispatcher Command Console (For Rescue Coordinators)
1. The coordinator sees a live feed of all emergencies on the left sidebar.
2. Each card is color-coded:
   * **Red:** Open emergency that needs immediate action.
   * **Blue:** Team is already dispatched and on the way.
   * **Green:** Emergency is resolved.
3. The coordinator clicks **"Match Unit"** (or presses the <kbd>M</kbd> key).
4. The system runs a location search inside MongoDB and instantly draws a line on the map connecting the victim to the closest squad.
5. Once the team reaches and helps the people, the coordinator clicks **"Resolve"** (or presses the <kbd>R</kbd> key).

---

## 7. Database Design & Collections

MongoDB stores data in JSON-like documents. We have 3 simple collections in the `geopulse` database:

### Collection 1: `incidents`
Stores all emergency reports created by citizens:
```json
{
  "_id": "64d019f2a4c1e2b58d4a1001",
  "id": "SOS-104",
  "caller": "Kavita Sharma",
  "phone": "+91 98141-89210",
  "category": "Medical / Trauma",
  "severity": "CRITICAL",
  "victims": 2,
  "note": "Diabetic patient having chest pain, road flooded.",
  "location": {
    "type": "Point",
    "coordinates": [75.7050, 31.2555]
  },
  "status": "OPEN",
  "assignedTo": null,
  "createdAt": "2026-10-15T14:30:00Z",
  "resolvedAt": null
}
```

### Collection 2: `responders`
Stores all emergency rescue squads, ambulances, and boats:
```json
{
  "_id": "64d019f2a4c1e2b58d4a2001",
  "id": "R-PB1",
  "name": "LPU Campus Quick Response Squad",
  "type": "Rescue Team",
  "status": "Available",
  "contact": "+91 98761-11001",
  "location": {
    "type": "Point",
    "coordinates": [75.7045, 31.2560]
  }
}
```

### Collection 3: `shelters`
Stores nearby relief centers and hospitals:
```json
{
  "_id": "64d019f2a4c1e2b58d4a3001",
  "id": "S-PB1",
  "name": "LPU Indoor Stadium Relief Center",
  "capacity": "250/500 Beds",
  "phone": "01824-510001",
  "location": {
    "type": "Point",
    "coordinates": [75.7020, 31.2540]
  }
}
```

---

## 8. Key Features & How They Were Implemented

### Feature 1: Sub-20ms Location Search (`$geoNear`)
Instead of calculating distance with complex math formulas in our code, we let MongoDB do it directly using its `2dsphere` index:

```javascript
// Database index created once:
db.responders.createIndex({ location: "2dsphere" });

// Query to find closest rescue team within 15 km:
const pipeline = [
  {
    $geoNear: {
      near: { type: "Point", coordinates: [lng, lat] },
      distanceField: "distanceMeters",
      spherical: true,
      maxDistance: 15000
    }
  },
  { $limit: 1 }
];
const nearestTeam = await db.collection('responders').aggregate(pipeline).toArray();
```

### Feature 2: Automatic 48-Hour Database Cleanup (TTL Index)
In real emergencies, you don't want resolved cases cluttering the system forever. We created a **Time-To-Live (TTL)** index in MongoDB:

```javascript
db.incidents.createIndex(
  { resolvedAt: 1 }, 
  { expireAfterSeconds: 172800 } // 172,800 seconds = 48 Hours
);
```
**How it works:** When an incident is marked as resolved, we save the current time in `resolvedAt`. MongoDB automatically deletes the record exactly 48 hours later. We don't have to write any cron jobs or background scripts for this!

### Feature 3: Smart Report Stacking (Deduplication)
If 3 people call about the same flooded house or trapped family, the system does not create 3 separate confusing cards. It detects that the reports are from the same place and shows:
> **x3 reports • Latest 2m ago**  
This keeps the dispatcher's screen clean and organized.

### Feature 4: Keyboard Shortcuts for Dispatchers
In an emergency center, speed matters. Dispatchers can control the system without touching the mouse:
* <kbd>/</kbd> — Jump to the Search bar
* <kbd>J</kbd> / <kbd>K</kbd> — Move up and down through incidents
* <kbd>M</kbd> — Match and dispatch nearest unit
* <kbd>R</kbd> — Mark current incident as resolved
* <kbd>N</kbd> — Add a simulated incoming emergency call

---

## 9. API Endpoints

The backend Express server (`server.js`) provides simple REST endpoints:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/incidents` | Returns all active and resolved emergency incidents |
| `POST` | `/api/incidents` | Receives new SOS reports from citizens and saves to MongoDB |
| `GET` | `/api/responders` | Returns all registered rescue units and their locations |
| `POST` | `/api/match` | Runs `$geoNear` to find and assign the closest unit |
| `POST` | `/api/resolve` | Marks an incident as resolved and starts the 48h TTL timer |

---

## 10. How to Run the Project Locally

Running GeoPulse on any computer takes just 3 simple steps:

### Step 1: Start MongoDB
Make sure MongoDB is installed and running on your system:
```bash
# In Windows PowerShell / Command Prompt:
net start MongoDB
```

### Step 2: Start the Backend Server
```bash
cd geopulse-backend
npm install
node server.js
```
The server will start at: `http://localhost:5000`

### Step 3: Open the Dashboard
Simply open `geopulse-frontend/index.html` in your browser, or double-click the included `start.bat` file which opens everything automatically!

---

## 11. Advantages of GeoPulse

1. **Very Fast:** Finds the closest team in ~14 milliseconds.
2. **Simple Architecture:** No Redis, no Kafka, no extra server costs. Only MongoDB and Node.js.
3. **Zero Maintenance Cleanup:** Old resolved alerts delete themselves after 48 hours.
4. **Mobile Friendly:** Citizens can send SOS directly from their mobile phone browser.
5. **Human-Friendly UI:** High-contrast dark theme designed to be comfortable during long night shifts.

---

## 12. Conclusion

The **GeoPulse** project shows how MongoDB's built-in geospatial features can solve real-world emergency dispatch problems without needing complex infrastructure. By combining simple coordinate pin-drops, fast spherical search, and an intuitive live map, GeoPulse helps save critical minutes during disasters when every second counts.
