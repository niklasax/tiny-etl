import { Router, Request, Response } from 'express';
import pool from '../services/database';
import fs from 'fs';
import { CSVCleaner, CleaningRules } from '../services/csvCleaner';

const router = Router();

// Webhook to trigger cleaning job
router.post('/trigger-clean', async (req: Request, res: Response) => {
  const { fileId, rules } = req.body;

  if (!fileId || !rules) {
    return res.status(400).json({ error: 'fileId and rules are required' });
  }

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

    // Save cleaned data
    const cleanedCsv = CSVCleaner.convertToCSV(cleanedData);
    const cleanedFilePath = upload.file_path.replace('.csv', '-cleaned.csv');
    fs.writeFileSync(cleanedFilePath, cleanedCsv);

    // Save cleaning job
    await pool.query(
      `INSERT INTO cleaning_jobs (file_id, rules, original_row_count, cleaned_row_count)
       VALUES ($1, $2, $3, $4)`,
      [fileId, JSON.stringify(rules), data.length, cleanedData.length]
    );

    // Update upload record
    await pool.query(
      `UPDATE uploads SET file_path = $1 WHERE file_id = $2`,
      [cleanedFilePath, fileId]
    );

    res.json({
      success: true,
      message: 'Cleaning job completed',
      fileId,
      originalRows: data.length,
      cleanedRows: cleanedData.length,
      downloadUrl: `${req.protocol}://${req.get('host')}/api/download/${fileId}`
    });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Failed to process cleaning job' });
  }
});

// Get all uploads (for n8n to list files)
router.get('/list-uploads', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT file_id, original_name, row_count, uploaded_at 
       FROM uploads 
       ORDER BY uploaded_at DESC 
       LIMIT 50`
    );

    res.json({ uploads: result.rows });
  } catch (error) {
    console.error('List error:', error);
    res.status(500).json({ error: 'Failed to list uploads' });
  }
});

export default router;
