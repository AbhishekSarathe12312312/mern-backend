import multer from "multer";

const storage = multer.memoryStorage();

export const upload = multer({ storage }).fields([
  { name: "file", maxCount: 1 },
  { name: "files", maxCount: 5 },
]);