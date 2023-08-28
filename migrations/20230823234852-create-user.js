'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id:{
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
      },
      name:{
          type: Sequelize.STRING(50),
          allowNull: false
      },
      email:{
          type: Sequelize.STRING(70),
          allowNull: false,
          unique: true
      },
      username:{
          type: Sequelize.STRING(30),
          allowNull: false,
          unique: true
      },
      password:{
          type: Sequelize.STRING(256),
          allowNull: false
      },
      createdAt:{
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: new Date()
      },
      updatedAt:{
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: new Date()
      }
  });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('users');
  }
};