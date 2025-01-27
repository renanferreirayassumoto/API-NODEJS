module.exports = {
    async up(queryInterface, Sequelize) {
        return queryInterface.addColumn('users', 'status', {
            type: Sequelize.ENUM('ACTIVE', 'ARCHIVED'),
            allowNull: false,
            defaultValue: 'ACTIVE',
        });
    },

    async down(queryInterface) {
        return queryInterface.sequelize.transaction(async (transaction) => {
            await queryInterface.removeColumn('users', 'status', {
                transaction,
            });
            await queryInterface.sequelize.query(
                'DROP TYPE enum_users_status',
                {
                    transaction,
                }
            );
        });
    },
};
