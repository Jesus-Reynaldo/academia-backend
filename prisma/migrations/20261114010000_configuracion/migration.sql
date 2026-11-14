-- CreateTable
CREATE TABLE `configuracion` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `nombreInstitucion` VARCHAR(150) NOT NULL,
    `sigla` VARCHAR(20) NULL,
    `logo` MEDIUMBLOB NULL,
    `logoTipo` VARCHAR(40) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;


-- Fila única con el nombre por defecto (se cambia desde Configuración).
INSERT INTO `configuracion` (`id`, `nombreInstitucion`, `updatedAt`) VALUES (1, 'Sistema Académico', CURRENT_TIMESTAMP(3));
