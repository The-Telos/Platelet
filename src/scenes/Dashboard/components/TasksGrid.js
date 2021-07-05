import React, {useEffect, useRef, useState} from "react";
import Grid from "@material-ui/core/Grid";
import TaskItem from "./TaskItem";
import {
    createLoadingSelector,
    createNotFoundSelector,
    createPostingSelector,
    createSimpleLoadingSelector
} from "../../../redux/selectors";
import {useDispatch, useSelector} from "react-redux";
import {TasksKanbanColumn} from "../styles/TaskColumns";
import Button from "@material-ui/core/Button";
import {Waypoint} from "react-waypoint";
import {
    addTaskRelayRequest, addTaskRequest,
} from "../../../redux/tasks/TasksActions";
import Tooltip from "@material-ui/core/Tooltip";
import ArrowDownwardIcon from "@material-ui/icons/ArrowDownward";
import makeStyles from "@material-ui/core/styles/makeStyles";
import {filterTasks} from "../utilities/functions";
import {CircularProgress, Typography} from "@material-ui/core";
import Divider from "@material-ui/core/Divider";
import TasksGridSkeleton from "./TasksGridSkeleton";
import PropTypes from 'prop-types'
import {showHide} from "../../../styles/common";
import {
    appendTasksCancelledRequest,
    appendTasksDeliveredRequest,
    appendTasksRejectedRequest
} from "../../../redux/tasks/TasksWaypointActions";
import {clearDashboardFilter} from "../../../redux/dashboardFilter/DashboardFilterActions";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import {useTheme} from "@material-ui/core/styles";
import clsx from "clsx";
import {getTasksSelector} from "../../../redux/Selectors";
import {convertToRelays} from "../../../redux/tasks/task_redux_utilities";


const getColumnTitle = key => {
    switch (key) {
        case "tasksNew":
            return "New".toUpperCase();
        case "tasksActive":
            return "Active".toUpperCase();
        case "tasksPickedUp":
            return "Picked Up".toUpperCase();
        case "tasksDelivered":
            return "Delivered".toUpperCase();
        case "tasksRejected":
            return "Rejected".toUpperCase();
        case "tasksCancelled":
            return "Cancelled".toUpperCase();
        case "tasksRejectedCancelled":
            return "Rejected/Cancelled".toUpperCase();
        default:
            return ""
    }
};

const useStyles = makeStyles(theme => ({
    addRelay: {
        visibility: "hidden",
        "&:hover $hoverDiv": {
            visibility: "visible"
        }
    },
    header: {
        fontWeight: "bold",
        padding: "6px"
    },
    divider: {
        width: "95%"
    },
    column: {
        [theme.breakpoints.down("sm")]: {
            width: "100%"
        }
    }
}));

const taskGroupStyles = makeStyles({
    hoverDiv: {
        width: "100%",
        height: "35px",
        "& .hidden-button": {
            display: "none"
        },
        "&:hover .hidden-button": {
            display: "inline"
        }
    },
    root: {
        width: "100%"
    }
})

const TaskGroup = props => {
    const classes = taskGroupStyles();
    const {show, hide} = showHide();
    const taskArr = Object.entries(props.group).map(([key, value]) => value)
    const roleView = useSelector(state => state.roleView);

    taskArr.sort((a, b) => a.order_in_relay - b.order_in_relay)
    return taskArr.length === 0 ? <></> : taskArr.map((task, i, arr) => {
        const {
            assigned_riders_display_string,
            time_picked_up,
            time_dropped_off,
            time_rejected,
            time_cancelled,
            time_of_call,
            priority,
            patch,
            uuid,
            assigned_riders,
            parent_id,
            relay_next,
            assigned_coordinators,
            assigned_coordinators_display_string
        } = task;
        const dropoff_address = task.dropoff_location ? task.dropoff_location.address : null;
        const pickup_address = task.pickup_location ? task.pickup_location.address : null;

        return (
            <div
                className={
                    clsx(classes.root,
                        (props.showTasks === null || props.showTasks.includes(uuid)) ? show : hide)}
                key={uuid}>
                <Grid container className={classes.root} alignItems={"center"} justify={"center"}>
                    <Grid item className={classes.root}>
                        <TaskItem
                            animate={props.animate}
                            pickupAddress={pickup_address}
                            assignedRiders={assigned_riders}
                            assignedCoordinators={assigned_coordinators}
                            assignedCoordinatorsDisplayString={assigned_coordinators_display_string}
                            assignedRidersDisplayString={assigned_riders_display_string}
                            dropoffAddress={dropoff_address}
                            timePickedUp={time_picked_up}
                            timeDroppedOff={time_dropped_off}
                            timeRejected={time_rejected}
                            timeCancelled={time_cancelled}
                            timeOfCall={time_of_call}
                            priority={priority}
                            patch={patch}
                            relayNext={relay_next}
                            taskUUID={uuid}
                            parentID={parent_id}
                            view={props.modalView}
                            deleteDisabled={props.deleteDisabled}/>
                        <Grid container alignItems={"center"} justify={"center"} className={classes.hoverDiv}>
                            <Grid
                                className={(!!relay_next && props.showTasks === null && !props.hideRelayIcons) && roleView === "coordinator" ? show : hide}
                                item>
                                <Tooltip title="Relay">
                                    <ArrowDownwardIcon style={{height: "35px"}}/>
                                </Tooltip>
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
            </div>
        )
    })
}

