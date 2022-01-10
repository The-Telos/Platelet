import { DataStore } from "aws-amplify";
import * as models from "../../models";
import { determineTaskStatus } from "../../utilities";

export async function saveTaskTimeWithKey(key, value, taskId) {
    let isoString = null;
    if (value) {
        isoString = new Date(value).toISOString();
    }
    const existingTask = await DataStore.query(models.Task, taskId);
    if (!existingTask) throw new Error("Task doesn't exist");
    const assignees = (await DataStore.query(models.TaskAssignee)).filter(
        (a) => a.task && a.task.id === taskId
    );
    const status = determineTaskStatus({
        ...existingTask,
        [key]: isoString,
        assignees,
    });
    if (existingTask.status === status) {
        return await DataStore.save(
            models.Task.copyOf(existingTask, (updated) => {
                updated[key] = value ? isoString : null;
                updated.status = status;
            })
        );
    } else {
        return await DataStore.save(
            models.Task.copyOf(existingTask, (updated) => {
                updated[key] = value ? isoString : null;
                updated.status = status;
            })
        );
    }
}
