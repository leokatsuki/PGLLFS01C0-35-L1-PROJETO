import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../db';

interface IUser{
    id: number;
    name: string;
    email: string;
    username: string;
    password: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export type UserCreationAttributes = Optional<IUser, 'id'>;

export class User extends Model<IUser, UserCreationAttributes> {
    declare id: number | null;
    declare name: string | null;
    declare email: string | null;
    declare username: string | null;
    declare password: string | null;
    declare createdAt: Date | null;
    declare updatedAt: Date | null;
}

User.init({
    id:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name:{
        type: DataTypes.STRING(50),
        allowNull: false
    },
    email:{
        type: DataTypes.STRING(70),
        allowNull: false,
        unique: true
    },
    username:{
        type: DataTypes.STRING(30),
        allowNull: false,
        unique: true
    },
    password:{
        type: DataTypes.STRING(256),
        allowNull: false
    },
    createdAt:{
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: new Date()
    },
    updatedAt:{
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: new Date()
    }
}, {
    sequelize,
    tableName: 'users',
    modelName: 'user'
})