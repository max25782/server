import { Controller, Get, HttpCode, Param, Patch, Post, Body } from '@nestjs/common'
import { UserService } from './user.service'
import { Auth } from 'src/auth/decorators/auth decorator'
import { CurrentUser } from 'src/auth/decorators/user.decorator'

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  @Auth()
  async getProfile(@CurrentUser('id') id: string) {
    return this.userService.getById(id)
  }

  @Get('profile/favorites')
  @Auth()
  async getFavorites(@CurrentUser('id') id: string) {
    return this.userService.getFavorites(id)
  }

  @HttpCode(200)
  @Auth()
  @Patch('profile/favorites/:productId')
  async toggleFavorite(
    @CurrentUser('id') id: string,
    @Param('productId') productId: string
  ) {
    return this.userService.toggleFavorite(id, productId)
  }
  
  @HttpCode(200)
  @Auth()
  @Patch('profile/favorite/:productId')
  async toggleFavoriteSingular(
    @CurrentUser('id') id: string,
    @Param('productId') productId: string
  ) {
    return this.userService.toggleFavorite(id, productId)
  }
  
  @HttpCode(200)
  @Auth()
  @Post('profile/favorites')
  async toggleFavoritePost(
    @CurrentUser('id') id: string,
    @Body() { productId }: { productId: string }
  ) {
    return this.userService.toggleFavorite(id, productId)
  }
}
