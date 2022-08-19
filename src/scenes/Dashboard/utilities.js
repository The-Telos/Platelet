import { DataStore } from "aws-amplify";
import * as models from "../../models/index";
import { tasksStatus } from "../../apiConsts";
import { userRoles } from "../../apiConsts";
export const concatTasks = (tasks) =>
    Object.entries(tasks).reduce((accumulator, [key, value]) => {
        return [...accumulator, value.map((t) => t)];
    }, []);

export const getTaskUUIDs = (tasks) => {
    let result = [];
    for (const value of Object.values(tasks)) {
        for (const group of Object.values(value)) {
            result = [...result, ...Object.keys(group)];
        }
    }
    return result;
};

export async function addTask(whoamiId, tenantId) {
    const date = new Date();
    const today = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    if (!whoamiId || !tenantId) {
        throw new Error("Missing required parameters");
    }
    const date = new Date();
    const timeOfCall = date.toISOString();
    const createdBy = whoamiId
        ? await DataStore.query(models.User, whoamiId)
        : null;
    const newTask = await DataStore.save(
        new models.Task({
            status: tasksStatus.new,
            timeOfCall,
            createdBy,
            tenantId,
            dateCreated: today.toISOString().split("T")[0],
        })
    );
    await DataStore.save(
        new models.TaskAssignee({
            task: newTask,
            assignee: createdBy,
            role: userRoles.coordinator,
            tenantId,
        })
    );
    return newTask;
}

export const getTaskUUIDEtags = (tasks) => {
    let result = {};
    for (const value of Object.values(tasks)) {
        for (const group of Object.values(value)) {
            for (const task of Object.values(group)) {
                result[task.uuid] = task.etag;
            }
        }
    }
    return result;
};
