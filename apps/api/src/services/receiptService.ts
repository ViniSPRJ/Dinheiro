import axios from 'axios';
import { config } from '../config/index.js';

const ML_SERVICE_URL = config.mlServiceUrl;

export interface CategorySuggestion {
  category_id: string;
  category_name: string;
  confidence: number;
  alternatives: Array<{ category_id: string; category_name: string; confidence: number }>;
}

export interface ReceiptExtraction {
  amount: number | null;
  date: string | null;
  merchant: string | null;
  raw_text: string;
  category_suggestion: CategorySuggestion | null;
}

/**
 * Client for the ml-service receipt-OCR endpoint. Mirrors the resilient
 * singleton pattern used by MLService/AdvisorService/QuotesService: health
 * check with caching, graceful `null` on failure so a downed ml-service never
 * breaks manual transaction entry.
 */
export class ReceiptService {
  private static instance: ReceiptService;
  private isAvailable = true;
  private lastCheck = 0;
  private readonly checkInterval = 30000; // 30 seconds

  private constructor() {}

  static getInstance(): ReceiptService {
    if (!ReceiptService.instance) {
      ReceiptService.instance = new ReceiptService();
    }
    return ReceiptService.instance;
  }

  private async checkAvailability(): Promise<boolean> {
    const now = Date.now();
    if (now - this.lastCheck < this.checkInterval) {
      return this.isAvailable;
    }

    try {
      await axios.get(`${ML_SERVICE_URL}/health`, { timeout: 2000 });
      this.isAvailable = true;
    } catch {
      this.isAvailable = false;
    }
    this.lastCheck = now;
    return this.isAvailable;
  }

  async extractFromReceipt(
    userId: string,
    fileBuffer: Buffer,
    mimeType: string,
    filename: string
  ): Promise<ReceiptExtraction | null> {
    const available = await this.checkAvailability();
    if (!available) {
      return null;
    }

    try {
      const form = new FormData();
      form.append('user_id', userId);
      form.append('file', new Blob([fileBuffer], { type: mimeType }), filename);

      const response = await axios.post<ReceiptExtraction>(
        `${ML_SERVICE_URL}/ml/extract-from-receipt`,
        form,
        { timeout: 20000 } // OCR is slower than text categorization
      );
      return response.data;
    } catch (error) {
      console.error('Receipt OCR error:', error);
      return null;
    }
  }
}

export const receiptService = ReceiptService.getInstance();
