import React, { useEffect, useRef, useState } from "react";
import { decodeUUID } from "../../utilities";
import _ from "lodash";

import { useDispatch, useSelector } from "react-redux";
import UserProfile from "./components/UserProfile";
import { PaddedPaper } from "../../styles/common";
import DetailSkeleton from "./components/DetailSkeleton";
import ProfilePicture from "./components/ProfilePicture";
import NotFound from "../../ErrorComponents/NotFound";
import { dataStoreReadyStatusSelector, getWhoami } from "../../redux/Selectors";
import { DataStore } from "aws-amplify";
import * as models from "../../models/index";
import { displayErrorNotification } from "../../redux/notifications/NotificationsActions";
import { protectedFields } from "../../apiConsts";
import { Chip, Stack, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/styles";

const initialUserState = {
    id: "",
    username: "",
    contact: {
        emailAddress: "",
    },
    displayName: "",
    name: "",
    responsibility: null,
    dateOfBirth: null,
    patch: null,
    profilePictureURL: null,
    profilePictureThumbnailURL: null,
    active: 1,
};

export default function UserDetail(props) {
    const userUUID = decodeUUID(props.match.params.user_uuid_b62);
    const dataStoreReadyStatus = useSelector(dataStoreReadyStatusSelector);
    const [isFetching, setIsFetching] = useState(false);
    const [isPosting, setIsPosting] = useState(false);
    const [user, setUser] = useState(initialUserState);
    const [notFound, setNotFound] = useState(false);
    const [usersDisplayNames, setUsersDisplayNames] = useState([]);
    const dispatch = useDispatch();
    const theme = useTheme();
    const isSm = useMediaQuery(theme.breakpoints.down("md"));

    async function newUserProfile() {
        setNotFound(false);
        if (!dataStoreReadyStatus) {
            setIsFetching(true);
        } else {
            try {
                const userResult = await DataStore.query(models.User, userUUID);
                setIsFetching(false);
                if (userResult) setUser(userResult);
                else setNotFound(true);
            } catch (error) {
                setIsFetching(false);
                dispatch(
                    displayErrorNotification(
                        `Failed to get user: ${error.message}`
                    )
                );
                console.log("Request failed", error);
            }
        }
    }
    useEffect(
        () => newUserProfile(),
        [props.location.key, dataStoreReadyStatus]
    );

    console.log("asdfsadf", user.profilePicture);

    async function getDisplayNames() {
        try {
            const users = await DataStore.query(models.User);
            const displayNames = users.map((u) => ({
                displayName: u.displayName,
                id: u.id,
            }));
            setUsersDisplayNames(displayNames);
        } catch (error) {
            dispatch(
                displayErrorNotification(
                    `Failed to get users lists: ${error.message}`
                )
            );
        }
    }
    useEffect(() => getDisplayNames(), []);

    async function onUpdate(value) {
        setIsPosting(true);
        try {
            const existingUser = await DataStore.query(models.User, user.id);
            const {
                userRiderResponsibilityId,
                riderResponsibility,
                contact,
                ...rest
            } = value;
            await DataStore.save(
                models.User.copyOf(existingUser, (updated) => {
                    for (const [key, newValue] of Object.entries(rest)) {
                        if (!protectedFields.includes(key))
                            updated[key] = newValue;
                    }
                })
            );
            if (existingUser.contact && contact) {
                await DataStore.save(
                    models.User.copyOf(existingUser, (updated) => {
                        for (const [key, newValue] of Object.entries(contact)) {
                            if (!protectedFields.includes(key))
                                updated.contact[key] = newValue;
                        }
                    })
                );
            }
            if (userRiderResponsibilityId) {
                const existingUserResponsibility = await DataStore.query(
                    models.User,
                    user.id
                );
                const riderResponsibility = await DataStore.query(
                    models.RiderResponsibility,
                    userRiderResponsibilityId
                );
                await DataStore.save(
                    models.User.copyOf(
                        existingUserResponsibility,
                        (updated) => {
                            updated.riderResponsibility = riderResponsibility;
                        }
                    )
                );
            } else if (userRiderResponsibilityId === null) {
                const existingUserResponsibility = await DataStore.query(
                    models.User,
                    user.id
                );
                await DataStore.save(
                    models.User.copyOf(
                        existingUserResponsibility,
                        (updated) => {
                            updated.riderResponsibility = null;
                        }
                    )
                );
            }
            setIsPosting(false);
        } catch (error) {
            console.error("Update request failed", error);
            dispatch(displayErrorNotification("Sorry, an error occurred"));
            setIsPosting(false);
        }
    }
    if (isFetching) {
        return <DetailSkeleton />;
    } else if (notFound) {
        return <NotFound>User {userUUID} could not be found.</NotFound>;
    } else {
        return (
            <Stack
                alignItems={isSm ? "center" : "flex-start"}
                direction={isSm ? "column" : "row"}
                spacing={1}
            >
                <PaddedPaper maxWidth={700}>
                    <UserProfile
                        displayNames={usersDisplayNames}
                        user={user}
                        onUpdate={onUpdate}
                        isPosting={isPosting}
                    />
                </PaddedPaper>
                <ProfilePicture
                    profilePicture={user.profilePicture}
                    userId={user.id}
                    altText={user.displayName}
                    editable={true}
                />
            </Stack>
        );
    }
}
