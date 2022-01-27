export const protectedFields = [
    "id",
    "_version",
    "_lastChangedAt",
    "_deleted",
    "updatedAt",
    "createdAt",
];

export const deliverableIcons = {
    bug: "BUG",
    child: "CHILD",
    document: "DOCUMENT",
    equipment: "EQUIPMENT",
    other: "OTHER",
};

export const userRoles = {
    admin: "ADMIN",
    user: "USER",
    coordinator: "COORDINATOR",
    rider: "RIDER",
};

export const commentVisibility = {
    everyone: "EVERYONE",
    me: "ME",
};

export const tasksStatus = {
    new: "NEW",
    active: "ACTIVE",
    pickedUp: "PICKED_UP",
    droppedOff: "DROPPED_OFF",
    rejected: "REJECTED",
    cancelled: "CANCELLED",
    abandoned: "ABANDONED",
    completed: "COMPLETED",
};

export const priorities = {
    high: "HIGH",
    medium: "MEDIUM",
    low: "LOW",
};

export const deliverableUnits = {
    none: "NONE",
    litre: "LITRE",
    millilitre: "MILLILITRE",
    gram: "GRAM",
    item: "ITEM",
    box: "BOX",
};

export const S3ObjectAccessLevels = {
    protected: "protected",
    public: "public",
    private: "private",
};
