const maintenance = require("../service/MaintenanceService");

exports.createMaintenanceRequest = async (req, res) => {
    try {
        const files = req.files || [];
        const id = req.params.id; // Get listing ID from URL parameters
    
        if (!files.length) {
          console.log("No files uploaded");
        }
    
        const documentURLs = files.map(file => file.path);
        const data = { ...req.body, documentURL: documentURLs };
    
        const maintenanceRequest = await maintenance.createMaintenanceRequest(id, data);
        res.status(201).json(newMaintenanceRequest);
      } catch (error) {
        console.error(error);
        res.status(400).json({ error: error.message });
      }
};