import { Test, TestingModule } from '@nestjs/testing';
import { VersionService, ApiVersionInfo } from './version.service';

describe('VersionService', () => {
  let service: VersionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VersionService],
    }).compile();

    service = module.get<VersionService>(VersionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getVersionInfo', () => {
    it('should return version info for existing version', () => {
      const versionInfo = service.getVersionInfo('1');
      expect(versionInfo).toBeDefined();
      expect(versionInfo?.version).toBe('1.0');
      expect(versionInfo?.status).toBe('active');
    });

    it('should return undefined for non-existing version', () => {
      const versionInfo = service.getVersionInfo('999');
      expect(versionInfo).toBeUndefined();
    });
  });

  describe('getAllVersions', () => {
    it('should return all versions', () => {
      const versions = service.getAllVersions();
      expect(versions).toBeInstanceOf(Array);
      expect(versions.length).toBeGreaterThan(0);
      expect(versions.some(v => v.version === '1.0')).toBe(true);
      expect(versions.some(v => v.version === '2.0')).toBe(true);
    });
  });

  describe('getActiveVersions', () => {
    it('should return only active versions', () => {
      const activeVersions = service.getActiveVersions();
      expect(activeVersions).toBeInstanceOf(Array);
      expect(activeVersions.every(v => v.status === 'active')).toBe(true);
    });
  });

  describe('getDeprecatedVersions', () => {
    it('should return only deprecated versions', () => {
      const deprecatedVersions = service.getDeprecatedVersions();
      expect(deprecatedVersions).toBeInstanceOf(Array);
      expect(deprecatedVersions.every(v => v.status === 'deprecated')).toBe(true);
    });
  });

  describe('getExperimentalVersions', () => {
    it('should return only experimental versions', () => {
      const experimentalVersions = service.getExperimentalVersions();
      expect(experimentalVersions).toBeInstanceOf(Array);
      expect(experimentalVersions.every(v => v.status === 'experimental')).toBe(true);
    });
  });

  describe('isVersionSupported', () => {
    it('should return true for supported versions', () => {
      expect(service.isVersionSupported('1')).toBe(true);
      expect(service.isVersionSupported('2')).toBe(true);
    });

    it('should return false for unsupported versions', () => {
      expect(service.isVersionSupported('999')).toBe(false);
    });
  });

  describe('isVersionDeprecated', () => {
    it('should return correct deprecation status', () => {
      expect(service.isVersionDeprecated('1')).toBe(false);
      expect(service.isVersionDeprecated('2')).toBe(false);
    });
  });

  describe('isVersionExperimental', () => {
    it('should return correct experimental status', () => {
      expect(service.isVersionExperimental('1')).toBe(false);
      expect(service.isVersionExperimental('2')).toBe(false);
      expect(service.isVersionExperimental('3')).toBe(true);
    });
  });

  describe('getLatestVersion', () => {
    it('should return the latest active version', () => {
      const latest = service.getLatestVersion();
      expect(latest).toBeDefined();
      expect(latest?.version).toBe('2.0');
      expect(latest?.status).toBe('active');
    });
  });

  describe('getDefaultVersion', () => {
    it('should return the default version', () => {
      const defaultVersion = service.getDefaultVersion();
      expect(defaultVersion).toBe('1');
    });
  });

  describe('getVersionStats', () => {
    it('should return correct version statistics', () => {
      const stats = service.getVersionStats();
      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('active');
      expect(stats).toHaveProperty('deprecated');
      expect(stats).toHaveProperty('experimental');
      expect(stats).toHaveProperty('latest');
      expect(stats).toHaveProperty('default');
      expect(stats.total).toBeGreaterThan(0);
      expect(stats.active).toBeGreaterThan(0);
      expect(stats.latest).toBe('2.0');
      expect(stats.default).toBe('1');
    });
  });

  describe('addVersion', () => {
    it('should add a new version', () => {
      const newVersion: ApiVersionInfo = {
        version: '4',
        status: 'experimental',
        releaseDate: '2024-01-01',
        features: ['New feature'],
        breakingChanges: [],
      };

      service.addVersion(newVersion);
      const addedVersion = service.getVersionInfo('4');
      expect(addedVersion).toBeDefined();
      expect(addedVersion?.version).toBe('4');
      expect(addedVersion?.status).toBe('experimental');
    });
  });

  describe('deprecateVersion', () => {
    it('should deprecate an existing version', () => {
      // Primeiro adiciona uma versão para depreciar
      const testVersion: ApiVersionInfo = {
        version: '5',
        status: 'active',
        releaseDate: '2024-01-01',
        features: ['Test feature'],
        breakingChanges: [],
      };
      service.addVersion(testVersion);

      // Agora deprecia a versão
      const deprecationDate = '2024-12-31';
      service.deprecateVersion('5', deprecationDate);

      const deprecatedVersion = service.getVersionInfo('5');
      expect(deprecatedVersion?.status).toBe('deprecated');
      expect(deprecatedVersion?.deprecatedSince).toBe(deprecationDate);
    });

    it('should not deprecate non-existing version', () => {
      expect(() => service.deprecateVersion('999', '2024-12-31')).not.toThrow();
    });
  });
});