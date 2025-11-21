import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/src/core/prisma/prisma.service';
import { User, UserContacts } from '@/prisma/generated/prisma';

@Injectable()
export class ContactsService {
  constructor(private readonly prismaService: PrismaService) {}

  public async getMyContacts(user: User): Promise<{
    contacts: {
      id: string
      username: string
      createdAt: Date
      updatedAt: Date
      usernameContact: string
      firstNameContact: string
      lastNameContact: string
      avatarsContact: string | null
    }[]
  }> {
    const myUser = await this.prismaService.user.findUnique({
      where: { id: user.id },
      include: { contacts: true },
    });

    if (!myUser) {
      throw new NotFoundException('User not found');
    }

    return myUser.contacts;
  }

  public async addContact(user: User, username: string): Promise<{
    id: string
    username: string
    createdAt: Date
    updatedAt: Date
    usernameContact: string
    firstNameContact: string
    lastNameContact: string
    avatarsContact: string | null
  }> {
    const contacts = await this.getMyContacts(user);
    const existContact = contacts.find(contact => contact.usernameContact === username);
    if (user.username === username) {
      throw new ConflictException('Вы не можете добавить себя в контакты.');
    }
    if (existContact) {
      throw new ConflictException('Пользователь уже в контактах.');
    }
    const userContact = await this.prismaService.user.findUnique({
      where: { username },
    });
    if (!userContact) {
      throw new NotFoundException('Пользователь не найден.');
    }
    const createdContact = await this.prismaService.userContacts.create({
      data: {
        username: user.username,
        usernameContact: userContact.username,
        firstNameContact: userContact.firstName,
        lastNameContact: userContact.lastName,
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
      throw new NotFoundException('Контакт не найден.');
    }
    await this.prismaService.userContacts.delete({
      where: {
        id: contact.id,
      },
    });
    return true;
  }
}
