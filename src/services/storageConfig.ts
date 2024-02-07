import path from 'path';
import multer from 'multer';

export const storage = multer.diskStorage({
  destination: (req: any, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req: any, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

