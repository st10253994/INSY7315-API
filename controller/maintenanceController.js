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
        res.status(201).json(maintenanceRequest);
      } catch (error) {
        console.error(error);
        res.status(400).json({ error: error.message });
      }
};

exports.getMaitenanceRequestForUserId = async (req, res) => {
  try {
          const result = await maintenance.getMaitenanceRequestForUserId(req.params.userId);
          res.status(200).json(result);
      } catch (error) {
          res.status(500).json({ error: error.message });
      }
}