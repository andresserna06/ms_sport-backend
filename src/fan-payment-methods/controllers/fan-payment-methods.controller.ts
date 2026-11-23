import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
} from '@nestjs/common';
import { IdParam } from '../../common/decorators/id-param.decorator';
import { idParamPipe } from '../../common/pipes/id-param.pipe';
import { CreateFanPaymentMethodDto } from '../dtos/create-fan-payment-method.dto';
import { UpdateFanPaymentMethodDto } from '../dtos/update-fan-payment-method.dto';
import { FanPaymentMethodsService } from '../services/fan-payment-methods.service';

@Controller('fan-payment-methods')
export class FanPaymentMethodsController {
  constructor(private readonly service: FanPaymentMethodsService) {}

  @Post()
  create(@Body() dto: CreateFanPaymentMethodDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@IdParam(idParamPipe()) id: number) {
    return this.service.findOne(id);
  }

  @Put(':id')
  update(
    @IdParam(idParamPipe()) id: number,
    @Body() dto: UpdateFanPaymentMethodDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@IdParam(idParamPipe()) id: number) {
    return this.service.remove(id);
  }
}
