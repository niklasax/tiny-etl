import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { CSVCleaner, CleaningRules } from '../services/csvCleaner';
import pool from '../services/database';

const router = Router();

// Configure file upload storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

// Upload CSV
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const fileId = req.file.filename;
  const filePath = req.file.path;

  try {
    // Parse CSV
    const csvText = fs.readFileSync(filePath, 'utf-8');
    const { data, headers } = CSVCleaner.parseCSV(csvText);

    // Save to database
    await pool.query(
      `INSERT INTO uploads (file_id, original_name, file_path, row_count, column_count)
       VALUES ($1, $2, $3, $4, $5)`,
      [fileId, req.file.originalname, filePath, data.length, headers.length]
    );

    res.json({
      message: 'File uploaded successfully',
      fileId,
      originalName: req.file.originalname,
      size: req.file.size,
      rowCount: data.length,
      headers
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to process upload' });
  }
});

// Clean CSV with rules
router.post('/clean/:fileId', async (req: Request, res: Response) => {
  const { fileId } = req.params;
  const rules: CleaningRules = req.body;

  try {
    // Get file from database
    const result = await pool.query(
      'SELECT * FROM uploads WHERE file_id = $1',
      [fileId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }

    const upload = result.rows[0];
    
    // Read and parse CSV
    const csvText = fs.readFileSync(upload.file_path, 'utf-8');
    const { data, headers } = CSVCleaner.parseCSV(csvText);

    // Clean the data
    const cleanedData = CSVCleaner.cleanData(data, rules);

    // Save cleaned data to a new file
    const cleanedCsv = CSVCleaner.convertToCSV(cleanedData);
    const cleanedFilePath = upload.file_path.replace('.csv', '-cleaned.csv');
    fs.writeFileSync(cleanedFilePath, cleanedCsv);

    // Save cleaning job to database
    await pool.query(
      `INSERT INTO cleaning_jobs (file_id, rules, original_row_count, cleaned_row_count)
       VALUES ($1, $2, $3, $4)`,
      [fileId, JSON.stringify(rules), data.length, cleanedData.length]
    );

    // Update upload record with cleaned file path
    await pool.query(
      `UPDATE uploads SET file_path = $1 WHERE file_id = $2`,
      [cleanedFilePath, fileId]
    );

    // Profile both
    const originalProfile = CSVCleaner.profileData(data, headers);
    const cleanedProfile = CSVCleaner.profileData(cleanedData, headers);

    res.json({
      message: 'Data cleaned successfully',
      fileId,
      originalProfile,
      cleanedProfile,
      cleanedRowCount: cleanedData.length
    });
  } catch (error) {
    console.error('Cleaning error:', error);
    res.status(500).json({ error: 'Failed to clean data' });
  }
});

// Download cleaned CSV
router.get('/download/:fileId', async (req: Request, res: Response) => {
  const { fileId } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM uploads WHERE file_id = $1',
      [fileId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }

    const upload = result.rows[0];
    const filePath = upload.file_path;

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File no longer exists' });
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition', 
      `attachment; filename="cleaned-${upload.original_name}"`
    );
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

// Get upload history
router.get('/history', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT u.*, 
              COUNT(c.id) as cleaning_count,
              MAX(c.created_at) as last_cleaned
       FROM uploads u
       LEFT JOIN cleaning_jobs c ON u.file_id = c.file_id
       GROUP BY u.id
       ORDER BY u.uploaded_at DESC
       LIMIT 20`
    );

    res.json({ uploads: result.rows });
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

export default router;
