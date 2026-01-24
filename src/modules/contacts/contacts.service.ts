import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/src/core/prisma/prisma.service';
import { User, UserContacts } from '@/prisma/generated/prisma';
import { AddContactDto } from './dto/add-contact.dto';

@Injectable()
export class ContactsService {
  constructor(private readonly prismaService: PrismaService) {}

  public async getMyContacts(user: User) {
    const myUser = await this.prismaService.user.findUnique({
      where: { id: user.id },
      include: { contacts: true },
    });

    if (!myUser) {
      throw new NotFoundException('User not found');
    }

    return myUser.contacts;
  }

  public async addContact(user: User, dto: AddContactDto): Promise<{
    id: string
    username: string
    createdAt: Date
    updatedAt: Date
    usernameContact: string
    firstNameContact: string
    lastNameContact: string
    avatarsContact: string | null
  }> {
    const {firstName, lastName, username} = dto;
    const contacts = await this.getMyContacts(user);
    const existContact = contacts.find(contact => contact.usernameContact === username);
    if (user.username === username) {
      throw new ConflictException({message: 'Вы не можете добавить себя в контакты.'});
    }
    if (existContact) {
      throw new ConflictException({message: 'Пользователь уже в контактах.'});
    }
    const userContact = await this.prismaService.user.findUnique({
      where: { username },
    });
    if (!userContact) {
      throw new NotFoundException({message: 'Пользователь не найден.'});
    }
    const createdContact = await this.prismaService.userContacts.create({
      data: {
        username: user.username,
        usernameContact: userContact.username,
        firstNameContact: firstName,
        lastNameContact: lastName,
        avatarsContact: userContact.avatars?.[0] || null,
      },
    });
    return createdContact;
  }

  public async deleteContact(user: User, username: string): Promise<boolean> {
    const contact = await this.prismaService.userContacts.findFirst({
      where: {
        username: user.username,
        usernameContact: username,
      },
    });
    if (!contact) {
      throw new NotFoundException({message: 'Контакт не найден.'});
    }
    await this.prismaService.userContacts.delete({
      where: {
        id: contact.id,
      },
    });
    return true;
  }
}
