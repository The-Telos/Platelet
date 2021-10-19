import React, { useEffect, useState } from "react";
import Typography from "@mui/material/Typography";
import LabelItemPair from "../../../components/LabelItemPair";
import Grid from "@mui/material/Grid";
import PrioritySelect from "./PrioritySelect";
import PropTypes from "prop-types";
import makeStyles from "@mui/styles/makeStyles";
import ClickableTextField from "../../../components/ClickableTextField";
import TimePicker from "./TimePicker";
import { Paper } from "@mui/material";
import { dialogCardStyles } from "../styles/DialogCompactStyles";
import TaskActions from "./TaskActions";

const useStyles = makeStyles({
    requesterContact: {
        paddingLeft: "20px",
    },
    priority: {
        paddingLeft: "20px",
    },
});

function extractTaskData(task) {
    let {
        reference,
        timeOfCall,
        riderResponsibility,
        id,
        requesterContact,
        priority,
        timeRejected,
        timeCancelled,
        timePickedUp,
        timeDroppedOff,
    } = task;
    if (requesterContact === null) {
        requesterContact = {
            name: null,
            telephoneNumber: null,
        };
    }
    return {
        reference,
        timeOfCall,
        riderResponsibility,
        id,
        requesterContact,
        priority,
        timeRejected,
        timeCancelled,
        timePickedUp,
        timeDroppedOff,
    };
}

function TaskDetailsPanel(props) {
    const cardClasses = dialogCardStyles();
    const [state, setState] = useState({
        reference: null,
        timeOfCall: null,
        priority: null,
        riderResponsibility: null,
        id: null,
        requesterContact: {
            name: null,
            telephoneNumber: null,
        },
    });
    const classes = useStyles();

    useEffect(() => setState(extractTaskData(props.task)), [props.task]);

    function onChangeTimeOfCall(value) {
        if (value) {
            props.onChangeTimeOfCall(value);
        }
    }

    function onSelectPriority(priority) {
        props.onSelectPriority(priority);
    }

    function onChangeRequesterContact(value) {
        props.onChangeRequesterContact(value);
    }

    return (
        <Paper className={cardClasses.root}>
            <Grid container direction={"column"} spacing={3}>
                <Grid item>
                    <LabelItemPair label={"Reference"}>
                        <Typography>{state.reference}</Typography>
                    </LabelItemPair>
                    <LabelItemPair label={"TOC"}>
                        <TimePicker
                            onChange={onChangeTimeOfCall}
                            disableClear={true}
                            label={"TOC"}
                            time={state.timeOfCall}
                        />
                    </LabelItemPair>
                    <Typography>Requester contact:</Typography>
                    <div className={classes.requesterContact}>
                        <LabelItemPair label={"Name"}>
                            <ClickableTextField
                                onFinished={(value) =>
                                    onChangeRequesterContact({
                                        name: value,
                                    })
                                }
                                value={
                                    state.requesterContact
                                        ? state.requesterContact.name
                                        : null
                                }
                            />
                        </LabelItemPair>
                        <LabelItemPair label={"Tel"}>
                            <ClickableTextField
                                tel
                                onFinished={(value) =>
                                    onChangeRequesterContact({
                                        telephoneNumber: value,
                                    })
                                }
                                value={
                                    state.requesterContact
                                        ? state.requesterContact.telephoneNumber
                                        : null
                                }
                            />
                        </LabelItemPair>
                    </div>
                    <Typography>Priority:</Typography>
                    <div className={classes.priority}>
                        <PrioritySelect
                            onSelect={onSelectPriority}
                            priority={state.priority}
                        />
                    </div>
                    <LabelItemPair label={"Patch"}>
                        <Typography>{state.patch}</Typography>
                    </LabelItemPair>
                </Grid>
            </Grid>
        </Paper>
    );
}

TaskDetailsPanel.propTypes = {
    task: PropTypes.object,
    onSelectPriority: PropTypes.func,
    onChangeRequesterContact: PropTypes.func,
};

TaskDetailsPanel.defaultProps = {
    onSelectPriority: () => {},
    onChangeRequesterContact: () => {},
};

export default TaskDetailsPanel;
