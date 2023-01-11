import React, { useEffect, useState } from "react";
import * as models from "../../models";
import { PaddedPaper } from "../../styles/common";
import TasksStatistics from "./components/TasksStatistics";
import CircularProgress from "@mui/material/CircularProgress";
import { useDispatch, useSelector } from "react-redux";
import makeStyles from "@mui/styles/makeStyles";
import FormControl from "@mui/material/FormControl";
import { Fade, InputLabel, MenuItem, Select, Stack } from "@mui/material";
import { getWhoami } from "../../redux/Selectors";
import getStats from "./utilities/getStats";
import moment from "moment";
import UserRoleSelect from "../../components/UserRoleSelect";
import { displayErrorNotification } from "../../redux/notifications/NotificationsActions";

const useStyles = makeStyles((theme) => ({
    formControl: {
        margin: theme.spacing(1),
        minWidth: 120,
    },
    selectEmpty: {
        marginTop: theme.spacing(2),
    },
}));

const initialState = {
    common: {
        numCompleted: 0,
        numPickedUp: 0,
        numActive: 0,
        numUnassigned: 0,
        numRejected: 0,
        numCancelled: 0,
        numTasks: 0,
        timeActive: 0,
    },
    priorities: {
        high: 0,
        medium: 0,
        low: 0,
    },
    riders: {},
};

function StatisticsDashboard() {
    const [state, setState] = useState(initialState);
    const classes = useStyles();
    const [isFetching, setIsFetching] = useState(false);
    const whoami = useSelector(getWhoami);
    const [role, setRole] = useState(models.Role.COORDINATOR);
    const [days, setDays] = useState(3);
    const dispatch = useDispatch();

    const handleDaysChange = (event) => {
        setDays(event.target.value);
    };

    const picker = (
        <div>
            <FormControl className={classes.formControl}>
                <InputLabel id="demo-simple-select-label">Days</InputLabel>
                <Select
                    labelId="demo-simple-select-label"
                    id="demo-simple-select"
                    value={days}
                    onChange={handleDaysChange}
                >
                    <MenuItem value={1}>1</MenuItem>
                    <MenuItem value={3}>3</MenuItem>
                    <MenuItem value={5}>5</MenuItem>
                    <MenuItem value={7}>7</MenuItem>
                    <MenuItem value={14}>14</MenuItem>
                    <MenuItem value={30}>30</MenuItem>
                </Select>
            </FormControl>
        </div>
    );

    const getStatsData = React.useCallback(
        async (role, days, whoami) => {
            try {
                setIsFetching(true);
                const newMoment = moment();
                const start = newMoment.toISOString();
                const end = newMoment.subtract(days, "day").toISOString();
                const range = {
                    start,
                    end,
                };
                setState(await getStats(role, range, whoami.id));
                setIsFetching(false);
            } catch (e) {
                dispatch(
                    displayErrorNotification("Sorry, something went wrong")
                );
                setState(initialState);
                console.log(e);
            }
        },
        [dispatch]
    );

    useEffect(
        () => getStatsData(role, days, whoami),
        [role, days, whoami, getStatsData]
    );

    return (
        <PaddedPaper>
            <Stack
                direction="row"
                spacing={2}
                alignItems="center"
                justifyContent="space-between"
            >
                <Stack direction="row" spacing={2} alignItems="center">
                    {picker}
                    <UserRoleSelect
                        value={[role]}
                        onSelect={(value) => setRole(value)}
                        exclude={[models.Role.USER, models.Role.ADMIN]}
                    />
                </Stack>
                <Fade
                    in={isFetching}
                    style={{
                        transitionDelay: isFetching ? "800ms" : "0ms",
                    }}
                    unmountOnExit
                >
                    <CircularProgress />
                </Fade>
            </Stack>
            <TasksStatistics data={state} />
        </PaddedPaper>
    );
}

export default StatisticsDashboard;
