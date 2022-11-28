import { Stack } from "@mui/material";
import * as models from "../../../models";
import { DataStore } from "aws-amplify";
import React from "react";
import TaskHandoverCard from "./TaskHandoverCard";

type TaskHandoversListProps = {
    taskId: string;
};

const TaskHandoversList: React.FC<TaskHandoversListProps> = ({ taskId }) => {
    const [handovers, setHandovers] = React.useState<models.Handover[]>([]);
    const getHandovers = React.useCallback(async () => {
        const result = (await DataStore.query(models.Handover)).filter(
            (h) => h.task?.id === taskId
        );
        setHandovers(result);
    }, [taskId]);

    React.useEffect(() => {
        getHandovers();
    }, [getHandovers]);
    return (
        <Stack direction="column">
            {handovers.map((h) => (
                <TaskHandoverCard key={h.id} handover={h} />
            ))}
        </Stack>
    );
};

export default TaskHandoversList;
