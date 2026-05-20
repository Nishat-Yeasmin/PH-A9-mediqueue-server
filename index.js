const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb://nishatyasminnisha_db_user:igAdOcjWd4TJBmLW@ac-t8mzagm-shard-00-00.ilfkjdr.mongodb.net:27017,ac-t8mzagm-shard-00-01.ilfkjdr.mongodb.net:27017,ac-t8mzagm-shard-00-02.ilfkjdr.mongodb.net:27017/?ssl=true&replicaSet=atlas-2whiym-shard-0&authSource=admin&appName=Cluster0`
//  const uri = `mongodb+srv://nishatyasminnisha_db_user:igAdOcjWd4TJBmLW@cluster0.ilfkjdr.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {

  try {
    await client.connect();

    console.log("MongoDB connected successfully");

    await client.db("admin").command({ ping: 1 });

    console.log("MongoDB connected successfully");

    const tutorCollection = client
      .db("mediqueueDB")
      .collection("tutors");

      app.get('/tutors', async (req, res) => {

      const limit = parseInt(req.query.limit);

      let query = tutorCollection.find();

      if (limit) {
        query = query.limit(limit);
      }
       const result = await query.toArray();

      res.send(result);

    });

    app.get('/tutors/:id', async (req, res) => {

  try {

    const id = req.params.id;

    const query = { _id: new ObjectId(id) };

    const result = await tutorCollection.findOne(query);

    res.send(result);

  } catch (error) {

    res.status(500).send({ error: "Failed to fetch tutor details" });

  }

});

     app.post('/tutors', async (req, res) => {

      const tutorData = req.body;

      const result = await tutorCollection.insertOne(tutorData);

      res.send(result);

    });

    console.log("Tutor APIs ready");

  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('MediQueue Server Running');
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
   
      