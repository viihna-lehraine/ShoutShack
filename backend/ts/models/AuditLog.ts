import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import initializeDatabase from '../config/db.js';

interface AuditLogAttributes {
    auditId: string;
    userId: string;
    actionType: string;
    actionDescription?: string | null;
    affectedResource?: string | null;
    previousValue?: string | null;
    newValue?: string | null;
    ipAddress: string;
    userAgent: string;
    createdAt: Date;
    updatedAt: Date;
}

class AuditLog extends Model<InferAttributes<AuditLog>, InferCreationAttributes<AuditLog>> implements AuditLogAttributes {
    auditId!: string;
    userId!: string;
    actionType!: string;
    actionDescription!: string | null;
    affectedResource!: string | null;
    previousValue!: string | null;
    newValue!: string | null;
    ipAddress!: string;
    userAgent!: string;
    createdAt!: CreationOptional<Date>;
    updatedAt!: CreationOptional<Date>;
}

// Initialize the AuditLog model
async function initializeAuditLogModel(): Promise<typeof AuditLog> {
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
                    isIn: [
                        ['create', 'update', 'delete', 'read', 'login', 'logout', 'other'],
                    ],
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
                defaultValue: DataTypes.NOW,
                allowNull: false,
            },
            updatedAt: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
                allowNull: false,
            },
        },
        {
            sequelize,
            modelName: 'AuditLog',
            timestamps: true,
        }
    );

    await AuditLog.sync();
    return AuditLog;
}

const AuditLogModelPromise = initializeAuditLogModel();
export default AuditLogModelPromise;
