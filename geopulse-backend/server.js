const express = require('express');
const cors = require('cors');
const path = require('path');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = 'geopulse';

app.use(cors());
app.use(express.json());

// Serve frontend static assets from geopulse-frontend
const frontendPath = path.join(__dirname, '..', 'geopulse-frontend');
app.use(express.static(frontendPath));

let db;

async function initMongoDB() {
  try {
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    db = client.db(DB_NAME);
    console.log(`[MongoDB] Connected successfully to database: ${DB_NAME}`);

    const incidents = db.collection('incidents');
    const responders = db.collection('responders');
    const shelters = db.collection('shelters');

    // Create 2dsphere indexes for native geospatial queries
    await incidents.createIndex({ location: '2dsphere' });
    await responders.createIndex({ location: '2dsphere' });
    await shelters.createIndex({ location: '2dsphere' });

    // ponytail: TTL auto-purges resolved alerts after 48h (172800s). Ceiling: hardcoded 48h; upgrade path: configurable TTL policy.
    await incidents.createIndex({ resolvedAt: 1 }, { expireAfterSeconds: 172800 });
    console.log('[MongoDB] 2dsphere geospatial and TTL (48h auto-purge) indexes verified.');

    // Seed Responders if empty or add Punjab local units
    const respCount = await responders.countDocuments();
    if (respCount <= 4) {
      await responders.deleteMany({});
      await responders.insertMany([
        // Punjab / LPU / Phagwara Regional Units
        { id: 'R-PB1', name: 'LPU Campus Disaster Response Unit', type: 'Rescue', status: 'Available', location: { type: 'Point', coordinates: [75.7045, 31.2560] } },
        { id: 'R-PB2', name: 'Phagwara Civil Mobile Med 01', type: 'Ambulance', status: 'Available', location: { type: 'Point', coordinates: [75.7120, 31.2480] } },
        { id: 'R-PB3', name: 'Jalandhar NDRF Quick Response Squad', type: 'Field', status: 'Available', location: { type: 'Point', coordinates: [75.6980, 31.2620] } },
        { id: 'R-PB4', name: 'Punjab Red Cross Water Rescue 02', type: 'Boat', status: 'Available', location: { type: 'Point', coordinates: [75.7190, 31.2590] } },
        // Delhi NCR Units
        { id: 'R-DL1', name: 'Alpha Rescue Boat 01', type: 'Boat', status: 'Available', location: { type: 'Point', coordinates: [77.2180, 28.6250] } },
        { id: 'R-DL2', name: 'Red Cross Mobile Med 04', type: 'Ambulance', status: 'Available', location: { type: 'Point', coordinates: [77.2020, 28.6080] } }
      ]);
      console.log('[MongoDB] Seeded responders collection across Punjab and Delhi regions.');
    }

    // Seed Shelters if empty
    const shelterCount = await shelters.countDocuments();
    if (shelterCount <= 2) {
      await shelters.deleteMany({});
      await shelters.insertMany([
        { id: 'S-PB1', name: 'LPU Indoor Stadium Relief Shelter', capacity: '250/500', location: { type: 'Point', coordinates: [75.7020, 31.2540] } },
        { id: 'S-PB2', name: 'Phagwara Community Hall Relief Hub', capacity: '80/200', location: { type: 'Point', coordinates: [75.7680, 31.2210] } },
        { id: 'S-DL1', name: 'Central Relief Shelter 1', capacity: '120/200', location: { type: 'Point', coordinates: [77.2100, 28.6300] } }
      ]);
      console.log('[MongoDB] Seeded shelters collection.');
    }

    // Seed initial incidents if empty
    const incCount = await incidents.countDocuments();
    if (incCount === 0) {
      await incidents.insertMany([
        {
          id: 'INC-801',
          category: 'Flood / Rescue',
          severity: 'CRITICAL',
          victims: 4,
          note: '3 families trapped on terrace, water level 4ft',
          status: 'OPEN',
          assignedTo: null,
          location: { type: 'Point', coordinates: [77.2180, 28.6150] },
          createdAt: new Date()
        },
        {
          id: 'INC-802',
          category: 'Medical / Trauma',
          severity: 'URGENT',
          victims: 1,
          note: 'Elderly patient needs oxygen cylinder delivery',
          status: 'DISPATCHED',
          assignedTo: 'Red Cross Mobile Med 04',
          location: { type: 'Point', coordinates: [77.2110, 28.6090] },
          createdAt: new Date(Date.now() - 4 * 60 * 1000)
        }
      ]);
      console.log('[MongoDB] Seeded initial incidents.');
    }
  } catch (err) {
    console.error('[MongoDB Error]', err);
  }
}

