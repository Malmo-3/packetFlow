import multer from "multer";

const storage = multer.memoryStorage();

const csvFileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  const allowedMimeTypes = [
    "text/csv",
    "application/vnd.ms-excel",
    "text/plain",
  ];

  const isCsvName = file.originalname.toLowerCase().endsWith(".csv");

  if (allowedMimeTypes.includes(file.mimetype) || isCsvName) {
    cb(null, true);
    return;
  }

  cb(new Error("Only CSV files are allowed"));
};

const uploadCsv = multer({
  storage,
  fileFilter: csvFileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
});

export default uploadCsv;
