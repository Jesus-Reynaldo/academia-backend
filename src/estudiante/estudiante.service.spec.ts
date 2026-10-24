import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EstudianteService } from './estudiante.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('EstudianteService', () => {
  let service: EstudianteService;
  const prisma = {
    estudiante: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    inscripcion: {
      count: vi.fn(),
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [EstudianteService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(EstudianteService);
  });

  describe('create', () => {
    it('creates an estudiante', async () => {
      const dto = {
        codigo: 'EST-0001',
        nombres: 'Juan',
        apellidos: 'Pérez',
        documento: '12345678',
      };
      prisma.estudiante.create.mockResolvedValue({ id: 1, ...dto });

      const result = await service.create(dto as never);

      expect(result).toEqual({ id: 1, ...dto });
    });

    it('propagates a unique constraint violation on duplicate codigo/documento', async () => {
      const dto = {
        codigo: 'EST-0001',
        nombres: 'Juan',
        apellidos: 'Pérez',
        documento: '12345678',
      };
      const uniqueError = Object.assign(new Error('Unique constraint failed'), {
        code: 'P2002',
      });
      prisma.estudiante.create.mockRejectedValue(uniqueError);

      await expect(service.create(dto as never)).rejects.toThrow();
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when estudiante does not exist', async () => {
      prisma.estudiante.findUnique.mockResolvedValue(null);

      await expect(service.findOne(99)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deactivates the estudiante when dependent inscripciones exist', async () => {
      prisma.estudiante.findUnique.mockResolvedValue({ id: 1, estado: 'ACTIVO' });
      prisma.inscripcion.count.mockResolvedValue(1);
      prisma.estudiante.update.mockResolvedValue({ id: 1, estado: 'INACTIVO' });

      const result = await service.remove(1);

      expect(prisma.estudiante.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { estado: 'INACTIVO' },
      });
      expect(result).toEqual({ kind: 'deactivated', entity: { id: 1, estado: 'INACTIVO' } });
    });

    it('hard deletes the estudiante when no dependents exist', async () => {
      prisma.estudiante.findUnique.mockResolvedValue({ id: 1, estado: 'ACTIVO' });
      prisma.inscripcion.count.mockResolvedValue(0);
      prisma.estudiante.delete.mockResolvedValue({ id: 1 });

      const result = await service.remove(1);

      expect(prisma.estudiante.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual({ kind: 'deleted' });
    });
  });
});
