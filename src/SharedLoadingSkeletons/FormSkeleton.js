import React from "react";
import Skeleton from '@mui/material/Skeleton';
import Grid from "@mui/material/Grid";

export default function FormSkeleton(props) {
    return (
            <Grid container
                  spacing={3}
                  direction={"row"}
                  justify={"flex-start"}
                  alignItems={"center"}
            >
                {[...Array(props.count ? props.count : 10)].map((x, i) =>
                    <Grid item xs sm md lg key={i}>
                        <Skeleton variant="text" width={500} height={100}/>
                    </Grid>)}
            </Grid>
    )
}
