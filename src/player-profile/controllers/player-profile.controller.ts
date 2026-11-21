import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { PlayerProfileResponseDto } from '../dtos/player-profile-response.dto';
import { PlayerProfileService } from '../services/player-profile.service';

@Controller('players')
export class PlayerProfileController {
  constructor(private readonly profileService: PlayerProfileService) {}

  @Get(':id/profile')
  getProfile(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PlayerProfileResponseDto> {
    return this.profileService.getProfile(id);
  }
}
