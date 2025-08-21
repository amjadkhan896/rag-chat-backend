import { Test } from '@nestjs/testing';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';

describe('MessagesController', () => {
  let controller: MessagesController;
  let mockService = {
    createMessage: jest.fn(),
    listMessages: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [MessagesController],
      providers: [
        {
          provide: MessagesService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get(MessagesController);
    jest.clearAllMocks();
  });

  it('creates message', async () => {
    const mockRequest = { user: { id: 'user1' } };
    const mockBody = { role: 'user', content: 'Hello' };
    const mockMessage = { id: 'msg1', role: 'user', content: 'Hello' };

    mockService.createMessage.mockResolvedValue(mockMessage);

    const result = await controller.createMessage('session1', mockBody as any, mockRequest as any);

    expect(mockService.createMessage).toHaveBeenCalledWith('user1', 'session1', mockBody);
    expect(result).toEqual(mockMessage);
  });

  it('lists messages', async () => {
    const mockRequest = { user: { id: 'user1' } };
    const mockMessages = [{ id: 'msg1', content: 'Hello' }];

    mockService.listMessages.mockResolvedValue(mockMessages);

    const result = await controller.listMessages('session1', mockRequest as any);

    expect(mockService.listMessages).toHaveBeenCalledWith('user1', 'session1');
    expect(result).toEqual(mockMessages);
  });


});