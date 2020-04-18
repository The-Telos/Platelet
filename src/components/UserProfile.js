import React, {useState} from "react";
import {PaddedPaper} from "../css/common";
import Grid from "@material-ui/core/Grid";
import {TextFieldControlled} from "./TextFieldControlled";
import IconButton from "@material-ui/core/IconButton";
import EditIcon from "@material-ui/icons/Edit";
import {useDispatch, useSelector} from "react-redux";
import {setCommentsObjectUUID} from "../redux/Actions";
import CommentsSkeleton from "../loadingComponents/CommentsSkeleton";
import CommentsSection from "../containers/CommentsSection";

export default function UserProfile(props) {
    const dispatch = useDispatch()
    const [editMode, setEditMode] = useState(false);
    const whoami = useSelector(state => state.whoami);
    dispatch(setCommentsObjectUUID(props.user.uuid));
    let header = props.user.uuid === whoami.uuid ? <h2>My Profile.</h2> :
        <h2>Profile for {props.user.display_name}</h2>;

    let editToggle = <></>;
    if (whoami.roles.includes("admin") || whoami.uuid === props.user.uuid) {
        editToggle = editMode ?
            <IconButton
                color="inherit"
                aria-controls="simple-menu"
                aria-haspopup="true"
                onClick={() => {
                    setEditMode(!editMode);
                }}>
                <EditIcon/>
            </IconButton> :
            <IconButton
                color="gray"
                aria-controls="simple-menu"
                aria-haspopup="true"
                onClick={() => {
                    setEditMode(!editMode);
                }}>
                <EditIcon/>
            </IconButton>;
    }
    return (
        <PaddedPaper width={"600px"}>
            <Grid container direction={"column"} justify={"flex-start"} alignItems={"top"} spacing={3}>
                <Grid item>
                    <Grid container direction={"row"} justify={"space-between"} alignItems={"top"} spacing={3}>
                        <Grid item>
                            {header}
                        </Grid>
                        <Grid item>
                            {editToggle}
                        </Grid>
                    </Grid>
                </Grid>
                <Grid item>
                    <Grid container direction={"column"} justify={"flex-start"} alignItems={"flex-start"}
                          spacing={1}>
                        <Grid item>
                            <TextFieldControlled
                                value={props.user.name}
                                label={"Name"}
                                id={"users-name"}
                                disabled={!editMode}
                                onChange={() => {
                                }}/>
                        </Grid>
                        <Grid item>
                            <TextFieldControlled
                                value={props.user.display_name}
                                label={"Display Name"}
                                id={"dispay-name"}
                                disabled={!editMode}
                                onChange={() => {
                                }}/>
                        </Grid>
                        <Grid item>
                            <TextFieldControlled
                                value={props.user.email_address}
                                label={"Email Address"}
                                id={"email-address"}
                                disabled={!editMode}
                                onChange={() => {
                                }}/>
                        </Grid>
                        <Grid item>
                            <TextFieldControlled
                                value={props.user.contact_number}
                                label={"Contact Number"}
                                id={"contact-number"}
                                disabled={!editMode}
                                onChange={() => {
                                }}/>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
        </PaddedPaper>
    )
}
