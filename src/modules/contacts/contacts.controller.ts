import { Body, Controller, Delete, Get, Post } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { GetUser } from '@/src/shared/decorators/get-user.decorator';
import type { User } from '@/prisma/generated/prisma';
import { AddContactDto } from './dto/add-contact.dto';

@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get('/get-contacts')
  public async getMyContacts(@GetUser() user: User) {
    return await this.contactsService.getMyContacts(user);
  }

  @Post('/add-to-contact')
  public async addContact(@GetUser() user: User, @Body() dto: AddContactDto ) {
    return this.contactsService.addContact(user, dto)
  }

  @Delete('/delete-contact')
  public async deleteContact(@GetUser() user: User, @Body('username') username: string ) {
    return this.contactsService.deleteContact(user, username)
  }
}
