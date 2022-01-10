import React from "react";
import uuidBase62 from "uuid-base62";
import { v4 as uuidv4 } from "uuid";
import { deliverableIcons, tasksStatus, userRoles } from "./apiConsts";
import BugIcon from "./components/deliverableIcons/BugIcon";
import ChildIcon from "./components/deliverableIcons/ChildIcon";
import EquipmentIcon from "./components/deliverableIcons/EquipmentIcon";
import OtherIcon from "./components/deliverableIcons/OtherIcon";
import DocumentIcon from "./components/deliverableIcons/DocumentIcon";
import moment from "moment";

export function convertListDataToObject(list) {
    const result = {};
    for (const item of list) {
        result[item.id] = item;
    }
    return result;
}

export function copyTaskDataToClipboard(task) {
    const {
        pickUpLocation,
        priority,
        dropOffLocation,
        timeOfCall,
        deliverables,
    } = task;
    const data = {
        TOC: timeOfCall ? moment(timeOfCall).format("HH:mm") : undefined,
        FROM: pickUpLocation
            ? `${pickUpLocation.ward || ""} - ${pickUpLocation.line1 || ""}`
            : undefined,
        TO: dropOffLocation
            ? `${dropOffLocation.ward || ""} - ${dropOffLocation.line1 || ""}`
            : undefined,
        PRIORITY: priority ? priority.toLowerCase() : undefined,
    };

    if (deliverables) {
        data["ITEMS"] = deliverables
            .map((deliverable) => {
                const { deliverableType, count } = deliverable;
                return `${
                    deliverableType ? deliverableType.label : ""
                } x ${count}`;
            })
            .join(", ");
    }

    let result = "";
    let first = true;
    for (const [key, value] of Object.entries(data)) {
        if (value) result += `${first ? "" : " "}${key}: ${value}`;
        first = false;
    }

    return navigator.clipboard.writeText(result);
}

export function getDeliverableIconByEnum(deliverableType, size) {
    switch (deliverableType) {
        case deliverableIcons.bug:
            return <BugIcon size={size} />;
        case deliverableIcons.document:
            return <DocumentIcon size={size} />;
        case deliverableIcons.child:
            return <ChildIcon size={size} />;
        case deliverableIcons.equipment:
            return <EquipmentIcon size={size} />;
        default:
            return <OtherIcon size={size} />;
    }
}

export function determineTaskStatus(task) {
    // sort out cancelled and rejected first
    if (!!task.timeCancelled) {
        return tasksStatus.cancelled;
    } else if (!!task.timeRejected) {
        return tasksStatus.rejected;
    }
    if (!task.assignees) {
        return tasksStatus.new;
    }
    const assignedRiders = Object.values(task.assignees).filter(
        (a) => a.role === userRoles.rider
    );
    if (!assignedRiders || assignedRiders.length === 0) {
        return tasksStatus.new;
    } else if (
        assignedRiders &&
        assignedRiders.length > 0 &&
        !!!task.timePickedUp
    ) {
        return tasksStatus.active;
    } else if (
        assignedRiders &&
        assignedRiders.length > 0 &&
        !!task.timePickedUp &&
        !!!task.timeDroppedOff
    ) {
        return tasksStatus.pickedUp;
    } else if (
        assignedRiders &&
        assignedRiders.length > 0 &&
        !!task.timePickedUp &&
        !!task.timeDroppedOff &&
        !!!task.timeRiderHome
    ) {
        return tasksStatus.droppedOff;
    } else if (
        assignedRiders &&
        assignedRiders.length > 0 &&
        !!task.timePickedUp &&
        !!task.timeDroppedOff &&
        !!task.timeRiderHome
    ) {
        return tasksStatus.completed;
    }
}

export function taskStatusHumanReadable(status) {
    switch (status) {
        case "NEW":
            return "New";
        case "ACTIVE":
            return "Active";
        case "PICKED_UP":
            return "Picked up";
        case "DROPPED_OFF":
            return "Delivered";
        case "REJECTED":
            return "Rejected";
        case "CANCELLED":
            return "Cancelled";
        case "COMPLETED":
            return "Completed";
        default:
            return "Unknown status";
    }
}

