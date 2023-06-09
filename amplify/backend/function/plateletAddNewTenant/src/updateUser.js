const gql = require("graphql-tag");

exports.updateUser = gql`
    mutation UpdateUser(
        $input: UpdateUserInput!
        $condition: ModelUserConditionInput
    ) {
        updateUser(input: $input, condition: $condition) {
            id
            cognitoId
            tenantId
            _version
        }
    }
`;