TaskGroup.propTypes = {
    showTasks: PropTypes.arrayOf(PropTypes.string),
}

const loaderStyles = makeStyles((theme) => ({
    linear: {
        width: '100%',
        '& > * + *': {
            marginTop: theme.spacing(2),
        },
    },
    circular: {
        display: 'flex',
        '& > * + *': {
            marginLeft: theme.spacing(2),
        },
    },
}));

const gridColumnStyles = makeStyles({
    gridItem: {
        width: "100%"
    }
})

const GridColumn = (props) => {
    const classes = useStyles();
    const loaderClass = loaderStyles();
    const {show, hide} = showHide();
    const dispatch = useDispatch();
    //TODO: temporary just to get it working
    const tasks = convertToRelays(useSelector(getTasksSelector)[props.taskKey]);
    const whoami = useSelector(state => state.whoami.user);
    const gridColumnClasses = gridColumnStyles();
    let selectorsString = "";
    if (props.taskKey === "tasksDelivered")
        selectorsString = "APPEND_TASKS_DELIVERED"
    else if (props.taskKey === "tasksCancelled")
        selectorsString = "APPEND_TASKS_CANCELLED"
    else if (props.taskKey === "tasksRejected")
        selectorsString = "APPEND_TASKS_REJECTED"
    const notFoundSelector = createNotFoundSelector([selectorsString]);
    const endlessLoadEnd = useSelector(state => notFoundSelector(state));
    const isFetchingSelector = createSimpleLoadingSelector([selectorsString]);
    const endlessLoadIsFetching = useSelector(state => isFetchingSelector(state));
    const roleView = useSelector(state => state.roleView);
    const dispatchAppendFunctions = {
        tasksCancelled: (endlessLoadEnd || endlessLoadIsFetching) ? () => ({type: "IGNORE"}) : appendTasksCancelledRequest,
        tasksDelivered: (endlessLoadEnd || endlessLoadIsFetching) ? () => ({type: "IGNORE"}) : appendTasksDeliveredRequest,
        tasksRejected: (endlessLoadEnd || endlessLoadIsFetching) ? () => ({type: "IGNORE"}) : appendTasksRejectedRequest
    };
    let appendFunction = () => {
    };
    appendFunction = dispatchAppendFunctions[props.taskKey];
    const header =
        (props.taskKey === "tasksNew" && !props.hideAddButton) && props.showTasks === null ?
            <React.Fragment>

                <Button variant="contained" color="primary"
                        disabled={props.disableAddButton}
                        onClick={props.onAddTaskClick}
                        className={(props.taskKey === "tasksNew" && !props.hideAddButton) && props.showTasks === null ? show : hide}
                >
                    Create New
                </Button>
            </React.Fragment>
            :
            (props.showTasks !== null && props.taskKey === "tasksNew") ?
                <Button variant="contained" color="primary"
                        disabled={props.disableAddButton}
                        onClick={() => dispatch(clearDashboardFilter())}
                >
                    Clear Search
                </Button> :
                <Typography className={classes.header}>{props.title}</Typography>


    const tasksList = Object.entries(tasks).sort((a, b) => parseInt(a[0]) - parseInt(b[0])).reverse();
    const lastParent = tasksList.length === 0 ? 0 : tasksList[tasksList.length - 1][0];

    return (
        <TasksKanbanColumn>
            <Grid container direction={"column"} spacing={2} alignItems={"center"} justify={"flex-start"}>
                <Grid item>
                    {header}
                </Grid>
                <Grid item>
                    <Divider className={classes.divider}/>
                </Grid>
                <Grid container item
                      spacing={0}
                      direction={"column"}
                      justify={"flex-start"}
                      alignItems={"center"}
                      key={props.title + "column"}
                >

                    {tasksList.map(([key, jobs]) => {
                        return (
                            <Grid item className={gridColumnClasses.gridItem} key={key}>
                                <TaskGroup {...props} group={jobs}/>
                            </Grid>
                        )
                    })
                    }
                    {(["tasksDelivered", "tasksRejected", "tasksCancelled"].includes(props.taskKey)) ?
                        <React.Fragment>
                            <Waypoint
                                onEnter={() => {
                                    if (props.showTasks)
                                        return;
                                    if (lastParent) {
                                        dispatch(appendFunction(
                                            whoami.uuid,
                                            1,
                                            roleView,
                                            props.taskKey,
                                            lastParent
                                        ))
                                    }
                                }
                                }
                            />
                            {endlessLoadIsFetching ?
                                <div className={loaderClass.root}>
                                    <CircularProgress color="secondary"/>
                                </div> : <></>}
                        </React.Fragment>

                        : <></>}

                </Grid>
            </Grid>
        </TasksKanbanColumn>
    )
}

