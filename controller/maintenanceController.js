const maintenance = require("../service/MaintenanceService");

/**
 * Creates a new maintenance request for a specific user and listing.
 * Accepts uploaded files as supporting documents and request details in the body.
 * Returns the created maintenance request as a JSON response.
 * @param {import('express').Request} req - Express request object, expects files, body data, 'userID' and 'listingID' params.
 * @param {import('express').Response} res - Express response object.
 */
exports.createMaintenanceRequest = async (req, res) => {
    const userID = req.params.userID;
    const listingID = req.params.listingID;
    console.log(`[createMaintenanceRequest] Entry: userID="${userID}", listingID="${listingID}"`);
    try {
        const files = req.files || [];

        if (!files.length) {
            console.log("[createMaintenanceRequest] No files uploaded");
        }

        const documentURLs = files.map(file => file.path);
        const data = { ...req.body, documentsURL: documentURLs };

        const maintenanceRequest = await maintenance.createMaintenanceRequest(userID, listingID, data);
        console.log(`[createMaintenanceRequest] Exit: Maintenance request created for userID="${userID}", listingID="${listingID}"`);
        res.status(201).json(maintenanceRequest);
    } catch (error) {
        console.error(`[createMaintenanceRequest] Error: ${error.message}`);
        res.status(400).json({ error: error.message });
    }
};

/**
 * Retrieves all maintenance requests for a specific user.
 * Returns the requests as a JSON response.
 * @param {import('express').Request} req - Express request object, expects 'userID' param.
 * @param {import('express').Response} res - Express response object.
 */
exports.getMaintenanceRequestForUserId = async (req, res) => {
    const userID = req.params.userID;
    console.log(`[getMaintenanceRequestForUserId] Entry: userID="${userID}"`);
    try {
        const result = await maintenance.getMaintenanceRequestForUserId(userID);
        console.log(`[getMaintenanceRequestForUserId] Exit: Found ${result.length} maintenance requests for userID="${userID}"`);
        res.status(200).json(result);
    } catch (error) {
        console.error(`[getMaintenanceRequestForUserId] Error: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};