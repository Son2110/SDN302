import apiClient from "./api";

// Get Driver Assignments
export const getMyAssignments = async (status) => {
    let endpoint = "/driver-assignment/my-assignments";
    if (status) {
        endpoint += `?status=${status}`;
    }
    return await apiClient(endpoint);
};

// Accept / Reject Assignment
export const respondToAssignment = async (id, responseData) => {
    return await apiClient(`/driver-assignment/${id}/respond`, {
        method: "PUT",
        body: JSON.stringify(responseData),
    });
};

// Get Single Assignment Detail
export const getAssignmentDetail = async (id) => {
    return await apiClient(`/driver-assignment/${id}`);
};
