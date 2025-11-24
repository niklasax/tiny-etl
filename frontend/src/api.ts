// Use production backend URL
const API_BASE_URL = 'https://backend-service-production-53e1.up.railway.app/api';

export interface UploadResponse {
  message: string;
  fileId: string;
  originalName: string;
  size: number;
  rowCount: number;
  headers: string[];
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

export interface CleanResponse {
  message: string;
  fileId: string;
  originalProfile: DataProfile;
  cleanedProfile: DataProfile;
  cleanedRowCount: number;
}

export const uploadCSV = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Upload failed');
  }

  return response.json();
};

export const cleanCSV = async (fileId: string, rules: CleaningRules): Promise<CleanResponse> => {
  const response = await fetch(`${API_BASE_URL}/clean/${fileId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(rules),
  });

  if (!response.ok) {
    throw new Error('Cleaning failed');
  }

  return response.json();
};

export const downloadCSV = (fileId: string) => {
  const url = `${API_BASE_URL}/download/${fileId}`;
  window.open(url, '_blank');
};

export const healthCheck = async (): Promise<{ status: string; message: string }> => {
  const response = await fetch(`${API_BASE_URL}/health`);
  return response.json();
};
