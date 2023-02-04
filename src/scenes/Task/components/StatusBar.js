import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { AppBar, Chip, Hidden, Stack } from "@mui/material";
import { ArrowButton } from "../../../components/Buttons";
import { taskStatusHumanReadable } from "../../../utilities";

import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import makeStyles from "@mui/styles/makeStyles";
import IconButton from "@mui/material/IconButton";
import { useDispatch, useSelector } from "react-redux";
import { displayErrorNotification } from "../../../redux/notifications/NotificationsActions";
import { DataStore } from "aws-amplify";
import * as models from "../../../models";
import { dataStoreModelSyncedStatusSelector } from "../../../redux/Selectors";
import copyTaskDataToClipboard from "../../../utilities/copyTaskDataToClipboard";

const colourBarPercent = "90%";

const generateClass = (theme, status) => {
    if (status) {
        return {
            padding: 2,
            display: "flex",
            width: "100%",
            paddingLeft: 15,
            paddingRight: 15,
            italic: {
                fontStyle: "italic",
            },
            background: `linear-gradient(0deg,
        ${theme.palette.background.paper}
        ${colourBarPercent},
        ${theme.palette.background.paper}
        ${colourBarPercent},
        ${theme.palette.taskStatus[status]}
        ${colourBarPercent},
        ${theme.palette.taskStatus[status]} 100%)`,
        };
    } else {
        return {
            padding: 2,
            display: "flex",
            width: "100%",
            paddingLeft: 15,
            paddingRight: 15,
            italic: {
                fontStyle: "italic",
            },
            background:
                theme.palette.mode === "dark"
                    ? theme.palette.background.paper
                    : theme.palette.primary.main,
        };
    }
};

const dialogComponent = (status) =>
    makeStyles((theme) => {
        return {
            root: generateClass(theme, status),
            statusText: {
                fontWeight: "bold",
                color: theme.palette.mode === "dark" ? "white" : "black",
            },
            items: {
                marginTop: 5,
            },
        };
    });

function StatusBar(props) {
    const [copied, setCopied] = useState(null);
    const theme = useTheme();
    const isSm = useMediaQuery(theme.breakpoints.down("md"));
    const dispatch = useDispatch();
    const taskModelsSynced = useSelector(
        dataStoreModelSyncedStatusSelector
    ).Task;
    const taskObserver = useRef({ unsubscribe: () => {} });
    const [status, setStatus] = useState(null);
    const classes = dialogComponent(status)();

    const getTask = React.useCallback(async (taskId) => {
        try {
            const task = await DataStore.query(models.Task, taskId);
            taskObserver.current = DataStore.observe(
                models.Task,
                taskId
            ).subscribe(({ element }) => {
                setStatus(element.status);
            });
            setStatus(task.status);
        } catch (e) {
            console.log(e);
        }
    }, []);

    useEffect(
        () => getTask(props.taskId),
        [props.taskId, taskModelsSynced, getTask]
    );

    async function copyToClipboard() {
        if (!props.taskId) {
            dispatch(displayErrorNotification("Copy failed."));
            return;
        }
        try {
            const taskResult = await DataStore.query(models.Task, props.taskId);
            if (!taskResult) throw new Error("Task not found.");
            await copyTaskDataToClipboard(taskResult).then(
                () => {
                    setCopied(true);
                },
                () => {
                    setCopied(false);
                }
            );
        } catch (e) {
            console.log(e);
            setCopied(false);
        }
    }

    let copyLabel = "Copy to clipboard";
    if (copied !== null && copied) {
        copyLabel = "Copy successful!";
    } else if (copied !== null && !copied) {
        copyLabel = "Copy failed!";
    }
    let copyColor = "default";
    if (copied !== null && copied) {
        copyColor = "success";
    } else if (copied !== null && !copied) {
        copyColor = "secondary";
    }
    return (
        <AppBar
            position={isSm ? "relative" : "sticky"}
            className={classes.root}
        >
            <Stack
                direction={"row"}
                justifyContent={"space-between"}
                alignItems={"center"}
                sx={{ paddingTop: 1, width: "100%" }}
            >
                <Hidden mdDown>
                    <Button
                        data-cy="task-status-close"
                        onClick={props.handleClose}
                    >
                        Close
                    </Button>
                </Hidden>
                <Hidden mdUp>
                    <IconButton
                        aria-label={"Close"}
                        size={"small"}
                        onClick={props.handleClose}
                    >
                        <ArrowButton size={3} direction={"back"} />
                    </IconButton>
                </Hidden>
                <Typography
                    data-cy="task-status"
                    className={classes.statusText}
                >
                    {taskStatusHumanReadable(status)}
                </Typography>
                <Chip
                    onClick={copyToClipboard}
                    variant={copied === null ? "outlined" : "default"}
                    color={copyColor}
                    sx={{ marginRight: isSm ? 0 : 2 }}
                    label={copyLabel}
                />
            </Stack>
        </AppBar>
    );
}

StatusBar.propTypes = {
    handleClose: PropTypes.func,
    relayNext: PropTypes.string,
    relayPrevious: PropTypes.string,
    taskId: PropTypes.string,
};

StatusBar.defaultProps = {
    handleClose: () => {},
};

export default StatusBar;
