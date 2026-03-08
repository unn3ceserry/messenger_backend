import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/src/core/prisma/prisma.service';
import { User, UserContacts } from '@/prisma/generated/prisma';
import { AddContactDto } from './dto/add-contact.dto';

@Injectable()
export class ContactsService {
  constructor(private readonly prismaService: PrismaService) {}

  public async getMyContacts(user: User): Promise<UserContacts[]> {
    const myUser = await this.prismaService.user.findUnique({
      where: { id: user.id },
      include: { contacts: true },
    });

    if (!myUser) {
      throw new NotFoundException({ message: 'Пользователь не найден.' });
    }

    return myUser.contacts;
  }

  public async editContact(user: User, dto: AddContactDto): Promise<boolean> {
    const { firstName, lastName, username } = dto;
    const contacts = await this.getMyContacts(user);
    const existContact = contacts.find(
      (contact) => contact.usernameContact === username,
    );
    if (!existContact) {
      throw new ConflictException({ message: 'Пользователь не в контактах.' });
    }
    const userContact = await this.prismaService.user.findUnique({
      where: { username },
    });
    if (!userContact) {
      throw new NotFoundException({ message: 'Пользователь не найден.' });
    }

    await this.prismaService.userContacts.update({
      where: { id: existContact.id },
      data: {
        usernameContact: userContact.username,
        firstNameContact: firstName,
        lastNameContact: lastName,
        avatarsContact: userContact.avatars?.[0] || null,
      },
    });
    return true;
  }

  public async addContact(user: User, dto: AddContactDto): Promise<UserContacts> {
    const { firstName, lastName, username } = dto;
    const contacts = await this.getMyContacts(user);
    const existContact = contacts.find(
      (contact) => contact.usernameContact === username,
    );
    if (user.username === username) {
      throw new ConflictException({
        message: 'Вы не можете добавить себя в контакты.',
      });
    }
    if (existContact) {
      throw new ConflictException({ message: 'Пользователь уже в контактах.' });
    }
    const userContact = await this.prismaService.user.findUnique({
      where: { username },
    });
    if (!userContact) {
      throw new NotFoundException({ message: 'Пользователь не найден.' });
    }
    return this.prismaService.userContacts.create({
      data: {
        username: user.username,
        usernameContact: userContact.username,
        firstNameContact: firstName,
        lastNameContact: lastName,
        avatarsContact: userContact.avatars?.[0] || null,
      },
    });
  }

  public async deleteContact(user: User, username: string): Promise<boolean> {
    const contact = await this.prismaService.userContacts.findFirst({
      where: {
        username: user.username,
        usernameContact: username,
      },
    });
    if (!contact) {
      throw new NotFoundException({ message: 'Контакт не найден.' });
    }
    await this.prismaService.userContacts.delete({
      where: { id: contact.id },
    });
    return true;
  }
}