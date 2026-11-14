-- CreateTable
CREATE TABLE `bitacora` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `usuarioId` INTEGER NULL,
    `accion` ENUM('CREAR', 'MODIFICAR', 'DESACTIVAR', 'ELIMINAR') NOT NULL,
    `recurso` VARCHAR(40) NOT NULL,
    `recursoId` INTEGER NULL,
    `descripcion` VARCHAR(255) NOT NULL,

    INDEX `bitacora_fecha_idx`(`fecha`),
    INDEX `bitacora_recurso_fecha_idx`(`recurso`, `fecha`),
    INDEX `bitacora_usuarioId_fecha_idx`(`usuarioId`, `fecha`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `bitacora` ADD CONSTRAINT `bitacora_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

