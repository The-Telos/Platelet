/* Amplify Params - DO NOT EDIT
	API_PLATELET_GRAPHQLAPIENDPOINTOUTPUT
	API_PLATELET_GRAPHQLAPIIDOUTPUT
	AUTH_PLATELET61A0AC07_USERPOOLID
	ENV
	REGION
Amplify Params - DO NOT EDIT */

const { updateUser } = require("./updateUserRoles");
const { getUser } = require("./getUser");
require("isomorphic-fetch");
const AWS = require("aws-sdk/global");
const AUTH_TYPE = require("aws-appsync").AUTH_TYPE;
const AWSAppSyncClient = require("aws-appsync").default;
const aws = require("aws-sdk");

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */

const config = {
    url: process.env.API_PLATELET_GRAPHQLAPIENDPOINTOUTPUT,
    region: process.env.REGION,
    auth: {
        type: AUTH_TYPE.AWS_IAM,
        credentials: AWS.config.credentials,
    },
    disableOffline: true,
};
const userPoolId = process.env.AUTH_PLATELET61A0AC07_USERPOOLID;

const appSyncClient = new AWSAppSyncClient(config);

async function appSyncAmendRoles(userId, roles) {
    // get version and pass it in too
    const currentUser = await appSyncClient.query({
        query: getUser,
        variables: {
            id: userId,
        },
    });
    console.log("Updating user:", currentUser.data.getUser);
    const updateUserInput = {
        id: userId,
        _version: currentUser.data.getUser._version,
        roles: [],
    };
    const resultCleared = await appSyncClient.mutate({
        mutation: updateUser,
        variables: { input: updateUserInput },
    });
    console.log("Cleared roles:", resultCleared.data.updateUser);
    const updateUserInputActual = {
        id: userId,
        _version: resultCleared.data.updateUser._version,
        roles,
    };

    const result = await appSyncClient.mutate({
        mutation: updateUser,
        variables: { input: updateUserInputActual },
    });
    console.log("Updated user:", result.data.updateUser);
    return result.data.updateUser;
}

async function cognitoAmendRoles(username, roles) {
    console.log("Amending roles for:", username, roles);
    const notRoles = ["USER", "ADMIN", "COORDINATOR", "RIDER"].filter(
        (role) => !roles.includes(role)
    );
    const CognitoIdentityServiceProvider = aws.CognitoIdentityServiceProvider;
    const cognitoClient = new CognitoIdentityServiceProvider({
        apiVersion: "2016-04-19",
    });
    for (const role of roles) {
        await cognitoClient
            .adminAddUserToGroup({
                GroupName: role,
                UserPoolId: userPoolId,
                Username: username,
            })
            .promise();
    }
    for (const notRole of notRoles) {
        await cognitoClient
            .adminRemoveUserFromGroup({
                GroupName: notRole,
                UserPoolId: userPoolId,
                Username: username,
            })
            .promise();
    }
}

async function getCurrentUserRoles(userId) {
    const currentUser = await appSyncClient.query({
        query: getUser,
        variables: {
            id: userId,
        },
    });
    return currentUser.data.getUser;
}

async function cleanUp(data) {
    await appSyncAmendRoles(data.id, data.roles);
    await cognitoAmendRoles(data.username, data.roles);
}

exports.handler = async (event) => {
    // this is so admin can't give themselves super role
    const roles = event.arguments.roles.filter((role) =>
        ["USER", "COORDINATOR", "RIDER", "ADMIN"].includes(role)
    );
    const userId = event.arguments.userId;
    const currentUserData = await getCurrentUserRoles(userId);
    try {
        const user = await appSyncAmendRoles(userId, roles);
        await cognitoAmendRoles(user.username, roles);
        return user;
    } catch (e) {
        await cleanUp(currentUserData);
        throw e;
    }
};