export function sortByCreatedTime(items, order = "newest") {
    if (!items || items.length === 0) return [];
    if (order !== "newest")
        return items.sort((a, b) => {
            return new Date(a.createdAt) - new Date(b.createdAt);
        });
    else
        return items.sort((a, b) => {
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
}

export function sortByTimeOfCall(items, order = "newest") {
    if (!items || items.length === 0) return [];
    if (order !== "newest")
        return items.sort((a, b) => {
            return new Date(a.timeOfCall) - new Date(b.timeOfCall);
        });
    else
        return items.sort((a, b) => {
            return new Date(b.timeOfCall) - new Date(a.timeOfCall);
        });
}

export function encodeUUID(uuid) {
    return uuid ? uuidBase62.encode(uuid) : "";
}

export function decodeUUID(uuid) {
    return uuid ? uuidBase62.decode(uuid) : "";
}

export function convertDate(timestamp) {
    if (timestamp) {
        return new Date(timestamp).toLocaleString();
    }
    return "";
}

export function saveDashboardRoleMode(mode) {
    localStorage.setItem("dashboardRoleMode", mode);
}

export function getDashboardRoleMode() {
    return localStorage.getItem("dashboardRoleMode") || "all";
}

export function saveLogin(apiBearer) {
    localStorage.setItem("apiBearer", apiBearer);
}

export function getLogin() {
    return localStorage.getItem("apiBearer") || "";
}

export function createTabIdentifier() {
    const tabUUID = uuidv4();
    sessionStorage.setItem("tabUUID", tabUUID);
    return tabUUID;
}

export function getTabIdentifier() {
    return sessionStorage.getItem("tabUUID");
}

export function saveApiURL(apiURL) {
    localStorage.setItem("apiURL", apiURL);
}

export function getApiURL() {
    return process.env.REACT_APP_API_URL;
}

export function getSocketApiURL() {
    return process.env.REACT_APP_SOCKET_API_URL;
}

export function deleteLogin() {
    localStorage.removeItem("apiBearer");
}

export function deleteApiURL() {
    localStorage.removeItem("apiURL");
}

export function saveLocalStorageViewMode(status) {
    localStorage.setItem("viewMode", status);
}

export function getLocalStorageViewMode() {
    return localStorage.getItem("viewMode");
}

export function debounce(func, delay) {
    let inDebounce;
    let result;
    return function () {
        const context = this;
        const args = arguments;
        clearTimeout(inDebounce);
        inDebounce = setTimeout(
            () => (result = func.apply(context, args)),
            delay
        );
        return result;
    };
}

export function throttle(func, limit) {
    let lastFunc;
    let lastRan;
    let result;
    return function () {
        const context = this;
        const args = arguments;
        if (!lastRan) {
            result = func.apply(context, args);
            lastRan = Date.now();
        } else {
            clearTimeout(lastFunc);
            lastFunc = setTimeout(function () {
                if (Date.now() - lastRan >= limit) {
                    result = func.apply(context, args);
                    lastRan = Date.now();
                }
            }, limit - (Date.now() - lastRan));
        }
        return result;
    };
}

export function orderTaskList(tasks) {
    let tasksNew = [];
    let tasksActivePickedUp = [];
    let tasksDelivered = [];
    let tasksCancelled = [];
    let tasksRejected = [];
    if (!tasks)
        return {
            tasksNew: [],
            tasksActive: [],
            tasksPickedUp: [],
            tasksDelivered: [],
        };
    tasks.forEach((task) => {
        if (typeof task.time_of_call === "string") {
            task.time_of_call = new Date(task.time_of_call);
        }
        if (task.time_cancelled) {
            tasksCancelled.unshift(task);
        } else if (task.time_rejected) {
            tasksRejected.unshift(task);
        } else if (!task.assigned_riders || !task.assigned_riders.length) {
            tasksNew.unshift(task);
        } else if (
            (task.assigned_riders.length || task.time_picked_up) &&
            !task.time_dropped_off
        ) {
            tasksActivePickedUp.unshift(task);
        } else if (task.time_dropped_off) {
            tasksDelivered.unshift(task);
        } else {
            tasksNew.unshift(task);
        }
    });

    tasksNew.sort(function (a, b) {
        return a.time_of_call > b.time_of_call
            ? -1
            : a.time_of_call < b.time_of_call
            ? 1
            : 0;
    });
    tasksCancelled.sort(function (a, b) {
        return a.time_of_call > b.time_of_call
            ? -1
            : a.time_of_call < b.time_of_call
            ? 1
            : 0;
    });
    tasksRejected.sort(function (a, b) {
        return a.time_of_call > b.time_of_call
            ? -1
            : a.time_of_call < b.time_of_call
            ? 1
            : 0;
    });
    tasksActivePickedUp.sort(function (b, a) {
        return a.time_of_call > b.time_of_call
            ? -1
            : a.time_of_call < b.time_of_call
            ? 1
            : 0;
    });
    tasksDelivered.sort(function (b, a) {
        return a.time_of_call > b.time_of_call
            ? -1
            : a.time_of_call < b.time_of_call
            ? 1
            : 0;
    });
    const tasksRejectedCancelled = tasksCancelled.concat(tasksRejected);
    return {
        tasksNew,
        tasksActivePickedUp,
        tasksDelivered,
        tasksRejectedCancelled,
    };
}

function determineTaskFinishedState(task) {
    if (task.relay_next) {
        return determineTaskFinishedState(task.relay_next);
    } else {
        return !!task.time_dropped_off;
    }
}

function recursiveRelaySearch(uuidToFind, task) {
    if (task.uuid === uuidToFind) {
        return true;
    } else if (task.relay_next) {
        return recursiveRelaySearch(uuidToFind, task.relay_next);
    } else {
        return false;
    }
}

export function spliceExistingTask(tasks, uuid) {
    let result = {};
    let listType = undefined;
    let index = undefined;
    let task = undefined;
    for (const [type, value] of Object.entries(tasks)) {
        result = value.find((task) => task.uuid === uuid);
        if (result) {
            index = value.indexOf(result);
            task = value.splice(index, 1)[0];
            listType = type;
        }
    }
    return { listType, index, task };
}
