import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { CalificacionService } from './calificacion.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('CalificacionService', () => {
  let service: CalificacionService;

  const prisma = {
    inscripcion: { findUnique: vi.fn() },
    materia: { findUnique: vi.fn() },
    docente: { findUnique: vi.fn() },
    calificacion: { create: vi.fn(), findUnique: vi.fn() },
  };

  const dto = {
    inscripcionId: 1,
    materiaId: 1,
    nota: 85,
    tipo: 'PARCIAL',
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [CalificacionService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(CalificacionService);
  });

  it('creates a calificacion when all validations pass', async () => {
    prisma.inscripcion.findUnique.mockResolvedValue({ id: 1, estado: 'ACTIVA' });
    prisma.materia.findUnique.mockResolvedValue({ id: 1, estado: 'ACTIVA' });
    prisma.calificacion.create.mockResolvedValue({ id: 1, ...dto });

    const result = await service.create(dto as never);

    expect(result).toEqual({ id: 1, ...dto });
  });

  it('throws BadRequestException when nota is out of range', async () => {
    await expect(
      service.create({ ...dto, nota: 150 } as never),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.inscripcion.findUnique).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when inscripcion does not exist', async () => {
    prisma.inscripcion.findUnique.mockResolvedValue(null);

    await expect(service.create(dto as never)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws NotFoundException when materia does not exist', async () => {
    prisma.inscripcion.findUnique.mockResolvedValue({ id: 1, estado: 'ACTIVA' });
    prisma.materia.findUnique.mockResolvedValue(null);

    await expect(service.create(dto as never)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws BadRequestException when docente is not active', async () => {
    prisma.inscripcion.findUnique.mockResolvedValue({ id: 1, estado: 'ACTIVA' });
    prisma.materia.findUnique.mockResolvedValue({ id: 1, estado: 'ACTIVA' });
    prisma.docente.findUnique.mockResolvedValue({ id: 1, estado: 'INACTIVO' });

    await expect(
      service.create({ ...dto, docenteId: 1 } as never),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  describe('remove', () => {
    it('always rejects physical deletion with ConflictException', async () => {
      prisma.calificacion.findUnique.mockResolvedValue({ id: 1 });

      await expect(service.remove(1)).rejects.toBeInstanceOf(ConflictException);
    });
  });
});
