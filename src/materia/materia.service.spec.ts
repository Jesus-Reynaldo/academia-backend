import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { MateriaService } from './materia.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('MateriaService', () => {
  let service: MateriaService;
  const prisma = {
    materia: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    calificacion: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [MateriaService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(MateriaService);
  });

  describe('create', () => {
    it('creates a materia', async () => {
      const dto = { codigo: 'MAT-001', nombre: 'Matemática' };
      prisma.materia.create.mockResolvedValue({ id: 1, ...dto });

      const result = await service.create(dto as never);

      expect(prisma.materia.create).toHaveBeenCalledWith({ data: dto });
      expect(result).toEqual({ id: 1, ...dto });
    });

    it('propagates a unique constraint violation on duplicate codigo', async () => {
      const dto = { codigo: 'MAT-001', nombre: 'Matemática' };
      const uniqueError = Object.assign(new Error('Unique constraint failed'), {
        code: 'P2002',
      });
      prisma.materia.create.mockRejectedValue(uniqueError);

      await expect(service.create(dto as never)).rejects.toThrow();
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when materia does not exist', async () => {
      prisma.materia.findUnique.mockResolvedValue(null);

      await expect(service.findOne(99)).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
