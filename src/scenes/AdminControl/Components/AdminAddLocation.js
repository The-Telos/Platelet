import { DataStore } from "aws-amplify";
import { Button, Grid, Stack, TextField, Typography } from "@mui/material";
import makeStyles from "@mui/styles/makeStyles";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { TextFieldUncontrolled } from "../../../components/TextFields";
import {
    displayErrorNotification,
    displayInfoNotification,
} from "../../../redux/notifications/NotificationsActions";
import { PaddedPaper } from "../../../styles/common";
import { encodeUUID } from "../../../utilities";
import * as models from "../../../models/index";
import Forbidden from "../../../ErrorComponents/Forbidden";
import { getWhoami } from "../../../redux/Selectors";
import { createLoadingSelector } from "../../../redux/LoadingSelectors";
import FormSkeleton from "../../../SharedLoadingSkeletons/FormSkeleton";

const initialLocationState = {
    name: null,
    contact: {
        name: null,
        telephoneNumber: null,
        emailAddress: null,
    },
    ward: null,
    line1: null,
    line2: null,
    line3: null,
    town: null,
    county: null,
    country: null,
    state: null,
    postcode: null,
    what3words: null,
    listed: 1,
};

const useStyles = makeStyles({
    root: {
        width: "100%",
        maxWidth: 460,
    },
    message: {
        height: 80,
    },
});

const fields = {
    name: "Name",
    ward: "Ward",
    line1: "Line 1",
    line2: "Line 2",
    line3: "Line 3",
    town: "Town",
    county: "County",
    country: "Country",
    state: "State",
    postcode: "Postcode",
    what3words: "What 3 Words",
};

const contactFields = {
    name: "Contact name",
    emailAddress: "Contact email",
};

function AdminAddLocation() {
    const [state, setState] = useState(initialLocationState);
    const whoami = useSelector(getWhoami);
    const [isPosting, setIsPosting] = useState(false);
    const loadingSelector = createLoadingSelector(["GET_WHOAMI"]);
    const whoamiFetching = useSelector(loadingSelector);
    const [inputVerified, setInputVerified] = useState(false);
    const dispatch = useDispatch();
    const classes = useStyles();

    function verifyInput() {
        setInputVerified(!!state.name);
    }
    useEffect(verifyInput, [state]);

    async function addNewLocation() {
        try {
            setIsPosting(true);
            const newLocation = await DataStore.save(
                new models.Location(state)
            );
            setState(initialLocationState);
            setIsPosting(false);
            dispatch(
                displayInfoNotification(
                    "Location added",
                    undefined,
                    `/location/${encodeUUID(newLocation.id)}`
                )
            );
        } catch (error) {
            console.log("error adding location:", error);
            setIsPosting(false);
            dispatch(displayErrorNotification("Sorry, something went wrong."));
        }
    }

    if (whoamiFetching) {
        return <FormSkeleton />;
    } else if (!whoami.roles.includes("ADMIN")) {
        return <Forbidden />;
    } else {
        return (
            <PaddedPaper>
                <Stack
                    className={classes.root}
                    direction={"column"}
                    justifyContent={"flex-start"}
                    alignItems={"top"}
                    spacing={3}
                >
                    <Typography variant={"h5"}>Add a new location</Typography>
                    {Object.keys(fields).map((key) => {
                        return (
                            <TextField
                                key={key}
                                value={state[key]}
                                fullWidth
                                label={fields[key]}
                                id={key}
                                onChange={(e) => {
                                    setState((prevState) => ({
                                        ...prevState,
                                        [key]: e.target.value,
                                    }));
                                }}
                            />
                        );
                    })}
                    {Object.keys(contactFields).map((key) => {
                        return (
                            <TextField
                                key={key}
                                fullWidth
                                label={contactFields[key]}
                                id={key}
                                onChange={(e) => {
                                    setState((prevState) => ({
                                        ...prevState,
                                        contact: {
                                            ...state.contact,
                                            [key]: e.target.value,
                                        },
                                    }));
                                }}
                            />
                        );
                    })}
                    <TextFieldUncontrolled
                        key={"telephoneNumber"}
                        fullWidth
                        value={state.contact.telephoneNumber}
                        label="Telephone number"
                        id={"telephoneNumber"}
                        tel
                        onChange={(e) => {
                            setState((prevState) => ({
                                ...prevState,
                                contact: {
                                    ...state.contact,
                                    telephoneNumber: e.target.value,
                                },
                            }));
                        }}
                    />

                    <Button
                        disabled={!inputVerified || isPosting}
                        onClick={addNewLocation}
                    >
                        Add location
                    </Button>
                </Stack>
            </PaddedPaper>
        );
    }
}

export default AdminAddLocation;
