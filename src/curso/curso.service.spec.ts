import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CursoService } from './curso.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('CursoService', () => {
  let service: CursoService;
  const prisma = {
    curso: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    inscripcion: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    materia: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [CursoService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(CursoService);
  });

  describe('create', () => {
    it('creates a curso', async () => {
      const dto = { nombre: '1ro Secundaria A', nivel: 'Secundaria' };
      prisma.curso.create.mockResolvedValue({ id: 1, ...dto });

      const result = await service.create(dto as never);

      expect(prisma.curso.create).toHaveBeenCalledWith({ data: dto });
      expect(result).toEqual({ id: 1, ...dto });
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when curso does not exist', async () => {
      prisma.curso.findUnique.mockResolvedValue(null);

      await expect(service.findOne(99)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deactivates the curso when dependent inscripciones exist', async () => {
      prisma.curso.findUnique.mockResolvedValue({ id: 1, estado: 'ACTIVO' });
      prisma.inscripcion.count.mockResolvedValue(2);
      prisma.curso.update.mockResolvedValue({ id: 1, estado: 'INACTIVO' });

      const result = await service.remove(1);

      expect(prisma.curso.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { estado: 'INACTIVO' },
      });
      expect(prisma.curso.delete).not.toHaveBeenCalled();
      expect(result).toEqual({ kind: 'deactivated', entity: { id: 1, estado: 'INACTIVO' } });
    });

    it('hard deletes the curso when no dependents exist', async () => {
      prisma.curso.findUnique.mockResolvedValue({ id: 1, estado: 'ACTIVO' });
      prisma.inscripcion.count.mockResolvedValue(0);
      prisma.curso.delete.mockResolvedValue({ id: 1 });

      const result = await service.remove(1);

      expect(prisma.curso.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(prisma.curso.update).not.toHaveBeenCalled();
      expect(result).toEqual({ kind: 'deleted' });
    });
  });
});
