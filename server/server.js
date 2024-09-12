import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer"; // Import multer
import chat from "./chat.js";

dotenv.config(); // what is this doing?

const app = express(); // use express framework
app.use(cors()); // cross server

// Configure multer, used for process file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) { // file saved path
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) { // file saved name
    cb(null, file.originalname);
  },
});
const upload = multer({ storage: storage });

const PORT = 5001;

let filePath;

app.post("/upload", upload.single("file"), (req, res) => { // use multer upload file
  // Use multer to handle file upload
  filePath = req.file.path; // The path where the file is temporarily saved
  // filePath is updated by most recently uploaded file
  res.send(filePath + " upload successfully.");
});

app.get("/chat", async (req, res) => {
  const resp = await chat(filePath, req.query.question); // Pass the file path to your main function
  res.send(resp.text);
});

app.listen(PORT, () => {
  console.log(`HOORAY! Server is running on port ${PORT}`);
});
