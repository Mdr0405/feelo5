// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect( "mongodb+srv://root:5317ba91@cluster0.nd1iu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
        , { useNewUrlParser: true,useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));

// Song Schema
const songSchema = new mongoose.Schema({
    name: String,
    duration: String,
    artist: String,
    link: String
});


//playlist schema
const playlistSchema= new mongoose.Schema({
    userId:Number,
    name:String,
    s:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Song' // Reference to the Song model
        }
    ]
});

//song model
const Song = mongoose.model('Song', songSchema);

//Add song data
const songdata=[
    {name:"Dua for problems", duration:"08:51", artist:"Saad Al Qureshi", link:"/Dua for problems.mp3"},
    {name:"2002", duration:"03:07", artist:"Anne Marie", link:"/fav.mp3"},
    {name:"Bye bye bye-Deadpool and Wolverine", duration:"03:20", artist:"NSYNC", link:"/Byebyebye.mp3"},
    {name:"Dua for Quick Answers", duration:"10:24", artist:"Saad Al Qureshi", link:"/Dua for Quick Answers.mp3"},
    {name:"Kannazhagha", duration:"04:36", artist:"Anirudh Ravichandran", link:"/Kannazhagha.mp3"},
    {name:"Kun Anta", duration:"04:50", artist:"Humoodd", link:"/Kun Anta.mp3"},
    {name:"Levitating", duration:"03:27", artist:"Dua Lipa", link:"/Levitating.mp3"},
    {name:"Nilaave vaa", duration:"04:32", artist:"SPB", link:"/Nilaave vaa.mp3"},
    {name:"Parayuvaan", duration:"04:35", artist:"Sid Sriram", link:"/Parayuvaan.mp3"},
    {name:"Rahmatun Lil Alameen", duration:"03:47", artist:"Maher Zain", link:"/Rahmatun Lil Alameen.mp3"},
    {name:"Zikir for Wealth", duration:"12:24", artist:"Saad Al Qureshi", link:"/Zikir for Wealth.mp3"},
    {name:"70000 Angels Dua", duration:"07:30", artist:"Saad Al Qureshi", link:"/Angels Dua.mp3"}
];
const data= Song.insertMany(songdata);
// console.log(data);
//end 



// API songs
app.get('/api/songs', async (req, res) => {
    try {
        const songs = await Song.find();
        res.json(songs);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching songs', error: err });
    }
});

// API search
app.get('/api/search', async (req, res) => {
    const { query } = req.query;
    try {
        const songs = await Song.find({
            $or: [
                { name: { $regex: query, $options: 'i' } } 
               // { artist: { $regex: query, $options: 'i' } }
            ]
        });
        res.json(songs);
    } catch (err) {
        res.status(500).json({ message: 'Error searching songs', error: err });
    }
});

//API createplaylist
//playlist model
const Playlist = mongoose.model('Playlist', playlistSchema);

app.post('/api/playlist', async (req, res) => {
    const { userId, name, s } = req.body;
    try {
        const newPlaylist = await Playlist.create({ userId, name , s }); 
        res.status(201).json({ message: 'Playlist created successfully', playlist: newPlaylist });
    } catch (err) {
        console.error('Error creating playlist:', err);
        res.status(500).json({ message: 'Error creating playlist', error: err.message });
    }
});

//API fetchplaylist

app.get('/api/playlist/user/:userId', async(req, res)=>{
    const {userId} = req.params;
    try{
        const playlists= await Playlist.find({userId:userId});
        res.status(201).json(playlists);
    } catch(err){
        console.error('Error fetching playlists:', err);
        res.status(500).json({ message: 'Error fetching playlists', error: err.message });
    }
});

// API playlist details
app.get("/api/playlist/:id", async (req, res) => {
    const { id } = req.params;
    try {
        // Use populate to fetch song details
        const playlist = await Playlist.findById(id).populate("s");
        if (!playlist) {
            return res.status(404).json({ message: "Playlist not found" });
        }

        res.status(200).json(playlist); // Return the playlist with song details populated
    } catch (err) {
        console.error("Error fetching playlist:", err);
        res.status(500).json({ message: "Error fetching playlist", error: err.message });
    }
});


// Add songs to playlist
app.put('/api/playlist/:id/add-songs', async (req, res) => {
    const { id } = req.params; 
    const { songIds } = req.body; 

    try {
        const playlist = await Playlist.findById(id);

        if (!playlist) {
            return res.status(404).json({ message: 'Playlist not found' });
        }

        playlist.s = [...new Set([...playlist.s, ...songIds])];
        await playlist.save();

        res.status(200).json({ message: 'Songs added successfully', playlist });
    } catch (error) {
        console.error('Error updating playlist:', error);
        res.status(500).json({ message: 'Error updating playlist', error: error.message });
    }
});

//delete on exit
async function deleteAllSongsOnExit() {
    try {
      console.log('Deleting all songs and playlists...');
      await Song.deleteMany({}); // Deletes all documents in the Song collection
      await Playlist.deleteMany({});
      console.log('All songs and playlists deleted.');
    } catch (err) {
      console.error('Error deleting songs on shutdown:', err);
   
    }
  }
  
  // Handle exit signals
  process.on('SIGINT', async () => {
    console.log('Server is shutting down...');
    await deleteAllSongsOnExit(); // Cleanup task
    process.exit(0); // Exit gracefully
  });
  
  process.on('SIGTERM', async () => {
    console.log('Server received termination signal...');
    await deleteAllSongsOnExit();
    process.exit(0);
  });

// Start the Server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
