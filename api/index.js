const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
   origin: [
    "http://localhost:5173",
    "https://ph-a9-mediqueue-client.vercel.app"
  ]
}));
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
// -------------------
let tutorCollection, bookingCollection;

// MongoDB Connect
async function connectDB() {
  try {
    await client.connect();
    const db = client.db("mediqueueDB");
    tutorCollection = db.collection("tutors");
    bookingCollection = db.collection("bookings");
    console.log("✅ MongoDB Connected Successfully");
  } catch (error) {
    console.error("❌ MongoDB Connection Failed:", error);
  }

  }

connectDB();

// ==================== ROUTES ====================

app.get('/api/tutors', async (req, res) => {
  try {
    if (!tutorCollection) {
      return res.status(500).send({ message: "Database not connected yet" });
    }

    const limit = parseInt(req.query.limit) || 0;
    let result;
    if (limit > 0) {
      result = await tutorCollection.aggregate([{ $limit: limit }]).toArray();
    } else {
      result = await tutorCollection.find().toArray();
    }

    console.log(`Tutors fetched: ${result.length} items`);  // লগ দেখার জন্য
    res.send(result);
  } catch (error) {
    console.error("Tutors API Error:", error);
    res.status(500).send({ message: "Failed to fetch tutors", error: error.message });
  }
});
// ---------------------

// async function run() {

//   try {
//     await client.connect();

//     console.log("MongoDB connected successfully");

//     await client.db("admin").command({ ping: 1 });

//     console.log("MongoDB connected successfully");

//     const tutorCollection = client
//       .db("mediqueueDB")
//       .collection("tutors");

//       const bookingCollection = client
//   .db("mediqueueDB")
//   .collection("bookings");


      app.get('/api/tutors', async (req, res) => {

      const limit = parseInt(req.query.limit) || 0 ;

      const pipeline = [];
      if(limit>0){
         pipeline.push({ $limit: limit });
      }
         const result = await tutorCollection.aggregate(pipeline).toArray();
      // let query = tutorCollection.find();

      // if (limit) {
      //   query = query.limit(limit);
      // }
      //  const result = await query.toArray();

      res.send(result);

    });

    app.get('/api/tutors/:id', async (req, res) => {

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

    // ====================== নতুন যোগ করা রুট ======================

    // **UPDATE Tutor**
    app.put('/tutors/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const updatedData = req.body;

        const filter = { _id: new ObjectId(id) };
        const updateDoc = { $set: updatedData };

        const result = await tutorCollection.updateOne(filter, updateDoc);

        if (result.modifiedCount > 0) {
          res.send({ success: true, message: "Tutor updated successfully" });
        } else {
          res.status(404).send({ message: "Tutor not found or no changes made" });
        }
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Failed to update tutor" });
      }
    });

    // **DELETE Tutor**
    app.delete('/api/tutors/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };

        const result = await tutorCollection.deleteOne(query);

        if (result.deletedCount > 0) {
          res.send({ success: true, deletedCount: result.deletedCount, message: "Tutor deleted successfully" });
        } else {
          res.status(404).send({ message: "Tutor not found" });
        }
      } catch (error) {
        console.error("Delete Error:", error);
        res.status(500).send({ message: "Failed to delete tutor" });
      }
    });

   app.post('/api/bookings', async (req, res) => {

  try {

    console.log("Booking API hit");
    console.log(req.body);

    const bookingData = req.body;

    if (!bookingData?.tutorId) {
      return res.status(400).send({ message: "Tutor ID missing" });
    }

    const tutor = await tutorCollection.findOne({
      _id: new ObjectId(bookingData.tutorId)
    });

    if (!tutor) {
      return res.status(404).send({ message: "Tutor not found" });
    }

    const currentSlot = Number(tutor.totalSlot || 0);

    if (currentSlot <= 0) {
      return res.status(400).send({ message: "No slot available" });
    }

    await tutorCollection.updateOne(
      { _id: new ObjectId(bookingData.tutorId) },
      { $inc: { totalSlot: -1 } }
    );

    const result = await bookingCollection.insertOne(bookingData);

    res.send(result);

  } catch (error) {

    console.log(error);

    res.status(500).send({
      message: "Booking failed",
      error: error.message
    });

  }
});

    // ==================== GET All Bookings of a Student ====================
    app.get('/api/bookings', async (req, res) => {
      try {
        const studentEmail = req.query.studentEmail;
        
        if (!studentEmail) {
          return res.status(400).send({ message: "Student email is required" });
        }

        const result = await bookingCollection.find({ 
          studentEmail: studentEmail 
        }).toArray();

        res.send(result);
      } catch (error) {
        console.error("Get Bookings Error:", error);
        res.status(500).send({ message: "Failed to load bookings" });
      }
    });

app.patch('/api/bookings/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const { bookStatus } = req.body;

        const filter = { _id: new ObjectId(id) };
        const updateDoc = { $set: { bookStatus } };

        const result = await bookingCollection.updateOne(filter, updateDoc);

        if (result.modifiedCount > 0) {
          res.send({ 
            modifiedCount: result.modifiedCount, 
            message: "Booking status updated successfully" 
          });
        } else {
          res.status(404).send({ message: "Booking not found" });
        }
      } catch (error) {
        console.error("Cancel Booking Error:", error);
        res.status(500).send({ message: "Failed to cancel booking" });
      }
    });

    console.log("All Tutors and Booking APIs are ready");

  } catch (error) {
    
    console.error("MongoDB connection error:", error);
  }



}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('MediQueue Server Running');
});



// app.listen(port, () => {
//     console.log(`Server running on port ${port}`);
// });

// const app = require('../server')
module.exports = app;
   
      