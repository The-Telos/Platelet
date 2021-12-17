import {
    Divider,
    Paper,
    Stack,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
} from "@mui/material";
import React, { useEffect, useRef } from "react";
import { useState } from "react";
import PropTypes from "prop-types";
import { dialogCardStyles } from "../styles/DialogCompactStyles";
import { DataStore } from "aws-amplify";
import * as models from "../../../models/index";
import GetError from "../../../ErrorComponents/GetError";
import { useDispatch, useSelector } from "react-redux";
import { dataStoreReadyStatusSelector } from "../../../redux/Selectors";
import { determineTaskStatus } from "../../../utilities";
import { displayErrorNotification } from "../../../redux/notifications/NotificationsActions";
import ConfirmationDialog from "../../../components/ConfirmationDialog";
import TaskActionConfirmationDialogContents from "./TaskActionConfirmationDialogContents";

const fields = {
    timePickedUp: "Picked up",
    timeDroppedOff: "Delivered",
    timeCancelled: "Cancelled",
    timeRejected: "Rejected",
};

function humanReadableConfirmation(field, nullify) {
    switch (field) {
        case "timePickedUp":
            return nullify
                ? "Clear the picked up time?"
                : "Set the picked up time?";
        case "timeDroppedOff":
            return nullify
                ? "Clear the delivered time?"
                : "Set the delivered time?";
        case "timeCancelled":
            return nullify
                ? "Clear the cancelled time?"
                : "Set the cancelled time?";
        case "timeRejected":
            return nullify
                ? "Clear the rejected time?"
                : "Set the rejected time?";
        default:
            return "";
    }
}

function TaskActions(props) {
    const [state, setState] = useState([]);
    const [isFetching, setIsFetching] = useState(true);
    const [errorState, setErrorState] = useState(null);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const confirmationKey = useRef(null);
    const taskObserver = useRef({ unsubscribe: () => {} });
    const timeSet = useRef(new Date());
    const dataStoreReadyStatus = useSelector(dataStoreReadyStatusSelector);
    const dispatch = useDispatch();
    const cardClasses = dialogCardStyles();

    const errorMessage = "Sorry, something went wrong";

    function onClickToggle(key) {
        confirmationKey.current = key;
        timeSet.current = new Date();
        setConfirmDialogOpen(true);
    }

    function onAdjustTimeSet(time) {
        timeSet.current = time;
    }

    function onChange(key) {
        const value = state.includes(key)
            ? null
            : timeSet.current.toISOString();
        setState((prevState) => {
            if (prevState.includes(key))
                return prevState.filter((v) => v !== key);
            else return [...prevState, key];
        });
        setTimeWithKey(key, value);
    }

    async function setTimeWithKey(key, value) {
        try {
            const existingTask = await DataStore.query(
                models.Task,
                props.taskId
            );
            if (!existingTask) throw new Error("Task doesn't exist");
            const assignees = (
                await DataStore.query(models.TaskAssignee)
            ).filter((a) => a.task && a.task.id === props.taskId);
            const status = determineTaskStatus({
                ...existingTask,
                [key]: value,
                assignees,
            });
            await DataStore.save(
                models.Task.copyOf(existingTask, (updated) => {
                    updated[key] = value;
                    updated.status = status;
                })
            );
        } catch (error) {
            console.log(error);
            dispatch(displayErrorNotification(errorMessage));
        }
    }

    function calculateState(task) {
        return Object.keys(fields).filter((key) => {
            return !!task[key];
        });
    }

    async function getTaskAndUpdateState() {
        if (!dataStoreReadyStatus) return;
        try {
            const task = await DataStore.query(models.Task, props.taskId);
            if (!task) throw new Error("Task not found");
            setState(calculateState(task));
            setIsFetching(false);
            taskObserver.current.unsubscribe();
            taskObserver.current = DataStore.observe(
                models.Task,
                props.taskId
            ).subscribe(async (observeResult) => {
                const taskData = observeResult.element;
                if (observeResult.opType === "INSERT") {
                    setState(calculateState(taskData));
                } else if (observeResult.opType === "UPDATE") {
                    const observedTask = await DataStore.query(
                        models.Task,
                        props.taskId
                    );
                    setState(calculateState(observedTask));
                } else if (observeResult.opType === "DELETE") {
                    // just disable the buttons if the task is deleted
                    setIsFetching(true);
                }
            });
        } catch (e) {
            setIsFetching(false);
            console.log(e);
            setErrorState(e);
        }
    }

    useEffect(
        () => getTaskAndUpdateState(),
        [props.taskId, dataStoreReadyStatus]
    );

    useEffect(() => () => taskObserver.current.unsubscribe(), []);

    function checkDisabled(key) {
        const stopped =
            state.includes("timeCancelled") || state.includes("timeRejected");
        if (key === "timeDroppedOff")
            return !state.includes("timePickedUp") || stopped;
        else if (key === "timePickedUp")
            return state.includes("timeDroppedOff") || stopped;
        else if (key === "timeRejected") {
            if (state.includes("timeRejected")) return false;
            return (
                (state.includes("timePickedUp") &&
                    state.includes("timeDroppedOff")) ||
                stopped
            );
        } else if (key === "timeCancelled") {
            if (state.includes("timeCancelled")) return false;
            return (
                (state.includes("timePickedUp") &&
                    state.includes("timeDroppedOff")) ||
                stopped
            );
        } else return false;
    }

    if (errorState) {
        return <GetError />;
    } else {
        return (
            <>
                <Paper className={cardClasses.root}>
                    <Stack direction={"column"} spacing={2}>
                        <Typography variant={"h6"}>Actions</Typography>
                        <Divider />
                        <ToggleButtonGroup
                            value={state}
                            orientation="vertical"
                            aria-label="task actions"
                        >
                            {Object.entries(fields).map(([key, value]) => {
                                return (
                                    <ToggleButton
                                        key={key}
                                        disabled={
                                            isFetching || checkDisabled(key)
                                        }
                                        aria-disabled={
                                            isFetching || checkDisabled(key)
                                        }
                                        aria-label={value}
                                        value={key}
                                        onClick={() => onClickToggle(key)}
                                    >
                                        {value}
                                    </ToggleButton>
                                );
                            })}
                        </ToggleButtonGroup>
                    </Stack>
                </Paper>
                <ConfirmationDialog
                    open={confirmDialogOpen}
                    dialogTitle={humanReadableConfirmation(
                        confirmationKey.current,
                        state.includes(confirmationKey.current)
                    )}
                    onSelect={(confirmation) => {
                        if (confirmation) onChange(confirmationKey.current);
                    }}
                    onClose={() => setConfirmDialogOpen(false)}
                >
                    <TaskActionConfirmationDialogContents
                        onChange={(v) => onAdjustTimeSet(v)}
                        nullify={state.includes(confirmationKey.current)}
                        field={confirmationKey.current}
                    />
                </ConfirmationDialog>
            </>
        );
    }
}

TaskActions.propTypes = {
    taskId: PropTypes.string.isRequired,
};

export default TaskActions;
