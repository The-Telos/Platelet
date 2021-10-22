import React from "react";
import makeStyles from '@mui/styles/makeStyles';
import {Grid} from '@mui/material';

import { GuidedSetup } from '../GuidedSetup/GuidedSetup'
import { RiderJobActivity } from './components/RiderJobActivity'
import { EnhancedTable } from './components/EnhancedTable'
import { CustomizedDialogs } from '../../components/CustomizedDialogs'


const setupStyles = makeStyles((theme) => ({
    container: {
        position: "fixed",
        left: "0",
        top: "15%",
        width: "100%",
        height: "100%",
    },
    leftPanel: {
        display: "grid",
        alignContent: "space-between",
        background: "white",
        height: "100%",
        padding: "20px 80px",
        borderRight: "solid 2px"
    }
  }));

export const CoordinatorSetup = ({ show, onClose }) => {
    const classes = setupStyles();
    
    return (
        <CustomizedDialogs open={show} onClose={onClose}>
            <Grid container className={classes.container}>
                <Grid item xs={8} className={classes.leftPanel} >
                    <RiderJobActivity />
                    <EnhancedTable />
                </Grid>

                <Grid item xs={4}>
                    <GuidedSetup />
                </Grid>
            </Grid> 
        </CustomizedDialogs>
    )
}