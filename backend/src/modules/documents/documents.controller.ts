import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminRole, Role, TemplateStatus } from '@prisma/client';
import { AdminScopes } from '../../common/decorators/admin-scopes.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { RateLimit } from '../../common/security/rate-limit.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { DocumentsService } from './documents.service';
import {
  PrefillDto,
  AdminCategoryDto,
  AdminTemplateDto,
  AdminUpdateTemplateDto,
  CheckoutDto,
  PreviewDto,
  SetTemplateStatusDto,
  VerifyDocPaymentDto,
} from './dto/documents.dto';

@ApiTags('documents')
@Controller('documents')
export class DocumentsController {
  constructor(private documentsService: DocumentsService) {}

  // ---- public catalog ----

  @Public()
  @Get('categories')
  @ApiOperation({ summary: 'Document categories with template counts (public)' })
  listCategories() {
    return this.documentsService.listCategories();
  }

  @Public()
  @Get('templates')
  @ApiOperation({ summary: 'Published document templates (?category=slug to filter)' })
  listTemplates(@Query('category') category?: string) {
    return this.documentsService.listTemplates(category);
  }

  // ---- buyer (declared before templates/:id so "me" never matches :id) ----

  @Get('me')
  @ApiOperation({ summary: 'My purchased/draft documents' })
  myDocuments(@CurrentUser() user: CurrentUserPayload) {
    return this.documentsService.myDocuments(user.userId);
  }

  @Get('me/:id')
  @ApiOperation({ summary: 'One of my documents (content unlocked after payment)' })
  myDocument(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.documentsService.myDocument(user.userId, id);
  }

  @Post('checkout')
  @ApiOperation({ summary: 'Answers → draft document + Razorpay order' })
  checkout(@CurrentUser() user: CurrentUserPayload, @Body() dto: CheckoutDto) {
    return this.documentsService.checkout(user.userId, dto.templateId, dto.input);
  }

  @Post('verify-payment')
  @ApiOperation({ summary: 'Verify Razorpay signature; freezes and unlocks the document' })
  verifyPayment(@CurrentUser() user: CurrentUserPayload, @Body() dto: VerifyDocPaymentDto) {
    return this.documentsService.verifyPayment(user.userId, dto);
  }

  // ---- admin catalog (OPS) ----

  @Roles(Role.ADMIN)
  @AdminScopes(AdminRole.OPS)
  @Get('admin/categories')
  adminListCategories() {
    return this.documentsService.adminListCategories();
  }

  @Roles(Role.ADMIN)
  @AdminScopes(AdminRole.OPS)
  @Post('admin/categories')
  adminCreateCategory(@Body() dto: AdminCategoryDto) {
    return this.documentsService.adminCreateCategory(dto);
  }

  @Roles(Role.ADMIN)
  @AdminScopes(AdminRole.OPS)
  @Patch('admin/categories/:id')
  adminUpdateCategory(@Param('id') id: string, @Body() dto: AdminCategoryDto) {
    return this.documentsService.adminUpdateCategory(id, dto);
  }

  @Roles(Role.ADMIN)
  @AdminScopes(AdminRole.OPS)
  @Get('admin/templates')
  adminListTemplates() {
    return this.documentsService.adminListTemplates();
  }

  @Roles(Role.ADMIN)
  @AdminScopes(AdminRole.OPS)
  @Get('admin/templates/:id')
  adminGetTemplate(@Param('id') id: string) {
    return this.documentsService.adminGetTemplate(id);
  }

  @Roles(Role.ADMIN)
  @AdminScopes(AdminRole.OPS)
  @Post('admin/templates')
  adminCreateTemplate(@Body() dto: AdminTemplateDto) {
    return this.documentsService.adminCreateTemplate(dto);
  }

  @Roles(Role.ADMIN)
  @AdminScopes(AdminRole.OPS)
  @Patch('admin/templates/:id')
  adminUpdateTemplate(@Param('id') id: string, @Body() dto: AdminUpdateTemplateDto) {
    return this.documentsService.adminUpdateTemplate(id, dto);
  }

  @Roles(Role.ADMIN)
  @AdminScopes(AdminRole.OPS)
  @Patch('admin/templates/:id/status')
  adminSetTemplateStatus(@Param('id') id: string, @Body() dto: SetTemplateStatusDto) {
    return this.documentsService.adminSetTemplateStatus(id, dto.status as TemplateStatus);
  }

  @Roles(Role.ADMIN)
  @AdminScopes(AdminRole.OPS)
  @Get('admin/orders')
  adminListOrders(@Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.documentsService.adminListOrders(page, pageSize);
  }

  // ---- public preview + template detail (dynamic segments last) ----

  @Public()
  @RateLimit(6, 60_000)
  @Post('templates/:id/prefill')
  @ApiOperation({ summary: 'AI-extract form values from the user\u2019s description (settings-gated)' })
  prefill(@Param('id') id: string, @Body() dto: PrefillDto) {
    return this.documentsService.prefill(id, dto.context);
  }

  @Public()
  @Post('templates/:id/preview')
  @ApiOperation({ summary: 'Watermarked partial preview from answers (public)' })
  preview(@Param('id') id: string, @Body() dto: PreviewDto) {
    return this.documentsService.preview(id, dto.input ?? {});
  }

  @Public()
  @Get('templates/:id')
  @ApiOperation({ summary: 'One template by id or slug with its guided-form schema' })
  getTemplate(@Param('id') id: string) {
    return this.documentsService.getTemplate(id);
  }
}
