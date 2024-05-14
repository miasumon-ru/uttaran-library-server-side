
const express = require("express")
const app = express()
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const cors = require("cors")

const jwt = require('jsonwebtoken');

const port = process.env.PORT || 5000

// middleware


app.use(cors({
  origin : [
    "http://localhost:5173"
  ],
  credentials : true
}))
app.use(express.json())

console.log(process.env.DB_USER)



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.k8vw6eq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// cookieOption

const cookieOption = {
  httpOnly : true,
  sameSite : process.env.NODE_ENV === "production" ? "none" : "strict",
  secure : process.env.NODE_ENV === "production" ? true : false
}


async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const booksCollection = client.db("booksDB").collection("books")
    const borrowedBooksCollection = client.db("booksDB").collection("borrowedBooks")


    // auth related api

    app.post('/jwt', async(req, res)=> {

      const user = req.body

      console.log("user for jwt", user)

      const token = jwt.sign(user,  process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
      
      res.cookie("token", token, cookieOption )
         .send({succees : true})
      




    })



    // book related api

    app.get("/books", async(req, res)=> {

        const result = await booksCollection.find().toArray()
        
        res.send(result)
    })

    app.post("/books" , async(req, res)=> {
      const book = req.body

      console.log(book)
      const result = await booksCollection.insertOne(book);
      res.send(result)
      
    })

    app.get('/books/:id', async(req, res) => {

      const id = req.params.id
  
      const query = { _id : new ObjectId(id) };

      const result = await booksCollection.findOne(query)

      res.send(result)

    })

    app.get('/specificCategories/:category', async(req, res) => {
      const category =  req.params.category

      console.log(category)

      const query = { category : category };

      const result = await booksCollection.find(query).toArray();

      res.send(result)
    })


    app.put('/booksUpdate', async(req, res)=> {
      const book = req.body

      console.log(book)

      const filter = { _id: new ObjectId(book.id) };

      const updateDoc = {
        $set: {
          image : book.imageURL,
          bookName : book.bookName,
          authorName : book.authorName,
          category : book.category,
          ratings : book.ratings
        
        },
      };

      const result = await booksCollection.updateOne(filter, updateDoc);

      res.send(result)


    })

    // borrow book related api

    app.post('/borrowedBooks', async(req, res)=> {

      const borrowedBook = req.body

      const result = await borrowedBooksCollection.insertOne(borrowedBook);

      res.send(result)

    })

    // 

    app.get('/borrowedBooks', async(req, res)=> {

      const email = req.query.email

      console.log(req.url)


      const query = { email : email };

      const result =  await borrowedBooksCollection.find(query).toArray();

      res.send(result)

    })

    app.patch('/borrowedBooks/:id', async(req, res)=> {

      const id = req.params.id
      const quantity = req.body
      console.log( "patch for ", id, quantity)

      const query = { _id : new ObjectId(id)}
     
      const updateDoc = {
        $inc  : {
          quantity : -1
        }
      }

      const result = await booksCollection.updateOne(query, updateDoc)

      res.send(result)




    })

    app.patch('/books/:bookName', async(req, res)=> {

      const bookName = req.params.bookName
      // const quantity = req.body
      console.log( "patch for ", bookName)

      const filter  = { bookName : bookName }

      console.log("query for ", filter )

      const options = { upsert: true };
     
      const updateDoc = {
        $inc  : {
          quantity : 1
        }
      }

      const result = await booksCollection.updateOne(filter , updateDoc , options)

      console.log(result)

      res.send(result)




    })

    app.delete("/books/:id", async(req, res) => {
      const id = req.params.id
      console.log("id for delete " , id)

      const message = req.body

      console.log(message)

      const query = {_id : new ObjectId(id) };

      const result = await borrowedBooksCollection.deleteOne(query);
      

      res.send(result)
    })


    


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get("/", async (req, res) => {
    res.send("Library server is running")
})

app.listen(port, () => {
    console.log(`library server is running on port ${port}`)
})

