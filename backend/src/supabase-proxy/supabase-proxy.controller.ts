import {
  Controller,
  Post,
  Get,
  Put,
  Patch,
  Delete,
  Req,
  Res,
  Body,
  Query,
  Param,
  UseGuards,
  Headers,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request, Response } from 'express';
import { SupabaseProxyService } from './supabase-proxy.service';

@Controller('api/supabase')
export class SupabaseProxyController {
  constructor(private readonly proxyService: SupabaseProxyService) {}

  /**
   * Generic REST API proxy
   * POST /api/supabase/rest/v1/:table
   */
  @Post('rest/v1/:table')
  async postRestTable(
    @Param('table') table: string,
    @Body() body: any,
    @Headers('authorization') authHeader?: string,
    @Req() req?: Request
  ) {
    const authToken = authHeader?.replace('Bearer ', '');
    const queryString = new URLSearchParams(req?.query as any).toString();
    const path = `/rest/v1/${table}${queryString ? '?' + queryString : ''}`;
    return this.proxyService.proxyRestRequest('POST', path, body, authToken);
  }

  /**
   * GET /api/supabase/rest/v1/:table
   */
  @Get('rest/v1/:table')
  async getRestTable(
    @Param('table') table: string,
    @Query() query: any,
    @Headers('authorization') authHeader?: string,
    @Req() req?: Request
  ) {
    const authToken = authHeader?.replace('Bearer ', '');
    const queryString = new URLSearchParams(query).toString();
    const path = `/rest/v1/${table}${queryString ? '?' + queryString : ''}`;
    return this.proxyService.proxyRestRequest('GET', path, null, authToken);
  }

  /**
   * PATCH /api/supabase/rest/v1/:table
   */
  @Patch('rest/v1/:table')
  async patchRestTable(
    @Param('table') table: string,
    @Body() body: any,
    @Query() query: any,
    @Headers('authorization') authHeader?: string
  ) {
    const authToken = authHeader?.replace('Bearer ', '');
    const queryString = new URLSearchParams(query).toString();
    const path = `/rest/v1/${table}${queryString ? '?' + queryString : ''}`;
    return this.proxyService.proxyRestRequest('PATCH', path, body, authToken);
  }

  /**
   * DELETE /api/supabase/rest/v1/:table
   */
  @Delete('rest/v1/:table')
  async deleteRestTable(
    @Param('table') table: string,
    @Query() query: any,
    @Headers('authorization') authHeader?: string
  ) {
    const authToken = authHeader?.replace('Bearer ', '');
    const queryString = new URLSearchParams(query).toString();
    const path = `/rest/v1/${table}${queryString ? '?' + queryString : ''}`;
    return this.proxyService.proxyRestRequest('DELETE', path, null, authToken);
  }

  /**
   * Auth endpoints
   * POST /api/supabase/auth/sign-up
   */
  @Post('auth/sign-up')
  async signUp(@Body() body: any) {
    return this.proxyService.proxyAuthRequest('POST', '/sign-up', body);
  }

  /**
   * POST /api/supabase/auth/sign-in
   */
  @Post('auth/sign-in')
  async signIn(@Body() body: any) {
    return this.proxyService.proxyAuthRequest('POST', '/sign-in-with-password', body);
  }

  /**
   * POST /api/supabase/auth/refresh-token
   */
  @Post('auth/refresh-token')
  async refreshToken(@Body() body: { refresh_token: string }) {
    return this.proxyService.proxyAuthRequest('POST', '/refresh', body);
  }

  /**
   * GET /api/supabase/auth/user
   */
  @Get('auth/user')
  async getUser(@Headers('authorization') authHeader?: string) {
    const authToken = authHeader?.replace('Bearer ', '');
    return this.proxyService.proxyAuthRequest('GET', '/user', undefined, authToken);
  }

  /**
   * POST /api/supabase/auth/sign-out
   */
  @Post('auth/sign-out')
  async signOut(@Headers('authorization') authHeader?: string) {
    const authToken = authHeader?.replace('Bearer ', '');
    return this.proxyService.proxyAuthRequest('POST', '/sign-out', {}, authToken);
  }

  /**
   * Storage endpoints
   * GET /api/supabase/storage/object/:bucket/:path
   */
  @Get('storage/object/:bucket/*')
  async getStorageObject(
    @Param('bucket') bucket: string,
    @Param() params: any,
    @Headers('authorization') authHeader?: string
  ) {
    const authToken = authHeader?.replace('Bearer ', '');
    const path = `/${params[0] || ''}`;
    return this.proxyService.proxyStorageRequest('GET', `/object/${bucket}${path}`, undefined, authToken);
  }

  /**
   * POST /api/supabase/storage/object/:bucket/:path (upload)
   */
  @Post('storage/object/:bucket/*')
  @UseInterceptors(FileInterceptor('file'))
  async uploadToStorage(
    @Param('bucket') bucket: string,
    @Param() params: any,
    @UploadedFile() file: any,
    @Headers('authorization') authHeader?: string,
    @Body() body?: any
  ) {
    const authToken = authHeader?.replace('Bearer ', '');
    const path = `/${params[0] || ''}`;
    
    if (file) {
      return this.proxyService.uploadStorageFile(bucket, path, file, authToken);
    }
    
    // Fallback if no file is provided (e.g. empty file or json upload)
    return this.proxyService.proxyStorageRequest('POST', `/object/${bucket}${path}`, body, authToken);
  }

  /**
   * DELETE /api/supabase/storage/object/:bucket/:path
   */
  @Delete('storage/object/:bucket/*')
  async deleteStorageObject(
    @Param('bucket') bucket: string,
    @Param() params: any,
    @Headers('authorization') authHeader?: string
  ) {
    const authToken = authHeader?.replace('Bearer ', '');
    const path = `/${params[0] || ''}`;
    return this.proxyService.proxyStorageRequest('DELETE', `/object/${bucket}${path}`, undefined, authToken);
  }
}
