import Papa from 'papaparse';

export interface CsvRow {
  [key: string]: string;
}

export interface CleaningRules {
  removeDuplicates: boolean;
  removeEmptyRows: boolean;
  trimWhitespace: boolean;
  handleMissing: 'keep' | 'drop' | 'fill';
}

export interface DataProfile {
  rowCount: number;
  columnCount: number;
  duplicates: number;
  emptyRows: number;
  missingValues: { [key: string]: number };
}

export class CSVCleaner {
  static parseCSV(csvText: string): { data: CsvRow[], headers: string[] } {
    const result = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true
    });

    const data = result.data as CsvRow[];
    const headers = data.length > 0 ? Object.keys(data[0]) : [];

    return { data, headers };
  }

  static cleanData(data: CsvRow[], rules: CleaningRules): CsvRow[] {
    let cleaned = [...data];

    // Remove empty rows
    if (rules.removeEmptyRows) {
      cleaned = cleaned.filter(row => {
        return Object.values(row).some(val => val && val.trim() !== '');
      });
    }

    // Trim whitespace
    if (rules.trimWhitespace) {
      cleaned = cleaned.map(row => {
        const trimmedRow: CsvRow = {};
        Object.keys(row).forEach(key => {
          trimmedRow[key] = row[key].trim();
        });
        return trimmedRow;
      });
    }

    // Handle missing values
    if (rules.handleMissing === 'drop') {
      cleaned = cleaned.filter(row => {
        return Object.values(row).every(val => val && val.trim() !== '');
      });
    } else if (rules.handleMissing === 'fill') {
      cleaned = cleaned.map(row => {
        const filledRow: CsvRow = {};
        Object.keys(row).forEach(key => {
          filledRow[key] = row[key] || 'N/A';
        });
        return filledRow;
      });
    }

    // Remove duplicates
    if (rules.removeDuplicates) {
      const seen = new Set<string>();
      cleaned = cleaned.filter(row => {
        const key = JSON.stringify(row);
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      });
    }

    return cleaned;
  }

  static profileData(data: CsvRow[], headers: string[]): DataProfile {
    if (data.length === 0) {
      return { rowCount: 0, columnCount: 0, duplicates: 0, emptyRows: 0, missingValues: {} };
    }

    const rowCount = data.length;
    const columnCount = headers.length;

    // Count duplicates
    const uniqueRows = new Set(data.map(row => JSON.stringify(row)));
    const duplicates = rowCount - uniqueRows.size;

    // Count empty rows
    const emptyRows = data.filter(row => 
      Object.values(row).every(val => !val || val.trim() === '')
    ).length;

    // Count missing values per column
    const missingValues: { [key: string]: number } = {};
    headers.forEach(header => {
      missingValues[header] = data.filter(row => 
        !row[header] || row[header].trim() === ''
      ).length;
    });

    return { rowCount, columnCount, duplicates, emptyRows, missingValues };
  }

  static convertToCSV(data: CsvRow[]): string {
    return Papa.unparse(data);
  }
}
