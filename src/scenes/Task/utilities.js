import { DataStore } from "aws-amplify";
import * as models from "../../models";
import determineTaskStatus from "../../utilities/determineTaskStatus";

export async function saveTaskTimeWithKey(key, value, taskId, taskAssignees) {
    let isoString = null;
    if (value) {
        isoString = new Date(value).toISOString();
    }
    const existingTask = await DataStore.query(models.Task, taskId);
    if (!existingTask) throw new Error("Task doesn't exist");
    const status = await determineTaskStatus(
        {
            ...existingTask,
            [key]: isoString,
        },
        taskAssignees.filter((ta) => ta.role === models.Role.RIDER)
    );
    return DataStore.save(
        models.Task.copyOf(existingTask, (updated) => {
            updated[key] = value ? isoString : null;
            updated.status = status;
        })
    );
}
