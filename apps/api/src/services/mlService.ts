import axios from 'axios';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

interface CategorySuggestion {
  category_id: string;
  category_name: string;
  confidence: number;
  alternatives: Array<{
    category_id: string;
    category_name: string;
    confidence: number;
  }>;
}

interface SuggestCategoryParams {
  description: string;
  userId: string;
  amount?: number;
  accountType?: string;
}

interface RetrainParams {
  userId: string;
  transactionId: string;
  description: string;
  correctCategoryId: string;
  correctCategoryName: string;
}

export class MLService {
  private static instance: MLService;
  private isAvailable: boolean = true;
  private lastCheck: number = 0;
  private readonly checkInterval = 30000; // 30 seconds

  private constructor() {}

  static getInstance(): MLService {
    if (!MLService.instance) {
      MLService.instance = new MLService();
    }
    return MLService.instance;
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

  async suggestCategory(params: SuggestCategoryParams): Promise<CategorySuggestion | null> {
    const available = await this.checkAvailability();
    if (!available) {
      return null;
    }

    try {
      const response = await axios.post<CategorySuggestion>(
        `${ML_SERVICE_URL}/ml/suggest-category`,
        {
          description: params.description,
          user_id: params.userId,
          amount: params.amount,
          account_type: params.accountType,
        },
        { timeout: 5000 }
      );
      return response.data;
    } catch (error) {
      console.error('ML Service suggest-category error:', error);
      return null;
    }
  }

  async retrain(params: RetrainParams): Promise<boolean> {
    const available = await this.checkAvailability();
    if (!available) {
      return false;
    }

    try {
      await axios.post(
        `${ML_SERVICE_URL}/ml/retrain`,
        {
          user_id: params.userId,
          transaction_id: params.transactionId,
          description: params.description,
          correct_category_id: params.correctCategoryId,
          correct_category_name: params.correctCategoryName,
        },
        { timeout: 5000 }
      );
      return true;
    } catch (error) {
      console.error('ML Service retrain error:', error);
      return false;
    }
  }

  async getModelStatus(userId: string): Promise<{
    hasModel: boolean;
    trainingExamples: number;
    readyForTraining: boolean;
  } | null> {
    const available = await this.checkAvailability();
    if (!available) {
      return null;
    }

    try {
      const response = await axios.get(
        `${ML_SERVICE_URL}/ml/model-status/${userId}`,
        { timeout: 2000 }
      );
      return {
        hasModel: response.data.has_model,
        trainingExamples: response.data.training_examples,
        readyForTraining: response.data.ready_for_training,
      };
    } catch (error) {
      console.error('ML Service model-status error:', error);
      return null;
    }
  }
}

export const mlService = MLService.getInstance();
