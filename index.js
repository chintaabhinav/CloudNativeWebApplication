const sequelize = require("./models/index");
const express = require("express");
const multer = require("multer");
const multerS3 = require("multer-s3");
const AWS = require("aws-sdk");
const mysql = require("mysql2/promise");
const HealthCheck = require("./models/healthcheck");
const ProfilePicUpload = require("./models/profilepicupload");

const app = express();
const PORT = 8080;

app.use(express.json({ strict: true }));

AWS.config.update({
  region: process.env.AWS_REGION,
});
const s3 = new AWS.S3();

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    res.set("Cache-Control", "no-cache, no-store, must-revalidate");
    res.set("Pragma", "no-cache");
    return res.status(400).end();
  }
  next();
});

app.get("/healthz", async (req, res) => {
  // ❌ Reject request if body, query params, or extra headers exist
  if (req.body && Object.keys(req.body).length > 0) {
    res.set("Cache-Control", "no-cache, no-store, must-revalidate");
    res.set("Pragma", "no-cache");
    return res.status(400).end();
  }

  if (Object.keys(req.query).length > 0) {
    res.set("Cache-Control", "no-cache, no-store, must-revalidate");
    res.set("Pragma", "no-cache");
    return res.status(400).end();
  }

  try {
    await HealthCheck.create({ datetime: new Date() });

    res.set("Cache-Control", "no-cache, no-store, must-revalidate");
    res.set("Pragma", "no-cache");
    res.status(200).end();
  } catch (error) {
    res.set("Cache-Control", "no-cache, no-store, must-revalidate");
    res.set("Pragma", "no-cache");
    res.status(503).end();
  }
});

app.all("/healthz", (req, res) => {
  if (req.method !== "GET") {
    res.set("Cache-Control", "no-cache, no-store, must-revalidate");
    res.set("Pragma", "no-cache");
    return res.status(405).end();
  }
});

// Multer configuration for S3 file upload
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.S3_BUCKET_NAME,
    acl: "private",
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      cb(null, `${Date.now()}_${file.originalname}`);
    },
  }),
});

// 🟢 Upload File API
app.post("/v1/file", upload.single("file"), async (req, res) => {
  try {
    const { key, originalname } = req.file;

    // Insert file metadata into the database
    const newFile = await ProfilePicUpload.create({
      filename: key,
      path: `${process.env.S3_BUCKET_NAME}/${key}`,
    });

    res.status(201).json({
      file_name: originalname,
      id: newFile.id, // Incremental ID from the database
      url: newFile.path,
      upload_date: new Date().toISOString().split("T")[0], // Format YYYY-MM-DD
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "File upload failed" });
  }
});

// 🟢 Get File Path API
app.get("/v1/file/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const file = await ProfilePicUpload.findByPk(id);
    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    res.status(200).json({
      file_name: file.filename,
      id: file.id,
      url: file.path,
      upload_date: file.uploaded_at.toISOString().split("T")[0], // YYYY-MM-DD format
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to retrieve file path" });
  }
});

app.delete("/v1/file/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const file = await ProfilePicUpload.findByPk(id);
    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    // Delete from S3
    await s3
      .deleteObject({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: file.filename,
      })
      .promise();

    // Delete from database
    await ProfilePicUpload.destroy({ where: { id } });

    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "File deletion failed" });
  }
});

// 🛑 Prevent running the server during tests
if (process.env.NODE_ENV !== "test") {
  (async () => {
    try {
      await sequelize.authenticate();
      console.log("Connection to MySQL has been established successfully.");
      await sequelize.sync({ alter: true });
      console.log("Database synchronized!");

      app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
      });
    } catch (error) {
      console.error("Unable to connect to the database:", error);
      process.exit(1);
    }
  })();
}

module.exports = app;
