import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

describe('Docker Configuration', () => {
  it('should have Dockerfile in api directory', () => {
    const dockerfilePath = join(__dirname, '../../Dockerfile');
    expect(existsSync(dockerfilePath)).toBe(true);
  });

  it('should have .dockerignore file in root', () => {
    const dockerignorePath = join(__dirname, '../../../../.dockerignore');
    expect(existsSync(dockerignorePath)).toBe(true);
  });

  it('should have docker-compose.yml in root', () => {
    const composePath = join(__dirname, '../../../../docker-compose.yml');
    expect(existsSync(composePath)).toBe(true);
  });

  it('Dockerfile should use multi-stage build', () => {
    const dockerfilePath = join(__dirname, '../../Dockerfile');
    if (existsSync(dockerfilePath)) {
      const content = readFileSync(dockerfilePath, 'utf-8');
      expect(content).toMatch(/FROM.*AS.*/);
      expect(content).toMatch(/COPY.*--from=.*/);
    }
  });

  it('Dockerfile should use non-root user', () => {
    const dockerfilePath = join(__dirname, '../../Dockerfile');
    if (existsSync(dockerfilePath)) {
      const content = readFileSync(dockerfilePath, 'utf-8');
      expect(content).toMatch(/USER\s+(?!root)/);
    }
  });

  it('docker-compose should define postgres service', () => {
    const composePath = join(__dirname, '../../../../docker-compose.yml');
    if (existsSync(composePath)) {
      const content = readFileSync(composePath, 'utf-8');
      expect(content).toMatch(/postgres:/);
    }
  });

  it('docker-compose should define redis service', () => {
    const composePath = join(__dirname, '../../../../docker-compose.yml');
    if (existsSync(composePath)) {
      const content = readFileSync(composePath, 'utf-8');
      expect(content).toMatch(/redis:/);
    }
  });

  it('docker-compose should define meilisearch service', () => {
    const composePath = join(__dirname, '../../../../docker-compose.yml');
    if (existsSync(composePath)) {
      const content = readFileSync(composePath, 'utf-8');
      expect(content).toMatch(/meilisearch:/);
    }
  });
});
