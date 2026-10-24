import { Test, TestingModule } from '@nestjs/testing';
import { DocenteService } from './docente.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('DocenteService', () => {
  let service: DocenteService;
  const prisma = {
    docente: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [DocenteService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(DocenteService);
  });

  it('creates a docente', async () => {
    const dto = { codigo: 'DOC-001', nombres: 'Ana', apellidos: 'García' };
    prisma.docente.create.mockResolvedValue({ id: 1, ...dto });

    const result = await service.create(dto as never);

    expect(result).toEqual({ id: 1, ...dto });
  });
});
