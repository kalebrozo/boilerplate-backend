import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { VersionController } from './version.controller';
import { VersionService, ApiVersionInfo, MigrationGuide } from '../services/version.service';

describe('VersionController', () => {
  let controller: VersionController;
  let service: VersionService;

  const mockVersionService = {
    getAllVersions: jest.fn(),
    getActiveVersions: jest.fn(),
    getDeprecatedVersions: jest.fn(),
    getExperimentalVersions: jest.fn(),
    getVersionInfo: jest.fn(),
    getLatestVersion: jest.fn(),
    getDefaultVersion: jest.fn(),
    getVersionStats: jest.fn(),
    isVersionSupported: jest.fn(),
    isVersionDeprecated: jest.fn(),
    isVersionExperimental: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VersionController],
      providers: [
        {
          provide: VersionService,
          useValue: mockVersionService,
        },
      ],
    }).compile();

    controller = module.get<VersionController>(VersionController);
    service = module.get<VersionService>(VersionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAllVersions', () => {
    it('should return all versions with stats', () => {
      const mockVersions = [
        { version: '1', status: 'active' },
        { version: '2', status: 'active' },
      ];
      const mockStats = {
        total: 2,
        active: 2,
        deprecated: 0,
        experimental: 0,
        latest: '2',
        default: '1',
      };

      mockVersionService.getAllVersions.mockReturnValue(mockVersions);
      mockVersionService.getVersionStats.mockReturnValue(mockStats);

      const result = controller.getAllVersions();

      expect(result).toEqual({
        versions: mockVersions,
        stats: mockStats,
      });
      expect(service.getAllVersions).toHaveBeenCalled();
      expect(service.getVersionStats).toHaveBeenCalled();
    });
  });

  describe('getActiveVersions', () => {
    it('should return active versions with count', () => {
      const mockActiveVersions = [
        { version: '1', status: 'active' },
        { version: '2', status: 'active' },
      ];

      mockVersionService.getActiveVersions.mockReturnValue(mockActiveVersions);

      const result = controller.getActiveVersions();

      expect(result).toEqual({
        versions: mockActiveVersions,
        count: 2,
      });
      expect(service.getActiveVersions).toHaveBeenCalledTimes(2);
    });
  });

  describe('getDeprecatedVersions', () => {
    it('should return deprecated versions with count', () => {
      const mockDeprecatedVersions = [
        { version: '0.1', status: 'deprecated' },
      ];

      mockVersionService.getDeprecatedVersions.mockReturnValue(mockDeprecatedVersions);

      const result = controller.getDeprecatedVersions();

      expect(result).toEqual({
        versions: mockDeprecatedVersions,
        count: 1,
      });
      expect(service.getDeprecatedVersions).toHaveBeenCalledTimes(2);
    });
  });

  describe('getExperimentalVersions', () => {
    it('should return experimental versions with count', () => {
      const mockExperimentalVersions = [
        { version: '3', status: 'experimental' },
      ];

      mockVersionService.getExperimentalVersions.mockReturnValue(mockExperimentalVersions);

      const result = controller.getExperimentalVersions();

      expect(result).toEqual({
        versions: mockExperimentalVersions,
        count: 1,
      });
      expect(service.getExperimentalVersions).toHaveBeenCalledTimes(2);
    });
  });

  describe('getLatestVersion', () => {
    it('should return the latest version', () => {
      const mockLatestVersion = { version: '2', status: 'active' };
      mockVersionService.getLatestVersion.mockReturnValue(mockLatestVersion);

      const result = controller.getLatestVersion();

      expect(result).toEqual(mockLatestVersion);
      expect(service.getLatestVersion).toHaveBeenCalled();
    });

    it('should throw NotFoundException when no active versions found', () => {
      mockVersionService.getLatestVersion.mockReturnValue(null);

      expect(() => controller.getLatestVersion()).toThrow(NotFoundException);
      expect(service.getLatestVersion).toHaveBeenCalled();
    });
  });

  describe('getDefaultVersion', () => {
    it('should return default version with info', () => {
      const mockDefaultVersion = '1';
      const mockVersionInfo = { version: '1', status: 'active' };

      mockVersionService.getDefaultVersion.mockReturnValue(mockDefaultVersion);
      mockVersionService.getVersionInfo.mockReturnValue(mockVersionInfo);

      const result = controller.getDefaultVersion();

      expect(result).toEqual({
        version: mockDefaultVersion,
        info: mockVersionInfo,
      });
      expect(service.getDefaultVersion).toHaveBeenCalled();
      expect(service.getVersionInfo).toHaveBeenCalledWith(mockDefaultVersion);
    });
  });

  describe('getVersionStats', () => {
    it('should return version statistics', () => {
      const mockStats = {
        total: 3,
        active: 2,
        deprecated: 0,
        experimental: 1,
        latest: '2',
        default: '1',
      };

      mockVersionService.getVersionStats.mockReturnValue(mockStats);

      const result = controller.getVersionStats();

      expect(result).toEqual(mockStats);
      expect(service.getVersionStats).toHaveBeenCalled();
    });
  });

  describe('getVersionInfo', () => {
    it('should return version info for existing version', () => {
      const mockVersionInfo: ApiVersionInfo = {
        version: '1',
        status: 'active',
        releaseDate: '2024-01-01',
        features: ['Feature 1'],
        breakingChanges: [],
      };

      mockVersionService.getVersionInfo.mockReturnValue(mockVersionInfo);

      const result = controller.getVersionInfo('1');

      expect(result).toEqual(mockVersionInfo);
      expect(service.getVersionInfo).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException for non-existing version', () => {
      mockVersionService.getVersionInfo.mockReturnValue(null);

      expect(() => controller.getVersionInfo('999')).toThrow(NotFoundException);
      expect(service.getVersionInfo).toHaveBeenCalledWith('999');
    });
  });

  describe('checkVersionSupport', () => {
    it('should return version support status', () => {
      mockVersionService.isVersionSupported.mockReturnValue(true);
      mockVersionService.isVersionDeprecated.mockReturnValue(false);
      mockVersionService.isVersionExperimental.mockReturnValue(false);

      const result = controller.checkVersionSupport('1');

      expect(result).toEqual({
        version: '1',
        supported: true,
        deprecated: false,
        experimental: false,
      });
      expect(service.isVersionSupported).toHaveBeenCalledWith('1');
      expect(service.isVersionDeprecated).toHaveBeenCalledWith('1');
      expect(service.isVersionExperimental).toHaveBeenCalledWith('1');
    });
  });

  describe('getMigrationGuide', () => {
    it('should return migration guide for version with guide', () => {
      const mockVersionInfo: ApiVersionInfo = {
        version: '2',
        status: 'active',
        releaseDate: '2024-01-01',
        features: ['New feature'],
        breakingChanges: ['Breaking change'],
        migrationGuide: {
          steps: ['Step 1', 'Step 2'],
          estimatedTime: '30 minutes',
          complexity: 'medium',
        },
      };

      mockVersionService.getVersionInfo.mockReturnValue(mockVersionInfo);

      const result = controller.getMigrationGuide('2');

      expect(result).toEqual({
        version: '2',
        migrationGuide: mockVersionInfo.migrationGuide,
        breakingChanges: mockVersionInfo.breakingChanges,
        features: mockVersionInfo.features,
      });
      expect(service.getVersionInfo).toHaveBeenCalledWith('2');
    });

    it('should throw NotFoundException for non-existing version', () => {
      mockVersionService.getVersionInfo.mockReturnValue(null);

      expect(() => controller.getMigrationGuide('999')).toThrow(NotFoundException);
      expect(service.getVersionInfo).toHaveBeenCalledWith('999');
    });

    it('should throw NotFoundException for version without migration guide', () => {
      const mockVersionInfo: ApiVersionInfo = {
        version: '1',
        status: 'active',
        releaseDate: '2024-01-01',
        features: ['Feature'],
        breakingChanges: [],
      };

      mockVersionService.getVersionInfo.mockReturnValue(mockVersionInfo);

      expect(() => controller.getMigrationGuide('1')).toThrow(NotFoundException);
      expect(service.getVersionInfo).toHaveBeenCalledWith('1');
    });
  });
});