import React from "react";
import Skeleton from '@mui/material/Skeleton';
import Grid from "@mui/material/Grid";

export default function StatsSkeleton(props) {
    return (
        <Grid container
              spacing={1}
              direction={"column"}
              justifyContent={"flex-start"}
              alignItems={"center"}
        >
            {[...Array(props.count ? props.count : 4)].map((x, i) =>
                <Grid item key={i}>
                    <Skeleton variant="text" width={600} height={500}/>
                </Grid>)}
        </Grid>
    );
}
