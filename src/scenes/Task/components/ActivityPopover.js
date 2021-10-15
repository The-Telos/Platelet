import Popover from "@material-ui/core/Popover";
import React from "react";
import {makeStyles} from "@mui/material/styles";
import Button from "@material-ui/core/Button";
import ActionsRecord from "../../ActionsRecord/ActionsRecord";
import PropTypes from "prop-types"


function ActivityPopover(props) {
    const [anchorEl, setAnchorEl] = React.useState(null);
    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const open = Boolean(anchorEl);
    const id = open ? 'assign-rider-popover' : undefined;
    return (
        <React.Fragment>
            <Button onClick={handleClick}>View Activity</Button>
            <Popover
                id={id}
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'center',
                }}
            >
                <ActionsRecord parentUUID={props.parentUUID}/>


            </Popover>
        </React.Fragment>
    )

}

ActivityPopover.propTypes = {
    parentUUID: PropTypes.string
}

export default ActivityPopover;
