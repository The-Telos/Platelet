import { DataStore } from "aws-amplify";
import { render } from "../../../test-utils";
import * as models from "../../../models";
import TaskHandoversList from "./TaskHandoversList";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const tenantId = "tenantId";

const preloadedState = {
    tenantId,
};

describe("TaskHandoversList", () => {
    beforeEach(async () => {
        jest.restoreAllMocks();
        const existingHandovers = await DataStore.query(models.Handover);
        const existingTasks = await DataStore.query(models.Task);
        const existingUsers = await DataStore.query(models.User);
        const existingLocations = await DataStore.query(models.Location);
        await Promise.all(
            [
                ...existingUsers,
                ...existingTasks,
                ...existingHandovers,
                ...existingLocations,
            ].map((i) => DataStore.delete(i))
        );
    });
    it("should display the handovers in order", async () => {
        const mockTask = await DataStore.save(
            new models.Task({
                status: models.TaskStatus.NEW,
                tenantId,
            })
        );
        const mockLocation = await DataStore.save(
            new models.Location({
                name: "Test Location",
                line1: "Test Line 1",
                tenantId,
            })
        );
        const mockLocation2 = await DataStore.save(
            new models.Location({
                name: "Test Location",
                line1: "Test Line 2",
                tenantId,
            })
        );
        const mockLocation3 = await DataStore.save(
            new models.Location({
                name: "Test Location",
                line1: "Test Line 3",
                tenantId,
            })
        );
        await DataStore.save(
            new models.Handover({
                task: mockTask,
                orderInGrid: 2,
                handoverLocation: mockLocation,
                tenantId,
            })
        );
        await DataStore.save(
            new models.Handover({
                task: mockTask,
                orderInGrid: 1,
                handoverLocation: mockLocation2,
                tenantId,
            })
        );
        await DataStore.save(
            new models.Handover({
                task: mockTask,
                orderInGrid: 3,
                handoverLocation: mockLocation3,
                tenantId,
            })
        );
        const querySpy = jest.spyOn(DataStore, "query");
        render(<TaskHandoversList taskId={mockTask.id} />, { preloadedState });
        await waitFor(() => {
            expect(querySpy).toHaveBeenCalledWith(models.Handover);
        });
        expect(screen.getByText(mockLocation.line1)).toBeInTheDocument();
        expect(screen.getByText(mockLocation2.line1)).toBeInTheDocument();
        expect(screen.getByText(mockLocation3.line1)).toBeInTheDocument();
        expect(screen.getByText(mockLocation2.line1).nextSibling).toBe(
            screen.getByText(mockLocation.line1)
        );
        //expect(screen.getByText(mockLocation.line1).nextSibling).toBe(
        //    screen.getByText(mockLocation3.line1)
        //);
    });

    test("add a new handover", async () => {
        const mockTask = await DataStore.save(
            new models.Task({
                status: models.TaskStatus.NEW,
                tenantId,
            })
        );
        const querySpy = jest.spyOn(DataStore, "query");
        const saveSpy = jest.spyOn(DataStore, "save");
        render(<TaskHandoversList taskId={mockTask.id} />, { preloadedState });
        await waitFor(() => {
            expect(querySpy).toHaveBeenCalled();
        });
        userEvent.click(screen.getByRole("button", { name: "Add handover" }));
        await waitFor(() => {
            expect(saveSpy).toHaveBeenCalledWith({
                id: expect.any(String),
                task: mockTask,
                tenantId,
            });
        });
        expect(
            await screen.findByRole("combobox", { name: "Search locations..." })
        ).toBeInTheDocument();
    });

    test("add a handover and set the location", async () => {
        const mockTask = await DataStore.save(
            new models.Task({
                status: models.TaskStatus.NEW,
                tenantId,
            })
        );
        const mockLocation = await DataStore.save(
            new models.Location({
                name: "Test Location",
                line1: "Test Line 1",
                listed: 1,
                tenantId,
            })
        );
        const querySpy = jest.spyOn(DataStore, "query");
        const saveSpy = jest.spyOn(DataStore, "save");
        render(<TaskHandoversList taskId={mockTask.id} />, { preloadedState });
        await waitFor(() => {
            expect(querySpy).toHaveBeenCalled();
        });
        userEvent.click(screen.getByRole("button", { name: "Add handover" }));
        await waitFor(() => {
            expect(saveSpy).toHaveBeenCalledWith({
                id: expect.any(String),
                task: mockTask,
                tenantId,
            });
        });
        const locationBox = await screen.findByRole("combobox", {
            name: "Search locations...",
        });
        userEvent.type(locationBox, "Test Location");
        userEvent.click(await screen.findByText(mockLocation.name));
        await waitFor(() => {
            expect(saveSpy).toHaveBeenCalledWith({
                id: expect.any(String),
                task: mockTask,
                handoverLocation: mockLocation,
                tenantId,
            });
        });
    });

    test("set the location failure", async () => {
        const mockTask = await DataStore.save(
            new models.Task({
                status: models.TaskStatus.NEW,
                tenantId,
            })
        );
        const mockLocation = await DataStore.save(
            new models.Location({
                name: "Test Location",
                line1: "Test Line 1",
                listed: 1,
                tenantId,
            })
        );
        await DataStore.save(
            new models.Handover({
                task: mockTask,
                tenantId,
            })
        );
        const querySpy = jest.spyOn(DataStore, "query");
        const saveSpy = jest
            .spyOn(DataStore, "save")
            .mockRejectedValue(new Error("Test Error"));
        render(<TaskHandoversList taskId={mockTask.id} />, { preloadedState });
        await waitFor(() => {
            expect(querySpy).toHaveBeenCalled();
        });
        const locationBox = await screen.findByRole("combobox", {
            name: "Search locations...",
        });
        userEvent.type(locationBox, "Test Location");
        userEvent.click(await screen.findByText(mockLocation.name));
        await waitFor(() => {
            expect(saveSpy).toHaveBeenCalledWith({
                id: expect.any(String),
                task: mockTask,
                handoverLocation: mockLocation,
                tenantId,
            });
        });
        expect(
            screen.getByText("Sorry, something went wrong")
        ).toBeInTheDocument();
    });

    test("delete a handover", async () => {
        const mockTask = await DataStore.save(
            new models.Task({
                status: models.TaskStatus.NEW,
                tenantId,
            })
        );
        const mockHandover = await DataStore.save(
            new models.Handover({
                task: mockTask,
                tenantId,
            })
        );
        const querySpy = jest.spyOn(DataStore, "query");
        const deleteSpy = jest.spyOn(DataStore, "delete");
        render(<TaskHandoversList taskId={mockTask.id} />, { preloadedState });
        await waitFor(() => {
            expect(querySpy).toHaveBeenCalled();
        });
        userEvent.click(screen.getByRole("button", { name: "Clear handover" }));
        await waitFor(() => {
            expect(deleteSpy).toHaveBeenCalledWith(mockHandover);
        });
        expect(
            screen.queryAllByRole("button", { name: "Clear handover" }).length
        ).toBe(0);
    });

    test("the observer reacts to new handovers", async () => {
        const mockTask = await DataStore.save(
            new models.Task({
                status: models.TaskStatus.NEW,
                tenantId,
            })
        );
        const mockLocation = await DataStore.save(
            new models.Location({
                name: "Test Location",
                line1: "Test Line 1",
                tenantId,
            })
        );
        const querySpy = jest.spyOn(DataStore, "query");
        render(<TaskHandoversList taskId={mockTask.id} />, { preloadedState });
        await waitFor(() => {
            expect(querySpy).toHaveBeenCalled();
        });
        await DataStore.save(
            new models.Handover({
                task: mockTask,
                handoverLocation: mockLocation,
            })
        );
        expect(await screen.findByText(mockLocation.line1)).toBeInTheDocument();
    });

    test("the observer reacts to updated handovers", async () => {
        const mockTask = await DataStore.save(
            new models.Task({
                status: models.TaskStatus.NEW,
                tenantId,
            })
        );
        const mockLocation = await DataStore.save(
            new models.Location({
                name: "Test Location",
                line1: "Test Line 1",
                tenantId,
            })
        );
        const mockHandover = await DataStore.save(
            new models.Handover({
                task: mockTask,
                tenantId,
            })
        );
        const querySpy = jest.spyOn(DataStore, "query");
        render(<TaskHandoversList taskId={mockTask.id} />, { preloadedState });
        await waitFor(() => {
            expect(querySpy).toHaveBeenCalled();
        });
        expect(
            await screen.findByRole("combobox", { name: "Search locations..." })
        ).toBeInTheDocument();
        await DataStore.save(
            models.Handover.copyOf(mockHandover, (updated) => {
                updated.handoverLocation = mockLocation;
            })
        );
        expect(await screen.findByText(mockLocation.line1)).toBeInTheDocument();
    });

    test("the observer reacts to deleted handovers", async () => {
        const mockTask = await DataStore.save(
            new models.Task({
                status: models.TaskStatus.NEW,
                tenantId,
            })
        );
        const mockLocation = await DataStore.save(
            new models.Location({
                name: "Test Location",
                line1: "Test Line 1",
                tenantId,
            })
        );
        const mockHandover = await DataStore.save(
            new models.Handover({
                task: mockTask,
                handoverLocation: mockLocation,
                tenantId,
            })
        );
        const querySpy = jest.spyOn(DataStore, "query");
        render(<TaskHandoversList taskId={mockTask.id} />, { preloadedState });
        await waitFor(() => {
            expect(querySpy).toHaveBeenCalled();
        });
        expect(await screen.findByText(mockLocation.line1)).toBeInTheDocument();
        await DataStore.delete(mockHandover);
        await waitFor(() => {
            expect(screen.queryByText(mockLocation.line1)).toBeNull();
        });
    });

    test("failure to get handovers", async () => {
        const mockTask = await DataStore.save(
            new models.Task({
                status: models.TaskStatus.NEW,
                tenantId,
            })
        );
        const querySpy = jest.spyOn(DataStore, "query");
        querySpy.mockRejectedValueOnce("Test error");
        render(<TaskHandoversList taskId={mockTask.id} />, { preloadedState });
        await waitFor(() => {
            expect(querySpy).toHaveBeenCalled();
        });
        expect(
            await screen.findByText("Something went wrong.")
        ).toBeInTheDocument();
    });
});
