import { Body, Controller, Delete, Get, Patch, Post } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { GetUser } from '@/src/shared/decorators/get-user.decorator';
import type { User, UserContacts } from '@/prisma/generated/prisma';
import { AddContactDto } from './dto/add-contact.dto';

@Controller('contacts')
export class ContactsController {
  public constructor(private readonly contactsService: ContactsService) {}

  @Get('/contacts')
  public getMyContacts(@GetUser() user: User): Promise<UserContacts[]> {
    return this.contactsService.getMyContacts(user);
  }

  @Post('/add')
  public addContact(
    @GetUser() user: User,
    @Body() dto: AddContactDto,
  ): Promise<UserContacts> {
    return this.contactsService.addContact(user, dto);
  }

  @Patch('/edit')
  public editContact(
    @GetUser() user: User,
    @Body() dto: AddContactDto,
  ): Promise<boolean> {
    return this.contactsService.editContact(user, dto);
  }

  @Delete('/contact')
  public deleteContact(
    @GetUser() user: User,
    @Body('username') username: string,
  ): Promise<boolean> {
    return this.contactsService.deleteContact(user, username);
  }
}
