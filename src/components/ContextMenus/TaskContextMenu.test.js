import { render } from "../../test-utils";
import { mockAllIsIntersecting } from "react-intersection-observer/test-utils";
import TaskContextMenu from "./TaskContextMenu";
import { DataStore } from "aws-amplify";
import * as models from "../../models";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TasksGridColumn from "../../scenes/Dashboard/components/TasksGridColumn";
import * as copyTaskDataToClipboard from "../../utilities/copyTaskDataToClipboard";

const tenantId = "tenantId";

describe("TaskContextMenu", () => {
    const RealDate = Date;
    const isoDate = "2021-11-29T23:24:58.987Z";
    const dateString = "2021-11-29";

    function mockDate() {
        global.Date = class extends RealDate {
            constructor() {
                super();
                return new RealDate(isoDate);
            }
        };
    }

    afterEach(async () => {
        global.Date = RealDate;
    });
    beforeEach(async () => {
        jest.restoreAllMocks();
        mockDate();
    });

    test("cancel a task", async () => {
        const task = await DataStore.save(
            new models.Task({
                status: models.TaskStatus.NEW,
            })
        );
        const saveSpy = jest.spyOn(DataStore, "save");
        render(<TaskContextMenu task={task} assignedRiders={[]} />);
        const button = screen.getByRole("button", { name: "task options" });
        userEvent.click(button);
        userEvent.click(
            screen.getByRole("menuitem", { name: "Mark cancelled" })
        );
        await waitFor(() => {
            expect(saveSpy).toHaveBeenCalledWith({
                ...task,
                timeCancelled: isoDate,
                status: models.TaskStatus.CANCELLED,
            });
        });
        await waitFor(() => {
            expect(
                screen.getByText("Task marked cancelled")
            ).toBeInTheDocument();
        });
        // undo
        userEvent.click(screen.getByRole("button", { name: "UNDO" }));
        await waitFor(() => {
            expect(saveSpy).toHaveBeenCalledWith({
                ...task,
                timeCancelled: null,
            });
        });
    });

    test("cancel a task failure", async () => {
        const task = await DataStore.save(
            new models.Task({
                status: models.TaskStatus.NEW,
            })
        );
        const saveSpy = jest
            .spyOn(DataStore, "save")
            .mockRejectedValue(new Error());
        render(<TaskContextMenu task={task} assignedRiders={[]} />);
        const button = screen.getByRole("button", { name: "task options" });
        userEvent.click(button);
        userEvent.click(
            screen.getByRole("menuitem", { name: "Mark cancelled" })
        );
        await waitFor(() => {
            expect(saveSpy).toHaveBeenCalledTimes(1);
        });
        await waitFor(() => {
            expect(
                screen.getByText("Sorry, something went wrong")
            ).toBeInTheDocument();
        });
    });

    test("reject a task", async () => {
        const task = await DataStore.save(
            new models.Task({
                status: models.TaskStatus.NEW,
            })
        );
        const saveSpy = jest.spyOn(DataStore, "save");
        render(<TaskContextMenu task={task} assignedRiders={[]} />);
        const button = screen.getByRole("button", { name: "task options" });
        userEvent.click(button);
        userEvent.click(
            screen.getByRole("menuitem", { name: "Mark rejected" })
        );
        await waitFor(() => {
            expect(saveSpy).toHaveBeenCalledWith({
                ...task,
                timeRejected: isoDate,
                status: models.TaskStatus.REJECTED,
            });
        });
        await waitFor(() => {
            expect(
                screen.getByText("Task marked rejected")
            ).toBeInTheDocument();
        });
        // undo
        userEvent.click(screen.getByRole("button", { name: "UNDO" }));
        await waitFor(() => {
            expect(saveSpy).toHaveBeenCalledWith({
                ...task,
                timeRejected: null,
            });
        });
    });

    test("mark a task picked up", async () => {
        const task = await DataStore.save(
            new models.Task({
                status: models.TaskStatus.ACTIVE,
            })
        );
        const fakeRider = await DataStore.save(
            new models.User({
                displayName: "Someone person",
                roles: [models.Role.USER, models.Role.RIDER],
            })
        );
        const fakeAssignment = await DataStore.save(
            new models.TaskAssignee({
                task,
                assignee: fakeRider,
                role: models.Role.RIDER,
            })
        );
        const preloadedState = {
            taskAssigneesReducer: {
                items: [fakeAssignment],
                ready: true,
                isSynced: true,
            },
        };
        const saveSpy = jest.spyOn(DataStore, "save");
        render(
            <TaskContextMenu task={task} assignedRiders={[fakeAssignment]} />,
            { preloadedState }
        );
        const button = screen.getByRole("button", { name: "task options" });
        userEvent.click(button);
        userEvent.click(
            screen.getByRole("menuitem", { name: "Mark picked up" })
        );
        await waitFor(() => {
            expect(saveSpy).toHaveBeenCalledWith({
                ...task,
                timePickedUp: isoDate,
                status: models.TaskStatus.PICKED_UP,
            });
        });
        await waitFor(() => {
            expect(
                screen.getByText("Task marked picked up")
            ).toBeInTheDocument();
        });
        // undo
        userEvent.click(screen.getByRole("button", { name: "UNDO" }));
        await waitFor(() => {
            expect(saveSpy).toHaveBeenCalledWith({
                ...task,
                timePickedUp: null,
            });
        });
    });

    test("mark a task delivered", async () => {
        const task = await DataStore.save(
            new models.Task({
                status: models.TaskStatus.PICKED_UP,
                timePickedUp: new Date().toISOString(),
            })
        );
        const fakeRider = await DataStore.save(
            new models.User({
                displayName: "Someone person",
                roles: [models.Role.USER, models.Role.RIDER],
            })
        );
        const fakeAssignment = await DataStore.save(
            new models.TaskAssignee({
                task,
                assignee: fakeRider,
                role: models.Role.RIDER,
            })
        );
        const preloadedState = {
            taskAssigneesReducer: {
                items: [fakeAssignment],
                ready: true,
                isSynced: true,
            },
        };
        const saveSpy = jest.spyOn(DataStore, "save");
        render(
            <TaskContextMenu task={task} assignedRiders={[fakeAssignment]} />,
            { preloadedState }
        );
        const button = screen.getByRole("button", { name: "task options" });
        userEvent.click(button);
        userEvent.click(
            screen.getByRole("menuitem", { name: "Mark delivered" })
        );
        await waitFor(() => {
            expect(saveSpy).toHaveBeenCalledWith({
                ...task,
                timeDroppedOff: isoDate,
                status: models.TaskStatus.DROPPED_OFF,
            });
        });
        await waitFor(() => {
            expect(
                screen.getByText("Task marked delivered")
            ).toBeInTheDocument();
        });
        // undo
        userEvent.click(screen.getByRole("button", { name: "UNDO" }));
        await waitFor(() => {
            expect(saveSpy).toHaveBeenCalledWith({
                ...task,
                timeDroppedOff: null,
            });
        });
    });
    test("mark a rider home", async () => {
        const task = await DataStore.save(
            new models.Task({
                status: models.TaskStatus.DROPPED_OFF,
                timePickedUp: new Date().toISOString(),
                timeDroppedOff: new Date().toISOString(),
            })
        );
        const fakeRider = await DataStore.save(
            new models.User({
                displayName: "Someone person",
                roles: [models.Role.USER, models.Role.RIDER],
            })
        );
        const fakeAssignment = await DataStore.save(
            new models.TaskAssignee({
                task,
                assignee: fakeRider,
                role: models.Role.RIDER,
            })
        );
        const preloadedState = {
            taskAssigneesReducer: {
                items: [fakeAssignment],
                ready: true,
                isSynced: true,
            },
        };
        const saveSpy = jest.spyOn(DataStore, "save");
        render(
            <TaskContextMenu task={task} assignedRiders={[fakeAssignment]} />,
            { preloadedState }
        );
        const button = screen.getByRole("button", { name: "task options" });
        userEvent.click(button);
        userEvent.click(
            screen.getByRole("menuitem", { name: "Mark rider home" })
        );
        await waitFor(() => {
            expect(saveSpy).toHaveBeenCalledWith({
                ...task,
                timeRiderHome: isoDate,
                status: models.TaskStatus.COMPLETED,
            });
        });
        await waitFor(() => {
            expect(
                screen.getByText("Task marked rider home")
            ).toBeInTheDocument();
        });
        // undo
        userEvent.click(screen.getByRole("button", { name: "UNDO" }));
        await waitFor(() => {
            expect(saveSpy).toHaveBeenCalledWith({
                ...task,
                timeRiderHome: null,
            });
        });
    });
    test("copy to clipboard", async () => {
        Object.assign(window.navigator, {
            clipboard: {
                writeText: jest
                    .fn()
                    .mockImplementation(() => Promise.resolve()),
            },
        });

        const timeOfCall = "2022-09-14T07:55:07.473Z";
        const pickUpLocation = await DataStore.save(
            new models.Location({
                line1: "line one",
                ward: "test ward",
                postcode: "postcode",
            })
        );
        const dropOffLocation = await DataStore.save(
            new models.Location({
                line1: "something",
                ward: "some ward",
                postcode: "some postcode",
            })
        );
        const mockTask = new models.Task({
            timeOfCall,
            status: models.TaskStatus.NEW,
            pickUpLocation,
            dropOffLocation,
            priority: models.Priority.HIGH,
        });
        await DataStore.save(mockTask);
        const mockDeliverableType = new models.DeliverableType({
            label: "test deliverable",
        });
        await DataStore.save(mockDeliverableType);
        const mockDeliverables = [
            {
                unit: models.DeliverableUnit.ITEM,
                count: 1,
                orderInGrid: 0,
                deliverableType: mockDeliverableType,
            },
            {
                unit: models.DeliverableUnit.ITEM,
                count: 2,
                orderInGrid: 0,
                deliverableType: mockDeliverableType,
            },
            {
                unit: models.DeliverableUnit.LITER,
                count: 3,
                orderInGrid: 0,
                deliverableType: mockDeliverableType,
            },
        ];
        await Promise.all(
            mockDeliverables.map((deliverable) =>
                DataStore.save(
                    new models.Deliverable({ task: mockTask, ...deliverable })
                )
            )
        );

        const copySpy = jest.spyOn(copyTaskDataToClipboard, "default");
        const clipboardSpy = jest.spyOn(navigator.clipboard, "writeText");
        render(<TaskContextMenu task={mockTask} assignedRiders={[]} />);
        const button = screen.getByRole("button", { name: "task options" });
        userEvent.click(button);
        userEvent.click(
            screen.getByRole("menuitem", { name: "Copy to clipboard" })
        );
        await waitFor(() => {
            expect(copySpy).toHaveBeenCalledWith(mockTask);
        });
        await waitFor(() => {
            expect(screen.getByText("Copied to clipboard")).toBeInTheDocument();
        });
        expect(clipboardSpy).toMatchSnapshot();
    });

    test.skip("duplicate a task", async () => {
        //TODO: check this
        const whoami = await DataStore.save(
            new models.User({
                displayName: "someone person",
                roles: [models.Role.USER, models.Role.COORDINATOR],
                tenantId,
            })
        );
        const mockLocation = await DataStore.save(
            new models.Location({
                name: "woop",
                listed: 1,
                tenantId,
            })
        );
        const mockLocation2 = await DataStore.save(
            new models.Location({
                name: "ohp",
                listed: 1,
                tenantId,
            })
        );
        const mockEstablishment = await DataStore.save(
            new models.Location({
                name: "something",
                listed: 1,
                tenantId,
            })
        );
        const task = await DataStore.save(
            new models.Task({
                status: models.TaskStatus.NEW,
                pickUpLocation: mockLocation,
                dropOffLocation: mockLocation2,
                establishmentLocation: mockEstablishment,
                tenantId,
            })
        );
        const mockTaskAssignee = new models.TaskAssignee({
            task,
            assignee: whoami,
            role: models.Role.COORDINATOR,
            tenantId,
        });
        const deliverableTypes = await Promise.all(
            ["test deliverable", "another one"].map((d) =>
                DataStore.save(new models.DeliverableType({ label: d }))
            )
        );
        const deliverables = await Promise.all(
            deliverableTypes.map((deliverableType) =>
                DataStore.save(
                    new models.Deliverable({
                        deliverableType,
                        count: 3,
                        unit: deliverableType.defaultUnit,
                        task,
                        tenantId,
                    })
                )
            )
        );
        const saveSpy = jest.spyOn(DataStore, "save");
        const preloadedState = {
            whoami: { user: whoami },
            roleView: models.Role.COORDINATOR,
            taskAssigneesReducer: {
                items: [mockTaskAssignee],
                ready: true,
                isSynced: true,
            },
            tenantId,
        };
        //render(<TaskContextMenu task={task} assignedRiders={[]} />, {
        //    preloadedState,
        //});
        render(
            <>
                <TaskContextMenu task={task} assignedRiders={[]} />
                <TasksGridColumn taskKey={models.TaskStatus.NEW} />
            </>,
            {
                preloadedState,
            }
        );

        await waitFor(() => {
            expect(
                screen.queryByTestId("fetching-tasks-grid-column")
            ).toBeNull();
        });
        mockAllIsIntersecting(true);
        const button = screen.getByRole("button", { name: "task options" });
        userEvent.click(button);
        userEvent.click(screen.getByRole("menuitem", { name: "Duplicate" }));
        await waitFor(() => {
            expect(saveSpy).toHaveBeenCalledTimes(4);
        });
        expect(saveSpy).toHaveBeenCalledWith({
            ...task,
            dateCreated: dateString,
            userCreatedTasksId: whoami.id,
            tenantId,
            id: expect.not.stringMatching(task.id),
        });
        deliverables.forEach((del) => {
            expect(saveSpy).toHaveBeenCalledWith({
                ...del,
                tenantId,
                id: expect.not.stringMatching(del.id),
                taskDeliverablesId: expect.not.stringMatching(task.id),
            });
        });
        expect(saveSpy).toHaveBeenCalledWith({
            ...mockTaskAssignee,
            tenantId,
            id: expect.any(String),
            taskAssigneesId: expect.not.stringMatching(task.id),
        });
        await screen.findByText("Task duplicated to NEW");
        mockAllIsIntersecting(true);
        await waitFor(() => {
            expect(screen.queryByTestId("task-item-skeleton")).toBeNull();
        });
        await waitFor(
            () => {
                expect(screen.queryAllByRole("link")).toHaveLength(2);
            },
            { timeout: 10000 }
        );
    });

    test("can't duplicate in rider role view", async () => {
        const whoami = await DataStore.save(
            new models.User({
                displayName: "someone person",
                roles: [models.Role.USER, models.Role.RIDER],
            })
        );
        const task = await DataStore.save(
            new models.Task({
                status: models.TaskStatus.ACTIVE,
                riderResponsibility: "something",
            })
        );
        const preloadedState = {
            whoami: { user: whoami },
            roleView: models.Role.RIDER,
        };
        render(<TaskContextMenu task={task} assignedRiders={[]} />, {
            preloadedState,
        });
        const button = screen.getByRole("button", { name: "task options" });
        userEvent.click(button);
        expect(
            screen.queryByRole("menuitem", { name: "Duplicate" })
        ).toBeNull();
    });

    test.skip("duplicate a task in rider role view", async () => {
        // at the moment riders can't duplicate tasks
        const whoami = await DataStore.save(
            new models.User({
                displayName: "someone person",
                roles: [models.Role.USER, models.Role.RIDER],
                tenantId,
            })
        );
        const task = await DataStore.save(
            new models.Task({
                status: models.TaskStatus.ACTIVE,
                riderResponsibility: "something",
            })
        );
        const mockTaskAssignee = new models.TaskAssignee({
            task,
            assignee: whoami,
            role: models.Role.RIDER,
            tenantId: whoami.tenantId,
        });
        const saveSpy = jest.spyOn(DataStore, "save");
        const preloadedState = {
            whoami: { user: whoami },
            roleView: models.Role.RIDER,
        };
        render(<TaskContextMenu task={task} assignedRiders={[]} />, {
            preloadedState,
        });
        const button = screen.getByRole("button", { name: "task options" });
        userEvent.click(button);
        userEvent.click(screen.getByRole("menuitem", { name: "Duplicate" }));
        await waitFor(() => {
            expect(saveSpy).toHaveBeenCalledTimes(2);
        });
        expect(saveSpy).toHaveBeenCalledWith({
            ...task,
            id: expect.not.stringMatching(task.id),
        });
        expect(saveSpy).toHaveBeenCalledWith({
            ...mockTaskAssignee,
            id: expect.any(String),
            task: {
                ...task,
                id: expect.any(String),
            },
        });
    });

    test("duplicate a task with unlisted locations", async () => {
        const whoami = await DataStore.save(
            new models.User({
                displayName: "someone person",
                roles: [models.Role.USER, models.Role.COORDINATOR],
                tenantId,
            })
        );
        const mockLocation = await DataStore.save(
            new models.Location({ name: "woop", listed: 0, tenantId })
        );
        const mockLocation2 = await DataStore.save(
            new models.Location({ name: "ohp", listed: 0, tenantId })
        );
        const mockEstablishment = await DataStore.save(
            new models.Location({ name: "something", listed: 0, tenantId })
        );
        const task = await DataStore.save(
            new models.Task({
                status: models.TaskStatus.NEW,
                pickUpLocation: mockLocation,
                dropOffLocation: mockLocation2,
                establishmentLocation: mockEstablishment,
                tenantId,
            })
        );
        const saveSpy = jest.spyOn(DataStore, "save");
        const preloadedState = {
            whoami: { user: whoami },
            tenantId,
        };
        render(<TaskContextMenu task={task} assignedRiders={[]} />, {
            preloadedState,
        });
        const button = screen.getByRole("button", { name: "task options" });
        userEvent.click(button);
        userEvent.click(screen.getByRole("menuitem", { name: "Duplicate" }));
        await waitFor(() => {
            expect(saveSpy).toHaveBeenCalledTimes(5);
        });
        expect(saveSpy).toHaveBeenCalledWith({
            ...mockLocation,
            id: expect.not.stringMatching(mockLocation.id),
            tenantId,
        });
        expect(saveSpy).toHaveBeenCalledWith({
            ...mockLocation2,
            id: expect.not.stringMatching(mockLocation2.id),
            tenantId,
        });
        expect(saveSpy).toHaveBeenCalledWith({
            ...mockEstablishment,
            id: expect.not.stringMatching(mockEstablishment.id),
            tenantId,
        });
    });

    test("duplicate a task failure", async () => {
        const task = await DataStore.save(
            new models.Task({
                status: models.TaskStatus.NEW,
            })
        );
        const whoami = await DataStore.save(
            new models.User({
                displayName: "someone person",
                roles: [models.Role.USER, models.Role.COORDINATOR],
                tenantId,
            })
        );
        const saveSpy = jest
            .spyOn(DataStore, "save")
            .mockRejectedValue(new Error());
        const preloadedState = {
            whoami: { user: whoami },
            tenantId,
        };
        render(<TaskContextMenu task={task} assignedRiders={[]} />, {
            preloadedState,
        });
        const button = screen.getByRole("button", { name: "task options" });
        userEvent.click(button);
        userEvent.click(screen.getByRole("menuitem", { name: "Duplicate" }));
        await waitFor(() => {
            expect(saveSpy).toHaveBeenCalledTimes(1);
        });
        await waitFor(() => {
            expect(
                screen.getByText("Sorry, something went wrong")
            ).toBeInTheDocument();
        });
    });

    test.each`
        taskStatus
        ${models.TaskStatus.COMPLETED} | ${models.TaskStatus.ABANDONED} | ${models.TaskStatus.REJECTED} | ${models.TaskStatus.CANCELLED}
    `("disable duplicate if completed", async ({ taskStatus }) => {
        const task = await DataStore.save(
            new models.Task({
                status: taskStatus,
            })
        );
        render(<TaskContextMenu task={task} assignedRiders={[]} />);
        const button = screen.getByRole("button", { name: "task options" });
        userEvent.click(button);
        expect(
            screen.getByRole("menuitem", { name: "Duplicate" })
        ).toHaveAttribute("aria-disabled", "true");
    });
});
