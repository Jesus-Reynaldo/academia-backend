import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InscripcionService } from './inscripcion.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('InscripcionService', () => {
  let service: InscripcionService;

  const tx = {
    estudiante: { findUnique: vi.fn() },
    curso: { findUnique: vi.fn() },
    periodoAcademico: { findUnique: vi.fn() },
    inscripcion: { findUnique: vi.fn(), count: vi.fn(), create: vi.fn() },
  };

  const prisma = {
    $transaction: vi.fn((callback: (tx: typeof tx) => unknown) => callback(tx)),
    calificacion: { count: vi.fn() },
    inscripcion: { findUnique: vi.fn(), delete: vi.fn() },
  };

  const estudianteActivo = { id: 1, estado: 'ACTIVO' };
  const cursoActivo = { id: 1, estado: 'ACTIVO', capacidad: 30 };
  const periodoDisponible = { id: 1, estado: 'ACTIVO' };
  const dto = { estudianteId: 1, cursoId: 1, periodoAcademicoId: 1 };

  beforeEach(async () => {
    vi.clearAllMocks();
    prisma.$transaction.mockImplementation((callback: (tx: typeof tx) => unknown) =>
      callback(tx),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [InscripcionService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(InscripcionService);
  });

  it('creates an inscripcion when all validations pass', async () => {
    tx.estudiante.findUnique.mockResolvedValue(estudianteActivo);
    tx.curso.findUnique.mockResolvedValue(cursoActivo);
    tx.periodoAcademico.findUnique.mockResolvedValue(periodoDisponible);
    tx.inscripcion.findUnique.mockResolvedValue(null);
    tx.inscripcion.count.mockResolvedValue(0);
    tx.inscripcion.create.mockResolvedValue({ id: 1, ...dto });

    const result = await service.create(dto as never);

    expect(result).toEqual({ id: 1, ...dto });
  });

  it('throws NotFoundException when estudiante does not exist', async () => {
    tx.estudiante.findUnique.mockResolvedValue(null);

    await expect(service.create(dto as never)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws BadRequestException when estudiante is not active', async () => {
    tx.estudiante.findUnique.mockResolvedValue({ id: 1, estado: 'INACTIVO' });

    await expect(service.create(dto as never)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws NotFoundException when curso does not exist', async () => {
    tx.estudiante.findUnique.mockResolvedValue(estudianteActivo);
    tx.curso.findUnique.mockResolvedValue(null);

    await expect(service.create(dto as never)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws BadRequestException when curso is not active', async () => {
    tx.estudiante.findUnique.mockResolvedValue(estudianteActivo);
    tx.curso.findUnique.mockResolvedValue({ id: 1, estado: 'INACTIVO' });

    await expect(service.create(dto as never)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws NotFoundException when periodo does not exist', async () => {
    tx.estudiante.findUnique.mockResolvedValue(estudianteActivo);
    tx.curso.findUnique.mockResolvedValue(cursoActivo);
    tx.periodoAcademico.findUnique.mockResolvedValue(null);

    await expect(service.create(dto as never)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws BadRequestException when periodo is finalizado', async () => {
    tx.estudiante.findUnique.mockResolvedValue(estudianteActivo);
    tx.curso.findUnique.mockResolvedValue(cursoActivo);
    tx.periodoAcademico.findUnique.mockResolvedValue({ id: 1, estado: 'FINALIZADO' });

    await expect(service.create(dto as never)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws ConflictException when inscripcion is duplicated', async () => {
    tx.estudiante.findUnique.mockResolvedValue(estudianteActivo);
    tx.curso.findUnique.mockResolvedValue(cursoActivo);
    tx.periodoAcademico.findUnique.mockResolvedValue(periodoDisponible);
    tx.inscripcion.findUnique.mockResolvedValue({ id: 5, ...dto });

    await expect(service.create(dto as never)).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws ConflictException when curso has reached capacidad', async () => {
    tx.estudiante.findUnique.mockResolvedValue(estudianteActivo);
    tx.curso.findUnique.mockResolvedValue({ id: 1, estado: 'ACTIVO', capacidad: 1 });
    tx.periodoAcademico.findUnique.mockResolvedValue(periodoDisponible);
    tx.inscripcion.findUnique.mockResolvedValue(null);
    tx.inscripcion.count.mockResolvedValue(1);

    await expect(service.create(dto as never)).rejects.toBeInstanceOf(ConflictException);
  });

  describe('remove', () => {
    it('throws ConflictException when the inscripcion has calificaciones', async () => {
      prisma.inscripcion.findUnique.mockResolvedValue({ id: 1 });
      prisma.calificacion.count.mockResolvedValue(2);

      await expect(service.remove(1)).rejects.toBeInstanceOf(ConflictException);
    });

    it('deletes the inscripcion when it has no calificaciones', async () => {
      prisma.inscripcion.findUnique.mockResolvedValue({ id: 1 });
      prisma.calificacion.count.mockResolvedValue(0);

      await service.remove(1);

      expect(prisma.inscripcion.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });
});
