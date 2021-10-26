import React, { useEffect, useRef, useState } from "react";
import StatusBar from "./components/StatusBar";
import Dialog from "@mui/material/Dialog";
import { useDispatch, useSelector } from "react-redux";
import { convertListDataToObject, determineTaskStatus } from "../../utilities";

import FormSkeleton from "../../SharedLoadingSkeletons/FormSkeleton";
import { useTheme } from "@mui/material/styles";
import makeStyles from "@mui/styles/makeStyles";
import useMediaQuery from "@mui/material/useMediaQuery";
import NotFound from "../../ErrorComponents/NotFound";
import GetError from "../../ErrorComponents/GetError";
import Typography from "@mui/material/Typography";
import TaskOverview from "./components/TaskOverview";
import CommentsSideBar from "./components/CommentsSideBar";
import { Button, Hidden } from "@mui/material";
import CommentsSection from "../Comments/CommentsSection";
import * as models from "../../models/index";
import { DataStore } from "aws-amplify";
import { dataStoreReadyStatusSelector } from "../../redux/Selectors";
import _ from "lodash";
import { userRoles } from "../../apiConsts";
import {
    displayErrorNotification,
    displayWarningNotification,
} from "../../redux/notifications/NotificationsActions";

const drawerWidth = 500;
const drawerWidthMd = 400;

const useStyles = makeStyles((theme) => ({
    paper: {
        boxShadow: "none",
        background: theme.palette.background.default,
        padding: 0,
        minHeight: 300,
    },
    root: {
        flexGrow: 1,
        alignItems: "center",
        justify: "center",
    },
    overview: {
        marginRight: drawerWidth,
        [theme.breakpoints.down("lg")]: {
            marginRight: drawerWidthMd,
        },
        [theme.breakpoints.down("md")]: {
            marginRight: 0,
        },
    },
}));

const errorMessage = "Sorry, an error occurred";

const DialogWrapper = (props) => {
    const { handleClose } = props;
    const classes = useStyles();
    return (
        <Dialog
            onKeyUp={(e) => {
                if (e.key === "Escape") handleClose(e);
            }}
            className={classes.root}
            disableEscapeKeyDown
            fullScreen={true}
            maxWidth={"md"}
            fullWidth={true}
            open={true}
            onClose={handleClose}
            PaperProps={{
                className: classes.paper,
            }}
            aria-labelledby="task-dialog"
        >
            {props.children}
        </Dialog>
    );
};

const initialState = {
    id: null,
    reference: "",
    etag: "",
    author: null,
    author_uuid: null,
    pickUpLocation: null,
    dropOffLocation: null,
    patch: null,
    requesterContact: {
        name: null,
        telephoneNumber: null,
    },
    priority: null,
    timeOfCall: null,
    deliverables: null,
    comments: null,
    links: null,
    timePickedUp: null,
    timeDroppedOff: null,
    rider: null,
    assignedRiders: [],
    assignedCoordinators: [],
    timeCancelled: null,
    timeRejected: null,
    createdAt: null,
    updatedAt: null,
    orderInRelay: 0,
    assignedRidersDisplayString: "",
    assignedCoordinatorsDisplayString: "",
};