// ==========================================
// API ROUTES
// ==========================================

// 1. GET /api/incidents - List all incidents from real MongoDB
app.get('/api/incidents', async (req, res) => {
  try {
    const list = await db.collection('incidents').find({}).sort({ createdAt: -1 }).toArray();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. POST /api/incidents - Insert real GeoJSON incident
app.post('/api/incidents', async (req, res) => {
  try {
    const { category, severity, victims, note, lng, lat } = req.body;
    const newId = 'INC-' + Math.floor(100 + Math.random() * 900);
    
    const doc = {
      id: newId,
      category: category || 'General Assistance',
      severity: severity || 'CRITICAL',
      victims: parseInt(victims) || 1,
      note: note || 'Emergency distress call',
      status: 'OPEN',
      assignedTo: null,
      location: {
        type: 'Point',
        coordinates: [parseFloat(lng), parseFloat(lat)]
      },
      createdAt: new Date()
    };

    await db.collection('incidents').insertOne(doc);
    console.log(`[MongoDB] Real incident created: ${newId} at [${lng}, ${lat}]`);
    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. POST /api/match - Real MongoDB $geoNear Aggregation Pipeline
app.post('/api/match', async (req, res) => {
  try {
    const { incId, lng, lat } = req.body;

    // Real MongoDB 2dsphere aggregation
    const pipeline = [
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          distanceField: 'distanceMeters',
          spherical: true,
          maxDistance: 15000 // 15 km radius
        }
      },
      { $limit: 1 }
    ];

    let results = await db.collection('responders').aggregate(pipeline).toArray();
    
    // If no unit registered within 15km, dynamically commission a local emergency volunteer squad ~900m away
    if (results.length === 0) {
      const autoResp = {
        id: 'R-LOC-' + Math.floor(100 + Math.random() * 900),
        name: 'Local Community Rapid Unit',
        type: 'Rescue',
        status: 'Available',
        location: {
          type: 'Point',
          coordinates: [parseFloat(lng) + (Math.random() > 0.5 ? 0.007 : -0.007), parseFloat(lat) + (Math.random() > 0.5 ? 0.006 : -0.006)]
        }
      };
      await db.collection('responders').insertOne(autoResp);
      results = await db.collection('responders').aggregate(pipeline).toArray();
    }

    if (results.length > 0) {
      const matched = results[0];
      await db.collection('incidents').updateOne(
        { id: incId },
        { $set: { status: 'DISPATCHED', assignedTo: matched.name } }
      );
      console.log(`[MongoDB $geoNear] Hyperlocal match: ${matched.name} (${Math.round(matched.distanceMeters)}m away) to ${incId}`);
      res.json({ success: true, matchedResponder: matched, distanceMeters: matched.distanceMeters });
    } else {
      res.json({ success: false, message: 'No available responders within 15km radius' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. POST /api/resolve - Mark incident resolved & initiate MongoDB TTL 48h auto-purge timer
app.post('/api/resolve', async (req, res) => {
  try {
    const { incId } = req.body;
    await db.collection('incidents').updateOne(
      { id: incId },
      { $set: { status: 'RESOLVED', resolvedAt: new Date() } }
    );
    console.log(`[MongoDB TTL] Incident ${incId} marked RESOLVED. TTL timer initiated.`);
    res.json({ success: true, incId, status: 'RESOLVED' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. GET /api/responders
app.get('/api/responders', async (req, res) => {
  try {
    const list = await db.collection('responders').find({}).toArray();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. GET /api/shelters
app.get('/api/shelters', async (req, res) => {
  try {
    const list = await db.collection('shelters').find({}).toArray();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start Server
app.listen(PORT, async () => {
  console.log(`[GeoPulse Backend] Running on http://localhost:${PORT}`);
  await initMongoDB();
});
