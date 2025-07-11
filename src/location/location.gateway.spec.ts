import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { Server, Socket } from 'socket.io';
import { LocationGateway } from './location.gateway';
import { JwtTokenService } from '../auth/jwt.service';
import { redisClient } from '../redis/redis.provider';

// Mock redisClient
jest.mock('../redis/redis.provider', () => ({
  redisClient: {
    geoAdd: jest.fn(),
    set: jest.fn(),
    get: jest.fn(),
    geoSearch: jest.fn(),
    zRange: jest.fn(), // Added zRange to the mock
  },
}));

// Mock JwtTokenService
const mockJwtTokenService = {
  verifyToken: jest.fn(),
};

describe('LocationGateway', () => {
  let app: INestApplication;
  let gateway: LocationGateway;
  let server: Server;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [
        LocationGateway,
        {
          provide: JwtTokenService,
          useValue: mockJwtTokenService,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useWebSocketAdapter(new IoAdapter(app));
    await app.listen(0); // Listen on a random available port

    gateway = moduleFixture.get<LocationGateway>(LocationGateway);
    server = gateway.server; // Access the Socket.IO server instance
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('handleConnection', () => {
    it('should log driver connection and start heartbeat if user is a driver', async () => {
      const mockClient = { data: { user: { userId: 'driver123', role: 'driver' } } } as unknown as Socket;
      const startHeartbeatSpy = jest.spyOn(gateway as any, 'startHeartbeat');

      await gateway.handleConnection(mockClient);

      expect(startHeartbeatSpy).toHaveBeenCalledWith('driver123');
    });

    it('should not start heartbeat if user is not a driver', async () => {
      const mockClient = { data: { user: { userId: 'client123', role: 'client' } } } as unknown as Socket;
      const startHeartbeatSpy = jest.spyOn(gateway as any, 'startHeartbeat');

      await gateway.handleConnection(mockClient);

      expect(startHeartbeatSpy).not.toHaveBeenCalled();
    });
  });

  describe('driver:location:update', () => {
    beforeEach(() => {
      // Clear the timestamp map before each test to avoid frequency check issues
      (gateway as any).driverUpdateTimestamps.clear();
    });
    it('should update driver location in Redis and emit to ride room if rideId is present', async () => {
      const mockClient = {
        data: { user: { userId: 'driver123', role: 'driver' } },
        join: jest.fn(),
      } as unknown as Socket;
      const mockData = { rideId: 1, lat: 10, lng: 20 };
      const mockEmit = jest.fn();
      const mockTo = jest.fn().mockReturnValue({ emit: mockEmit });
      jest.spyOn(server, 'to').mockImplementation(mockTo);

      await gateway.handleDriverLocation(mockData, mockClient);

      expect(redisClient.geoAdd).toHaveBeenCalledWith('drivers:location', {
        longitude: 20,
        latitude: 10,
        member: 'driver123',
      });
      expect(redisClient.set).toHaveBeenCalledWith(
        'driver:driver123:location',
        JSON.stringify({ lat: 10, lng: 20 })
      );
      expect(mockClient.join).toHaveBeenCalledWith('ride:1');
      expect(mockTo).toHaveBeenCalledWith('ride:1');
      expect(mockEmit).toHaveBeenCalledWith('ride:location:update', {
        driverId: 'driver123',
        lat: 10,
        lng: 20,
      });
    });

    it('should update driver location in Redis and emit publicly if no rideId', async () => {
      const mockClient = {
        data: { user: { userId: 'driver123', role: 'driver' } },
      } as unknown as Socket;
      const mockData = { lat: 10, lng: 20 };
      const emitSpy = jest.spyOn(server, 'emit');

      await gateway.handleDriverLocation(mockData, mockClient);

      expect(redisClient.geoAdd).toHaveBeenCalledWith('drivers:location', {
        longitude: 20,
        latitude: 10,
        member: 'driver123',
      });
      expect(redisClient.set).toHaveBeenCalledWith(
        'driver:driver123:location',
        JSON.stringify({ lat: 10, lng: 20 })
      );
      expect(emitSpy).toHaveBeenCalledWith('driver:location:public', {
        driverId: 'driver123',
        lat: 10,
        lng: 20,
      });
    });

    it('should not update location if user is not a driver', async () => {
      const mockClient = { data: { user: { userId: 'client123', role: 'client' } } } as unknown as Socket;
      const mockData = { lat: 10, lng: 20 };

      await gateway.handleDriverLocation(mockData, mockClient);

      expect(redisClient.geoAdd).not.toHaveBeenCalled();
      expect(redisClient.set).not.toHaveBeenCalled();
      expect(server.emit).not.toHaveBeenCalled();
    });

    it('should not update location if sending too frequently', async () => {
      const mockClient = { data: { user: { userId: 'driver123', role: 'driver' } } } as unknown as Socket;
      const mockData = { lat: 10, lng: 20 };

      // Simulate a recent update
      (gateway as any).driverUpdateTimestamps.set('driver123', Date.now() - 1000); // 1 second ago

      await gateway.handleDriverLocation(mockData, mockClient);

      expect(redisClient.geoAdd).not.toHaveBeenCalled();
      expect(redisClient.set).not.toHaveBeenCalled();
      expect(server.emit).not.toHaveBeenCalled();
    });
  });

  describe('drivers:all:request', () => {
    it('should return all driver locations', async () => {
      const mockClient = { emit: jest.fn() } as unknown as Socket;
      (redisClient.zRange as jest.Mock).mockResolvedValueOnce(['driver1', 'driver2']);
      (redisClient.get as jest.Mock)
        .mockResolvedValueOnce(JSON.stringify({ lat: 1, lng: 1 }))
        .mockResolvedValueOnce(JSON.stringify({ lat: 2, lng: 2 }));

      await gateway.handleAllDriversRequest(mockClient);

      expect(redisClient.zRange).toHaveBeenCalledWith('drivers:location', 0, -1);
      expect(redisClient.get).toHaveBeenCalledWith('driver:driver1:location');
      expect(redisClient.get).toHaveBeenCalledWith('driver:driver2:location');
      expect(mockClient.emit).toHaveBeenCalledWith('drivers:all:response', [
        { driverId: 'driver1', lat: 1, lng: 1 },
        { driverId: 'driver2', lat: 2, lng: 2 },
      ]);
    });

    it('should handle no drivers found', async () => {
      const mockClient = { emit: jest.fn() } as unknown as Socket;
      (redisClient.zRange as jest.Mock).mockResolvedValueOnce([]);

      await gateway.handleAllDriversRequest(mockClient);

      expect(redisClient.zRange).toHaveBeenCalledWith('drivers:location', 0, -1);
      expect(redisClient.get).not.toHaveBeenCalled();
      expect(mockClient.emit).toHaveBeenCalledWith('drivers:all:response', []);
    });
  });
});
