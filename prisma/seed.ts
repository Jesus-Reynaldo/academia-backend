import { PrismaClient, TipoEvaluacion } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import 'dotenv/config';
import { hashPassword } from '../src/auth/password.util.js';

const prisma = new PrismaClient({
  adapter: new PrismaMariaDb(process.env.DATABASE_URL!),
});

async function main() {
  // Reset in dependency order so the seed is safely re-runnable.
  await prisma.usuario.deleteMany();
  await prisma.calificacion.deleteMany();
  await prisma.inscripcion.deleteMany();
  await prisma.estudiante.deleteMany();
  await prisma.docente.deleteMany();
  await prisma.materia.deleteMany();
  await prisma.curso.deleteMany();
  await prisma.periodoAcademico.deleteMany();

  const periodo = await prisma.periodoAcademico.create({
    data: {
      nombre: 'Gestión 2026',
      fechaInicio: new Date('2026-02-01'),
      fechaFin: new Date('2026-11-30'),
      estado: 'ACTIVO',
    },
  });

  const cursos = await Promise.all(
    [
      { nombre: '1ro Secundaria A', nivel: 'Secundaria', paralelo: 'A', capacidad: 30 },
      { nombre: '1ro Secundaria B', nivel: 'Secundaria', paralelo: 'B', capacidad: 30 },
      { nombre: '2do Secundaria A', nivel: 'Secundaria', paralelo: 'A', capacidad: 30 },
    ].map((data) => prisma.curso.create({ data })),
  );

  const materias = await Promise.all(
    [
      { codigo: 'MAT-001', nombre: 'Matemática', horasSemanales: 6 },
      { codigo: 'MAT-002', nombre: 'Lenguaje', horasSemanales: 5 },
      { codigo: 'MAT-003', nombre: 'Historia', horasSemanales: 3 },
      { codigo: 'MAT-004', nombre: 'Inglés', horasSemanales: 4 },
      { codigo: 'MAT-005', nombre: 'Programación', horasSemanales: 4 },
    ].map((data) => prisma.materia.create({ data })),
  );

  const docentes = await Promise.all(
    [
      { codigo: 'DOC-001', nombres: 'Ana', apellidos: 'García', email: 'ana.garcia@colegio.edu' },
      { codigo: 'DOC-002', nombres: 'Luis', apellidos: 'Mamani', email: 'luis.mamani@colegio.edu' },
      { codigo: 'DOC-003', nombres: 'Carla', apellidos: 'Rojas', email: 'carla.rojas@colegio.edu' },
    ].map((data) => prisma.docente.create({ data })),
  );

  const nombresEstudiantes: [string, string][] = [
    ['Juan', 'Pérez'],
    ['María', 'Fernández'],
    ['Pedro', 'Quispe'],
    ['Lucía', 'Condori'],
    ['Diego', 'Flores'],
    ['Valentina', 'Choque'],
    ['Sebastián', 'Vargas'],
    ['Camila', 'Mamani'],
    ['Mateo', 'Aguilar'],
    ['Sofía', 'Torrez'],
  ];

  const estudiantes = await Promise.all(
    nombresEstudiantes.map(([nombres, apellidos], index) =>
      prisma.estudiante.create({
        data: {
          codigo: `EST-${String(index + 1).padStart(4, '0')}`,
          nombres,
          apellidos,
          documento: `${10000000 + index}`,
          email: `${nombres.toLowerCase()}.${apellidos.toLowerCase()}@colegio.edu`,
          estado: 'ACTIVO',
        },
      }),
    ),
  );

  const inscripciones = await Promise.all(
    estudiantes.map((estudiante, index) =>
      prisma.inscripcion.create({
        data: {
          estudianteId: estudiante.id,
          cursoId: cursos[index % cursos.length]!.id,
          periodoAcademicoId: periodo.id,
        },
      }),
    ),
  );

  const tiposCalificacion: TipoEvaluacion[] = ['PARCIAL', 'FINAL'];
  const materiasPorInscripcion = materias.slice(0, 2);

  for (const inscripcion of inscripciones) {
    for (const materia of materiasPorInscripcion) {
      for (const tipo of tiposCalificacion) {
        await prisma.calificacion.create({
          data: {
            inscripcionId: inscripcion.id,
            materiaId: materia.id,
            docenteId: docentes[materia.id % docentes.length]!.id,
            nota: 70 + Math.round(Math.random() * 30),
            tipo,
          },
        });
      }
    }
  }

  // Development accounts: one per role, all sharing the seed password.
  const seedPassword = process.env.SEED_ADMIN_PASSWORD || 'Cambiar-123456';
  const passwordHash = await hashPassword(seedPassword);
  const adminEmail = (process.env.SEED_ADMIN_EMAIL || 'admin@colegio.edu').toLowerCase();
  await prisma.usuario.createMany({
    data: [
      { email: adminEmail, passwordHash, rol: 'ADMIN' },
      { email: docentes[0]!.email!, passwordHash, rol: 'DOCENTE', docenteId: docentes[0]!.id },
      {
        email: estudiantes[0]!.email!,
        passwordHash,
        rol: 'ESTUDIANTE',
        estudianteId: estudiantes[0]!.id,
      },
    ],
  });
  if (!process.env.SEED_ADMIN_PASSWORD) {
    console.warn('SEED_ADMIN_PASSWORD no definido: se usó la contraseña de desarrollo por defecto.');
  }

  console.log('Seed completado:', {
    usuarios: [adminEmail, docentes[0]!.email, estudiantes[0]!.email],
    periodo: 1,
    cursos: cursos.length,
    materias: materias.length,
    docentes: docentes.length,
    estudiantes: estudiantes.length,
    inscripciones: inscripciones.length,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
