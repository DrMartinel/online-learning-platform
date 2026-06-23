import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class SupabaseProxyService {
  private axiosInstance: AxiosInstance;
  private supabaseUrl: string;
  private supabaseAnonKey: string;

  constructor(private configService: ConfigService) {
    this.supabaseUrl = this.configService.get<string>('SUPABASE_URL') || '';
    this.supabaseAnonKey = this.configService.get<string>('SUPABASE_PUBLISHABLE_KEY') || '';

    this.axiosInstance = axios.create({
      baseURL: this.supabaseUrl,
      headers: {
        'apikey': this.supabaseAnonKey,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Proxy REST API requests (e.g., /rest/v1/table_name)
   */
  async proxyRestRequest(
    method: string,
    path: string,
    data?: any,
    authToken?: string,
    headers?: Record<string, string>
  ) {
    try {
      const config: any = {
        method: method.toLowerCase(),
        url: path,
      };

      // Add authorization header if provided
      if (authToken) {
        config.headers = {
          ...this.axiosInstance.defaults.headers,
          ...headers,
          'Authorization': `Bearer ${authToken}`,
        };
      } else if (headers) {
        config.headers = {
          ...this.axiosInstance.defaults.headers,
          ...headers,
        };
      }

      if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        config.data = data;
      }

      const response = await this.axiosInstance(config);
      return response.data;
    } catch (error: any) {
      throw new BadRequestException(
        error.response?.data || error.message || 'Supabase proxy error'
      );
    }
  }

  /**
   * Proxy Auth endpoints (e.g., /auth/v1/sign-up)
   */
  async proxyAuthRequest(
    method: string,
    endpoint: string,
    data?: any,
    authToken?: string
  ) {
    return this.proxyRestRequest(
      method,
      `/auth/v1${endpoint}`,
      data,
      authToken
    );
  }

  /**
   * Proxy Storage endpoints (e.g., /storage/v1/object/...)
   */
  async proxyStorageRequest(
    method: string,
    endpoint: string,
    data?: any,
    authToken?: string
  ) {
    return this.proxyRestRequest(
      method,
      `/storage/v1${endpoint}`,
      data,
      authToken
    );
  }
}
