import React, { useEffect } from "react";
import Timeline from "@mui/lab/Timeline";
import TimelineItem from "@mui/lab/TimelineItem";
import TimelineSeparator from "@mui/lab/TimelineSeparator";
import TimelineConnector from "@mui/lab/TimelineConnector";
import TimelineContent from "@mui/lab/TimelineContent";
import TimelineDot from "@mui/lab/TimelineDot";
import TimelineOppositeContent from "@mui/lab/TimelineOppositeContent";
import Typography from "@mui/material/Typography";
import moment from "moment";
import Link from "@mui/material/Link";
import { Link as RouterLink } from "react-router-dom";
import { encodeUUID } from "../../utilities";
import { generateMessage } from "./utilities/functions";
import _ from "lodash";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";
import { ThemedLink } from "../../styles/common";
import { getWhoami } from "../../redux/Selectors";

const displayFields = [
    "location_uuid",
    "location_uuid",
    "patch_id",
    "requester_contact",
    "priority_id",
    "time_of_call",
    "time_picked_up",
    "time_dropped_off",
    "time_cancelled",
    "time_rejected",
];

function ActionsRecord(props) {
    const whoami = useSelector(getWhoami);

    function componentDidMount() {}

    useEffect(componentDidMount, []);
    return (
        <Timeline>
            {[].map((record, index, arr) => {
                if (!record.data_fields)
                    return <React.Fragment key={record.uuid} />;
                const fields = _.intersection(
                    record.data_fields.split(","),
                    displayFields
                );
                if (fields.length > 0) {
                    const userLink =
                        record.calling_user.uuid === whoami.id ? (
                            <Typography style={{ fontWeight: "bold" }}>
                                {"You"}
                            </Typography>
                        ) : (
                            <Link
                                component={RouterLink}
                                to={
                                    "/user/" +
                                    encodeUUID(record.calling_user.uuid)
                                }
                            >
                                <Typography style={{ fontWeight: "bold" }}>
                                    {record.calling_user.display_name}
                                </Typography>
                            </Link>
                        );

                    return (
                        <React.Fragment key={record.uuid}>
                            <TimelineItem>
                                <TimelineOppositeContent>
                                    <Typography color="textSecondary">
                                        {moment(record.time_created).calendar()}
                                    </Typography>
                                </TimelineOppositeContent>
                                <TimelineSeparator>
                                    <TimelineDot
                                        color={
                                            record.http_request_type === "PUT"
                                                ? "primary"
                                                : "secondary"
                                        }
                                    />
                                    {arr.length - 1 === index ? (
                                        <></>
                                    ) : (
                                        <TimelineConnector />
                                    )}
                                </TimelineSeparator>
                                <TimelineContent>
                                    <React.Fragment>
                                        {userLink}
                                        <Typography>
                                            {generateMessage(record, fields)}
                                        </Typography>
                                        {props.taskLinks ? (
                                            <ThemedLink
                                                component={RouterLink}
                                                to={
                                                    "/task/" +
                                                    encodeUUID(
                                                        record.parent_uuid
                                                    )
                                                }
                                            >
                                                <Typography
                                                    style={{
                                                        fontWeight: "bold",
                                                    }}
                                                >
                                                    View Task
                                                </Typography>
                                            </ThemedLink>
                                        ) : (
                                            <></>
                                        )}
                                    </React.Fragment>
                                </TimelineContent>
                            </TimelineItem>
                        </React.Fragment>
                    );
                } else {
                    return <React.Fragment key={record.uuid} />;
                }
            })}
        </Timeline>
    );
}

ActionsRecord.propTypes = {
    parentUUID: PropTypes.string,
    taskLinks: PropTypes.bool,
};

ActionsRecord.defaultProps = {
    taskLinks: false,
};

export default ActionsRecord;
