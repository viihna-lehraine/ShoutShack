import {
    DataTypes,
    Model,
    Sequelize, 
 } from 'sequelize';
import initializeDatabase from '../index.js';

class AuditLog extends Model {}

// Initialize the AuditLog model
async function initializeAuditLogModel() {
    const sequelize = await initializeDatabase();

    AuditLog.init(
        {
            auditId: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
                allowNull: false,
                unique: true,
            },
            userId: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            actionType: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    isIn: [['create', 'update', 'delete', 'read', 'login', 'logout', 'other']],
                },
            },
            actionDescription: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            affectedResource: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            previousValue: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            newValue: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            ipAddress: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            userAgent: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            createdAt: {
                type: DataTypes.DATE,
                defaultValue: Sequelize.NOW,
            },
            updatedAt: {
                type: DataTypes.DATE,
                defaultValue: Sequelize.NOW,
            },
        },
        {
            sequelize,
            modelName: 'AuditLog',
            timestamps: true,
        }
    );

    await AuditLog.sync();
}

export default initializeAuditLogModel;
