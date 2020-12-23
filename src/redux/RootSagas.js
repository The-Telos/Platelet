import {
    watchPostNewTask,
    watchPostNewTaskRelay,
    watchGetTasks,
    watchUpdateTask,
    watchGetMyTasks,
    watchGetTask,
    watchDeleteTask,
    watchRestoreTask,
    watchUpdateTaskDropoffAddress,
    watchUpdateTaskDropoffTime,
    watchUpdateTaskPickupTime,
    watchUpdateTaskPickupAddress,
    watchUpdateTaskPickupAddressFromSaved,
    watchUpdateTaskPriority,
    watchUpdateTaskCancelledTime,
    watchUpdateTaskRejectedTime,
    watchUpdateTaskPatch,
    watchRefreshTasks,
    watchRefreshMyTasks,
    watchUpdateTaskPatchFromServer,
    watchUpdateTaskDropoffAddressFromSaved,
    watchUpdateTaskRequesterContact,
    watchSetRoleViewAndGetTasks,
    watchRefreshTasksFromSocket
} from "./tasks/TasksSagas"
import {
    watchDeleteDeliverable,
    watchGetAvailableDeliverables,
    watchGetDeliverables,
    watchPostNewDeliverable,
    watchUpdateDeliverable
} from "./deliverables/DeliverablesSagas"
import {
    watchDeleteComment, watchDeleteSidebarComment,
    watchGetComments,
    watchGetSidebarComments,
    watchPostNewComment,
    watchPostNewSidebarComment, watchRestoreComment, watchRestoreSidebarComment, watchUpdateComment,
    watchUpdateSidebarComment
} from "./comments/CommentsSagas";
import {
    watchPostNewVehicle,
    watchGetVehicles,
    watchUpdateVehicle,
    watchVehicle,
    watchDeleteVehicle,
    watchRestoreVehicle,
    watchUpdateVehicleName,
    watchUpdateVehicleManufacturer,
    watchUpdateVehicleModel, watchUpdateVehicleRegistration
} from "./vehicles/VehiclesSagas"

import { all, call } from 'redux-saga/effects'
import {watchGetAvailablePriorities} from "./priorities/PrioritiesSagas";
import {watchGetAvailableLocations, watchGetLocation} from "./locations/LocationsSagas";
import {
    watchGetUsers,
    watchGetUser,
    watchAddUser,
    watchDeleteUser,
    watchRestoreUser,
    watchUpdateUser, watchUpdateUserPassword, watchUploadUserProfilePicture
} from "./users/UsersSagas";
import {watchGetWhoami, watchRefreshWhoami} from "./WhoamiSaga";
import {watchLogin, watchLogout, watchRefreshTokenLoop} from "./login/LoginSagas"
import {watchGetAvailablePatches} from "./patches/PatchesSagas";
import {watchGetServerSettings} from "./ServerSettings/ServerSettingsSagas";
import {
    watchGetTaskAssignedRiders, watchUpdateTaskAddAssignedCoordinator,
    watchUpdateTaskAddAssignedRider, watchUpdateTaskRemoveCoordinator,
    watchUpdateTaskRemoveRider
} from "./taskAssignees/TaskAssigneesSagas";
import {
    watchGetActionsRecord,
    watchGetTasksActionsRecord,
} from "./actionsRecord/ActionsRecordSagas";
import {watchGetUserStatistics} from "./statistics/statisticsSagas";
import {
    watchAppendTasksCancelled,
    watchAppendTasksDelivered,
    watchAppendTasksRejected
} from "./tasks/TaskWaypointSagas";
import {watchInitialiseApp} from "./initialise/initialiseSagas";

export default function* rootSaga() {
    yield all([
        call(watchPostNewTask),
        call(watchPostNewTaskRelay),
        call(watchDeleteTask),
        call(watchGetTask),
        call(watchGetTasks),
        call(watchRefreshTasks),
        call(watchRefreshMyTasks),
        call(watchUpdateTask),
        call(watchGetTaskAssignedRiders),
        call(watchUpdateTaskAddAssignedRider),
        call(watchUpdateTaskAddAssignedCoordinator),
        call(watchUpdateTaskRemoveRider),
        call(watchUpdateTaskRemoveCoordinator),
        call(watchUpdateTaskRequesterContact),
        call(watchUpdateTaskDropoffAddress),
        call(watchUpdateTaskPickupAddress),
        call(watchUpdateTaskPickupAddressFromSaved),
        call(watchUpdateTaskDropoffAddressFromSaved),
        call(watchUpdateTaskDropoffTime),
        call(watchUpdateTaskPickupTime),
        call(watchUpdateTaskPriority),
        call(watchUpdateTaskPatch),
        call(watchUpdateTaskPatchFromServer),
        call(watchUpdateTaskCancelledTime),
        call(watchUpdateTaskRejectedTime),
        call(watchGetMyTasks),
        call(watchDeleteDeliverable),
        call(watchGetDeliverables),
        call(watchGetAvailableDeliverables),
        call(watchGetAvailablePriorities),
        call(watchGetAvailableLocations),
        call(watchGetLocation),
        call(watchPostNewDeliverable),
        call(watchUpdateDeliverable),
        call(watchGetVehicles),
        call(watchUpdateVehicle),
        call(watchUpdateVehicleName),
        call(watchUpdateVehicleManufacturer),
        call(watchUpdateVehicleModel),
        call(watchUpdateVehicleRegistration),
        call(watchPostNewVehicle),
        call(watchVehicle),
        call(watchDeleteVehicle),
        call(watchRestoreVehicle),
        call(watchGetUsers),
        call(watchGetUser),
        call(watchGetWhoami),
        call(watchRefreshWhoami),
        call(watchLogin),
        call(watchLogout),
        call(watchRestoreTask),
        call(watchGetAvailablePatches),
        call(watchGetComments),
        call(watchUpdateComment),
        call(watchPostNewComment),
        call(watchDeleteComment),
        call(watchRestoreComment),
        call(watchGetSidebarComments),
        call(watchUpdateSidebarComment),
        call(watchDeleteSidebarComment),
        call(watchRestoreSidebarComment),
        call(watchPostNewSidebarComment),
        call(watchGetServerSettings),
        call(watchAddUser),
        call(watchDeleteUser),
        call(watchRestoreUser),
        call(watchUpdateUser),
        call(watchUploadUserProfilePicture),
        call(watchUpdateUserPassword),
        call(watchGetActionsRecord),
        call(watchGetTasksActionsRecord),
        call(watchSetRoleViewAndGetTasks),
        call(watchRefreshTasksFromSocket),
        call(watchGetUserStatistics),
        call(watchAppendTasksCancelled),
        call(watchAppendTasksRejected),
        call(watchAppendTasksDelivered),
        call(watchInitialiseApp),
        call(watchRefreshTokenLoop)
    ])
}
