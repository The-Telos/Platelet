import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import TextField from "@mui/material/TextField";
import { useSelector } from "react-redux";
import Autocomplete from '@mui/material/Autocomplete';
import CompactUserCard from "../../../components/CompactUserCard";
import Divider from "@mui/material/Divider";

export const RiderPicker = (props) => {
    const availableUsers = useSelector((state) => state.users.users);
    const [filteredRiderSuggestions, setFilteredRiderSuggestions] = useState(
        []
    );
    const [textBoxValue, setTextBoxValue] = useState(null);
    const onSelect = (event, selectedItem) => {
        if (selectedItem) props.onSelect(selectedItem);
        setTextBoxValue(null);
    };

    useEffect(() => {
        const filteredSuggestions = Object.values(availableUsers).filter(
            (u) => u.roles.includes("rider") && !props.exclude.includes(u.uuid)
        );
        const vehicleUsers = filteredSuggestions.filter(
            (user) => user.assigned_vehicles.length !== 0
        );
        const noVehicleUsers = filteredSuggestions.filter(
            (user) => user.assigned_vehicles.length === 0
        );
        const reorderedUsers = vehicleUsers.concat(noVehicleUsers);
        setFilteredRiderSuggestions(reorderedUsers);
    }, [availableUsers, props.exclude]);

    console.log(availableUsers, 'availableUsers')

    return (
        <div>
            <Autocomplete
                id="combo-box-riders"
                size={props.size}
                value={textBoxValue}
                options={filteredRiderSuggestions}
                getOptionLabel={(option) => option.display_name}
                className={props.className}
                style={{ width: 200 }}
                renderInput={(params) => (
                    <TextField
                        autoFocus
                        {...params}
                        label={props.label}
                        variant="outlined"
                        margin="none"
                    />
                )}
                onChange={onSelect}
                renderOption={(option, { inputValue }) => {
                    const vehicleName =
                        option.assigned_vehicles &&
                        option.assigned_vehicles.length > 0
                            ? option.assigned_vehicles[
                                  option.assigned_vehicles.length - 1
                              ].name
                            : "";

                    return (
                        <div style={{ width: "100%" }}>
                            <CompactUserCard
                                userUUID={option.uuid}
                                displayName={option.display_name}
                                patch={option.patch}
                                profilePictureURL={
                                    option.profile_picture_thumbnail_url
                                }
                                vehicleName={vehicleName}
                            />

                            <Divider />
                        </div>
                    );
                }}
            />
        </div>
    );
}

RiderPicker.defaultProps = {
    onSelect: () => {},
    label: "Select",
    exclude: [],
    className: "",
};
RiderPicker.propTypes = {
    onSelect: PropTypes.func,
    label: PropTypes.string,
    exclude: PropTypes.arrayOf(PropTypes.string),
    className: PropTypes.string,
    size: PropTypes.oneOf(["small", "medium"]),
};
