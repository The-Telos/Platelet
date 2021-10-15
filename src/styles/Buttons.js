import {styled} from "@mui/styles";
import AddCircleOutline from "@mui/icons-material/AddCircleOutline";

export const StyledAddCircleOutline = styled(AddCircleOutline)({
    cursor: "pointer",
    color: "darkblue",
    width: "80px",
    height: "80px",
    margin: "15px",
    borderRadius: "50%",
    background: "white"
});


export const StyledAddCircleOutlineSmall = styled(AddCircleOutline)({
    cursor: "pointer",
    color: "darkblue",
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    background: "white"
});

export const StyledAddCircleOutlineDisabled = styled(StyledAddCircleOutline)({
    color: "grey",
});


export const StyledAddCircleOutlineSmallDisabled = styled(StyledAddCircleOutlineSmall)({
    color: "grey",
});

