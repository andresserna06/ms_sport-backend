import { PartialType } from '@nestjs/mapped-types';
import { CreateFinalDto } from './create-final.dto';

export class UpdateFinalDto extends PartialType(CreateFinalDto) {}
