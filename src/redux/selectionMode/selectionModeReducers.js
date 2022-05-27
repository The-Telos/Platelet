import _ from "lodash";
import * as actions from "./selectionModeActions";

export function selectionModeReducer(state = [], action) {
    switch (action.type) {
        case actions.SET_SELECTED_ITEMS:
            return action.items;
        case actions.SELECT_ITEM:
            return { ...state, [action.item.id]: action.item };
        case actions.UNSELECT_ITEM:
            return _.omit(state, action.itemId);
        case actions.CLEAR_ITEMS:
            return {};
        default:
            return state;
    }
}

export function selectionModeAvailableItemsReducer(state = {}, action) {
    switch (action.type) {
        case actions.SET_AVAILABLE_ITEMS:
            return action.availableItems;
        case actions.ADD_TO_AVAILABLE_ITEMS:
            return { ...state, [action.item.id]: action.item };
        case actions.REMOVE_FROM_AVAILABLE_ITEMS:
            return _.omit(state, action.itemId);
        case actions.CLEAR_AVAILABLE_ITEMS:
            return [];
        default:
            return state;
    }
}