GridColumn.propTypes = {
    title: PropTypes.string,
    classes: PropTypes.object,
    onAddTaskClick: PropTypes.func,
    onAddRelayClick: PropTypes.func,
    disableAddButton: PropTypes.bool,
    taskKey: PropTypes.string,
    showTasks: PropTypes.arrayOf(PropTypes.string),
}


function TasksGrid(props) {
    const classes = useStyles();
    const postingSelector = createPostingSelector(["ADD_TASK"]);
    const isPosting = useSelector(state => postingSelector(state));
    const loadingSelector = createLoadingSelector(['GET_TASKS']);
    const isFetching = useSelector(state => loadingSelector(state));
    const animate = useRef(false);
    const [filteredTasksUUIDs, setFilteredTasksUUIDs] = useState(null);
    const tasks = useSelector(getTasksSelector);
    const roleView = useSelector(state => state.roleView);
    const whoami = useSelector(state => state.whoami.user);
    const dispatch = useDispatch();
    const dashboardFilter = useSelector(state => state.dashboardFilter);
    const {show, hide} = showHide();
    const theme = useTheme();
    const isSm = useMediaQuery(theme.breakpoints.down("sm"))

    useEffect(() => {
        animate.current = !isFetching
    }, [isFetching])

    const emptyTask = {
        requester_contact: {
            name: "",
            telephone_number: ""
        },
        assigned_riders: [],
        assigned_coordinators: [],
        time_picked_up: null,
        time_dropped_off: null,
        time_rejected: null,
        time_cancelled: null
    };

    const addEmptyTask = () => {
        dispatch(addTaskRequest({
            ...emptyTask,
            time_of_call: new Date().toISOString(),
            time_created: new Date().toISOString()
        }, roleView, whoami.uuid))
    };

    const addRelay = React.useCallback((data) => {
        dispatch(addTaskRelayRequest(data));
    }, [])


    function doSearch() {
        const result = filterTasks(tasks, dashboardFilter)
        setFilteredTasksUUIDs(result);
    }

    useEffect(doSearch, [dashboardFilter])

    useEffect(() => console.log(tasks), [tasks])

    if (isFetching) {
        return <TasksGridSkeleton count={3}/>
    } else {
        return (
            <Grid container
                  spacing={2}
                  direction={"row"}
                  justify={isSm ? "center" : "flex-start"}
                  alignItems={"stretch"}

            >
                {Object.keys(tasks).map(taskKey => {
                    const title = getColumnTitle(taskKey);
                    return (
                        <Grid
                            item
                            key={taskKey}
                            className={clsx([props.excludeColumnList && props.excludeColumnList.includes(taskKey) ? hide : show, classes.column])}>
                            <GridColumn title={title}
                                        classes={classes}
                                        onAddTaskClick={addEmptyTask}
                                        onAddRelayClick={addRelay}
                                        disableAddButton={isPosting}
                                        taskKey={taskKey}
                                        showTasks={filteredTasksUUIDs}
                                        animate={animate.current}
                                        key={title}/>

                        </Grid>
                    )
                })}
            </Grid>
        )
    }
}

TasksGrid.propTypes = {
    fullScreenModal: PropTypes.bool,
    modalView: PropTypes.string,
    hideRelayIcons: PropTypes.bool,
    hideAddButton: PropTypes.bool,
    excludeColumnList: PropTypes.arrayOf(PropTypes.string)
}

export default TasksGrid;