function TaskDialogCompact(props) {
    const dataStoreReadyStatus = useSelector(dataStoreReadyStatusSelector);
    const [notFound, setNotFound] = useState(false);
    const classes = useStyles();
    const theme = useTheme();
    const isMd = useMediaQuery(theme.breakpoints.down("lg"));
    const [isFetching, setIsFetching] = useState(false);
    const [errorState, setErrorState] = useState(null);
    const [state, setState] = useState(initialState);
    // taskDeliverablesRef exists to keep track of which deliverables
    // have been added or removed without resending data to DeliverableGridSelect props by updating state
    const taskDeliverablesRef = useRef({});
    taskDeliverablesRef.current = state.deliverables;
    const taskRef = useRef();
    taskRef.current = state;
    const taskObserver = useRef({ unsubscribe: () => {} });
    const deliverablesObserver = useRef({ unsubscribe: () => {} });
    const dispatch = useDispatch();

    const taskUUID = props.taskId;

    async function getTask() {
        if (!dataStoreReadyStatus) {
            setIsFetching(true);
        } else {
            try {
                const taskData = await DataStore.query(models.Task, taskUUID);
                if (taskData) {
                    const deliverables = (
                        await DataStore.query(models.Deliverable)
                    ).filter((d) => d.task && d.task.id === taskUUID);
                    debugger;
                    const assignees = (
                        await DataStore.query(models.TaskAssignee)
                    ).filter((a) => a.task && a.task.id === taskUUID);
                    setState({
                        ...taskData,
                        assignees: convertListDataToObject(assignees),
                        deliverables: deliverables
                            ? convertListDataToObject(deliverables)
                            : {},
                    });
                    taskObserver.current.unsubscribe();
                    taskObserver.current = DataStore.observe(
                        models.Task,
                        taskUUID
                    ).subscribe((observeResult) => {
                        const task = observeResult.element;
                        setState((prevState) => ({ ...prevState, ...task }));
                    });

                    if (deliverables) {
                        deliverablesObserver.current.unsubscribe();
                        deliverablesObserver.current = DataStore.observe(
                            models.Deliverable,
                            (t) => t.taskDeliverablesId("eq", taskUUID)
                        ).subscribe((observeResult) => {
                            const deliverable = observeResult.element;
                            if (observeResult.opType === "INSERT") {
                                setState((prevState) => ({
                                    ...prevState,
                                    deliverables: {
                                        ...prevState.deliverables,
                                        [deliverable.id]: deliverable,
                                    },
                                }));
                            } else if (observeResult.opType === "UPDATE") {
                                setState((prevState) => ({
                                    ...prevState,
                                    deliverables: {
                                        ...prevState.deliverables,
                                        [deliverable.id]: {
                                            ...prevState.deliverables[
                                                deliverable.id
                                            ],
                                            ...deliverables,
                                        },
                                    },
                                }));
                            }
                            if (observeResult.opType === "DELETE") {
                                setState((prevState) => ({
                                    ...prevState,
                                    deliverables: _.omit(
                                        prevState.deliverables,
                                        deliverable.id
                                    ),
                                }));
                            }
                        });
                    }
                } else {
                    setNotFound(true);
                }
                setIsFetching(false);
            } catch (error) {
                setIsFetching(false);
                setErrorState(error);
                console.error("Request failed", error);
            }
        }
    }
    useEffect(() => getTask(), [dataStoreReadyStatus, props.taskId]);

    useEffect(() => () => taskObserver.current.unsubscribe(), []);
    useEffect(() => () => deliverablesObserver.current.unsubscribe(), []);

    async function addAssignee(user, role) {
        try {
            const assignee = await DataStore.query(models.User, user.id);
            const task = await DataStore.query(models.Task, taskUUID);
            if (!assignee || !task)
                throw new Error(
                    `Can't find assignee or task: ${taskUUID}, userId: ${user.id}`
                );
            const result = await DataStore.save(
                new models.TaskAssignee({
                    assignee,
                    task,
                    role,
                })
            );
            let riderResponsibility;
            if (role === userRoles.rider) {
                if (user.riderResponsibility) {
                    riderResponsibility = await DataStore.query(
                        models.RiderResponsibility,
                        user.riderResponsibility.id
                    );
                }
                const taskResult = await DataStore.query(models.Task, taskUUID);
                if (!taskResult) throw new Error("Task doesn't exist");
                const status = determineTaskStatus({
                    ...taskResult,
                    assignees: [result],
                });
                await DataStore.save(
                    models.Task.copyOf(taskResult, (updated) => {
                        updated.status = status;
                        if (riderResponsibility)
                            updated.riderResponsibility = riderResponsibility;
                    })
                );
            }
            if (riderResponsibility) {
                setState((prevState) => ({
                    ...prevState,
                    assignees: { ...prevState.assignees, [result.id]: result },
                    riderResponsibility,
                }));
            } else {
                setState((prevState) => ({
                    ...prevState,
                    assignees: { ...prevState.assignees, [result.id]: result },
                }));
            }
        } catch (error) {
            console.error(error);
            dispatch(displayErrorNotification(errorMessage));
        }
    }

    async function onDeleteAssignment(assignmentId) {
        try {
            if (!assignmentId) throw new Error("Assignment ID not provided");
            const result = await DataStore.query(models.Task, taskUUID);
            if (!result) throw new Error("Task doesn't exist");
            debugger;
            const existingAssignment = await DataStore.query(
                models.TaskAssignee,
                assignmentId
            );
            if (
                existingAssignment &&
                existingAssignment.role === userRoles.rider
            ) {
                let riderResponsibility = null;
                const riders = Object.values(state.assignees)
                    .filter(
                        (a) =>
                            a.role === userRoles.rider && a.id !== assignmentId
                    )
                    .map((a) => a.assignee);
                if (riders.length > 0) {
                    const rider = riders[riders.length - 1];
                    if (rider.userRiderResponsibilityId) {
                        riderResponsibility = await DataStore.query(
                            models.RiderResponsibility,
                            rider.userRiderResponsibilityId
                        );
                    }
                }
                await DataStore.save(
                    models.Task.copyOf(result, (updated) => {
                        updated.riderResponsibility = riderResponsibility;
                    })
                );
                setState((prevState) => ({
                    ...prevState,
                    riderResponsibility,
                }));
            }
            if (existingAssignment) await DataStore.delete(existingAssignment);
            const status = determineTaskStatus({
                ...state,
                assignees: _.omit(state.assignees, assignmentId),
            });
            await DataStore.save(
                models.Task.copyOf(result, (updated) => {
                    updated.status = status;
                })
            );
            setState((prevState) => ({
                ...prevState,
                assignees: _.omit(prevState.assignees, assignmentId),
                status,
            }));
        } catch (error) {
            console.error(error);
            dispatch(displayErrorNotification(errorMessage));
        }
    }

    async function setTimeOfCall(value) {
        try {
            const result = await DataStore.query(models.Task, taskUUID);
            if (!result) throw new Error("Task doesn't exist");
            await DataStore.save(
                models.Task.copyOf(result, (updated) => {
                    updated.timeOfCall = value;
                })
            );
            taskRef.current = { ...taskRef.current, timeOfCall: value };
            setState((prevState) => ({
                ...prevState,
                timeOfCall: value,
            }));
        } catch (error) {
            console.error(error);
            dispatch(displayErrorNotification(errorMessage));
        }
    }

    async function setTimeWithKey(value, key) {
        try {
            const result = await DataStore.query(models.Task, taskUUID);
            if (!result) throw new Error("Task doesn't exist");
            const assignees = (
                await DataStore.query(models.TaskAssignee)
            ).filter((a) => a.task.id === taskUUID);
            const status = determineTaskStatus({
                ...result,
                [key]: value,
                assignees,
            });
            await DataStore.save(
                models.Task.copyOf(result, (updated) => {
                    updated[key] = value;
                    updated.status = status;
                })
            );
            taskRef.current = { ...taskRef.current, [key]: value };
            setState((prevState) => ({
                ...prevState,
                status,
                [key]: value,
            }));
        } catch (error) {
            console.error(error);
            dispatch(displayErrorNotification(errorMessage));
        }
    }

    async function selectPriority(priority) {
        try {
            const result = await DataStore.query(models.Task, taskUUID);
            if (!result) throw new Error("Task doesn't exist");
            await DataStore.save(
                models.Task.copyOf(result, (updated) => {
                    updated.priority = priority;
                })
            );
        } catch (error) {
            console.error(error);
            dispatch(displayErrorNotification(errorMessage));
        }
    }

    async function updateRequesterContact(requesterValue) {
        try {
            const result = await DataStore.query(models.Task, taskUUID);
            if (!result) throw new Error("Task doesn't exist");
            if (!result.requesterContact)
                throw new Error("Task doesn't have a requester contact");
            await DataStore.save(
                models.AddressAndContactDetails.copyOf(
                    result.requesterContact,
                    (updated) => {
                        for (const [key, value] of Object.entries(
                            requesterValue
                        )) {
                            updated[key] = value;
                        }
                    }
                )
            );
            taskRef.current = {
                ...taskRef.current,
                requesterContact: {
                    ...taskRef.current.requesterContact,
                    ...requesterValue,
                },
            };
        } catch (error) {
            console.error(error);
            dispatch(displayErrorNotification(errorMessage));
        }
    }
    async function editDropOffPreset(currentState) {
        try {
            const result = await DataStore.query(models.Task, taskUUID);
            if (!result) throw new Error("Task doesn't exist");
            const {
                createdAt,
                updatedAt,
                id,
                name,
                contact,
                _version,
                _lastChangedAt,
                _deleted,
                ...rest
            } = currentState;
            const contactOmitted = _.omit(
                contact,
                "createdAt",
                "updatedAt",
                "id",
                "_version",
                "_lastChangedAt",
                "_deleted"
            );
            const newContact = await DataStore.save(
                new models.AddressAndContactDetails({ ...contactOmitted })
            );
            const newLocation = await DataStore.save(
                new models.Location({
                    ...rest,
                    listed: 0,
                    contact: newContact,
                    name: `Copy of ${name}`,
                })
            );
            await DataStore.save(
                models.Task.copyOf(result, (updated) => {
                    updated.dropOffLocation = newLocation;
                })
            );
            setState((prevState) => ({
                ...prevState,
                dropOffLocation: newLocation,
            }));
        } catch (error) {
            console.error(error);
            dispatch(displayErrorNotification(errorMessage));
        }
    }

    async function editPickUpPreset(currentState) {
        try {
            const result = await DataStore.query(models.Task, taskUUID);
            if (!result) throw new Error("Task doesn't exist");
            const {
                createdAt,
                updatedAt,
                id,
                name,
                contact,
                _version,
                _lastChangedAt,
                _deleted,
                ...rest
            } = currentState;
            const contactOmitted = _.omit(
                contact,
                "createdAt",
                "updatedAt",
                "id",
                "_version",
                "_lastChangedAt",
                "_deleted"
            );
            const newContact = await DataStore.save(
                new models.AddressAndContactDetails({ ...contactOmitted })
            );
            const newLocation = await DataStore.save(
                new models.Location({
                    ...rest,
                    listed: 0,
                    contact: newContact,
                    name: `Copy of ${name}`,
                })
            );
            await DataStore.save(
                models.Task.copyOf(result, (updated) => {
                    updated.pickUpLocation = newLocation;
                })
            );
            setState((prevState) => ({
                ...prevState,
                pickUpLocation: newLocation,
            }));
        } catch (error) {
            console.error(error);
            dispatch(displayErrorNotification(errorMessage));
        }
    }
    async function selectPickUpPreset(location) {
        try {
            const result = await DataStore.query(models.Task, taskUUID);
            if (!result) throw new Error("Task doesn't exist");
            if (!location) throw new Error("Location was not provided");
            if (result && location) {
                await DataStore.save(
                    models.Task.copyOf(result, (updated) => {
                        updated.pickUpLocation = location;
                    })
                );
            }
            setState((prevState) => ({
                ...prevState,
                pickUpLocation: location,
            }));
        } catch (error) {
            console.error(error);
            dispatch(displayErrorNotification(errorMessage));
        }
    }

    async function clearPickUpLocation() {
        try {
            const result = await DataStore.query(models.Task, taskUUID);
            if (!result) throw new Error("Task doesn't exist");
            await DataStore.save(
                models.Task.copyOf(result, (updated) => {
                    updated.pickUpLocation = null;
                })
            );
            setState((prevState) => ({
                ...prevState,
                pickUpLocation: null,
            }));
        } catch (error) {
            console.error(error);
            dispatch(displayErrorNotification(errorMessage));
        }
    }

    async function selectDropOffPreset(location) {
        try {
            const result = await DataStore.query(models.Task, taskUUID);
            if (!result) throw new Error("Task doesn't exist");
            if (!location) throw new Error("Location was not provided");
            await DataStore.save(
                models.Task.copyOf(result, (updated) => {
                    updated.dropOffLocation = location;
                })
            );
            setState((prevState) => ({
                ...prevState,
                dropOffLocation: location,
            }));
        } catch (error) {
            console.error(error);
            dispatch(displayErrorNotification(errorMessage));
        }
    }

    async function deleteDeliverable(deliverableTypeId) {
        // receive DeliverableTypeId only from selector component
        // check if one of this DeliverableType has already been saved so we can delete it
        const existing = Object.values(taskDeliverablesRef.current).find(
            (d) => d.deliverableType.id === deliverableTypeId
        );
        try {
            if (existing) {
                const existingDeliverable = await DataStore.query(
                    models.Deliverable,
                    existing.id
                );
                if (existingDeliverable)
                    await DataStore.delete(existingDeliverable);
                // remove it from the tracking reference
                taskDeliverablesRef.current = _.omit(
                    taskDeliverablesRef.current,
                    existing.id
                );
            }
        } catch (error) {
            console.error(error);
            dispatch(displayErrorNotification(errorMessage));
        }
    }

    async function clearDropOffLocation() {
        try {
            const result = await DataStore.query(models.Task, taskUUID);
            if (!result) throw new Error("Task doesn't exist");
            await DataStore.save(
                models.Task.copyOf(result, (updated) => {
                    updated.dropOffLocation = null;
                })
            );
            setState((prevState) => ({
                ...prevState,
                dropOffLocation: null,
            }));
        } catch (error) {
            console.error(error);
            dispatch(displayErrorNotification(errorMessage));
        }
    }

    async function changeLocationDetails(locationId, values, key) {
        // display error if some location that doesn't exist is attempted to be created
        if (!["dropOffLocation", "pickUpLocation"].includes(key)) {
            dispatch(displayErrorNotification(errorMessage));
            return;
        }
        try {
            //separate any contact details with location details
            const { contact, ...rest } = values;
            let locationResult;
            let contactResult;
            // if we are updating an existing location
            if (locationId) {
                const existingLocation = await DataStore.query(
                    models.Location,
                    locationId
                );
                if (!existingLocation)
                    throw new Error("Location doesn't exist");
                if (!!existingLocation.listed) {
                    // can't edit a location if it's from the directory
                    dispatch(
                        displayWarningNotification(
                            "You can't edit listed locations in this way."
                        )
                    );
                    return;
                }
                // if rest is empty, only contact data was sent
                if (!_.isEmpty(rest) && existingLocation) {
                    // update the location and get the updated version back to locationResult
                    locationResult = await DataStore.save(
                        models.Location.copyOf(existingLocation, (updated) => {
                            for (const [key, v] of Object.entries(rest)) {
                                updated[key] = v;
                            }
                        })
                    );
                }
                // if contact is undefined, no contact data was sent
                if (contact && existingLocation) {
                    // get the existing contact model
                    const existingContact = await DataStore.query(
                        models.AddressAndContactDetails,
                        existingLocation.contact.id
                    );
                    // update the existing contact model and save the final version to contactResult
                    contactResult = await DataStore.save(
                        models.AddressAndContactDetails.copyOf(
                            existingContact,
                            (updated) => {
                                for (const [key, v] of Object.entries(
                                    contact
                                )) {
                                    updated[key] = v;
                                }
                            }
                        )
                    );
                }
            } else {
                // if no location exists yet
                // make sure we aren't just sending empty values
                const result = {};
                if (!_.isEmpty(rest)) {
                    for (const [key, value] of Object.entries(rest)) {
                        if (!!value) {
                            result[key] = value;
                        }
                    }
                }
                if (contact) {
                    for (const [key, value] of Object.entries(contact)) {
                        if (!!value) {
                            result[key] = value;
                        }
                    }
                }
                if (_.isEmpty(result)) return;

                // create a contact model
                contactResult = await DataStore.save(
                    new models.AddressAndContactDetails(contact || {})
                );
                // create a new location and link it to the new contact model
                locationResult = await DataStore.save(
                    new models.Location({
                        ...rest,
                        contact: contactResult,
                    })
                );
                // find the existing task
                const existingTask = await DataStore.query(
                    models.Task,
                    taskUUID
                );
                if (!existingTask) throw new Error("Task doesn't exist");
                // link to new location
                await DataStore.save(
                    models.Task.copyOf(existingTask, (updated) => {
                        updated[key] = locationResult;
                    })
                );
            }

            // update local state, but find data from prevState to fill contactResult or locationResult if they are undefined
            setState((prevState) => {
                if (!contactResult)
                    contactResult = prevState[key]
                        ? prevState[key].contact
                        : null;
                if (!locationResult) locationResult = prevState[key];
                return {
                    ...prevState,
                    [key]: {
                        ...locationResult,
                        contact: contactResult,
                    },
                };
            });
        } catch (error) {
            console.error(error);
            dispatch(displayErrorNotification(errorMessage));
        }
        props.refreshTask();
    }

    async function updateDeliverables(value) {
        // receive DeliverableType from selector component
        // check if one of this DeliverableType has already been saved
        try {
            const existing = Object.values(taskDeliverablesRef.current).find(
                (d) => d.deliverableType.id === value.id
            );
            if (existing) {
                const existingDeliverable = await DataStore.query(
                    models.Deliverable,
                    existing.id
                );
                if (existingDeliverable) {
                    await DataStore.save(
                        models.Deliverable.copyOf(
                            existingDeliverable,
                            (updated) => {
                                for (const [key, v] of Object.entries(value)) {
                                    updated[key] = v;
                                }
                            }
                        )
                    );
                }
            } else {
                const existingTask = await DataStore.query(
                    models.Task,
                    taskUUID
                );
                if (!existingTask) throw new Error("Task does not exist");
                const { id, ...rest } = value;
                const deliverableType = await DataStore.query(
                    models.DeliverableType,
                    id
                );
                if (!deliverableType)
                    throw new Error("Deliverable type does not exist");
                const newDeliverable = await DataStore.save(
                    new models.Deliverable({
                        task: existingTask,
                        deliverableType,
                        ...rest,
                    })
                );
                // add it to the tracking reference
                taskDeliverablesRef.current[newDeliverable.id] = newDeliverable;
            }
        } catch (error) {
            console.error(error);
            dispatch(displayErrorNotification(errorMessage));
        }
    }

    const statusBar =
        !state || notFound ? (
            <Button onClick={props.onClose}>Close</Button>
        ) : (
            <StatusBar
                handleClose={props.onClose}
                status={state.status}
                taskUUID={taskUUID}
            />
        );

    if (isFetching) {
        return (
            <DialogWrapper handleClose={props.onClose}>
                <FormSkeleton />
            </DialogWrapper>
        );
    } else if (notFound) {
        return (
            <DialogWrapper handleClose={props.onClose}>
                {statusBar}
                <NotFound>
                    <Typography>
                        Task with UUID {taskUUID} not found.
                    </Typography>
                </NotFound>
            </DialogWrapper>
        );
    } else if (errorState) {
        return (
            <DialogWrapper handleClose={props.onClose}>
                {statusBar}
                <GetError>
                    <Typography>
                        {errorState && errorState.message
                            ? errorState.message
                            : "Unknown"}
                    </Typography>
                </GetError>
            </DialogWrapper>
        );
    } else {
        return (
            <DialogWrapper handleClose={props.onClose}>
                <div className={classes.overview}>
                    {statusBar}
                    <TaskOverview
                        task={state}
                        taskUUID={taskUUID}
                        onSelectAssignee={addAssignee}
                        onDeleteAssignment={onDeleteAssignment}
                        onSelectPriority={selectPriority}
                        onSelectPickUpPreset={selectPickUpPreset}
                        onEditPickUpPreset={editPickUpPreset}
                        onClearPickUpLocation={clearPickUpLocation}
                        onChangePickUpLocation={(locationId, values) =>
                            changeLocationDetails(
                                locationId,
                                values,
                                "pickUpLocation"
                            )
                        }
                        onSelectDropOffPreset={selectDropOffPreset}
                        onEditDropOffPreset={editDropOffPreset}
                        onClearDropOffLocation={clearDropOffLocation}
                        onChangeDropOffLocation={(locationId, values) =>
                            changeLocationDetails(
                                locationId,
                                values,
                                "dropOffLocation"
                            )
                        }
                        onChangeTimePickedUp={(value) =>
                            setTimeWithKey(value, "timePickedUp")
                        }
                        onChangeTimeDroppedOff={(value) =>
                            setTimeWithKey(value, "timeDroppedOff")
                        }
                        onChangeTimeCancelled={(value) =>
                            setTimeWithKey(value, "timeCancelled")
                        }
                        onChangeTimeRejected={(value) =>
                            setTimeWithKey(value, "timeRejected")
                        }
                        onChangeTimeOfCall={setTimeOfCall}
                        onChangeRequesterContact={updateRequesterContact}
                        onUpdateDeliverable={updateDeliverables}
                        onDeleteDeliverable={deleteDeliverable}
                    />
                </div>
                <Hidden mdDown>
                    <CommentsSideBar
                        width={isMd ? drawerWidthMd : drawerWidth}
                        parentUUID={taskUUID}
                    />
                </Hidden>
                <Hidden mdUp>
                    <CommentsSection parentUUID={taskUUID} />
                </Hidden>
            </DialogWrapper>
        );
    }
}

export default TaskDialogCompact;
